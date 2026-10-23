#!/usr/bin/env python3
"""
generate_icons.py — Build the Cafe Milano app icon set.

Generates a black-square / red-"M" monogram icon in every size and format
needed by the PWA manifest (standard + maskable, plus the iOS touch icon).

Usage:
    pip install Pillow
    python3 generate_icons.py

Output:
    icons/icon-192.png
    icons/icon-512.png
    icons/icon-192-maskable.png
    icons/icon-512-maskable.png
    icons/icon-180.png   (iOS home-screen icon)

To use a different mark or colors, edit RED / BLACK / LETTER below, or swap
in a custom image (see make_icon_from_image() at the bottom for that path).
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ---- Brand colors (sampled from the Cafe Milano logo) ----
RED = (232, 20, 26)
BLACK = (10, 10, 10)
LETTER = "M"

# Try a few common serif-bold fonts; fall back to PIL's default if none exist.
FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    "C:\\Windows\\Fonts\\georgiab.ttf",
]

OUTPUT_DIR = Path(__file__).parent / "icons"


def find_font():
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return path
    return None


def make_icon(size: int, maskable: bool, filename: str):
    """Render a single icon. Maskable icons get extra padding so OS-level
    masking (circles, squircles, etc.) doesn't clip the letter."""
    img = Image.new("RGB", (size, size), BLACK)
    draw = ImageDraw.Draw(img)

    scale = 0.62 if maskable else 0.74
    font_size = int(size * scale)

    font_path = find_font()
    font = ImageFont.truetype(font_path, font_size) if font_path else ImageFont.load_default()

    bbox = draw.textbbox((0, 0), LETTER, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]
    draw.text((x, y), LETTER, font=font, fill=RED)

    out_path = OUTPUT_DIR / filename
    img.save(out_path)
    print(f"  wrote {out_path}  ({size}x{size}{', maskable' if maskable else ''})")


def make_icon_from_image(source_path: str, size: int, filename: str, pad_ratio: float = 0.12):
    """Alternative: build an icon from an existing square logo crop instead
    of the generated monogram. Pads onto a black square canvas."""
    img = Image.new("RGB", (size, size), BLACK)
    logo = Image.open(source_path).convert("RGB")

    target = int(size * (1 - 2 * pad_ratio))
    logo.thumbnail((target, target), Image.LANCZOS)

    x = (size - logo.width) // 2
    y = (size - logo.height) // 2
    img.paste(logo, (x, y))

    out_path = OUTPUT_DIR / filename
    img.save(out_path)
    print(f"  wrote {out_path}  ({size}x{size}, from {source_path})")


def main():
    OUTPUT_DIR.mkdir(exist_ok=True)
    print("Generating Cafe Milano app icons...")

    make_icon(192, maskable=False, filename="icon-192.png")
    make_icon(512, maskable=False, filename="icon-512.png")
    make_icon(192, maskable=True, filename="icon-192-maskable.png")
    make_icon(512, maskable=True, filename="icon-512-maskable.png")
    make_icon(180, maskable=False, filename="icon-180.png")  # Apple touch icon

    print("Done. Icons are in:", OUTPUT_DIR)


if __name__ == "__main__":
    main()
