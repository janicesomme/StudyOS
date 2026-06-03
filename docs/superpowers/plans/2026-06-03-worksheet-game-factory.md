# Worksheet-to-Game Factory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor alkene-trainer.html into a reusable engine + swappable content model, define a content schema, and build a Node.js converter that turns a filled-in CSV into a playable arcade game.

**Architecture:** The engine (index.html) loads `window.GAME_DATA` from a co-located `content/<subject>.js` file via a `<script>` tag - no fetch(), works with file:// protocol without a server. The converter reads a CSV template and writes that JS file. One engine, many content files.

**Tech Stack:** Vanilla HTML/CSS/JS (engine), Node.js built-ins only (converter - no npm deps)

**Source engine:** `C:\Users\crm22\Downloads\alkene-trainer.html` (458 lines, self-contained)

**Why CSV not DOCX:** The automaticity worksheet DOCX files are image-heavy (scanned exam crops). Text extraction yields <400 chars. CSV is the writable factory input format.

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `docs/games/alkene-arcade/content/alkenes.js` | Alkenes content as `window.GAME_DATA` |
| Create | `docs/games/alkene-arcade/index.html` | Pure engine, reads from content script |
| Create | `scripts/worksheet-to-game.js` | Converter: CSV -> content JS |
| Create | `scripts/templates/reactions.csv` | Template user fills per subject |

---

## Content Schema

Each reaction in `window.GAME_DATA.reactions`:

```js
{
  // Identity
  id: string,               // unique slug, e.g. "hbr"
  name: string,             // display name, e.g. "Hydrohalogenation"
  reagents: string,         // reagent string with unicode, e.g. "HBr, ROOR"

  // Engine fields (unchanged from original RXN structure)
  prod: {
    type: "add"|"diol"|"epoxide"|"alkane"|"cleave",
    c1?: string,            // group on C1 (less-substituted)
    c2?: string,            // group on C2 (more-substituted)
    stereo?: "syn"|"anti"
  },
  decision: {
    q: string,              // toggle-level question
    opts: [[label, bool]]   // choices with correctness flag
  },
  rule: string,             // feedback explanation shown after answer
  trap: string|null,        // id of the confusable reaction (or null)

  // Enrichment fields (new - for richer feedback + future AI features)
  tier: "recognise"|"toggle"|"predict"|"reverse",  // primary difficulty tier
  firstMove: string,        // what to spot first in an exam question
  shortcut: string,         // memory hook / mnemonic
  whyTrapTempting: string,  // why students pick the wrong answer
  smiles: string|null       // SMILES string if structural specificity needed
}
```

Top-level `window.GAME_DATA` shape:
```js
{
  subject: string,          // e.g. "Alkene Additions"
  reactions: Reaction[],
  pool: ProdSpec[],         // distractor products for predict level
  levels: Level[]           // level definitions
}
```

---

## Task 1: Create content/alkenes.js

**Files:** Create `docs/games/alkene-arcade/content/alkenes.js`

- [ ] Write the file with `window.GAME_DATA` containing all 11 alkene reactions, pool, and levels extracted from the original inline RXN array.

---

## Task 2: Refactor engine to index.html

**Files:** Create `docs/games/alkene-arcade/index.html`

- [ ] Copy alkene-trainer.html to the new location
- [ ] Add `<script src="content/alkenes.js"></script>` before the main script
- [ ] Replace `const RXN = [...]` literal with `const RXN = window.GAME_DATA.reactions;`
- [ ] Replace `const POOL=[...]` literal with `const POOL = window.GAME_DATA.pool;`
- [ ] Replace `const LEVELS=[...]` literal with `const LEVELS = window.GAME_DATA.levels;`
- [ ] Update title to use `window.GAME_DATA.subject`

---

## Task 3: Converter script + CSV template

**Files:** Create `scripts/worksheet-to-game.js`, `scripts/templates/reactions.csv`

- [ ] Write converter (pure Node.js, no npm deps) that reads CSV, builds GAME_DATA object, writes content JS file
- [ ] Write CSV template with all 11 alkene reaction rows filled in

CSV columns: `id, name, reagents, tier, decision_q, choiceA, choiceA_correct, choiceB, choiceB_correct, choiceC, choiceC_correct, choiceD, choiceD_correct, prod_type, prod_c1, prod_c2, prod_stereo, rule, trap_id, firstMove, shortcut, whyTrapTempting, smiles`

Usage: `node scripts/worksheet-to-game.js reactions.csv --subject "Alkene Additions" --out content/alkenes.js`

---

## Task 4: Run converter, verify parity

- [ ] Run converter on the alkenes CSV
- [ ] Open index.html in browser, play L1 and L5, confirm identical to original

---

## Execution Handoff

Run inline using superpowers:executing-plans or subagent-driven-development.
