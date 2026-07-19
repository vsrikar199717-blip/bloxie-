# Robot Reading — Explainer Content Pack

Written as a creative-by-creative script. Each panel gives you a **headline**, a **subhead**, **body copy**, the **labels/numbers** to set in the graphic, and a note on **what the visual needs to show**. Everything here is checked against the actual codebase — the numbers are real.

Two registers are given where useful: **[SIMPLE]** for a one-line version, **[DETAILED]** for the fuller explanation. Use whichever fits the panel size.

---

## PANEL 01 — What it is

**Headline:** Reading is the work. Building is the reward.

**Subhead:** A phonics app for UK children aged 4–7, built for the child and the grown-up sitting next to them.

**Body [SIMPLE]:**
Robot Reading is a reading app for primary school children. The child reads a word out loud. The grown-up says how it went. The child earns a piece of a robot, a monster, or a mythical creature — and builds it, piece by piece, right next to the words they're reading.

**Body [DETAILED]:**
Most reading apps make the child tap the right answer on a screen. Robot Reading doesn't — the child reads *aloud*, to a person. The app can't hear them, and that's deliberate. The grown-up is the assessor. What the app does instead is remove every reason a child would want to stop: it makes the words readable, it tells the grown-up how to help, and it turns each word read into a physical-feeling reward the child assembles themselves.

The screen is split. Reading on one side, building on the other. Both are visible at all times, so the reward is never abstract — it's sitting right there, half-built.

**Labels for the graphic:**
- Ages 4–7 · Reception to Year 2
- UK "Letters and Sounds" phonics
- Built for dyslexia-friendly reading
- Two people, one screen

**Visual note:** The split screen is the single most characteristic image of this app. Left = the word, huge. Right = a half-built robot. If you only make one graphic, make this one.

---

## PANEL 02 — The core loop (the gaming logic)

**Headline:** Read a word. Earn a part. Build a character. Repeat.

**Subhead:** One loop, four steps, and it never breaks.

**Body [SIMPLE]:**
The child reads a word. The grown-up taps how it went. A part drops into the tray. The child drags it onto their creation. Then the next word appears. That's the whole game.

**Body [DETAILED]:**
The loop is deliberately short — a child gets a reward roughly every 15 seconds of effort, not at the end of a level. The key design decision is this: **all three assessment buttons award a part.** "Needs more practice" earns a part just like "Nailed it!" does. Struggling is never punished — a child who found a word hard still gets to build.

The only thing that earns nothing is **Skip**. That's the pressure valve: if a word is genuinely too hard, the grown-up skips it and moves on, and the app makes no fuss about it.

**The loop, step by step (for a cycle diagram):**
1. **A word appears** — large, spaced out, with sound marks under each sound
2. **The child reads it aloud** — the grown-up can tap 🔊 to hear it first, or "Break it down" for a teaching tip
3. **The grown-up taps one of three buttons:**
   - 🎉 Nailed it!
   - 🤝 Used a little help
   - 🔁 Needs more practice
4. **A part drops into the tray** — the child drags it onto their build
5. **Next word** → back to step 1

**The three buttons, spelled out:**
| Button | Meaning | Parts earned |
|---|---|---|
| 🎉 Nailed it! | Read independently | 1 |
| 🤝 Used a little help | Read with support | 1 |
| 🔁 Needs more practice | Struggled | 1 |
| ⏭️ Skip | Too hard right now | 0 |

**Callout to pull out big:**
> Every attempt earns a part. Only skipping earns nothing. Effort is the currency, not accuracy.

**Visual note:** A four-step circular loop. Make the "all three buttons → 1 part" convergence visible — three arrows merging into one reward.

---

## PANEL 03 — The word logic, part 1: the phonics model

**Headline:** Built on the phonics UK schools actually teach.

**Subhead:** Letters and Sounds, Phases 2 to 5 — the same framework as the classroom.

**Body [SIMPLE]:**
The app follows "Letters and Sounds", the phonics scheme used in UK primary schools. It covers Phases 2 to 5 — from a child's very first letter sounds through to the trickier spelling patterns of Year 1.

**Body [DETAILED]:**
Phonics teaching in the UK is built in phases, and a child's school will tell a parent which phase their child is on. Robot Reading mirrors that structure exactly, so a parent doesn't have to translate between the app and the classroom. The app doesn't invent its own levels — it borrows the ones the child is already being taught in.

**The four phases (for a ladder / progression graphic):**

