"""
render-mechanism.py
Renders H2O + HCl -> H3O+ + Cl- with correct curved electron-pushing arrows.
Uses RDKit Cairo for molecule PNGs, PIL/Pillow to composite and draw arrows.

Usage: python scripts/render-mechanism.py
Output: output/mechanism.png

Arrow 1: O lone pair -> H of HCl  (arc above)
Arrow 2: H-Cl bond midpoint -> Cl  (arc below)
"""
import os
import math
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from rdkit import Chem
from rdkit.Chem import rdDepictor
from rdkit.Chem.Draw import rdMolDraw2D

RW, RH = 240, 180   # reactant canvas
PW, PH = 200, 180   # product canvas
SCALE = 2           # retina scale factor


def make_mol_with_hs(smiles):
    mol = Chem.AddHs(Chem.MolFromSmiles(smiles))
    rdDepictor.Compute2DCoords(mol)
    return mol


def make_mol(smiles):
    mol = Chem.MolFromSmiles(smiles)
    rdDepictor.Compute2DCoords(mol)
    return mol


def flip_x(mol):
    """Mirror left-right so H in HCl faces left toward H2O."""
    conf = mol.GetConformer()
    for i in range(mol.GetNumAtoms()):
        p = conf.GetAtomPosition(i)
        conf.SetAtomPosition(i, (-p.x, p.y, p.z))
    return mol


def draw_cairo(mol, w, h, with_hs=False):
    """Render molecule to a PIL Image using RDKit Cairo.
    Draws at 2x for crisp GetDrawCoords, then resizes to display size for compositing."""
    d = rdMolDraw2D.MolDraw2DCairo(w * SCALE, h * SCALE)
    d.drawOptions().addStereoAnnotation = False
    if with_hs:
        d.drawOptions().prepareMolsBeforeDrawing = False
    d.DrawMolecule(mol)
    d.FinishDrawing()
    png_bytes = d.GetDrawingText()
    img = Image.open(BytesIO(png_bytes)).convert("RGBA")
    img = img.resize((w, h), Image.LANCZOS)   # scale back to display size
    return img, d


def atom_px(drawer, idx, scale=SCALE):
    """Return pixel coords at display scale (divide by SCALE since drawer ran at 2x)."""
    pt = drawer.GetDrawCoords(idx)
    return pt.x / scale, pt.y / scale


def bezier_pts(x1, y1, x2, y2, cx, cy, n=60):
    """Sample n+1 points along a quadratic Bezier curve."""
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t ** 2 * x2
        y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t ** 2 * y2
        pts.append((x, y))
    return pts


def draw_arrow(draw, pts, color=(0, 0, 0), width=2, head_len=10, head_angle=25):
    """Draw a polyline with a filled arrowhead at the last point."""
    if len(pts) < 2:
        return
    # Polyline
    draw.line(pts, fill=color, width=width)
    # Arrowhead direction: from second-to-last to last point
    x2, y2 = pts[-1]
    x1, y1 = pts[-4]   # use a few points back for a stable direction
    angle = math.atan2(y2 - y1, x2 - x1)
    a = math.radians(head_angle)
    lx = x2 - head_len * math.cos(angle - a)
    ly = y2 - head_len * math.sin(angle - a)
    rx = x2 - head_len * math.cos(angle + a)
    ry = y2 - head_len * math.sin(angle + a)
    draw.polygon([(x2, y2), (lx, ly), (rx, ry)], fill=color)


def paste_mol(canvas, mol_img, x_off, y_off=0):
    """Paste a molecule image onto the canvas at (x_off, y_off), preserving transparency."""
    canvas.paste(mol_img, (x_off, y_off), mol_img)


