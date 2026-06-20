// Hint lookup for QuestionUnlockCard progressive reveal.
// Each pattern matches against question.questionType (case-insensitive).
// Hints remind students of the relevant rule from the Ch10 teaching map
// without revealing the specific answer to the textbook question.
// Source: docs/no-fear-ochem/ch10-teaching-map.md

type HintEntry = [pattern: RegExp, hint: string]

const HINT_TABLE: HintEntry[] = [
  // -- Module 1: formula / degrees of unsaturation --
  [
    /degrees of unsaturation|rings.*pi|pi.*bond possib/i,
    'Module 1: degrees = (2C + 2 + N - H - X) / 2. O is ignored; halogen counts as H; N subtracts one H. Each ring or pi bond is one degree.',
  ],

  // -- Module 1: naming from 3D model --
  [
    /iupac naming from 3d/i,
    'Module 1: convert the 3D model to a flat line structure first, then apply alkene IUPAC naming rules.',
  ],

  // -- Module 1: IUPAC naming (generic) --
  [
    /iupac naming|epoxide naming/i,
    'Module 1: find the parent chain that contains both double-bond carbons. Number from the end that gives C=C the lowest position.',
  ],

  // -- Module 1: draw from name --
  [
    /draw structure from iupac/i,
    'Module 1: read the name to find the parent chain length and double-bond position, then draw the chain and place substituents.',
  ],

  // -- Module 1: E/Z in complex or drug molecules --
  [
    /e\/z.*drug|drug.*e\/z|complex molecule/i,
    'Module 1: assign CIP priorities to each alkene carbon separately. Higher atomic number = higher priority. Same-side winners = Z, opposite = E.',
  ],

  // -- Module 1: E/Z assignment --
  [
    /e\/z assignment/i,
    'Module 1: assign CIP priorities to each group on each alkene carbon. Same-side priority winners = Z; opposite-side = E.',
  ],

  // -- Module 1 / 4: stereoisomer naming, drawing, classification --
  [
    /stereoiso|draw.*stereo|name.*stereo|draw\/name|name\/draw/i,
    'Module 1 / 4: identify whether each double bond is cis/trans or E/Z. For 3D products, draw flat first then add wedge/dash.',
  ],

  // -- Module 1: fatty acid / lipid stereo + melting point --
  [
    /fatty acid|lipid|melting point/i,
    'Cis double bonds kink the carbon chain and lower melting point. Trans double bonds are more linear and pack more tightly.',
  ],

  // -- Module 2 / 3: name alkene + halogen product (naming skill) --
  [
    /name alkene/i,
    'Module 1 / 3: first predict the product using the reaction rule, then apply IUPAC naming to the product structure.',
  ],

  // -- Module 2: compare hydration methods --
  [
    /compare hydration/i,
    'Module 2: acid hydration (H2O/H2SO4) puts OH on the MORE substituted carbon. Hydroboration (BH3/H2O2) puts OH on the LESS substituted carbon. They also differ in stereochemistry.',
  ],

  // -- Module 2: hydroboration / 9-BBN --
  [
    /hydroboration|bh3|9-bbn/i,
    'Module 2: hydroboration adds OH to the LESS substituted carbon (anti-Markovnikov). The reaction is syn and does not rearrange.',
  ],

  // -- Module 2: acid-catalyzed alcohol / ether addition --
  [
    /alcohol addition|ror|ether/i,
    'Module 2: ROH/H2SO4 adds OR instead of OH. Use Markovnikov -- OR goes to the more substituted carbon.',
  ],

  // -- Module 0 / 2: HBr / HI / HX products --
  [
    /\bhbr\b|hbr addition|product prediction.*hbr|constitutional.*hcl|constitutional.*hbr|predict.*hcl|hcl addition/i,
    'Module 0 / 2: HX adds H and X across the double bond. Apply Markovnikov to decide which carbon gets H and which gets X.',
  ],

  // -- Module 0 / 2: acid hydration, H2SO4 + H2O --
  [
    /acid hydration|h2o.*h2so4|constitutional.*h2o|constitutional.*bh3/i,
    'Module 0 / 2: H and OH add across the double bond. Use Markovnikov -- OH goes to the MORE substituted carbon for acid hydration.',
  ],

  // -- Module 3: NBS / bromohydrin conditions --
  [
    /nbs/i,
    'Module 3: NBS/H2O acts like bromohydrin conditions -- think bridge mechanism. Br and OH add anti.',
  ],

  // -- Module 3: halohydrin / Br2/H2O / Cl2/H2O --
  [
    /br2.*h2o|cl2.*h2o|halohydrin|bromohydrin/i,
    'Module 3: Br2 (or Cl2) + H2O = halohydrin conditions. Halogen and OH add anti across the double bond.',
  ],

  // -- Module 3: Br2 / Cl2 / anti halogenation --
  [
    /\bbr2\b|\bcl2\b|anti halogenation|reverse anti halo/i,
    'Module 3: Br2 (or Cl2) = bridge reaction. Two identical halogen atoms add anti across the double bond. No rearrangement.',
  ],

  // -- Module 4: stereochemistry in products --
  [
    /including stereoisomers|draw all stereoisomers/i,
    'Module 4: identify the reaction type first (syn, anti, or free rotation). Draw the flat product, then add wedge/dash for the 3D result.',
  ],

  // -- Module 4 / 1: stability of bridged alkenes --
  [
    /stability|bridged.*alkene|cyclic alkene/i,
    'Consider ring strain and pi orbital alignment. Bridged systems can prevent proper p-orbital overlap across the double bond.',
  ],

  // -- Module 5: rate / regioselectivity explanation --
  [
    /rate comparison|explain regioselect/i,
    'Module 5: consider the stability of the intermediate. More substituted carbocations are more stable and form faster.',
  ],

  // -- Module 5: rearrangement / ring expansion mechanisms --
  [
    /rearrangement|ring expansion|isomerization.*mechanism|acid isomeriz/i,
    'Module 5: identify the carbocation formed after the first step. If a more stable carbocation is available via hydride or methyl shift, rearrangement can occur.',
  ],

  // -- Module 5: iodolactonization / bromoetherification --
  [
    /iodolactonization|bromoetherification|intramolecular/i,
    'Module 5: identify the internal nucleophile -- the lone pair that closes the ring. Draw the open-chain carbocation or bridge intermediate first.',
  ],

  // -- Module 5: mechanisms (generic) --
  [
    /mechanism|stepwise|carbocation electrophile|epoxide opening/i,
    'Module 5: start each curved arrow where the electrons are. Identify the nucleophile (electron-rich) and electrophile (electron-poor) for each step.',
  ],

  // -- Module 6: synthesis / retrosynthesis --
  [
    /synthesis|find multiple alkenes|target.*alkyl|backwards alkene/i,
    'Module 6: work backward from the product. What two groups were added across the alkene? That tells you the reagent family to use.',
  ],

  // -- Module 7 / spectroscopy --
  [
    /nmr|spectroscopy/i,
    'Module 7: use NMR data to count distinct carbons and identify functional groups. Work backward from the spectrum to the structure.',
  ],
]

const FALLBACK_HINT =
  'Identify the reactive functional group and the reagent family from the question before consulting the scaffold.'

export function getFirstHint(questionType: string): string {
  for (const [pattern, hint] of HINT_TABLE) {
    if (pattern.test(questionType)) return hint
  }
  return FALLBACK_HINT
}