| Phase | Typical stage | What it teaches | Example |
|---|---|---|---|
| **Phase 2** | Reception, age 4–5 | Starting sounds — the first 19 letter sounds | s, a, t, p, i, n, m, d |
| **Phase 3** | Reception, age 4–5 | More sounds — digraphs, two letters making one sound | ch, sh, ai, ee, oa |
| **Phase 4** | Reception, age 4–5 | Blending words — consonant clusters | spot, crash, blend |
| **Phase 5** | Year 1, age 5–6 | Alternative spellings — the same sound, spelled differently | ay, ea, ie, ue, a-e |

**The numbers (real, for a stats strip):**
- **474 word sets** in the app
- **1,112 unique words**
- **4,352 teaching tips** — one written for every single word
- **51 tricky words** — the ones that can't be sounded out
- Phase 2: 109 sets · Phase 3: 130 sets · Phase 4: 109 sets · Phase 5: 126 sets

**Visual note:** A rising staircase or ladder, four steps. Each step shows its example letters at large size. Phase 5 at the top.

---

## PANEL 04 — The word logic, part 2: how a session is built

**Headline:** Never the same session twice.

**Subhead:** How the app decides which words your child sees today.

**Body [SIMPLE]:**
The app picks word sets that match your child's phases, favours ones they haven't seen before, shuffles them, and mixes the phases together so a session never feels like a drill.

**Body [DETAILED]:**
When a session starts, the app runs through five steps to build the running order:

1. **Filter by phase** — only pull sets from the phases the parent selected for this child
2. **Unseen first** — the app remembers which sets this child has already seen and puts fresh ones first. When almost everything's been seen, it wipes the slate and starts the pool again
3. **Shuffle** — randomise within each phase
4. **Interleave** — round-robin between the phases, so a Year 2 child on all four phases gets Phase 2 → 3 → 4 → 5 → 2 → 3… rather than a long block of one
5. **Anti-repeat** — if today's order looks too much like last session's, rotate it

**What's in a word set (for an anatomy diagram):**
Each set is **3 or 4 phonics words + 1 bonus word + 1 story**.

- **Phonics words** — decodable. The child can sound them out. Each earns **1 part**.
- **Bonus word** — a tricky word like *the*, *said*, *could*. These break the rules and have to be learned by sight. Because they're harder, they earn **3 parts**.
- **The story** — a short passage using the words just practised. Completing it starts a brand new character.

**Callout:**
> There's no timer and no word quota. The session ends when the grown-up decides it ends. A tired child stops after two sets; an eager one keeps going.

**Visual note:** A word set as a container — four small word chips, one gold "bonus" chip, one story card. Then a strip showing how sets interleave across phases.

---

## PANEL 05 — The sound marks (the signature feature)

**Headline:** Showing a child what a word is made of.

**Subhead:** Standard UK phonics notation, printed live under every word.

**Body [SIMPLE]:**
Under each word, small marks show how it splits into sounds. A dot means one letter, one sound. An underline means two or three letters making one sound. A curve means a split digraph — where a vowel's sound is changed by an 'e' further along.

**Body [DETAILED]:**
This is the notation UK teachers draw by hand under words on a whiteboard. Robot Reading renders it automatically, on every word, in every story. It means a parent who never learned phonics can see the structure of a word as clearly as a teacher can — and a child gets a consistent visual grammar for "this chunk is one sound".

**The three marks (this is a graphic in itself):**

| Mark | Name | Means | Example |
|---|---|---|---|
| **·** dot | single | One letter, one sound | c · a · t |
| **▁** underline | digraph / trigraph | Two or three letters, one sound | r **ai** n · **ear** |
| **⌒** curve | split digraph | The vowel is split from its 'e' | m **a** k **e** |

**Detail worth mentioning:**
Tricky words deliberately get **no marks at all**. That's the point — they can't be sounded out, so marking them would teach the wrong lesson. The absence of marks is the signal.

