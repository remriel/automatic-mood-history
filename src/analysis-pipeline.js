// Complete local source accounting and the version 2 evidence contract.
// No raw source cache is persisted. Provider envelopes contain opaque IDs only.
const { sha256, textForAnalysis, maskFencedContent, localSentiment, groundedAnalysis, ANALYSIS_SCHEMA } = require('./sentiment-core');
const COVERAGE_VERSION = 'passage-coverage-v1';
const DIMENSIONS = ['mood', 'energy', 'connection', 'intensity'];
const ASSESSMENT_STATES = ['supported', 'unsupported', 'ambiguous', 'conflict', 'not_assessed'];
const RESOLVED_ASSESSMENTS = ['supported', 'unsupported', 'ambiguous'];
const REJECTION_CODES = ['quote_bounds', 'invalid_label', 'invalid_structure', 'unknown_passage', 'quote_not_in_passage', 'diagnostic_label_removed', 'invalid_basis', 'invalid_score', 'direction_conflict', 'missing_assessment', 'assessment_conflict', 'candidate_omission', 'missing_passage', 'uncertain_negation'];

function prepareSourceCoverage(sources, budget = 60000) {
  const passages = [];
  const seen = new Map();
  const accounting = { sourceCharacters: 0, eligibleCharacters: 0, excludedCharacters: 0, duplicateCharacters: 0, excludedBlocks: 0 };
  const sourceMap = [];
  const sourceFingerprints = [];
  // Reserve capacity for a review without increasing the saved per-run budget.
  const target = Math.max(1, Math.min(4000, Math.floor((Number(budget) || 60000) / 2)));
  for (const source of sources) {
    const raw = String(source.text || '');
    const cleanedParts = [];
    accounting.sourceCharacters += raw.length;
    // Fences stay together during cleaning, including blank lines inside code.
    const blocks = maskFencedContent(raw).matchAll(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)|(?:[^\n]|\n(?![ \t]*\r?\n))+(?:\n[ \t]*\r?\n|$)/gm);
    for (const match of blocks) {
      const cleaned = textForAnalysis(match[0]);
      cleanedParts.push(cleaned);
      if (!cleaned) { accounting.excludedBlocks++; accounting.excludedCharacters += match[0].length; continue; }
      accounting.excludedCharacters += Math.max(0, match[0].length - cleaned.length);
      const duplicateKey = cleaned.toLowerCase();
      const mapping = { path: source.path, rawStart: match.index, rawEnd: match.index + match[0].length, cleanedCharacters: cleaned.length };
      if (seen.has(duplicateKey)) {
        accounting.duplicateCharacters += cleaned.length;
        sourceMap.push({ ...mapping, duplicateOf: seen.get(duplicateKey) });
        continue;
      }
      const firstId = `p${passages.length + 1}`;
      seen.set(duplicateKey, firstId);
      let offset = 0;
      while (offset < cleaned.length) {
        let end = Math.min(cleaned.length, offset + target);
        if (end < cleaned.length) {
          const candidate = cleaned.slice(offset, end);
          const boundaries = [...candidate.matchAll(/[.!?。！？](?:\s|$)|\s+/g)];
          const preferred = boundaries.filter(item => /[.!?。！？]/.test(item[0])).at(-1) || boundaries.at(-1);
          if (preferred && preferred.index > target / 2) end = offset + preferred.index + preferred[0].length;
          // Do not split UTF-16 surrogate pairs even in unbroken passages.
          if (end > offset && /[\uD800-\uDBFF]/.test(cleaned[end - 1])) end--;
        }
        if (end <= offset) end = Math.min(cleaned.length, offset + 2);
        const text = cleaned.slice(offset, end);
        const passage = { id: `p${passages.length + 1}`, text, sourceStart: offset, sourceEnd: end, ...mapping };
        passages.push(passage);
        sourceMap.push({ ...mapping, passageId: passage.id, cleanedStart: offset, cleanedEnd: end });
        accounting.eligibleCharacters += text.length;
        offset = end;
      }
    }
    sourceFingerprints.push({ path: source.path, hash: sha256(cleanedParts.join('\n\n')) });
  }
  let globalOffset = 0;
  for (const passage of passages) { passage.start = globalOffset; passage.end = globalOffset + passage.text.length; globalOffset = passage.end + 2; }
  const chunks = [];
  let group = [];
  let length = 0;
  const finish = () => {
    if (!group.length) return;
    const text = group.map(item => item.text).join('\n\n');
    // Neighbor context is separately labeled and never eligible as new evidence.
    const first = passages.indexOf(group[0]);
    const last = first + group.length - 1;
    const room = Math.max(0, target - text.length);
    const contextLimit = Math.min(120, Math.floor(room / 2));
    const context = [first > 0 ? { id: passages[first - 1].id, text: passages[first - 1].text.slice(-contextLimit) } : null,
      last + 1 < passages.length ? { id: passages[last + 1].id, text: passages[last + 1].text.slice(0, contextLimit) } : null].filter(item => item?.text);
    chunks.push({ id: sha256(JSON.stringify({ version: COVERAGE_VERSION, passages: group.map(item => [item.id, item.text]), context })),
      passages: group, context, text, characters: group.reduce((sum, item) => sum + item.text.length, 0),
      requestCharacters: text.length + context.reduce((sum, item) => sum + item.text.length, 0) });
    group = []; length = 0;
  };
  for (const passage of passages) {
    if (group.length && (length + 2 + passage.text.length > target || group.length >= 32)) finish();
    group.push(passage); length += passage.text.length + (group.length > 1 ? 2 : 0);
  }
  finish();
  const analysisText = passages.map(item => item.text).join('\n\n');
  return { passages, chunks, sourceMap, accounting, analysisText,
    contentHash: sha256(JSON.stringify({ version: COVERAGE_VERSION, sources: sourceFingerprints, sourceMap })) };
}

