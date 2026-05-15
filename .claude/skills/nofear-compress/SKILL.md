---
name: nofear-compress
description: Find the minimum viable, visually-grounded, exam-ready compression of any Organic Chemistry concept. Use this skill whenever the user asks to simplify, shorten, or find a faster version of an Ochem explanation — or whenever a No Fear Ochem section has a formula or rule that might benefit from visual grounding. Triggers on: "make this simpler", "is there a faster way", "can we compress this", "find the shortcut", "sticks and dots style", or any time a formula has a division or multi-step procedure that might reduce to something the student can see on the drawn structure. Also use proactively after nofear-ochem produces a Tiny Tactic section — ask yourself if the tactic could be compressed further.
---

# No Fear Compress Skill

## Purpose

Find the minimum viable version of an Ochem concept — the compression a skilled tutor finds
intuitively. The prototype: Klein's formal charge formula (valence electrons minus lone pairs
minus half bonding electrons) compressed to "column number minus dots minus sticks."

That compression worked because bond LINES on a drawn structure already encode the halving
step — counting sticks does the division automatically. The student loses zero accuracy and
eliminates one cognitive step.

This skill replicates that class of insight for any concept.

---

## What This Skill Is For

Single-concept rules, definitions, and formulas where:
- The original explanation requires a multi-step procedure or arithmetic step
- Visual elements on the drawn structure (lines, dots, charges) might already represent
  one of those steps

This skill is NOT for multi-step reaction mechanisms — those require a different approach.

---

## The 5-Step Process

Run all five steps internally before printing anything.

### Step 1 — Identify the core operation

Strip the concept to one sentence: what does the student literally DO during an exam?
Not the theory — the action.

Ask: "If a student had 30 seconds and a drawn structure in front of them, what are they
actually doing with their pencil?"

Example for formal charge: "Look at one atom in the structure and decide if it should be
labeled +1, -1, or left blank."

### Step 2 — Map visual elements to formula terms

List the countable visual elements the student can see on a drawn structure:
- Bond lines (each line = one bond, regardless of whether single/double/triple)
- Lone pair dots (pairs of dots on an atom)
- Partial charge symbols (delta+ / delta-)
- Plus or minus signs already drawn
- Wedge and dash bonds

Focus on elements that can be counted or read off as a number — not structural features
like ring shapes or chain lengths, which do not map to formula terms.

For each visual element, ask: does this already represent one of the terms in the textbook
formula or rule?

The key question is not "does this look like the term" but "does counting or reading this
element give the same numerical result as evaluating that term?"

Formal charge example: each bond LINE already gives you the result of (bond electrons / 2)
because you count lines not electrons. One line = 1, not 2.

### Step 3 — Identify the eliminated step

For each valid visual mapping, name the cognitive step in the original explanation that
disappears when the visual language replaces the formula term.

"Eliminated step" means: a step the student no longer has to perform because the visual
element has already done it.

If no step is eliminated by a mapping, that mapping is not a useful compression. Discard it.

If Steps 2 and 3 produce no valid mappings at all, stop and tell the user:

> "No visual compression found for this concept. The existing explanation may already be
> at minimum complexity, or this concept may require a different type of simplification."

Do not invent a compression that is not grounded in a real visual element.

### Step 4 — Generate candidates

Write 2-3 candidate compressions. Each must satisfy ALL of the following:

1. Uses the visual element language — words the student reads off the page, not formula
   variable names
2. Is shorter and simpler than the original formulation — fewer words, fewer steps
3. Introduces no new vocabulary or concept not already in the student's working knowledge
4. Is a complete, self-contained rule — a student who has never seen the original formula
   can apply this candidate correctly

### Step 5 — Verify accuracy

Test each candidate against exactly 3 examples. Choose examples that cover:

- A neutral case (expected formal charge or answer: 0 / neutral / no label)
- A positive case (expected: +1 or higher)
- A negative case (expected: -1 or lower)

Work through each example explicitly. Do not assume a candidate is correct — actually
apply it and check.

If a candidate fails any example: discard it entirely. Do not print it.

If only one candidate survives: print it alone. Do not pad with unverified options.

If zero candidates survive: print a failure report explaining which example broke each
candidate and why.

---

## Output Format

Print this block verbatim (filling in the bracketed fields):

```
CONCEPT: [name of the concept]
ORIGINAL: [the formulation being compressed — quote it exactly]

CANDIDATES:
  [A] [the compressed version, written as the student would say it to themselves]
      Eliminates: [the step that disappears]

  [B] [the compressed version]
      Eliminates: [the step that disappears]

ACCURACY CHECK:
  [A] [atom/example, expected answer] → [your result using candidate A]: PASS or FAIL
      [atom/example, expected answer] → [your result using candidate A]: PASS or FAIL
      [atom/example, expected answer] → [your result using candidate A]: PASS or FAIL

  [B] (same format)

RECOMMENDED: [letter of recommended candidate, e.g. A]
Reason: [one sentence — why this version will stick better for a struggling student]
```

Then on a new line, separated by a horizontal rule:

If you know which No Fear HTML file this concept lives in, ask:

```
---
Apply this to the Tiny Tactic section of [filename]? (yes / no / edit first)

Note: the Training Wheels OFF section may also benefit — let me know if you want that
updated too.
```

If you do not know the file, ask: "Which No Fear section should I apply this to, if any?"

Do not touch any file until the user responds with yes or edit first.

---

## Worked Example (for calibration)

**Concept:** Formal charge

**Step 1 — Core operation:** "Look at one atom in a drawn Lewis structure and label it +,
-, or nothing."

**Step 2 — Visual mapping:**
- "Lone pair dots" → maps to "nonbonding electrons" in the formula → same thing, different
  words. Not a compression — just a rename.
- "Bond lines (sticks)" → maps to "(bonding electrons / 2)" in the formula → each line
  equals 1 unit of ownership, not 2. Counting lines gives you the divided value directly.
  This IS a compression.

**Step 3 — Eliminated step:** The student no longer needs to count electrons in bonds and
then divide by 2. They count lines. The division is gone.

**Step 4 — Candidates:**

Draft attempt: "FC = group number minus lone pair electrons minus number of bonds"
Check against criterion 1: "uses visual element language — words the student reads off the
page, not formula variable names." The words "lone pair electrons" and "bonds" are formula
variable names. The student sees dots and sticks on the page, not "lone pair electrons" and
"bonds." Criterion 1 fails. Discard this draft.

Valid candidate:
- [A] "Formal charge = column number minus dots minus sticks"
  — "column number" reads from the periodic table. "Dots" and "sticks" read directly off
  the drawn structure. All four criteria satisfied.

Only one candidate survives Step 4.

**Step 5 — Accuracy check (Candidate A only):**

Candidate A — "column number minus dots minus sticks":
- O in water (2 bonds, 2 lone pairs): 6 - 4 - 2 = 0. Expected: 0. PASS
- N in NH4+ (4 bonds, 0 lone pairs): 5 - 0 - 4 = +1. Expected: +1. PASS
- O in OH- (1 bond, 3 lone pairs): 6 - 6 - 1 = -1. Expected: -1. PASS

All three pass.

**Recommended:** A (only candidate that survived Step 4) — uses language the student reads
directly off the drawing. No translation from formula variable names required.
