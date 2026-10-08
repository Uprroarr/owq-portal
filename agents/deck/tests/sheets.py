"""comparison sheets from the captures in shots/:  compare_desktop.png (BASE | A | B | C, owner desktop, top 2200px at 60%),
compare_phone.png (four phone captures side by side, top 2700px), compare_hero.png (the four 2x hero crops in a 2x2 grid at 50%)."""
import os
from PIL import Image, ImageDraw, ImageFont
SH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'shots')
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
NAMES = [('base', 'BASE', 'today'), ('a', 'A', 'REACTOR HUD'), ('b', 'B', 'MISSION CONTROL'), ('c', 'C', 'CINEMATIC HERO')]
BG = (11, 11, 16); RED = (255, 31, 79); GOLD = (255, 207, 64)


def label(im, big, small, pad):
    d = ImageDraw.Draw(im)
    f1 = ImageFont.truetype(F, 46); f2 = ImageFont.truetype(F, 22)
    d.rectangle([pad, 18, pad + 86, 82], fill=RED if big != 'BASE' else (60, 60, 72))
    w = d.textlength(big, font=f1 if big != 'BASE' else f2)
    d.text((pad + 43 - w / 2, 22 if big != 'BASE' else 38), big, font=f1 if big != 'BASE' else f2, fill=(255, 255, 255))
    d.text((pad + 104, 38), small, font=f2, fill=GOLD if big != 'BASE' else (170, 170, 184))


def sheet(kind, files, scale, crop_h, gap, out, cols=4):
    ims = []
    for key, big, small in NAMES:
        p = os.path.join(SH, files % key)
        im = Image.open(p).convert('RGB')
        im = im.crop((0, 0, im.width, min(im.height, crop_h)))
        if scale != 1: im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
        ims.append((im, big, small))
    rows = (len(ims) + cols - 1) // cols
    cw = max(i[0].width for i in ims); ch = max(i[0].height for i in ims)
    W = cols * cw + (cols + 1) * gap; H = rows * (ch + 100) + gap
    S = Image.new('RGB', (W, H), BG)
    for n, (im, big, small) in enumerate(ims):
        x = gap + (n % cols) * (cw + gap); y = (n // cols) * (ch + 100)
        lab = Image.new('RGB', (cw, 100), BG); label(lab, big, small, 0); S.paste(lab, (x, y))
        S.paste(im, (x, y + 100))
        ImageDraw.Draw(S).rectangle([x - 1, y + 99, x + im.width, y + 100 + im.height], outline=(43, 43, 54))
    S = S.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    S.save(os.path.join(SH, out), optimize=True)
    print(out, S.size, os.path.getsize(os.path.join(SH, out)) // 1024, 'KB')


sheet('desktop', '%s_owner_desktop.png', .6, 2300, 28, 'compare_desktop.png')
sheet('phone', '%s_phone.png', 1, 2700, 28, 'compare_phone.png')
sheet('hero', '%s_hero2x.png', .5, 1800, 28, 'compare_hero.png', cols=2)

# keep every capture <= 2 MB (palette PNG for the few large ones)
for f in os.listdir(SH):
    p = os.path.join(SH, f)
    if f.endswith('.png') and not f.startswith('compare_') and os.path.getsize(p) > 1900000:
        Image.open(p).convert('RGB').quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).save(p, optimize=True)
        print('palettized', f, os.path.getsize(p) // 1024, 'KB')
