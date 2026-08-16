"""
Turn the Earth.stl relief globe into an equirectangular relief map for the
/tides scene.

Usage:  python3 tools/make-earth-relief.py Earth.stl apps/web/public/tides/earth-relief.png
Needs numpy and pillow. Earth.stl is not in the repo — it is the ~200MB source
model; keep it wherever you keep it and point this at it.

The STL is a ~4M-triangle globe (radius ~5.08, relief exaggerated about 12x).
Its Z axis is the spin axis and its longitude already lines up with the
earth-mask.png the scene ships, so the projection drops straight in: sampled
coastlines land on the reference coastlines with no shift.

WHAT THIS DATA IS, AND IS NOT. The coastlines and the sea floor are the real
thing — the mid-ocean ridges, the trenches and the shelves are all where they
belong. On land the height is NOT elevation: it tracks the brightness of the
imagery the model was built from. Bright ground rides high (the Sahara, central
Australia, the Taklamakan, the ice sheets) and dark ground sits low (the Amazon
and Congo basins, the Nile valley). Central Australia comes out higher than
Tibet, and the Himalaya reads as a dip. Measured over known ground, bright
places average +0.018 and dark places +0.001 — a spread as wide as the whole
land range. So the scene uses this for surface texture and for land cover, and
never as a claim about how high anything is. Swapping in a real DEM (ETOPO,
GEBCO) means replacing this file with the same encoding; no shader changes.

Splatting bare vertices leaves stipple holes wherever the mesh is decimated
(flat deserts, ice sheets, abyssal plains), so each triangle is subdivided
until its samples are about a cell apart before being splatted.

The mesh also carries its own artifact: flat regions are tiled with a regular
~5-cell lattice of shallow dimples. That survives any sampling scheme, so it is
low-passed away before the map is written down to OUT_W x OUT_H.

Output: 8-bit grey PNG, sea level at exactly 0.5, full scale +/- SPAN/2 in globe
radii. The shader reads it back as:  relief = (tex.r - 0.5) * SPAN
"""

import sys

import numpy as np
from PIL import Image

STL = sys.argv[1]
OUT = sys.argv[2]
W, H = 2048, 1024  # sampling grid
OUT_W, OUT_H = 1024, 512  # shipped map (well past what the geometry resolves)
SEA = 5.114  # sea-level radius, fitted against earth-mask.png coastlines
SPAN = 0.08  # full encoded range, in globe radii
MAX_LEVEL = 6  # cap on subdivision (2^6 = 64 samples along an edge)
SIGMA = 2.2  # low-pass, in sampling cells — kills the mesh's dimple lattice


def load_triangles(path):
    raw = np.fromfile(path, dtype=np.uint8, offset=84)
    n = len(raw) // 50
    rec = raw[: n * 50].reshape(n, 50)
    t = np.ascontiguousarray(rec[:, 12:48]).view(np.float32).reshape(n, 3, 3)
    t = t.astype(np.float32)
    lo, hi = t.reshape(-1, 3).min(0), t.reshape(-1, 3).max(0)
    return t - (lo + hi) / 2  # recentre


def bary(level):
    """Barycentric weights for a triangle subdivided `level` times per edge."""
    k = 1 << level
    i, j = np.meshgrid(np.arange(k + 1), np.arange(k + 1), indexing="ij")
    keep = (i + j) <= k
    a, b = i[keep] / k, j[keep] / k
    return np.stack([1 - a - b, a, b], 1).astype(np.float32)


def splat(pts, tot, cnt):
    """Accumulate sample radii into the equirectangular grid."""
    r = np.linalg.norm(pts, axis=1)
    lat = np.arcsin(np.clip(pts[:, 2] / r, -1, 1))  # Z is the spin axis
    lon = np.arctan2(pts[:, 1], pts[:, 0])
    x = ((lon / (2 * np.pi) + 0.5) * W).astype(np.int64) % W
    y = ((0.5 - lat / np.pi) * H).astype(np.int64).clip(0, H - 1)
    idx = y * W + x
    tot += np.bincount(idx, weights=r.astype(np.float64), minlength=W * H)
    cnt += np.bincount(idx, minlength=W * H)


