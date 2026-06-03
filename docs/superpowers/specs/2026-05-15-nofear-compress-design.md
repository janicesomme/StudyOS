# No Fear Compress Skill — Design Spec
Date: 2026-05-15

## Purpose

A standalone Claude Code skill that takes any Organic Chemistry concept and finds the minimum
viable, visually-grounded, exam-ready version of it — the compression a good human tutor finds
intuitively.

The prototype: Klein's formal charge formula (FC = valence electrons - lone pairs - half bonding
electrons) compressed to "column number minus dots minus sticks." The compression works because
bond lines on a drawn structure already encode the halving step, so the student counts lines
instead of doing arithmetic.

This skill attempts to replicate that class of insight systematically.

---

## Scope

- Input: any concept in any form — a concept name, a formula, a textbook paragraph, a No Fear
  draft, or a fragment of a conversation
- Output: 2-3 verified candidate compressions printed for human review, with a recommended
  winner; no file is updated until the user approves
- Works independently of nofear-ochem — can be run on any concept at any stage

---

## Internal Process (5 steps)

### Step 1 — Identify the core operation
Strip the concept to one sentence describing what the student literally does during an exam.
Not what the concept means philosophically — what action the student takes.

Example: "Given a drawn Lewis structure, decide whether a specific atom has a positive,
negative, or zero formal charge."

### Step 2 — Map visual elements
Scan for things the student can see on a drawn structure or diagram:
- Bond lines (single, double, triple)
- Lone pair dots
- Plus / minus signs already shown
- Wedge/dash bonds
- Structural features (rings, chains, substituents)

For each element, ask: does this visual thing already represent one of the terms in the
textbook formula or rule? If yes, that is a compression candidate.

The formal charge case: a bond LINE is already drawn as one line. The formula says divide
bonding electrons by 2 — but counting lines (sticks) already does that division. The halving
step is eliminated.

### Step 3 — Find the eliminated step
For each visual mapping found in Step 2, identify the cognitive step in the original
explanation that disappears when the visual language is substituted.

No eliminated step = no compression to offer for that mapping. Do not force it.

If Steps 2 and 3 produce no valid visual mappings at all, the skill stops and tells the user:
"No visual compression found for this concept. The existing explanation may already be at
minimum complexity, or this concept may require a different simplification approach."

### Step 4 — Generate candidates
Write 2-3 candidate compressions. Each candidate must:
- Use the visual element language (things the student sees on the page)
- Be shorter and simpler than the original formulation
- Not introduce any new concept or vocabulary
- Be a complete, self-contained rule (no implicit steps)

### Step 5 — Verify accuracy
Test each candidate against exactly 3 examples. Choose examples that cover:
- The neutral/zero case (expected answer: 0)
- The positive charge case (expected answer: +1 or higher)
- The negative charge case (expected answer: -1 or lower)

If a candidate fails any example, discard it. Only verified candidates are printed. If only
one candidate survives verification, print it alone — do not pad with unverified options.
If zero candidates survive, report the failure and explain which example broke each one.

---

## Output Format

```
CONCEPT: [name of concept]
ORIGINAL: [the textbook or No Fear formulation being compressed]

CANDIDATES:
  [A] [compressed version]
      Eliminates: [the cognitive step that disappears]

  [B] [compressed version]
      Eliminates: [the cognitive step that disappears]

ACCURACY CHECK:
  [A] [example 1, expected answer]: PASS/FAIL
      [example 2, expected answer]: PASS/FAIL
      [example 3, expected answer]: PASS/FAIL
  [B] ...

RECOMMENDED: [A or B]
Reason: [one sentence — why this version is better for a struggling student]

---
Apply this to the Tiny Tactic section of [filename]? (yes / no / edit first)
```

If no file context is known, omit the final line and ask the user where to apply it.

---

## Skill File Location

`.claude/skills/nofear-compress/SKILL.md`

---

## What the Skill Does NOT Do

- Does not invent new analogies or metaphors from scratch — it looks for mappings that
  already exist between the visual elements and the formula terms
- Does not simplify by removing accuracy — every candidate must pass the verification step
- Does not update any file without human approval
- Does not run on multi-step reaction mechanisms (those require a different compression
  approach — this skill is for definitions, formulas, and single-concept rules)

---

## Integration Notes

- Can be invoked mid-conversation when a potential compression is spotted
- Can be run after nofear-ochem produces a section, to sharpen the Tiny Tactic
- Output is designed to slot directly into the Tiny Tactic section of any No Fear HTML file
- The Training Wheels OFF section may also benefit from the compressed version; the skill
  should note this but leave the decision to the user