function providerEnvelope(chunk) {
  return JSON.stringify({ passages: chunk.passages.map(({ id, text }) => ({ id, text })),
    contextOnly: (chunk.context || []).map(({ id, text }) => ({ id, text })) });
}

function coverageSchema() {
  const schema = JSON.parse(JSON.stringify(ANALYSIS_SCHEMA));
  const insight = schema.properties.insights;
  insight.properties.version.enum = [2];
  const assessment = { type: 'object', additionalProperties: false,
    properties: { state: { type: 'string', enum: ['supported', 'unsupported', 'ambiguous'] }, reason: { type: 'string', enum: ['evidence', 'no_support', 'uncertain_context'] } }, required: ['state', 'reason'] };
  insight.properties.assessments = { type: 'object', additionalProperties: false,
    properties: Object.fromEntries(DIMENSIONS.map(axis => [axis, assessment])), required: DIMENSIONS };
  insight.required.push('assessments');
  insight.properties.passageOutcomes = { type: 'array', maxItems: 32, items: { type: 'object', additionalProperties: false,
    properties: { passageId: { type: 'string', maxLength: 32 }, outcome: { type: 'string', enum: ['assessed'] } }, required: ['passageId', 'outcome'] } };
  insight.required.push('passageOutcomes');
  const item = insight.properties.evidence.items;
  Object.assign(item.properties, { passageId: { type: 'string', maxLength: 32 }, start: { type: 'integer', minimum: 0 },
    score: { type: 'integer', minimum: 1, maximum: 5 }, meaning: { type: 'string', enum: ['explicit', 'inferred'] },
    temporal: { type: 'string', enum: ['present', 'earlier', 'later', 'unspecified'] }, support: { type: 'string', enum: ['low', 'medium', 'high'] } });
  item.required.push('passageId', 'start', 'score', 'meaning', 'temporal', 'support');
  const observation = insight.properties.observations.items;
  observation.properties.anchors = { type: 'array', minItems: 1, maxItems: 3, items: { type: 'object', additionalProperties: false,
    properties: { passageId: { type: 'string', maxLength: 32 }, quote: { type: 'string', minLength: 1, maxLength: 240 }, start: { type: 'integer', minimum: 0 } }, required: ['passageId', 'quote', 'start'] } };
  observation.required.push('anchors');
  return schema;
}

