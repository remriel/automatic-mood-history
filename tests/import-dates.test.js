const assert = require("node:assert/strict");
const { fixture, TFile } = require("./reliability-fixture");
const { p, files } = fixture();
const detect = name => p.getCreationDateForFile(new TFile(`Imported/${name}.md`));
for (const [name, expected] of [
  ["2021-12-08 (2)", "2021-12-08"], ["2021-12-08 (33)", "2021-12-08"],
  ["2021-12-08 - Notes", "2021-12-08"], ["Notes — 2021-12-08", "2021-12-08"],
  ["2021-12-08T15.30.00", "2021-12-08"], ["2021-2-8", "2021-02-08"],
  ["December 8, 2021 (3)", "2021-12-08"], ["Notes 8 December 2021", "2021-12-08"],
  ["December 8th, 2021", "2021-12-08"], ["8th December 2021", "2021-12-08"],
  ["13.11.2021", "2021-11-13"], ["20211208 (2)", "2021-12-08"]
]) assert.equal(detect(name), expected, name);
assert.equal(detect("03-04-2024 (2)"), null);
p.settings.numericDateOrder = "mdy";
assert.equal(detect("03-04-2024 (2)"), "2024-03-04");
assert.equal(detect("03.04.2024"), "2024-03-04");
assert.equal(detect("13-11-2024"), "2024-11-13", "unambiguous DMY remains valid");
assert.equal(detect("2024-03-04 to 2024-03-05"), null, "two distinct dates are never guessed");
p.settings.numericDateOrder = "dmy";
assert.equal(detect("03-04-2024 (2)"), "2024-04-03");
assert.equal(p.validateSettings({ numericDateOrder: "mdy" }).numericDateOrder, "mdy");
assert.equal(p.validateSettings({ numericDateOrder: "guess" }).numericDateOrder, "skip");
p.settings.numericDateOrder = "mdy";
for (const name of ["2021-12-08", "2021-12-08 (2)", "December 8, 2021 (3)", "2021-12-09 (2)"]) {
  const file = new TFile(`Imported/${name}.md`); files.set(file.path, file);
}
assert.equal(p.buildDateIndex().filesByDate.get("2021-12-08").length, 3);
assert.equal(p.buildDateIndex().filesByDate.get("2021-12-09").length, 1);
p.settings.excludeFolders = ["Imported"];
assert.equal(detect("2021-12-08 (2)"), null, "folder exclusions still win");
p.settings.excludeFolders = [];
const guard = p.analysisGuard(); p.settings.numericDateOrder = "dmy";
assert.throws(guard, /cancelled/, "date convention changes invalidate in-flight grouping");
console.log("PASS imported date formats, duplicate suffixes, titles, conventions, grouping, exclusions and cancellation");
