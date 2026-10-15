// Developer-authored challenge cases, not patient data or clinical gold labels.
// Expectations are broad textual constraints; exact psychological scores are not
// knowable from a diary excerpt. Public-domain cases retain source attribution.
const synthetic = [
  ["direct-negative", "I feel sad and exhausted after the cancelled trip.", { moodScore: [1, 2], energyScore: [1, 2], kinds: ["trigger"] }],
  ["calm-not-depleted", "I feel calm and content. Nothing urgent needs doing.", { moodScore: [4, 5], energyScore: null, intensityScore: [1, 2] }],
  ["pleasure-with-fatigue", "I feel happy about finishing the project, but I am exhausted.", { moodScore: [4, 5], energyScore: [1, 2] }],
  ["activation-with-distress", "I am anxious and wired. I cannot sit still.", { moodScore: [1, 2], energyScore: [4, 5], intensityScore: [4, 5] }],
  ["depletion-with-activation", "I feel exhausted but wired.", { energyScore: [2, 3], intensityScore: [4, 5], kinds: ["coexistence"] }],
  ["social-presence-not-connection", "I had dinner with friends. I feel lonely even in that crowded room.", { connectionScore: [1, 2], moodScore: [1, 2] }],
  ["solitude-not-loneliness", "I spent the evening alone by choice. I feel peaceful.", { connectionScore: null, moodScore: [4, 5] }],
  ["supported-not-happy", "I feel supported by my partner, but I am still sad about the loss.", { connectionScore: [4, 5], moodScore: [1, 2] }],
  ["ambivalence-same-object", "I love my job, but I resent the hours it consumes.", { moodScore: [2, 3], valence: "mixed", kinds: ["ambivalence"] }],
  ["ambivalence-separate-objects", "I am proud of finishing and sad about leaving my team.", { moodScore: [2, 3], valence: "mixed", kinds: ["ambivalence"] }],
  ["explicit-change", "Earlier I felt anxious. Now I feel relieved after hearing the result.", { kinds: ["change"], noKinds: ["ambivalence"] }],
  ["explicit-morning-change", "This morning I was sad; by evening I felt happy.", { kinds: ["change"] }],
  ["claimed-fine-and-distress", "I say I'm fine. I feel miserable and lonely.", { moodScore: [1, 2], kinds: ["contradiction"] }],
  ["unresolved-contradiction", "I'm fine, but I feel utterly hopeless.", { moodScore: [1, 2], kinds: ["contradiction"] }],
  ["sarcasm-no-inversion", "Oh great. Another cancelled train. Just what I needed.", { moodScore: null, kinds: ["sarcasm"] }],
  ["sarcasm-explicit-distress", "Just perfect, another unpaid shift. I am furious.", { moodScore: [1, 2], kinds: ["sarcasm"] }],
  ["literal-positive", "I feel delighted after the surprise visit.", { moodScore: [4, 5], noKinds: ["sarcasm"] }],
  ["need-not-motive", "I need some quiet and time to rest. I feel drained.", { energyScore: [1, 2], kinds: ["need"] }],
  ["longing-not-achieved-connection", "I want to feel connected. I feel lonely tonight.", { connectionScore: [1, 2], kinds: ["need"] }],
  ["trigger-explicit-link", "I feel anxious because the rent is due.", { moodScore: [1, 2], kinds: ["trigger"] }],
  ["sequence-not-causation", "I had coffee at noon. I feel sad tonight.", { moodScore: [1, 2], noKinds: ["trigger"] }],
  ["self-reported-cycle", "Every time I get vague feedback, I feel anxious again.", { moodScore: [1, 2], kinds: ["pattern", "trigger"] }],
  ["single-event-not-pattern", "I feel anxious after one difficult meeting.", { noKinds: ["pattern"] }],
  ["first-person-theory", "I study grief and sadness in nineteenth-century literature.", { allNull: true }],
  ["abstract-argument", "I think loneliness and fear can shape political movements.", { allNull: true }],
  ["academic-feeling-word", "I feel that anxiety is an important concept in the essay.", { allNull: true }],
  ["academic-feeling-adjective", "I feel that sad characters are common in the novel.", { allNull: true }],
  ["introspective-uncertainty", "I think I'm sad and lonely.", { moodScore: [1, 2], connectionScore: [1, 2] }],
  ["possessive-emotion", "My anxiety returned after the meeting.", { moodScore: [1, 2] }],
  ["possessive-academic", "My paper on sadness and grief needs editing.", { allNull: true }],
  ["named-other-person", "Anna feels sad and lonely.", { allNull: true }],
  ["topic-led-emotional-adjective", "Exhausted workers and sad music are themes in this paper.", { allNull: true }],
  ["topic-not-experience", "The article discusses hopelessness, exhausted workers, and isolated communities.", { allNull: true }],
  ["other-person", "She feels happy and hopeful. He is exhausted and lonely.", { allNull: true }],
  ["other-person-parent", "My mother is worried and tired after work.", { allNull: true }],
  ["third-person-with-author", "She is happy, but I feel sad.", { moodScore: [1, 2], notEmotions: ["pleased"] }],
  ["author-with-third-person", "I am relieved, but she is furious.", { moodScore: [4, 5], notEmotions: ["angry"] }],
  ["quoted-emotion", 'My friend said, "I am sad and exhausted." I wrote the words down.', { allNull: true }],
  ["curly-quotation", "The novel says “I am happy and hopeful.” I analysed that passage.", { allNull: true }],
  ["quote-then-author", 'She said "I am happy." I feel sad about our argument.', { moodScore: [1, 2], notEmotions: ["pleased"] }],
  ["negated-negative", "I am not sad or lonely.", { allNull: true }],
  ["negated-positive", "I don't feel happy or hopeful.", { allNull: true }],
  ["coordinated-negation", "I am not happy and hopeful.", { allNull: true }],
  ["negation-reset", "I am not sad, but I am tired.", { moodScore: null, energyScore: [1, 2] }],
  ["no-longer", "I am no longer anxious. I feel calm now.", { moodScore: [4, 5], notEmotions: ["anxious"] }],
  ["litotes-not-reversed", "I am not unhappy.", { allNull: true }],
  ["not-only", "I am not only happy but also hopeful.", { moodScore: [4, 5] }],
  ["hypothetical", "If I got the offer, I would feel happy and energized.", { allNull: true }],
  ["future-not-current", "Tomorrow I will feel relieved and connected.", { allNull: true }],
  ["distant-memory", "Last year I felt hopeless and lonely.", { allNull: true }],
  ["wish-not-current", "I wish I felt happy and supported.", { allNull: true }],
  ["activity-not-energy", "I ran five kilometres and had lunch with friends before sleeping.", { allNull: true }],
  ["object-not-emotion", "I worked on the content strategy and the happy birthday card.", { allNull: true }],
  ["physical-not-emotional-hurt", "My ankle hurt after the run.", { moodScore: null, connectionScore: null }],
  ["low-intensity-sadness", "I feel a little sad.", { moodScore: [2, 3], intensityScore: [1, 2] }],
  ["high-intensity-distress", "I feel utterly devastated.", { moodScore: [1, 1], intensityScore: [5, 5] }],
  ["profanity-not-intensity", "I feel calm. This damn printer needs new fucking ink!!!", { intensityScore: [1, 2] }],
  ["numb-not-neutral-happy", "I feel numb, emotionally flat.", { moodScore: null, intensityScore: [1, 1] }],
  ["diary-shorthand", "Exhausted after work. Lonely tonight.", { energyScore: [1, 2], connectionScore: [1, 2] }],
  ["unicode-apostrophe", "I’m sad but I’m also grateful.", { valence: "mixed", kinds: ["ambivalence"] }],
  ["no-diagnosis-inference", "I am tired after a long shift.", { moodScore: null, energyScore: [1, 2], notEmotions: ["depressed"] }],
  ["explicit-need-without-affect", "I need time to think and a quiet room.", { allNull: true, kinds: ["need"] }],
  ["active-support-not-received", "I supported her application and accepted the offer.", { allNull: true }],
  ["active-rejection-not-own-hurt", "I rejected the proposal and ignored the email.", { allNull: true }],
  ["hurt-other-not-self", "I hurt her feelings when I cancelled.", { allNull: true }],
  ["technical-connection", "I am connected to the server. I understood the code.", { allNull: true }],
  ["sarcasm-literal-positive-untrusted", "Yeah right, I am happy that the boiler broke.", { moodScore: null, kinds: ["sarcasm"] }],
  ["sarcasm-explicit-marker", "I feel happy about another unpaid shift /s", { moodScore: null, kinds: ["sarcasm"] }],
  ["unrelated-other-feeling", "I made her happy. I remain sad.", { moodScore: [1, 2], notEmotions: ["pleased"] }],
  ["afterthought-own-feeling", "My friend was sad, and I am relieved that she called.", { moodScore: [4, 5], notEmotions: ["sad"] }],
  ["mild-and-extreme-not-word-count", "I feel slightly worried about tomorrow's interview.", { moodScore: [2, 3], intensityScore: [1, 2] }],
  ["need-is-not-fulfilled", "I need to feel supported and connected.", { allNull: true, kinds: ["need"] }],
  ["past-want-not-current-affect", "I wanted to feel happy and supported.", { allNull: true, kinds: ["need"] }],
  ["negated-state-elliptic-contrast", "I wasn't angry, just tired.", { moodScore: null, energyScore: [1, 2] }],
  ["behavioral-smile", "I couldn't stop smiling after the visit.", { moodScore: [4, 5] }],
  ["behavioral-tears", "I couldn't stop crying after the goodbye.", { moodScore: [1, 2] }],
  ["felt-heard", "I finally felt heard during the conversation.", { connectionScore: [4, 5] }],
  ["depletion-idiom", "I was running on empty after that long shift.", { energyScore: [1, 2], moodScore: null }]
].map(([id, text, expected]) => ({ id, text, expected, source: "synthetic", split: "development" }));

