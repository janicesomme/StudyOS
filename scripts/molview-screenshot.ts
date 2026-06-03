/// <reference types="node" />
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'no-fear-ochem', 'images');

// Coordinates measured from the MolView old-app layout at 1040x680 viewport.
// Crops to the white 2D canvas, excluding the left tool strip, top toolbar,
// element picker strip, and the 3D panel on the right.
const PANEL_2D = { x: 38, y: 88, width: 450, height: 572 };

type PubChemResult = { cid: number; smiles: string };

// Resolves a common or IUPAC name to a PubChem CID + SMILES.
// Handles "beta-" prefix names, Greek letters are less reliable — use "beta-" spelling.
export async function lookupCompound(name: string): Promise<PubChemResult> {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/IsomericSMILES,CanonicalSMILES/JSON`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PubChem lookup failed for "${name}" (HTTP ${res.status})`);
  const json = await res.json() as {
    PropertyTable: { Properties: { CID: number; IsomericSMILES?: string; CanonicalSMILES?: string; SMILES?: string; ConnectivitySMILES?: string }[] }
  };
  const props = json.PropertyTable?.Properties?.[0];
  if (!props) throw new Error(`No result from PubChem for "${name}"`);
  const smiles = props.IsomericSMILES ?? props.CanonicalSMILES ?? props.SMILES ?? props.ConnectivitySMILES;
  if (!smiles) throw new Error(`No SMILES returned from PubChem for "${name}"`);
  return { cid: props.CID, smiles };
}

async function dismissModal(page: import('playwright').Page): Promise<void> {
  // MolView always shows a "new app vs old app" modal on fresh load.
  const continueBtn = page.getByRole('button', { name: 'Continue to old app' });
  await continueBtn.waitFor({ state: 'visible', timeout: 10000 });
  await continueBtn.click();
  await page.waitForTimeout(500);
  // In headless mode the overlay element may linger after the click. Remove it directly.
  await page.evaluate(() => {
    document.querySelectorAll('[class*="overlay"], [class*="modal"], [class*="dialog"], [class*="popup"]')
      .forEach(el => el.remove());
  });
  await page.waitForTimeout(300);
}

// Screenshot a molecule by PubChem CID — most reliable, MolView queries PubChem natively.
export async function screenshotByCid(cid: number, filename: string): Promise<string> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(OUTPUT_DIR, `${filename}.png`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.setViewportSize({ width: 1040, height: 680 });
    await page.goto(`https://molview.org/?cid=${cid}`, { waitUntil: 'domcontentloaded' });
    await dismissModal(page);
    // Wait for initial render, then trigger MolView's "Clean structure" to fix bond angles.
    await page.waitForTimeout(1500);
    await page.getByTitle('Clean structure').click();
    // Give the clean pass time to finish before screenshotting.
    await page.waitForTimeout(2000);
    await page.screenshot({ path: outputPath, clip: PANEL_2D });
    return outputPath;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[molview-screenshot] Failed for CID ${cid}: ${msg}`);
    throw err;
  } finally {
    await browser.close();
  }
}

// Screenshot a molecule by name — looks up PubChem CID first, then loads MolView.
export async function screenshotByName(name: string, filename: string): Promise<string> {
  console.log(`Looking up "${name}" on PubChem...`);
  const { cid, smiles } = await lookupCompound(name);
  console.log(`Resolved: CID ${cid}, SMILES: ${smiles}`);
  return screenshotByCid(cid, filename);
}

// CLI usage:
//   by name:  npx tsx scripts/molview-screenshot.ts name "beta-ocimene" "beta-ocimene"
//   by CID:   npx tsx scripts/molview-screenshot.ts cid 11574 "1-methylcyclohexene"
const [, , mode, input, filename] = process.argv;
if (mode && input && filename) {
  const run = mode === 'name'
    ? screenshotByName(input, filename)
    : screenshotByCid(Number(input), filename);
  run
    .then(p => console.log(`Saved: ${p}`))
    .catch(() => process.exit(1));
}
