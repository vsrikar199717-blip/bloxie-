/**
 * One-off content fixes found by scripts/audit-decodability.cjs
 *
 * 1. "dream" in the Phase 4 `dr` set uses the `ea` digraph, which isn't taught
 *    until Phase 5 — a child at that point cannot decode it. Replaced with
 *    "drop" (same `dr` focus, all Phase 2/3 graphemes).
 * 2. "squad"/"squ" words segment `qu` as two graphemes (q + u). Letters and
 *    Sounds teaches `qu` as a single grapheme. Merged.
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/data/wordSets.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

let dreamFixed = 0;
let quFixed = 0;

for (const set of data.wordSets) {
  for (const w of set.phonicsWords || []) {
    // 1. Phase 4 "dream" -> "drop"
    if (set.phase === 4 && w.word === 'dream') {
      w.word = 'drop';
      w.segments = [
        { chars: 'd', type: 'single', phoneme: 'd' },
        { chars: 'r', type: 'single', phoneme: 'r' },
        { chars: 'o', type: 'single', phoneme: 'o' },
        { chars: 'p', type: 'single', phoneme: 'p' },
      ];
      if (w.teachingTip) w.teachingTip = w.teachingTip.replace(/dream/gi, 'drop');
      dreamFixed++;
    }

    // 2. q + u  ->  qu (single grapheme)
    const segs = w.segments;
    if (!segs) continue;
    for (let i = 0; i < segs.length - 1; i++) {
      if (segs[i].chars === 'q' && segs[i + 1].chars === 'u') {
        segs.splice(i, 2, { chars: 'qu', type: 'digraph', phoneme: 'qu' });
        quFixed++;
        break;
      }
    }
  }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log(`"dream" -> "drop" in Phase 4: ${dreamFixed} fixed`);
console.log(`q+u -> qu merged: ${quFixed} words fixed`);
