const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const corePath = path.join(root, "src", "sentiment-core.js");
const vaderPath = path.join(root, "src", "vendor", "vaderSentiment.bundle.js");
const apachePath = path.join(root, "src", "vendor", "APACHE-2.0.txt");
const sourcePath = path.join(root, "src", "main.js");
const moodringPath = path.join(root, "src", "moodring-core.js");
const outputPath = path.join(root, "main.js");

let core = fs.readFileSync(corePath, "utf8");
const vader = fs.readFileSync(vaderPath, "utf8");
const apache = fs.readFileSync(apachePath, "utf8");
const vaderImportPattern = /^const \{ SentimentIntensityAnalyzer \} = require\("\.\/vendor\/vaderSentiment\.bundle"\);\r?\n/;
if (!vaderImportPattern.test(core)) throw new Error("Could not find VADER import block.");
core = core.replace(vaderImportPattern, "");
let source = fs.readFileSync(sourcePath, "utf8");
let moodring = fs.readFileSync(moodringPath, "utf8");
const moodringExport = /\nmodule\.exports = \{[^\n]*\};\s*$/;
if (!moodringExport.test(moodring)) throw new Error("Could not find Moodring exports.");
moodring = moodring.replace(moodringExport, "\n");
const moodringImport = /^const \{ MOODRING_VERSION, MOODRING_LABELS, validatedModel, compareMoodring \} = require\("\.\/moodring-core"\);\r?\n/m;
if (!moodringImport.test(source)) throw new Error("Could not find Moodring import.");
source = source.replace(moodringImport, "");

const exportPattern = /\nmodule\.exports = \{[\s\S]*?\};\s*$/;
if (!exportPattern.test(core)) throw new Error("Could not find sentiment-core export block.");
core = core.replace(exportPattern, "\n");

const importPattern = /\r?\nconst \{\r?\n  ANALYSIS_SCHEMA,[\s\S]*?\r?\n\} = require\("\.\/sentiment-core"\);\r?\n/;
if (!importPattern.test(source)) throw new Error("Could not find sentiment-core import block.");
source = source.replace(importPattern, "\n");

const banner = [
  "/* Automatic Mood History — bundled for Obsidian. */",
  "/* Source files: src/main.js + src/sentiment-core.js */",
  ""
].join("\n");

const vaderModule = [
  "const vaderSentimentModule = { exports: {} };",
  "(function (exports) {",
  vader,
  "})(vaderSentimentModule.exports);",
  "const SentimentIntensityAnalyzer = vaderSentimentModule.exports.SentimentIntensityAnalyzer;",
  ""
].join("\n");
const licenseComment = "/* VADER Sentiment JS third-party Apache-2.0 license (full text)\n" +
  apache.replace(/\*\//g, "* /") + "\n*/\n";
fs.writeFileSync(outputPath, banner + licenseComment + vaderModule + core + "\n" + moodring + "\n" + source, "utf8");
console.log(`Built ${path.relative(root, outputPath)} (${fs.statSync(outputPath).size} bytes)`);