function chunkAssessments(analysis, chunk, options = {}) {
  const raw = analysis.insights;
  if (!raw || raw.version !== 2 || !raw.assessments) {
    const error = new Error('Explicit dimension assessments are required.'); error.code = 'missing_assessment'; error.status = 422; throw error;
  }
  const diagnostics = [];
  const byAxis = Object.fromEntries(DIMENSIONS.map(axis => [axis, []]));
  const passages = new Map(chunk.passages.map(item => [item.id, item]));
  const evidence = [];
  const addCode = (axis, code) => { if (!byAxis[axis].includes(code)) byAxis[axis].push(code); if (!diagnostics.some(item => item.axis === axis && item.code === code)) diagnostics.push({ axis, code }); };
  const outcomes = Array.isArray(raw.passageOutcomes) ? raw.passageOutcomes : [];
  if (outcomes.length !== chunk.passages.length || chunk.passages.some(passage => outcomes.filter(item => item?.passageId === passage.id && item.outcome === 'assessed').length !== 1) || outcomes.some(item => !passages.has(item?.passageId))) {
    for (const axis of DIMENSIONS) addCode(axis, 'missing_passage');
  }
  let textOffset = 0;
  const offsets = new Map();
  for (const passage of chunk.passages) { offsets.set(passage.id, textOffset); textOffset += passage.text.length + 2; }
  for (const sourceItem of raw.evidence || []) {
    let item = sourceItem;
    if (!item || !DIMENSIONS.includes(item.dimension)) { for (const axis of DIMENSIONS) addCode(axis, 'invalid_structure'); continue; }
    const axis = item.dimension;
    const passage = passages.get(item.passageId);
    let start = item.start;
    // Models can count Unicode offsets differently. A unique exact quotation
    // inside the specified passage is a safe deterministic offset repair.
    if (typeof item.quote !== 'string' || !item.quote || item.quote.length > 240) { addCode(axis, 'quote_bounds'); continue; }
    if (typeof item.emotion !== 'string' || item.emotion.length > 48) { addCode(axis, 'invalid_label'); continue; }
    if (!['positive', 'negative', 'mixed', 'neutral'].includes(item.direction) || !['low', 'medium', 'high'].includes(item.confidence)) { addCode(axis, 'invalid_structure'); continue; }
    if (/\b(?:diagnos\w*|disorder|syndrome|ptsd|ocd|adhd|bipolar|narcissis\w*|psychopath\w*|sociopath\w*|attachment|manic)\b/i.test(item.emotion)) {
      if (axis === 'intensity' && item.basis === 'textual') {
        // A clinical label is not needed to retain grounded textual intensity.
        // Remove that label rather than inventing a replacement diagnosis/state.
        item = { ...item, emotion: '', confidence: 'low', support: 'low' };
        if (!diagnostics.some(value => value.axis === axis && value.code === 'diagnostic_label_removed')) diagnostics.push({ axis, code: 'diagnostic_label_removed' });
      } else { addCode(axis, 'invalid_label'); continue; }
    }
    if (passage && passage.text.slice(start, start + item.quote.length) !== item.quote) {
      const first = passage.text.indexOf(item.quote);
      if (first >= 0 && passage.text.indexOf(item.quote, first + 1) < 0) start = first;
    }
    if (!passage) { addCode(axis, 'unknown_passage'); continue; }
    if (!Number.isInteger(start) || start < 0 || passage.text.slice(start, start + item.quote.length) !== item.quote) { addCode(axis, 'quote_not_in_passage'); continue; }
    if (!['personal', 'textual'].includes(item.basis) || item.basis === 'textual' && axis !== 'intensity') { addCode(axis, 'invalid_basis'); continue; }
    if (!Number.isInteger(item.score) || item.score < 1 || item.score > 5 || !['explicit', 'inferred'].includes(item.meaning) ||
      !['present', 'earlier', 'later', 'unspecified'].includes(item.temporal) || !['low', 'medium', 'high'].includes(item.support)) { addCode(axis, 'invalid_score'); continue; }
    if (axis !== 'intensity' && (item.direction === 'positive' && item.score < 3 || item.direction === 'negative' && item.score > 3)) { addCode(axis, 'direction_conflict'); continue; }
    evidence.push({ ...item, passageStart: start, start: offsets.get(item.passageId) + start,
      end: offsets.get(item.passageId) + start + item.quote.length, support: item.support === 'high' ? 'medium' : item.support });
  }
  const assessments = {};
  const localCandidateAxes = !options.reviewed ? new Set(localSentiment(chunk.text).insights.evidence.map(item => item.dimension)) : new Set();
  for (const axis of DIMENSIONS) {
    const claim = raw.assessments[axis];
    const items = evidence.filter(item => item.dimension === axis);
    const score = analysis[`${axis}Score`];
    if (!claim || !ASSESSMENT_STATES.includes(claim.state)) addCode(axis, 'missing_assessment');
    else if (claim.state === 'supported' && (!items.length || !Number.isInteger(score)) || claim.state !== 'supported' && (items.length || score !== null)) addCode(axis, 'assessment_conflict');
    if (axis !== 'intensity' && items.length && Number.isFinite(score) &&
      (items.every(item => item.direction === 'positive') && score < 3 || items.every(item => item.direction === 'negative') && score > 3)) addCode(axis, 'direction_conflict');
    // A local cue can ask for review, never reject grounded remote inference.
    if (claim?.state === 'unsupported' && localCandidateAxes.has(axis)) addCode(axis, 'candidate_omission');
    if (!options.reviewed && items.some(item => item.basis === 'personal' && /\b(?:do not|don't|did not|didn't|never|no longer|not)\s+(?:really\s+)?feel\b|\bno me siento\b|\bne me sens pas\b/i.test(item.quote))) addCode(axis, 'uncertain_negation');
    assessments[axis] = { state: byAxis[axis].length ? 'conflict' : claim?.state || 'not_assessed',
      reason: byAxis[axis][0] || (claim?.state === 'supported' ? 'evidence' : claim?.state === 'ambiguous' ? 'uncertain_context' : 'no_support') };
  }
  const observations = [];
  for (const item of raw.observations || []) {
    if (!item || !Array.isArray(item.anchors) || item.anchors.length !== item.quotes?.length || item.anchors.length > 3) continue;
    if (item.anchors.some((anchor, index) => !passages.has(anchor.passageId) || anchor.quote !== item.quotes[index] ||
      passages.get(anchor.passageId).text.slice(anchor.start, anchor.start + anchor.quote.length) !== anchor.quote)) continue;
    observations.push(item);
  }
  const output = groundedAnalysis({ ...analysis, insights: { ...raw, evidence, observations, assessments,
    passageOutcomes: outcomes.filter(item => passages.has(item?.passageId)).map(item => ({ passageId: item.passageId, outcome: item.outcome === 'assessed' ? 'assessed' : 'unresolved' })) } }, chunk.text, { checkAttribution: true });
  output.insights.assessments = assessments;
  for (const axis of DIMENSIONS) if (assessments[axis].state !== 'supported') output[`${axis}Score`] = null;
  output.validation = diagnostics.slice(0, 8);
  output.reviewDimensions = DIMENSIONS.filter(axis => ['conflict', 'not_assessed'].includes(assessments[axis].state));
  return output;
}