def cell_span(tri):
    """Longest triangle edge measured in grid cells (worst case: at its latitude)."""
    r = np.linalg.norm(tri, axis=2).mean(1)
    lat = np.arcsin(np.clip(tri[:, :, 2] / np.linalg.norm(tri, axis=2), -1, 1)).mean(1)
    # cells per unit of arc: latitude is uniform, longitude compresses toward the poles
    per_arc = max(W / (2 * np.pi), H / np.pi) / np.maximum(np.cos(lat), 1e-3)
    edges = np.stack(
        [
            np.linalg.norm(tri[:, 1] - tri[:, 0], axis=1),
            np.linalg.norm(tri[:, 2] - tri[:, 1], axis=1),
            np.linalg.norm(tri[:, 0] - tri[:, 2], axis=1),
        ],
        1,
    ).max(1)
    return edges / r * per_arc  # arc angle * cells per radian


def fill_holes(grid, valid):
    """Patch any cell still empty from progressively blurred neighbours."""
    out = np.where(valid, grid, np.nan)
    while np.isnan(out).any():
        n = np.nan_to_num(out)
        w = (~np.isnan(out)).astype(np.float64)
        for axis, roll in ((1, 1), (1, -1), (0, 1), (0, -1)):
            n = n + np.roll(np.nan_to_num(out), roll, axis)
            w = w + np.roll((~np.isnan(out)).astype(np.float64), roll, axis)
        out = np.where(np.isnan(out) & (w > 0), n / np.maximum(w, 1), out)
    return out


def gaussian(a, sigma):
    """Separable Gaussian; longitude wraps, latitude clamps at the poles."""
    rad = int(np.ceil(3 * sigma))
    k = np.exp(-0.5 * (np.arange(-rad, rad + 1) / sigma) ** 2)
    k /= k.sum()
    out = sum(w * np.roll(a, d, axis=1) for d, w in zip(range(-rad, rad + 1), k))
    pad = np.vstack([np.repeat(out[:1], rad, 0), out, np.repeat(out[-1:], rad, 0)])
    return sum(w * pad[rad + d : rad + d + a.shape[0]] for d, w in zip(range(-rad, rad + 1), k))


def downsample(a, w, h):
    """Area-average down to the shipped size."""
    fy, fx = a.shape[0] // h, a.shape[1] // w
    return a.reshape(h, fy, w, fx).mean(axis=(1, 3))


tri = load_triangles(STL)
print(f"triangles: {len(tri):,}")

tot = np.zeros(W * H)
cnt = np.zeros(W * H, dtype=np.int64)
span = cell_span(tri)
level = np.clip(np.ceil(np.log2(np.maximum(span, 1))), 0, MAX_LEVEL).astype(int)

for lv in range(MAX_LEVEL + 1):
    sel = tri[level == lv]
    if not len(sel):
        continue
    wts = bary(lv)
    print(f"  level {lv}: {len(sel):>9,} triangles x {len(wts):>4} samples")
    for chunk in np.array_split(sel, max(1, len(sel) * len(wts) // 4_000_000)):
        splat(np.einsum("sb,tbc->tsc", wts, chunk).reshape(-1, 3), tot, cnt)

grid = np.divide(tot, np.maximum(cnt, 1)).reshape(H, W)
valid = cnt.reshape(H, W) > 0
print(f"cells with no sample: {(~valid).sum():,} / {W * H:,}")
grid = downsample(gaussian(fill_holes(grid, valid), SIGMA), OUT_W, OUT_H)

e = (grid - SEA) / SEA
print(f"relief range: {e.min():+.5f} .. {e.max():+.5f} (globe radii)")
g = np.clip(e / SPAN + 0.5, 0, 1)
Image.fromarray((g * 255 + 0.5).astype(np.uint8), mode="L").save(OUT, optimize=True)
print(f"wrote {OUT} {OUT_W}x{OUT_H}, land = {(e > 0).mean() * 100:.1f}% of cells")
