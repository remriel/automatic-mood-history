const assert = require("node:assert/strict");

// Measure text fragments, not just element scroll widths: a word can wrap
// inside a tiny card without creating any detectable horizontal overflow.
async function assertReadableCards(page, label) {
  const problems = await page.evaluate(() => {
    const failures = [];
    const cards = document.querySelectorAll(".auto-mood-card, .auto-mood-readout-date, .auto-mood-readout-value, .auto-mood-explorer-emotion");
    for (const card of cards) {
      const bounds = card.getBoundingClientRect();
      const style = getComputedStyle(card);
      const content = {
        left: bounds.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
        right: bounds.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight),
        top: bounds.top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop),
        bottom: bounds.bottom - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingBottom)
      };
      const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
      for (let node; (node = walker.nextNode());) {
        if (!node.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          if (rect.left < content.left - 1 || rect.right > content.right + 1 || rect.top < content.top - 1 || rect.bottom > content.bottom + 1) {
            failures.push(`${node.textContent}: text outside card padding`);
          }
        }
        if (node.parentElement.closest(".auto-mood-card-label, .auto-mood-readout-label")) {
          for (const match of node.textContent.matchAll(/[A-Za-z]{2,}/g)) {
            range.setStart(node, match.index);
            range.setEnd(node, match.index + match[0].length);
            if (range.getClientRects().length > 1) failures.push(`${match[0]}: word broken across lines`);
          }
        }
      }
    }
    return failures;
  });
  assert.deepEqual(problems, [], `${label}: card text fits inside its padding and labels remain readable`);
}

module.exports = { assertReadableCards };