function localChunkAnalysis(chunk, topic = '') {
  // Local rules inspect the entire prepared chunk. This remains a deliberately
  // conservative English-only path, not parity with contextual provider review.
  const result = localSentiment(chunk.text, topic);
  let offset = 0;
  const offsets = chunk.passages.map(passage => { const item = { passage, start: offset }; offset += passage.text.length + 2; return item; });
  const evidence = result.insights.evidence.map(item => {
    const found = offsets.find(({ passage, start }) => item.start >= start && item.end <= start + passage.text.length);
    return found ? { ...item, basis: 'personal', passageId: found.passage.id, passageStart: item.start - found.start,
      score: result[`${item.dimension}Score`], meaning: 'explicit', temporal: 'unspecified', support: 'low' } : null;
  }).filter(Boolean);
  return { ...result, insights: { ...result.insights, version: 2, evidence,
    passageOutcomes: chunk.passages.map(passage => ({ passageId: passage.id, outcome: 'assessed' })),
    assessments: Object.fromEntries(DIMENSIONS.map(axis => [axis, { state: evidence.some(item => item.dimension === axis) ? 'supported' : 'unsupported', reason: evidence.some(item => item.dimension === axis) ? 'evidence' : 'no_support' }])) } };
}

function selectEvidenceForDisplay(evidence, maximum = 16) {
  const selected = [];
  const add = item => { if (item && !selected.includes(item) && selected.length < maximum) selected.push(item); };
  for (const axis of DIMENSIONS) for (const direction of ['positive', 'negative', 'mixed', 'neutral']) add(evidence.find(item => item.dimension === axis && item.direction === direction));
  for (const temporal of ['earlier', 'later', 'present']) for (const axis of DIMENSIONS) add(evidence.find(item => item.dimension === axis && item.temporal === temporal));
  for (const item of evidence) add(item);
  return selected;
}

