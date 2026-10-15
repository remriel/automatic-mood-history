// Context-first English journal analysis. Fixed rules are intentionally bounded;
// an absent signal is unknown, never evidence for the middle of a scale.
const AXES = ["mood", "energy", "connection", "intensity"];
const OBSERVATION_KINDS = ["change", "ambivalence", "contradiction", "coexistence", "sarcasm", "pattern", "need", "trigger"];
const ENGINE_VERSION = "contextual-evidence-v2";
const OBSERVATION_DESCRIPTIONS = {
  ambivalence: "Positive and painful feelings coexist in the quoted evidence; neither side cancels the other.",
  contradiction: "The quoted claims appear in tension. Their relationship is unresolved, not proof of dishonesty or a hidden feeling.",
  coexistence: "Different states coexist in this dimension. A middle score does not mean the experience was uniform or neutral.",
  sarcasm: "Possible sarcasm makes a literal reading uncertain; no opposite emotion is assumed.",
  need: "The writer explicitly states a want or need here; no hidden motive is inferred.",
  trigger: "The writer places this situation and feeling in a temporal or stated causal relationship; causation is not independently established.",
  pattern: "The writer explicitly describes recurrence; this is not evidence for a diagnosis or a stable personality trait.",
  change: "The quotes describe different emotional moments; a day's score retains the range rather than replacing an earlier state."
};
const boundedText = (value, length) => typeof value === "string" ? value.trim().slice(0, length) : "";
const certainty = value => ["low", "medium", "high"].includes(value) ? value : "low";
const capCertainty = value => value === "high" ? "medium" : certainty(value);

