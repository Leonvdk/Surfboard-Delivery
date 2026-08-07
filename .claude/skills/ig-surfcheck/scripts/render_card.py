"""Compose the Weekend Surf Check card: house art on top, conditions ledger below.

Usage:
    python3 render_card.py --art art.png --data data.json --out card.png

data.json shape:
{
  "meta": "AMOREIRA · COSTA VICENTINA · AUG 7–09",
  "days": [
    {"day": "FRI", "height": "0.8–1.0m", "sub": "5s NNW · wind N15", "verdict": "Small", "pick": false},
    {"day": "SAT", "height": "0.4–0.5m", "sub": "9s WNW · wind N15", "verdict": "Tiny/clean", "pick": false},
    {"day": "SUN", "height": "0.8–1.1m", "sub": "8s WNW · wind N15", "verdict": "The pick", "pick": true}
  ],
  "line": "Small and clean all weekend. Sunday fills in by evening — longboard + beginner gold.",
  "foot": "BOARDS + WETSUITS TO YOUR DOOR · ALJEZUR"
}
"""
from __future__ import annotations
import argparse
import json

from PIL import Image, ImageDraw
from brandkit import RED, INK, PAPER, font, fit_banner

W = H = 1080
ART_H = 620          # art zone height; ledger fills the rest
PAD = 64


def _center(draw, cx, y, text, f, fill):
    l, t, r, b = draw.textbbox((0, 0), text, font=f)
    draw.text((cx - (r - l) / 2 - l, y), text, font=f, fill=fill)
    return b - t


def _left(draw, x, y, text, f, fill, tracking=0):
    if tracking:
        cx = x
        for ch in text:
            draw.text((cx, y), ch, font=f, fill=fill)
            l, t, r, b = draw.textbbox((0, 0), ch, font=f)
            cx += (r - l) + tracking
        return
    draw.text((x, y), text, font=f, fill=fill)


def _right(draw, x, y, text, f, fill):
    l, t, r, b = draw.textbbox((0, 0), text, font=f)
    draw.text((x - (r - l) - l, y), text, font=f, fill=fill)


def build(art_path: str, data: dict, out: str) -> None:
    card = Image.new("RGB", (W, H), PAPER)

    # --- art zone: full-bleed, ring/emblem cropped away so it truly fills ---
    art = fit_banner(Image.open(art_path), W, ART_H)
    card.paste(art, (0, 0))

    # --- ledger: clean flat paper (grain belongs to the art only), art meets
    #     it on an ember rule. The bottom half stays crisp for legibility. ---
    d = ImageDraw.Draw(card)
    d.rectangle([0, ART_H, W, ART_H + 6], fill=RED)  # ember seam, edge to edge

    # --- kicker row ---
    ky = ART_H + 34
    _left(d, PAD, ky, "WEEKEND SURF CHECK", font("DMMono", 27), RED, tracking=3)
    _right(d, W - PAD, ky + 4, data["meta"], font("DMMono", 20), (90, 86, 80))

    # --- three day columns ---
    centers = [W * 1 // 6, W * 3 // 6, W * 5 // 6]
    col_top = ART_H + 96
    for i, (cx, day) in enumerate(zip(centers, data["days"])):
        if i:  # thin divider on the left of cols 2 and 3
            d.line([(cx - W // 6, col_top + 6), (cx - W // 6, col_top + 210)], fill=(222, 214, 200), width=2)
        y = col_top
        y += _center(d, cx, y, day["day"], font("SoraXBold", 42), INK) + 14
        _center(d, cx, y, day["height"], font("SoraBold", 58), RED)
        y += 74
        _center(d, cx, y, day["sub"], font("DMSansMed", 21), (74, 70, 64))
        y += 34
        vf = font("DMSansBold", 25)
        if day.get("pick"):
            # ember pill behind the verdict
            l, t, r, b = d.textbbox((0, 0), day["verdict"], font=vf)
            tw, th = r - l, b - t
            d.rounded_rectangle([cx - tw / 2 - 16, y - 4, cx + tw / 2 + 16, y + th + 12], radius=999, fill=RED)
            _center(d, cx, y, day["verdict"], vf, PAPER)
        else:
            _center(d, cx, y, day["verdict"], vf, INK)

    # --- payoff line ---
    _center(d, W // 2, ART_H + 322, data["line"], font("DMSans", 25), INK)

    # --- footer bar, edge to edge, touches bottom trim. No website here —
    #     the URL lives in the IG bio; the card just carries the promise. ---
    fh = 66
    d.rectangle([0, H - fh, W, H], fill=INK)
    _center(d, W // 2, H - fh + 20, data["foot"], font("DMMono", 23), PAPER)

    card.save(out, quality=95)
    print(f"OK  {out}  {card.size}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--art", required=True)
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    build(a.art, json.load(open(a.data)), a.out)
