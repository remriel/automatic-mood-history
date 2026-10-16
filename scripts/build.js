const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const corePath = path.join(root, "src", "sentiment-core.js");
const sourcePath = path.join(root, "src", "main.js");
const outputPath = path.join(root, "main.js");

let core = fs.readFileSync(corePath, "utf8");
let source = fs.readFileSync(sourcePath, "utf8");

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

fs.writeFileSync(outputPath, banner + core + "\n" + source, "utf8");
console.log(`Built ${path.relative(root, outputPath)} (${fs.statSync(outputPath).size} bytes)`);
