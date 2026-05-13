"""
McDonald's Logo Animation - 10 seconds, 1920x1080, 60fps
Dynamic jingle animation with bouncing arches, golden shine, sparkles.
"""

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import cv2
import math
import os
import random

WIDTH, HEIGHT = 1920, 1080
FPS = 60
DURATION = 10
TOTAL_FRAMES = FPS * DURATION
OUTPUT = "/home/user/EMO/mcdonalds_animation.mp4"

MC_RED = (219, 37, 25)
MC_GOLD = (255, 188, 10)
MC_GOLD_BRIGHT = (255, 230, 80)
DEEP_RED = (100, 8, 4)


# ── Easing functions ──────────────────────────────────────────────────────────

def ease_out_back(t, s=1.70158):
    t = max(0.0, min(1.0, t))
    t -= 1
    return t * t * ((s + 1) * t + s) + 1

def ease_out_bounce(t):
    t = max(0.0, min(1.0, t))
    if t < 1 / 2.75:
        return 7.5625 * t * t
    elif t < 2 / 2.75:
        t -= 1.5 / 2.75
        return 7.5625 * t * t + 0.75
    elif t < 2.5 / 2.75:
        t -= 2.25 / 2.75
        return 7.5625 * t * t + 0.9375
    else:
        t -= 2.625 / 2.75
        return 7.5625 * t * t + 0.984375

def ease_in_out(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)

def lerp(a, b, t):
    return a + (b - a) * max(0.0, min(1.0, t))


# ── Drawing helpers ───────────────────────────────────────────────────────────

def draw_arch(draw, cx, base_y, height, width, thickness, color):
    """Draw one arch (thick inverted-U) as a filled polygon."""
    outer_rx = width / 2
    outer_ry = height
    inner_rx = max(1, outer_rx - thickness)
    inner_ry = max(1, outer_ry - thickness)

    n = 240
    points = []

    # Outer arc: left → top → right  (angle π → 0)
    for i in range(n + 1):
        angle = math.pi * (1 - i / n)
        px = cx + outer_rx * math.cos(angle)
        py = base_y - outer_ry * math.sin(angle)
        points.append((px, py))

    # Inner arc: right → top → left  (angle 0 → π)
    for i in range(n + 1):
        angle = math.pi * i / n
        px = cx + inner_rx * math.cos(angle)
        py = base_y - inner_ry * math.sin(angle)
        points.append((px, py))

    if len(points) >= 3:
        draw.polygon(points, fill=color)


def draw_logo_layer(size_px, scale=1.0, gold_mult=1.0,
                    left_sy=1.0, right_sy=1.0, alpha=255):
    """Return an RGBA PIL image containing just the logo."""
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    s = size_px * scale
    cx, cy = WIDTH // 2, HEIGHT // 2

    margin = s * 0.045
    x0, y0 = cx - s / 2 + margin, cy - s / 2 + margin
    x1, y1 = cx + s / 2 - margin, cy + s / 2 - margin
    radius = (s - 2 * margin) * 0.09

    red_c = (*MC_RED, alpha)
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=red_c)

    inner = s - 2 * margin
    base_y = cy + inner * 0.14
    arch_h = inner * 0.52
    arch_w = inner * 0.37
    arch_t = inner * 0.095

    left_cx  = cx - inner * 0.175
    right_cx = cx + inner * 0.175

    gr = min(255, int(MC_GOLD[0] * gold_mult))
    gg = min(255, int(MC_GOLD[1] * gold_mult))
    gb = min(255, int(MC_GOLD[2] * gold_mult))
    gold_c = (gr, gg, gb, alpha)

    draw_arch(draw, left_cx,  base_y, arch_h * left_sy,  arch_w, arch_t, gold_c)
    draw_arch(draw, right_cx, base_y, arch_h * right_sy, arch_w, arch_t, gold_c)

    # ® symbol
    reg_r   = inner * 0.030
    reg_cx  = cx + inner * 0.395
    reg_cy  = cy + inner * 0.295
    ring_w  = max(2, int(reg_r * 0.28))
    draw.ellipse(
        [reg_cx - reg_r, reg_cy - reg_r, reg_cx + reg_r, reg_cy + reg_r],
        outline=gold_c, width=ring_w
    )
    font_size = max(8, int(reg_r * 1.1))
    draw.text(
        (reg_cx - font_size * 0.28, reg_cy - font_size * 0.5),
        "R", fill=gold_c
    )

    return img


