window.GAME_DATA = {
  "subject": "Alkene Additions",
  "reactions": [
    {
      "id": "hbr",
      "name": "Hydrohalogenation",
      "reagents": "HBr",
      "prod": {
        "type": "add",
        "c1": "H",
        "c2": "Br"
      },
      "decision": {
        "q": "Where does the Br end up?",
        "opts": [
          [
            "More-substituted carbon (Markovnikov)",
            true
          ],
          [
            "Less-substituted carbon",
            false
          ]
        ]
      },
      "rule": "H-Br adds Markovnikov. The H+ hits first and the carbon left holding the + charge is the more-substituted one (most stable cation) — so Br lands there.",
      "trap": "hbr_perox",
      "tier": "toggle",
      "firstMove": "Check for ROOR (peroxide) — absent means Markovnikov applies",
      "shortcut": "The rich get richer — Br goes to the more-substituted carbon",
      "whyTrapTempting": "Same HBr reagent; ROOR looks like a minor additive but flips the entire regiochemistry",
      "smiles": null
    },
    {
      "id": "hbr_perox",
      "name": "Radical Hydrobromination",
      "reagents": "HBr, ROOR",
      "prod": {
        "type": "add",
        "c1": "Br",
        "c2": "H"
      },
      "decision": {
        "q": "Where does the Br end up?",
        "opts": [
          [
            "Less-substituted carbon (anti-Markovnikov)",
            true
          ],
          [
            "More-substituted carbon",
            false
          ]
        ]
      },
      "rule": "Add peroxides and the mechanism flips to radicals. The most stable RADICAL is on the more-substituted carbon so Br is forced onto the LESS-substituted one. Anti-Markovnikov. ONLY HBr does this.",
      "trap": "hbr",
      "tier": "trap",
      "firstMove": "Spot ROOR — that single word reverses the regiochemistry entirely",
      "shortcut": "Peroxide = backwards Br. HCl and HI have no radical pathway.",
      "whyTrapTempting": "Students default to Markovnikov for any HBr reaction and treat ROOR as a minor detail",
      "smiles": null
    },
    {
      "id": "hydration",
      "name": "Acid-Catalysed Hydration",
      "reagents": "H2O, H2SO4",
      "prod": {
        "type": "add",
        "c1": "H",
        "c2": "OH"
      },
      "decision": {
        "q": "Where does the OH end up?",
        "opts": [
          [
            "More-substituted carbon (Markovnikov)",
            true
          ],
          [
            "Less-substituted carbon",
            false
          ]
        ]
      },
      "rule": "Water adds Markovnikov via a carbocation. OH lands on the more-substituted carbon. Because there is a real carbocation intermediate the skeleton can REARRANGE.",
      "trap": "hydroboration",
      "tier": "toggle",
      "firstMove": "Markovnikov OH — then ask: can the carbocation rearrange?",
      "shortcut": "H2O + H+ = Markovnikov alcohol with possible rearrangement",
      "whyTrapTempting": "Both acid hydration and hydroboration give an alcohol but regiochemistry is exactly reversed",
      "smiles": null
    },
    {
      "id": "oxymerc",
      "name": "Oxymercuration",
      "reagents": "1) Hg(OAc)2, H2O  2) NaBH4",
      "prod": {
        "type": "add",
        "c1": "H",
        "c2": "OH"
      },
      "decision": {
        "q": "What is the signature of this reaction?",
        "opts": [
          [
            "Markovnikov OH with NO rearrangement",
            true
          ],
          [
            "Anti-Markovnikov OH",
            false
          ]
        ]
      },
      "rule": "Same Markovnikov OH as acid hydration but the mercurinium ring blocks rearrangement. When a substrate WOULD rearrange under acid conditions this is the clean Markovnikov reagent.",
      "trap": "hydroboration",
      "tier": "recognise",
      "firstMove": "Two-step with Hg reagent means Markovnikov alcohol — no rearrangement possible",
      "shortcut": "Mercury = Markovnikov without the mess",
      "whyTrapTempting": "Both give OH on the more-substituted carbon; the critical difference is rearrangement possibility",
      "smiles": null
    },
    {
      "id": "hydroboration",
      "name": "Hydroboration-Oxidation",
      "reagents": "1) BH3·THF  2) H2O2, NaOH",
      "prod": {
        "type": "add",
        "c1": "OH",
        "c2": "H",
        "stereo": "syn"
      },
      "decision": {
        "q": "Where does the OH end up?",
        "opts": [
          [
            "Less-substituted carbon (anti-Markovnikov)",
            true
          ],
          [
            "More-substituted carbon",
            false
          ]
        ]
      },
      "rule": "Boron is bulky and goes to the LESS-crowded carbon; oxidation swaps B for OH in place. Result: OH on the less-substituted carbon anti-Markovnikov and syn addition.",
      "trap": "oxymerc",
      "tier": "toggle",
      "firstMove": "BH3 = anti-Markovnikov + syn addition — two facts to lock in",
      "shortcut": "Boron is shy — avoids the crowded (more-substituted) carbon",
      "whyTrapTempting": "Both hydroboration and oxymercuration give alcohols but regiochemistry is exactly reversed",
      "smiles": null
    },
    {
      "id": "br2",
      "name": "Halogenation",
      "reagents": "Br2",
      "prod": {
        "type": "add",
        "c1": "Br",
        "c2": "Br",
        "stereo": "anti"
      },
      "decision": {
        "q": "How do the two Br atoms add?",
        "opts": [
          [
            "Anti (opposite faces)",
            true
          ],
          [
            "Syn (same face)",
            false
          ]
        ]
      },
      "rule": "Br2 makes a three-membered bromonium ion; the second Br- attacks from the back. Vicinal dibromide always ANTI addition.",
      "trap": "halohydrin",
      "tier": "toggle",
      "firstMove": "Bromonium ion formed — back-side attack gives anti vicinal dibromide",
      "shortcut": "Br2 alone = anti vicinal dibromide every time",
      "whyTrapTempting": "Both Br2 and Br2/H2O go through bromonium; the nucleophile changes everything",
      "smiles": null
    },
    {
      "id": "halohydrin",
      "name": "Halohydrin Formation",
      "reagents": "Br2, H2O",
      "prod": {
        "type": "add",
        "c1": "Br",
        "c2": "OH",
        "stereo": "anti"
      },
      "decision": {
        "q": "Where does the OH go?",
        "opts": [
          [
            "More-substituted carbon (Br on the less-substituted)",
            true
          ],
          [
            "Less-substituted carbon",
            false
          ]
        ]
      },
      "rule": "Water hijacks the bromonium ion. It attacks the more-substituted carbon (more delta+) so OH lands there and Br takes the less-substituted carbon — anti addition.",
      "trap": "br2",
      "tier": "trap",
      "firstMove": "Br2 + H2O — water is the nucleophile; OH goes to more-substituted carbon",
      "shortcut": "Water hijacks bromonium at the richer carbon",
      "whyTrapTempting": "Looks identical to plain halogenation until you notice the water",
      "smiles": null
    },
    {
      "id": "h2",
      "name": "Catalytic Hydrogenation",
      "reagents": "H2, Pd/C",
      "prod": {
        "type": "alkane",
        "stereo": "syn"
      },
      "decision": {
        "q": "What is the product?",
        "opts": [
          [
            "The alkane — two H atoms add with syn stereochemistry",
            true
          ],
          [
            "An alcohol",
            false
          ]
        ]
      },
      "rule": "H2 on a metal surface delivers both hydrogens to the same face (syn). The pi bond is gone — you get the saturated alkane.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "H2 + metal catalyst = syn hydrogenation to alkane — full reduction",
      "shortcut": "Pd/C is always the same: syn addition and full reduction to the alkane",
      "whyTrapTempting": "Students sometimes confuse with hydration since both involve adding H; product is alkane not alcohol",
      "smiles": null
    },
    {
      "id": "oso4",
      "name": "syn-Dihydroxylation",
      "reagents": "OsO4 (or cold KMnO4)",
      "prod": {
        "type": "diol",
        "stereo": "syn"
      },
      "decision": {
        "q": "What diol do you get?",
        "opts": [
          [
            "cis / SYN diol — both OH on the same face",
            true
          ],
          [
            "trans / ANTI diol",
            false
          ]
        ]
      },
      "rule": "OsO4 (or cold dilute KMnO4) clamps onto one face and delivers both OH groups together — a SYN (cis) vicinal diol. Hot concentrated KMnO4 cleaves instead.",
      "trap": null,
      "tier": "toggle",
      "firstMove": "OsO4 or cold KMnO4 = syn diol (both OH from the same face)",
      "shortcut": "Os clamps — two oxygens delivered together from one face, geometry preserved",
      "whyTrapTempting": "Hot KMnO4 cleaves the double bond; cold KMnO4 dihydroxylates — temperature and concentration matter",
      "smiles": null
    },
    {
      "id": "mcpba",
      "name": "Epoxidation",
      "reagents": "mCPBA",
      "prod": {
        "type": "epoxide",
        "stereo": "syn"
      },
      "decision": {
        "q": "What is the product?",
        "opts": [
          [
            "An epoxide (3-membered O ring) with retained geometry",
            true
          ],
          [
            "A vicinal diol",
            false
          ]
        ]
      },
      "rule": "mCPBA delivers a single oxygen across the double bond in one concerted step — an epoxide with the alkene geometry fully preserved.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "mCPBA = single oxygen delivery = epoxide with geometry retained",
      "shortcut": "Peracid = epoxide. Geometry is locked in.",
      "whyTrapTempting": "Students confuse with OsO4 since both involve oxygen addition to the double bond",
      "smiles": null
    },
    {
      "id": "ozone",
      "name": "Ozonolysis",
      "reagents": "1) O3  2) Zn, H2O",
      "prod": {
        "type": "cleave"
      },
      "decision": {
        "q": "What does ozone do to the C=C bond?",
        "opts": [
          [
            "Cleaves it completely into two carbonyl fragments",
            true
          ],
          [
            "Adds two OH groups (diol)",
            false
          ]
        ]
      },
      "rule": "Ozone scissors the double bond completely. Each alkene carbon becomes a C=O. Count the substituents on each carbon to determine aldehyde vs ketone.",
      "trap": null,
      "tier": "recognise",
      "firstMove": "O3 = total cleavage — count substituents to identify aldehyde vs ketone",
      "shortcut": "Ozone scissors: C=C becomes C=O + O=C",
      "whyTrapTempting": "Students confuse with dihydroxylation since both involve oxidation; ozonolysis breaks the bond completely",
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
      "c2": "H",
      "stereo": "syn"
    },
    {
      "type": "add",
      "c1": "Br",
      "c2": "Br",
      "stereo": "anti"
    },
    {
      "type": "add",
      "c1": "Br",
      "c2": "OH",
      "stereo": "anti"
    },
    {
      "type": "alkane",
      "stereo": "syn"
    },
    {
      "type": "diol",
      "stereo": "syn"
    },
    {
      "type": "epoxide",
      "stereo": "syn"
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
    }
  ]
};
