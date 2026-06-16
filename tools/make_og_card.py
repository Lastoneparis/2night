#!/usr/bin/env python3
"""
Render the 2NIGHT social share card -> website/assets/og-card.png (1200x630).

True-black (#0D0D0D) background, gold (#FFD700) "2NIGHT" wordmark, with the
tagline "Who's out tonight?" beneath. Pure Pillow, no network. Idempotent.

Run:  python3 tools/make_og_card.py
"""
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
BG = (13, 13, 13)          # #0D0D0D true black
GOLD = (255, 215, 0)       # #FFD700
SILVER = (197, 197, 200)   # subtle silver for tagline

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "assets", "og-card.png"))


def load_font(candidates, size):
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


BOLD = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]
REG = [
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]


def text_size(draw, text, font):
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0], box[3] - box[1], box[0], box[1]


def main():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Soft radial gold glow behind the wordmark (subtle, on-brand).
    glow = Image.new("L", (W, H), 0)
    gd = ImageDraw.Draw(glow)
    cx, cy = W // 2, int(H * 0.44)
    for r, a in ((300, 10), (210, 14), (130, 18), (70, 22)):
        gd.ellipse((cx - r, cy - int(r * 0.62), cx + r, cy + int(r * 0.62)), fill=a)
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    glow_layer = Image.new("RGB", (W, H), GOLD)
    img.paste(glow_layer, (0, 0), glow)
    draw = ImageDraw.Draw(img)

    # Wordmark
    word = "2NIGHT"
    wf = load_font(BOLD, 168)
    ww, wh, wox, woy = text_size(draw, word, wf)
    wx = (W - ww) // 2 - wox
    wy = int(H * 0.30) - woy
    # letter-spacing-ish: draw normally (Arial Bold is already strong)
    draw.text((wx, wy), word, font=wf, fill=GOLD)

    # Hairline rule under wordmark
    rule_y = wy + wh + 44
    rule_w = 150
    draw.line((cx - rule_w, rule_y, cx + rule_w, rule_y), fill=(70, 60, 20), width=2)

    # Tagline
    tag = "Who's out tonight?"
    tf = load_font(REG, 50)
    tw, th, tox, toy = text_size(draw, tag, tf)
    tx = (W - tw) // 2 - tox
    ty = rule_y + 34 - toy
    draw.text((tx, ty), tag, font=tf, fill=SILVER)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print("wrote", OUT, img.size)


if __name__ == "__main__":
    main()
