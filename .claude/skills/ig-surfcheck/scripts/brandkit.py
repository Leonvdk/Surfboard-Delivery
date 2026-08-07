"""Surf Rental Aljezur brand kit — palette lock, deterministic grain, fonts.

Shared by recraft_gen.py and render_card.py. Everything here follows the
sra-branding skill's house recipe: three inks only, flat sticker fills, a fine
speckled wax grain applied deterministically (seeded) so re-runs are identical.
"""
from __future__ import annotations
import os
from PIL import Image, ImageFont

FONT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fonts")

# The three house inks (exact brand RGB).
RED = (192, 68, 25)      # #C04419
INK = (26, 26, 26)       # #1A1A1A
PAPER = (250, 250, 248)  # #FAFAF8
INKS = (RED, INK, PAPER)

# Shade tones for grain (from sra-branding): brand accent-hover, not arbitrary.
SHADE = {
    RED: (169, 61, 24),      # #A93D18
    INK: (38, 36, 33),       # a touch lifted so black is never dead flat
    PAPER: (243, 237, 224),  # #F3EDE0 cream shade
}
# Warm-biased fleck colours (keep flecks warm or they grey the accent).
FLECKS = [(169, 61, 24), (206, 92, 46), (227, 212, 188)]


def font(name: str, size: int):
    """Load a brand font. Sora is a variable file — set the weight axis."""
    if name.startswith("Sora"):
        f = ImageFont.truetype(os.path.join(FONT_DIR, "Sora.ttf"), size)
        wght = 800 if name.endswith("XBold") else 700 if name.endswith("Bold") else 600
        try:
            f.set_variation_by_axes([wght])
        except Exception:
            pass
        return f
    files = {
        "DMSansBold": "DMSans-Bold.ttf",
        "DMSansMed": "DMSans-Medium.ttf",
        "DMSans": "DMSans-Regular.ttf",
        "DMMono": "DMMono-Medium.ttf",
    }
    return ImageFont.truetype(os.path.join(FONT_DIR, files[name]), size)


def _nearest_ink(px):
    r, g, b = px[0], px[1], px[2]
    best, bd = INKS[0], 1 << 30
    for ink in INKS:
        d = (r - ink[0]) ** 2 + (g - ink[1]) ** 2 + (b - ink[2]) ** 2
        if d < bd:
            bd, best = d, ink
    return best


def quantize_to_inks(img: Image.Image) -> Image.Image:
    """Snap every pixel to the nearest of the three house inks."""
    img = img.convert("RGB")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            px[x, y] = _nearest_ink(px[x, y])
    return img


class _LCG:
    """Tiny seeded RNG so grain is byte-identical on re-runs."""
    def __init__(self, seed: int):
        self.s = seed & 0xFFFFFFFF

    def next(self) -> float:
        self.s = (1103515245 * self.s + 12345) & 0x7FFFFFFF
        return self.s / 0x7FFFFFFF


def add_grain(img: Image.Image, seed: int = 20260807) -> Image.Image:
    """Wax-brick speckle: right 30% of each colour run takes the shade tone,
    ~5.5% of pixels take a warm fleck. Deterministic given the seed."""
    img = img.convert("RGB")
    px = img.load()
    w, h = img.size
    rng = _LCG(seed)
    for y in range(h):
        x = 0
        while x < w:
            c = px[x, y]
            run_start = x
            while x < w and px[x, y] == c:
                x += 1
            run_len = x - run_start
            shade = SHADE.get(c)
            if shade and run_len >= 4:
                cut = run_start + int(run_len * 0.70)
                for xx in range(cut, x):
                    px[xx, y] = shade
    # warm flecks
    for y in range(h):
        for x in range(w):
            if rng.next() < 0.055:
                px[x, y] = FLECKS[int(rng.next() * len(FLECKS)) % len(FLECKS)]
    return img


def cover(img: Image.Image, tw: int, th: int) -> Image.Image:
    """Scale-and-crop img to exactly tw x th (center)."""
    img = img.convert("RGB")
    w, h = img.size
    scale = max(tw / w, th / h)
    nw, nh = int(w * scale + 0.5), int(h * scale + 0.5)
    img = img.resize((nw, nh), Image.LANCZOS)
    left, top = (nw - tw) // 2, (nh - th) // 2
    return img.crop((left, top, left + tw, top + th))
