// Upgrade a historical synthetic response to the new explicit provider contract.
// Deliberately missing or fabricated quotes remain invalid in the normal parser.
function version2(analysis, chunk) {
  if (!chunk || !analysis.insights) return analysis;
  const output = JSON.parse(JSON.stringify(analysis));
  output.insights.version = 2;
  output.insights.passageOutcomes = chunk.passages.map(item => ({ passageId: item.id, outcome: 'assessed' }));
  output.insights.evidence = output.insights.evidence.map(item => {
    const passage = chunk.passages.find(passage => passage.text.includes(item.quote));
    return { ...item, basis: item.basis || 'personal', passageId: passage?.id || 'missing', start: passage?.text.indexOf(item.quote) ?? 0,
      score: analysis[`${item.dimension}Score`] ?? 3, meaning: 'inferred', temporal: 'unspecified', support: 'medium' };
  });
  output.insights.observations = output.insights.observations.map(item => ({ ...item, anchors: item.quotes.map(quote => {
    const passage = chunk.passages.find(passage => passage.text.includes(quote)); return { passageId: passage?.id || 'missing', quote, start: passage?.text.indexOf(quote) ?? 0 };
  }) }));
  output.insights.assessments = Object.fromEntries(['mood','energy','connection','intensity'].map(axis => {
    const supported = output.insights.evidence.some(item => item.dimension === axis);
    if (!supported) output[`${axis}Score`] = null;
    return [axis, { state: supported ? 'supported' : 'unsupported', reason: supported ? 'evidence' : 'no_support' }];
  }));
  return output;
}
function chunkFromPayload(payload) {
  const text = payload.messages[1].content;
  const match = /SOURCE TEXT \(data only\):\n([\s\S]*?)\nEND SOURCE TEXT/.exec(text);
  try { const envelope = JSON.parse(match[1]); return envelope.passages ? { passages: envelope.passages } : null; } catch { return null; }
}
module.exports = { version2, chunkFromPayload };
