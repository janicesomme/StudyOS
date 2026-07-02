// AAMC FACTS Table A-23 fixtures, shaped to match the real 2023/2025 published
// workbooks (verified against actual files during ingest pipeline correction —
// the original hand-built fixtures assumed a wrong grid shape, see PLAN.md
// Risks). Built as 2D arrays matching what
// `XLSX.utils.sheet_to_json(sheet, {header: 1})` returns, so tests can feed them
// straight into `parseFactsGrid` without needing binary .xlsx files on disk.
//
// Real shape: a two-row header block (row label "Total MCAT Scores" / "All
// Applicants" total-column marker, then the actual band labels), followed by
// GPA-band groups of three rows each — "Acceptees", "Applicants", "Acceptance
// rate %" (derived, not stored) — ending with an "All Applicants" totals group.

export const happyPathGrid: unknown[][] = [
  ['Table A-23: MCAT and GPA Grid for Applicants and Acceptees to U.S. MD-Granting Medical Schools'],
  [],
  ['Acceptance Rate for Applicants', null, 'Total MCAT Scores', null, 'All Applicants'],
  [null, null, '510-513', '514-517', null],
  ['Total GPA', null, null, null, null],
  ['3.60-3.79', 'Acceptees', 20, 9, 29],
  [null, 'Applicants', 45, 15, 60],
  [null, 'Acceptance rate %', 44.4, 60, 48.3],
  ['3.40-3.59', 'Acceptees', 15, 4, 19],
  [null, 'Applicants', 35, 10, 45],
  [null, 'Acceptance rate %', 42.9, 40, 42.2],
  ['All Applicants', 'Acceptees', 35, 13, 48],
  [null, 'Applicants', 80, 25, 105],
  [null, 'Acceptance rate %', 43.75, 52, 45.7],
]

export const openEndedBandGrid: unknown[][] = [
  ['Table A-23: MCAT and GPA Grid for Applicants and Acceptees to U.S. MD-Granting Medical Schools'],
  [],
  ['Acceptance Rate for Applicants', null, 'Total MCAT Scores', null, 'All Applicants'],
  [null, null, 'Less \nthan 486', 'Greater \nthan 517', null],
  ['Total GPA', null, null, null, null],
  ['Greater than 3.79', 'Acceptees', 9, 43215, 43224],
  [null, 'Applicants', 320, 67816, 68136],
  [null, 'Acceptance rate %', 2.8, 63.7, 63.4],
  ['Less than 2.00', 'Acceptees', 0, 2, 2],
  [null, 'Applicants', 53, 88, 141],
  [null, 'Acceptance rate %', 0, 2.3, 1.4],
  ['All Applicants', 'Acceptees', 9, 43217, 43226],
  [null, 'Applicants', 373, 67904, 68277],
  [null, 'Acceptance rate %', 2.4, 63.6, 63.3],
]

export const suppressedCellGrid: unknown[][] = [
  ['Table A-23: MCAT and GPA Grid for Applicants and Acceptees to U.S. MD-Granting Medical Schools'],
  [],
  ['Acceptance Rate for Applicants', null, 'Total MCAT Scores', null, 'All Applicants'],
  [null, null, '510-513', '514-517', null],
  ['Total GPA', null, null, null, null],
  ['2.00-2.19', 'Acceptees', '-', null, 3],
  [null, 'Applicants', 14, null, 14],
  [null, 'Acceptance rate %', 0, 0, 21.4],
  ['All Applicants', 'Acceptees', '-', null, 3],
  [null, 'Applicants', 14, null, 14],
  [null, 'Acceptance rate %', 0, 0, 21.4],
]

export const blankRowInGrid: unknown[][] = [
  ['Table A-23: MCAT and GPA Grid for Applicants and Acceptees to U.S. MD-Granting Medical Schools'],
  [],
  ['Acceptance Rate for Applicants', null, 'Total MCAT Scores', null, 'All Applicants'],
  [null, null, '510-513', '514-517', null],
  ['Total GPA', null, null, null, null],
  ['3.60-3.79', 'Acceptees', 20, 9, 29],
  [null, 'Applicants', 45, 15, 60],
  [null, 'Acceptance rate %', 44.4, 60, 48.3],
  [null, null, null, null, null],
  ['3.40-3.59', 'Acceptees', 15, 4, 19],
  [null, 'Applicants', 35, 10, 45],
  [null, 'Acceptance rate %', 42.9, 40, 42.2],
  ['All Applicants', 'Acceptees', 35, 13, 48],
  [null, 'Applicants', 80, 25, 105],
  [null, 'Acceptance rate %', 43.75, 52, 45.7],
]

export const missingHeaderGrid: unknown[][] = [
  ['Table A-23: MCAT and GPA Grid for Applicants and Acceptees to U.S. MD-Granting Medical Schools'],
  [],
  ['This workbook does not have the expected band-labeled header row'],
  ['3.60-3.79', 'Acceptees', 20, 9, 29],
]

export const malformedCellGrid: unknown[][] = [
  ['Table A-23: MCAT and GPA Grid for Applicants and Acceptees to U.S. MD-Granting Medical Schools'],
  [],
  ['Acceptance Rate for Applicants', null, 'Total MCAT Scores', null, 'All Applicants'],
  [null, null, '510-513', '514-517', null],
  ['Total GPA', null, null, null, null],
  ['3.60-3.79', 'Acceptees', 20, 9, 29],
  [null, 'Applicants', 'forty-five', 15, 60],
]

export const applicantsWithoutAccepteesGrid: unknown[][] = [
  ['Table A-23: MCAT and GPA Grid for Applicants and Acceptees to U.S. MD-Granting Medical Schools'],
  [],
  ['Acceptance Rate for Applicants', null, 'Total MCAT Scores', null, 'All Applicants'],
  [null, null, '510-513', '514-517', null],
  ['Total GPA', null, null, null, null],
  [null, 'Applicants', 45, 15, 60],
]