def add_glow(logo_img, blur_r=25, intensity=0.6):
    """Return a golden-tinted blurred glow overlay for the logo."""
    blurred = logo_img.filter(ImageFilter.GaussianBlur(radius=blur_r))
    arr = np.array(blurred, dtype=np.float32)
    # Tint: boost red/green, suppress blue → golden halo
    arr[:, :, 0] = np.clip(arr[:, :, 0] * 1.2, 0, 255)
    arr[:, :, 1] = np.clip(arr[:, :, 1] * 0.85, 0, 255)
    arr[:, :, 2] = np.clip(arr[:, :, 2] * 0.05, 0, 255)
    arr[:, :, 3] = np.clip(arr[:, :, 3] * intensity, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def add_shine_sweep(frame_img, cx, cy, logo_size, progress, logo_alpha=255):
    """Diagonal shine beam sweeping across the logo."""
    shine = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shine)

    sweep_range = logo_size * 1.3
    sx = int(cx - logo_size * 0.65 + sweep_range * progress)
    beam_w = int(logo_size * 0.12)
    peak_a = int(200 * math.sin(min(1.0, progress) * math.pi))

    for i in range(beam_w):
        t = abs(i - beam_w // 2) / (beam_w // 2)
        a = int(peak_a * (1 - t ** 1.5))
        if a > 0:
            x = sx + i - beam_w // 2
            sd.line(
                [(x - logo_size // 2, cy - logo_size),
                 (x + logo_size // 2, cy + logo_size)],
                fill=(255, 250, 200, a)
            )

    frame_img = Image.alpha_composite(frame_img, shine)
    return frame_img


def add_sparkles(frame_img, cx, cy, logo_size, rng, n=28, fade=1.0):
    """Golden sparkle particles around the arches."""
    sp = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sp)
    inner = logo_size * 0.85
    for _ in range(n):
        px = int(rng.uniform(cx - inner * 0.38, cx + inner * 0.38))
        py = int(rng.uniform(cy - inner * 0.38, cy + inner * 0.1))
        r  = rng.randint(2, 9)
        br = rng.random()
        a  = int(220 * br * fade)
        if a > 10:
            sd.ellipse([px - r, py - r, px + r, py + r],
                       fill=(255, 230, 60, a))
        # Cross flare
        if br > 0.6 and a > 60:
            arm = r * 2
            aa = a // 2
            sd.line([(px - arm, py), (px + arm, py)], fill=(255, 245, 150, aa), width=1)
            sd.line([(px, py - arm), (px, py + arm)], fill=(255, 245, 150, aa), width=1)
    frame_img = Image.alpha_composite(frame_img, sp)
    return frame_img


def add_radial_rays(frame_img, cx, cy, n_rays=16, intensity=0.4, logo_size=900):
    """Subtle golden light rays emanating from center."""
    ray_img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ray_img)
    max_r = logo_size * 0.65
    for i in range(n_rays):
        angle = 2 * math.pi * i / n_rays
        a = int(80 * intensity)
        ex = int(cx + max_r * math.cos(angle))
        ey = int(cy + max_r * math.sin(angle))
        rd.line([(cx, cy), (ex, ey)], fill=(255, 220, 50, a), width=3)

    blurred = ray_img.filter(ImageFilter.GaussianBlur(radius=12))
    frame_img = Image.alpha_composite(frame_img, blurred)
    return frame_img


# ── Per-frame composition ─────────────────────────────────────────────────────

def create_frame(frame_num):
    t_sec = frame_num / FPS
    rng = random.Random(frame_num * 7919)

    cx, cy = WIDTH // 2, HEIGHT // 2
    logo_size = HEIGHT * 0.88

    # ── Background gradient (deep red → mc red) ──────────────────────────────
    bg_t = min(1.0, t_sec / 0.6)
    bg_r = int(lerp(DEEP_RED[0], MC_RED[0], bg_t))
    bg_g = int(lerp(DEEP_RED[1], MC_RED[1], bg_t))
    bg_b = int(lerp(DEEP_RED[2], MC_RED[2], bg_t))
    bg = Image.new("RGBA", (WIDTH, HEIGHT), (bg_r, bg_g, bg_b, 255))

    # ── Compute per-frame parameters ─────────────────────────────────────────
    scale       = 1.0
    alpha       = 255
    left_sy     = 1.0
    right_sy    = 1.0
    gold_mult   = 1.0
    glow_int    = 0.0
    ray_int     = 0.0
    shine_prog  = None
    spark_fade  = 0.0

    # Phase 1 – zoom burst in  (0.0 – 1.2 s)
    if t_sec < 1.2:
        p = t_sec / 1.2
        scale = ease_out_back(p)
        alpha = min(255, int(255 * p * 4))

    # Phase 2 – arch bounce  (1.2 – 4.0 s)
    if 1.2 <= t_sec < 4.0:
        bt = (t_sec - 1.2) / 2.8

        # Left arch squash-stretch (0–35% of phase)
        if bt < 0.35:
            lp = bt / 0.35
            left_sy = 1.0 + 0.35 * math.sin(lp * math.pi * 2.5) * (1 - lp)

        # Right arch squash-stretch (25–60% of phase)
        if 0.25 <= bt < 0.60:
            rp = (bt - 0.25) / 0.35
            right_sy = 1.0 + 0.35 * math.sin(rp * math.pi * 2.5) * (1 - rp)

        # Both together  (60–100%)
        if bt >= 0.60:
            bp = (bt - 0.60) / 0.40
            both = 0.18 * math.sin(bp * math.pi * 4) * (1 - bp)
            left_sy  = 1.0 + both
            right_sy = 1.0 + both

        glow_int = 0.15

    # Phase 3 – diagonal shine sweep  (4.0 – 6.2 s)
    if 4.0 <= t_sec < 6.2:
        sp = (t_sec - 4.0) / 2.2
        shine_prog = sp
        gold_mult  = 1.0 + 0.6 * math.sin(sp * math.pi)
        glow_int   = 0.35 + 0.25 * math.sin(sp * math.pi)

    # Phase 4 – sparkle & pulse  (6.2 – 8.5 s)
    if 6.2 <= t_sec < 8.5:
        pt = (t_sec - 6.2) / 2.3
        gold_mult  = 1.0 + 0.45 * abs(math.sin(pt * math.pi * 5))
        scale      = 1.0 + 0.018 * abs(math.sin(pt * math.pi * 4))
        glow_int   = 0.5 + 0.3 * abs(math.sin(pt * math.pi * 3))
        spark_fade = 1.0 - pt
        ray_int    = 0.4 * abs(math.sin(pt * math.pi * 3))

    # Phase 5 – radiant hold  (8.5 – 10.0 s)
    if t_sec >= 8.5:
        ht = (t_sec - 8.5) / 1.5
        gold_mult = 1.0 + 0.18 * math.sin(ht * math.pi * 2)
        glow_int  = 0.55 + 0.15 * math.sin(ht * math.pi * 2)
        ray_int   = 0.35 + 0.15 * math.sin(ht * math.pi * 1.5)

    # ── Render logo ───────────────────────────────────────────────────────────
    logo = draw_logo_layer(logo_size, scale, gold_mult, left_sy, right_sy, alpha)

    # Glow halo
    if glow_int > 0:
        glow = add_glow(logo, blur_r=int(30 * glow_int + 8), intensity=glow_int)
        bg = Image.alpha_composite(bg, glow)

    # Radial rays
    if ray_int > 0.01:
        bg = add_radial_rays(bg, cx, cy, n_rays=20,
                             intensity=ray_int, logo_size=logo_size * scale)

    # Shine sweep
    if shine_prog is not None:
        bg = add_shine_sweep(bg, cx, cy, logo_size * scale, shine_prog)

    # Sparkles
    if spark_fade > 0.02:
        bg = add_sparkles(bg, cx, cy, logo_size, rng,
                          n=30, fade=spark_fade)

    # Composite logo on top
    bg = Image.alpha_composite(bg, logo)

    # Vignette
    vign = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    vd   = ImageDraw.Draw(vign)
    for r in range(20):
        a = int(100 * (r / 20) ** 2)
        pad = r * 3
        vd.rectangle([pad, pad, WIDTH - pad, HEIGHT - pad],
                     outline=(0, 0, 0, a), width=4)
    bg = Image.alpha_composite(bg, vign)

    return np.array(bg.convert("RGB"))


# ── Encode video ──────────────────────────────────────────────────────────────

def main():
    os.makedirs(os.path.dirname(OUTPUT) if os.path.dirname(OUTPUT) else ".", exist_ok=True)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out    = cv2.VideoWriter(OUTPUT, fourcc, FPS, (WIDTH, HEIGHT))

    for frame_num in range(TOTAL_FRAMES):
        if frame_num % 60 == 0:
            print(f"  {frame_num:4d}/{TOTAL_FRAMES}  ({frame_num*100//TOTAL_FRAMES}%)")
        frame     = create_frame(frame_num)
        frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        out.write(frame_bgr)

    out.release()
    print(f"\nDone → {OUTPUT}")


if __name__ == "__main__":
    main()
