/**
 * find-content-bounds.cjs
 *
 * Scans an image and finds the bounding box of non-white pixels in each
 * grid cell, so you can crop without guessing coordinates.
 *
 * Usage:
 *   node scripts/find-content-bounds.cjs <image.png> [cols] [rows] [threshold]
 *
 * Examples:
 *   node scripts/find-content-bounds.cjs image259.png 4 1     # 4 cols, 1 row
 *   node scripts/find-content-bounds.cjs image230.png 2 2     # 2x2 grid
 *
 * Outputs: exact crop box (x, y, w, h) for each cell, with padding stripped.
 * threshold: pixel brightness below which it's "content" (default 240/255).
 */

const { createCanvas, loadImage } = (() => {
  try { return require('canvas'); }
  catch { return null; }
})();

const fs   = require('fs');
const path = require('path');

const [,, imgPath, colsArg='4', rowsArg='1', threshArg='240'] = process.argv;

if (!imgPath) {
  console.error('Usage: node scripts/find-content-bounds.cjs <image.png> [cols] [rows] [threshold]');
  process.exit(1);
}

if (!createCanvas) {
  // Fallback: use PowerShell to read pixel data
  console.error('node-canvas not installed. Run: npm install canvas');
  console.error('');
  console.error('Alternatively, use this PowerShell snippet to inspect the image:');
  console.error(`
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::new('${path.resolve(imgPath)}')
Write-Host "Size: $($img.Width) x $($img.Height)"

# Find first non-white row from top
for ($y = 0; $y -lt $img.Height; $y++) {
  for ($x = 0; $x -lt $img.Width; $x++) {
    $p = $img.GetPixel($x, $y)
    if ($p.R -lt 240 -or $p.G -lt 240 -or $p.B -lt 240) {
      Write-Host "First content pixel: x=$x, y=$y"; break 2
    }
  }
}
$img.Dispose()
`);
  process.exit(1);
}

async function run() {
  const cols      = parseInt(colsArg);
  const rows      = parseInt(rowsArg);
  const threshold = parseInt(threshArg);

  const img    = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx    = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height).data;

  const W = img.width, H = img.height;
  const cellW = Math.floor(W / cols);
  const cellH = Math.floor(H / rows);

  console.log(`Image: ${W} x ${H}  |  Grid: ${cols}x${rows}  |  Cell: ${cellW}x${cellH}`);
  console.log('');

  const letters = 'ABCDEFGHIJKLMNOP';
  let cellIdx = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x0 = col * cellW;
      const y0 = row * cellH;
      const x1 = Math.min(x0 + cellW, W);
      const y1 = Math.min(y0 + cellH, H);

      let minX = x1, maxX = x0, minY = y1, maxY = y0;

      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * W + x) * 4;
          const r = data[i], g = data[i+1], b = data[i+2];
          if (r < threshold || g < threshold || b < threshold) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      const pad = 4;
      const cx = Math.max(0,     minX - pad);
      const cy = Math.max(0,     minY - pad);
      const cw = Math.min(W, maxX + pad) - cx;
      const ch = Math.min(H, maxY + pad) - cy;

      const label = letters[cellIdx];
      console.log(`Cell (${col},${row}) = option ${label}:`);
      if (minX > maxX) {
        console.log('  (empty cell)');
      } else {
        console.log(`  tight content:  x=${minX} y=${minY} w=${maxX-minX} h=${maxY-minY}`);
        console.log(`  padded crop:    x=${cx} y=${cy} w=${cw} h=${ch}`);
        console.log(`  PowerShell:     CropSave \$src "$base\\opt_${label.toLowerCase()}.png" ${cx} ${cy} ${cw} ${ch}`);
      }
      console.log('');
      cellIdx++;
    }
  }
}

run().catch(e => { console.error(e); process.exit(1); });
