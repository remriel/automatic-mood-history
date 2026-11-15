const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const corePath = path.join(root, "src", "sentiment-core.js");
const vaderPath = path.join(root, "src", "vendor", "vaderSentiment.bundle.js");
const apachePath = path.join(root, "src", "vendor", "APACHE-2.0.txt");
const sourcePath = path.join(root, "src", "main.js");
const morningPagesPath = path.join(root, "src", "vendor", "morning-pages-analysis.js");
const morningPagesLicensePath = path.join(root, "src", "vendor", "MORNING-PAGES-LICENSE.txt");
const fallbackPath = path.join(root, "src", "morning-pages-fallback.js");
const outputPath = path.join(root, "main.js");

let core = fs.readFileSync(corePath, "utf8");
const vader = fs.readFileSync(vaderPath, "utf8");
const apache = fs.readFileSync(apachePath, "utf8");
const vaderImportPattern = /^const \{ SentimentIntensityAnalyzer \} = require\("\.\/vendor\/vaderSentiment\.bundle"\);\r?\n/;
if (!vaderImportPattern.test(core)) throw new Error("Could not find VADER import block.");
core = core.replace(vaderImportPattern, "");
let source = fs.readFileSync(sourcePath, "utf8");
const fallbackImport = /^const \{ morningPagesSentiment, MORNING_PAGES_ANALYZER_VERSION \} = require\("\.\/morning-pages-fallback"\);\r?\n/m;
if (!fallbackImport.test(source)) throw new Error("Could not find Morning Pages fallback import.");
source = source.replace(fallbackImport, "const { morningPagesSentiment, MORNING_PAGES_ANALYZER_VERSION } = morningPagesFallback;\n");

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
const morningPagesLicense = "/* Morning Pages Analytics MIT license\n" + fs.readFileSync(morningPagesLicensePath, "utf8").replace(/\*\//g, "* /") + "\n*/\n";
const morningPagesModule = "const morningPagesAnalysis = (() => {\nconst module = { exports: {} };\n" + fs.readFileSync(morningPagesPath, "utf8") + "\nreturn module.exports;\n})();\n";
const fallbackModule = "const morningPagesFallback = (() => {\nconst module = { exports: {} };\nconst require = () => morningPagesAnalysis;\n" + fs.readFileSync(fallbackPath, "utf8") + "\nreturn module.exports;\n})();\n";
fs.writeFileSync(outputPath, banner + licenseComment + morningPagesLicense + vaderModule + core + "\n" + morningPagesModule + fallbackModule + source, "utf8");
console.log(`Built ${path.relative(root, outputPath)} (${fs.statSync(outputPath).size} bytes)`);