const publicJournals = [
  ["bashkirtseff-unhappy", "I am very unhappy to-day. I am in a terrible state of mind; if this keeps on, I don't know what will become of me.", { moodScore: [1, 2] }, "January 1873"],
  ["bashkirtseff-despair", "It seems as if I had loved. I feel in despair; I don't know why, but it was a torturing feeling and made me weep.", { moodScore: [1, 2] }, "November 1875"],
  ["bashkirtseff-tired", "Tired enough, finery will use me up, me and my money. But that is why I came to Paris, and we must do things conscientiously.", { energyScore: [1, 2], connectionScore: null }, "November 18, 1875"],
  ["bashkirtseff-sad", "I feel sad, unnerved, I should like to smile and to weep. No, really, love is full of interest.", { moodScore: [1, 2], connectionScore: null }, "November 18, 1875"]
].map(([id, text, expected, location]) => ({ id, text, expected, location, source: "public-journal", split: "external-check",
  author: "Marie Bashkirtseff", edition: "New Journal of Marie Bashkirtseff, translated by Mary J. Safford (1912)",
  url: "https://www.gutenberg.org/files/13916/13916-h/13916-h.htm", license: "Public domain in the USA; Project Gutenberg ebook 13916" }));
publicJournals.push(...[
  ["amiel-fear-and-ease", "I am afraid of the subjective life, and recoil from every enterprise, demand, or promise which may oblige me to realize myself; I feel a terror of action, and am only at ease in the impersonal, disinterested, and objective life of thought.", { moodScore: [1, 3] }, "Journal, discussion of subjective life"],
  ["amiel-metaphoric-self", "I am a spectator, so to speak, of the molecular whirlwind which men call individual life; I am conscious of an incessant metamorphosis, an irresistible movement of existence, which is going on within me.", { energyScore: null, connectionScore: null }, "Journal, chameleon passage"],
  ["amiel-melancholy", "I am overpowered with melancholy, languor, lassitude. A longing for the last great sleep has taken possession of me, combated, however, by a thirst for sacrifice", { moodScore: [1, 2] }, "April 1867"],
  ["amiel-abstract-religion", "As I understand it, Christianity is above all religions, and religion is not a method, it is a life, a higher and supernatural life, mystical in its root and practical in its fruits, a communion with God, a calm and deep enthusiasm, a love which radiates", { allNull: true }, "September 1866, discussion of religion"]
].map(([id, text, expected, location]) => ({ id, text, expected, location, source: "public-journal", split: "external-check",
  author: "Henri-Frédéric Amiel", edition: "Amiel's Journal, translated by Mrs. Humphry Ward (1885)",
  url: "https://www.gutenberg.org/files/8545/8545-h/8545-h.htm", license: "Public domain in the USA; Project Gutenberg ebook 8545" })));

function violations(result, expected) {
  const failures = [];
  for (const axis of ["moodScore", "energyScore", "connectionScore", "intensityScore"]) {
    const range = expected.allNull ? null : expected[axis];
    if (range === undefined) continue;
    if (range === null ? result[axis] !== null : !Number.isFinite(result[axis]) || result[axis] < range[0] || result[axis] > range[1]) failures.push(`${axis}: ${result[axis]}, expected ${JSON.stringify(range)}`);
  }
  if (expected.valence && result.valence !== expected.valence) failures.push(`valence: ${result.valence}, expected ${expected.valence}`);
  for (const emotion of expected.notEmotions || []) if (result.emotions.includes(emotion)) failures.push(`misattributed emotion: ${emotion}`);
  for (const kind of expected.kinds || []) if (!result.insights?.observations.some(item => item.kind === kind)) failures.push(`missing observation: ${kind}`);
  for (const kind of expected.noKinds || []) if (result.insights?.observations.some(item => item.kind === kind)) failures.push(`unsupported observation: ${kind}`);
  return failures;
}
module.exports = { synthetic, publicJournals, violations };
