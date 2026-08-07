"""Generate one house-style illustration via Recraft, palette-lock + grain it.

Usage:
    python3 recraft_gen.py "<prompt>" <out.png> [--seed 20260807]

Reads the bearer token from ~/work/.recraft_token (written by the sra-branding
skill). House style is the PRIMARY sticker style, registered on recraftv3.
Always b64_json (the CDN url is blocked in-sandbox) + no_text.
"""
from __future__ import annotations
import base64
import json
import os
import ssl
import sys
import time
import urllib.request

try:
    import certifi
    SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:  # noqa
    SSL_CTX = ssl.create_default_context()

from PIL import Image
from io import BytesIO
from brandkit import quantize_to_inks, add_grain

STYLE_ID = "a1309a2a-d4bc-4f93-a523-f735d0c2c178"  # PRIMARY house sticker style (recraftv3)
ENDPOINT = "https://external.api.recraft.ai/v1/images/generations"
TOKEN_PATH = os.path.expanduser("~/work/.recraft_token")

# Spot art: a single subject isolated on off-white (stickers, icons).
SPOT_SUFFIX = (
    " bold solid shapes, clean sharp edges, thick black outlines, isolated on a plain "
    "off-white background, only warm terracotta red, black and off-white, no text, no letters, "
    "no numbers, no frame, no border, no card, no rectangle"
)
# Banner art: a full-bleed scene that fills the whole frame edge to edge — NOT a
# centered badge on cream. The surf-check card's top half uses this.
BANNER_SUFFIX = (
    " full bleed flat vector artwork filling the entire frame edge to edge, bold solid shapes, "
    "thick black outlines, only warm terracotta red, black and off-white, the artwork reaches "
    "every edge, no text, no letters, no numbers, no frame, no border, no card, no rectangle, "
    "no circle, no ring, no badge, no vignette, not centered on empty background"
)
SUFFIX = {"spot": SPOT_SUFFIX, "banner": BANNER_SUFFIX}


def generate(prompt: str, out: str, seed: int = 20260807,
             mode: str = "spot", size: str = "1024x1024", grain: bool = True) -> None:
    token = open(TOKEN_PATH).read().strip()
    body = json.dumps({
        "prompt": prompt + SUFFIX[mode],
        "style_id": STYLE_ID,
        "model": "recraftv3",
        "size": size,
        "response_format": "b64_json",
        "random_seed": seed,
        "controls": {
            "no_text": True,
            "colors": [{"rgb": [192, 68, 25]}, {"rgb": [26, 26, 26]}, {"rgb": [250, 250, 248]}],
        },
    }).encode()

    last = None
    for attempt in range(4):
        req = urllib.request.Request(
            ENDPOINT, data=body,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=120, context=SSL_CTX) as r:
                data = json.loads(r.read())
            b64 = data["data"][0]["b64_json"]
            img = Image.open(BytesIO(base64.b64decode(b64))).convert("RGB")
            img = quantize_to_inks(img)
            if grain:
                img = add_grain(img, seed=seed)
            img.save(out)
            print(f"OK  {out}  {img.size}")
            return
        except urllib.error.HTTPError as e:
            last = e.read().decode(errors="replace")
            if "not_enough_credits" in last:
                sys.exit("RECRAFT_OUT_OF_CREDITS: top up at recraft.ai — balance is dry.")
            if "rate_limit" in last and attempt < 3:
                time.sleep(22)
                continue
            sys.exit(f"Recraft HTTPError: {last}")
        except Exception as e:  # noqa
            last = str(e)
            time.sleep(5)
    sys.exit(f"Recraft failed after retries: {last}")


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("prompt")
    ap.add_argument("out")
    ap.add_argument("--seed", type=int, default=20260807)
    ap.add_argument("--mode", choices=["spot", "banner"], default="spot")
    ap.add_argument("--size", default=None, help="WxH; defaults per mode")
    ap.add_argument("--nograin", action="store_true", help="flat fills, no wax speckle")
    a = ap.parse_args()
    size = a.size or ("1820x1024" if a.mode == "banner" else "1024x1024")
    generate(a.prompt, a.out, a.seed, a.mode, size, grain=not a.nograin)
