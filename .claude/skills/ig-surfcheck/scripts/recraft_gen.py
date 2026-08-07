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

BASE_SUFFIX = (
    " bold solid shapes, clean sharp edges, thick black outlines, isolated on a plain "
    "off-white background, only warm terracotta red, black and off-white, no text, no letters, "
    "no numbers, no frame, no border, no card, no rectangle"
)


def generate(prompt: str, out: str, seed: int = 20260807) -> None:
    token = open(TOKEN_PATH).read().strip()
    body = json.dumps({
        "prompt": prompt + BASE_SUFFIX,
        "style_id": STYLE_ID,
        "model": "recraftv3",
        "size": "1024x1024",
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
    args = sys.argv[1:]
    seed = 20260807
    if "--seed" in args:
        i = args.index("--seed")
        seed = int(args[i + 1])
        del args[i:i + 2]
    generate(args[0], args[1], seed)
