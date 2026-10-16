// Hash analysis, quota, lifecycle, storage and worker code independently of
// dashboard presentation. Full measured source/bundle hashes remain in reports.
const fs = require('node:fs');
const crypto = require('node:crypto');
function groqContractHash() {
  const source = fs.readFileSync('src/main.js', 'utf8').replace(/\r\n/g, '\n');
  const boundary = '\n  async buildRepairPreview() {';
  const end = source.indexOf(boundary);
  if (end < 0 || source.indexOf(boundary, end + boundary.length) >= 0) throw new Error('Analysis/UI boundary changed; review benchmark fingerprint scope.');
  const hash = crypto.createHash('sha256');
  for (const path of ['src/analysis-pipeline.js', 'src/emotional-engine.js', 'src/sentiment-core.js', 'src/groq-runtime.js']) hash.update(fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n'));
  return hash.update(source.slice(0, end)).digest('hex');
}
module.exports = { groqContractHash };