def run():
    # --- Molecules ---
    h2o  = make_mol_with_hs('O')          # 0=O, 1=H, 2=H
    hcl  = flip_x(make_mol_with_hs('Cl')) # 0=Cl(right), 1=H(left)
    h3op = make_mol('[OH3+]')
    clm  = make_mol('[Cl-]')

    img_h2o,  dr_h2o  = draw_cairo(h2o,  RW, RH, with_hs=True)
    img_hcl,  dr_hcl  = draw_cairo(hcl,  RW, RH, with_hs=True)
    img_h3op, dr_h3op = draw_cairo(h3op, PW, PH)
    img_clm,  dr_clm  = draw_cairo(clm,  PW, PH)

    # --- Local atom pixel coords (at display scale) ---
    o_lx,  o_ly  = atom_px(dr_h2o, 0)   # O in H2O
    h_lx,  h_ly  = atom_px(dr_hcl, 1)   # H in HCl (flipped: left side)
    cl_lx, cl_ly = atom_px(dr_hcl, 0)   # Cl in HCl (flipped: right side)

    # --- Canvas layout ---
    PLUS_W  = 36
    RXN_W   = 56
    PAD     = 6

    x_h2o   = 0
    x_plus1 = x_h2o  + RW
    x_hcl   = x_plus1 + PLUS_W
    x_rxn   = x_hcl  + RW
    x_h3op  = x_rxn  + RXN_W
    x_plus2 = x_h3op + PW
    x_clm   = x_plus2 + PLUS_W

    total_w = x_clm + PW + PAD
    total_h = RH + PAD

    canvas = Image.new("RGBA", (total_w, total_h), (255, 255, 255, 255))

    paste_mol(canvas, img_h2o,  x_h2o,  0)
    paste_mol(canvas, img_hcl,  x_hcl,  0)
    paste_mol(canvas, img_h3op, x_h3op, (RH - PH) // 2)
    paste_mol(canvas, img_clm,  x_clm,  (RH - PH) // 2)

    draw = ImageDraw.Draw(canvas)

    # --- + labels ---
    mid_y = RH // 2
    try:
        font = ImageFont.truetype("times.ttf", 26)
    except Exception:
        font = ImageFont.load_default()

    plus1_x = x_plus1 + PLUS_W // 2
    plus2_x = x_plus2 + PLUS_W // 2
    draw.text((plus1_x - 8, mid_y - 14), "+", fill=(30, 30, 30), font=font)
    draw.text((plus2_x - 8, mid_y - 14), "+", fill=(30, 30, 30), font=font)

    # --- Reaction arrow ---
    rx1 = x_rxn + 5
    rx2 = x_rxn + RXN_W - 8
    draw.line([(rx1, mid_y), (rx2, mid_y)], fill=(80, 80, 80), width=2)
    # arrowhead
    draw.polygon([(rx2, mid_y), (rx2 - 8, mid_y - 5), (rx2 - 8, mid_y + 5)],
                 fill=(80, 80, 80))

    # --- Composite atom coords ---
    o_x  = x_h2o + o_lx;   o_y  = o_ly
    h_x  = x_hcl + h_lx;   h_y  = h_ly
    cl_x = x_hcl + cl_lx;  cl_y = cl_ly
    bx   = (h_x + cl_x) / 2
    by   = (h_y + cl_y) / 2

    # -------------------------------------------------------------------
    # Arrow 1: O lone pair -> H of HCl  (arc above)
    # -------------------------------------------------------------------
    a1x1 = o_x + 10;  a1y1 = o_y - 8
    a1x2 = h_x;       a1y2 = h_y
    a1cx = (a1x1 + a1x2) / 2
    a1cy = min(a1y1, a1y2) - 34

    pts1 = bezier_pts(a1x1, a1y1, a1x2, a1y2, a1cx, a1cy)
    draw_arrow(draw, pts1, color=(0, 0, 0), width=2)

    # -------------------------------------------------------------------
    # Arrow 2: H-Cl bond midpoint -> Cl  (arc below)
    # -------------------------------------------------------------------
    a2x1 = bx;   a2y1 = by
    a2x2 = cl_x; a2y2 = cl_y
    a2cx = (a2x1 + a2x2) / 2
    a2cy = max(a2y1, a2y2) + 28

    pts2 = bezier_pts(a2x1, a2y1, a2x2, a2y2, a2cx, a2cy)
    draw_arrow(draw, pts2, color=(0, 0, 0), width=2)

    # --- Save ---
    os.makedirs("output", exist_ok=True)
    out = "output/mechanism.png"
    canvas.convert("RGB").save(out)
    print(f"Rendered: {out}  ({total_w}x{total_h}px)")


run()
