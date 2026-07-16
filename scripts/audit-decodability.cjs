/**
 * Audit: are the words we ask children to READ actually decodable at their phase?
 *
 * Rule (from the Letters and Sounds progression): a word is decodable only if every
 * grapheme in it has been taught by that phase. This checks the `phonicsWords`
 * (the words the child is asked to read) — NOT the story prose, which the parent
 * reads aloud and is allowed to contain anything.
 */
const wordSets = require('../src/data/wordSets.json').wordSets;

// Cumulative graphemes taught by the end of each phase (Letters and Sounds).
const PHASE_GRAPHEMES = {
  2: ['s','a','t','p','i','n','m','d','g','o','c','k','ck','e','u','r','h','b','f','ff','l','ll','ss'],
  3: ['j','v','w','x','y','z','zz','qu','ch','sh','th','ng','ai','ee','igh','oa','oo','ar','or','ur','ow','oi','ear','air','ure','er'],
  4: [], // no new graphemes — adjacent consonants only
  5: ['ay','ou','ie','ea','oy','ir','ue','aw','wh','ph','ew','oe','au','ey','a-e','e-e','i-e','o-e','u-e','tch','ck'],
};

// Doubled consonants are a spelling convention, not a new sound: a child who
// knows 't' reads 'tt' as the same /t/. Treated as taught alongside the single.
const DOUBLES = { nn:'n', mm:'m', tt:'t', gg:'g', dd:'d', pp:'p', bb:'b', rr:'r', cc:'c' };

function graphemesUpTo(phase) {
  const out = new Set();
  for (let p = 2; p <= phase; p++) (PHASE_GRAPHEMES[p] || []).forEach((g) => out.add(g));
  return out;
}

// Prefer the authored segments (they encode the intended graphemes, incl. split digraphs)
function segmentsOf(w) {
  if (w.segments && w.segments.length) return w.segments.map((s) => (s.chars || '').toLowerCase());
  return w.word.toLowerCase().split('');
}

const report = {};
let total = 0, bad = 0;

for (const set of wordSets) {
  const known = graphemesUpTo(set.phase);
  for (const w of set.phonicsWords || []) {
    total++;
    const segs = segmentsOf(w);
    // split digraph e.g. a-e may appear as 'a_e' / 'a-e' — normalise
    const unknown = segs.filter((g) => {
      if (!g) return false;
      const n = g.replace(/_/g, '-'); // split digraphs may be a_e or a-e
      const base = DOUBLES[g]; // 'tt' counts as taught once 't' is
      return !known.has(g) && !known.has(n) && !(base && known.has(base));
    });
    if (unknown.length) {
      bad++;
      const key = `phase ${set.phase}`;
      (report[key] = report[key] || []).push(`${w.word} (untaught: ${[...new Set(unknown)].join(', ')})`);
    }
  }
}

console.log('=== DECODABILITY AUDIT (words the child reads) ===');
console.log(`checked: ${total} words across ${wordSets.length} sets`);
console.log(`flagged: ${bad} (${((bad / total) * 100).toFixed(1)}%)\n`);

for (const [phase, items] of Object.entries(report).sort()) {
  const uniq = [...new Set(items)];
  console.log(`${phase}: ${uniq.length} flagged`);
  console.log('  ' + uniq.slice(0, 12).join('\n  '));
  if (uniq.length > 12) console.log(`  …and ${uniq.length - 12} more`);
  console.log('');
}
if (!bad) console.log('No issues — every word is decodable at its phase.');