function aggregateChunkAnalyses(chunks, topic = '') {
  const evidence = [];
  const seen = new Set();
  const observations = [];
  for (const { chunk, analysis } of chunks) {
    for (const item of analysis.insights.evidence) {
      const passage = chunk.passages.find(passage => passage.id === item.passageId);
      const key = JSON.stringify([item.dimension, item.basis || 'personal', item.quote.toLowerCase(), item.direction, item.temporal]);
      if (!passage || seen.has(key)) continue;
      seen.add(key);
      evidence.push({ ...item, start: passage.start + item.passageStart, end: passage.start + item.passageStart + item.quote.length });
    }
    for (const item of analysis.insights.observations) if (!observations.some(prior => prior.kind === item.kind && JSON.stringify(prior.quotes) === JSON.stringify(item.quotes))) observations.push(item);
  }
  const scores = {};
  const assessments = {};
  const support = {};
  const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
  const median = values => { const sorted = [...values].sort((a, b) => a - b); return (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2; };
  for (const axis of DIMENSIONS) {
    const items = evidence.filter(item => item.dimension === axis);
    const states = chunks.map(({ analysis }) => analysis.insights.assessments[axis].state);
    const state = states.includes('conflict') ? 'conflict' : states.includes('not_assessed') ? 'not_assessed' : items.length ? 'supported' : states.includes('ambiguous') ? 'ambiguous' : 'unsupported';
    assessments[axis] = { state, reason: state === 'supported' ? 'evidence' : state === 'unsupported' ? 'no_support' : state === 'ambiguous' ? 'uncertain_context' : 'validation_conflict' };
    // Each distinct concept/pole/time/basis contributes once, independently of
    // how many chunks, copies or quotations happen to express it.
    const concepts = new Map();
    for (const item of items) {
      const key = JSON.stringify([item.emotion, item.direction, item.temporal, item.basis || 'personal']);
      if (!concepts.has(key)) concepts.set(key, []);
      concepts.get(key).push(item.score);
    }
    const grouped = [...concepts].map(([key, values]) => ({ direction: JSON.parse(key)[1], score: median(values) }));
    const positive = grouped.filter(item => item.direction === 'positive').map(item => item.score);
    const negative = grouped.filter(item => item.direction === 'negative').map(item => item.score);
    const mixed = positive.length && negative.length;
    scores[`${axis}Score`] = state !== 'supported' ? null : Math.max(1, Math.min(5, Math.round(mixed && axis !== 'intensity' ?
      (mean(positive) + mean(negative)) / 2 : mean(grouped.map(item => item.score)))));
    support[axis] = { positive: items.filter(item => item.direction === 'positive').length, negative: items.filter(item => item.direction === 'negative').length,
      mixed: items.filter(item => item.direction === 'mixed').length, neutral: items.filter(item => item.direction === 'neutral').length, concepts: grouped.length };
  }
  if (support.mood.positive && support.mood.negative && !observations.some(item => item.kind === 'ambivalence')) observations.push({ kind: 'ambivalence',
    description: 'Opposing feelings are retained; file order does not establish chronology.', confidence: 'low',
    quotes: [evidence.find(item => item.dimension === 'mood' && item.direction === 'positive').quote, evidence.find(item => item.dimension === 'mood' && item.direction === 'negative').quote] });
  const displayed = selectEvidenceForDisplay(evidence);
  const result = groundedAnalysis({ ...scores, valence: scores.moodScore === null ? 'unknown' : support.mood.positive && support.mood.negative ? 'mixed' :
    ['', 'very_negative', 'negative', 'mixed', 'positive', 'very_positive'][scores.moodScore], emotions: [], summary: topic || 'Assessment completed across eligible passages.', drivers: [], confidence: 'low',
    insights: { version: 2, evidence: displayed, observations: observations.slice(0, 8), assessments, support,
      limitations: ['Scores summarize supported expressions, not psychological truth.', 'Displayed quotations are a bounded selection; aggregation uses every validated interpretation.'] } });
  result.insights.assessments = assessments; result.insights.support = support;
  result.confidence = 'low';
  if (evidence.length && !topic) result.summary = `Expressed states include ${result.emotions.join(', ') || 'the cited signals'}. ${support.mood.positive && support.mood.negative ? 'Opposing feelings are retained. ' : ''}Scores use all validated interpretations; quotations show selected context.`;
  result.confidenceReason = 'Ordinal textual interpretations with uncertainty; local rules and provider judgments have limited semantic coverage.';
  if (topic) result.summary = topic;
  return result;
}

function sourceCoverage(work, prepared) {
  const complete = prepared.chunks.filter(chunk => work.chunks[chunk.id]?.state === 'complete');
  const processedCharacters = complete.reduce((sum, chunk) => sum + chunk.characters, 0);
  return { version: 1, totalPassages: prepared.passages.length, totalChunks: prepared.chunks.length, processedChunks: complete.length,
    eligibleCharacters: prepared.accounting.eligibleCharacters, processedCharacters,
    pendingCharacters: prepared.accounting.eligibleCharacters - processedCharacters,
    excludedCharacters: prepared.accounting.excludedCharacters, duplicateCharacters: prepared.accounting.duplicateCharacters,
    excludedBlocks: prepared.accounting.excludedBlocks };
}

function assessmentLabel(record, axis) {
  const state = record.insights?.assessments?.[axis]?.state;
  return ({ supported: 'Supported interpretation', unsupported: 'Assessed without support', ambiguous: 'Ambiguous interpretation', conflict: 'Unresolved validation conflict', not_assessed: 'Not yet assessed' })[state] || 'Assessment coverage unknown';
}

module.exports = { COVERAGE_VERSION, DIMENSIONS, ASSESSMENT_STATES, RESOLVED_ASSESSMENTS, REJECTION_CODES, prepareSourceCoverage, providerEnvelope, coverageSchema, chunkAssessments, localChunkAnalysis, selectEvidenceForDisplay, aggregateChunkAnalyses, sourceCoverage, assessmentLabel };
