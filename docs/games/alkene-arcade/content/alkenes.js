window.GAME_DATA = {
  "subject": "Alkene Additions",
  "reactions": [
    {
      "id": "stability_rank_mc_1",
      "name": "Alkene Stability: Most Stable Structure",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Which one of the following alkenes is the most stable? (A) 2-methylenecyclobutane (trisubstituted-like, branched terminal), (B) (E)-2,3-dimethyl-2-butene (tetrasubstituted), (C) (Z)-2-methyl-2-butene (trisubstituted), (D) 2-methyl-1-butene (disubstituted/monosubstituted mix)",
        "opts": [
          [
            "(A) 2-methylenecyclobutane — branched terminal alkene",
            false
          ],
          [
            "(B) (E)-2,3-dimethyl-2-butene — tetrasubstituted internal alkene",
            true
          ],
          [
            "(C) (Z)-2-methyl-2-butene — trisubstituted internal alkene",
            false
          ],
          [
            "(D) 2-methyl-1-butene with ethyl group — disubstituted alkene",
            false
          ]
        ]
      },
      "rule": "Stability increases with degree of substitution. The tetrasubstituted alkene (B) has the most alkyl groups on the double bond carbons, providing maximum hyperconjugation and inductive stabilization, making it the most stable.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Count the number of alkyl groups directly attached to each C=C carbon",
      "shortcut": "Tetrasubstituted > trisubstituted > disubstituted > monosubstituted",
      "whyTrapTempting": "Students may pick (C) because trisubstituted looks 'almost as good', or confuse the branched terminal structure (A) for a highly substituted alkene",
      "smiles": null
    },
    {
      "id": "syn_addition_id_1",
      "name": "Syn Addition Identification",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Which of the following are examples of syn addition to an alkene?",
        "opts": [
          [
            "Hydrogenation and hydration",
            false
          ],
          [
            "Hydrobromination and hydroboration",
            false
          ],
          [
            "Hydration and hydrobromination",
            false
          ],
          [
            "Hydrogenation and hydroboration",
            true
          ]
        ]
      },
      "rule": "Syn addition means both atoms/groups add to the same face of the double bond. H2/Pt (hydrogenation) delivers both H atoms from the same catalyst surface (syn). Hydroboration (BH3) also adds B and H in a syn concerted fashion. Hydrobromination (HBr) and acid-catalyzed hydration both go through carbocation intermediates allowing anti or mixed addition.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Ask: does this reaction go through a carbocation or a concerted cyclic transition state?",
      "shortcut": "Concerted or surface-delivered = syn; carbocation intermediate = not stereospecific",
      "whyTrapTempting": "Hydration and hydrobromination both add two groups across the double bond, so students incorrectly categorize them as syn",
      "smiles": null
    },
    {
      "id": "stability_order_5comp_1",
      "name": "Alkene Stability Ranking — Five Compounds",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Rank these alkenes from least to most stable: (a) 1-octene, (b) 1,2-dimethylcyclohexene, (c) 3-methylpent-2-ene, (d) (E)-2-heptene, (e) (Z)-2-heptene. Which order is correct?",
        "opts": [
          [
            "a < e < d < c < b",
            true
          ],
          [
            "a < d < e < c < b",
            false
          ],
          [
            "e < a < d < c < b",
            false
          ],
          [
            "a < e < c < d < b",
            false
          ]
        ]
      },
      "rule": "Order (least to most stable): a (monosubstituted) < e (Z-disubstituted, steric strain) < d (E-disubstituted) < c (trisubstituted) < b (tetrasubstituted, cyclic). Z isomers are slightly less stable than E due to steric clash of alkyl groups on same side.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Classify each by substitution count first, then break ties using E vs Z geometry",
      "shortcut": "More substituted = more stable; E more stable than Z when substituents are similar",
      "whyTrapTempting": "Students often treat E and Z as equally stable and fail to place Z below E in the ranking",
      "smiles": null
    },
    {
      "id": "hydrogenation_energy_release_1",
      "name": "Most Energy Released on Hydrogenation",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Among 1-octene, 1,2-dimethylcyclohexene, 3-methylpent-2-ene, (E)-2-heptene, and (Z)-2-heptene, which releases the most energy upon hydrogenation?",
        "opts": [
          [
            "1-octene — least stable alkene",
            true
          ],
          [
            "(Z)-2-heptene — strained Z isomer",
            false
          ],
          [
            "1,2-dimethylcyclohexene — most stable alkene",
            false
          ],
          [
            "3-methylpent-2-ene — trisubstituted",
            false
          ]
        ]
      },
      "rule": "The least stable alkene sits at the highest energy and releases the most heat on hydrogenation (all alkenes give the same alkane product). 1-octene is monosubstituted — the least stable — so it releases the most energy.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Flip the stability ranking: least stable alkene = highest heat of hydrogenation",
      "shortcut": "Heat of hydrogenation is inversely related to alkene stability",
      "whyTrapTempting": "Students confuse 'most energy released' with 'most stable' and pick 1,2-dimethylcyclohexene",
      "smiles": null
    },
    {
      "id": "diene_hydrogenation_rank_1",
      "name": "Diene Stability Ranking by Heat of Hydrogenation",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Three cyclohexadiene isomers are labeled A (cross-conjugated/isolated dienes attached to benzene-like ring), B (similar), and C (conjugated). Rank them in order of increasing heat of hydrogenation (lowest to highest). The answer image shows A < C < B.",
        "opts": [
          [
            "A < C < B (A most stable, B least stable)",
            true
          ],
          [
            "B < C < A",
            false
          ],
          [
            "C < A < B",
            false
          ],
          [
            "A < B < C",
            false
          ]
        ]
      },
      "rule": "Conjugated dienes are more stable than isolated dienes due to delocalization, so they have lower heats of hydrogenation. The ordering reflects degree of conjugation and substitution: A (most conjugated/stable, lowest heat of hydrogenation) < C < B (least stable, highest heat of hydrogenation).",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify which diene is conjugated vs isolated, then apply the stability rule",
      "shortcut": "Conjugated diene = extra stabilization = lower heat of hydrogenation",
      "whyTrapTempting": "Students confuse 'increasing heat of hydrogenation' with the stability order and reverse the ranking",
      "smiles": null
    },
    {
      "id": "markovnikov_hbr_vinyl_ether_1",
      "name": "Regioselective HBr Addition — Vinyl Ether",
      "reagents": "HBr",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "An alkene with an OCH3 group (vinyl-type ether, e.g. but-1-en-2-yl methyl ether) reacts with HBr. The OCH3 group stabilizes an adjacent carbocation by resonance. Which product is the only one formed?",
        "opts": [
          [
            "Br on the carbon bearing OCH3 (Markovnikov-like, carbon away from O gets H)",
            false
          ],
          [
            "Br on the carbon NOT bearing OCH3 (resonance-stabilized carbocation at OCH3 carbon directs Br there)",
            false
          ],
          [
            "Br on the internal carbon adjacent to OCH3 — resonance stabilizes the carbocation at that position, Br attacks there",
            true
          ],
          [
            "A mixture of both regioisomers in equal amounts",
            false
          ]
        ]
      },
      "rule": "The OCH3 oxygen lone pairs stabilize an adjacent carbocation by resonance donation (oxocarbenium ion). H+ adds to the terminal carbon, generating the resonance-stabilized carbocation at the OCH3-bearing carbon. Br- then attacks that carbon. This is still Markovnikov addition but governed by resonance, not induction.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Draw both possible carbocations and check which is stabilized by the oxygen lone pairs",
      "shortcut": "O lone pairs = oxocarbenium resonance stabilization always wins over inductive effects",
      "whyTrapTempting": "Students apply simple Markovnikov (H to less substituted) without considering O resonance donation, predicting the wrong regiochemistry",
      "smiles": "C=CC(=C)OCCC"
    },
    {
      "id": "hbr_2methyl2butene_markov_1",
      "name": "HBr Addition to 2-Methyl-2-Butene — Product Identification",
      "reagents": "HBr, low temp.",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "2-Methyl-2-butene reacts with HBr at low temperature (no peroxide). What is the major product?",
        "opts": [
          [
            "2-bromo-2-methylbutane (Br on the more substituted carbon, Markovnikov)",
            true
          ],
          [
            "1-bromo-2-methylbutane (Br on the less substituted carbon)",
            false
          ],
          [
            "3-bromo-3-methylbutane",
            false
          ],
          [
            "A mixture of all possible bromides",
            false
          ]
        ]
      },
      "rule": "HBr without peroxide follows Markovnikov's rule: H adds to the less substituted carbon, Br adds to the more substituted (more stable tertiary) carbocation carbon. Product is 2-bromo-2-methylbutane.",
      "trap": "hbr_no_peroxide_predict_1",
      "tier": "toggle",
      "firstMove": "Identify the more substituted carbon of the C=C; that is where Br goes",
      "shortcut": "No peroxide = Markovnikov = Br to more substituted carbon",
      "whyTrapTempting": "Students confuse the peroxide (anti-Markovnikov) and non-peroxide conditions, or miscount substitution",
      "smiles": "CC(=C(C)C)C"
    },
    {
      "id": "h2_hydrogenation_2methyl2butene_1",
      "name": "Hydrogenation of 2-Methyl-2-Butene",
      "reagents": "H2/Pt",
      "prod": {
        "type": "alkane"
      },
      "decision": {
        "q": "2-Methyl-2-butene reacts with H2 over a Pt catalyst. What is the product?",
        "opts": [
          [
            "2-methylbutane (the alkane)",
            true
          ],
          [
            "2-methyl-2-butanol",
            false
          ],
          [
            "3-methylbutanal",
            false
          ],
          [
            "No reaction",
            false
          ]
        ]
      },
      "rule": "H2/Pt catalytic hydrogenation adds two H atoms syn across the double bond, converting the alkene to an alkane. 2-methyl-2-butene gives 2-methylbutane.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify that H2/metal catalyst = hydrogenation = alkane product",
      "shortcut": "H2/Pt always gives the alkane; no regiochemistry question, just add H to each C of C=C",
      "whyTrapTempting": "Students confuse H2/Pt with acid-catalyzed hydration (H2O/H+) which gives an alcohol",
      "smiles": "CC(=C(C)C)C"
    },
    {
      "id": "hbr_peroxide_2methyl2butene_1",
      "name": "Anti-Markovnikov HBr Addition (Peroxide) to 2-Methyl-2-Butene",
      "reagents": "HBr, dimethyl peroxide",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "2-Methyl-2-butene reacts with HBr in the presence of dimethyl peroxide. What is the major product?",
        "opts": [
          [
            "2-bromo-2-methylbutane (Markovnikov product)",
            false
          ],
          [
            "3-bromo-2-methylbutane (anti-Markovnikov: Br to less substituted carbon via radical)",
            true
          ],
          [
            "1-bromo-2-methylbutane",
            false
          ],
          [
            "A 1:1 mixture of both regioisomers",
            false
          ]
        ]
      },
      "rule": "Peroxides initiate a radical chain mechanism. Br radical adds to the less hindered (less substituted) carbon, generating the more stable tertiary radical intermediate. H then adds to the other carbon. Net result is anti-Markovnikov: Br ends up on the less substituted carbon.",
      "trap": "hbr_2methyl2butene_markov_1",
      "tier": "toggle",
      "firstMove": "See 'peroxide' and switch to radical mechanism: Br goes to less substituted carbon",
      "shortcut": "Peroxide = radical = anti-Markovnikov = Br to less substituted C",
      "whyTrapTempting": "Students forget to flip the regiochemistry when peroxide is present and apply normal Markovnikov rules",
      "smiles": "CC(=C(C)C)C"
    },
    {
      "id": "ozonolysis_2methyl2butene_1",
      "name": "Ozonolysis of 2-Methyl-2-Butene (Reductive)",
      "reagents": "i) O3; ii) Zn/H2O",
      "prod": {
        "type": "cleave"
      },
      "decision": {
        "q": "2-Methyl-2-butene undergoes ozonolysis with reductive workup (Zn/H2O). What are the two carbonyl products?",
        "opts": [
          [
            "Acetone and acetaldehyde (propan-2-one and ethanal)",
            true
          ],
          [
            "Two molecules of acetone",
            false
          ],
          [
            "Acetaldehyde and formaldehyde",
            false
          ],
          [
            "Propanal and formaldehyde",
            false
          ]
        ]
      },
      "rule": "Ozonolysis cleaves the C=C bond. Each carbon of the double bond becomes a carbonyl. The more substituted carbon (bearing two CH3) gives acetone; the less substituted carbon (bearing CH3 and H) gives acetaldehyde. Reductive workup (Zn) gives aldehydes/ketones not carboxylic acids.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Break the C=C bond; assign =O to each fragment carbon and check what substituents remain",
      "shortcut": "C bearing two carbons → ketone; C bearing one carbon and one H → aldehyde",
      "whyTrapTempting": "Students treat both sides symmetrically and predict two ketones or fail to recognize the asymmetry",
      "smiles": "CC(=C(C)C)C"
    },
    {
      "id": "isolated_vs_conjugated_diene_hoh_1",
      "name": "Heat of Hydrogenation: Isolated vs Conjugated Diene",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Which compound has the higher heat of hydrogenation: (E)-1,4-hexadiene (isolated diene) or (E,E)-2,4-hexadiene (conjugated diene)?",
        "opts": [
          [
            "(E)-1,4-hexadiene — isolated diene, higher heat of hydrogenation",
            true
          ],
          [
            "(E,E)-2,4-hexadiene — conjugated diene, higher heat of hydrogenation",
            false
          ],
          [
            "Both have the same heat of hydrogenation",
            false
          ],
          [
            "Cannot be determined without experimental data",
            false
          ]
        ]
      },
      "rule": "(E)-1,4-hexadiene is an isolated diene — its two double bonds behave independently and there is no resonance delocalization. (E,E)-2,4-hexadiene is a conjugated diene with pi orbital overlap across both double bonds, which lowers its energy. The isolated diene is less stable, so it releases more energy on hydrogenation.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify isolated vs conjugated, then recall that lower stability = higher heat of hydrogenation",
      "shortcut": "Isolated diene = no conjugation stabilization = higher heat of hydrogenation",
      "whyTrapTempting": "Students see 'conjugated' and associate it with 'more reactive' or 'higher energy', incorrectly predicting higher heat of hydrogenation for the conjugated diene",
      "smiles": null
    },
    {
      "id": "cyclopentadiene_equilibrium_temp_1",
      "name": "Cyclopentadiene Dimerization Equilibrium and Temperature",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Cyclopentadiene dimerizes to dicyclopentadiene (2 pi bonds broken, 2 sigma bonds formed). If temperature is increased, which way does the equilibrium shift?",
        "opts": [
          [
            "Shift right — more dicyclopentadiene forms",
            false
          ],
          [
            "Shift left — more cyclopentadiene forms",
            true
          ],
          [
            "Remain unchanged",
            false
          ],
          [
            "Both cyclopentadiene and dicyclopentadiene increase",
            false
          ]
        ]
      },
      "rule": "Forming sigma bonds releases heat (dimerization is exothermic). By Le Chatelier's principle, increasing temperature shifts an exothermic equilibrium to the left (toward reactants). More cyclopentadiene monomer forms at higher temperature.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Determine if dimerization is exo- or endothermic (sigma bonds form = exothermic), then apply Le Chatelier",
      "shortcut": "Exothermic reaction + increase T = shift left (toward reactants)",
      "whyTrapTempting": "Students think 'more heat = more reaction' and predict the equilibrium shifts right, forgetting Le Chatelier's principle",
      "smiles": null
    },
    {
      "id": "br2_cyclopentene_mechanism_stereo_1",
      "name": "Bromination of Cyclopentene — Mechanism and Stereochemical Outcome",
      "reagents": "Br2",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Three mechanisms are proposed for Br2 addition to cyclopentene. Mechanism I: concerted syn addition. Mechanism II: flat carbocation intermediate (not bridged). Mechanism III: bromonium ion intermediate. What stereochemical outcome does each predict for 1,2-dibromocyclopentane?",
        "opts": [
          [
            "Mech I = trans, Mech II = trans & cis, Mech III = cis",
            false
          ],
          [
            "Mech I = cis, Mech II = trans, Mech III = trans",
            false
          ],
          [
            "Mech I = cis, Mech II = trans & cis, Mech III = trans",
            true
          ],
          [
            "Mech I = cis, Mech II = trans & cis, Mech III = trans & cis",
            false
          ]
        ]
      },
      "rule": "Concerted syn addition (Mech I) gives the cis product (both Br on same face). A flat carbocation (Mech II) has no face selectivity — nucleophile can attack from either side, giving a mixture. A bromonium bridge (Mech III) locks the geometry and forces anti attack by Br-, giving exclusively trans product. The actual mechanism is III (bromonium ion) giving trans product.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "For each mechanism, ask: does it force both Brs to the same face (syn→cis) or opposite faces (anti→trans) or neither (mixture)?",
      "shortcut": "Bromonium ion = anti addition = trans product in cyclic systems",
      "whyTrapTempting": "Students confuse 'anti addition' with cis product, forgetting that in a ring, anti addition across the ring gives the trans (opposite face) diastereomer",
      "smiles": "C1=CCCC1"
    },
    {
      "id": "reaction_coord_2ts_mechanism_1",
      "name": "Reaction Coordinate Diagram — Two Transition States",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "A reaction coordinate diagram shows two energy humps (two transition states) with a dip between them (an intermediate). Which of the mechanisms for Br2 addition to cyclopentene (I: concerted; II: flat carbocation; III: bromonium ion) could have a similar diagram?",
        "opts": [
          [
            "I only",
            false
          ],
          [
            "II only",
            false
          ],
          [
            "III only",
            false
          ],
          [
            "II and III",
            true
          ]
        ]
      },
      "rule": "A diagram with two transition states and one intermediate indicates a two-step mechanism. Mechanism I is concerted (one step, one TS). Mechanisms II and III both involve a discrete intermediate (carbocation or bromonium ion) with two transition states. Both II and III match the diagram.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Count the humps: two humps = two TSs = two-step mechanism = an intermediate exists",
      "shortcut": "Two TS humps = stepwise mechanism with intermediate; concerted = one hump only",
      "whyTrapTempting": "Students only associate bromonium ion with two steps and forget the flat carbocation (Mech II) is also a two-step mechanism",
      "smiles": null
    },
    {
      "id": "c7_alkene_stability_most_energy_formation_1",
      "name": "C7 Alkene: Most Energy Released on Formation from Elements",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "A set of C7 alkene isomers is given: A (tetrasubstituted, 2,3-dimethyl-2-pentene type), B (di-trans, (E)-hept-2-ene type), C (di-cis, (Z)-hept-2-ene type), D (monosubstituted, hept-1-ene type), E (trisubstituted). Which releases the most energy on formation from its elements?",
        "opts": [
          [
            "A — tetrasubstituted alkene (most stable)",
            true
          ],
          [
            "B — E-disubstituted",
            false
          ],
          [
            "D — monosubstituted (least stable)",
            false
          ],
          [
            "E — trisubstituted",
            false
          ]
        ]
      },
      "rule": "Formation of the most stable alkene from elements releases the most energy (it sits at the lowest energy level). The tetrasubstituted alkene (A) is the most stable, so its formation from elements is most exothermic. Note: this is the opposite logic from heat of hydrogenation — here we compare to the elements (not the alkane).",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Most stable alkene = lowest energy = largest negative enthalpy of formation = most energy released",
      "shortcut": "Formation from elements: most stable product = most energy released. Hydrogenation: least stable reactant = most energy released.",
      "whyTrapTempting": "Students apply the hydrogenation logic (least stable = most energy) and pick D (monosubstituted), forgetting the direction of comparison is reversed for formation",
      "smiles": null
    },
    {
      "id": "retrosynthesis_hbr_alkene_choice_1",
      "name": "Retrosynthesis: Which Alkene Gives 2-Bromo-2-Methylpentane with HBr",
      "reagents": "HBr",
      "prod": {
        "type": "add",
        "c1": "2-bromo-2-methylpentane"
      },
      "decision": {
        "q": "You want to make 2-bromo-2-methylpentane using HBr. Three alkenes are available: A (4-methyl-1-pentene), B (2-methyl-1-pentene), C (2-methyl-2-pentene). Which alkene(s) can give the desired product?",
        "opts": [
          [
            "A only",
            false
          ],
          [
            "B only",
            false
          ],
          [
            "C only",
            false
          ],
          [
            "B and C",
            true
          ]
        ]
      },
      "rule": "Apply Markovnikov: H adds to the less substituted C, Br to the more substituted C. Alkene A (4-methyl-1-pentene) places Br at C1 of the 4-methyl chain, giving 1-bromo-4-methylpentane (wrong carbon skeleton relationship). Alkene B (2-methyl-1-pentene) places Br at C2 (tertiary), giving 2-bromo-2-methylpentane — correct. Alkene C (2-methyl-2-pentene) places Br at C2 (tertiary), also giving 2-bromo-2-methylpentane — correct.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Work backwards: put the Br on the tertiary C, then remove HBr to find which alkene(s) could be precursors",
      "shortcut": "Two alkenes can give the same Markovnikov product if both have the same more-substituted carbon",
      "whyTrapTempting": "Students only consider one precursor alkene and miss that both B and C satisfy Markovnikov conditions for the same carbon",
      "smiles": null
    },
    {
      "id": "ez_label_fluoroalkene_1",
      "name": "E/Z Assignment — Fluorine-Containing Alkene",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "The alkene H3C-C(F)=C(CH3)(CH2CH3) — one carbon bears F and CH3; other bears CH3 and Et. What is the E/Z designation?",
        "opts": [
          [
            "E",
            false
          ],
          [
            "Z",
            true
          ],
          [
            "Neither (symmetric substituents)",
            false
          ],
          [
            "Cannot be determined",
            false
          ]
        ]
      },
      "rule": "Assign CIP priorities at each carbon. On the F-bearing carbon: F > CH3. On the other carbon: the higher-priority group is determined by CIP rules. When both higher-priority groups are on the same side, it is Z. The answer image assigns Z.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Assign CIP priorities at each doubly-bonded carbon independently, then check if high-priority groups are same side (Z) or opposite (E)",
      "shortcut": "F has highest atomic number among common substituents — always wins priority",
      "whyTrapTempting": "Students assign priority alphabetically or by largest group by mass rather than CIP atomic number rules",
      "smiles": "F/C(=C(\\C)CC)/C"
    },
    {
      "id": "ez_label_same_groups_1",
      "name": "E/Z Assignment — Symmetric Substituents",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "An alkene has the same two groups on each doubly-bonded carbon (both carbons bear two identical substituents, e.g. two methyl groups on each). What is the E/Z designation?",
        "opts": [
          [
            "E",
            false
          ],
          [
            "Z",
            false
          ],
          [
            "Neither — cannot assign E/Z when two substituents on one carbon are identical",
            true
          ],
          [
            "Both E and Z apply",
            false
          ]
        ]
      },
      "rule": "E/Z designation requires each doubly-bonded carbon to have two DIFFERENT substituents. If one carbon has two identical groups, there is no geometric isomerism and the molecule cannot be labeled E or Z.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Check: does each C of C=C have two different groups? If not, E/Z cannot be assigned",
      "shortcut": "Identical substituents on one carbon = 'neither'; do not force E or Z",
      "whyTrapTempting": "Students try to assign E or Z by looking at the other carbon only, ignoring the requirement that both carbons must have distinct substituents",
      "smiles": "CC(=C(C)C)C"
    },
    {
      "id": "ez_label_br_cho_alkene_1",
      "name": "E/Z Assignment — Br/CHO Alkene",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "An alkene has Br and CHO on one carbon and Br and a hydroxymethyl-isobutyl group on the other. The answer image assigns E. What is the E/Z designation?",
        "opts": [
          [
            "E — higher priority groups on opposite sides",
            true
          ],
          [
            "Z — higher priority groups on same side",
            false
          ],
          [
            "Neither",
            false
          ],
          [
            "Cannot be determined",
            false
          ]
        ]
      },
      "rule": "Apply CIP priorities at each carbon of the C=C. Br (atomic number 35) outranks C-groups. When the two higher-priority groups (Br on each carbon) are on opposite sides of the double bond, the designation is E.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Locate Br on each carbon first — Br is always the highest priority among the common groups shown",
      "shortcut": "If both Br atoms are trans to each other (opposite sides), label is E",
      "whyTrapTempting": "Students may get confused by the complex substituents and incorrectly assess which group has higher priority on the Br-bearing carbon",
      "smiles": "Br/C(=C(/Br)CO)CC(C)C"
    },
    {
      "id": "ez_identification_1",
      "name": "E/Z Alkene Identification",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Which of these is an E alkene? (Five alkenes are shown: A = F and Br on same carbon with H and CH3; B = two methyl-substituted alkene; C = Cl and CO2H vs F and CH3; D = H and CHO vs Br and CH2OH; E = Br and Cl vs F and H)",
        "opts": [
          [
            "A: (F, Br on one carbon; H, CH3 on the other) — labeled Z",
            false
          ],
          [
            "B: disubstituted alkene with two methyl groups — labeled Z",
            false
          ],
          [
            "C: Cl/CO2H vs F/CH3 — labeled Z",
            false
          ],
          [
            "D: H/CHO vs Br/CH2OH (circled as correct)",
            true
          ]
        ]
      },
      "rule": "Assign CIP priorities to each carbon of the double bond. On each carbon, if the higher-priority groups are on opposite sides the alkene is E. In D, CHO outranks H and Br-CH2OH outranks Br, and these high-priority groups are on opposite sides — E.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Assign CIP priority to each substituent on each double-bond carbon separately.",
      "shortcut": "E = higher-priority groups on opposite sides (like trans but uses CIP rules, not size).",
      "whyTrapTempting": "Students use 'trans' intuition and assume larger groups opposite = E, but when heteroatoms shift priorities the visual appearance can be misleading.",
      "smiles": null
    },
    {
      "id": "stability_rank_1",
      "name": "Most Stable Alkene Among Isomers",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Select the most stable alkene in this set of isomers. (Five structural isomers are shown: A = disubstituted trans, B = trisubstituted, C = monosubstituted, D = disubstituted cis, E = disubstituted with gem pattern)",
        "opts": [
          [
            "A: disubstituted trans alkene",
            false
          ],
          [
            "B: trisubstituted alkene (circled as correct)",
            true
          ],
          [
            "C: monosubstituted alkene",
            false
          ],
          [
            "D: disubstituted cis alkene",
            false
          ]
        ]
      },
      "rule": "Alkene stability increases with more alkyl substituents on the double bond. Trisubstituted > disubstituted trans > disubstituted cis > monosubstituted > unsubstituted. B (trisubstituted) is most stable.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Count the number of alkyl groups directly attached to the two double-bond carbons.",
      "shortcut": "More substitution = more hyperconjugation = lower energy = more stable.",
      "whyTrapTempting": "Students pick the trans isomer (A) because 'trans is more stable than cis', forgetting that substitution count ranks higher than cis/trans geometry.",
      "smiles": null
    },
    {
      "id": "degrees_unsat_c8h9n",
      "name": "Degrees of Unsaturation: C8H9N",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "How many elements of unsaturation are in the formula C8H9N?",
        "opts": [
          [
            "0",
            false
          ],
          [
            "1",
            false
          ],
          [
            "2",
            false
          ],
          [
            "5",
            true
          ]
        ]
      },
      "rule": "For CnHmNp: EU = (2n + 2 + p - m) / 2. For C8H9N: (2x8 + 2 + 1 - 9) / 2 = (16 + 2 + 1 - 9) / 2 = 10/2 = 5. The answer shown is f. 5, with work (18+1)-9 = 10H deficit, then /2 = 5.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Write the formula for EU and note that N adds 1 to the numerator (like adding an H), while O has no effect.",
      "shortcut": "(2C + 2 + N - H) / 2. Nitrogen adds one, halogens subtract one, oxygen is ignored.",
      "whyTrapTempting": "Students often subtract N instead of adding it, or forget to add N at all, giving EU = 4 instead of 5.",
      "smiles": null
    },
    {
      "id": "iupac_name_cyclohexene_bromo",
      "name": "IUPAC Name: Bromo-methylcyclohexene",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the proper IUPAC name for the cyclic alkene shown (cyclohexene ring with Br substituent and a CH3 group)?",
        "opts": [
          [
            "1-bromo-6-methylcyclohex-2-ene",
            false
          ],
          [
            "6-bromo-1-methylcyclohex-1-ene",
            false
          ],
          [
            "6-bromo-1-methylcyclohexene",
            true
          ],
          [
            "2-bromo-1-methylcyclohexene",
            false
          ]
        ]
      },
      "rule": "The double bond carbons get the lowest possible numbers (C1 and C2). The CH3 group is at C1 (the carbon bearing the methyl). Br is on C6. Name: 6-bromo-1-methylcyclohexene.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Start numbering at a double-bond carbon, choose direction to give substituents the lowest locants.",
      "shortcut": "In cycloalkenes, the double bond is always at C1-C2; choose numbering direction to minimise substituent numbers.",
      "whyTrapTempting": "Students number the ring in the wrong direction, placing Br at C2 instead of C6, or misplace the methyl anchor carbon.",
      "smiles": "BrC1CCCC=C1C"
    },
    {
      "id": "iupac_name_chloropentene_ez",
      "name": "IUPAC Name with E/Z: Chloropentene",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the proper IUPAC name for the alkene shown? (Structure: ClCH2CH2 on one side, CH3 on the other, both H on each double-bond carbon — Z configuration)",
        "opts": [
          [
            "(E)-5-chloropent-2-ene",
            false
          ],
          [
            "(Z)-5-chloropent-2-ene",
            true
          ],
          [
            "(Z)-5-chloro-2-pentene",
            false
          ],
          [
            "cis-5-chloro-2-pentene (acceptable alternate)",
            false
          ]
        ]
      },
      "rule": "The parent chain is pent-2-ene; Cl is at C5. The ClCH2CH2 chain has higher CIP priority than H on C3, and CH3 has higher priority than H on C2. Both high-priority groups are on the same side: Z. Preferred IUPAC: (Z)-5-chloropent-2-ene.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Number the chain to give the double bond the lowest locant; assign CIP priorities to determine E/Z.",
      "shortcut": "When one double-bond carbon bears H and an alkyl and the other bears H and a chain with Cl, use CIP not 'cis/trans' — Cl outranks C.",
      "whyTrapTempting": "Students call it (E) because the Cl-chain and CH3 look 'trans' spatially, but CIP priorities make it Z.",
      "smiles": "ClCC/C=C/C"
    },
    {
      "id": "most_stable_alkene_hexene",
      "name": "Most Stable Alkene: Hexene Isomers",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Choose the most stable alkene among the following.",
        "opts": [
          [
            "1-hexene",
            false
          ],
          [
            "(E)-2-hexene",
            true
          ],
          [
            "(Z)-2-hexene",
            false
          ],
          [
            "They are all of equal stability according to Saytzeff's rule",
            false
          ]
        ]
      },
      "rule": "(E)-2-hexene is disubstituted and trans; (Z)-2-hexene is disubstituted but cis (slight steric destabilisation); 1-hexene is monosubstituted. More substitution = more stable; trans > cis for same substitution count. Answer: (E)-2-hexene.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Count substituents on the double bond, then compare E vs Z for same substitution level.",
      "shortcut": "Rank: trisubst > disubst-trans > disubst-cis > monosubst.",
      "whyTrapTempting": "Choice d is tempting because students confuse Saytzeff's rule (about elimination regiochemistry) with alkene thermodynamic stability ranking.",
      "smiles": null
    },
    {
      "id": "ez_cyclopentene_ch3_cl",
      "name": "E/Z Classification of Exocyclic Alkene (Cyclopentene with CH3 and Cl)",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Which of the following best describes the geometry about the carbon-carbon double bond in the alkene shown (cyclopentane ring with exocyclic double bond bearing CH3 and Cl substituents)?",
        "opts": [
          [
            "E",
            false
          ],
          [
            "Z",
            false
          ],
          [
            "Neither E nor Z",
            true
          ]
        ]
      },
      "rule": "The ring carbon of the double bond bears two ring carbons as substituents — both ring carbons are identical (same connectivity within the ring symmetry), so there are two identical substituents on that carbon. E/Z designation requires two different substituents on each double-bond carbon. When two substituents are the same on one carbon, E/Z cannot be assigned.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Check whether each double-bond carbon has two different substituents. If one carbon has two identical groups, E/Z does not apply.",
      "shortcut": "A carbon of a double bond that is part of a symmetric ring (same groups on both ring sides) cannot receive an E/Z label.",
      "whyTrapTempting": "Students see CH3 and Cl on one carbon and assume E or Z must apply, forgetting to check the other carbon (ring junction) for identical substituents.",
      "smiles": "ClC(=C1CCCC1)C"
    },
    {
      "id": "oxymercuration_markovnikov_ether",
      "name": "Oxymercuration-Demercuration in Methanol (Markovnikov Ether)",
      "reagents": "1. Hg(OAc)2, CH3OH; 2. NaBH4",
      "prod": {
        "type": "add",
        "c1": "OCH3",
        "c2": "H"
      },
      "decision": {
        "q": "What is the major product of 2-methylpent-2-ene treated with 1. Hg(OAc)2, CH3OH; 2. NaBH4?",
        "opts": [
          [
            "2-methyl-2-methoxypentane (Markovnikov ether, OCH3 on more substituted carbon)",
            true
          ],
          [
            "3-methoxy-3-methylpentane (wrong regiochemistry)",
            false
          ],
          [
            "2-methylpentan-3-ol (water instead of methanol as nucleophile)",
            false
          ],
          [
            "2-methylpentan-2-ol (product if water were the nucleophile with Markovnikov addition)",
            false
          ]
        ]
      },
      "rule": "Oxymercuration in ROH solvent gives a Markovnikov ether: the OR group adds to the more substituted carbon. When CH3OH is the solvent, OCH3 ends up on the more substituted carbon. The mechanism avoids carbocation rearrangement.",
      "trap": "hydroboration_oxidation_antimark",
      "tier": "predict",
      "firstMove": "Identify the more substituted carbon of the double bond — OCH3 goes there.",
      "shortcut": "Solvent = nucleophile. CH3OH as solvent means you get an ether, not an alcohol.",
      "whyTrapTempting": "Students default to water as the nucleophile and predict an alcohol product, ignoring that CH3OH is the solvent and nucleophile.",
      "smiles": "CC(=CCC)C"
    },
    {
      "id": "hydroboration_oxidation_antimark",
      "name": "Hydroboration-Oxidation: Anti-Markovnikov Alcohol",
      "reagents": "1. BH3 * THF; 2. H2O2, -OH",
      "prod": {
        "type": "add",
        "c1": "OH",
        "c2": "H",
        "stereo": "syn"
      },
      "decision": {
        "q": "What is the major product of 2-methylpent-2-ene treated with 1. BH3*THF; 2. H2O2, -OH?",
        "opts": [
          [
            "2-methylpentan-3-ol (anti-Markovnikov, OH on less substituted carbon)",
            true
          ],
          [
            "2-methylpentan-2-ol (Markovnikov, OH on more substituted carbon)",
            false
          ],
          [
            "A diol (both OH groups added)",
            false
          ],
          [
            "2-methyl-2-methoxypentane (ether product)",
            false
          ]
        ]
      },
      "rule": "BH3 adds to the less hindered (less substituted) carbon (anti-Markovnikov). H2O2/-OH replaces B with OH with retention. Net result: OH on the less substituted carbon, syn addition.",
      "trap": "oxymercuration_markovnikov_ether",
      "tier": "predict",
      "firstMove": "Identify the less substituted carbon — BH3 delivers B there, so OH ends up there after oxidation.",
      "shortcut": "BH3 = anti-Markovnikov + syn. H2O2/-OH replaces B with OH, same face.",
      "whyTrapTempting": "Students confuse with acid-catalyzed hydration and place OH on the more substituted carbon (Markovnikov product).",
      "smiles": "CC(=CCC)C"
    },
    {
      "id": "halohydrin_cl2_water",
      "name": "Halohydrin Formation: Cl2 / H2O",
      "reagents": "Cl2, H2O",
      "prod": {
        "type": "add",
        "c1": "Cl",
        "c2": "OH",
        "stereo": "anti"
      },
      "decision": {
        "q": "What is the major product of (E)-2,3-dimethyl-2-butene (or similar disubstituted alkene with CH3 groups) treated with Cl2, H2O?",
        "opts": [
          [
            "trans-chlorohydrin: Cl and OH on adjacent carbons, trans to each other (anti addition)",
            true
          ],
          [
            "cis-chlorohydrin (syn addition of Cl and OH)",
            false
          ],
          [
            "Dichloride (both Cl on adjacent carbons)",
            false
          ],
          [
            "Diol (both OH groups added)",
            false
          ]
        ]
      },
      "rule": "Cl2/H2O forms a chloronium ion intermediate; water attacks anti to Cl. Result is trans (anti) addition of Cl and OH. OH goes to the more substituted carbon (Markovnikov for water nucleophile).",
      "trap": null,
      "tier": "predict",
      "firstMove": "Draw the chloronium ion bridge; water attacks from the opposite face.",
      "shortcut": "Halohydrin = anti addition. X on one carbon, OH on the adjacent one, always trans to each other.",
      "whyTrapTempting": "Students mix up syn addition (BH3, OsO4) with anti addition (X2, X2/H2O) and predict cis products.",
      "smiles": "C(/C=C(/C)H)C"
    },
    {
      "id": "osmium_diol_1",
      "name": "OsO4 Dihydroxylation of 1-Methylcyclohexene",
      "reagents": "OsO4, H2O2",
      "prod": {
        "type": "diol"
      },
      "decision": {
        "q": "What is the major product when 1-methylcyclohexene is treated with OsO4 followed by H2O2?",
        "opts": [
          [
            "1-methyl-1,2-cyclohexanediol with both OH groups added syn (same face)",
            true
          ],
          [
            "1-methyl-1,2-cyclohexanediol with OH groups added anti (opposite faces)",
            false
          ],
          [
            "Cyclohexanone and formaldehyde (ozonolysis-type cleavage)",
            false
          ],
          [
            "1-methylcyclohexan-1-ol (Markovnikov alcohol only)",
            false
          ]
        ]
      },
      "rule": "OsO4 forms a cyclic osmate ester by concerted [3+2] addition to both faces of the double bond, delivering both oxygen atoms syn. H2O2 re-oxidises OsO4 (catalytic cycle). Product is cis-1-methyl-1,2-cyclohexanediol.",
      "trap": "syn_addition_h2_cyclopentene_1",
      "tier": "toggle",
      "firstMove": "Identify the reagent type: OsO4 = syn dihydroxylation (NOT anti, NOT cleavage)",
      "shortcut": "OsO4 = syn diol; both OHs on same face",
      "whyTrapTempting": "Students confuse OsO4 with Br2 (anti) or mistake the oxidative workup with ozonolysis cleavage",
      "smiles": "OC1(C)CCCCC1O"
    },
    {
      "id": "ozonolysis_bicyclic_1",
      "name": "Ozonolysis of Bicyclic Methylalkene",
      "reagents": "1. O3; 2. (CH3)2S",
      "prod": {
        "type": "cleave"
      },
      "decision": {
        "q": "Ozonolysis (O3 then Me2S) of a bicyclic alkene containing a CH3-substituted exocyclic double bond cleaves the double bond to give which type of carbonyl products?",
        "opts": [
          [
            "Two aldehyde/ketone fragments — the double bond is cleaved to give one ketone and one aldehyde",
            true
          ],
          [
            "A syn diol — both carbons of the double bond gain an OH group",
            false
          ],
          [
            "An epoxide — one oxygen bridges the two carbons of the former double bond",
            false
          ],
          [
            "No reaction — bicyclic alkenes are too strained for ozonolysis",
            false
          ]
        ]
      },
      "rule": "Ozonolysis (O3 then reductive workup with Me2S) cleaves the C=C bond. Each carbon of the double bond becomes a carbonyl: a monosubstituted end gives an aldehyde, a disubstituted end gives a ketone. Me2S is reductive workup — no over-oxidation to carboxylic acid.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Check workup: Me2S = reductive = aldehydes preserved; H2O2 workup = oxidative = aldehydes become carboxylic acids",
      "shortcut": "O3 / Me2S = cleave to C=O, no further oxidation",
      "whyTrapTempting": "Students choose diol (confusing with OsO4) or choose over-oxidised products (confusing reductive vs oxidative workup)",
      "smiles": null
    },
    {
      "id": "d2_stereo_hexene_1",
      "name": "D2/Pt Hydrogenation Stereochemistry: E vs Z-3-hexene",
      "reagents": "D2, Pt catalyst",
      "prod": {
        "type": "alkane"
      },
      "decision": {
        "q": "Both (E)- and (Z)-3-hexene are treated with D2 in the presence of a platinum catalyst. How are the products from these two reactions related to each other?",
        "opts": [
          [
            "The (E)- and (Z)-isomers generate the same products in exactly the same amounts",
            false
          ],
          [
            "The (E)- and (Z)-isomers generate the same products but in differing amounts",
            false
          ],
          [
            "The products of the two isomers are related as diastereomers",
            true
          ],
          [
            "The products of the two isomers are related as enantiomers",
            false
          ]
        ]
      },
      "rule": "Catalytic hydrogenation (D2/Pt) is a syn addition — both D atoms add to the same face. Starting from E-3-hexene, syn addition gives the meso compound. Starting from Z-3-hexene, syn addition gives the (R,R)/(S,S) racemate. Meso and the racemate are diastereomers.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Draw out syn addition of D2 to each alkene geometry and identify the stereocenters created",
      "shortcut": "E-alkene + syn D2 = meso; Z-alkene + syn D2 = racemate. Meso vs racemate = diastereomers.",
      "whyTrapTempting": "Students confuse diastereomers and enantiomers, or forget that syn addition fixes the relative stereochemistry of the two new stereocenters",
      "smiles": null
    },
    {
      "id": "icl_addition_1",
      "name": "ICl Addition to 1-Methylcyclohexene (Markovnikov Regioselectivity)",
      "reagents": "ICl",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "When ICl adds to 1-methylcyclohexene, which regiochemical outcome is correct? (I is the electrophile in I-Cl because it is the more polarisable, less electronegative atom; Cl is the nucleophile.)",
        "opts": [
          [
            "Cl ends up on the more substituted carbon (C-1, bearing CH3); I ends up on the less substituted carbon (C-2)",
            true
          ],
          [
            "I ends up on the more substituted carbon (C-1, bearing CH3); Cl ends up on the less substituted carbon (C-2)",
            false
          ],
          [
            "Both I and Cl add randomly — no regioselectivity is observed",
            false
          ],
          [
            "Only HI and HCl elimination products form; no addition occurs",
            false
          ]
        ]
      },
      "rule": "In ICl, iodine is the electrophile (d+) because it is larger and more polarisable; chlorine is the nucleophile (d-). The iodonium ion forms preferentially at the more substituted carbon (Markovnikov). Cl- then attacks the more substituted carbon from the back (anti). Product: 1-methyl-1-Cl-2-I-cyclohexane (trans).",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Determine polarity of I-Cl bond: I is electrophile, Cl is nucleophile (opposite of what students expect)",
      "shortcut": "I is always the electrophile in ICl; Cl goes to the more substituted carbon via Markovnikov",
      "whyTrapTempting": "Students assume Cl is the electrophile because it is more electronegative, reversing the regiochemistry",
      "smiles": "ClC1(C)CCCCC1I"
    },
    {
      "id": "hydroboration_retro_1",
      "name": "Identify Starting Alkene for Hydroboration-Oxidation",
      "reagents": "1. BH3-THF; 2. NaOH, H2O2",
      "prod": {
        "type": "add",
        "c1": "anti-Markovnikov alcohol with syn stereochemistry",
        "stereo": "syn"
      },
      "decision": {
        "q": "Hydroboration-oxidation (BH3-THF then NaOH/H2O2) gives a product with OH on the less hindered carbon and syn stereochemistry. Which starting alkene is needed to give (S)-3-methylbutan-2-ol (OH on C-2, anti-Markovnikov, syn addition)?",
        "opts": [
          [
            "(Z)-3-methylbut-2-ene (cis double bond, not E-isomer) — syn anti-Markovnikov addition places OH at C-2",
            true
          ],
          [
            "(E)-3-methylbut-2-ene — would give the same product because stereochemistry does not matter",
            false
          ],
          [
            "2-methylbut-1-ene — Markovnikov product would place OH at C-1, not C-2",
            false
          ],
          [
            "3-methylbut-1-ene — the terminal alkene gives primary alcohol, not the desired secondary",
            false
          ]
        ]
      },
      "rule": "BH3-THF/NaOH-H2O2 = hydroboration-oxidation: anti-Markovnikov, syn addition. Work backwards from the product — OH is on the less substituted carbon, H is syn. The Z-isomer of the internal alkene is required to generate the specific diastereomeric product shown.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Work backwards: anti-Markovnikov tells you which carbon gets OH; syn addition + alkene geometry determines relative stereochemistry of product",
      "shortcut": "Hydroboration: OH goes to less hindered carbon, syn addition. Use alkene geometry to control product stereochemistry.",
      "whyTrapTempting": "Students choose the E-isomer without realising that E vs Z changes the relative configuration of the syn addition product",
      "smiles": null
    },
    {
      "id": "multistep_seq_A_1",
      "name": "Multi-Step Sequence: Identify Intermediate A (Oxymercuration-Demercuration)",
      "reagents": "1. Hg(OAc)2, H2O; 2. NaBH4",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Methylenecyclopentane is treated with 1. Hg(OAc)2/H2O then 2. NaBH4. What is intermediate A?",
        "opts": [
          [
            "1-methylcyclopentan-1-ol (Markovnikov alcohol, OH on the more substituted tertiary carbon)",
            true
          ],
          [
            "Cyclopentylmethanol (anti-Markovnikov alcohol, OH on the exocyclic CH2)",
            false
          ],
          [
            "Cyclopentanone (oxidation product)",
            false
          ],
          [
            "1,2-cyclopentanediol (diol from OsO4-type addition)",
            false
          ]
        ]
      },
      "rule": "Oxymercuration-demercuration gives Markovnikov addition of water with no rearrangement. For methylenecyclopentane, the exocyclic double bond has one ring-carbon end (more substituted) and one CH2 end (less substituted). OH adds to the more substituted ring carbon, giving 1-methylcyclopentan-1-ol.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify which carbon of the double bond is more substituted — OH goes there (Markovnikov)",
      "shortcut": "Oxymercuration = Markovnikov water addition, no rearrangement",
      "whyTrapTempting": "Students confuse oxymercuration with hydroboration and place OH on the less substituted (exocyclic) carbon",
      "smiles": "OC1(C)CCCC1"
    },
    {
      "id": "multistep_seq_B_1",
      "name": "Multi-Step Sequence: Identify Intermediate B (Acid-Catalysed Dehydration)",
      "reagents": "H2SO4, heat",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "1-methylcyclopentan-1-ol is treated with H2SO4 and heat (dehydration). What is the major alkene product B?",
        "opts": [
          [
            "1-methylcyclopent-1-ene (endocyclic, more substituted, Zaitsev product)",
            true
          ],
          [
            "Methylenecyclopentane (exocyclic alkene, less substituted)",
            false
          ],
          [
            "Cyclopentane (full dehydration to cycloalkane — not possible from this substrate)",
            false
          ],
          [
            "Cyclopentanone (oxidation product — wrong reaction type)",
            false
          ]
        ]
      },
      "rule": "Acid-catalysed dehydration follows Zaitsev's rule — the more substituted (more stable) alkene is the major product. For 1-methylcyclopentan-1-ol, loss of H from the ring gives the endocyclic trisubstituted 1-methylcyclopent-1-ene, which is more stable than the exocyclic methylenecyclopentane.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify all possible beta-H positions; choose elimination toward the more substituted alkene",
      "shortcut": "Zaitsev: more substituted alkene wins. Endocyclic > exocyclic for cyclopentane ring.",
      "whyTrapTempting": "The exocyclic alkene is tempting because the starting material was made from it, but Zaitsev favours the more substituted endocyclic alkene",
      "smiles": "C1=C(C)CCC1"
    },
    {
      "id": "multistep_seq_C_1",
      "name": "Multi-Step Sequence: Identify Product C (KMnO4 Oxidative Cleavage)",
      "reagents": "KMnO4",
      "prod": {
        "type": "cleave"
      },
      "decision": {
        "q": "1-methylcyclopent-1-ene is treated with KMnO4 (hot, concentrated). What product C results from oxidative cleavage?",
        "opts": [
          [
            "5-oxohexanoic acid (a keto-acid from ring opening and oxidative cleavage of the double bond)",
            true
          ],
          [
            "A syn diol (1,2-diol) — this is cold, dilute KMnO4",
            false
          ],
          [
            "An epoxide — requires a peracid, not KMnO4",
            false
          ],
          [
            "Cyclohexanone — wrong carbon count, wrong reaction",
            false
          ]
        ]
      },
      "rule": "Hot concentrated KMnO4 cleaves the C=C bond oxidatively. A disubstituted carbon of the double bond (C-1, bearing methyl and ring) becomes a ketone/carboxylic acid. For a cyclic alkene, ring opening gives a single bifunctional chain product. 1-methylcyclopent-1-ene gives 5-oxohexanoic acid (one end is a ketone from the CH3-bearing carbon, the other end is a carboxylic acid from the ring CH2 carbon).",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Determine KMnO4 conditions: hot/conc = oxidative cleavage; cold/dilute = syn diol",
      "shortcut": "Hot KMnO4 on cyclic alkene = ring opens to give single keto-acid chain",
      "whyTrapTempting": "Students apply cold KMnO4 (syn diol) rules to hot KMnO4, or forget that a cyclic alkene gives one chain product not two separate fragments",
      "smiles": "CC(=O)CCCC(=O)O"
    },
    {
      "id": "stability_rank_cyclo_1",
      "name": "Alkene Stability Ranking (Four Cyclohexyl Alkenes)",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Rank these four alkenes from most stable (1) to least stable (4): A = cyclohexyl with exocyclic trans (E) disubstituted alkene; B = cyclohexyl with exocyclic vinylidene (=CH2, terminal); C = cyclohexyl with endocyclic trisubstituted alkene; D = cyclohexyl with endocyclic disubstituted (cis/internal ring) alkene. Which ranking is correct?",
        "opts": [
          [
            "C (trisubstituted endocyclic) = 1st; A (E disubstituted exocyclic) = 2nd; D (disubstituted endocyclic) = 3rd; B (monosubstituted/terminal) = 4th",
            true
          ],
          [
            "B (terminal) = 1st; A = 2nd; C = 3rd; D = 4th",
            false
          ],
          [
            "A = 1st; C = 2nd; D = 3rd; B = 4th",
            false
          ],
          [
            "All four are equally stable because they all contain a cyclohexyl ring",
            false
          ]
        ]
      },
      "rule": "Alkene stability increases with degree of substitution (more alkyl groups on the double bond = more hyperconjugation/induction stabilisation). Ranking: trisubstituted > disubstituted (E/trans) > disubstituted (cis/internal) > monosubstituted/terminal. The answer image shows: A=2, B=4, C=1, D=3.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Count substituents on each carbon of the double bond; more substituents = more stable",
      "shortcut": "More substituted = more stable. Trisubstituted beats disubstituted beats mono.",
      "whyTrapTempting": "Students may rank endocyclic lower than exocyclic, or mistake the terminal alkene as more stable because it looks 'simpler'",
      "smiles": null
    },
    {
      "id": "eu_c5h7clo_1",
      "name": "Elements of Unsaturation for C5H7ClO",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "How many elements of unsaturation (EU / degrees of unsaturation) does C5H7ClO have?",
        "opts": [
          [
            "2",
            true
          ],
          [
            "1",
            false
          ],
          [
            "3",
            false
          ],
          [
            "0",
            false
          ]
        ]
      },
      "rule": "EU = (2C + 2 + N - H - X) / 2. For C5H7ClO: EU = (2x5 + 2 - 7 - 1) / 2 = (10 + 2 - 7 - 1) / 2 = 4/2 = 2. Halogens count as H for the formula; O is ignored in the EU count.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Write the EU formula: (2C + 2 - H - X + N) / 2. Substitute C=5, H=7, X(Cl)=1, O=0 contribution.",
      "shortcut": "Halogens subtract like H; oxygen and sulfur have no effect on EU count",
      "whyTrapTempting": "Students add O into the formula incorrectly, or forget that halogens count as H equivalents, giving wrong EU of 1 or 3",
      "smiles": null
    },
    {
      "id": "iupac_name_to_structure_1",
      "name": "IUPAC Name to Structure: (E)-2-Chloro-3-methyl-2-pentene",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Which description correctly represents the structure of (E)-2-chloro-3-methyl-2-pentene?",
        "opts": [
          [
            "A 5-carbon chain with a double bond between C2 and C3, chlorine on C2, methyl group on C3, and the higher-priority groups on C2 (Cl) and C3 (ethyl) on opposite sides (E configuration)",
            true
          ],
          [
            "A 5-carbon chain with the double bond between C2 and C3, chlorine on C3, and methyl on C2 (substituents swapped)",
            false
          ],
          [
            "A 6-carbon chain (hexene) with chlorine on C2 and methyl on C3",
            false
          ],
          [
            "(Z) configuration — the two higher-priority groups are on the same side",
            false
          ]
        ]
      },
      "rule": "Parse the name: pent-2-ene = 5C chain, double bond C2-C3; 2-chloro = Cl on C2; 3-methyl = CH3 on C3; (E) = higher priority groups on C2 (Cl > CH3) and C3 (CH2CH3 > CH3) are trans/opposite. The answer shows the correct E-configured 2-chloro-3-methyl-2-pentene structure.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Assign CIP priorities on each alkene carbon independently, then check E/Z",
      "shortcut": "On C2: Cl > CH3. On C3: CH2CH3 > CH3. E = these two high-priority groups are on opposite sides.",
      "whyTrapTempting": "Students confuse cis/trans (same/opposite for same group) with E/Z (CIP priority), or mix up which groups are highest priority on each carbon",
      "smiles": "CC/C(=C(\\Cl)C)/C"
    },
    {
      "id": "iupac_structure_to_name_1",
      "name": "Structure to IUPAC Name: 5-methyloct-2-ene",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "A structure shows an 8-carbon chain with a double bond at C2 and a methyl branch at C5 (confirmed by the answer as cis/Z configuration). What is the correct IUPAC name?",
        "opts": [
          [
            "(Z)-5-methyloct-2-ene (or cis-5-methyl-2-octene)",
            true
          ],
          [
            "(E)-5-methyloct-2-ene",
            false
          ],
          [
            "5-methyloct-3-ene",
            false
          ],
          [
            "3-methyloct-6-ene",
            false
          ]
        ]
      },
      "rule": "Longest chain containing the double bond = 8 carbons (octene). Number from the end closer to the double bond: double bond at C2-C3 (2-octene). Methyl branch at C5. Geometry: Z (cis). Full name: (Z)-5-methyloct-2-ene. The answer image confirms 'cis-5-methyl-2-octene or Z-'.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Find the longest chain containing the double bond; number so double bond gets lowest locant",
      "shortcut": "Number from the closer end to the double bond. Branch locant follows from that numbering.",
      "whyTrapTempting": "Students number from the wrong end, swapping the double bond and branch locants, or assign E instead of Z without checking CIP priorities",
      "smiles": "CC/C=C/CCC(C)C"
    },
    {
      "id": "hbr_reactivity_rank_1",
      "name": "Alcohol Reactivity Ranking Toward HBr (Cation Stability)",
      "reagents": "HBr",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Rank these three alkenes by reactivity toward HBr addition (fastest = 1, slowest = 3): A = 2-methylbut-1-ene (terminal alkene, gives tertiary carbocation); B = 3-methylbut-1-ene (terminal, gives secondary then possible rearrangement); C = 2-methylbut-2-ene (internal trisubstituted alkene, gives tertiary carbocation directly). Wait — the question shows three alkene structures. The answer indicates ranking by carbocation stability: most reactive has most stable carbocation intermediate. Which order is correct?",
        "opts": [
          [
            "C (2-methylbut-2-ene, trisubstituted, gives stable 3° carbocation) = 1st fastest; B (3-methylbut-1-ene, gives 2° carbocation) = 2nd; A (terminal least substituted, gives less stable cation) = 3rd slowest",
            true
          ],
          [
            "A = 1st; B = 2nd; C = 3rd",
            false
          ],
          [
            "All three react at the same rate",
            false
          ],
          [
            "B = 1st; C = 2nd; A = 3rd",
            false
          ]
        ]
      },
      "rule": "HBr addition rate is governed by carbocation stability in the rate-determining step. More substituted carbocations are more stable and form faster. The answer image shows the ranking as 3, 2, 1 (left to right for the three structures shown), confirming most substituted alkene reacts fastest. Rule: cation stability = 3° > 2° > 1°.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Protonate each alkene to determine the carbocation formed (Markovnikov); rank by carbocation stability",
      "shortcut": "More substituted alkene = more stable carbocation = faster HBr addition",
      "whyTrapTempting": "Students confuse alkene stability (more substituted = more stable = slower to react) with reactivity toward electrophilic addition (more substituted = faster because better carbocation)",
      "smiles": null
    },
    {
      "id": "reagents_for_diol_1",
      "name": "Choose Reagents for Alcohol to Vicinal Diol Transformation",
      "reagents": "",
      "prod": {
        "type": "diol",
        "c1": "1-(hydroxymethyl)cyclohexan-1-ol",
        "stereo": "syn"
      },
      "decision": {
        "q": "You need to convert (cyclohexylmethyl)methanol (a cyclohexane ring with a -CH2OH sidechain) to 1-(hydroxymethyl)cyclohexane-1-ol (adding an OH to the ring carbon adjacent to the CH2OH). What two-step reagent sequence achieves this?",
        "opts": [
          [
            "Step 1: H2SO4 (dehydration to form cyclohexene with exocyclic double bond); Step 2: CH3CO3H or mCPBA then H2O (epoxidation then acid opening for trans diol, OR OsO4/H2O2 for syn diol)",
            true
          ],
          [
            "Step 1: HBr; Step 2: NaOH — this gives an ether, not a diol",
            false
          ],
          [
            "Step 1: OsO4 alone on the starting alcohol — the alcohol has no alkene to dihydroxylate",
            false
          ],
          [
            "Step 1: KMnO4; Step 2: H2O — this would oxidise rather than add OH",
            false
          ]
        ]
      },
      "rule": "The answer shows H2SO4 (dehydration to give exocyclic alkene) then CH3CO3H (peracid epoxidation) + H2O (epoxide opening). This gives the 1,2-diol at the exocyclic position. The starting material has no double bond, so it must first be dehydrated to introduce the alkene, then dihydroxylated.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Check: does the starting material have a double bond? If not, dehydration must be step 1 to install the alkene.",
      "shortcut": "Alcohol to diol = dehydrate first (H2SO4), then dihydroxylate (OsO4 for syn, or epoxide for anti)",
      "whyTrapTempting": "Students try to apply dihydroxylation directly to the alcohol without first creating a double bond",
      "smiles": null
    },
    {
      "id": "degrees_unsaturation_1",
      "name": "Degrees of Unsaturation: C6H9NO2",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "How many elements of unsaturation (degrees of unsaturation) are in the formula C6H9NO2?",
        "opts": [
          [
            "0",
            false
          ],
          [
            "1",
            false
          ],
          [
            "2",
            false
          ],
          [
            "3",
            true
          ]
        ]
      },
      "rule": "DoU = (2C + 2 + N - H) / 2. For C6H9NO2: (2x6 + 2 + 1 - 9) / 2 = (12 + 2 + 1 - 9) / 2 = 6/2 = 3. Nitrogen adds 1, each oxygen is ignored, halogens subtract 1.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Write the DoU formula: (2C + 2 + N - H) / 2. Oxygen and sulfur do not affect the count; nitrogen adds 1 to the numerator.",
      "shortcut": "For C6H9NO2: (14 + 1 - 9) / 2 = 6/2 = 3",
      "whyTrapTempting": "Students often forget nitrogen adds 1 to the formula, or they subtract H count before adding the nitrogen contribution, giving 2 instead of 3.",
      "smiles": null
    },
    {
      "id": "ez_classification_multi_1",
      "name": "E/Z Classification: Four Alkenes with NO2 Groups",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Four alkenes are shown (A: internal alkene with NO2 on one end, B: internal alkene with NO2 on the same carbon as a larger chain, C: internal alkene with NO2, D: cyclopentene fused ring with exocyclic double bond). Which statement is true about their E/Z designations?",
        "opts": [
          [
            "A, C, and D are Z; B is E",
            false
          ],
          [
            "A and B are the only Z compounds",
            false
          ],
          [
            "A is the only Z compound; B is the only E compound",
            true
          ],
          [
            "B, C, and D are Z; A is E",
            false
          ]
        ]
      },
      "rule": "Assign E/Z by CIP priority on each carbon of the double bond. A has higher-priority groups on the same side (Z). B has higher-priority groups on opposite sides (E). C and D lack two different substituents on each sp2 carbon, so they are not E/Z isomers at all.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Check each sp2 carbon: does it have two different substituents? If one carbon has two identical groups (e.g., two H), the compound has no E/Z designation.",
      "shortcut": "Only compounds where both alkene carbons are disubstituted with different groups can be E or Z. Monosubstituted carbons make the whole alkene non-designatable.",
      "whyTrapTempting": "Students see NO2 and assume E/Z applies to all four, not checking whether both ends of the double bond have two different substituents.",
      "smiles": null
    },
    {
      "id": "dehydration_reactivity_rank_1",
      "name": "Dehydration Reactivity Ranking: 1° vs 2° vs 3° Alcohol",
      "reagents": "H2SO4, heat",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Rank the reactivity of three alcohols toward H2SO4/heat catalyzed dehydration: A is a primary alcohol (4-methylpentan-1-ol, 1°), B is a secondary alcohol (3-methylbutan-2-ol, 2°), C is a tertiary alcohol (2-methylbutan-2-ol, 3°). Which answer correctly orders fastest to slowest?",
        "opts": [
          [
            "A is fastest; C is slowest",
            false
          ],
          [
            "B is fastest; C is slowest",
            false
          ],
          [
            "A is fastest; B is slowest",
            false
          ],
          [
            "C is fastest; A is slowest",
            true
          ]
        ]
      },
      "rule": "Dehydration proceeds via carbocation intermediate (E1). More substituted carbocations are more stable and form faster. 3° alcohol (C) reacts fastest, 1° alcohol (A) reacts slowest. Order: 3° > 2° > 1°.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Identify the degree of substitution at the carbon bearing OH on each alcohol.",
      "shortcut": "More substituted OH = more stable carbocation = faster E1 dehydration. 3° is always fastest.",
      "whyTrapTempting": "Students may confuse 'more substituted = more stable product' (Zaitsev) with reaction rate, or confuse alkene stability with alcohol reactivity.",
      "smiles": null
    },
    {
      "id": "same_product_ez_butene_1",
      "name": "Same Product from Both E- and Z-2-Butene",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Which reagent gives exactly the same product(s) from both (E)-2-butene and (Z)-2-butene?",
        "opts": [
          [
            "Br2",
            false
          ],
          [
            "PhCO3H (mCPBA)",
            false
          ],
          [
            "1) BH3-THF  2) NaOH, H2O2",
            true
          ],
          [
            "OsO4, H2O2",
            false
          ]
        ]
      },
      "rule": "Hydroboration-oxidation (BH3/THF then NaOH/H2O2) adds H and OH syn, but the carbon bearing OH in 2-butene becomes a single chiral center. Because only one chiral center is produced, both E and Z alkenes give the same racemic mixture of (R)- and (S)-2-butanol. Br2 and OsO4/H2O2 produce two chiral centers, so E gives meso and Z gives a racemate (or vice versa) -- different outcomes.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Ask: how many chiral centers does the product have? If only one or zero, both alkene geometries give the same product.",
      "shortcut": "When the reaction creates only one new chiral center, E and Z geometries are irrelevant -- both give the same racemic mix.",
      "whyTrapTempting": "Students assume syn addition (BH3) must be geometry-sensitive like OsO4, forgetting that with only one chiral center in the product, syn vs anti doesn't matter.",
      "smiles": null
    },
    {
      "id": "syn_addition_h2_cyclopentene_1",
      "name": "Stereo Outcome: H2/Pt on Cyclopentene",
      "reagents": "H2, Pt",
      "prod": {
        "type": "alkane"
      },
      "decision": {
        "q": "What is the stereochemical outcome when 1-methylcyclopentene reacts with H2/Pt?",
        "opts": [
          [
            "Trans product only",
            false
          ],
          [
            "Cis product only",
            true
          ],
          [
            "Racemic mixture of cis and trans",
            false
          ],
          [
            "No stereochemistry -- the product has no stereocenters",
            false
          ]
        ]
      },
      "rule": "H2 with a metal catalyst (Pt, Pd, Ni) delivers both H atoms to the same face of the double bond (syn addition). For a cyclic alkene this gives the cis product.",
      "trap": "osmium_diol_1",
      "tier": "toggle",
      "firstMove": "Identify: is this syn or anti addition? H2/metal = syn. Then place both new H atoms on the same face of the ring.",
      "shortcut": "H2/metal always syn. Cyclic alkene + syn H2 = cis product at the two carbons that were part of the double bond.",
      "whyTrapTempting": "Students may default to 'trans' because trans is thermodynamically more stable, confusing kinetic (addition) outcome with thermodynamic product.",
      "smiles": "C1CC=CC1"
    },
    {
      "id": "anti_addition_br2_cyclohexene_1",
      "name": "Stereo Outcome: Br2 on Cyclohexene",
      "reagents": "Br2",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the stereochemical outcome when cyclohexene reacts with Br2 (no solvent specified)?",
        "opts": [
          [
            "Cis-1,2-dibromocyclohexane only",
            false
          ],
          [
            "Trans-1,2-dibromocyclohexane (racemic mixture of enantiomers)",
            true
          ],
          [
            "Meso-1,2-dibromocyclohexane only",
            false
          ],
          [
            "Equal mixture of cis and trans products",
            false
          ]
        ]
      },
      "rule": "Br2 adds via a bromonium ion intermediate, forcing anti addition. Both bromines end up on opposite faces of the ring, giving the trans-dibromo product as a racemic pair of enantiomers.",
      "trap": "nbs_allylic_bromination_cyclohexene_1",
      "tier": "toggle",
      "firstMove": "Identify: Br2 = anti addition via bromonium ion. Both Br atoms add to opposite faces.",
      "shortcut": "Br2 (or Cl2) in inert solvent always anti. Cyclic alkene + anti addition = trans dihalide (racemic).",
      "whyTrapTempting": "Students may think 'diaxial' is the same as 'trans' without thinking about which face each Br attacks, or confuse this with meso.",
      "smiles": "C1CCCCC1"
    },
    {
      "id": "halohydrin_cyclopentene_1",
      "name": "Stereo Outcome: Cl2/H2O on 3-Methylcyclopentene",
      "reagents": "Cl2, H2O",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the regiochemical and stereochemical outcome of Cl2/H2O (halohydrin formation) on 3-methylcyclopentene?",
        "opts": [
          [
            "Syn addition: chlorine and OH on the same face",
            false
          ],
          [
            "Anti addition: chlorine and OH on opposite faces (trans product)",
            true
          ],
          [
            "Markovnikov addition of HCl with no stereochemical control",
            false
          ],
          [
            "Both syn and anti products form equally",
            false
          ]
        ]
      },
      "rule": "Cl2/H2O forms a chloronium ion intermediate. Water attacks from the opposite face (anti). OH goes to the more substituted carbon (Markovnikov), Cl goes to the less substituted. Result is anti (trans) addition.",
      "trap": "anti_addition_br2_cyclohexene_1",
      "tier": "toggle",
      "firstMove": "Recognize Cl2/H2O = halohydrin conditions. Anti addition via halonium ion. OH at more substituted carbon.",
      "shortcut": "Halohydrin = anti addition + OH at more substituted carbon. Same face rule as Br2 but water is the nucleophile.",
      "whyTrapTempting": "Students may think water attacks the same face as Cl (syn), or forget that the OH goes to the MORE substituted carbon, not the less substituted.",
      "smiles": null
    },
    {
      "id": "osmium_cis_diol_1",
      "name": "Stereo Outcome: OsO4/H2O2 on (E)-2-Butene",
      "reagents": "OsO4, H2O2",
      "prod": {
        "type": "diol"
      },
      "decision": {
        "q": "What is the stereochemical outcome of OsO4/H2O2 dihydroxylation of (E)-2-butene?",
        "opts": [
          [
            "Meso-2,3-butanediol (a single achiral compound)",
            false
          ],
          [
            "Racemic mixture of (2R,3R) and (2S,3S)-2,3-butanediol",
            false
          ],
          [
            "(2R,3S)-2,3-butanediol (meso) only -- wait, this applies to Z. For E: racemic (2R,3R) and (2S,3S)",
            false
          ],
          [
            "Syn addition giving both OH groups on the same face, so (E)-2-butene gives the racemic (anti) diol pair",
            true
          ]
        ]
      },
      "rule": "OsO4 adds both OH groups syn (same face). For (E)-2-butene, syn addition gives a racemic mixture of (2R,3R) and (2S,3S)-butanediol (the anti diol in terms of configuration, because the E geometry means the methyls are trans). For (Z)-2-butene, syn addition gives meso-2,3-butanediol.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "OsO4 = syn dihydroxylation. Draw the geometry of the alkene, then add both OHs to the same face.",
      "shortcut": "OsO4 on E-alkene = racemic diol. OsO4 on Z-alkene = meso diol (for symmetric cases like 2-butene).",
      "whyTrapTempting": "Students confuse syn addition with cis product. Syn means same face of addition, but with E-2-butene the resulting stereocenters end up with opposite configurations (giving the chiral pair, not meso).",
      "smiles": "C/C=C/C"
    },
    {
      "id": "reagents_for_markovnikov_alcohol_1",
      "name": "Reagents to Convert Alcohol to Markovnikov Alkyl Bromide",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What reagents convert 2-methylbutan-2-ol (a tertiary alcohol with OH on C2) into 2-bromo-2-methylbutane (a tertiary alkyl bromide with Br on C2, Markovnikov)?",
        "opts": [
          [
            "1) H2SO4, heat;  2) HBr",
            true
          ],
          [
            "1) NaOH;  2) HBr, peroxides",
            false
          ],
          [
            "1) BH3-THF;  2) Br2",
            false
          ],
          [
            "1) OsO4;  2) HBr",
            false
          ]
        ]
      },
      "rule": "Dehydrate the alcohol with H2SO4/heat to form the alkene, then add HBr without peroxides (Markovnikov) to place Br on the more substituted carbon. Answer confirmed in image104: step 1 H2SO4 heat, step 2 HBr.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "The target has Br at the same carbon as the original OH, so use dehydration then Markovnikov HBr addition.",
      "shortcut": "OH at tertiary carbon -> dehydrate -> add HBr (Markovnikov) -> Br returns to same position.",
      "whyTrapTempting": "Students may try to use HBr directly on the alcohol (substitution), which can work for some alcohols but is less reliable for tertiary; or they use peroxides (anti-Markovnikov) by mistake.",
      "smiles": null
    },
    {
      "id": "reagents_for_anti_markovnikov_oh_cyclohexyl_1",
      "name": "Reagents to Convert Bromo-Cyclohexane to Markovnikov Alcohol",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What reagents convert (bromomethyl)cyclohexane (exocyclic CH2Br on cyclohexane ring) into (1-methylcyclohexyl)methanol with CH3 and OH both on the ring carbon (Markovnikov alcohol at ring carbon)?",
        "opts": [
          [
            "1) NaOCH3 (small base);  2) BH3-THF;  3) NaOH, H2O2",
            true
          ],
          [
            "1) NaOH;  2) H2O, H+",
            false
          ],
          [
            "1) KOtBu;  2) OsO4, H2O2",
            false
          ],
          [
            "1) Mg/ether;  2) H2O",
            false
          ]
        ]
      },
      "rule": "Step 1: eliminate HBr with NaOCH3 (small base, gives Zaitsev alkene = methylenecyclohexane). Step 2: BH3-THF adds boron anti-Markovnikov to exocyclic carbon. Step 3: NaOH/H2O2 oxidizes to alcohol. This gives OH at the ring carbon (anti-Markovnikov relative to the exo double bond, but Markovnikov at ring). Answer shown in image104.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Recognize the 3-step sequence: elimination -> hydroboration-oxidation to set regiochemistry of OH.",
      "shortcut": "Hydroboration puts OH at the less substituted carbon of the alkene, which here is the exocyclic carbon. Plan the alkene geometry so that anti-Markovnikov gives the desired OH position.",
      "whyTrapTempting": "Students may try direct substitution (SN2 on the bromide) or use Markovnikov addition and get OH on the wrong carbon.",
      "smiles": null
    },
    {
      "id": "mercuryacetate_methoxymercuration_1",
      "name": "Markovnikov Methoxymercuration: Product Regiochemistry",
      "reagents": "1. Hg(OAc)2, CH3OH  2. NaBH4",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the major product when (E)-pent-2-ene reacts with 1) Hg(OAc)2/CH3OH then 2) NaBH4 (oxymercuration with methanol)?",
        "opts": [
          [
            "2-methoxypentane (OCH3 on C2, Markovnikov)",
            true
          ],
          [
            "3-methoxypentane (OCH3 on C3, anti-Markovnikov)",
            false
          ],
          [
            "Pent-2-ol (OH added, not OCH3)",
            false
          ],
          [
            "3-pentanone (oxidation product)",
            false
          ]
        ]
      },
      "rule": "Hg(OAc)2 with an alcohol (CH3OH) acts as the nucleophile instead of water. Methanol attacks the more substituted carbon of the mercurinium ion (Markovnikov), giving the methyl ether after NaBH4 reduction. No rearrangements occur.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify the nucleophile: CH3OH in step 1, so the product is an ether not an alcohol. Apply Markovnikov selectivity.",
      "shortcut": "Hg(OAc)2 + ROH = Markovnikov ether (not alcohol). NaBH4 just removes Hg.",
      "whyTrapTempting": "Students may use water as the nucleophile (giving an alcohol) or apply anti-Markovnikov regiochemistry (BH3 pattern).",
      "smiles": "CC=CCC"
    },
    {
      "id": "potassium_tert_butoxide_elimination_1",
      "name": "Elimination with Bulky Base: Product Selection",
      "reagents": "KOCMe3 (potassium tert-butoxide)",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "A bromo-substituted bicyclic compound (bromide on a cyclobutane ring fused to a cyclopentane) reacts with potassium tert-butoxide (KOCMe3). What is the major outcome?",
        "opts": [
          [
            "E1 elimination to give the more substituted (Zaitsev) alkene",
            false
          ],
          [
            "E2 elimination to give the less substituted (Hofmann) alkene because the base is bulky",
            true
          ],
          [
            "SN2 substitution to give the tert-butyl ether",
            false
          ],
          [
            "No reaction -- KOCMe3 is too bulky to react",
            false
          ]
        ]
      },
      "rule": "Potassium tert-butoxide is a bulky, strong base that favors E2 elimination over SN2. With a bulky base, the less hindered (less substituted) proton is abstracted, giving the less substituted alkene (Hofmann product).",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify: KOCMe3 is a bulky strong base -> E2 predominates. Bulky base = Hofmann (less substituted) product.",
      "shortcut": "Bulky base (KOtBu, LDA) = Hofmann elimination. Small base (NaOH, NaOCH3) = Zaitsev (more substituted).",
      "whyTrapTempting": "Students may default to Zaitsev (more stable alkene is major product) without recognizing that bulky base overrides this preference.",
      "smiles": null
    },
    {
      "id": "h2so4_heat_dehydration_product_1",
      "name": "Acid-Catalyzed Dehydration: Which Alkene Forms",
      "reagents": "H2SO4, heat",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "A cyclopentanol with an OH group on the ring reacts with H2SO4/heat. What is the major product?",
        "opts": [
          [
            "The more substituted (endocyclic) alkene via Zaitsev rule",
            true
          ],
          [
            "The less substituted (exocyclic) alkene via Hofmann rule",
            false
          ],
          [
            "No reaction -- cyclic alcohols resist dehydration",
            false
          ],
          [
            "A ring-opened product",
            false
          ]
        ]
      },
      "rule": "H2SO4/heat dehydration follows Zaitsev: the more substituted, more stable alkene is the major product. For cyclic alcohols this is the endocyclic alkene. H+ protonates OH, water leaves forming carbocation, proton is removed from the adjacent carbon toward more substitution.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify: H2SO4/heat = E1 dehydration. Apply Zaitsev = more substituted alkene.",
      "shortcut": "H2SO4/heat always gives Zaitsev (most substituted alkene). No bulky base present, so no Hofmann override.",
      "whyTrapTempting": "Students may confuse acid-catalyzed dehydration with base-catalyzed elimination and apply the wrong regioselectivity rule.",
      "smiles": null
    },
    {
      "id": "hbr_markovnikov_cyclopentene_1",
      "name": "HBr Addition to Cyclopentene: Markovnikov Product",
      "reagents": "H-Br",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the major product of HBr addition to cyclopentene (no peroxides)?",
        "opts": [
          [
            "Bromocyclopentane (Markovnikov, Br on the ring carbon)",
            true
          ],
          [
            "1-bromocyclopent-2-ene (allylic bromide)",
            false
          ],
          [
            "A ring-opened bromoalkene",
            false
          ],
          [
            "Trans-1,2-dibromocyclopentane",
            false
          ]
        ]
      },
      "rule": "HBr without peroxides adds via carbocation (Markovnikov). H+ adds to one carbon of the double bond, Br- attacks the carbocation carbon. For cyclopentene (symmetric), the product is simply bromocyclopentane.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "No peroxides = ionic Markovnikov addition. H adds first, then Br- attacks carbocation.",
      "shortcut": "HBr no peroxides = Markovnikov. HBr + peroxides = anti-Markovnikov (radical).",
      "whyTrapTempting": "Students may apply anti-Markovnikov regiochemistry (radical conditions) without noticing no peroxides are present.",
      "smiles": "C1CC=CC1"
    },
    {
      "id": "peracid_epoxidation_cyclohexene_1",
      "name": "Epoxidation with mCPBA: Stereo Outcome",
      "reagents": "CH3CO3H (peracid)",
      "prod": {
        "type": "epoxide"
      },
      "decision": {
        "q": "What is the stereochemical outcome when cyclohexene reacts with a peracid (e.g., mCPBA or CH3CO3H)?",
        "opts": [
          [
            "Trans-1,2-epoxycyclohexane",
            false
          ],
          [
            "Cis-1,2-epoxycyclohexane (an epoxide with both oxygens on the same face)",
            false
          ],
          [
            "Cyclohexene oxide (a single epoxide ring fused to the cyclohexane, syn addition)",
            true
          ],
          [
            "1,2-cyclohexanediol",
            false
          ]
        ]
      },
      "rule": "Peracids donate an oxygen to the alkene in a concerted syn fashion, producing an epoxide. Both C-O bonds form on the same face. For cyclohexene, the product is the racemic epoxide (1,2-epoxycyclohexane).",
      "trap": "osmium_diol_1",
      "tier": "toggle",
      "firstMove": "Peracid = epoxidation, not dihydroxylation. Product is an epoxide, not a diol.",
      "shortcut": "mCPBA / peracid = epoxide (one oxygen bridges both carbons). OsO4 = diol (two separate OH groups).",
      "whyTrapTempting": "Students confuse peracid (epoxide) with OsO4 (diol), or think epoxidation must give a cis-diol after ring opening.",
      "smiles": "C1CCCCC1"
    },
    {
      "id": "hbr_anti_markovnikov_seq_1",
      "name": "Multi-Step: HBr Peroxides Then NaOCH3",
      "reagents": "1. NEt3, heat  2. HBr, peroxides  3. NaOCH3",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "A secondary alkyl bromide (Br on C2 of a 4-carbon chain) reacts with 1) NEt3/heat (elimination), 2) HBr/peroxides (radical addition), 3) NaOCH3 (elimination). What is the major final product?",
        "opts": [
          [
            "The same alkyl bromide (no net change)",
            false
          ],
          [
            "A terminal alkene (less substituted) from Hofmann-type product",
            true
          ],
          [
            "A methyl ether",
            false
          ],
          [
            "A more substituted internal alkene",
            false
          ]
        ]
      },
      "rule": "Step 1: NEt3/heat = elimination -> gives internal (Zaitsev) alkene. Step 2: HBr/peroxides = anti-Markovnikov radical addition -> Br moves to the terminal (less substituted) carbon. Step 3: NaOCH3 = base-induced E2 elimination -> gives the terminal (less substituted) alkene. Net: Br has migrated from internal to terminal position via the radical step, and the sequence achieves an anti-Zaitsev product.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Track where Br ends up after each step. The radical step (HBr/peroxides) is the key -- it places Br anti-Markovnikov.",
      "shortcut": "This 3-step sequence is the classic way to move Br from internal to terminal position, achieving the Hofmann alkene that simple elimination cannot give.",
      "whyTrapTempting": "Students may assume NaOCH3 gives the same alkene as NEt3 (Zaitsev), not realizing the radical step repositioned the Br to the terminal carbon.",
      "smiles": null
    },
    {
      "id": "dehydration_seq_then_br2_1",
      "name": "Multi-Step: H2SO4/Delta Then Br2",
      "reagents": "1. H2SO4, heat  2. Br2",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "A tertiary alcohol (2-methylbutan-2-ol) reacts with 1) H2SO4/heat then 2) Br2. What is the major final product?",
        "opts": [
          [
            "Vicinal dibromide with Br atoms on C2 and C3 in anti arrangement",
            true
          ],
          [
            "Allylic bromide via radical substitution",
            false
          ],
          [
            "Geminal dibromide at C2",
            false
          ],
          [
            "No reaction -- Br2 does not react with alkenes from dehydration",
            false
          ]
        ]
      },
      "rule": "Step 1: dehydrate to give 2-methylbut-2-ene (Zaitsev). Step 2: Br2 adds anti via bromonium ion to give vicinal trans-dibromide. Product is a mixture of enantiomers of 2,3-dibromo-2-methylbutane.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify: H2SO4/heat = dehydration. Then Br2 = anti addition (bromonium). Track regiochemistry and stereochemistry through both steps.",
      "shortcut": "Dehydration gives the most substituted alkene; Br2 then adds anti to give trans-vicinal dibromide.",
      "whyTrapTempting": "Students may skip the dehydration step and try to add Br2 directly to the alcohol, or confuse anti addition with syn.",
      "smiles": null
    },
    {
      "id": "markovnikov_se_addition_1",
      "name": "Markovnikov Addition of CH3SeOH to Propene",
      "reagents": "CH3SeOH",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "CH3SeOH adds to propene. The Se-O bond is polarized so that oxygen is the nucleophile (O is more electronegative than Se). Which carbon does the OH end up on, and what is the major product?",
        "opts": [
          [
            "1-methylselenyl-2-propanol: OH on C2, SeCH3 on C1 (Markovnikov for O)",
            true
          ],
          [
            "1-hydroxy-1-(methylselenyl)propane: both O and Se on C1",
            false
          ],
          [
            "2-methylselenyl-1-propanol: SeCH3 on C2, OH on C1 (anti-Markovnikov for O)",
            false
          ],
          [
            "No addition occurs because Se is too large to react with a simple alkene",
            false
          ]
        ]
      },
      "rule": "O is more electronegative than Se, so in Se-O bond the O is delta-minus and acts as nucleophile. By Markovnikov logic the nucleophile (O/OH) adds to the more substituted carbon. Product is 1-(methylselenyl)-2-propanol.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Determine polarity of Se-O bond: O is more electronegative, so Se is electrophilic and O is nucleophilic. Then apply Markovnikov: nucleophile to more substituted carbon.",
      "shortcut": "O below Se on periodic table means Se is like a big, less electronegative version of O. The nucleophilic end (O) goes Markovnikov.",
      "whyTrapTempting": "Students instinctively think of the SeCH3 group as the functional group that attacks, analogous to HX where H goes to the less substituted carbon. But here O is the nucleophilic end, flipping the regiochemistry intuition.",
      "smiles": "CC(O)CSeCH3"
    },
    {
      "id": "combustion_heat_rank_1",
      "name": "Combustion Heat Ranking of Isomeric Alkenes",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Four isomeric C7 alkenes are burned completely. Rank them from most heat produced (1) to least heat produced (4): A = 2-methylenehexane (terminal exocyclic methylene), B = cis-3-heptene (cyclopropyl-fused look, cis disubstituted), C = trans-3-heptene (trans disubstituted), D = 2,3-dimethyl-2-pentene (trisubstituted).",
        "opts": [
          [
            "Most heat: A (least stable alkene), then B (cis), then C (trans), then D (most stable, trisubstituted) = A>B>C>D",
            true
          ],
          [
            "Most heat: D (most substituted releases most energy), then C, then B, then A",
            false
          ],
          [
            "All isomers produce identical heat because they have the same molecular formula",
            false
          ],
          [
            "Most heat: C (trans), then B (cis), then A, then D",
            false
          ]
        ]
      },
      "rule": "Less stable alkenes have higher potential energy and release more heat on combustion. Stability order: trisubstituted > trans disubstituted > cis disubstituted > monosubstituted/terminal. So heat of combustion order is the reverse of stability.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Rank alkene stability first (more substituted = more stable). Then invert: most stable burns coolest, least stable burns hottest.",
      "shortcut": "Stability and heat of combustion are inversely related for isomers.",
      "whyTrapTempting": "Students confuse 'more stable' with 'more energetic' and rank the trisubstituted alkene as releasing the most heat.",
      "smiles": null
    },
    {
      "id": "reagent_id_hydroboration_1",
      "name": "Reagents for Anti-Markovnikov Alcohol from Vinyl Bromide via Elimination then Hydroboration",
      "reagents": "",
      "prod": {
        "type": "add",
        "c1": "OH on less substituted carbon (anti-Markovnikov)",
        "stereo": "syn"
      },
      "decision": {
        "q": "A secondary allylic bromide (3-bromo-3-methylpent-1-ene equivalent) is converted to a primary alcohol (anti-Markovnikov). What two-step reagent sequence achieves this?",
        "opts": [
          [
            "1. NEt3 (elimination to alkene), 2. BH3-THF then NaOH/H2O2 (hydroboration-oxidation)",
            true
          ],
          [
            "1. NaOH/H2O (direct SN2 substitution), 2. H2SO4/heat",
            false
          ],
          [
            "1. Hg(OAc)2/H2O, 2. NaBH4 (oxymercuration-reduction for Markovnikov alcohol)",
            false
          ],
          [
            "1. Mg/ether (Grignard), 2. H2O workup",
            false
          ]
        ]
      },
      "rule": "NEt3 eliminates HBr to give the alkene. BH3-THF then NaOH/H2O2 gives anti-Markovnikov, syn addition alcohol at the less hindered carbon.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Identify the target: primary OH means anti-Markovnikov. Choose hydroboration-oxidation after eliminating to the alkene.",
      "shortcut": "Primary OH from secondary alkyl halide = elimination then hydroboration-oxidation.",
      "whyTrapTempting": "Oxymercuration-reduction also gives an alcohol but is Markovnikov, placing OH on the more substituted carbon, which is the wrong regiochemistry here.",
      "smiles": null
    },
    {
      "id": "reagent_id_ozonolysis_ring_open_1",
      "name": "Reagents to Cleave Cyclic Alcohol to Ketoaldehyde via Ozonolysis",
      "reagents": "",
      "prod": {
        "type": "cleave",
        "c1": "one aldehyde terminus",
        "c2": "one ketone terminus"
      },
      "decision": {
        "q": "1-methylcyclohexanol (secondary cyclic alcohol with OH) must be converted to a linear ketoaldehyde (ring-opened dicarboxyl product). What reagent sequence achieves this?",
        "opts": [
          [
            "1. H2SO4/heat (dehydration to cyclohexene), 2. 1. O3, 2. Me2S (ozonolysis) to give ring-opened dialdehyde/ketoaldehyde",
            true
          ],
          [
            "1. KMnO4 alone (directly oxidizes and ring opens)",
            false
          ],
          [
            "1. HBr (add HBr to get bromide), 2. Mg/ether Grignard",
            false
          ],
          [
            "1. NaBH4 (reduce), 2. H2SO4",
            false
          ]
        ]
      },
      "rule": "Dehydrate the alcohol with H2SO4/heat to form cyclohexene derivative, then ozonolysis (O3, Me2S) cleaves the double bond to give the ring-opened dicarboxyl compound.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Recognize that ring-opening of a cyclic alcohol to a linear chain requires: first make the alkene (dehydration), then cleave it (ozonolysis).",
      "shortcut": "Cyclic alcohol to linear dicarbonyl = dehydrate then ozonolyze.",
      "whyTrapTempting": "KMnO4 is associated with oxidative cleavage but does not give clean aldehyde products under standard conditions and does not dehydrate first.",
      "smiles": null
    },
    {
      "id": "reagent_id_dibromide_cyclopentene_1",
      "name": "Reagents for Trans-Dibromide then Eliminate to Cyclopentadiene",
      "reagents": "",
      "prod": {
        "type": "add",
        "c1": "trans-1,2-dibromocyclopentane (step 1)",
        "c2": "cyclopenta-1,3-diene (step 2)",
        "stereo": "anti"
      },
      "decision": {
        "q": "Cyclopentene is converted to a trans-1,2-dibromocyclopentane, and then to cyclopentadiene (two double bonds). What reagent sequences accomplish step 1 (bromination) and step 2 (double elimination)?",
        "opts": [
          [
            "Step 1: Br2 (anti addition gives trans-1,2-dibromocyclopentane). Step 2: 2 equiv KOtBu or NaOEt (double E2 elimination gives cyclopenta-1,3-diene)",
            true
          ],
          [
            "Step 1: HBr (gives monobromide, not dibromide). Step 2: base",
            false
          ],
          [
            "Step 1: Br2/hv (radical addition gives cis product). Step 2: NaOH",
            false
          ],
          [
            "Step 1: NBS (gives allylic bromide). Step 2: base",
            false
          ]
        ]
      },
      "rule": "Br2 adds anti across the double bond giving trans-1,2-dibromocyclopentane. Two E2 eliminations with strong base (KOtBu) remove both HBr units to give cyclopenta-1,3-diene.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Br2 in the dark = electrophilic addition (anti, trans dibromide). Then E2 twice with bulky base.",
      "shortcut": "Br2 alone = anti addition. Br2/hv = radical (different mechanism, different stereo).",
      "whyTrapTempting": "Students mix up Br2/hv (radical, allylic) with Br2 alone (ionic addition to alkene).",
      "smiles": null
    },
    {
      "id": "alkene_stability_rank_2",
      "name": "Alkene Stability Ranking (4 Isomers)",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Rank the following four alkene isomers from most stable (1) to least stable (4): A = (E)-pent-2-ene (trans, disubstituted internal), B = 2-methylbut-2-ene (trisubstituted internal), C = (Z)-pent-2-ene (cis, disubstituted internal), D = penta-1,3-diene or pent-1-ene (terminal, monosubstituted). Which ranking is correct?",
        "opts": [
          [
            "B=1, A=2, C=3, D=4 (trisubstituted most stable, monosubstituted least stable)",
            true
          ],
          [
            "A=1, B=2, C=3, D=4 (trans always beats trisubstituted)",
            false
          ],
          [
            "D=1, C=2, A=3, B=4 (terminal most stable)",
            false
          ],
          [
            "All four have identical stability because they share the same molecular formula",
            false
          ]
        ]
      },
      "rule": "Alkene stability increases with substitution (more alkyl groups on sp2 carbons = more hyperconjugation and inductive stabilization). Trisubstituted > trans disubstituted > cis disubstituted > monosubstituted. Answer from image: B(trisubstituted)=1, A(trans)=2, C(cis)=3, D(terminal)=4.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Count substituents on the double bond carbons. More substituents = more stable.",
      "shortcut": "Substitution count is the primary driver: 3 > 2 trans > 2 cis > 1.",
      "whyTrapTempting": "Students sometimes rank trans above trisubstituted because trans sounds 'more stable' due to reduced steric strain, but substitution level dominates.",
      "smiles": null
    },
    {
      "id": "eu_calculation_1",
      "name": "Elements of Unsaturation for C5H8O",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the number of elements of unsaturation (degrees of unsaturation) for a compound with molecular formula C5H8O?",
        "opts": [
          [
            "2",
            true
          ],
          [
            "1",
            false
          ],
          [
            "3",
            false
          ],
          [
            "0",
            false
          ]
        ]
      },
      "rule": "EU = (2C + 2 - H) / 2, ignoring oxygen. EU = (2x5 + 2 - 8) / 2 = (12 - 8) / 2 = 4/2 = 2.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Write the formula. Ignore O. Apply EU = (2C + 2 - H) / 2.",
      "shortcut": "Oxygen does not change the EU formula. Treat C5H8O like C5H8.",
      "whyTrapTempting": "Students try to subtract oxygen from H or add it to the formula, inflating or deflating the count.",
      "smiles": null
    },
    {
      "id": "ez_assignment_two_alkenes_1",
      "name": "E/Z Configuration Assignment for Two Alkenes",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Compound A is a trisubstituted alkene with Cl on the same side as the longer chain (Cl and ethyl are on the same carbon, and the Cl is on the same face as the chain). Compound B has a vinyl group and an OCH3 group. Which statement is correct? A: (structure with Cl on one carbon, two-carbon chain on same carbon, methyl on other carbon, ethyl chain on other) B: (2-methylenepentene with OCH3 at bottom)",
        "opts": [
          [
            "A is Z and B is E",
            false
          ],
          [
            "A is E and B is Z",
            false
          ],
          [
            "A is E and B is E",
            false
          ]
        ]
      },
      "rule": "For A: on the Cl-bearing carbon, Cl > alkyl chain. On the other carbon, the longer chain > CH3. Cl and longer chain are on the same side = Z. For B: on the carbon with =CH2 and vinyl, the higher priority group; on the other carbon OCH3 > H. Assign E. Answer: b (A is Z, B is E).",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Assign CIP priorities to both substituents on each alkene carbon. Then determine same side (Z) or opposite side (E).",
      "shortcut": "Always assign priorities atom-by-atom by atomic number before deciding E/Z.",
      "whyTrapTempting": "Students guess based on which groups look 'bigger' visually rather than applying CIP rules, especially when heteroatoms like Cl or O are involved.",
      "smiles": null
    },
    {
      "id": "hbr_no_peroxide_predict_1",
      "name": "HBr (no peroxides) Addition to 2-Methylpropene",
      "reagents": "HBr, no peroxides",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "2-methylpropene (isobutylene, a trisubstituted terminal alkene) reacts with HBr (no peroxides). What is the major product?",
        "opts": [
          [
            "2-bromo-2-methylpropane (tert-butyl bromide, Br on tertiary carbon)",
            true
          ],
          [
            "1-bromo-2-methylpropane (isobutyl bromide, Br on primary carbon)",
            false
          ],
          [
            "1-bromo-2-methylpropene (addition to give allylic bromide)",
            false
          ],
          [
            "2-bromo-1-methylpropane (same as isobutyl bromide)",
            false
          ]
        ]
      },
      "rule": "No peroxides = ionic Markovnikov addition. H adds to less substituted carbon, Br adds to more substituted carbon (via tertiary carbocation intermediate). Product: 2-bromo-2-methylpropane.",
      "trap": "hbr_2methyl2butene_markov_1",
      "tier": "toggle",
      "firstMove": "No peroxides = Markovnikov. Identify the more substituted carbon (tertiary). Br goes there.",
      "shortcut": "HBr no peroxides: Br to the more substituted carbon always.",
      "whyTrapTempting": "Students flip the regiochemistry when the molecule has a branched terminus, thinking Br goes to C1 (end carbon).",
      "smiles": "CC(C)Br"
    },
    {
      "id": "oxymercuration_predict_1",
      "name": "Oxymercuration-Reduction Product",
      "reagents": "1. Hg(OAc)2, H2O; 2. NaBH4",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "2-methylpropene (isobutylene) undergoes oxymercuration-reduction (1. Hg(OAc)2/H2O, 2. NaBH4). What is the major product?",
        "opts": [
          [
            "2-methyl-2-propanol (tert-butanol; OH on tertiary carbon, Markovnikov)",
            true
          ],
          [
            "2-methyl-1-propanol (isobutanol; OH on primary carbon, anti-Markovnikov)",
            false
          ],
          [
            "2-methylpropane (over-reduction)",
            false
          ],
          [
            "2-methyl-1,2-propanediol (diol product)",
            false
          ]
        ]
      },
      "rule": "Oxymercuration-reduction gives Markovnikov alcohol without carbocation rearrangement. OH adds to more substituted carbon.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify more substituted carbon. OH goes there (Markovnikov, no rearrangement).",
      "shortcut": "Hg(OAc)2/H2O then NaBH4 = Markovnikov-OH, no rearrangement.",
      "whyTrapTempting": "Students confuse oxymercuration (Markovnikov) with hydroboration (anti-Markovnikov), placing OH at the wrong carbon.",
      "smiles": "CCC(O)C"
    },
    {
      "id": "hydrogenation_predict_1",
      "name": "Catalytic Hydrogenation Product",
      "reagents": "H2, Pt",
      "prod": {
        "type": "alkane"
      },
      "decision": {
        "q": "2-methylpropene reacts with H2/Pt. What is the major product?",
        "opts": [
          [
            "2-methylpropane (isobutane; fully saturated)",
            true
          ],
          [
            "2-methylpropanol (alcohol added)",
            false
          ],
          [
            "Butane (chain rearrangement occurs)",
            false
          ],
          [
            "No reaction occurs",
            false
          ]
        ]
      },
      "rule": "H2/Pt adds H2 across the double bond (syn addition, both H from same face) to give the saturated alkane. No rearrangement.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "H2/metal catalyst = hydrogenation. Add two H across the double bond.",
      "shortcut": "H2/Pt always gives alkane. Syn addition, no rearrangement.",
      "whyTrapTempting": "Students sometimes expect ring formation or a Markovnikov product when they see a catalyst.",
      "smiles": "CCCC"
    },
    {
      "id": "epoxidation_predict_1",
      "name": "Epoxidation with mCPBA",
      "reagents": "PhCO3H (mCPBA equivalent)",
      "prod": {
        "type": "epoxide"
      },
      "decision": {
        "q": "2-methylpropene reacts with PhCO3H (a peracid). What is the major product?",
        "opts": [
          [
            "2-methyl-1,2-epoxypropane (epoxide on the double bond, syn addition of oxygen)",
            true
          ],
          [
            "2-methyl-1,2-propanediol (diol; that requires OsO4 or KMnO4)",
            false
          ],
          [
            "2-bromo-2-methylpropanol (wrong reagent result)",
            false
          ],
          [
            "3-methylbut-1-ene (rearrangement product)",
            false
          ]
        ]
      },
      "rule": "Peracid (PhCO3H, mCPBA) delivers a single oxygen atom to the alkene in a concerted syn fashion to give the epoxide.",
      "trap": "osmium_cyclopentene_diol_1",
      "tier": "toggle",
      "firstMove": "Peracid = epoxidation. One O added, syn, forms 3-membered ring.",
      "shortcut": "PhCO3H or mCPBA always gives epoxide, never diol.",
      "whyTrapTempting": "Students confuse peracid epoxidation with OsO4 dihydroxylation, both of which are syn but give epoxide vs. diol respectively.",
      "smiles": "C1OC1(C)CC"
    },
    {
      "id": "e2_elimination_naoch3_1",
      "name": "E2 Elimination with NaOCH3 from Secondary Alkyl Bromide",
      "reagents": "NaOCH3",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "A secondary alkyl bromide (2-bromo-2-methylbutane equivalent from image 149e: a disubstituted secondary alkyl bromide) reacts with NaOCH3. What is the major product?",
        "opts": [
          [
            "The more substituted alkene (Zaitsev product, E2 elimination toward more substituted carbon)",
            true
          ],
          [
            "The less substituted alkene (Hofmann product)",
            false
          ],
          [
            "The substitution product (ether via SN2)",
            false
          ],
          [
            "No reaction",
            false
          ]
        ]
      },
      "rule": "NaOCH3 is a strong, moderately hindered base. With a secondary substrate it favors E2. Zaitsev's rule: the more substituted (more stable) alkene is the major product. Image confirms E2 (Zaitsev) product.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Strong base + secondary alkyl halide = E2. Apply Zaitsev: eliminate toward more substituted side.",
      "shortcut": "NaOCH3 = strong base = E2 for secondary/tertiary halides. Zaitsev product unless bulky base.",
      "whyTrapTempting": "Students think methoxide will do SN2 because it is an alkoxide nucleophile, but with a secondary substrate E2 dominates.",
      "smiles": "CC=CCC"
    },
    {
      "id": "e2_bulky_base_cyclohexyl_1",
      "name": "E2 with Bulky Base (KOCMe3) from Bromocyclohexane",
      "reagents": "KOCMe3 (potassium tert-butoxide)",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Bromocyclohexane with a methyl group (bromomethylcyclohexane or 1-bromo-1-methylcyclohexane) reacts with KOCMe3 (potassium tert-butoxide). What is the major product?",
        "opts": [
          [
            "Less substituted alkene (Hofmann product) because bulky base cannot access the more hindered beta-hydrogen",
            true
          ],
          [
            "More substituted alkene (Zaitsev product)",
            false
          ],
          [
            "Substitution product (tert-butyl ether)",
            false
          ],
          [
            "No reaction because the base is too bulky to abstract any proton",
            false
          ]
        ]
      },
      "rule": "Bulky base (KOtBu) cannot access the more hindered beta-H adjacent to the more substituted carbon. It preferentially abstracts the less hindered beta-H, giving the less substituted (Hofmann) alkene.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify the base as bulky (KOtBu). Bulky base = Hofmann product (less substituted alkene).",
      "shortcut": "Bulky base = less substituted alkene. Non-bulky base = more substituted alkene (Zaitsev).",
      "whyTrapTempting": "Students default to Zaitsev without checking whether the base is bulky. The image answer confirms the Hofmann product for KOCMe3.",
      "smiles": "C1=CCCCC1"
    },
    {
      "id": "bromination_cyclohexene_stereo_1",
      "name": "Bromohydrin from Cyclohexene: Stereochemistry",
      "reagents": "Br2, H2O",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Cyclohexene reacts with Br2 in H2O. What is the major product, and what is its stereochemistry?",
        "opts": [
          [
            "trans-2-bromocyclohexan-1-ol (anti addition, racemic mixture)",
            true
          ],
          [
            "cis-2-bromocyclohexan-1-ol (syn addition product)",
            false
          ],
          [
            "1,2-dibromocyclohexane (both bromines added)",
            false
          ],
          [
            "cyclohexanone (oxidation product)",
            false
          ]
        ]
      },
      "rule": "Br2 in H2O forms a bromonium ion intermediate; water attacks anti to Br, giving trans (anti) bromohydrin. The two attack faces give a racemic mixture.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify the reagent: Br2/H2O forms a bromonium ion, not a simple electrophilic addition",
      "shortcut": "Br2/H2O = bromohydrin = anti addition = trans relationship between OH and Br",
      "whyTrapTempting": "Students expect both groups to add to the same face (syn), forgetting the bromonium ion forces anti attack by water",
      "smiles": "C1CCCCC1"
    },
    {
      "id": "osmium_cyclopentene_diol_1",
      "name": "Syn Dihydroxylation of Cyclopentene",
      "reagents": "OsO4, H2O2",
      "prod": {
        "type": "diol"
      },
      "decision": {
        "q": "Cyclopentene reacts with OsO4 followed by H2O2. What is the major product and its stereochemistry?",
        "opts": [
          [
            "cis-cyclopentane-1,2-diol (syn addition, both OH on same face)",
            true
          ],
          [
            "trans-cyclopentane-1,2-diol (anti addition product)",
            false
          ],
          [
            "cyclopentanone (oxidative cleavage product)",
            false
          ],
          [
            "cyclopentanol (single hydroxyl addition)",
            false
          ]
        ]
      },
      "rule": "OsO4 forms a cyclic osmate ester that delivers both oxygens to the same face (syn). H2O2 cleaves the osmate ester to give the cis-diol.",
      "trap": "epoxidation_predict_1",
      "tier": "toggle",
      "firstMove": "Identify OsO4 as a syn dihydroxylation reagent",
      "shortcut": "OsO4 = syn diol = cis relationship between OH groups",
      "whyTrapTempting": "Students confuse OsO4 (syn) with mCPBA/H2O (anti, via epoxide opening) and predict the trans diol",
      "smiles": "C1CCCC1"
    },
    {
      "id": "hydroboration_methylenecyclopentane_1",
      "name": "Hydroboration-Oxidation of Methylenecyclopentane",
      "reagents": "1. BH3/THF; 2. H2O2, NaOH",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Methylenecyclopentane (exocyclic double bond) reacts with 1. BH3/THF, 2. H2O2/NaOH. What is the major product?",
        "opts": [
          [
            "cyclopentylmethanol (exo alcohol, anti-Markovnikov, syn addition)",
            true
          ],
          [
            "1-methylcyclopentan-1-ol (Markovnikov alcohol at tertiary carbon)",
            false
          ],
          [
            "cyclopentanone (oxidation product)",
            false
          ],
          [
            "1-methylcyclopentanol with trans OH and H",
            false
          ]
        ]
      },
      "rule": "Hydroboration is syn and anti-Markovnikov: boron goes to the less substituted carbon (exo CH2), then oxidation replaces B with OH with retention. Product is cyclopentylmethanol.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify hydroboration-oxidation as anti-Markovnikov, syn addition",
      "shortcut": "BH3 then H2O2/NaOH = anti-Markovnikov alcohol = OH on less substituted carbon",
      "whyTrapTempting": "Students apply Markovnikov's rule and put OH on the tertiary carbon, confusing hydroboration with acid-catalyzed hydration",
      "smiles": "C1(=C)CCC1"
    },
    {
      "id": "peracid_epoxidation_2butene_1",
      "name": "Peracid Epoxidation of (E)-2-butene",
      "reagents": "CH3CO3H, H2O",
      "prod": {
        "type": "diol"
      },
      "decision": {
        "q": "(E)-2-butene reacts with CH3CO3H (peracetic acid) in H2O. What is the stereochemical outcome?",
        "opts": [
          [
            "trans-2,3-butanediol (anti addition via epoxide opening with water)",
            true
          ],
          [
            "cis-2,3-butanediol (syn addition product)",
            false
          ],
          [
            "meso-2,3-butanediol (syn addition from both faces equally)",
            false
          ],
          [
            "racemic 2,3-dibromobutane (wrong reagent product)",
            false
          ]
        ]
      },
      "rule": "Peracid (mCPBA or CH3CO3H) delivers oxygen syn to give an epoxide; water then opens the epoxide anti (backside attack). For (E)-2-butene, the two-step anti addition gives racemic (2R,3R) and (2S,3S) trans-diol.",
      "trap": "osmium_cyclopentene_diol_1",
      "tier": "toggle",
      "firstMove": "Recognize CH3CO3H as peracid = epoxidation, then consider how water opens the epoxide",
      "shortcut": "Peracid + H2O = anti diol overall; (E)-alkene + anti addition = racemic trans-diol",
      "whyTrapTempting": "Students forget the anti opening step and predict cis (syn) product, or confuse peracid with OsO4",
      "smiles": "C(/C)=C/C"
    },
    {
      "id": "alkene_stability_rank_1",
      "name": "Alkene Stability Ranking",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Put these alkenes in order from MOST stable to LEAST stable: (E)-2-hexene, (E)-3-methyl-2-pentene, (Z)-2-hexene, 1-hexene, 2,3-dimethyl-2-butene",
        "opts": [
          [
            "2,3-dimethyl-2-butene > (E)-3-methyl-2-pentene > (E)-2-hexene > (Z)-2-hexene > 1-hexene",
            true
          ],
          [
            "(E)-2-hexene > (Z)-2-hexene > 2,3-dimethyl-2-butene > (E)-3-methyl-2-pentene > 1-hexene",
            false
          ],
          [
            "2,3-dimethyl-2-butene > (E)-2-hexene > (Z)-2-hexene > (E)-3-methyl-2-pentene > 1-hexene",
            false
          ],
          [
            "(E)-3-methyl-2-pentene > 2,3-dimethyl-2-butene > (E)-2-hexene > 1-hexene > (Z)-2-hexene",
            false
          ]
        ]
      },
      "rule": "Stability increases with more alkyl substituents on the double bond (hyperconjugation and induction). Tetrasubstituted > trisubstituted > disubstituted trans > disubstituted cis > monosubstituted. 2,3-dimethyl-2-butene (tetra) > (E)-3-methyl-2-pentene (tri) > (E)-2-hexene (di,trans) > (Z)-2-hexene (di,cis) > 1-hexene (mono).",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Count substituents on each carbon of the double bond for each alkene",
      "shortcut": "More alkyl groups on C=C = more stable; trans > cis for same substitution pattern",
      "whyTrapTempting": "Students forget that cis disubstituted is less stable than trans (steric strain) and rank them equally, or rank by chain length instead of substitution",
      "smiles": null
    },
    {
      "id": "reverse_synthesis_bromine_addition_1",
      "name": "Identify Starting Alkene from Anti Addition Product",
      "reagents": "Br2",
      "prod": {
        "type": "add",
        "stereo": "anti"
      },
      "decision": {
        "q": "A compound reacts with Br2 to give a product with two Br atoms added in anti fashion across a double bond. What type of starting material is required?",
        "opts": [
          [
            "An alkene (C=C double bond)",
            true
          ],
          [
            "An alkyne (C triple bond C)",
            false
          ],
          [
            "An alcohol (C-OH)",
            false
          ],
          [
            "An alkane (no unsaturation)",
            false
          ]
        ]
      },
      "rule": "Br2 adds across C=C double bonds via bromonium ion intermediate giving anti addition of the two bromines. The starting material must be an alkene.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Work backwards: two bromines added anti = Br2 addition to a C=C",
      "shortcut": "Vicinal dibromide with anti stereochemistry = came from alkene + Br2",
      "whyTrapTempting": "Students may think an alkyne would also work, forgetting that would give a vinyl dibromide first",
      "smiles": null
    },
    {
      "id": "reverse_synthesis_hydroboration_alcohol_1",
      "name": "Identify Reagents for Anti-Markovnikov Alcohol from Alkene",
      "reagents": "",
      "prod": {
        "type": "add",
        "c1": "1-pentanol"
      },
      "decision": {
        "q": "Starting from pent-1-ene (CH3CH2CH2CH=CH2), what reagents give 1-pentanol (anti-Markovnikov alcohol)?",
        "opts": [
          [
            "1. BH3/THF; 2. H2O2, NaOH",
            true
          ],
          [
            "H2O, H2SO4 (acid-catalyzed hydration)",
            false
          ],
          [
            "1. Hg(OAc)2, H2O; 2. NaBH4",
            false
          ],
          [
            "HBr, then NaOH",
            false
          ]
        ]
      },
      "rule": "Anti-Markovnikov alcohol addition requires hydroboration-oxidation (BH3/THF then H2O2/NaOH). Acid-catalyzed hydration and oxymercuration-demercuration both give Markovnikov (more-substituted) alcohol.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Recognize anti-Markovnikov means OH goes to less-substituted carbon; only hydroboration-oxidation does this",
      "shortcut": "Anti-Markovnikov OH = BH3/THF then H2O2/NaOH",
      "whyTrapTempting": "Oxymercuration-demercuration also makes an alcohol from an alkene, but it is Markovnikov; students confuse the two routes",
      "smiles": null
    },
    {
      "id": "reagent_deduction_cycloalkyl_alcohol_to_diol_1",
      "name": "Reagents for Syn Diol from Cycloalkanol",
      "reagents": "",
      "prod": {
        "type": "diol",
        "c1": "cis-diol product",
        "stereo": "syn"
      },
      "decision": {
        "q": "Cyclopentanol with a CH3 group needs to be converted to a product with a CH3 group, an OH, and a second OH in a syn (cis) relationship. What two-step reagent sequence works?",
        "opts": [
          [
            "1. H2SO4 (eliminate to alkene); then 2. OsO4 (syn dihydroxylation)",
            true
          ],
          [
            "1. Br2; 2. NaOH",
            false
          ],
          [
            "1. mCPBA; 2. H2O, H+",
            false
          ],
          [
            "1. KMnO4; 2. H2SO4",
            false
          ]
        ]
      },
      "rule": "The answer shown in the exam is: 1. H2SCy4, H+; 2. OsCy4, H2O2 (i.e. eliminate to alkene, then syn-dihydroxylate with OsO4). OsO4 delivers both OH syn.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Target is syn diol, so need OsO4 on an alkene; first generate the alkene by elimination",
      "shortcut": "Syn diol target = OsO4 route; need alkene first if starting from alcohol",
      "whyTrapTempting": "Students choose mCPBA + H2O, H+ which gives anti diol (epoxide opens anti), not syn",
      "smiles": null
    },
    {
      "id": "multistep_sequence_2hexene_dehydration_1",
      "name": "Multi-step: Acid Hydration then Dehydration of (E)-2-pentene",
      "reagents": "1. H2O, H+; 2. H2SO4, heat",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "A trisubstituted acyclic alkene is treated with: 1. H2O, H+; 2. H2SO4 heat. The answer image shows the intermediate is an alcohol and the final product is a more substituted alkene (after rearrangement or Zaitsev elimination). Which statement best describes the overall transformation?",
        "opts": [
          [
            "Markovnikov hydration gives the more-substituted alcohol, then dehydration (Zaitsev) gives the most substituted alkene",
            true
          ],
          [
            "Anti-Markovnikov hydration then dehydration gives the least substituted alkene",
            false
          ],
          [
            "Hydration gives a diol, then dehydration gives an epoxide",
            false
          ],
          [
            "The alkene is unchanged because the two steps cancel each other out",
            false
          ]
        ]
      },
      "rule": "H2O/H+ adds water Markovnikov to give more-substituted alcohol. H2SO4/heat causes E1 or E2 elimination following Zaitsev to give the most stable (most substituted) alkene. If a carbocation rearrangement is possible, the more stable carbocation forms first.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Step 1: identify Markovnikov alcohol; Step 2: identify Zaitsev elimination product",
      "shortcut": "H2O/H+ then H2SO4/heat = net isomerization to more stable alkene via alcohol",
      "whyTrapTempting": "Students think the sequence is pointless (net zero change) rather than recognizing it isomerizes the alkene to a more substituted position",
      "smiles": "CC=CCC"
    },
    {
      "id": "multistep_cyclopentene_hbr_kocme3_br2_1",
      "name": "Multi-step: HBr/peroxides then KOCMe3 then Br2 on Cyclopentene",
      "reagents": "1. HBr, peroxides; 2. KOCMe3; 3. Br2",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Cyclopentene is treated with: 1. HBr/peroxides; 2. KOCMe3; 3. Br2. What is the major product?",
        "opts": [
          [
            "1,2-dibromocyclopentane with anti (trans) stereochemistry",
            true
          ],
          [
            "1,2-dibromocyclopentane with syn (cis) stereochemistry",
            false
          ],
          [
            "3-bromocyclopentene (allyl bromide)",
            false
          ],
          [
            "Cyclopentane (fully reduced product)",
            false
          ]
        ]
      },
      "rule": "Step 1: HBr/peroxides = anti-Markovnikov addition, gives bromocyclopentane. Step 2: KOCMe3 = bulky base, E2 elimination, gives cyclopentene (or isomeric alkene). Step 3: Br2 adds anti via bromonium ion. Net result is trans-1,2-dibromocyclopentane.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Trace each step: anti-Markovnikov HBr, then elimination with bulky base, then anti Br2 addition",
      "shortcut": "Br2 always adds anti = trans dibromide on cyclopentane ring",
      "whyTrapTempting": "Students may think the sequence gives a syn product because two bromination steps are involved",
      "smiles": "C1CCCC1"
    },
    {
      "id": "reagents_elimination_cyclobutylbr_1",
      "name": "Reagents: E2 Elimination of Bromocyclohexane to Cyclohexene",
      "reagents": "",
      "prod": {
        "type": "add",
        "c1": "cyclohexene"
      },
      "decision": {
        "q": "Bromocyclohexane needs to be converted to cyclohexene. Which reagent set accomplishes this?",
        "opts": [
          [
            "1. NEt3 (or any base); 2. H2, Pt",
            false
          ],
          [
            "1. NEt3 (tertiary amine base)",
            true
          ],
          [
            "1. NaOH, H2O (aqueous conditions)",
            false
          ],
          [
            "1. KOCMe3 (bulky base in tBuOH)",
            false
          ]
        ]
      },
      "rule": "The answer shown is NEt3 (or any base) for E2 elimination of HBr. Aqueous NaOH would favor SN2 substitution (giving cyclohexanol). KOCMe3 also works but NEt3 is shown explicitly in the answer image.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Target is alkene = elimination; choose base conditions (not nucleophile/water)",
      "shortcut": "Alkyl halide + base = elimination to alkene; strong bulky base favors E2",
      "whyTrapTempting": "NaOH in water looks like a base but is a better nucleophile under aqueous conditions, giving substitution instead of elimination",
      "smiles": "BrC1CCCCC1"
    },
    {
      "id": "reagents_cycloalkanol_to_cis_diol_1",
      "name": "Reagents: Convert Cycloalkanol to cis-Diol with Methyl Group",
      "reagents": "",
      "prod": {
        "type": "diol",
        "c1": "syn-diol with methyl substituent",
        "stereo": "syn"
      },
      "decision": {
        "q": "Starting from (1-methylcyclohexyl)methanol (exo alcohol), what sequence gives a product with both a CH3 group and two OH groups in a syn relationship on a cyclopentane ring?",
        "opts": [
          [
            "1. H2SO4, H+ (dehydration); 2. OsO4, H2O2 (syn dihydroxylation)",
            true
          ],
          [
            "1. PBr3; 2. NaOH (SN2)",
            false
          ],
          [
            "1. mCPBA; 2. H3O+ (epoxide opening)",
            false
          ],
          [
            "1. KMnO4, cold; 2. H2O",
            false
          ]
        ]
      },
      "rule": "The exam answer shows: 1. H2SCy4, H+ to dehydrate the alcohol to an alkene; 2. OsCy4, H2O2 to syn-dihydroxylate. This gives a cis-diol with the CH3 group intact.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Target has cis OH groups = syn dihydroxylation needed; use OsO4 after generating alkene",
      "shortcut": "Cis-diol = OsO4 route; anti-diol = epoxide route",
      "whyTrapTempting": "Students pick mCPBA + H3O+ for the diol, but that gives anti (trans) opening",
      "smiles": null
    },
    {
      "id": "e2_elimination_stereospecific_1",
      "name": "E2 Elimination Stereospecificity with NaOH",
      "reagents": "NaOH",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "A molecule with Br and OMe on adjacent carbons (with specific stereochemistry: Br Me on one carbon, OMe Me on adjacent carbon, with Ph group and H) undergoes E2 with NaOH. Which alkene is the major product?",
        "opts": [
          [
            "(E)-1-methoxy-1,2-dimethyl-2-phenylethylene (Ph, Me, OMe, Me all on C=C, E configuration)",
            true
          ],
          [
            "(Z)-isomer of the same alkene",
            false
          ],
          [
            "Elimination does not occur; substitution gives an ether instead",
            false
          ],
          [
            "Hofmann product (least substituted alkene)",
            false
          ]
        ]
      },
      "rule": "E2 requires anti-periplanar H and leaving group. The answer shows the product is a trisubstituted alkene with Ph, two Me groups, and OMe. The handwritten answer shows Ph-C(CH3)=C(CH3)-OMe, which is the Zaitsev-like most substituted product formed by anti-periplanar elimination.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify anti-periplanar H relative to Br using the 3D structure; E2 is stereospecific",
      "shortcut": "E2 = anti-periplanar geometry required; the H that is anti to Br is the one that leaves",
      "whyTrapTempting": "Students pick the Z-isomer or forget that E2 is stereospecific, predicting either isomer randomly",
      "smiles": null
    },
    {
      "id": "c4h8_alkene_isomers_count_1",
      "name": "How Many Alkene Isomers Does C4H8 Have?",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "The molecular formula C4H8 reacts with H2/Pt to give C4H10. This confirms it is an alkene (degree of unsaturation = 1). How many distinct alkene isomers (including stereoisomers) are possible?",
        "opts": [
          [
            "4 (1-butene, (E)-2-butene, (Z)-2-butene, 2-methylpropene)",
            true
          ],
          [
            "3 (1-butene, 2-butene, 2-methylpropene)",
            false
          ],
          [
            "5 (including cyclobutane)",
            false
          ],
          [
            "2 (only 1-butene and 2-butene)",
            false
          ]
        ]
      },
      "rule": "The exam answer confirms 4 alkene isomers: 1-butene (monosubstituted), (E)-2-butene, (Z)-2-butene (both disubstituted), and 2-methylpropene (disubstituted, no E/Z). The degree of unsaturation calculation EU=1 confirms it is an alkene (not cycloalkane, which is a separate isomer class).",
      "trap": null,
      "tier": "recognise",
      "firstMove": "List all possible carbon skeletons for C4 with one double bond, then check each for E/Z isomers",
      "shortcut": "C4H8 alkenes: n-butene (two positions) + branched (one); 2-butene has E/Z = 4 total",
      "whyTrapTempting": "Students count only constitutional isomers (3) and forget that (E)- and (Z)-2-butene are distinct stereoisomers",
      "smiles": null
    },
    {
      "id": "cis_trans_naming_dibromoethene_1",
      "name": "Cis/Trans Naming of 1,2-Dibromoethene Isomers",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Two structures of 1,2-dibromoethene are shown. Structure A has H and Br on the same carbon on each side, with the two Br atoms on opposite sides of the double bond. Structure B has Br and Br on the same side. What are the correct cis/trans names?",
        "opts": [
          [
            "A = trans-1,2-dibromoethene; B = cis-1,2-dibromoethene",
            true
          ],
          [
            "A = cis-1,2-dibromoethene; B = trans-1,2-dibromoethene",
            false
          ],
          [
            "Both are the same compound; no cis/trans isomers exist for dibromoethene",
            false
          ],
          [
            "A = (E)-1,2-dibromoethene; B = (Z)-1,2-dibromoethene (cis/trans naming does not apply here)",
            false
          ]
        ]
      },
      "rule": "Structure A has H and Br on each carbon with the two Br on opposite sides = trans. Structure B has both Br on the same side = cis. The exam answer confirms A = trans, B = cis.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Focus on the highest-priority group (Br) on each carbon; if both Br are on same side = cis",
      "shortcut": "Same groups same side = cis; same groups opposite sides = trans",
      "whyTrapTempting": "Students look at H instead of Br, or mix up which groups to compare, reversing the assignment",
      "smiles": null
    },
    {
      "id": "ozonolysis_reverse_product_1",
      "name": "Identify Alkene from Ozonolysis Products",
      "reagents": "1. O3; 2. Me2S",
      "prod": {
        "type": "cleave",
        "c1": "acetaldehyde (CH3CHO)",
        "c2": "acetaldehyde (CH3CHO)"
      },
      "decision": {
        "q": "Ozonolysis (1. O3; 2. Me2S) of an unknown alkene gives two aldehyde fragments: MeCHO and MeCHO (i.e., two equivalents of acetaldehyde). What was the starting alkene?",
        "opts": [
          [
            "(E)-2-butene or (Z)-2-butene",
            true
          ],
          [
            "1-butene",
            false
          ],
          [
            "2-methylpropene",
            false
          ],
          [
            "1,3-butadiene",
            false
          ]
        ]
      },
      "rule": "Reductive ozonolysis (O3 then Me2S) cleaves C=C to give two carbonyl fragments. If both fragments are CH3CHO, reconnect: CH3CH=CHCH3 = 2-butene (E or Z). 1-butene would give HCHO + CH3CH2CHO.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Reconnect the two carbonyl carbons at the C=O position to reconstruct the alkene",
      "shortcut": "Each aldehyde/ketone fragment contributes one carbon of the former double bond; join them C=C",
      "whyTrapTempting": "Students forget to join the carbonyl carbons and instead try to identify from the full fragment structure",
      "smiles": null
    },
    {
      "id": "ozonolysis_ketone_fragment_1",
      "name": "Identify Alkene from Ozonolysis Giving Ketone and Aldehyde",
      "reagents": "1. O3; 2. Me2S",
      "prod": {
        "type": "cleave",
        "c1": "linear dialdehyde/diketone chain"
      },
      "decision": {
        "q": "Ozonolysis of a cyclic alkene gives the product MeC(=O)-CH2-CH2-CH(=O)Me (a diketone-dialdehyde linear chain). The exam image shows two ketone/aldehyde groups. What class of starting alkene gives this fragmentation pattern?",
        "opts": [
          [
            "A cyclic alkene (ozonolysis of a ring opens the ring to give a single bifunctional chain)",
            true
          ],
          [
            "A linear diene (would give three fragments)",
            false
          ],
          [
            "A terminal alkene (would give formaldehyde as one fragment)",
            false
          ],
          [
            "An acyclic internal alkene (would give two separate fragments)",
            false
          ]
        ]
      },
      "rule": "When a cyclic alkene undergoes ozonolysis, the ring opens and both carbons of the C=C become carbonyl groups in the same molecule, giving a single linear bifunctional product. The specific product shown (Me-CO-CH2-CH2-CHO-Me) indicates the starting material was a substituted cyclopentene or similar.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "One product molecule from ozonolysis = must be cyclic starting material (ring opened)",
      "shortcut": "One bifunctional product from ozonolysis = cyclic alkene; two separate products = acyclic alkene",
      "whyTrapTempting": "Students expect ozonolysis to always give two separate fragments and don't recognize cyclic alkene cleavage gives a single chain",
      "smiles": null
    },
    {
      "id": "kmno4_oxidation_product_1",
      "name": "KMnO4 Oxidation Product Identification",
      "reagents": "KMnO4",
      "prod": {
        "type": "diol"
      },
      "decision": {
        "q": "A cyclic alkene is treated with cold, dilute KMnO4. What is the product and its stereochemistry?",
        "opts": [
          [
            "syn-diol (cis-diol) via oxidative syn dihydroxylation",
            true
          ],
          [
            "anti-diol (trans-diol) via anti addition",
            false
          ],
          [
            "Carboxylic acids from oxidative cleavage",
            false
          ],
          [
            "Epoxide via oxygen transfer",
            false
          ]
        ]
      },
      "rule": "Cold, dilute KMnO4 acts like OsO4 -- it forms a cyclic manganate ester delivering both oxygens syn. Hot, concentrated KMnO4 causes oxidative cleavage to carboxylic acids/ketones. The exam image shows KMnO4 cold (no delta) so the product is the syn-diol.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Check conditions: cold/dilute KMnO4 = syn diol; hot/conc KMnO4 = cleavage",
      "shortcut": "Cold KMnO4 = syn diol (like OsO4); hot KMnO4 = oxidative cleavage",
      "whyTrapTempting": "Students apply the hot KMnO4 (cleavage) rule to cold KMnO4 conditions, or reverse the stereochemistry",
      "smiles": null
    },
    {
      "id": "zaitsev_e1_major_product_1",
      "name": "E1 Elimination: Zaitsev Major Product",
      "reagents": "E1 conditions (heat, no strong base)",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "A tertiary alkyl bromide (bromocyclohexane ring with two methyl groups) undergoes E1 elimination. Three possible alkenes can form: a disubstituted (N), trisubstituted (O), and tetrasubstituted (P). Which is the major product?",
        "opts": [
          [
            "Tetrasubstituted alkene P (most substituted, most stable)",
            true
          ],
          [
            "Disubstituted alkene N (least substituted, Hofmann product)",
            false
          ],
          [
            "Trisubstituted alkene O (intermediate stability)",
            false
          ],
          [
            "Equal mixture of all three alkenes",
            false
          ]
        ]
      },
      "rule": "E1 follows Zaitsev's rule: the major product is the most substituted (most stable) alkene. The tetrasubstituted alkene P is major; trisubstituted O is minor; disubstituted N is trace. This is confirmed in the exam question text.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Count substituents on each possible C=C; E1/Zaitsev = most substituted wins",
      "shortcut": "E1 with no bulky base = Zaitsev = most substituted alkene is major product",
      "whyTrapTempting": "Students confuse E1 (Zaitsev) with E2 using a bulky base (Hofmann), or think all three form equally",
      "smiles": null
    },
    {
      "id": "syn_addition_d2_cycloalkene_achiral_1",
      "name": "Syn D2 Addition: Which Cycloalkene Gives a Single Achiral Product?",
      "reagents": "D2, Pt",
      "prod": {
        "type": "alkane"
      },
      "decision": {
        "q": "When a cycloalkene reacts with D2/Pt (syn addition of deuterium), which structural feature of the alkene guarantees a single achiral product?",
        "opts": [
          [
            "The alkene must be symmetric (a meso-generating substrate where syn addition from both faces gives the same meso compound)",
            true
          ],
          [
            "Any cycloalkene gives a single achiral product with D2",
            false
          ],
          [
            "The alkene must be terminal (exo double bond) for achiral product",
            false
          ],
          [
            "A chiral cycloalkene always gives a single achiral product by D2 addition",
            false
          ]
        ]
      },
      "rule": "The exam shows cycloalkene E (a 1,2-dimethylcyclobutene with specific stereochemistry) reacts with D2/Pt to give a single achiral product (meso compound I). This happens because the alkene is symmetric so syn addition from either face gives the same meso product. An asymmetric cycloalkene would give a mixture of enantiomers.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Check if the alkene is symmetric about the C=C; if yes, syn addition gives one compound (meso)",
      "shortcut": "Symmetric alkene + D2 = single meso product; asymmetric alkene + D2 = racemic pair",
      "whyTrapTempting": "Students assume D2 always gives a single product, forgetting that asymmetric alkenes give two enantiomeric products",
      "smiles": null
    },
    {
      "id": "relationship_diastereomers_1",
      "name": "Stereochemical Relationship: Diastereomers vs Enantiomers",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Two achiral compounds N and O are formed from syn addition of D2 to the same cycloalkene E from two different faces. What is the relationship between compounds N and O?",
        "opts": [
          [
            "Diastereomers (same connectivity, different spatial arrangement, both achiral)",
            true
          ],
          [
            "Enantiomers (mirror images of each other)",
            false
          ],
          [
            "Constitutional isomers (different connectivity)",
            false
          ],
          [
            "Conformational isomers (same compound in different conformations)",
            false
          ]
        ]
      },
      "rule": "The exam answer explicitly circles DIASTEREOMERS. N and O have the same molecular formula and connectivity (both are deuterated cyclopentane derivatives from the same alkene) but different spatial arrangements of D atoms. Both are achiral, so they cannot be enantiomers (which must be non-superimposable mirror images).",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Check: are both compounds achiral? If yes, they cannot be enantiomers; they must be diastereomers",
      "shortcut": "Two achiral stereoisomers with same connectivity = diastereomers (one may be meso)",
      "whyTrapTempting": "Students see two stereoisomers from the same reaction and automatically call them enantiomers, forgetting enantiomers must be non-superimposable mirror images",
      "smiles": null
    },
    {
      "id": "cistrans_condition_1",
      "name": "Cis/Trans Isomerism Requirement",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "The necessary and sufficient condition for an alkene to exhibit geometric (cis/trans) isomerism is that:",
        "opts": [
          [
            "all four groups attached to the carbons joined by the double bond must be different",
            false
          ],
          [
            "both groups attached to one of the carbons joined by the double bond must be the same",
            false
          ],
          [
            "both groups attached to one of the carbons joined by the double bond must be different from each other",
            false
          ],
          [
            "both groups attached to one of the carbons joined by the double bond must be different from each other AND both groups attached to the other carbon joined by the double bond must be different from each other",
            true
          ]
        ]
      },
      "rule": "Each sp2 carbon of the double bond must bear two DIFFERENT substituents. If either carbon has two identical groups, free rotation around that bond is irrelevant — cis/trans isomers cannot exist. Both carbons must independently satisfy this condition.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Check each double-bond carbon separately: does it have two different groups?",
      "shortcut": "Two carbons, each needs two different groups — that is the full requirement, nothing more, nothing less.",
      "whyTrapTempting": "Choice A sounds thorough because it mentions 'all four groups', but requiring all four to be different is too strict — you only need each pair on a given carbon to be different from each other.",
      "smiles": null
    },
    {
      "id": "stability_rank_4alkenes_1",
      "name": "Alkene Stability Ranking: Tri vs Di vs Mono",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Arrange these four alkenes in order of DECREASING stability (most stable first): I = (CH3)2C=CHCH3 [trisubstituted, 3 alkyl groups], II = (CH3)CH=CHCH3 [disubstituted trans], III = (CH3)CH=CHC(CH3)3 [disubstituted, one very bulky group], IV = (CH3)CH=CH2 [monosubstituted]",
        "opts": [
          [
            "I > II > III > IV",
            false
          ],
          [
            "IV > III > II > I",
            false
          ],
          [
            "I > IV > II > III",
            true
          ],
          [
            "III > I > IV > II",
            false
          ]
        ]
      },
      "rule": "More alkyl substituents on the double bond = greater stability (hyperconjugation/induction). I has 3 alkyl groups (most stable). Among disubstituted alkenes, trans > cis due to reduced steric strain, and bulkier substituents add slight strain. The answer shown is I > IV > II > III.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Count the alkyl substituents directly bonded to each double-bond carbon.",
      "shortcut": "Trisubstituted beats disubstituted beats monosubstituted. Among equal substitution levels, trans beats cis.",
      "whyTrapTempting": "Choice A (I>II>III>IV) feels right because it follows substitution count, but it does not correctly account for the steric strain difference between III (very bulky C(CH3)3 group) and IV (monosubstituted).",
      "smiles": null
    },
    {
      "id": "stability_rank_5alkenes_1",
      "name": "Alkene Stability Ranking: Five Named Alkenes",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Put the following alkenes in order of stability from most stable to least stable: (E)-3-methyl-2-pentene, (E)-2-hexene, (R)-3-methyl-1-pentene, 2,3-dimethyl-2-butene, (Z)-2-hexene",
        "opts": [
          [
            "2,3-dimethyl-2-butene > (E)-3-methyl-2-pentene > (E)-2-hexene > (Z)-2-hexene > (R)-3-methyl-1-pentene",
            true
          ],
          [
            "(E)-3-methyl-2-pentene > 2,3-dimethyl-2-butene > (E)-2-hexene > (Z)-2-hexene > (R)-3-methyl-1-pentene",
            false
          ],
          [
            "2,3-dimethyl-2-butene > (E)-2-hexene > (E)-3-methyl-2-pentene > (R)-3-methyl-1-pentene > (Z)-2-hexene",
            false
          ],
          [
            "(E)-2-hexene > 2,3-dimethyl-2-butene > (E)-3-methyl-2-pentene > (Z)-2-hexene > (R)-3-methyl-1-pentene",
            false
          ]
        ]
      },
      "rule": "The answer key labels most stable=1, least stable=5: 2,3-dimethyl-2-butene (tetrasubstituted, rank 1) > (E)-3-methyl-2-pentene (trisubstituted, rank 2) > (E)-2-hexene (disubstituted trans, rank 3) > (Z)-2-hexene (disubstituted cis, rank 4) > (R)-3-methyl-1-pentene (monosubstituted terminal, rank 5).",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Count substituents on the double bond for each alkene, then use E > Z as a tiebreaker.",
      "shortcut": "Tetra > tri > di-trans > di-cis > mono. Match each name to its substitution level.",
      "whyTrapTempting": "Swapping 2,3-dimethyl-2-butene and (E)-3-methyl-2-pentene is tempting because both are highly substituted, but tetrasubstituted always beats trisubstituted.",
      "smiles": null
    },
    {
      "id": "ez_assign_A_1",
      "name": "E/Z Assignment: Alkene with F and Br",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Molecule A shows a tetrasubstituted alkene with F and Br on the same carbon of the double bond (one sp2 carbon bears F and Br; the other bears a sec-butyl group and an ethyl group). What is the correct E/Z designation?",
        "opts": [
          [
            "E",
            false
          ],
          [
            "Z",
            true
          ],
          [
            "Cannot be determined without a 3D model",
            false
          ],
          [
            "Neither E nor Z — the molecule has no geometric isomerism",
            false
          ]
        ]
      },
      "rule": "Apply CIP priority to each carbon of the double bond. On the carbon bearing F and Br: Br (higher atomic number) > F. On the other carbon assign priorities by the attached chains. The answer key shows Z for molecule A.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Assign CIP priority to the two groups on each sp2 carbon independently, then check if higher-priority groups are on the same side (Z) or opposite sides (E).",
      "shortcut": "Same side = Z (zusammen = together); opposite = E (entgegen = opposite).",
      "whyTrapTempting": "Students often confuse E/Z with cis/trans and guess E when Br and F are on the same carbon, assuming 'opposite halogens' means E.",
      "smiles": "CC(CC)C(=C(CC)F)Br"
    },
    {
      "id": "ez_assign_B_1",
      "name": "E/Z Assignment: Symmetrical-looking Disubstituted Alkene",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Molecule B shows an alkene where one carbon of the double bond bears a terminal =CH2 group and an ethyl chain; the other carbon also has substituents. The answer key labels this E. Which assignment is correct?",
        "opts": [
          [
            "E",
            true
          ],
          [
            "Z",
            false
          ],
          [
            "Neither — this alkene cannot show E/Z isomerism",
            false
          ],
          [
            "Cannot be determined from structural formula alone",
            false
          ]
        ]
      },
      "rule": "After CIP priority assignment, the two higher-priority groups are on opposite sides of the double bond, giving E configuration.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify the two groups on each sp2 carbon and rank by CIP rules (atomic number, then out along the chain).",
      "shortcut": "Draw an arrow from priority-1 to priority-1 across the double bond — if they point the same direction it is Z, opposite direction it is E.",
      "whyTrapTempting": "The molecule looks nearly symmetrical, so students may doubt whether E/Z isomerism exists at all or arbitrarily pick Z.",
      "smiles": "C(/C=C(/CC)CC)=C"
    },
    {
      "id": "ez_assign_C_1",
      "name": "E/Z Assignment: Alkene with OCH3 and OH",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Molecule C has one sp2 carbon bearing H and a CHCl2 group; the other sp2 carbon bears an OCH3 group and an OH group. What is the E/Z designation?",
        "opts": [
          [
            "E",
            true
          ],
          [
            "Z",
            false
          ],
          [
            "Cannot be assigned — OCH3 and OH on the same carbon make both identical in priority",
            false
          ],
          [
            "The molecule cannot exhibit E/Z isomerism",
            false
          ]
        ]
      },
      "rule": "On the carbon bearing OCH3 and OH: O is the first atom in both, so look at the next atoms: OCH3 has C attached to its O, OH has H attached to its O — therefore OCH3 > OH. On the other carbon CHCl2 > H. The higher priority groups (OCH3 and CHCl2) end up on opposite sides, giving E.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "When two substituents share the same first atom (both O here), go one bond further to break the tie.",
      "shortcut": "OCH3 beats OH because after the oxygen, C outranks H.",
      "whyTrapTempting": "Both OCH3 and OH start with oxygen, so students think priority is a tie and the molecule cannot be assigned E or Z.",
      "smiles": null
    },
    {
      "id": "most_stable_isomer_12",
      "name": "Most Stable C5 Alkene Isomer",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Which of these five alkene isomers (all C5) is most stable? A = pent-1-ene (monosubstituted, terminal), B = (E)-pent-2-ene (disubstituted trans), C = 2-methylbut-1-ene (disubstituted, one methyl on terminal carbon), D = 2-methylbut-2-ene (trisubstituted), E = (Z)-pent-2-ene (disubstituted cis)",
        "opts": [
          [
            "A (pent-1-ene, monosubstituted)",
            false
          ],
          [
            "B (E-pent-2-ene, disubstituted trans)",
            false
          ],
          [
            "C (2-methylbut-1-ene, disubstituted)",
            false
          ],
          [
            "D (2-methylbut-2-ene, trisubstituted)",
            true
          ]
        ]
      },
      "rule": "More alkyl substituents on the double bond = greater stability. D (2-methylbut-2-ene) is trisubstituted (three alkyl groups on the double bond) and is the most stable. The answer key notes: mono (A), di-trans (B), di (C), tri (D), di-cis (E).",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Count alkyl groups on each sp2 carbon for every structure — the highest count wins.",
      "shortcut": "Trisubstituted > disubstituted (trans > cis) > monosubstituted.",
      "whyTrapTempting": "B is the trans isomer, and students remember trans is more stable than cis, but that comparison only applies within the same substitution level. D beats B because D has more substituents.",
      "smiles": null
    },
    {
      "id": "same_product_h2so4_water_13",
      "name": "Same Product from H2SO4/H2O: Which Two Isomers?",
      "reagents": "H2SO4, H2O",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Two of the five C5 alkene isomers from Q12 (A=pent-1-ene, B=E-pent-2-ene, C=2-methylbut-1-ene, D=2-methylbut-2-ene, E=Z-pent-2-ene), when treated with H2SO4 and H2O, will give the same single product. Which two?",
        "opts": [
          [
            "A and B",
            false
          ],
          [
            "C and D",
            true
          ],
          [
            "B and E",
            false
          ],
          [
            "A and D",
            false
          ]
        ]
      },
      "rule": "Acid-catalyzed hydration (Markovnikov) adds OH to the more substituted carbon. C (2-methylbut-1-ene) and D (2-methylbut-2-ene) both produce the same tertiary alcohol, 2-methyl-2-butanol, because protonation of C gives the same tertiary carbocation in both cases.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "For each alkene, protonate to give the most stable carbocation, then add water. Identify which alkenes share the same carbocation intermediate.",
      "shortcut": "Two alkenes that produce the same Markovnikov carbocation will give the same alcohol product.",
      "whyTrapTempting": "B and E are geometric isomers of each other, so students assume two isomers that are most similar will give the same product — but their carbocations differ from C and D's.",
      "smiles": null
    },
    {
      "id": "mixture_hbr_14",
      "name": "Mixture of Products with HBr: Which Two Isomers?",
      "reagents": "HBr",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Two of the five C5 alkene isomers from Q12 (A=pent-1-ene, B=E-pent-2-ene, C=2-methylbut-1-ene, D=2-methylbut-2-ene, E=Z-pent-2-ene), when treated with HBr, give a MIXTURE of products rather than a single major product. Which two?",
        "opts": [
          [
            "A and B",
            false
          ],
          [
            "C and D",
            false
          ],
          [
            "B and E",
            true
          ],
          [
            "A and D",
            false
          ]
        ]
      },
      "rule": "B (E-pent-2-ene) and E (Z-pent-2-ene) are disubstituted internal alkenes where protonation can occur at either carbon with equal likelihood, producing two equally stable secondary carbocations. Bromide can then add to either, giving two different bromoalkane products — a mixture. The answer key explains: 'for each of the disubstituted alkenes B and E, two equally stable 2-degree carbocations can be produced.'",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Check whether protonation at either end of the double bond produces carbocations of equal or different stability. Equal stability = mixture.",
      "shortcut": "Symmetric or equally substituted internal alkenes give a mixture with HBr because both carbocations are equally stable.",
      "whyTrapTempting": "C and D look like they might give mixtures because C has a terminal double bond, but protonation of C always gives the same tertiary carbocation, so only one product forms.",
      "smiles": null
    },
    {
      "id": "halohydrin_cyclopentene_nbs_3",
      "name": "Halohydrin Formation: Cyclopentene + H2O/NBS",
      "reagents": "H2O, NBS, DMSO (solvent)",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Cyclopentene is treated with H2O and NBS (N-bromosuccinimide) in DMSO. Which describes the principal product(s)?",
        "opts": [
          [
            "trans-2-bromocyclopentanol (single enantiomer, not racemic)",
            false
          ],
          [
            "cis-2-bromocyclopentanol (single enantiomer)",
            false
          ],
          [
            "A racemic mixture of trans-2-bromocyclopentanol enantiomers (Br and OH on same face, trans relationship)",
            false
          ],
          [
            "cis-2-bromocyclopentanol as a racemic mixture",
            false
          ]
        ]
      },
      "rule": "NBS in water acts as a bromonium-ion source. Halohydrin formation proceeds via anti addition: Br and OH add to opposite faces of the double bond. Cyclopentene is achiral, so both faces are equivalent, producing a racemic mixture of the two trans-2-bromocyclopentanol enantiomers (Br and OH trans to each other on the ring). The answer key highlights option (e): racemic trans product with Br and OH on opposite faces.",
      "trap": "bromine_intermediate_z2butene_1",
      "tier": "toggle",
      "firstMove": "Identify the addition mechanism: bromonium ion forces anti addition of nucleophile (water). Then check whether the starting material is chiral (it is not, so the product is racemic).",
      "shortcut": "Halohydrin = anti addition. Achiral starting alkene = racemic product. Br and OH end up trans to each other.",
      "whyTrapTempting": "The word 'trans' in stereochemistry of ring products is easy to confuse with the cis/trans nomenclature used elsewhere; students may pick cis thinking Br and OH are 'next to each other'.",
      "smiles": "C1CC=CC1"
    },
    {
      "id": "reverse_syn_oxymercuration_1",
      "name": "Reverse Synthesis: Oxymercuration to Markovnikov Alcohol",
      "reagents": "1) Hg(OAc)2, H2O/THF; 2) NaBH4",
      "prod": {
        "type": "add",
        "c1": "1-(cyclohexyl)ethanol"
      },
      "decision": {
        "q": "Which alkene starting material would give 1-(cyclohexyl)ethanol via oxymercuration-reduction [1) Hg(OAc)2, H2O/THF; 2) NaBH4]?",
        "opts": [
          [
            "(a) 1-ethylidenecyclohexane (cyclohexane ring with exo =CH-CH3 at C1)",
            false
          ],
          [
            "(b) cyclohexyl methyl ether alkene (cyclohexane with internal double bond and methyl group)",
            false
          ],
          [
            "(c) (1-methylenecyclohexyl)methane — exo methylene at C1 with methyl branch",
            false
          ],
          [
            "(d) vinylcyclohexane — cyclohexane ring with an exo vinyl group (CH=CH2)",
            true
          ]
        ]
      },
      "rule": "Oxymercuration-reduction follows Markovnikov's rule. Vinylcyclohexane (d) places OH on the more substituted carbon of the vinyl group (the one attached to the ring), giving 1-(cyclohexyl)ethanol. Choices (a) and (b) cannot form this product; (c) gives mostly 1-ethylcyclohexanol (the ring carbon is more substituted).",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Work backward from the product: the OH is on a carbon bearing the cyclohexyl group and a methyl group. The alkene must have had a terminal =CH2 at that position (vinylcyclohexane) so Markovnikov addition places OH on the internal carbon.",
      "shortcut": "OH lands on the more substituted carbon. Identify the more substituted carbon of the product alcohol and attach the double bond there pointing outward.",
      "whyTrapTempting": "Choice (c) looks like it has a methyl group near the ring, making students think it gives the right product, but Markovnikov addition on (c) places OH on the ring carbon giving 1-methylcyclohexan-1-ol, not the target.",
      "smiles": "C1=CCCCC1"
    },
    {
      "id": "reagent_choice_antimark_alcohol_1",
      "name": "Reagent Selection: Anti-Markovnikov Alcohol from 1-Pentene",
      "reagents": "",
      "prod": {
        "type": "add",
        "c1": "CH3CH2CH2CH2CH2OH (1-pentanol)"
      },
      "decision": {
        "q": "Which procedure converts 1-pentene to 1-pentanol (CH3CH2CH2CH2CH2OH, the anti-Markovnikov alcohol)?",
        "opts": [
          [
            "(a) 1) Hg(OAc)2, H2O/THF; 2) NaBH4",
            false
          ],
          [
            "(b) H2O, H2SO4",
            false
          ],
          [
            "(c) 1) BH3; 2) KOH, H2O2",
            true
          ],
          [
            "(d) None of the above answers is correct",
            false
          ]
        ]
      },
      "rule": "Hydroboration-oxidation (BH3 then H2O2/KOH) gives anti-Markovnikov addition — OH goes to the less substituted carbon. Options (a) and (b) both give Markovnikov product (2-pentanol).",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Decide which carbon the OH ends up on. 1-Pentanol has OH at C1 (terminal, less substituted) — that is anti-Markovnikov, so you need hydroboration-oxidation.",
      "shortcut": "Hydroboration = anti-Markovnikov. Oxymercuration and acid-catalyzed hydration = Markovnikov.",
      "whyTrapTempting": "Oxymercuration uses water and looks like it adds OH, making students think it gives the terminal alcohol, but it follows Markovnikov's rule and gives the internal (secondary) alcohol.",
      "smiles": "CCCCC=C"
    },
    {
      "id": "carbene_addition_chcl3_koh_1",
      "name": "Carbene Addition to Cyclohexylidene Methylene",
      "reagents": "KOH",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the principal product of the reaction of methylenecyclohexane (cyclohexane with exo =CH2) with CHCl3 and KOH?",
        "opts": [
          [
            "(a) cyclohexyl-CH2-CCl3 (addition product at allylic position)",
            false
          ],
          [
            "(b) bicyclic product with CH3 and CCl3 substituents on a cyclopropane ring fused to cyclohexane",
            false
          ],
          [
            "(c) dichlorocyclopropane fused to the exo face of methylenecyclohexane (spiro dichlorocyclopropane with one CCl2 bridge across the double bond)",
            true
          ],
          [
            "(d) gem-dichloro spiro product with two CCl2 groups",
            false
          ]
        ]
      },
      "rule": "KOH deprotonates CHCl3 to generate dichlorocarbene (:CCl2), which adds syn across the double bond to form a gem-dichlorocyclopropane. The exo alkene of methylenecyclohexane is the substrate, giving a spiro dichlorocyclopropane fused product (choice c).",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Recognise CHCl3 + strong base = carbene generation. Carbene adds across the C=C in a concerted syn fashion.",
      "shortcut": "CHCl3 + KOH always means dichlorocarbene cyclopropanation. Product is a gem-dichlorocyclopropane ring across the double bond.",
      "whyTrapTempting": "Choice (a) looks like a simple nucleophilic substitution or radical addition — students forget that base-treated CHCl3 generates a carbene, not a carbanion that adds to allylic positions.",
      "smiles": "C1=CCCCC1=C"
    },
    {
      "id": "nbs_allylic_bromination_cyclohexene_1",
      "name": "NBS Allylic Bromination of Cyclohexene",
      "reagents": "NBS, hv, CCl4",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the principal product of treating cyclohexene with NBS under hv in CCl4 solvent?",
        "opts": [
          [
            "(a) (bromomethyl)cyclohexane — Br on exo CH2 side chain",
            false
          ],
          [
            "(b) 3-bromocyclohexene — Br on the allylic carbon adjacent to the double bond, double bond retained",
            true
          ],
          [
            "(c) 1,2-dibromocyclohexane — vicinal dibromide, double bond consumed",
            false
          ],
          [
            "(d) 1,2-dibromocyclohexene — two Br atoms on the double bond carbons",
            false
          ]
        ]
      },
      "rule": "NBS with light (hv) in CCl4 does allylic free radical bromination. The allylic C-H bond is broken homolytically; the resulting allylic radical reacts with Br to give substitution at the allylic position while the double bond is preserved.",
      "trap": "anti_addition_br2_cyclohexene_1",
      "tier": "toggle",
      "firstMove": "Check conditions: NBS + hv + CCl4 = radical conditions. Radical = allylic substitution, NOT addition across the double bond.",
      "shortcut": "NBS + light = allylic Br substitution. The double bond stays. NBS + polar solvent (no light) = electrophilic addition.",
      "whyTrapTempting": "Students see Br and a double bond and default to electrophilic addition (1,2-dibromide), forgetting that radical conditions from hv redirect to allylic substitution.",
      "smiles": "C1=CCCCC1"
    },
    {
      "id": "conjugated_diene_hcl_addition_1",
      "name": "HCl Addition to Conjugated Diene (1,2- and 1,4-Products)",
      "reagents": "HCl",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Which compounds form in significant quantity when a conjugated diene (cyclohexa-1,3-diene type with a methyl branch on the ring) reacts with HCl?",
        "opts": [
          [
            "(A) I, II, III",
            false
          ],
          [
            "(B) III, IV, V",
            false
          ],
          [
            "(C) I, III, V",
            true
          ],
          [
            "(D) II, IV",
            false
          ]
        ]
      },
      "rule": "Conjugated dienes undergo both 1,2- and 1,4-addition with HCl. H attaches to the terminal carbon (both top and bottom faces), generating an allylic carbocation. Cl then attacks at both the 2-position (1,2-addition) and 4-position (1,4-addition), giving products I, III, and V. Products II and IV are not significant because they require Markovnikov addition at the wrong carbon.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify the conjugated diene. With HCl, H adds first to give the most stable allylic carbocation, then Cl can attack either end of the allylic system (1,2 or 1,4).",
      "shortcut": "Conjugated diene + HX always gives two products: 1,2-addition and 1,4-addition. Both are valid. Count carbons from each end of the diene.",
      "whyTrapTempting": "Students often pick only one product, either the 1,2 (kinetic) or 1,4 (thermodynamic) product, forgetting that both form at normal temperatures.",
      "smiles": "C(/C=C/C=C)c1ccccc1"
    },
    {
      "id": "bromine_intermediate_z2butene_1",
      "name": "Bromine Addition Intermediate: (Z)-2-Butene",
      "reagents": "Br2",
      "prod": {
        "type": "add",
        "stereo": "anti"
      },
      "decision": {
        "q": "Which structure(s) represent the intermediate formed when (Z)-2-butene reacts with Br2? (I = bromonium ion with cis methyl groups; II = open carbocation with Br and trans methyl; III = Br anion separated)",
        "opts": [
          [
            "(a) I only — the cyclic bromonium ion with cis methyl groups bridging the same face",
            true
          ],
          [
            "(b) II only — open carbocation with Br already on carbon",
            false
          ],
          [
            "(c) III only — bromide anion with carbanion",
            false
          ],
          [
            "(d) I and II together",
            false
          ]
        ]
      },
      "rule": "Br2 addition proceeds via a cyclic bromonium ion intermediate (structure I). The methyl groups retain their original cis relationship in the bridged intermediate. The bromonium ion is then attacked by Br- from the back face (anti addition). Open carbocations (II) are not the correct intermediate for alkene halogenation.",
      "trap": "halohydrin_cyclopentene_nbs_3",
      "tier": "recognise",
      "firstMove": "Recall that halogenation of alkenes goes through a cyclic halonium (bromonium) ion, not an open carbocation. The geometry of the starting alkene is preserved in the bridged intermediate.",
      "shortcut": "Br2 always gives a bromonium ion intermediate. This locks the geometry and forces anti addition of the second Br.",
      "whyTrapTempting": "Structure II (open carbocation) looks like a normal carbocation intermediate from Markovnikov additions, so students confuse halogenation mechanism with HX addition mechanism.",
      "smiles": "C(/C=C/C)Br"
    },
    {
      "id": "bromohydrin_2methylpropene_nbs_h2o_1",
      "name": "Bromohydrin Formation: 2-Methylpropene with NBS/H2O/DMSO",
      "reagents": "NBS, H2O, DMSO solvent",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the major product of the reaction of 2-methylpropene (isobutylene, H3C-C(CH3)=CH2) with NBS in H2O/DMSO?",
        "opts": [
          [
            "(a) 1-bromo-2-methylpropan-2-ol — Br at C1, OH at C2 (tertiary)",
            false
          ],
          [
            "(b) 2-bromo-2-methylpropan-1-ol — Br at C2 (tertiary), OH at C1 (primary)",
            true
          ],
          [
            "(c) 2-methylpropane-1,2-diol — diol, no Br",
            false
          ],
          [
            "(d) 2-methylpropylene oxide — epoxide",
            false
          ]
        ]
      },
      "rule": "Bromohydrin formation: Br+ (electrophile) attacks the alkene first, attaching to the more substituted carbon (Markovnikov) to give the most stable bromonium/carbocation intermediate. Water then attacks from the back (anti) at the more substituted carbon. Wait — bromine attaches first at the more substituted carbon in bromonium formation; water attacks the more electrophilic (more substituted) carbon of the bromonium ion. Net result: Br ends up at the more substituted carbon, OH at the less substituted carbon.",
      "trap": "hydroboration_oxidation_2methylpropene_1",
      "tier": "toggle",
      "firstMove": "Bromine is the electrophile — it bridges the double bond forming a bromonium ion. Water then attacks the more electrophilic (more substituted, more partial positive) carbon of the bromonium. So OH ends up at the more substituted carbon and Br at the less substituted. Wait — re-check: in bromohydrin, Br adds to give the intermediate where the more substituted carbon bears more positive charge; water attacks THAT carbon. So OH is at the more substituted carbon and Br at the less substituted. The answer (b) shows Br at C2 (tertiary) and OH at C1 — this is consistent with the question's highlighted answer.",
      "shortcut": "In bromohydrin formation, OH goes to the MORE substituted carbon (Markovnikov-like for the nucleophile), Br to the less substituted.",
      "whyTrapTempting": "Choice (a) reverses OH and Br. Students who remember 'Markovnikov' but apply it to Br rather than OH will pick (a).",
      "smiles": "CC(C)=C"
    },
    {
      "id": "hydroboration_oxidation_2methylpropene_1",
      "name": "Hydroboration-Oxidation: 2-Methylpropene",
      "reagents": "1) BH3/THF; 2) H2O2, KOH",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the major product of hydroboration-oxidation of 2-methylpropene (H3C-C(CH3)=CH2)?",
        "opts": [
          [
            "(a) 2-methylpropan-1-ol — OH at C1 (primary, less substituted carbon)",
            true
          ],
          [
            "(b) 2-methylpropan-2-ol — OH at C2 (tertiary, more substituted carbon)",
            false
          ],
          [
            "(c) 2-methylpropane-1,2-diol — diol at both carbons",
            false
          ],
          [
            "(d) 2-methylpropanal — aldehyde (oxidation product)",
            false
          ]
        ]
      },
      "rule": "Hydroboration-oxidation gives anti-Markovnikov addition of OH. BH3 adds B to the less hindered (less substituted) carbon; after oxidation, OH replaces B. For 2-methylpropene, OH ends up at C1 (primary).",
      "trap": "bromohydrin_2methylpropene_nbs_h2o_1",
      "tier": "toggle",
      "firstMove": "Hydroboration = anti-Markovnikov. BH3 is bulky — boron goes to the less substituted carbon. After H2O2/KOH oxidation, OH replaces B at the same carbon (retention of configuration).",
      "shortcut": "BH3 then H2O2/KOH: OH to the less substituted carbon every time. Opposite of acid or oxymercuration.",
      "whyTrapTempting": "Choice (b) is the Markovnikov product (tertiary alcohol), which is what oxymercuration or acid-catalyzed hydration would give. Students who confuse the two reactions pick (b).",
      "smiles": "CC(C)=C"
    },
    {
      "id": "oxymercuration_1butene_stereo_1",
      "name": "Oxymercuration Stereochemistry: 1-Butene to 2-Butanol",
      "reagents": "1) Hg(OAc)2, H2O/THF; 2) NaBH3",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is (are) the principal organic product(s) of oxymercuration-reduction of 1-butene (H3C-CH2-HC=CH2)?",
        "opts": [
          [
            "(a) CH3CH2CH2CH2OH — 1-butanol (terminal alcohol)",
            false
          ],
          [
            "(b) R-isomer only of 2-butanol",
            false
          ],
          [
            "(c) S-isomer only of 2-butanol",
            false
          ],
          [
            "(e) racemic mixture of R and S isomers of 2-butanol",
            true
          ]
        ]
      },
      "rule": "Oxymercuration follows Markovnikov's rule: OH goes to C2 (more substituted) giving 2-butanol. Because achiral reagents react with an achiral alkene, the new chiral center at C2 is formed as a racemic mixture of R and S enantiomers.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Markovnikov addition places OH at C2, creating a chiral center. Achiral starting materials plus achiral reagents always give a racemic product.",
      "shortcut": "Any time an achiral alkene reacts with achiral reagents to form a chiral center, the product is racemic. No chiral catalyst = no enantioselectivity.",
      "whyTrapTempting": "Students who know the reaction is stereospecific for some steps confuse that with enantioselectivity. Oxymercuration is not stereospecific in a way that produces a single enantiomer from a prochiral alkene.",
      "smiles": "CCC=C"
    },
    {
      "id": "nbs_uv_bicyclic_allylic_1",
      "name": "NBS/UV Allylic Bromination: Bicyclic Diene (Decalin-Type)",
      "reagents": "NBS (N-bromosuccinimide), UV light, CCl4 solvent",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Which two products form when the bicyclic compound with a C=C double bond between the two fused rings is treated with NBS under UV light in CCl4? (Products I–IV shown: I = Br at allylic position on left ring; II = Br at benzylic/allylic bridge position; III = Br on saturated ring at non-allylic position; IV = Br at the other allylic position on right ring, with double bond shifted)",
        "opts": [
          [
            "(a) I and II",
            false
          ],
          [
            "(b) I and III",
            false
          ],
          [
            "(c) I and IV",
            false
          ],
          [
            "(e) II and IV",
            true
          ]
        ]
      },
      "rule": "NBS/UV gives allylic radical bromination. The allylic radical intermediate is delocalized by resonance across two carbons (the two ends of the allylic system). Bromine radical can attack either resonance position, giving two allylic bromide products (II and IV). Non-allylic positions (I and III) are not activated.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Draw the allylic radical. Identify all carbons that bear the unpaired electron via resonance. NBS delivers Br to each of those positions.",
      "shortcut": "Allylic radical is delocalized over two carbons. Always expect two allylic bromide products unless the two positions are equivalent.",
      "whyTrapTempting": "Students often pick only one allylic product (e.g., I and III) without recognising that resonance delocalises the radical to a second carbon, giving a second distinct product.",
      "smiles": null
    },
    {
      "id": "oxymercuration_reverse_1",
      "name": "Oxymercuration Reverse: Best Starting Material",
      "reagents": "1) Hg(OAc)2, H2O/THF; 2) NaBH4",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Which alkene is the best starting material to produce 1-(1-methylethyl)cyclohexan-1-ol (cyclohexane with a secondary alcohol bearing a methyl group at the exo position) via oxymercuration-reduction?",
        "opts": [
          [
            "(a) Cyclohexane fused to a terminal alkene on a two-carbon chain (vinylcyclohexane)",
            false
          ],
          [
            "(b) Cyclohexane with a 1-methylenyl group (methylenecyclohexane, exo methylene)",
            false
          ],
          [
            "(c) Cyclohexane with a vinyl group and an internal double bond (1-ethylidenecyclohexane type)",
            false
          ],
          [
            "(d) Cyclohexane with an exo vinyl group where the double bond is between the ring carbon and the CH=CH2 terminus (1-vinylcyclohexene style giving Markovnikov OH at tertiary position)",
            true
          ]
        ]
      },
      "rule": "Oxymercuration-reduction follows Markovnikov's rule: OH adds to the more substituted carbon. Option (d) places the double bond so that Markovnikov addition delivers OH to the tertiary ring carbon, giving the observed product. (a) and (b) cannot form the product; (c) gives 1-ethyl-1-cyclohexanol instead.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Identify where OH ends up in the product, then trace back — OH goes to the more substituted carbon, so the alkene double bond must originate there.",
      "shortcut": "OH ends up on the more-substituted carbon (Markovnikov). Work backward from the OH position to find the alkene.",
      "whyTrapTempting": "Choice (c) looks similar to (d) but places the double bond one carbon off, delivering OH to the wrong carbon.",
      "smiles": null
    },
    {
      "id": "carbene_cyclopropanation_1",
      "name": "Carbene Addition: CHCl3/KOH Product",
      "reagents": "CHCl3, KOH",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the principal product when methylenecyclohexane (cyclohexane with an exo =CH2) reacts with CHCl3 and KOH?",
        "opts": [
          [
            "(a) Cyclohexane with a -CH2-CCl3 side chain",
            false
          ],
          [
            "(b) Cyclohexane ring with a -CH3 substituent and a -CCl3 group added across the ring",
            false
          ],
          [
            "(c) Spiro[bicyclo] product: dichlorocyclopropane ring fused to cyclohexane at the exo position (spiro dichlorocyclopropane)",
            true
          ],
          [
            "(d) Cyclohexane with two -CCl2 groups added to opposite carbons",
            false
          ]
        ]
      },
      "rule": "CHCl3 + KOH generates dichlorocarbene (:CCl2), which undergoes syn addition across the alkene double bond to form a dichlorocyclopropane ring. The product is 7,7-dichlorobicyclo[4.1.0]heptane (spiro dichlorocyclopropane on cyclohexane).",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Recognize CHCl3/KOH as the carbene reagent combination — it generates :CCl2 in situ.",
      "shortcut": "CHCl3 + KOH = :CCl2 (dichlorocarbene). Carbenes add syn across double bonds to give cyclopropanes.",
      "whyTrapTempting": "Choice (a) looks like a simple addition product; students may not recall that KOH deprotonates CHCl3 to generate the carbene intermediate.",
      "smiles": null
    },
    {
      "id": "nbs_allylic_bromination_1",
      "name": "NBS Allylic Bromination of Cyclohexene",
      "reagents": "NBS, hv, CCl4 solvent",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the principal product when cyclohexene reacts with NBS under hv in CCl4 solvent?",
        "opts": [
          [
            "(a) 3-bromocyclohex-1-ene (allylic bromide, Br on C3, double bond retained at C1-C2)",
            false
          ],
          [
            "(b) 3-bromocyclohex-1-ene drawn as the ring with a CH2Br exo substituent — benzyl bromide type",
            true
          ],
          [
            "(c) 1,2-dibromocyclohexene (Br2 addition across the double bond)",
            false
          ],
          [
            "(d) 1,2-dibromocyclohexane (complete addition of Br2)",
            false
          ]
        ]
      },
      "rule": "NBS under radical (hv) conditions performs allylic free-radical bromination. The double bond is preserved and Br is installed at the allylic position (C3). The product is 3-bromocyclohex-1-ene. NBS does NOT add across the double bond under these conditions.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Check conditions: NBS + hv + CCl4 = radical allylic bromination, NOT electrophilic addition. The double bond survives.",
      "shortcut": "NBS + light/heat + nonpolar solvent = allylic bromination (radical). NBS + H2O/DMSO = bromohydrin (electrophilic).",
      "whyTrapTempting": "Choice (c) shows Br2 addition product — students confuse NBS allylic conditions with electrophilic Br2 addition across the double bond.",
      "smiles": "C1CCC=CC1"
    },
    {
      "id": "bromonium_ion_id_1",
      "name": "Bromonium Ion Structure Identification",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Which structures represent bromonium ions? Structure I: cyclopentane ring with -BrH group (neutral HBr adduct). Structure II: cyclopentane ring with Br(+) bridging across the ring. Structure III: open-chain alkene with Br(+) attached to one carbon. Structure IV: Br with a negative charge (bromide anion).",
        "opts": [
          [
            "II only",
            false
          ],
          [
            "IV only",
            false
          ],
          [
            "II and III",
            true
          ],
          [
            "I and II",
            false
          ]
        ]
      },
      "rule": "A bromonium ion is a three-membered ring with Br carrying a positive charge bridging two carbons. Structure II is a cyclic bromonium ion on cyclopentane. Structure III is an open bromonium ion (Br+ on one carbon of an open chain). Structure I is a neutral HBr adduct (not a bromonium). Structure IV is bromide anion (negative charge, nucleophile).",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Look for a positively charged Br that bridges two carbons (either cyclic or open-chain). Negative Br is bromide, not bromonium.",
      "shortcut": "Bromonium ion = Br(+) bridging two carbons. The positive charge is the key indicator.",
      "whyTrapTempting": "Answer (a) 'II only' misses that open-chain III is also a valid bromonium structure; students expect only the cyclic form.",
      "smiles": null
    },
    {
      "id": "false_statement_reactions_1",
      "name": "Incorrect Statement: Alkene Reaction Mechanisms",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Which ONE of the following statements about alkene reactions is INCORRECT?",
        "opts": [
          [
            "In hydroboration-oxidation, H and OH are added syn across a double bond.",
            false
          ],
          [
            "When HBr is added to an alkene, bromide will add from both the front and back side of the carbocation intermediate.",
            false
          ],
          [
            "Chlorination (addition of Cl2) of an alkene proceeds with Markovnikov selectivity.",
            true
          ],
          [
            "Carbocation rearrangement does not occur during chlorination of an alkene because a carbocation intermediate is not involved.",
            false
          ]
        ]
      },
      "rule": "Choice (c) is incorrect: halogenation (Cl2 or Br2) of an alkene proceeds via a symmetric halonium ion intermediate and does NOT follow Markovnikov selectivity. Markovnikov selectivity applies to HX additions, not X2 additions. All other statements are correct.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Test each statement against the mechanism. Cl2 addition goes through a chloronium ion — symmetric, anti addition — NOT Markovnikov.",
      "shortcut": "Markovnikov selectivity requires a polarized reagent (H-X). Cl2/Br2 are symmetric — no Markovnikov selectivity.",
      "whyTrapTempting": "Choice (b) about HBr and carbocation faces is also tricky; students may second-guess it, but it is actually correct (carbocations are sp2, nucleophile attacks from both faces).",
      "smiles": null
    },
    {
      "id": "hbr_allylic_addition_1",
      "name": "HBr Addition: Benzylic/Allylic Alkene Regioselectivity",
      "reagents": "HBr",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the major product of HBr addition to a styrene-type substrate with an extended side chain bearing a terminal alkene (specifically: phenyl group attached to a chain with a terminal =CH2)?",
        "opts": [
          [
            "(a) Br added to the terminal carbon (anti-Markovnikov, primary carbon)",
            false
          ],
          [
            "(b) Br added to internal carbon with retention of phenyl group position",
            false
          ],
          [
            "(c) Br on the benzylic/allylic carbon (most stable carbocation site, adjacent to phenyl ring), producing a secondary benzylic bromide",
            true
          ],
          [
            "(d) Br added to the phenyl ring (aromatic substitution)",
            false
          ]
        ]
      },
      "rule": "H adds first to the terminal carbon, placing the positive charge on the benzylic carbon (most stable carbocation — stabilized by the adjacent aromatic ring via resonance). Br then adds to the benzylic carbon to give the Markovnikov product. Answer is (c).",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify the most stable carbocation: the benzylic position is resonance-stabilized by the phenyl ring. H goes to the end of the chain, Br to the benzylic position.",
      "shortcut": "Benzylic carbocations are exceptionally stable. HX always puts X on the more stable (more substituted/benzylic/allylic) carbocation carbon.",
      "whyTrapTempting": "The terminal =CH2 group looks like a typical monosubstituted alkene, so students apply simple Markovnikov without accounting for the benzylic stabilization.",
      "smiles": null
    },
    {
      "id": "industrial_cracking_1",
      "name": "Industrial Process: Alkane to Alkene Conversion",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the industrial process by which an alkane such as ethane is converted to an alkene such as ethene?",
        "opts": [
          [
            "Cracking",
            true
          ],
          [
            "Fractionating",
            false
          ],
          [
            "Distilling",
            false
          ],
          [
            "Refining",
            false
          ]
        ]
      },
      "rule": "Cracking (thermal or catalytic cracking) is the industrial process that breaks C-C bonds in alkanes at high temperature to produce alkenes. Fractionating and distilling separate mixtures; refining is a general term for petroleum processing.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Recall that alkane-to-alkene conversion requires bond breaking under high heat — that is cracking.",
      "shortcut": "Cracking = high-temperature C-C bond cleavage of alkanes to give alkenes (and smaller alkanes).",
      "whyTrapTempting": "Refining sounds like a process that could 'improve' or convert hydrocarbons; students may confuse it with a specific chemical transformation.",
      "smiles": null
    },
    {
      "id": "hydrogenation_rate_stability_1",
      "name": "Hydrogenation Rate vs. Alkene Stability",
      "reagents": "H2, Pd/C",
      "prod": {
        "type": "alkane"
      },
      "decision": {
        "q": "Which of four alkenes (a = trisubstituted branched, b = disubstituted trans, c = trisubstituted with different branching, d = disubstituted with less branching) will undergo hydrogenation (H2, Pd/C) at the FASTEST rate?",
        "opts": [
          [
            "(a) Trisubstituted highly branched alkene (most substituted)",
            false
          ],
          [
            "(b) Disubstituted trans-alkene (less substituted, less stable)",
            true
          ],
          [
            "(c) Trisubstituted alkene with bulky groups",
            false
          ],
          [
            "(d) Disubstituted alkene with minimal branching",
            false
          ]
        ]
      },
      "rule": "Less stable alkenes (fewer substituents, less hyperconjugation) have higher heats of hydrogenation and react faster. The least substituted alkene is the most reactive toward H2/Pd/C. Answer is (b), the less-substituted disubstituted alkene.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "Invert the stability ranking: the LEAST stable alkene reacts FASTEST with H2 because it has the most to gain energetically.",
      "shortcut": "Hydrogenation rate is INVERSE to stability. Most stable alkene = slowest to hydrogenate.",
      "whyTrapTempting": "Students conflate 'more reactive' with 'more stable' and choose the most substituted alkene.",
      "smiles": null
    },
    {
      "id": "hbr_diastereomers_1",
      "name": "HBr Addition Products: Enantiomers or Diastereomers?",
      "reagents": "HBr",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "1-methyl-2-methylenecyclopentane (a cyclopentane ring bearing a methyl substituent and an exo methylene group) reacts with HBr. What is the relationship between the two products formed?",
        "opts": [
          [
            "Enantiomers",
            false
          ],
          [
            "Diastereomers",
            true
          ],
          [
            "Constitutional isomers",
            false
          ],
          [
            "Not isomers",
            false
          ]
        ]
      },
      "rule": "The substrate already has one stereocentre (the ring carbon bearing the methyl group). HBr addition creates a second stereocentre. When two stereocentres exist with different relative configurations, the products are diastereomers (not enantiomers). The two products differ in configuration at the new carbon only, while the existing chiral centre is fixed.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Check how many stereocentres the starting material already has. If it has one, adding another gives diastereomers, not enantiomers.",
      "shortcut": "Pre-existing stereocentre + new stereocentre from addition = diastereomers. No pre-existing stereocentre + new stereocentre = enantiomers (racemic).",
      "whyTrapTempting": "Students see two products from an addition reaction and default to calling them enantiomers, forgetting that the existing methyl stereocentre makes them diastereomers.",
      "smiles": null
    },
    {
      "id": "bh3_role_electrophile_1",
      "name": "BH3 Role in Hydroboration-Oxidation",
      "reagents": "1. BH3-THF; 2. NaOH, H2O2",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "In the hydroboration-oxidation reaction, BH3 acts as a/an:",
        "opts": [
          [
            "Nucleophile",
            false
          ],
          [
            "Electrophile",
            true
          ],
          [
            "Neither a nucleophile nor an electrophile",
            false
          ]
        ]
      },
      "rule": "BH3 is electron deficient (boron has only 6 valence electrons, no full octet). It acts as an electrophile — it accepts electron density from the pi bond of the alkene. The pi electrons attack the boron (electrophile), not the other way around.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Check the electron count on boron in BH3: 3 bonds = 6 electrons, empty p orbital = Lewis acid = electrophile.",
      "shortcut": "BH3 = Lewis acid = electrophile. The pi bond is the nucleophile that attacks boron.",
      "whyTrapTempting": "Choice (c) is tempting because BH3 adds in a concerted syn fashion that does not look like a classical electrophilic addition, making students think it is neither.",
      "smiles": null
    },
    {
      "id": "reagent_selection_13_methoxylation",
      "name": "Reagent Selection: Alkene to Methoxy Ether (Oxymercuration with MeOH)",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "From the reagent bank (a=H2SO4/CH3OH, b=NaNH2/CH3I, c=H2SO4/H2O, d=Br2, e=HBr, ab=H2/Pd/C, ac=Br2/H2O, ad=Br2/CH3OH, ae=HBr/H2O, bc=H2SO4/H2O, bd=1.BH3, 2.NaOH/H2O2, be=Na(s)/NH3(l)/-78C), which single reagent code converts cyclopentene to 1-methoxycyclopentane with an OCH3 group (Markovnikov, methanol solvent)?",
        "opts": [
          [
            "a (H2SO4, CH3OH) — acid-catalyzed addition of methanol",
            true
          ],
          [
            "d (Br2) — halogenation",
            false
          ],
          [
            "ac (Br2/H2O) — bromohydrin formation",
            false
          ],
          [
            "ad (Br2/CH3OH) — bromomethoxylation",
            false
          ]
        ]
      },
      "rule": "The product is a methyl ether at the Markovnikov position on cyclopentane. This requires acid-catalyzed addition of methanol: H2SO4/CH3OH (reagent a). This protonates the alkene, and methanol acts as the nucleophile to give the Markovnikov ether.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Identify the functional group added: OCH3 at the more-substituted carbon. That is Markovnikov addition of methanol under acid catalysis.",
      "shortcut": "Alkene + H2SO4/ROH = Markovnikov ether via carbocation mechanism. Compare to oxymercuration with water (gives OH).",
      "whyTrapTempting": "Reagent (ad) Br2/CH3OH would give a bromomethoxy product, not a pure methyl ether; students may pick it thinking methanol is the solvent here.",
      "smiles": null
    },
    {
      "id": "reagent_selection_14_halohydrin",
      "name": "Reagent Selection: Alkene to Trans-Bromohydrin",
      "reagents": "",
      "prod": {
        "type": "add",
        "c1": "trans-2-bromocyclopentan-1-ol",
        "c2": "enantiomer (racemic)",
        "stereo": "anti"
      },
      "decision": {
        "q": "Which reagent code from the reagent bank converts cyclopentene to trans-2-bromocyclopentan-1-ol (a halohydrin with anti stereochemistry)?",
        "opts": [
          [
            "ac (Br2, H2O)",
            true
          ],
          [
            "d (Br2 alone)",
            false
          ],
          [
            "e (HBr)",
            false
          ],
          [
            "ad (Br2, CH3OH)",
            false
          ]
        ]
      },
      "rule": "Halohydrin formation requires Br2 in the presence of water (ac = Br2/H2O). The bromonium ion is opened by water as nucleophile, giving anti addition of Br and OH. Br2 alone (d) gives a 1,2-dibromide. HBr (e) gives a simple Markovnikov addition.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "The product has both OH and Br — that requires water as the nucleophile with Br2. Choose Br2/H2O.",
      "shortcut": "Halohydrin = X2 + H2O. The nucleophile that opens the halonium ion is water (or another alcohol in solvent).",
      "whyTrapTempting": "Br2/CH3OH (ad) would give a bromomethoxy product; students picking the wrong nucleophilic solvent get the wrong answer.",
      "smiles": null
    },
    {
      "id": "reagent_selection_15_birch",
      "name": "Reagent Selection: Terminal Alkyne to Terminal Alkene (Birch/Na-NH3)",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "Which reagent converts a terminal alkyne (attached to cyclobutane ring) to the corresponding terminal alkene (one pi bond reduced, leaving the remaining double bond as terminal =CH2)?",
        "opts": [
          [
            "be (Na(s), NH3(l), -78 C) — dissolving metal reduction",
            true
          ],
          [
            "ab (H2, Pd/C) — full catalytic hydrogenation",
            false
          ],
          [
            "bd (1. BH3; 2. NaOH, H2O2) — hydroboration-oxidation",
            false
          ],
          [
            "a (H2SO4, CH3OH) — acid-catalyzed addition",
            false
          ]
        ]
      },
      "rule": "Dissolving metal reduction (Na/NH3(l)/-78 C, reagent 'be') reduces an internal or terminal alkyne to a trans-alkene (or vinyl product for terminal). This gives partial reduction. H2/Pd/C (ab) over-reduces to alkane. Lindlar catalyst (not listed) gives cis-alkene from internal alkynes.",
      "trap": null,
      "tier": "reverse",
      "firstMove": "Identify the transformation: alkyne to alkene (partial reduction). Dissolving metal = Na/NH3 = Birch-type reduction of alkynes.",
      "shortcut": "Alkyne to trans-alkene = Na/NH3. Alkyne to cis-alkene = Lindlar catalyst (H2/Pd-BaSO4/quinoline). Alkyne to alkane = H2/Pd/C.",
      "whyTrapTempting": "H2/Pd/C (ab) is the most familiar reduction reagent; students use it and over-reduce the alkyne all the way to an alkane.",
      "smiles": null
    },
    {
      "id": "markovnikov_selectivity_reason_1",
      "name": "Why Markovnikov Selectivity Occurs: Carbocation Stability",
      "reagents": "HBr",
      "prod": {
        "type": "add",
        "c1": "1-bromo-1-methylcyclohexane"
      },
      "decision": {
        "q": "Why does HBr addition to 1-methylcyclohexene (or a similar unsymmetrical alkene) proceed with Markovnikov selectivity? Which explanation is correct?",
        "opts": [
          [
            "The more substituted carbon has more H atoms, so H is more likely to add there.",
            false
          ],
          [
            "H adds to the less substituted carbon so the positive charge forms on the more substituted carbon, which is more stable. A more substituted carbocation is more stable due to greater hyperconjugation and inductive stabilization.",
            true
          ],
          [
            "Br is larger and must add to the less hindered (less substituted) carbon.",
            false
          ],
          [
            "The reaction goes through a concerted syn addition mechanism that places Br on the more substituted carbon automatically.",
            false
          ]
        ]
      },
      "rule": "H adds to the less-substituted carbon so the resulting carbocation forms on the more-substituted carbon. A more substituted carbocation is lower in energy (more stable) due to hyperconjugation and inductive donation from alkyl groups. Br then attacks the stable carbocation. Saying 'the carbon with more H's gets H' is a description, not an explanation.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Ask: where does the carbocation form? It forms on the carbon that does NOT receive H. That carbon must be the more stable one.",
      "shortcut": "Markovnikov = H to carbon with more H's = carbocation on more-substituted C = more stable = lower energy transition state. The REASON is carbocation stability, not H-counting.",
      "whyTrapTempting": "Choice (a) is Markovnikov's original empirical statement — it's what happens, but NOT why it happens. Exams often penalise this non-explanation.",
      "smiles": null
    },
    {
      "id": "lindlar_cis_alkene_1",
      "name": "Lindlar Catalyst: Alkyne to Cis-Alkene",
      "reagents": "H2, Lindlar Cat.",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the stereochemical outcome when a disubstituted internal alkyne reacts with H2 and Lindlar catalyst?",
        "opts": [
          [
            "The trans (E) alkene is formed selectively",
            false
          ],
          [
            "The cis (Z) alkene is formed selectively via syn addition",
            true
          ],
          [
            "A racemic mixture of cis and trans alkenes forms",
            false
          ],
          [
            "The alkyne is fully reduced to an alkane",
            false
          ]
        ]
      },
      "rule": "Lindlar catalyst (Pd poisoned with lead acetate and quinoline) performs syn addition of H2, delivering both H atoms to the same face of the triple bond. This gives the cis (Z) alkene from an internal alkyne. Dissolving metal (Na/NH3) gives the trans (E) alkene.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Recall that Lindlar = syn addition = cis product. Dissolving metal = trans product. They are complementary.",
      "shortcut": "Lindlar = cis alkene. Na/NH3 = trans alkene. Both are selective partial reductions of alkynes.",
      "whyTrapTempting": "Students confuse Lindlar (cis) with dissolving metal (trans), or forget that Lindlar does NOT fully reduce to alkane.",
      "smiles": null
    },
    {
      "id": "h2so4_water_markovnikov_alcohol_1",
      "name": "H2SO4/H2O Addition: Markovnikov Alcohol Product",
      "reagents": "H2SO4, H2O",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "A trisubstituted alkene (2-methylbut-2-ene type) reacts with H2SO4/H2O. What is the major product and its key feature?",
        "opts": [
          [
            "Anti-Markovnikov alcohol at the less-substituted carbon",
            false
          ],
          [
            "Markovnikov alcohol at the more-substituted carbon, as a racemic mixture (both enantiomers at the new stereocentre)",
            true
          ],
          [
            "A sulfonate ester instead of an alcohol",
            false
          ],
          [
            "A diol from double addition of water",
            false
          ]
        ]
      },
      "rule": "Acid-catalyzed hydration follows Markovnikov's rule: OH ends up on the more substituted carbon via the more stable carbocation intermediate. The carbocation is planar (sp2) so water attacks from both faces, giving a racemic mixture. The answer includes '+ en' (enantiomer) for stereochemistry.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify the more substituted carbon — that is where OH ends up. Then check if a new stereocentre forms: if so, expect a racemate.",
      "shortcut": "H2SO4/H2O = acid hydration = Markovnikov alcohol + carbocation intermediate can rearrange. Carbocation = planar = racemic product if chiral.",
      "whyTrapTempting": "Students forget the racemic qualifier and just identify the correct regiochemistry, losing marks for incomplete stereochemical analysis.",
      "smiles": null
    },
    {
      "id": "hydroboration_anti_markovnikov_1",
      "name": "Hydroboration-Oxidation: Anti-Markovnikov Aldehyde from Terminal Alkyne",
      "reagents": "1. BH3-THF; 2. NaOH, H2O2",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "A terminal alkyne (cyclobutylidene-H, i.e. cyclobutane with a terminal triple bond =CH) undergoes hydroboration-oxidation. What is the major product?",
        "opts": [
          [
            "A Markovnikov ketone (carbonyl on the internal carbon)",
            false
          ],
          [
            "An anti-Markovnikov aldehyde (carbonyl on the terminal carbon)",
            true
          ],
          [
            "A primary alcohol",
            false
          ],
          [
            "A vinyl boronate ester",
            false
          ]
        ]
      },
      "rule": "Hydroboration of a terminal alkyne followed by oxidation gives an anti-Markovnikov aldehyde. BH3 adds H to the internal carbon (boron to terminal), oxidation converts C-B to C-OH giving an enol, which tautomerizes to the aldehyde. This is the opposite regiochemistry to HgSO4/H2SO4/H2O (which gives the Markovnikov ketone).",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Identify the reagent: BH3-THF then NaOH/H2O2 = hydroboration. For alkynes, this gives anti-Markovnikov carbonyl. Boron goes to terminal carbon.",
      "shortcut": "Hydroboration of terminal alkyne = anti-Markovnikov = aldehyde. HgSO4/H2O/H2SO4 = Markovnikov = ketone.",
      "whyTrapTempting": "Students may expect an alcohol product (as in alkene hydroboration) rather than recognizing that the enol intermediate tautomerizes to a carbonyl.",
      "smiles": null
    },
    {
      "id": "hbr_internal_alkyne_markovnikov_1",
      "name": "HBr Addition to Internal Alkyne: Markovnikov Vinyl Bromide",
      "reagents": "HBr (1 equiv)",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the Markovnikov product when 3-heptyne (Et-C=C-CH3, an internal alkyne with Et and CH3 groups) reacts with 1 equivalent of HBr?",
        "opts": [
          [
            "Br on the carbon bearing the larger alkyl group (anti-Markovnikov vinyl bromide)",
            false
          ],
          [
            "Br on the carbon bearing the methyl group (Markovnikov: vinyl bromide with Br at the CH3 end, producing 3-bromo-3-heptene region)",
            false
          ],
          [
            "Br on the carbon bearing the ethyl group, H on the methyl-bearing carbon (vinylic bromide: Br on internal C adjacent to Et, giving CH3 side with H)",
            true
          ],
          [
            "Dibromo alkane from addition of 2 HBr",
            false
          ]
        ]
      },
      "rule": "HBr addition to an internal alkyne follows Markovnikov's rule: H adds to give the more substituted (more stable) vinyl cation intermediate. For Et-C=C-CH3, H adds to the CH3-bearing carbon and Br ends up on the carbon bearing the larger Et group. The product is a vinyl bromide with the larger substituent on the same carbon as Br.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Treat the alkyne like an alkene: H goes to the carbon that gives the more stable vinyl cation (more-substituted side). Br goes to the other carbon.",
      "shortcut": "For alkynes, Markovnikov = H to the less substituted carbon, halide to the more substituted carbon (gives more stable vinyl cation).",
      "whyTrapTempting": "Students mix up which carbon gets Br because vinyl cation stability is less intuitive than carbocation stability.",
      "smiles": null
    },
    {
      "id": "h2_pd_c_cyclopentene_syn_1",
      "name": "H2/Pd/C Hydrogenation: Cyclopentene with Ph Substituent",
      "reagents": "H2, Pd/C",
      "prod": {
        "type": "alkane"
      },
      "decision": {
        "q": "3-phenylcyclopent-1-ene reacts with H2/Pd/C. What is the stereochemical outcome of the product?",
        "opts": [
          [
            "A single enantiomer of trans-3-phenylcyclopentane",
            false
          ],
          [
            "A racemic mixture of cis and trans products (no selectivity)",
            false
          ],
          [
            "A racemic mixture of the cis diastereomer (syn addition of H2 to the same face) — two enantiomers of cis-product",
            true
          ],
          [
            "The trans product selectively",
            false
          ]
        ]
      },
      "rule": "Heterogeneous catalytic hydrogenation (H2/Pd/C) proceeds via syn addition — both H atoms add to the same face of the double bond. For cyclopentene with a Ph group, syn addition gives the cis product. Since the starting material is achiral, attack occurs equally from both faces, giving a racemic mixture of the two enantiomers of the cis product.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Determine the addition mode: H2/Pd/C = syn addition. Then determine the relative configuration of the cis product and check if the starting material is chiral.",
      "shortcut": "Catalytic hydrogenation = syn addition = cis product from cyclic alkenes. Achiral starting material = racemate.",
      "whyTrapTempting": "Students pick 'racemate of cis and trans' forgetting that syn addition constrains the relative stereochemistry to the cis relationship only.",
      "smiles": null
    },
    {
      "id": "cl2_excess_alkyne_tetrachloride_1",
      "name": "Cl2 Excess Addition to Terminal Alkyne",
      "reagents": "Cl2, excess",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "What is the product when acetylene (ethyne, H-C=C-H) reacts with excess Cl2?",
        "opts": [
          [
            "1,2-dichloroethene (cis or trans vinyl dichloride)",
            false
          ],
          [
            "1,1-dichloroethane",
            false
          ],
          [
            "1,1,2,2-tetrachloroethane",
            true
          ],
          [
            "Chloroethane (single HCl addition)",
            false
          ]
        ]
      },
      "rule": "Excess Cl2 adds across the triple bond in two steps: the first equivalent gives the (E) or (Z) 1,2-dichloroethene vinyl dichloride, and the second equivalent adds across the remaining double bond to give 1,1,2,2-tetrachloroethane (Cl2C-CCl2H type for ethyne). The product has Cl on both carbons from both additions.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "Check: excess reagent means both the triple bond and the resulting double bond react. First addition gives dichloroethene; second gives tetrachloroethane.",
      "shortcut": "Excess halogen with alkyne = double addition = tetrahalide. 1 equiv = vinyl dihalide.",
      "whyTrapTempting": "Students stop at the first addition product (1,2-dichloroethene) and forget that 'excess' means a second equivalent adds across the vinyl dihalide double bond.",
      "smiles": "C#C"
    },
    {
      "id": "img_001",
      "name": "Cyclopentadiene dimerizes to dicyclopentadiene (2 pi bonds b",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Breaking sigma bonds to reform pi bonds is endothermic, so increasing temperature shifts the equilibrium left (toward cyclopentadiene), per Le Chatelier's principle.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image12.png",
      "answerImg": "assets/img/image13.png",
      "correctAnswer": "B",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_002",
      "name": "Q25: Three mechanisms for Br2 addition to cyclopentene are p",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "The bromonium ion mechanism (III) gives trans product via anti-addition; a free carbocation (II) allows attack from both faces giving a mixture; concerted syn addition (I) gives cis product.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image15.png",
      "answerImg": "assets/img/image16.png",
      "correctAnswer": "C",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_003",
      "name": "Q26: Which of the three mechanisms from Q25 could have a rea",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Mechanisms II and III both proceed through a discrete intermediate (carbocation or bromonium ion) followed by nucleophilic attack, producing two energy humps; Mechanism I is concerted and would show a single hump.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image17.png",
      "answerImg": "assets/img/image18.png",
      "correctAnswer": "E",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_004",
      "name": "Q3: A set of C7 alkene isomers is shown (A-E: tetrasubstitut",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "The most stable alkene (tetrasubstituted, choice A) has the lowest potential energy and therefore releases the most energy when formed from its elements.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image26.png",
      "answerImg": "assets/img/image27.png",
      "correctAnswer": "A",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_005",
      "name": "How many elements of unsaturation are in the formula C8H9N? ",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Degrees of unsaturation (DoU) = (2C + 2 + N - H) / 2. For C8H9N: (2×8 + 2 + 1 - 9) / 2 = (16 + 2 + 1 - 9) / 2 = 10/2 = 5. Nitrogen adds 1 to the numerator; halogens subtract 1; oxygen has no effect.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image34.png",
      "answerImg": "assets/img/image35.png",
      "correctAnswer": "F",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_006",
      "name": "Choose the most stable alkene among the following: (a) 1-hex",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "More substituted, trans (E) alkenes are more stable. (E)-2-hexene is disubstituted and trans, making it more stable than monosubstituted 1-hexene, the cis (Z) isomer, or the incorrect claim of equal stability.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image44.png",
      "answerImg": "assets/img/image45.png",
      "correctAnswer": "B",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_007",
      "name": "Which of the following best describes the geometry about the",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "E/Z nomenclature only applies when each sp2 carbon of the double bond bears two DIFFERENT substituents. When one carbon of the double bond is part of a ring that connects back to itself (same substituent on both sides of that carbon), E/Z designation cannot be assigned — it is 'neither E nor Z'.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image48.png",
      "answerImg": "assets/img/image49.png",
      "correctAnswer": "C",
      "choices": [
        "A",
        "B",
        "C"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_008",
      "name": "Both (E)- and (Z)-3-hexene are treated with D2 over a platin",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Catalytic hydrogenation (or deuteration) delivers both atoms syn to the same face of the alkene. Because (E)- and (Z)-3-hexene are diastereomers, syn addition to each gives products that are themselves diastereomers of each other.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image70.png",
      "answerImg": "assets/img/image71.png",
      "correctAnswer": "C",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_009",
      "name": "How many elements of unsaturation are in the formula C6H9NO2",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Degree of unsaturation (DoU) = (2C + 2 + N - H) / 2. For C6H9NO2: (12 + 2 + 1 - 9) / 2 = 6/2 = 3.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image109.png",
      "answerImg": "assets/img/image110.png",
      "correctAnswer": "D",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_010",
      "name": "For four alkene structures (A, B, C, D labeled on image), wh",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "E/Z assignment requires applying CIP priority rules at each end of the double bond; cyclic alkenes and disubstituted alkenes each get their own analysis. A is Z because the NO2-bearing carbon has NO2 as higher priority on the same side as the longer chain; B is E because the NO2 group sits on the opposite side from the higher-priority substituent.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image111.png",
      "answerImg": "assets/img/image112.png",
      "correctAnswer": "C",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_011",
      "name": "Rank the reactivity of alcohols A (primary), B (secondary), ",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Acid-catalyzed dehydration proceeds via carbocation formation; tertiary carbocations are most stable (lowest activation energy), so tertiary alcohols react fastest. The order is 3 degree > 2 degree > 1 degree, giving C fastest and A slowest.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image113.png",
      "answerImg": "assets/img/image114.png",
      "correctAnswer": "F",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_012",
      "name": "Which of the following reagents would give exactly the same ",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Hydroboration-oxidation (BH3-THF then NaOH/H2O2) adds H and OH syn, creating one chiral center in 2-butanol. Because only one chiral center results, both E- and Z-2-butene give the same racemic mixture of (R)- and (S)-2-butanol. Reactions that create two chiral centers (Br2, OsO4, peracid) yield diastereomers that differ between E and Z.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image115.png",
      "answerImg": "assets/img/image116.png",
      "correctAnswer": "C",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_013",
      "name": "Which statement is true for structures A (chloro-substituted",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "E/Z assignment requires applying CIP priority rules to each alkene separately. For structure A, Cl has higher priority than the alkyl chain on the same side, making it Z; for structure B, the OCH3 group has higher priority than H on the opposite side from the higher-priority carbon chain, making it E.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image147.png",
      "answerImg": "assets/img/image148.png",
      "correctAnswer": "B",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_014",
      "name": "Q17: The necessary and sufficient condition for an alkene to",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "For cis/trans isomerism, each carbon of the double bond must bear two different substituents. This means both carbons must each have two different groups attached — if either carbon has two identical groups, no geometric isomerism is possible.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image181.png",
      "answerImg": "assets/img/image182.png",
      "correctAnswer": "D",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_015",
      "name": "Q20: Arrange four alkene isomers (I = trisubstituted, II = d",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Alkene stability increases with the degree of substitution (more alkyl groups on the double bond = more stable), and trans isomers are more stable than cis isomers of equal substitution. The correct order is I > IV > II > III.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image183.png",
      "answerImg": "assets/img/image184.png",
      "correctAnswer": "C",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_016",
      "name": "Q12: Which of these five alkene isomers (A=monosubstituted, ",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Alkene stability is determined primarily by the degree of substitution — more alkyl groups attached to the double bond lowers energy via hyperconjugation. The trisubstituted alkene (D) is the most stable among the five isomers.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image200.png",
      "answerImg": "assets/img/image201.png",
      "correctAnswer": "D",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_017",
      "name": "Q13: Two of the alkene isomers in question 12, when treated ",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Acid-catalyzed hydration (H2SO4/H2O) follows Markovnikov's rule and proceeds via a carbocation intermediate. Isomers C and D both form the same tertiary carbocation intermediate, leading to the identical alcohol product (2-methyl-2-butanol).",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image202.png",
      "answerImg": "assets/img/image203.png",
      "correctAnswer": "B",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_018",
      "name": "Q14: Two of the alkene isomers in question 12, when treated ",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Disubstituted internal alkenes (B and E) give a mixture of HBr addition products because protonation can occur at either carbon of a symmetrically substituted double bond, generating two equally stable secondary carbocations and thus two different regioisomeric products.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image206.png",
      "answerImg": "assets/img/image207.png",
      "correctAnswer": "C",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_019",
      "name": "Q3: Select the principal product(s) of cyclopentene reacting",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Halohydrin formation (NBS/H2O) proceeds via anti addition: Br and OH add to opposite faces of the double bond. Because the starting cyclopentene is achiral, the two chiral products form as a racemic mixture, giving the trans-bromohydrin racemate.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image209.png",
      "answerImg": "assets/img/image210.png",
      "correctAnswer": "E",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_020",
      "name": "Select the alkene which would be the best starting material ",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Oxymercuration-demercuration follows Markovnikov's rule; the OH ends up on the more substituted carbon. Methylenecyclohexane with a vinyl substituent (option d) places the OH at the tertiary carbon to give the desired product.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image211.png",
      "answerImg": "assets/img/image212.png",
      "correctAnswer": "D",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_021",
      "name": "Which procedure would you use to convert 1-pentene to 1-pent",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "1-Pentanol has the OH on C1 (anti-Markovnikov), so hydroboration-oxidation (BH3 then KOH/H2O2) is required. Oxymercuration (a, b) and acid-catalyzed hydration give the Markovnikov alcohol.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image213.png",
      "answerImg": "assets/img/image214.png",
      "correctAnswer": "C",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_022",
      "name": "Select the principal product of the reaction of methylenecyc",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "KOH deprotonates CHCl3 to generate :CCl2 (dichlorocarbene), which adds in a concerted syn fashion across the double bond to give a dichlorocyclopropane ring fused to the cyclohexane.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image215.png",
      "answerImg": "assets/img/image216.png",
      "correctAnswer": "C",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_023",
      "name": "Which compounds would be formed in significant quantity when",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "HCl adds to conjugated dienes via both 1,2- and 1,4-addition; the proton attacks both terminal carbons, generating products I, III, and V from the two orientations of attack.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image218.png",
      "answerImg": "assets/img/image219.png",
      "correctAnswer": "C",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_024",
      "name": "Select the principal product of treating cyclohexene with NB",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "NBS under light performs allylic free-radical bromination, selectively replacing an allylic C-H with Br. The product is 3-bromocyclohexene (bromine at the allylic position adjacent to the double bond).",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image220.png",
      "answerImg": "assets/img/image221.png",
      "correctAnswer": "B",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_025",
      "name": "Select the structure(s) of the intermediate(s) formed when (",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Bromine adds to alkenes via a bromonium ion intermediate (structure I only); the stereospecificity of anti addition means the methyl groups remain cis in the bridged bromonium ion, ruling out open carbocation intermediates II and III.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image228.png",
      "answerImg": "assets/img/image229.png",
      "correctAnswer": "A",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_026",
      "name": "Select the major organic product of treating 2-methylpropene",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "In bromohydrin formation bromine acts as the electrophile and attaches to the less substituted carbon (Markovnikov-type), placing OH on the more substituted carbon and Br on the less substituted carbon.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image230.png",
      "answerImg": "assets/img/image231.png",
      "correctAnswer": "B",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_027",
      "name": "Select the major organic product of treating 2-methylpropene",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Hydroboration-oxidation gives anti-Markovnikov addition of OH; the boron attaches to the less hindered (less substituted) carbon and oxidation replaces B with OH, giving the primary alcohol.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image232.png",
      "answerImg": "assets/img/image233.png",
      "correctAnswer": "A",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_028",
      "name": "What is (are) the principal organic product(s) of oxymercura",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Oxymercuration gives Markovnikov addition of OH, placing it on C2 (a new chiral center). Because achiral reactants produce chiral products, both enantiomers form in equal amounts, giving a racemic mixture.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image234.png",
      "answerImg": "assets/img/image235.png",
      "correctAnswer": "E",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_029",
      "name": "Select the two products that form when a bicyclic decalin al",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "NBS generates an allylic radical at the carbon adjacent to the double bond; the radical is delocalized over two allylic positions (resonance), so bromine is captured at both ends giving two allylic bromide regioisomers (II and IV).",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image236.png",
      "answerImg": "assets/img/image237.png",
      "correctAnswer": "E",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_030",
      "name": "Select the alkene which would be the best starting material ",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Oxymercuration-demercuration follows Markovnikov's rule; the alkene with the terminal =CH2 on the cyclohexane ring (vinyl cyclohexane with an exo double bond) places OH on the more substituted carbon to give the correct tertiary alcohol product.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image245.png",
      "answerImg": "assets/img/image246.png",
      "correctAnswer": "D",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_031",
      "name": "Select the principal product of the reaction of methylenecyc",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "CHCl3 + KOH generates dichlorocarbene (:CCl2), which undergoes syn cycloaddition across the double bond to form a cyclopropane ring bearing two chlorines; the product is a bicyclic dichlorocyclopropane fused to cyclohexane.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image247.png",
      "answerImg": "assets/img/image248.png",
      "correctAnswer": "C",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_032",
      "name": "Select the principal product(s) of the reaction of cyclopent",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Halohydrin formation proceeds via anti addition, placing OH and Br on opposite faces of the ring; because the starting material is achiral, the two chiral products form as a racemic mixture of enantiomers.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image249.png",
      "answerImg": "assets/img/image250.png",
      "correctAnswer": "E",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_033",
      "name": "Select the principal product of the reaction of cyclohexene ",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "NBS with light or heat performs allylic free-radical bromination, selectively replacing a hydrogen at the allylic position adjacent to the double bond, giving 3-bromocyclohexene (the double bond migrates to form a conjugated system).",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image251.png",
      "answerImg": "assets/img/image252.png",
      "correctAnswer": "B",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_034",
      "name": "Which structure(s) represent bromonium ion(s)? (Structures I",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "A bromonium ion is a three-membered ring with a positively charged bridging bromine bonded to two carbons; structures II (cyclopentane bromonium) and III (open-chain bromonium) both fit this description, while I is a C-H bromide and IV is a bromide anion.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image253.png",
      "answerImg": "assets/img/image254.png",
      "correctAnswer": "C",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_035",
      "name": "Alkene ___ is the least stable while alkene ___ is the most ",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Alkene stability increases with the number of alkyl substituents on the double bond carbons; the least substituted (monosubstituted) alkene III is least stable, and the most substituted (trisubstituted) alkene I is most stable.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image255.png",
      "answerImg": "assets/img/image256.png",
      "correctAnswer": "C",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_036",
      "name": "Which one of the following statements about alkene reactions",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Halogenation (Cl2 or Br2) of an alkene proceeds through a cyclic halonium ion intermediate, not a carbocation, so it does NOT follow Markovnikov selectivity — Cl adds equally to both carbons; statement (c) is therefore incorrect.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image257.png",
      "answerImg": "assets/img/image258.png",
      "correctAnswer": "C",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_037",
      "name": "What is the major product of the addition of HBr to a benzyl",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "HBr adds to the conjugated benzylic alkene via a resonance-stabilized allylic/benzylic carbocation; protonation gives the more stable benzylic carbocation and Br attacks to give the product with Br on the carbon alpha to the ring.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image259.png",
      "answerImg": "assets/img/image260.png",
      "correctAnswer": "C",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_038",
      "name": "What is the industrial process by which an alkane such as et",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Cracking is the high-temperature industrial process that breaks C-C and C-H bonds in alkanes to produce alkenes (and smaller alkanes); fractionating, distilling, and refining are separation processes, not bond-breaking processes.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image261.png",
      "answerImg": "assets/img/image262.png",
      "correctAnswer": "A",
      "choices": [
        "A",
        "B",
        "C",
        "D",
        "E"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_039",
      "name": "Which compound shown will undergo catalytic hydrogenation (H",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "Less substituted alkenes are less stable and react faster with H2/Pd/C because they have less steric hindrance for adsorption onto the catalyst surface; the least substituted alkene (b, a disubstituted trans alkene with fewer bulky groups) reacts fastest.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image263.png",
      "answerImg": "assets/img/image264.png",
      "correctAnswer": "B",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_040",
      "name": "The products of the addition of HBr to a chiral methylsubsti",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "When HBr adds to an alkene bearing a pre-existing stereocentre, the new stereocentre can be formed on either face giving two products that differ at both stereocentres but are not mirror images of each other — they are diastereomers.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image265.png",
      "answerImg": "assets/img/image266.png",
      "correctAnswer": "B",
      "choices": [
        "A",
        "B",
        "C",
        "D"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    },
    {
      "id": "img_041",
      "name": "In the hydroboration-oxidation reaction, BH3 acts as a/an: (",
      "reagents": "",
      "prod": {
        "type": "add"
      },
      "decision": {
        "q": "",
        "opts": []
      },
      "rule": "BH3 is electron-deficient (boron has an empty p orbital), so it acts as an electrophile; it attacks the pi bond of the alkene from the less hindered face in a concerted syn addition, placing boron on the less substituted carbon.",
      "trap": null,
      "tier": "image",
      "questionImg": "assets/img/image267.png",
      "answerImg": "assets/img/image268.png",
      "correctAnswer": "B",
      "choices": [
        "A",
        "B",
        "C"
      ],
      "firstMove": "",
      "shortcut": "",
      "whyTrapTempting": "",
      "smiles": null
    }
  ],
  "pool": [
    {
      "type": "add",
      "c1": "H",
      "c2": "Br"
    },
    {
      "type": "add",
      "c1": "Br",
      "c2": "H"
    },
    {
      "type": "add",
      "c1": "H",
      "c2": "OH"
    },
    {
      "type": "add",
      "c1": "OH",
      "c2": "H"
    },
    {
      "type": "add",
      "c1": "Br",
      "c2": "Br"
    },
    {
      "type": "add",
      "c1": "Br",
      "c2": "OH"
    },
    {
      "type": "add",
      "c1": "Cl",
      "c2": "OH"
    },
    {
      "type": "add",
      "c1": "OCH3",
      "c2": "H"
    },
    {
      "type": "diol"
    },
    {
      "type": "epoxide"
    },
    {
      "type": "alkane"
    },
    {
      "type": "cleave"
    }
  ],
  "levels": [
    {
      "n": 1,
      "key": "recognise",
      "tag": "L1 · RECOGNISE",
      "cls": "",
      "lt": "RECOGNISE",
      "ld": "See the reagents → name the reaction. Pure pattern-spotting."
    },
    {
      "n": 2,
      "key": "toggle",
      "tag": "L2 · TOGGLE",
      "cls": "",
      "lt": "TOGGLE",
      "ld": "One reaction, one decision. Markovnikov? Syn or anti?"
    },
    {
      "n": 3,
      "key": "predict",
      "tag": "L3 · PREDICT",
      "cls": "",
      "lt": "PREDICT",
      "ld": "Reagents on an alkene → pick the right product."
    },
    {
      "n": 4,
      "key": "reverse",
      "tag": "L4 · REVERSE",
      "cls": "boss",
      "lt": "REVERSE (BOSS)",
      "ld": "Here’s the product — what reagents made it?"
    },
    {
      "n": 5,
      "key": "trap",
      "tag": "L5 · TRAP",
      "cls": "trap",
      "lt": "TRAP",
      "ld": "Near-identical reagents, opposite answers. The exam’s favourite trick."
    },
    {
      "n": 6,
      "key": "image",
      "tag": "L6 · EXAM QUESTIONS",
      "cls": "",
      "lt": "EXAM QUESTIONS",
      "ld": "Real past-exam questions with structural diagrams. Pick the right letter."
    }
  ]
};
