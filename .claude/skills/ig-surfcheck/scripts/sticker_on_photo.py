"""Turn a Recraft house-style sticker (subject on cream) into a die-cut sticker
with a white border + soft shadow, and paste it onto a photo.

Usage:
  python3 sticker_on_photo.py --raw raw.png --photo photo.jpg --out out.jpg \
      [--scale 0.30] [--angle -7] [--pos br] [--border 12]

--pos: br bl tr tl  (corner). Margin auto.
"""
from __future__ import annotations
import argparse
from PIL import Image, ImageDraw, ImageFilter

PAPER = (250, 250, 248)


def _is_cream(px) -> bool:
    r, g, b = px[0], px[1], px[2]
    return r > 195 and g > 185 and b > 165


def die_cut(raw: Image.Image, border: int = 12, shadow: bool = True) -> Image.Image:
    """Key out the border-connected cream, drop specks, add white border + shadow.
    border=0 skips the white halo; shadow=False skips the drop shadow (used when
    embedding the keyed subject inside another composition)."""
    raw = raw.convert("RGB")
    w, h = raw.size

    # cream mask (255 = cream)
    cream = Image.new("L", (w, h), 0)
    cp = cream.load()
    rp = raw.load()
    for y in range(h):
        for x in range(w):
            cp[x, y] = 255 if _is_cream(rp[x, y]) else 0

    # flood the border-connected cream to 128 from every cream edge pixel
    bg = cream.copy()
    seeds = []
    for x in range(0, w, 8):
        seeds += [(x, 0), (x, h - 1)]
    for y in range(0, h, 8):
        seeds += [(0, y), (w - 1, y)]
    for s in seeds:
        if bg.getpixel(s) == 255:
            ImageDraw.floodfill(bg, s, 128, thresh=10)
    bgp = bg.load()

    # alpha = not background; then morphological opening kills grain specks
    alpha = Image.new("L", (w, h), 0)
    ap = alpha.load()
    for y in range(h):
        for x in range(w):
            ap[x, y] = 0 if bgp[x, y] == 128 else 255
    alpha = alpha.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))

    # grow alpha for the white die-cut border
    grow = alpha
    grown_px = 0
    while grown_px < border:
        grow = grow.filter(ImageFilter.MaxFilter(5))
        grown_px += 2

    # crop everything to the grown bbox + pad
    bbox = grow.getbbox()
    pad = border + 24
    l = max(0, bbox[0] - pad); t = max(0, bbox[1] - pad)
    r = min(w, bbox[2] + pad); b = min(h, bbox[3] + pad)
    raw_c = raw.crop((l, t, r, b))
    alpha_c = alpha.crop((l, t, r, b))
    grow_c = grow.crop((l, t, r, b))
    cw, ch = raw_c.size

    # compose: soft shadow, white border layer, subject on top
    out = Image.new("RGBA", (cw + 40, ch + 40), (0, 0, 0, 0))
    ox, oy = 20, 20

    if shadow:
        shadow_l = Image.new("RGBA", out.size, (0, 0, 0, 0))
        sh_mask = Image.new("L", out.size, 0)
        sh_mask.paste(grow_c, (ox, oy))
        sh_mask = sh_mask.filter(ImageFilter.GaussianBlur(9))
        shadow_l.putalpha(sh_mask.point(lambda v: int(v * 0.38)))
        out = Image.alpha_composite(out, shadow_l)

    if border > 0:
        white = Image.new("RGBA", out.size, (0, 0, 0, 0))
        white.paste(Image.new("RGBA", (cw, ch), PAPER + (255,)), (ox, oy), grow_c)
        out = Image.alpha_composite(out, white)

    subj = Image.new("RGBA", out.size, (0, 0, 0, 0))
    subj.paste(raw_c.convert("RGBA"), (ox, oy), alpha_c)
    out = Image.alpha_composite(out, subj)
    return out


def paste(sticker: Image.Image, photo: Image.Image, scale: float, angle: float, pos: str) -> Image.Image:
    photo = photo.convert("RGBA")
    pw, ph = photo.size
    target_w = int(pw * scale)
    sw, sh = sticker.size
    sticker = sticker.resize((target_w, int(sh * target_w / sw)), Image.LANCZOS)
    sticker = sticker.rotate(angle, expand=True, resample=Image.BICUBIC)
    stw, sth = sticker.size
    m = int(pw * 0.035)
    x = m if pos in ("bl", "tl") else pw - stw - m
    y = m if pos in ("tl", "tr") else ph - sth - m
    photo.alpha_composite(sticker, (x, y))
    return photo.convert("RGB")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", required=True)
    ap.add_argument("--photo", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--sticker-out", default=None, help="also save the transparent die-cut PNG")
    ap.add_argument("--scale", type=float, default=0.30)
    ap.add_argument("--angle", type=float, default=-7)
    ap.add_argument("--pos", default="br", choices=["br", "bl", "tr", "tl"])
    ap.add_argument("--border", type=int, default=12)
    a = ap.parse_args()
    st = die_cut(Image.open(a.raw), border=a.border)
    if a.sticker_out:
        st.save(a.sticker_out)
    paste(st, Image.open(a.photo), a.scale, a.angle, a.pos).save(a.out, quality=92)
    print(f"OK  {a.out}")
