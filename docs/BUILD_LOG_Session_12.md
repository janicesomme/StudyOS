# BUILD LOG — Session 12
## Worksheet-to-Game Factory: Alkene Arcade

---

## What Was Built

A complete "worksheet → game" factory. The core product is a standalone HTML arcade game
(`docs/games/alkene-arcade/index.html`) where the engine and content are separated so any
subject's worksheet can be loaded by swapping one line.

### Files Created
```
docs/games/alkene-arcade/
  index.html                    — game engine (pure JS/CSS/HTML, no build step)
  content/
    alkenes.js                  — all game content as window.GAME_DATA
    alkenes-generated.js        — test output from converter (can delete)
  assets/
    img/image1.png … image278.png  — all 278 question/answer images extracted from the DOCX
    crops/
      q_hbr_vinyl_arene/        — substrate + 4 cropped product structures (HBr question)
      q_nbs_halohydrin/         — substrate + 4 cropped product structures (NBS question)

scripts/
  worksheet-to-game.js          — converter: CSV → content JS file (ESM)
  find-content-bounds.cjs       — pixel scanner for image crop coordinates (needs: npm install canvas)
  templates/
    reactions.csv               — locked template with all pedagogy fields (11 alkene rows)
    alkenes-from-worksheet.csv  — 135 reactions extracted from worksheet images
```

### Game Levels
| Level | Mechanic | Questions |
|-------|----------|-----------|
| L1 RECOGNISE | See reagents → name the reaction | 18 filtered reactions |
| L2 TOGGLE | Binary decision (Markovnikov? Syn?) | 77 filtered reactions |
| L3 PREDICT | Pick the drawn product | 3 mol-card + 2 image-card = 5 total |
| L4 REVERSE | See product → pick reagents | 79 filtered reactions |
| L5 TRAP | Near-identical reagents, opposite products | 9 trap pairs |
| L6 EXAM QUESTIONS | Real past-exam image → pick A/B/C/D → see answer image | 41 questions |

---

## The Factory Pipeline

**Manual step (human):** Reads scanned worksheet images, fills in CSV template.

**Automated step:**
```
node scripts/worksheet-to-game.js <subject>.csv --subject "Name" --out content/<subject>.js
```

**For image-based content (L6):**
The 278 images were extracted from `ALKENES PAST EXAM Q AND A.docx` (in source_materials).
A workflow read all images and identified 41 valid Q/A pairs.

---

## Source Data

**Primary worksheet:**
`source_materials/1 1  1  1 1 PAST EXAM AUTOMATICITY WORKSHEETS/ALKENES PAST EXAM Q AND A.docx`

**Extracted images:** `tmp/alkenes-qa-images/image1.png … image278.png`
(also copied to `docs/games/alkene-arcade/assets/img/`)

---

## Strategic Decision Needed (Pick Up Here Tomorrow)

### The Core Problem with L1-L5

The 135 "reactions" extracted from the worksheet images have **schema contamination**:
- The original 11 reactions use `name` as a SHORT REACTION TYPE: "Hydrohalogenation"
- The 135 extracted use `name` as a QUESTION TITLE: "Identify Alkene from Ozonolysis Products"

This caused cascading quality issues in L1-L5:
- Empty reagent boxes (many extracted questions have no reagents)
- Bogus answer choices ("Identify Alkene from Ozonolysis Products" as a RECOGNISE option)
- Filters had to be added to block bad data from every level

### The Clean Architecture (User's Instinct at End of Session)

> "The exam screenshot questions are really good. The others are really poor/mediocre.
> Should we just go all in on using the exam screenshots?"

**Recommended answer: YES, with a split:**

```
L1-L5  = original 11 reactions ONLY (mechanics training, clean data, correct chemistry)
L6     = all real exam screenshot Q/A pairs (the growing library)
```

The factory's VALUE is not extracting text into L1-L5. It is:
**give me a new DOCX → I extract image pairs → more L6 content.**

### Pending Decision

Two questions to answer at start of next session:

1. **L1-L5 content**: Strip back to the original 11 reactions only? Or keep the ~18 clean
   reaction names that survived the strict filter?

2. **Expand L6**: Run the same image extraction workflow on OTHER subject DOCXs in
   source_materials (Substitution/Elimination, Nomenclature, Acids/Bases, etc.) to
   demonstrate the factory scaling to new subjects?

---

## Known Bugs / Limitations at End of Session

| Issue | Status |
|-------|--------|
| L3 PREDICT only has 5 questions (QN=7 cap means it shows 5) | Expected — only 5 predict-tier reactions exist |
| opt_c HBr crop — was clipping benzene ring | FIXED |
| Substrate image showed question text | FIXED |
| NBS halohydrin crops were showing multiple structures | FIXED |
| L1 RECOGNISE was showing bogus answer names | FIXED (strict filter applied) |
| `find-content-bounds.cjs` requires `npm install canvas` | Not installed — use PowerShell fallback |

---

## Content Schema (Locked)

CSV template columns (all pedagogy fields required):
```
id, name, reagents, tier, decision_q,
choiceA, choiceA_correct, choiceB, choiceB_correct,
choiceC, choiceC_correct, choiceD, choiceD_correct,
prod_type, prod_c1, prod_c2, prod_stereo,
rule, trap_id, firstMove, shortcut, whyTrapTempting, smiles
```

`tier` values: `recognise | toggle | predict | reverse | image`

---

## Key Design Principles (Don't Break These)

1. **Engine/content split**: `index.html` has zero reaction data. Swap `content/alkenes.js`
   for any other subject file and the game works.

2. **L6 image mechanic**: Show the full exam question image → letter buttons → answer image
   reveals on submit. This is the high-quality path. Do not replace with text extraction.

3. **Factory boundary**:
   - MANUAL: human reads worksheet, fills CSV OR I read images and extract
   - AUTOMATED: `worksheet-to-game.js` CSV → content JS

4. **No mol-card predict for complex molecules**: The SVG renderer only handles simple
   C-C-CH3 skeletons with 2-char atom labels (H, Br, OH). For anything more complex,
   use image crops (L3 imgOpts) or the full image approach (L6).

---

## Commit Reference

`54b3c4f` — feat(games): worksheet-to-game factory + Alkene Arcade (L1-L6)

(L3 PREDICT image crops, filter fixes, and NBS/HBr crop refinements were NOT committed —
they are uncommitted changes in the working tree.)
