"""Build a house-style circular 'surf spot' die-cut sticker (e.g. AMOREIRA):
cream badge, thick ink ring, an ember wave motif, the spot name in Sora, arched
secondary text, a white die-cut border + soft shadow. Optionally paste onto a photo.

The model can't spell, so all type is set here in brand fonts (Sora / DM Mono).
The wave motif is a clean (grain-free) Recraft house sticker, keyed to transparent.

Usage:
  python3 spot_sticker.py --wave wave.png --name AMOREIRA --out badge.png \
      [--photo p.jpg --paste out.jpg --scale 0.34 --angle -6 --pos br]
"""
from __future__ import annotations
import argparse
import math
from PIL import Image, ImageDraw, ImageFilter
from brandkit import RED, INK, PAPER, font
from sticker_on_photo import die_cut, paste

SS = 2  # supersample for crisp edges


def _arc_text(base, text, cx, cy, radius, fnt, fill, top=True):
    adv = [fnt.getlength(ch) for ch in text]
    total = sum(adv)
    ang_per_px = 360.0 / (2 * math.pi * radius)
    start = (-90 - total * ang_per_px / 2) if top else (90 + total * ang_per_px / 2)
    d = 1 if top else -1
    a = start
    asc = fnt.size + 16
    for ch, w in zip(text, adv):
        ca = a + d * (w / 2) * ang_per_px
        rad = math.radians(ca)
        x = cx + radius * math.cos(rad)
        y = cy + radius * math.sin(rad)
        cw = int(math.ceil(fnt.getlength(ch))) + 10
        gi = Image.new("RGBA", (cw, asc), (0, 0, 0, 0))
        ImageDraw.Draw(gi).text((5, 4), ch, font=fnt, fill=fill)
        gi = gi.rotate(-(ca + 90) if top else -(ca - 90), expand=True, resample=Image.BICUBIC)
        base.alpha_composite(gi, (int(x - gi.width / 2), int(y - gi.height / 2)))
        a += d * w * ang_per_px


def _center(d, cx, y, text, fnt, fill):
    l, t, r, b = d.textbbox((0, 0), text, font=fnt)
    d.text((cx - (r - l) / 2 - l, y), text, font=fnt, fill=fill)
    return b - t


def build(name: str, wave_path: str, top: str, bottom: str) -> Image.Image:
    S = 1000 * SS
    cx = cy = S // 2
    R = int(430 * SS)
    badge = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(badge)

    # cream disc, thick ink ring, thin ember inner ring
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=PAPER + (255,), outline=INK, width=15 * SS)
    ir = R - 26 * SS
    d.ellipse([cx - ir, cy - ir, cx + ir, cy + ir], outline=RED, width=5 * SS)

    # arched secondary text
    _arc_text(badge, top, cx, cy, R - 66 * SS, font("DMMono", 40 * SS), INK, top=True)
    _arc_text(badge, bottom, cx, cy, R - 66 * SS, font("DMMono", 40 * SS), INK, top=False)

    # wave motif (grain-free, keyed transparent, no border/shadow), upper-middle
    wave = die_cut(Image.open(wave_path), border=0, shadow=False)
    ww = int(340 * SS)
    wave = wave.resize((ww, int(wave.height * ww / wave.width)), Image.LANCZOS)
    badge.alpha_composite(wave, (cx - ww // 2, int(cy - 250 * SS)))

    # spot name — the hero — straight, bold, ink
    nf = font("SoraXBold", 150 * SS)
    _center(d, cx, int(cy + 70 * SS), name, nf, INK)

    badge = badge.resize((1000, 1000), Image.LANCZOS)

    # white die-cut border + soft shadow, from the badge's own alpha
    a = badge.split()[3]
    grow = a
    for _ in range(9):
        grow = grow.filter(ImageFilter.MaxFilter(5))   # ~ +18px halo
    out = Image.new("RGBA", (1000 + 60, 1000 + 60), (0, 0, 0, 0))
    ox = oy = 30
    sh = Image.new("L", out.size, 0)
    sh.paste(grow, (ox, oy + 6))
    sh = sh.filter(ImageFilter.GaussianBlur(11))
    shl = Image.new("RGBA", out.size, (0, 0, 0, 0))
    shl.putalpha(sh.point(lambda v: int(v * 0.36)))
    out = Image.alpha_composite(out, shl)
    wl = Image.new("RGBA", out.size, (0, 0, 0, 0))
    wl.paste(Image.new("RGBA", (1000, 1000), PAPER + (255,)), (ox, oy), grow)
    out = Image.alpha_composite(out, wl)
    out.alpha_composite(badge, (ox, oy))
    return out.crop(out.getbbox())


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--wave", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--top", default="· COSTA VICENTINA ·")
    ap.add_argument("--bottom", default="PORTUGAL")
    ap.add_argument("--out", required=True)
    ap.add_argument("--photo")
    ap.add_argument("--paste")
    ap.add_argument("--scale", type=float, default=0.34)
    ap.add_argument("--angle", type=float, default=-6)
    ap.add_argument("--pos", default="br", choices=["br", "bl", "tr", "tl"])
    a = ap.parse_args()
    badge = build(a.name, a.wave, a.top, a.bottom)
    badge.save(a.out)
    print(f"OK  {a.out}  {badge.size}")
    if a.photo and a.paste:
        paste(badge, Image.open(a.photo), a.scale, a.angle, a.pos).save(a.paste, quality=92)
        print(f"OK  {a.paste}")
