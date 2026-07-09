#!/usr/bin/env python3
"""
Populate the 'phoneme' field on every segment in wordSets.json.

Maps each grapheme (chars) to its phoneme ID based on:
1. Direct 1:1 mappings (covers ~90% of segments)
2. Context-based resolution for ambiguous graphemes (oo, ow, th, split vowels, etc.)
"""

import json
import sys

# --- Phoneme ID definitions ---

# Valid phoneme IDs (44 standard + 3 special)
VALID_PHONEMES = {
    # Consonants (24)
    'b', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'y', 'z',
    'ch', 'sh', 'th', 'dh', 'ng', 'zh',
    # Short vowels (7)
    'a', 'e', 'i', 'o', 'u', 'uu', 'schwa',
    # Long vowels (5)
    'ai', 'ee', 'igh', 'oa', 'oo',
    # Other vowels/diphthongs (8)
    'ow', 'oi', 'ar', 'or', 'ur', 'ear', 'air', 'yoor',
    # Special
    'kw',       # qu
    'ks',       # x
    'magic-e',  # silent e in split digraphs
}

# Direct grapheme → phoneme mappings (unambiguous)
DIRECT_MAP = {
    # Single consonants
    'b': 'b', 'd': 'd', 'f': 'f', 'g': 'g', 'h': 'h', 'j': 'j',
    'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'p': 'p', 'r': 'r',
    's': 's', 't': 't', 'v': 'v', 'w': 'w', 'y': 'y', 'z': 'z',
    'x': 'ks',
    'q': 'k',  # standalone q (as in squad where qu is split into q+u)
    # Single short vowels (default for type=single)
    # Handled separately since vowels need context
    # Doubled consonants → single phoneme
    'ff': 'f', 'll': 'l', 'ss': 's', 'zz': 'z', 'nn': 'n',
    'mm': 'm', 'tt': 't', 'gg': 'g', 'dd': 'd', 'bb': 'b',
    'pp': 'p', 'rr': 'r', 'cc': 'k',
    # Consonant digraphs
    'ch': 'ch', 'sh': 'sh', 'ng': 'ng', 'ck': 'k',
    'ph': 'f', 'wh': 'w', 'qu': 'kw',
    'kn': 'n', 'wr': 'r', 'mb': 'm', 'gn': 'n',
    # Unambiguous vowel digraphs
    'ai': 'ai', 'ee': 'ee', 'igh': 'igh', 'oa': 'oa',
    'ar': 'ar', 'ur': 'ur', 'oi': 'oi', 'ou': 'ow',
    'ear': 'ear', 'air': 'air', 'ure': 'yoor',
    'er': 'ur', 'ir': 'ur',
    'ay': 'ai', 'ea': 'ee', 'oy': 'oi',
    'ew': 'oo', 'ue': 'oo', 'ie': 'igh',
    'aw': 'or', 'au': 'or',
    'oe': 'oa',
    'or': 'or',
    'ore': 'or',
    'are': 'air',
    'eer': 'ear',
    # Trigraphs
    'igh': 'igh',
    'tch': 'ch',
    'dge': 'j',
}

# Words where 'th' is voiced (dh) - common function words + specific words
VOICED_TH_WORDS = {
    'the', 'this', 'that', 'them', 'then', 'than', 'they', 'their', 'there',
    'these', 'those', 'though', 'thus', 'with', 'other', 'another', 'either',
    'neither', 'whether', 'rather', 'father', 'mother', 'brother',
    'together', 'gather', 'weather', 'feather', 'leather', 'bathe',
    'breathe', 'clothe', 'smooth', 'soothe', 'teethe', 'writhe',
}

# Short vowel letters
SHORT_VOWELS = {'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u'}

# Long vowel for split digraphs (a-e, e-e, i-e, o-e, u-e)
SPLIT_VOWEL_PHONEMES = {
    'a': 'ai',   # make, cake
    'e': 'ee',   # these, eve
    'i': 'igh',  # like, time
    'o': 'oa',   # home, bone
    'u': 'oo',   # cute, flute
}


