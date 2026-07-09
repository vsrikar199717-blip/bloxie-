import { CONSTANTS } from '../../utils/constants';
import type { WordSegment } from '../../types';

interface PhonemeMarkedWordProps {
  word: string;
  segments?: WordSegment[];
  size: 'word' | 'story';
  showMarks: boolean;
  emphasis?: 'full' | 'subtle';
}

/**
 * Renders a word with phoneme marks (dots, underlines, curves) below
 * each segment. Each segment is an inline-flex column: characters on top,
 * mark below. This guarantees alignment regardless of letter-spacing.
 *
 * For split digraphs (e.g. a...e in "make"), a U-shaped curve spans the
 * entire group while intermediate consonants still show their own dots.
 */
export function PhonemeMarkedWord({
  word,
  segments,
  size,
  showMarks,
  emphasis = 'full',
}: PhonemeMarkedWordProps) {
  if (!segments || segments.length === 0 || !showMarks) {
    return <>{word}</>;
  }

  const dims = CONSTANTS.phonemeMarks[size];
  const emphasisClass = emphasis === 'subtle' ? ' phoneme-marks-subtle' : '';

  const units = buildRenderUnits(word, segments);

  return (
    <span className={`phoneme-marked-word${emphasisClass}`}>
      {units.map((unit, idx) => {
        if (unit.type === 'split-group') {
          // Split digraph group: inverted curve (∩) spans above the word,
          // each sub-segment shows its own dots/underlines below as normal.
          return (
            <span key={idx} className="phoneme-segment phoneme-split-group" style={{ paddingTop: dims.curveHeight }}>
              <span className="phoneme-curve-container" style={{ height: dims.curveHeight }}>
                <SplitCurve dims={dims} numSubSegments={unit.subSegments.length} />
              </span>
              <span className="phoneme-chars">
                {unit.subSegments.map((sub, si) => (
                  <span key={si} className="phoneme-split-sub">
                    <span className="phoneme-sub-chars">
                      {sub.chars.split('').map((ch, ci) => (
                        <span key={ci}>{ch}</span>
                      ))}
                    </span>
                    <span className="phoneme-mark" style={{ height: dims.markHeight }}>
                      {sub.markType === 'dot' && (
                        <span
                          className="phoneme-dot"
                          style={{ width: dims.dotSize, height: dims.dotSize }}
                        />
                      )}
                      {sub.markType === 'underline' && (
                        <span
                          className="phoneme-underline"
                          style={{ height: dims.underlineHeight }}
                        />
                      )}
                      {/* 'none' for split vowel/e — no individual mark, curve covers it */}
                    </span>
                  </span>
                ))}
              </span>
            </span>
          );
        }

        // Regular segment (single, digraph, trigraph)
        return (
          <span key={idx} className="phoneme-segment">
            <span className="phoneme-chars">
              {unit.chars.split('').map((ch, ci) => (
                <span key={ci}>{ch}</span>
              ))}
            </span>
            <span className="phoneme-mark" style={{ height: dims.markHeight }}>
              {unit.type === 'single' && (
                <span
                  className="phoneme-dot"
                  style={{ width: dims.dotSize, height: dims.dotSize }}
                />
              )}
              {(unit.type === 'digraph' || unit.type === 'trigraph') && (
                <span
                  className="phoneme-underline"
                  style={{ height: dims.underlineHeight }}
                />
              )}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Sub-segment within a split group, for rendering individual marks */
interface SplitSubSegment {
  chars: string;
  markType: 'dot' | 'underline' | 'none';
}

/** A renderable unit — either a regular segment or a split digraph group */
interface RenderUnit {
  chars: string;
  type: 'single' | 'digraph' | 'trigraph' | 'split-group';
  subSegments: SplitSubSegment[];
}

/**
 * Converts segments into render units. For split digraphs, combines all
 * characters between the two split positions into one 'split-group' unit
 * while preserving sub-segment info for individual marks.
 */
function buildRenderUnits(word: string, segments: WordSegment[]): RenderUnit[] {
  const units: RenderUnit[] = [];
  let charIndex = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (seg.type === 'split' && seg.positions) {
      const [startPos, endPos] = seg.positions;

      // Only process the split group on the first split segment we encounter
      if (charIndex <= startPos) {
        // Collect all characters from startPos to endPos as one group
        const groupChars = word.slice(startPos, endPos + 1);

        // Build sub-segments: the split vowel, intervening consonants, and silent e
        const subSegments: SplitSubSegment[] = [];

        // First split vowel — no individual mark (curve covers it)
        subSegments.push({ chars: seg.chars, markType: 'none' });

        // Process intervening segments and the closing split 'e'
        let j = i + 1;
        while (j < segments.length) {
          const next = segments[j];
          if (next.type === 'split' && next.positions &&
              next.positions[0] === startPos && next.positions[1] === endPos) {
            // This is the silent 'e' — no individual mark
            subSegments.push({ chars: next.chars, markType: 'none' });
            i = j;
            break;
          }
          // Intervening consonant — gets its own dot or underline
          const mark = (next.type === 'digraph' || next.type === 'trigraph') ? 'underline' : 'dot';
          subSegments.push({ chars: next.chars, markType: mark });
          j++;
          i = j - 1;
        }
        // If we didn't find the closing split (shouldn't happen), ensure i is advanced
        if (j >= segments.length) {
          i = segments.length - 1;
        }

        units.push({ chars: groupChars, type: 'split-group', subSegments });
        charIndex = endPos + 1;
      }
    } else {
      units.push({
        chars: seg.chars,
        type: seg.type as RenderUnit['type'],
        subSegments: [],
      });
      charIndex += seg.chars.length;
    }
  }

  return units;
}

/** SVG quadratic bezier arch (∩) for split digraphs — endpoints at centre of each vowel character */
function SplitCurve({
  dims,
  numSubSegments,
}: {
  dims: typeof CONSTANTS.phonemeMarks[keyof typeof CONSTANTS.phonemeMarks];
  numSubSegments: number;
}) {
  const vh = dims.curveHeight;
  // Place endpoints at the horizontal centre of the first and last sub-segment
  // characters so the arch spans 'a'→'e' rather than edge-to-edge.
  const inset = 100 / (2 * numSubSegments); // e.g. 16.7 for N=3 (gate, late, use…)

  return (
    <svg
      className="phoneme-curve-svg"
      height={vh}
      viewBox={`0 0 100 ${vh}`}
      preserveAspectRatio="none"
    >
      <path
        d={`M ${inset} ${vh} Q 50 0 ${100 - inset} ${vh}`}
        fill="none"
        stroke="#4A90D9"
        strokeWidth={dims.underlineHeight}
        strokeLinecap="round"
      />
    </svg>
  );
}
