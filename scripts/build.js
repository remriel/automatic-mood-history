const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const corePath = path.join(root, "src", "sentiment-core.js");
const sourcePath = path.join(root, "src", "main.js");
const outputPath = path.join(root, "main.js");

let core = fs.readFileSync(corePath, "utf8").replace(/\r\n/g, "\n");
let engine = fs.readFileSync(path.join(root, "src", "emotional-engine.js"), "utf8").replace(/\r\n/g, "\n");
let source = fs.readFileSync(sourcePath, "utf8").replace(/\r\n/g, "\n");
let pipeline = fs.readFileSync(path.join(root, 'src', 'analysis-pipeline.js'), 'utf8').replace(/\r\n/g, '\n');
pipeline = pipeline.replace(/^const \{[^\n]+\} = require\('\.\/sentiment-core'\);\n/m, '').replace(/\nmodule\.exports = [^\n]+;\s*$/, '\n');

const exportPattern = /\nmodule\.exports = \{[\s\S]*?\};\s*$/;
if (!exportPattern.test(core)) throw new Error("Could not find sentiment-core export block.");
core = core.replace(exportPattern, "\n");
engine = engine.replace(/\nmodule\.exports = [^\n]+;\s*$/, "\n");
core = core.replace(/^const \{[^\n]+\} = require\("\.\/emotional-engine"\);\r?\n/, "");

const importPattern = /\r?\nconst \{\r?\n  ANALYSIS_SCHEMA,[\s\S]*?\r?\n\} = require\("\.\/sentiment-core"\);\r?\n/;
if (!importPattern.test(source)) throw new Error("Could not find sentiment-core import block.");
source = source.replace(importPattern, "\n");
source = source.replace(/\nconst \{[^\n]+\} = require\('\.\/analysis-pipeline'\);\n/, '\n');

const banner = [
  "/* Automatic Mood History — bundled for Obsidian. */",
  "/* Source files: src/main.js + src/sentiment-core.js + src/emotional-engine.js */",
  ""
].join("\n");

fs.writeFileSync(outputPath, banner + engine + "\n" + core + "\n" + pipeline + '\n' + source, "utf8");
console.log(`Built ${path.relative(root, outputPath)} (${fs.statSync(outputPath).size} bytes)`);