def resolve_phoneme(chars, seg_type, word, pattern, word_segments, seg_index):
    """Resolve the phoneme for a single segment."""
    chars_lower = chars.lower()

    # Split digraph handling
    if seg_type == 'split':
        if chars_lower == 'e' and seg_index > 0:
            # The trailing 'e' in a split digraph — silent/magic-e
            return 'magic-e'
        elif chars_lower in SPLIT_VOWEL_PHONEMES:
            # The vowel part of the split digraph
            return SPLIT_VOWEL_PHONEMES[chars_lower]
        else:
            # Shouldn't happen, but fallback
            return SPLIT_VOWEL_PHONEMES.get(chars_lower, chars_lower)

    # Direct mapping (covers consonants, doubled letters, digraphs, trigraphs)
    if chars_lower in DIRECT_MAP:
        return DIRECT_MAP[chars_lower]

    # Ambiguous: 'th' — voiced vs unvoiced
    if chars_lower == 'th':
        word_lower = word.lower()
        if word_lower in VOICED_TH_WORDS:
            return 'dh'
        return 'th'

    # Ambiguous: 'oo' — long vs short
    if chars_lower == 'oo':
        pattern_lower = pattern.lower()
        if 'short' in pattern_lower:
            return 'uu'
        return 'oo'  # default to long

    # Ambiguous: 'ow' — /ow/ (cow) vs /oa/ (snow)
    if chars_lower == 'ow':
        pattern_lower = pattern.lower()
        if 'slow' in pattern_lower:
            return 'oa'
        return 'ow'  # default to /ow/ (cow), including plain "ow" pattern

    # Single vowels (not split)
    if chars_lower in SHORT_VOWELS and seg_type == 'single':
        # Special case: 'u' after 'q' in words like 'squad' → /w/ not /u/
        if chars_lower == 'u' and seg_index > 0:
            prev_chars = word_segments[seg_index - 1].get('chars', '').lower()
            if prev_chars == 'q':
                return 'w'
        return SHORT_VOWELS[chars_lower]

    # 'c' alone is /k/
    if chars_lower == 'c':
        return 'k'

    # 'a_e' etc. as a single chars shouldn't happen outside split, but just in case
    if '_' in chars_lower:
        base = chars_lower.replace('_', '').replace('e', '')
        if base in SPLIT_VOWEL_PHONEMES:
            return SPLIT_VOWEL_PHONEMES[base]

    # If we get here, flag it
    return None


def populate_phonemes(data):
    """Add phoneme field to every segment in the word sets."""
    stats = {
        'total_segments': 0,
        'resolved': 0,
        'unresolved': [],
    }

    for ws in data['wordSets']:
        pattern = ws.get('pattern', '')
        for pw in ws.get('phonicsWords', []):
            word = pw.get('word', '')
            segments = pw.get('segments', [])
            for idx, seg in enumerate(segments):
                stats['total_segments'] += 1
                chars = seg.get('chars', '')
                seg_type = seg.get('type', 'single')

                phoneme = resolve_phoneme(chars, seg_type, word, pattern, segments, idx)
                if phoneme is not None:
                    seg['phoneme'] = phoneme
                    stats['resolved'] += 1
                else:
                    stats['unresolved'].append({
                        'word': word,
                        'chars': chars,
                        'type': seg_type,
                        'pattern': pattern,
                        'set_id': ws.get('id', ''),
                    })

    return stats


def validate(data):
    """Validate that every segment has a valid phoneme."""
    errors = []
    for ws in data['wordSets']:
        for pw in ws.get('phonicsWords', []):
            word = pw.get('word', '')
            for seg in pw.get('segments', []):
                phoneme = seg.get('phoneme')
                if phoneme is None:
                    errors.append(f"Missing phoneme: {word} / {seg['chars']}")
                elif phoneme not in VALID_PHONEMES:
                    errors.append(f"Invalid phoneme '{phoneme}': {word} / {seg['chars']}")
    return errors


def main():
    input_path = 'src/data/wordSets.json'

    with open(input_path, 'r') as f:
        data = json.load(f)

    print(f"Processing {len(data['wordSets'])} word sets...")

    stats = populate_phonemes(data)

    print(f"\nTotal segments: {stats['total_segments']}")
    print(f"Resolved: {stats['resolved']}")
    print(f"Unresolved: {len(stats['unresolved'])}")

    if stats['unresolved']:
        print("\n--- UNRESOLVED SEGMENTS ---")
        for item in stats['unresolved']:
            print(f"  [{item['set_id']}] word='{item['word']}' chars='{item['chars']}' type='{item['type']}' pattern='{item['pattern']}'")

    # Validate
    errors = validate(data)
    if errors:
        print(f"\n--- VALIDATION ERRORS ({len(errors)}) ---")
        for err in errors:
            print(f"  {err}")
        sys.exit(1)
    else:
        print("\nValidation passed! All segments have valid phonemes.")

    # Write output
    with open(input_path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')

    print(f"\nUpdated {input_path}")


if __name__ == '__main__':
    main()
