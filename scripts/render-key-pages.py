# Renders all pages of a PDF as PNG files into an output directory.
# Usage: python scripts/render-key-pages.py <pdf_path> <output_dir>
# Output: <output_dir>/page_0001.png, page_0002.png, ...

import sys
import os
import fitz  # PyMuPDF

def render(pdf_path: str, out_dir: str) -> list[str]:
    os.makedirs(out_dir, exist_ok=True)
    doc = fitz.open(pdf_path)
    paths = []
    for i, page in enumerate(doc):
        mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for legibility
        pix = page.get_pixmap(matrix=mat)
        out_path = os.path.join(out_dir, f"page_{str(i + 1).zfill(4)}.png")
        pix.save(out_path)
        paths.append(out_path)
    return paths

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python render-key-pages.py <pdf_path> <output_dir>")
        sys.exit(1)
    rendered = render(sys.argv[1], sys.argv[2])
    for p in rendered:
        print(p)
