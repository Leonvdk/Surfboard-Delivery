"""
Build the ocean-openness map the tidal water shell rides on.

Usage:  python3 tools/make-ocean-openness.py \
            apps/web/public/tides/earth-mask.png \
            apps/web/public/tides/earth-openness.png
Needs numpy and pillow.

The bulge is a dome up to ~0.27 of a globe radius tall. Left to itself it sits
straight on top of the continents. This map says, for every point, how much of
an open sea it is standing in — 0 on land and along every shore, 1 out in a
basin — so the shell can carry the full bulge offshore and settle flat at the
coast, with a rounded descent in between and nothing to clip through the land.

Two things have to be true at once, which is why this is baked rather than
blurred in the shader:

  * Zero for a margin around every coast. The water sphere's vertices are about
    1.25 degrees apart, so the field stays hard zero across that margin. That is
    what guarantees the shell interpolates below the land lift instead of poking
    through it.
  * Both the margin and the descent scaled to how much land is actually there. A
    continent should push the dome down over a wide, gentle ramp; a lone island
    in a basin should only dimple it, not punch a crater ten degrees wide. Both
    are therefore driven by how much land sits within LANDINESS_SIGMA — near zero
    for Hawaii, near one for the coast of Africa.

Output: 8-bit grey PNG in the same equirectangular frame as earth-mask.png.
"""

import sys

import numpy as np
from PIL import Image

MASK = sys.argv[1]
OUT = sys.argv[2]
W, H = 1024, 512
DEAD = (1.5, 3.5)  # degrees of hard zero around a lone island / a continent
RAMP = (2.0, 20.0)  # further degrees of rise, same two cases
LANDINESS_SIGMA = 12.0  # degrees — the scale that tells an island from a continent
SMOOTH = 1.0  # degrees of final rounding


def land_mask():
    m = np.asarray(Image.open(MASK).convert("L").resize((W, H), Image.LANCZOS))
    return m < 128  # the source map draws the sea bright and the land dark


def distance_to_land(land):
    """Great-circle distance to the nearest land, in degrees, by relaxation.

    Longitude steps shrink toward the poles, so each row carries its own cost.
    """
    lat = (0.5 - (np.arange(H) + 0.5) / H) * 180.0
    dx = (360.0 / W) * np.cos(np.radians(lat))[:, None]  # per-row longitude cost
    dy = np.full((H, 1), 180.0 / H)
    dd = np.sqrt(dx**2 + dy**2)  # diagonal
    d = np.where(land, 0.0, np.inf)
    reach = DEAD[1] + RAMP[1]
    for _ in range(int(reach / (180.0 / H)) + 8):
        prev = d
        for shift in (1, -1):
            d = np.minimum(d, np.roll(d, shift, axis=1) + dx)  # longitude wraps
            d = np.minimum(d, np.roll(d, shift, axis=0) + dy)
            for s2 in (1, -1):
                d = np.minimum(d, np.roll(np.roll(d, shift, 0), s2, 1) + dd)
        if np.array_equal(np.minimum(d, reach), np.minimum(prev, reach)):
            break
    return np.minimum(d, reach * 2)


def gaussian(a, sigma_deg):
    """Separable Gaussian in degrees; longitude wraps, latitude clamps."""
    out = a.astype(np.float64)
    for axis, deg_per_cell in ((1, 360.0 / W), (0, 180.0 / H)):
        sigma = sigma_deg / deg_per_cell
        rad = int(np.ceil(3 * sigma))
        k = np.exp(-0.5 * (np.arange(-rad, rad + 1) / sigma) ** 2)
        k /= k.sum()
        if axis == 1:
            out = sum(w * np.roll(out, d, 1) for d, w in zip(range(-rad, rad + 1), k))
        else:
            pad = np.vstack([np.repeat(out[:1], rad, 0), out, np.repeat(out[-1:], rad, 0)])
            out = sum(w * pad[rad + d : rad + d + H] for d, w in zip(range(-rad, rad + 1), k))
    return out


land = land_mask()
print(f"land cells: {land.mean() * 100:.1f}%")

d = distance_to_land(land)
landiness = np.clip(gaussian(land.astype(np.float64), LANDINESS_SIGMA) / 0.5, 0, 1)
dead = DEAD[0] + (DEAD[1] - DEAD[0]) * landiness
reach = dead + RAMP[0] + (RAMP[1] - RAMP[0]) * landiness
t = np.clip((d - dead) / np.maximum(reach - dead, 1e-6), 0, 1)
open_sea = t * t * (3 - 2 * t)  # smoothstep: flat where it leaves the coast and where it tops out

# Rounding the field softens the ramp but also bleeds a little of it back over
# the shore, so the dead zone is reasserted afterwards and faded in over one
# smoothing width — the result is still round, and still exactly zero on land.
open_sea = gaussian(open_sea, SMOOTH)
open_sea *= np.clip((d - dead) / SMOOTH, 0, 1)

print(f"max openness on land:          {open_sea[land].max():.4f}")
print(f"max openness inside dead zone: {open_sea[d <= dead].max():.4f}")
print(f"openness in open basins:       {np.percentile(open_sea[d > 25], 50):.3f} median")
Image.fromarray((np.clip(open_sea, 0, 1) * 255 + 0.5).astype(np.uint8), mode="L").save(
    OUT, optimize=True
)
print(f"wrote {OUT} {W}x{H}")
