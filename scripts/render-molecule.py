"""
render-molecule.py
Usage: python scripts/render-molecule.py <SMILES> <output_path>

Renders a clean 2D molecular structure to PNG or SVG.
Output format is inferred from the file extension.

Example:
  python scripts/render-molecule.py "c1ccccc1O" output/phenol.png
"""
import sys
import os
from rdkit import Chem
from rdkit.Chem import Draw, rdMolDescriptors
from rdkit.Chem.Draw import rdMolDraw2D


def render(smiles: str, output_path: str) -> None:
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        print(f"ERROR: could not parse SMILES: {smiles}", file=sys.stderr)
        sys.exit(1)

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    ext = os.path.splitext(output_path)[1].lower()

    if ext == ".svg":
        drawer = rdMolDraw2D.MolDraw2DSVG(400, 300)
        drawer.drawOptions().addStereoAnnotation = False
        drawer.DrawMolecule(mol)
        drawer.FinishDrawing()
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(drawer.GetDrawingText())
    else:
        # Default to PNG
        drawer = rdMolDraw2D.MolDraw2DCairo(400, 300)
        drawer.drawOptions().addStereoAnnotation = False
        drawer.DrawMolecule(mol)
        drawer.FinishDrawing()
        with open(output_path, "wb") as f:
            f.write(drawer.GetDrawingText())

    print(f"Rendered: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python scripts/render-molecule.py <SMILES> <output_path>")
        sys.exit(1)
    render(sys.argv[1], sys.argv[2])