**Visual note:** Set the word "make" enormous with the curve arching over the a and the e, and "rain" with the underline under "ai". These two images do all the explaining. The mark colour in the app is blue (#4A90D9).

---

## PANEL 06 — The reading aids

**Headline:** Three tools that get a child unstuck.

**Subhead:** Turn them on when they help. Turn them off when they don't.

**Body [SIMPLE]:**
Some children lose their place. Some are overwhelmed by a full page. Three toggles fix both — a ruler, a lightbox, and the sound marks.

**Body [DETAILED]:**
These aren't accessibility settings buried in a menu — they're in the toolbar, one tap away, meant to be flicked on and off mid-sentence as the child needs them. All three are things a good teacher does with their hands: a finger under the line, a hand covering the rest of the page, a pencil marking out the sounds.

**The three aids (verbatim from the app's own parent guide):**

- **📏 Ruler** — "A coloured line your child can drag up and down to track which line they're reading."
- **💡 Lightbox** — "Dims everything except the line your child is focused on, so they don't lose their place."
- **🔤 Marks** — "Shows coloured marks under each sound in a word, helping your child see how to break it apart."

**Two more tools for the grown-up:**
- **🔊 Sound it out** — hear the word spoken aloud. As the guide puts it: *"great when you're not sure of the pronunciation!"*
- **💬 Break it down** — a tip written specifically for this word, telling the grown-up how to help. Example for *make*: *"the 'e' at the end makes the 'a' say its name."*

**Design detail:** The whole reading area sits on pale yellow (#FFFFCC), not white. Reduced glare, easier tracking — a standard dyslexia-friendly choice.

**Visual note:** Three before/after pairs. The lightbox one is the most dramatic — a page at 30% opacity with one word glowing yellow.

---

## PANEL 07 — The building part

**Headline:** 372 pieces. 10 characters. Three worlds.

**Subhead:** The reward isn't a badge. It's a thing you make.

**Body [SIMPLE]:**
Choose a world — Robot, Mystical, or Monster. Each word you read drops a new part into the tray. Drag it onto the canvas. Rotate it, flip it, resize it, stack it. There's no right answer — it's yours.

**Body [DETAILED]:**
The critical design decision here is that the reward is **open-ended**. The app never shows the child a "correct" finished robot to work towards. It hands them parts and gets out of the way. A child can build a sensible robot or put six heads on a spring — both are wins, because both mean they read the words.

The tray shows **greyed-out silhouettes of what's coming next**, which is the hook: the child can see there's a head, then a body, then arms waiting for them. The next reward is always visible.

**The three worlds:**
- 🤖 **Robot** — 4 families, 227 parts
- 🦄 **Mystical** — 3 families (Dragon, Mermaids, Phoenix), 69 parts
- 👾 **Monster** — 3 families (Chaos Core, Ghosts, Weird Biology), 76 parts

**How a character is assembled (this order is fixed — good for a diagram):**

| Order | Part | How many |
|---|---|---|
| 1 | Head | ×1 |
| 2 | Body | ×1 |
| 3 | Body parts | ×4 |
| 4 | Joints | ×2 |
| 5 | Accessories | ×3 |
| | **One complete character** | **11 parts** |

**The maths that matters:**
- 1 phonics word = **1 part**
- 1 bonus (tricky) word = **3 parts**
- A full 5-word set = **7 parts**
- 11 parts = **one finished character** ≈ 1½ word sets
- Finish a character (or finish a story) → **a brand new one starts**

So a child completes a whole creature roughly every ten minutes of reading. Then the app switches them to a different family so the next one looks nothing like the last.

**What you can do to a part:**
Rotate (snaps to 15°) · Flip horizontally · Flip vertically · Resize (0.5× to 2.5×) · Bring to front · Send to back · Drag it back to the tray to remove it

**Two payoff buttons — they appear once 3 parts are placed:**
- **💃 Make it dance!** — the whole creation animates for 5 seconds. Heads bob, arms wave, accessories wiggle.
- **📸 Take photo!** — downloads the creation as an image. This is the fridge-door moment.

**Visual note:** The assembly order diagram is the strongest graphic here — a character exploding into its 11 parts, numbered by the order they arrive. Also worth showing: the tray with silhouettes, half filled in.

---

## PANEL 08 — The design system

**Headline:** Designed for a child who finds reading hard.

**Subhead:** Every type and colour decision traces back to one constraint.

**Body [DETAILED]:**
The whole design system answers a single question: *how do you set text for a child who is still decoding, and might be dyslexic?* That constraint produces choices most apps wouldn't make — running the reading text on a different font from the rest of the interface, for instance, or a background that isn't white.

### Fonts

**Two typefaces, doing two different jobs.**

**Poppins** — the interface font.
- Weights 400, 600, 700
- Used for: buttons, headings, onboarding, the parent guide, all the app's own chrome
- Why: geometric, rounded, friendly. It reads as a *children's product* without being childish. Its circular letterforms echo the robot and bubble shapes in the illustrations.

**System UI** — the reading font.
- Weight 500, letter-spacing **2.5px**, line-height **1.8**
- Used for: every word the child reads, and every story
- Why this is the interesting decision: the reading text deliberately **opts out of Poppins**. The words a child decodes are set in the operating system's own font — the most neutral, most familiar letterforms available on that device. A branded display face is the wrong tool for a child sounding out letters. Personality belongs in the interface; the words themselves should get out of the way.
- The generous letter-spacing and line-height are the standard dyslexia-friendly settings: they stop letters visually crowding each other and stop lines merging into one another.

**Type sizes:**
| Role | Phone | Tablet / desktop |
|---|---|---|
| The word being read | 48px | **72px** |
| Story text | 30px | 36px |
| Buttons | 24px | 24px |

### Colour

| Swatch | Hex | Where |
|---|---|---|
| Pale yellow | **#FFFFCC** | The app background — everywhere. Lower glare than white. |
| Blue | **#4A90D9** | The sound marks and the ruler |
| Guide blue | **#3B82F6** | The reading guide line |
| Green | **#22C55E** | Primary actions |
| Orange | **#F97316** | Secondary actions |
| Highlight yellow | **#FFFAA0** | The lit word in the lightbox |

Plus a decorative trio used in the onboarding illustrations: red **#E84D4D**, teal **#2BBCC4**, yellow **#F5C542**.

### Layout rules

- **One breakpoint: 768px.** Below it, everything stacks vertically. Above it, reading and building sit side by side. No other breakpoints — a deliberate constraint to stop the layout fragmenting.
- **The split is 55% / 45%** — reading gets more room than building.
- **Minimum touch target: 44px** on phones, 60px on tablets. Sized for a four-year-old's finger, not an adult's.
- **No ALL CAPS anywhere** — capitals remove the word-shape cues that early readers rely on.

**Visual note:** The best graphic here is a side-by-side of the same word set in Poppins vs the reading font, with the letter-spacing called out. It makes the "two fonts, two jobs" point instantly.

---

## PANEL 09 — Features at a glance

**Headline:** What's in it.

Use this as a grid of small cards, or one long feature list.

**Setting up**
- Privacy notice before anything else
- Profile per child — name, year group, phases
- Multiple children on one device
- Theme choice: Robot, Mystical, or Monster

**Reading**
- 474 word sets across four phonics phases
- A story after every set
- Sound marks under every word
- Ruler, lightbox, and marks — toggleable
- Hear any word or story read aloud (British English)
- A teaching tip written for every single word
- Three-way assessment plus skip

**Building**
- 372 parts, 10 character families, 3 worlds
- Free-form drag and drop
- Rotate, flip, resize, layer
- Upcoming parts shown as silhouettes
- Make it dance
- Take a photo of your creation

**For grown-ups**
- A four-card guide to every feature, shown before the first session
- Change phases any time
- End-of-session summary with drag-to-correct
- "Practice these again" mini-session
- Delete all data, any time

---

## PANEL 10 — The outcomes

**Headline:** What a child actually walks away with.

**Body [DETAILED]:**
Worth being precise here, because it's tempting to overclaim. The app doesn't test a child, doesn't score them, and doesn't produce a reading age. What it produces is different and arguably more useful:

**For the child:**
- **Decoding practice with real repetition** — 1,112 words, sequenced so they never see the same session twice
- **A visual grammar for sounds** — after enough sessions, the dot/underline/curve notation becomes automatic, and it's the same notation their teacher uses
- **Sight recognition of the 51 tricky words** — the words that can't be sounded out and simply have to be known
- **Reading as something that pays out** — the association the app is really building is *reading → making something*
- **A finished thing to show someone** — the photo button exists for exactly this

**For the grown-up:**
- **A summary at the end of every session** — every word sorted into: 🎉 Nailed it · 🤝 With a little help · 🔁 Needs more practice · ⏭️ Skipped
- **Correct a mis-tap** — drag any word into a different bucket
- **Practise the hard ones immediately** — one button runs a mini-session on just the words that were struggled with or skipped
- **A record over time** — every attempt is saved, per child

**Callout — be honest about this, it's a strength not a weakness:**
> There's no score and no pass mark. The app's own summary buckets are the only judgement it makes, and a human makes them, not an algorithm.

**Visual note:** The four summary buckets with their colours (red / amber / green / grey) are already a designed object in the app — reuse them.

---

## PANEL 11 — How parents guide their child

**Headline:** The grown-up isn't a bystander. They're the assessor.

**Subhead:** This app doesn't work without you — and that's the design.

**Body [DETAILED]:**
The app makes a bet that most reading apps don't: that the most valuable thing in a child's reading practice is an adult sitting next to them. So it builds the adult in as a component rather than designing them out. The parent holds the one input the app can't automate — the judgement of whether the child actually read the word.

Which raises the obvious problem: **most parents weren't taught phonics and don't know how to help.** The app solves that directly.

**The four ways the app coaches the parent:**

**1. A guide before the first session** — four cards, headed "How it works", covering reading tools, helping your child, the building zone, and settings. Skippable, and re-openable any time from the "?" button.

**2. A teaching tip on every word** — tap "Break it down" and the app tells you what to say. Real examples:
> *"g-o-t → Say each sound: g, o, t. Blend: got"*
> *"r-ai-n → Spot the 'ai' digraph. Blend: r-ai-n → rain"*
> *"m-a-ke → the 'e' at the end makes the 'a' say its name"*
> *"Tricky word! 'Come' looks like it should rhyme with 'home' but we say 'cum'. Learn it by sight."*

**3. Permission to skip** — stated plainly in the guide: *"If a word is too tricky, skip it and move on. No new building part is given, but that's OK!"* That last clause is doing real work. It's telling a parent not to push.

**4. Hear it first** — if the parent isn't sure of a pronunciation themselves, 🔊 says it in British English before the child tries.

**What the parent controls:**
- Which phonics phases the child practises — mix and match freely
- Which reading aids are on
- Which world they're building in
- Every child's profile on the device

**How to sit with your child — the practical version:**
1. Sit beside them, not opposite. They should be able to reach the screen.
2. Let them try the word before you help.
3. If they stall, tap **Break it down** and read the tip *to yourself*, then coach in your own words.
4. Be generous with 🤝 "used a little help" — it's not a failure state, and it earns the same part.
5. Skip when it's not landing. Two skipped words is a better session than one battle.
6. End on a build. Let them place the last part, dance it, photograph it.
7. Read the summary together. "Look — you nailed nine of them."

**Visual note:** This panel wants a photograph-style illustration more than a diagram: two figures, one screen, side by side. If you're drawing it, the adult's finger is on the assessment button and the child's is on the robot.

---

## PANEL 12 — Privacy

**Headline:** Nothing leaves the device.

**Body:** Worth its own panel, because it's an unusually strong position for a children's app and it's true — there is no analytics code, no network calls, no accounts.

**The app's own words, verbatim:**
> "This app saves your child's name and reading level **on this device only**."
> "We never see or store any of your child's data."
> "Only set this up on a private family device, not a shared one."

And from the parent settings:
> "Your data is stored on this device only. We never see any of it."

There's a "Delete all data" button, and it does exactly that.

**Visual note:** A single device with a closed loop drawn around it. No cloud in the picture — that's the whole message.

---

## PANEL 13 — What's next (optional, but good for a university project)

**Headline:** Where it goes.

Including a roadmap shows you understand the product's own limits. These are genuinely planned but not yet built:

- **A parent progress dashboard** — a heat map of which sounds a child has mastered
- **Mastery-aware word selection** — spaced repetition, so words a child struggled with resurface at the right interval. Right now the app records every attempt but doesn't yet feed that back into which words come next.
- **A teacher report** — export a summary to share with school. UK phonics teaching leans heavily on home–school communication.
- **Phase advancement suggestions** — *"Emma seems ready for Phase 4"*, based on her actual history
- **Per-phoneme audio** — 44 recorded British English sounds, so the app can play individual sounds rather than whole words

**Visual note:** Keep it visually quieter than the rest — this is a footnote, not a claim.

---

## Quick reference — every number in one place

| | |
|---|---|
| Ages | 4–7 (Reception, Year 1, Year 2) |
| Phonics scheme | Letters and Sounds, Phases 2–5 |
| Word sets | 474 |
| Unique words | 1,112 |
| Tricky (sight) words | 51 |
| Teaching tips | 4,352 — one per word |
| Words per set | 3–4 phonics + 1 bonus |
| Character parts | 372 |
| Character families | 10 |
| Worlds | 3 |
| Parts per character | 11 |
| Parts per phonics word | 1 |
| Parts per bonus word | 3 |
| Parts per completed set | 7 |
| Interface font | Poppins (400/600/700) |
| Reading font | System UI, 500, +2.5px tracking, 1.8 line-height |
| Background | #FFFFCC |
| Breakpoint | 768px |
| Min touch target | 44px |
| Reading / building split | 55% / 45% |

---

## Three lines to use as pull quotes

> Every attempt earns a part. Only skipping earns nothing.

> The words a child decodes are set in the plainest font on the device. Personality belongs in the interface — not in the letters they're trying to read.

> The app can't hear your child read. That's not a limitation. That's the parent's job, and the whole thing is built around it.
