"""Build the card's full-bleed banner from a single generated object.

WHY THIS EXISTS (measured 2026-08-07, five wasted generations):
the primary sticker style CANNOT draw a landscape. Prompt it for a scene and it
returns abstract parallel bands or an extreme close-up — `BANNER_SUFFIX`'s "fills
the entire frame / reaches every edge" makes it zoom until nothing reads. What it
does beautifully is a SINGLE well-drilled object on plain cream. So: generate the
object with `recraft_gen.py --mode spot`, then build the scene here in code.

    python3 recraft_gen.py "<one object, per the standing object rules>" \
        /tmp/sc-obj.png --mode spot --seed 20260807
    python3 compose_banner.py --obj /tmp/sc-obj.png --out /tmp/sc-art.png \
        --seed 20260807 --waves 3
    python3 render_card.py --art /tmp/sc-art.png --data /tmp/sc-data.json \
        --out /tmp/sc-card.png

The bands are laid out so the art's top edge is terracotta and its bottom edge is
ink — NEVER paper. `render_card.fit_banner()` reads a cream sky as an emblem
margin and crops *inside* the subject, which is what shreds the van. Non-paper
edges send it down the plain-cover path and the composition survives.

Scene knobs map to the weekend read: `--waves` for how much swell is showing
(1 tiny, 2-3 small/clean, 4-5 solid), `--sea` for how much frame the ocean owns,
`--width` for how big the object sits. Everything else is fixed house geometry.
"""
from __future__ import annotations

import argparse
from collections import deque

from PIL import Image

from brandkit import RED, INK, PAPER, add_grain

W, H = 1820, 1024          # 16:9-ish source; render_card covers it to 1080x620


def _is_cream(p) -> bool:
    """Cream / near-cream only. Burnt orange (#C04419, mean 95) and ink stay
    opaque — never key on luminance alone, it eats the brand cream fills."""
    r, g, b = p
    return r > 195 and g > 185 and b > 165


