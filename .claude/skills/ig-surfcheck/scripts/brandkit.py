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


def _is_paper(px) -> bool:
    r, g, b = px[0], px[1], px[2]
    return abs(r - 250) + abs(g - 250) + abs(b - 248) < 42


def fit_banner(img: Image.Image, tw: int, th: int) -> Image.Image:
    """Fill a tw x th banner with real artwork, defeating the house style's
    habit of drawing a centered emblem/ring on a cream margin. If the art has a
    paper border (an emblem), crop the largest rectangle that fits *inside* the
    subject — dropping the ring and the cream — then cover. A genuinely
    full-bleed source (no paper border) is just covered as-is.
    """
    img = img.convert("RGB")
    w, h = img.size
    small = img.resize((max(1, w // 6), max(1, h // 6)), Image.BILINEAR)
    sw, sh = small.size
    sp = small.load()

    # Is there a paper margin around the edge? Sample the outer frame.
    border, paper = 0, 0
    for x in range(sw):
        for y in (0, 1, sh - 2, sh - 1):
            border += 1
            paper += _is_paper(sp[x, y])
    for y in range(sh):
        for x in (0, 1, sw - 2, sw - 1):
            border += 1
            paper += _is_paper(sp[x, y])
    if paper / border < 0.45:
        return cover(img, tw, th)  # already reaches the edges

    # Emblem case: find the subject bbox, crop an inscribed rectangle of the
    # target aspect (diagonal 0.9·D) centered on it — inside the ring.
    xs, ys = [], []
    for y in range(sh):
        for x in range(sw):
            if not _is_paper(sp[x, y]):
                xs.append(x)
                ys.append(y)
    if not xs:
        return cover(img, tw, th)
    bx0, bx1 = min(xs) * 6, max(xs) * 6
    by0, by1 = min(ys) * 6, max(ys) * 6
    cx, cy = (bx0 + bx1) / 2, (by0 + by1) / 2
    D = min(bx1 - bx0, by1 - by0)
    A = tw / th
    cw = 0.9 * D / (1 + (1 / A) ** 2) ** 0.5
    ch = cw / A
    l = max(0, int(cx - cw / 2)); t = max(0, int(cy - ch / 2))
    r = min(w, int(cx + cw / 2)); b = min(h, int(cy + ch / 2))
    return cover(img.crop((l, t, r, b)), tw, th)