// A rule represents a concept, not a bag of words. One concept contributes at
// most once per clause; repeating the same clause does not strengthen a score.
const AFFECT_RULES = [
  ["pleased", /\b(?:couldn't be happier|could not be happier|couldn't stop smiling|could not stop smiling|happy|glad|pleased|delighted|joyful|joy|cheerful)\b/gi, 1, 0, 0, 2],
  ["excited", /\b(?:excited|thrilled|elated|ecstatic|overjoyed)\b/gi, 1.5, 1, 0, 4],
  ["hopeful", /\b(?:hopeful|optimistic|encouraged|renewed hope)\b/gi, 1, 0, 0, 2],
  ["peaceful", /\b(?:calm|peaceful|relaxed|at ease|serene|tranquil)\b/gi, 1, 0, 0, 1],
  ["content", /\b(?:content|satisfied|fulfilled)\b/gi, 1, 0, 0, 1],
  ["proud", /\b(?:proud|accomplished)\b/gi, 1, 0, 0, 2],
  ["grateful", /\b(?:grateful|thankful)\b/gi, 1, 0, 0, 2],
  ["relieved", /\b(?:relieved|relief|weight lifted)\b/gi, 1, 0, 0, 2],
  ["loving", /\b(?:love|loving|affectionate|cherish)\b/gi, 1, 0, 0, 2],
  ["sad", /\b(?:couldn't stop crying|could not stop crying|held back tears|sad|sadness|unhappy|sorrowful|sorrow|grief|grieving|heartbroken|wept|crying|cried|miserable|melancholy)\b/gi, -1.5, 0, 0, 3],
  ["hopeless", /\b(?:hopeless|despair|despairing|devastated|wretched)\b/gi, -2, 0, 0, 4],
  ["depressed", /\bdepressed\b/gi, -1.5, 0, 0, 3],
  ["anxious", /\b(?:anxious|anxiety|worried|worrying|nervous|uneasy|dread|dreading|afraid|scared)\b/gi, -1, 0, 0, 3],
  ["panicked", /\b(?:panicking|panicked|terrified|petrified)\b/gi, -2, 0, 0, 5],
  ["angry", /\b(?:angry|mad|furious|enraged|livid|resent|resentful)\b/gi, -1.5, 0, 0, 4],
  ["frustrated", /\b(?:frustrated|irritated|annoyed|fed up)\b/gi, -1, 0, 0, 3],
  ["disappointed", /\b(?:disappointed|let down|disheartened)\b/gi, -1, 0, 0, 2],
  ["hurt", /\b(?:hurt|rejected|unwanted|unseen|unheard|ignored|abandoned)\b/gi, -1, 0, -1, 3],
  ["guilty", /\b(?:guilty|guilt|my fault)\b/gi, -1, 0, 0, 3],
  ["ashamed", /\b(?:ashamed|embarrassed|humiliated)\b/gi, -1, 0, 0, 3],
  ["overwhelmed", /\b(?:overwhelmed|stressed|under pressure)\b/gi, -1, 0, 0, 4],
  ["lonely", /\b(?:lonely|isolated|disconnected|cut off|left out|nobody cares|no one cares)\b/gi, -1, 0, -1.5, 3],
  ["supported", /\b(?:feel heard|felt heard|feel seen|felt seen|supported|connected|close to|understood|accepted|included|safe with|listened to|belong)\b/gi, 0, 0, 1.5, 2],
  ["exhausted", /\b(?:running on empty|nothing left to give|exhausted|drained|depleted|worn out|burned out|burnt out|no energy|cannot get out of bed|can't get out of bed)\b/gi, 0, -2, 0, 2],
  ["tired", /\b(?:tired|sleepy|fatigued|sluggish|lethargic)\b/gi, 0, -1, 0, 1],
  ["energized", /\b(?:energized|energised|energetic|rested|refreshed|full of energy|energy to spare)\b/gi, 0, 1.5, 0, 2],
  ["activated", /\b(?:restless|agitated|wired|jittery|heart (?:is |was )?racing|can't sit still|cannot sit still)\b/gi, 0, 1, 0, 4],
  ["numb", /\b(?:numb|emotionally flat|feel nothing|felt nothing|emotionless)\b/gi, 0, 0, 0, 1],
  ["curious", /\b(?:curious|intrigued|fascinated)\b/gi, 0.5, 0, 0, 2],
  ["confused", /\b(?:confused|torn|ambivalent|conflicted)\b/gi, 0, 0, 0, 2]
];
// All rule internals use noncapturing groups, so one capture selects a concept.
// Scan each clause once instead of rescanning it once for every emotion.
const AFFECT_PATTERN = new RegExp(AFFECT_RULES.map(rule => `(${rule[1].source})`).join("|"), "gi");

function maskQuotations(text) {
  return text.replace(/"[^"\n]*"|“[^”\n]*”|‘[^’\n]*’|(?<!\w)'[^'\n]+'(?!\w)/g, match => " ".repeat(match.length));
}

function negatedSignal(prefix) {
  // Negation applies to the local predicate, not an entire sentence. Litotes
  // remove the literal feeling; they do not invent its opposite.
  const scope = prefix.slice(-90).replace(/\bnot (?:only|just)\b/gi, "");
  return /\b(?:not|never|no longer|hardly|barely|without|don't|doesn't|didn't|isn't|wasn't|aren't|weren't|can't|cannot)\b(?:\s+[\w’'-]+){0,4}\s*$/i.test(scope);
}

function personalAt(clause, index, inherited = false, signalLength = 0) {
  const prefix = clause.slice(Math.max(0, index - 240), index).toLowerCase();
  const tail = clause.slice(index);
  // Common direct self-reports need no pronoun-resolution pass. Negation is
  // checked separately by callers; hedges are calibrated when signals are made.
  if (/^\s*(?:(?:today|tonight|now|earlier|finally)\s+)?(?:(?:i|we)\s+(?:am|are|was|were|feel|felt)|i'm|we're)\s+(?:(?:really|still|also|so|very|slightly|somewhat|absolutely|utterly|extremely|a little|a bit)\s+)*$/i.test(prefix)) return true;
  const selfPredicate = /\b(?:(?:i|we)\s+(?:am|are|was|were|feel|felt|became|become)|i'm|we're)\b/g;
  const predicateIndex = [...prefix.matchAll(selfPredicate)].at(-1)?.index ?? -1;
  const cognitiveIndex = [...prefix.matchAll(/\b(?:study|studying|read|reading|writing|wrote|discuss|discussing|define|defining|think|believe|argue|explain|work on|paper on|essay on|feel that)\b/g)].at(-1)?.index ?? -1;
  if (cognitiveIndex >= 0 && predicateIndex <= cognitiveIndex) return false;
  // A positive word can be the object of an argument rather than a feeling.
  if (/\b(?:i|we)\s+(?:am |was |have been )?(?:writing|wrote|read|reading|study|studying|discuss|discussing|define|defining|analy[sz]e|analy[sz]ing|research|researching|think|believe|argue|arguing|explain|explaining|consider)\b/.test(prefix) &&
      !/\b(?:i|we)\s+(?:(?:actually|also|still)\s+)?(?:feel|felt|am feeling|was feeling|became|become)\b/.test(prefix) && predicateIndex <= cognitiveIndex) return false;
  if (/\b(?:if|suppose|imagine|would|could|might|may|should|wish|hope(?:d)? to|want(?:ed)? to|need(?:ed)? to|used to)\b/.test(prefix) ||
      /\b(?:tomorrow|next week|last year|years ago|as a child)\b/i.test(prefix)) return false;
  if (/\b(?:to make|make|made|makes) (?:him|her|them|you|my (?:friend|partner|mother|father|sister|brother|boss))\b/.test(prefix)) return false;
  if (/\b(?:i|we)\s+(?:said|wrote|told|pretended|claim|claimed|say|insist|insisted)\b/.test(prefix)) return false;
  const author = [...prefix.matchAll(/\b(?:i|i'm|i’ve|i've|i’d|i'd|we|we're|we’re|we've|myself|me|my)\b/g)].at(-1)?.index ?? -1;
  const other = [...prefix.matchAll(/\b(?:he|she|they|you|his|her|their|the (?:author|writer|character|patient)|my (?:friend|partner|mother|father|sister|brother|boss))\b/g)].at(-1)?.index ?? -1;
  if (other >= 0 && other >= author) return false;
  if (author >= 0) return true;
  if (/^\s*(?:the |a |an )/.test(prefix) && !/^\s*(?:the thought|the news|the call)/.test(prefix)) return false;
  if (inherited === "blocked") return false;
  if (inherited) return true;
  // Diary fragments such as "Exhausted after work" are useful but less certain.
  const remainder = tail.slice(signalLength || /^\w+/.exec(tail)?.[0].length || 0);
  return /^\s*(?:(?:today|tonight|now|still|so|very|really|absolutely|finally|feeling|felt|both|also|just|completely|utterly|incredibly)\s+)*$/i.test(prefix) &&
    /^\s*(?:[.!?;]|$|(?:after|before|from|about|by|with|of|at|for|tonight|today|this|again|now|enough|beyond|but|and|yet|since|because)\b)/i.test(remainder);
}

function sourceEvidenceSpan(raw, text, masked) {
  const quote = boundedText(raw.quote, 240);
  if (quote.length < 3) return -1;
  let start = -1;
  for (let attempt = 0; attempt < 8; attempt++) {
    start = text.indexOf(quote, start + 1);
    if (start < 0) return -1;
    if (!masked.slice(start, start + quote.length).trim()) continue;
    // Verify attribution in surrounding context, even for a one-word quote.
    const boundary = Math.max(text.lastIndexOf(".", start - 1), text.lastIndexOf("!", start - 1), text.lastIndexOf("?", start - 1), text.lastIndexOf(";", start - 1), text.lastIndexOf("\n", start - 1)) + 1;
    const contextStart = Math.max(boundary, start - 240);
    const context = masked.slice(contextStart, start + quote.length);
    if (raw.dimension === "mood" && raw.direction === "positive" && /\b(?:yeah right|just great|just perfect|oh great|thanks for nothing)\b|\/s(?=\s|$)/i.test(text.slice(contextStart, start + quote.length + 10))) continue;
    let offset = 0;
    const emotionRule = AFFECT_RULES.find(item => item[0] === raw.emotion);
    if (emotionRule) { const match = new RegExp(emotionRule[1].source, "i").exec(quote); if (match) offset = match.index; }
    else { const subject = /\b(?:i|we|me|my)\b/i.exec(quote); if (subject) offset = subject.index + subject[0].length; }
    const position = start - contextStart + offset;
    if (!personalAt(context, position) || negatedSignal(context.slice(0, position))) continue;
    return start;
  }
  return -1;
}

function normalizeInsights(input, sourceText, options = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input) || input.version !== 1) return null;
  const evidence = [];
  const maskedSource = typeof sourceText === "string" && options.checkAttribution ? maskQuotations(sourceText.replace(/[’]/g, "'")) : null;
  const seen = new Set();
  for (const raw of Array.isArray(input.evidence) ? input.evidence.slice(0, 16) : []) {
    if (!raw || !AXES.includes(raw.dimension)) continue;
    const quote = boundedText(raw.quote, 240);
    const start = maskedSource !== null ? sourceEvidenceSpan(raw, sourceText, maskedSource) : typeof sourceText === "string" ? sourceText.indexOf(quote) : raw.start;
    if (!quote || typeof sourceText === "string" && start < 0) continue;
    if (!["positive", "negative", "mixed", "neutral"].includes(raw.direction)) continue;
    const key = `${raw.dimension}:${quote}:${raw.direction}`;
    if (seen.has(key)) continue;
    seen.add(key);
    evidence.push({ dimension: raw.dimension, quote, direction: raw.direction,
      emotion: boundedText(raw.emotion, 48).replace(/[^\p{L}\p{M} -]/gu, ""),
      confidence: capCertainty(raw.confidence),
      ...(Number.isInteger(start) && start >= 0 ? { start, end: start + quote.length } : {}) });
  }
  const observations = [];
  for (const raw of Array.isArray(input.observations) ? input.observations.slice(0, 12) : []) {
    if (!raw || !OBSERVATION_KINDS.includes(raw.kind)) continue;
    const description = options.checkAttribution ? OBSERVATION_DESCRIPTIONS[raw.kind] : boundedText(raw.description, 300);
    const quotes = [...new Set((Array.isArray(raw.quotes) ? raw.quotes : []).slice(0, 3).map(value => boundedText(value, 240)).filter(quote =>
      quote && (typeof sourceText !== "string" || sourceText.includes(quote))))];
    if (!description || !quotes.length) continue;
    if (["ambivalence", "contradiction", "change", "coexistence"].includes(raw.kind) && quotes.length < 2) continue;
    const joined = quotes.join(" ");
    if (raw.kind === "need" && !/\b(?:need(?:ed)?|wish(?:ed)?|want(?:ed)?|long(?:ed)? for|miss(?:ed)?|crave(?:d)?)\b/i.test(joined)) continue;
    if (raw.kind === "trigger" && !/\b(?:because|after|when|since|every time|each time|made me|makes me|left me)\b/i.test(joined)) continue;
    if (raw.kind === "pattern" && !/\b(?:again|every time|keep|always|each time|repeatedly)\b/i.test(joined)) continue;
    observations.push({ kind: raw.kind, description, quotes,
      confidence: raw.kind === "sarcasm" || raw.kind === "contradiction" ? "low" : capCertainty(raw.confidence) });
    if (observations.length === 8) break;
  }
  const dimensionConfidence = Object.fromEntries(AXES.map(axis => {
    const signals = evidence.filter(item => item.dimension === axis);
    const opposing = signals.some(item => item.direction === "positive") && signals.some(item => item.direction === "negative");
    return [axis, !signals.length ? "none" : opposing || axis === "mood" && observations.some(item => ["sarcasm", "contradiction"].includes(item.kind)) ? "low" : signals.some(item => item.confidence === "medium") ? "medium" : "low"];
  }));
  return { version: 1, evidence, observations, dimensionConfidence,
    limitations: [...new Set((Array.isArray(input.limitations) ? input.limitations : []).slice(0, 6).map(value => boundedText(value, 240)).filter(Boolean))] };
}

function assertProviderInsights(value) {
  const text = (value, maximum, minimum = 0) => typeof value === "string" && value.trim().length >= minimum && value.length <= maximum;
  const array = (value, maximum) => Array.isArray(value) && value.length <= maximum;
  const confidence = value => ["low", "medium", "high"].includes(value);
  if (!value || value.version !== 1 || !array(value.evidence, 16) || !array(value.observations, 8) || !array(value.limitations, 6) ||
      value.evidence.some(item => !item || !AXES.includes(item.dimension) || !text(item.quote, 240, 1) ||
        !["positive", "negative", "mixed", "neutral"].includes(item.direction) || !text(item.emotion, 48) || !confidence(item.confidence)) ||
      value.observations.some(item => !item || !OBSERVATION_KINDS.includes(item.kind) || !text(item.description, 300, 1) ||
        !array(item.quotes, 3) || !item.quotes.length || item.quotes.some(quote => !text(quote, 240, 1)) || !confidence(item.confidence)) ||
      value.limitations.some(item => !text(item, 240))) throw new Error("Groq returned invalid emotional evidence fields.");
  if (value.evidence.some(item => /\b(?:diagnos\w*|disorder|syndrome|ptsd|ocd|adhd|bipolar|narcissis\w*|psychopath\w*|sociopath\w*|attachment|manic)\b/i.test(item.emotion)))
    throw new Error("Groq returned a diagnostic label instead of an emotional state.");
}

function groundedAnalysis(analysis, sourceText, options = {}) {
  if (!Object.hasOwn(analysis, "insights")) return analysis; // Historical v1 results stay valid.
  const insights = normalizeInsights(analysis.insights, sourceText, options);
  if (!insights) throw new Error("Invalid emotional evidence structure.");
  if (options.checkAttribution && analysis.insights.evidence.length && !insights.evidence.length)
    throw new Error("Groq returned no valid source evidence for its emotional claims.");
  const output = { ...analysis, insights };
  if (options.checkAttribution) insights.limitations = [
    "Textual evidence does not establish hidden motives, diagnoses or psychological truth.",
    "Quotation and simple attribution checks cannot verify every contextual interpretation."
  ];
  for (const axis of AXES) if (!insights.evidence.some(item => item.dimension === axis)) output[`${axis}Score`] = null;
  for (const axis of ["mood", "energy", "connection"]) {
    const items = insights.evidence.filter(item => item.dimension === axis);
    const positive = items.some(item => item.direction === "positive");
    const negative = items.some(item => item.direction === "negative");
    if (options.checkAttribution && Number.isFinite(output[`${axis}Score`]) && (positive && !negative && output[`${axis}Score`] < 3 || negative && !positive && output[`${axis}Score`] > 3))
      throw new Error("Emotional score contradicts its cited evidence direction.");
    if (axis === "mood" && positive && negative) output.valence = "mixed";
  }
  if (output.moodScore === null) output.valence = "unknown";
  output.emotions = (analysis.emotions || []).filter(emotion => insights.evidence.some(item => item.emotion.toLowerCase() === emotion.toLowerCase())).slice(0, 6);
  if (options.checkAttribution) output.summary = output.emotions.length ?
    `Expressed states include ${output.emotions.join(", ")}. ${output.valence === "mixed" ? "The evidence retains mixed or competing feelings. " : ""}Only supported dimensions receive scores; see the quoted context.` :
    "Only the supported dimensions receive scores. See the quoted evidence for the expressed experience.";
  if (insights.evidence.length === 0) {
    output.summary = "The text does not provide enough grounded personal emotional evidence to assign scores.";
    output.drivers = [];
  } else {
    // Narrative drivers always carry their concrete anchor. Optional model prose
    // cannot replace a verified quotation as the explanation for a score.
    output.drivers = insights.evidence.filter(item => item.dimension !== "intensity").slice(0, 4)
      .map(item => `${item.dimension}: ${item.emotion || item.direction} — “${item.quote}”`.slice(0, 250));
  }
  output.confidence = insights.evidence.length && AXES.every(axis => insights.dimensionConfidence[axis] === "medium") ? "medium" : "low";
  output.confidenceReason = "Confidence describes textual support, not psychological certainty. Unsupported dimensions remain unscored; interpretations are tentative.";
  return output;
}

function contextualAnalysis(text, topic = "") {
  const original = String(text || "").slice(0, 200000);
  const normalized = original.replace(/[’]/g, "'");
  const masked = maskQuotations(normalized);
  const sarcasmCue = /\b(?:yeah right|just great|just perfect|oh great|oh wonderful|thanks for nothing|just what i needed)\b|\/s(?=\s|$)/i;
  const sarcastic = sarcasmCue.exec(normalized);
  const signals = [];
  const observations = [];
  const seenClauses = new Set();
  let suppressed = 0;
  const addObservation = (kind, description, quotes, confidence = "low") => {
    if (observations.length < 16 && observations.filter(item => item.kind === kind).length < 2)
      observations.push({ kind, description, quotes: [...new Set(quotes)], confidence });
  };
  for (const sentenceMatch of masked.matchAll(/[^.!?;\n]+(?:[.!?;]+|$)/g)) {
    const sentence = sentenceMatch[0];
    let inherited = false;
    let inheritedNegation = false;
    const sentenceSignals = [];
    // Scope predicate ownership and negation across coordinated clauses.
    const separators = /[,;]|\b(?:but|yet|although|however|whereas|while|and)\b/gi;
    let begin = 0;
    const parts = [];
    let connector = "";
    for (const split of sentence.matchAll(separators)) { parts.push([begin, split.index, connector]); begin = split.index + split[0].length; connector = split[0].toLowerCase(); }
    parts.push([begin, sentence.length, connector]);
    for (const [from, to, conjunction] of parts) {
      const clause = sentence.slice(from, to);
      const key = clause.trim().toLowerCase();
      if (!key || seenClauses.has(key)) continue;
      seenClauses.add(key);
      const authorSubject = /\b(?:i|i'm|i've|i'll|we|we're|we've)\b/i.test(clause);
      const abstract = /\b(?:stud(?:y|ying|ied)|research(?:ing)?|discuss(?:ing)?|defin(?:e|ing)|read(?:ing)?|writ(?:e|ing)|wrote|analy[sz](?:e|ing)|argu(?:e|ing)|think|believe)\b/i.test(clause) && !/\b(?:feel|felt|feeling)\b/i.test(clause);
      if (authorSubject) { inherited = abstract ? "blocked" : true; inheritedNegation = false; }
      else if (/\b(?:he|she|they|you|my (?:friend|partner|mother|father|sister|brother|boss))\b/i.test(clause) || /^\s*(?:the |a |an )/i.test(clause)) inherited = "blocked";
      if (abstract || /\b(?:if|suppose|imagine|would|could|might|should|used to|wish|want(?:ed)? to|need(?:ed)? to|hope(?:d)? to|tomorrow|next week|last year|years ago|as a child)\b/i.test(clause) ||
          /\b(?:i|we)\s+(?:(?:just|also|still|finally)\s+)?(?:(?:have|had)\s+)?(?:ignored|rejected|supported|accepted|included|understood|hurt)\b/i.test(clause)) inherited = "blocked";
      if (["but", "yet", "however", "although", "whereas"].includes(conjunction) || /^\s*(?:just|rather|only)\b/i.test(clause)) inheritedNegation = false;
      const clauseStart = sentenceMatch.index + from;
      const found = [];
      const suppressedBefore = suppressed;
      const foundEmotions = new Set();
      AFFECT_PATTERN.lastIndex = 0;
      for (const hit of clause.matchAll(AFFECT_PATTERN)) {
          const ruleIndex = hit.findIndex((value, index) => index > 0 && value !== undefined) - 1;
          const [emotion, , mood, energy, connection, intensity] = AFFECT_RULES[ruleIndex];
          if (foundEmotions.has(emotion)) continue;
          const isNegated = negatedSignal(clause.slice(0, hit.index));
          if (isNegated) inheritedNegation = true;
          if (!personalAt(clause, hit.index, inherited, hit[0].length) || isNegated || inheritedNegation) { suppressed++; continue; }
          if (mood > 0 && sarcasmCue.test(sentence)) { suppressed++; continue; }
          if (["supported", "hurt"].includes(emotion) && /\b(?:i|we)\s+(?:(?:just|also|still|finally)\s+)?(?:(?:have|had)\s+)?(?:ignored|rejected|supported|accepted|included|understood|hurt)\b/i.test(clause) &&
              !/\b(?:feel|felt|feeling|was|were|am|are|been)\b/i.test(clause.slice(0, hit.index))) { suppressed++; continue; }
          if (emotion === "supported" && /\b(?:network|server|database|wifi|bluetooth|socket|cable|code|browser)\b/i.test(clause)) { suppressed++; continue; }
          // "happy birthday", "content strategy", physical injury and an
          // object's motion cannot be personal emotional evidence.
          if (/^(?:happy)\b/i.test(hit[0]) && /^\s+(?:birthday|hour|ending)/i.test(clause.slice(hit.index + hit[0].length)) ||
              emotion === "content" && /^\s+(?:strategy|analysis|marketing|page|is|was)/i.test(clause.slice(hit.index + hit[0].length)) ||
              emotion === "hurt" && /\b(?:knee|ankle|arm|leg|finger|back|shoulder)\b/i.test(clause) ||
              emotion === "loving" && /\b(?:love (?:to |the |this |that |my (?:new |old )?(?:car|phone|code|job|work|coffee|book)))/i.test(clause)) {
            if (emotion !== "loving") { suppressed++; continue; }
          }
          const prefix = clause.slice(Math.max(0, hit.index - 35), hit.index);
          const strengthened = /\b(?:extremely|utterly|absolutely|completely|deeply|so very|incredibly)\s*$/i.test(prefix);
          const softened = /\b(?:a little|slightly|somewhat|a bit|mildly)\s*$/i.test(prefix);
          const multiplier = softened ? 0.6 : strengthened ? 1.25 : 1;
          const quoteStart = Math.max(clauseStart, clauseStart + hit.index - 100);
          const quoteEnd = Math.min(clauseStart + clause.length, quoteStart + 230);
          const quoteRaw = original.slice(quoteStart, quoteEnd);
          const trim = quoteRaw.length - quoteRaw.trimStart().length;
          const quote = quoteRaw.trim();
          const firstPerson = /\b(?:i|i'm|we|we're|me|my)\b/i.test(clause) || inherited;
          const signal = { emotion, mood: mood * multiplier, energy: energy * multiplier, connection: connection * multiplier,
            intensity: softened ? Math.max(1, intensity - 1) : strengthened ? Math.min(5, intensity + 1) : intensity,
            quote, start: quoteStart + trim, confidence: firstPerson && !/\b(?:think|perhaps|maybe|guess|seem)\b/i.test(prefix) ? "medium" : "low",
            // Time of experience is distinct from the note's creation date.
            time: /\b(?:earlier|this morning|yesterday|before|at first|initially)\b/i.test(clause) ? "earlier" : /\b(?:now|tonight|by evening|later|finally)\b/i.test(clause) ? "later" : "unspecified" };
          found.push(signal); sentenceSignals.push(signal);
          foundEmotions.add(emotion);
      }
      signals.push(...found);
      if (found.length) inherited = true;
      else if (suppressed > suppressedBefore && !authorSubject) inherited = "blocked";
    }
    if (sentenceSignals.length) {
      const quote = original.slice(sentenceMatch.index, sentenceMatch.index + sentence.length).trim().slice(0, 240);
      if (/\b(?:because|after|when|since|every time|each time|made me|makes me|left me)\b/i.test(sentence) && sentenceSignals.some(item => item.mood || item.energy || item.connection))
        addObservation("trigger", "The writer links this situation with a feeling; sequence alone does not establish causation.", [quote]);
      if (/\b(?:again|every time|keep|always|each time|repeatedly)\b/i.test(sentence) && /\b(?:i|my|me|we)\b/i.test(sentence))
        addObservation("pattern", "The writer describes a recurring experience here; this is a self-report, not a stable personality inference.", [quote]);
    }
  }
  // Needs are recorded only when explicitly expressed, with no inferred motives.
  for (const match of masked.matchAll(/[^.!?;\n]+(?:[.!?;]+|$)/g)) {
    if (/\b(?:i|we)\s+(?:really |just )?(?:need(?:ed)?|wish(?:ed)?|want(?:ed)?|long(?:ed)? for|miss(?:ed)?|crave(?:d)?)\b/i.test(match[0]) && !/\bneed not\b/i.test(match[0]) &&
        !/\b(?:if|would|could|he|she|they|discuss|define|study)\b/i.test(match[0])) {
      const quote = original.slice(match.index, match.index + match[0].length).trim().slice(0, 240);
      addObservation("need", "An explicit want or need is stated; no hidden motive is inferred.", [quote], "medium");
    }
  }
  if (sarcastic) {
    const quote = original.slice(Math.max(0, sarcastic.index - 30), sarcastic.index + 180).trim();
    addObservation("sarcasm", "Possible sarcasm: the literal positive wording may be unreliable. The intended feeling is uncertain.", [quote]);
  }
  const positive = signals.filter(item => item.mood > 0);
  const negative = signals.filter(item => item.mood < 0);
  const earlier = signals.filter(item => item.time === "earlier" && item.mood);
  const later = signals.filter(item => item.time === "later" && item.mood);
  const change = earlier.length && later.length && Math.sign(earlier[0].mood) !== Math.sign(later.at(-1).mood);
  if (change) addObservation("change", "The writing marks an earlier and a later emotional state. The day's overall score retains both.", [earlier[0].quote, later.at(-1).quote], "medium");
  else if (positive.length && negative.length) addObservation("ambivalence", "Positive and painful feelings coexist; the score does not erase either side.", [positive[0].quote, negative[0].quote], "medium");
  const denial = /\b(?:i(?:'m| am) fine|i (?:say|said|insist|insisted) (?:i(?:'m| am)|that i(?:'m| am)) (?:fine|okay|happy))\b/i.exec(masked);
  if (denial && negative.length && !change) addObservation("contradiction", "A stated claim of being fine sits alongside distress. Their relationship is unresolved; neither is treated as dishonesty.", [original.slice(denial.index, denial.index + denial[0].length), negative[0].quote]);
  const evidence = [];
  const scores = {};
  for (const axis of AXES) {
    const relevant = signals.filter(item => axis === "intensity" || item[axis] !== 0);
    if (!relevant.length) { scores[`${axis}Score`] = null; continue; }
    // Balance concept means rather than total counts. Distinct positive and
    // negative sides each have one voice regardless of adjective repetition.
    const values = [...new Map(relevant.map(item => [item.emotion, item[axis]])).values()];
    let value;
    if (axis === "intensity") {
      value = Math.max(...values);
    } else {
      const up = values.filter(item => item > 0), down = values.filter(item => item < 0);
      if (axis !== "mood" && up.length && down.length) addObservation("coexistence",
        axis === "energy" ? "Depletion and activation are both expressed. Their coexistence does not imply healthy energy or a uniform neutral state." :
          "Connection and disconnection are both expressed; these may refer to different relationships or moments.",
        [relevant.find(item => item[axis] > 0).quote, relevant.find(item => item[axis] < 0).quote]);
      const mean = items => items.reduce((sum, item) => sum + item, 0) / items.length;
      value = up.length && down.length ? (mean(up) + mean(down)) / 2 : mean(values);
      value = Math.max(1, Math.min(5, Math.round(3 + value)));
    }
    scores[`${axis}Score`] = value;
    // Keep both poles and temporal endpoints before spending the evidence cap.
    const selected = [...new Set([relevant[0], relevant.find(item => item[axis] > 0), relevant.find(item => item[axis] < 0), relevant.at(-1)])].filter(Boolean);
    for (const item of selected) evidence.push({ dimension: axis, quote: item.quote, start: item.start, end: item.start + item.quote.length,
      emotion: item.emotion, direction: axis === "intensity" ? "neutral" : item[axis] > 0 ? "positive" : "negative", confidence: item.confidence });
  }
  observations.sort((left, right) => OBSERVATION_KINDS.indexOf(left.kind) - OBSERVATION_KINDS.indexOf(right.kind));
  const insights = normalizeInsights({ version: 1, evidence, observations, limitations: [
    "Deterministic English rules cover explicit feelings and selected contextual cues; subtle implication and unfamiliar phrasing may be missed.",
    ...(suppressed ? ["Negated, hypothetical, attributed or abstract emotional terms were excluded."] : []),
    ...(sarcastic ? ["Possible sarcasm limits confidence; no opposite emotion is invented."] : [])
  ] }, original);
  for (const axis of AXES) {
    const poles = insights.evidence.filter(item => item.dimension === axis).map(item => item.direction);
    if (poles.includes("positive") && poles.includes("negative") || sarcastic && axis === "mood") insights.dimensionConfidence[axis] = "low";
  }
  let emotions = [...new Set(signals.map(item => item.emotion))].slice(0, 6);
  // Activation/depletion is not automatically pleasure or distress.
  const hasMood = scores.moodScore !== null;
  const summary = topic || (!signals.length ? "No sufficiently direct personal emotional evidence was found. Abstract topics and other people's feelings are not scored." :
    `${positive.length && negative.length ? change ? "The writing describes a change in feelings" : "The writing contains mixed feelings" : "The writing expresses " + emotions.slice(0, 3).join(", ")}. Scores reflect supported dimensions only.`);
  const result = { ...scores, valence: hasMood ? positive.length && negative.length ? "mixed" : scores.moodScore <= 1 ? "very_negative" : scores.moodScore < 3 ? "negative" : scores.moodScore >= 5 ? "very_positive" : scores.moodScore > 3 ? "positive" : "mixed" : "unknown",
    emotions, summary, drivers: [], confidence: "low", confidenceReason: "Rule-based interpretation is tentative; missing evidence is not a neutral mood.", insights };
  const grounded = groundedAnalysis(result, original);
  grounded.emotions = emotions; // Non-valenced states such as exhaustion remain visible.
  grounded.confidence = "low"; // Rule coverage is not probabilistic calibration.
  grounded.confidenceReason = result.confidenceReason;
  return grounded;
}

function compareEmotionalHistory(current, records) {
  // Compare only evidence already derived under the same selected source scope,
  // date basis and engine generation. Never reread notes or build remote context.
  if (!current?.insights || !current.sourceScope || !current.analysisVersion || !current.date || !current.dateBasis) return null;
  const candidates = Object.values(records || {}).filter(record => record && record.status === "complete" && record.date < current.date &&
    record.dateBasis === current.dateBasis && record.sourceScope === current.sourceScope && record.insights?.version === 1 &&
    Array.isArray(record.insights.evidence) && record.analysisVersion === current.analysisVersion &&
    record.analysisSource === current.analysisSource && record.model === current.model)
    .sort((left, right) => right.date.localeCompare(left.date));
  const previous = [...new Map(candidates.map(record => [record.date, record])).values()].slice(0, 14);
  if (!previous.length) return null;
  const days = (Date.parse(current.date) - Date.parse(previous[0].date)) / 86400000;
  if (days > 30) return null;
  const window = previous.filter(record => (Date.parse(current.date) - Date.parse(record.date)) / 86400000 <= 30);
  const changes = [];
  for (const axis of AXES) {
    const key = `${axis}Score`;
    const prior = window.filter(record => Number.isFinite(record[key]) && record.insights.evidence.some(item => item.dimension === axis));
    if (!Number.isFinite(current[key]) || !prior.length) continue;
    const mean = prior.reduce((sum, record) => sum + record[key], 0) / prior.length;
    const delta = +(current[key] - mean).toFixed(2);
    if (Math.abs(delta) >= 1) changes.push({ dimension: axis, delta, baseline: +mean.toFixed(2), sampleSize: prior.length,
      dates: prior.map(record => record.date), confidence: "low" });
  }
  const recurring = [];
  for (const emotion of [...new Set(current.insights.evidence.filter(item => item.dimension !== "intensity").map(item => item.emotion).filter(Boolean))]) {
    const dates = [...new Set(window.filter(record => record.insights.evidence.some(item => item.emotion === emotion)).map(record => record.date))];
    if (dates.length >= 2) recurring.push({ emotion, dates: [current.date, ...dates].slice(0, 8), confidence: "low" });
  }
  const situations = [];
  const situationsFor = record => (record.insights.observations || []).filter(item => item.kind === "trigger").flatMap(item => item.quotes.map(quote => {
    const match = /\b(?:after|because|when|every time|each time)\s+(.+)/i.exec(quote);
    if (!match) return null;
    const context = match[1].split(/[,;.!?]|\b(?:i|we)\s+(?:feel|felt|am|was|are|were)\b/i)[0].trim().toLowerCase().slice(0, 100);
    const signal = record.insights.evidence.find(item => item.dimension === "mood" && quote.includes(item.quote));
    return context.length >= 3 && signal ? { context, emotion: signal.emotion, quote } : null;
  })).filter(Boolean);
  for (const situation of situationsFor(current)) {
    const matches = window.flatMap(record => situationsFor(record).filter(item => item.context === situation.context && item.emotion === situation.emotion).slice(0, 1).map(item => ({ date: record.date, quote: item.quote })));
    if (matches.length >= 2 && !situations.some(item => item.context === situation.context && item.emotion === situation.emotion))
      situations.push({ context: situation.context, emotion: situation.emotion, evidence: [{ date: current.date, quote: situation.quote }, ...matches].slice(0, 4), confidence: "low" });
    if (situations.length === 3) break;
  }
  return { version: 1, comparedDates: window.map(record => record.date), changes, recurring: recurring.slice(0, 6), situations,
    caveat: "A comparison of selected writing, not a continuous mood measurement or a causal psychological pattern. Missing days are not filled in." };
}

module.exports = { ENGINE_VERSION, contextualAnalysis, normalizeInsights, assertProviderInsights, groundedAnalysis, compareEmotionalHistory };