def cut_object(src: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Key the backdrop out with an edge flood-fill and crop to the subject.

    BFS inward from the border over cream pixels; that connected set is the
    background. A global threshold would erase every interior cream fill too.
    """
    src = src.convert("RGB")
    w, h = src.size
    px = src.load()

    seen = [[False] * h for _ in range(w)]
    q: deque = deque()

    def push(x, y):
        if not seen[x][y] and _is_cream(px[x, y]):
            seen[x][y] = True
            q.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                push(nx, ny)

    # Everything the flood-fill did NOT reach is foreground — but that includes
    # every speck of wax grain `recraft_gen` sprinkles on the cream. Stray flecks
    # would push the bounding box out to the full canvas, so keep only the
    # LARGEST connected foreground component: the object itself.
    fg = [[not seen[x][y] for y in range(h)] for x in range(w)]
    best: list[tuple[int, int]] = []
    visited = [[False] * h for _ in range(w)]
    for sx in range(w):
        for sy in range(h):
            if not fg[sx][sy] or visited[sx][sy]:
                continue
            comp = []
            visited[sx][sy] = True
            stack = [(sx, sy)]
            while stack:
                x, y = stack.pop()
                comp.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and fg[nx][ny] and not visited[nx][ny]:
                        visited[nx][ny] = True
                        stack.append((nx, ny))
            if len(comp) > len(best):
                best = comp
    if not best:
        raise SystemExit("compose_banner: flood-fill found no subject — is the art full-bleed already?")

    mask = Image.new("L", (w, h), 0)
    mp = mask.load()
    for x, y in best:
        mp[x, y] = 255

    xs = [p[0] for p in best]
    ys = [p[1] for p in best]
    box = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
    return src.crop(box), mask.crop(box)


def build(obj_path: str, out: str, seed: int, waves: int,
          sea: float, width: float) -> None:
    obj, mask = cut_object(Image.open(obj_path))

    sea_h = int(H * sea)
    road_y = int(H * 0.93)                      # dark strip along the bottom edge

    bg = Image.new("RGB", (W, H), PAPER)        # sand
    bg.paste(Image.new("RGB", (W, sea_h), RED), (0, 0))
    bg.paste(Image.new("RGB", (W, H - road_y), INK), (0, road_y))
    d = bg.load()

    for y in range(sea_h, sea_h + 7):           # shoreline rule
        for x in range(W):
            d[x, y] = INK

    for i in range(waves):                      # lines of swell across the sea
        y0 = int(sea_h * (0.42 + 0.46 * (i / max(1, waves - 1)))) if waves > 1 else int(sea_h * 0.62)
        for y in range(y0, y0 + 6):
            for x in range(W):
                d[x, y] = PAPER

    # Grain the BANDS BEFORE the object lands on them. add_grain shades the right
    # 30% of each scanline run, so an object pasted first splits every row it
    # covers into separate runs — and the shading then steps at the object's
    # bounding box, printing a ghost rectangle around it. The object carries its
    # own grain from recraft_gen, so it needs none from here.
    bg = add_grain(bg, seed=seed)

    tw = int(W * width)                         # object on the sand, tyres/base
    th = int(obj.height * (tw / obj.width))     # resting on the dark strip
    obj = obj.resize((tw, th), Image.LANCZOS)
    mask = mask.resize((tw, th), Image.LANCZOS)
    bg.paste(obj, ((W - tw) // 2, road_y - th + 6), mask)

    bg.save(out)
    print(f"OK  {out}  {bg.size}")


def build_plain(obj_paths: list[str], out: str, seed: int, scale: float,
                card_w: int = 1080, card_h: int = 620) -> None:
    """Objects on bare paper — the sticker-set register the style was trained on.

    No sea, no sand, no ink strip: just the keyed-out object(s) floating on the
    house cream, sized by HEIGHT (a diagonal board is tall, so a width fraction
    overflows the frame) and optically centred as a group.

    Renders at the card's exact art-zone size so `render_card` pastes it AS IS —
    `fit_banner()` would read the paper margin as an emblem ring and crop inside
    the subjects.
    """
    cut = [cut_object(Image.open(p)) for p in obj_paths]

    # Clean paper, deliberately UNGRAINED. add_grain shades the right 30% of every
    # scanline run, which on a bare field prints a hard vertical seam at 70% width,
    # and its warm flecks read as dust rather than wax. The trained sticker set sits
    # on plain off-white; the grain belongs inside the object, where recraft_gen
    # already put it.
    bg = Image.new("RGB", (card_w, card_h), PAPER)

    budget_h = int(card_h * scale)
    gap = int(card_w * 0.05)

    sized = []
    for obj, mask in cut:
        th = budget_h
        tw = int(obj.width * (th / obj.height))
        sized.append((obj.resize((tw, th), Image.LANCZOS),
                      mask.resize((tw, th), Image.LANCZOS)))

    total_w = sum(o.width for o, _ in sized) + gap * (len(sized) - 1)
    if total_w > card_w * 0.86:                 # shrink the group to fit
        k = (card_w * 0.86) / total_w
        sized = [(o.resize((int(o.width * k), int(o.height * k)), Image.LANCZOS),
                  m.resize((int(m.width * k), int(m.height * k)), Image.LANCZOS))
                 for o, m in sized]
        total_w = sum(o.width for o, _ in sized) + gap * (len(sized) - 1)

    x = (card_w - total_w) // 2
    for obj, mask in sized:                     # centre each on the same axis
        bg.paste(obj, (x, (card_h - obj.height) // 2), mask)
        x += obj.width + gap

    bg.save(out)
    print(f"OK  {out}  {bg.size}  ({len(sized)} object{'s' if len(sized) > 1 else ''})")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--obj", required=True, action="append",
                    help="spot-mode art: one object on cream (repeat for --plain)")
    ap.add_argument("--out", required=True)
    ap.add_argument("--seed", type=int, default=20260807)
    ap.add_argument("--plain", action="store_true",
                    help="objects on bare paper (sticker register), no band scene")
    ap.add_argument("--scale", type=float, default=0.74,
                    help="--plain only: object height as fraction of the art zone")
    ap.add_argument("--waves", type=int, default=3, help="1 tiny · 2-3 small · 4-5 solid")
    ap.add_argument("--sea", type=float, default=0.52, help="fraction of frame the sea owns")
    ap.add_argument("--width", type=float, default=0.58, help="object width as fraction of frame")
    a = ap.parse_args()
    if a.plain:
        build_plain(a.obj, a.out, a.seed, a.scale)
    else:
        build(a.obj[0], a.out, a.seed, a.waves, a.sea, a.width)
