"""
High-Fidelity Procedural Art Synthesis for Spark Panic: Planetary Invasion Defense
Batch 2 Asset 09 (sector-3-banner.jpg) & Asset 10 (sector-4-banner.jpg)
Cohesive Neon Synthwave / Geometry Wars / Prismatic Indie Art Direction
"""

import math
import numpy as np
import os
import shutil
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

# -------------------------------------------------------------------------
# Utility Helpers
# -------------------------------------------------------------------------

def create_octave_noise(width, height, seed, octaves):
    """Generate fractal noise via bicubic upsampling of random Gaussian grids."""
    rng = np.random.RandomState(seed)
    accum = np.zeros((height, width), dtype=np.float32)
    total_w = 0.0
    for gw, gh, weight in octaves:
        grid = rng.randn(gh, gw).astype(np.float32)
        up = np.array(Image.fromarray(grid).resize((width, height), resample=Image.Resampling.BICUBIC))
        accum += up * weight
        total_w += weight
    return accum / (total_w or 1.0)

def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)

def draw_diffraction_flare(draw, cx, cy, radius, color, spikes=4, angle_offset=0, width=2):
    """Draw a brilliant multi-point diffraction spike flare with center glow."""
    r_core = max(2, radius // 6)
    draw.ellipse([cx - r_core, cy - r_core, cx + r_core, cy + r_core], fill=(255, 255, 255, 255))
    for i in range(spikes):
        ang = angle_offset + i * (math.pi / (spikes / 2))
        dx = math.cos(ang)
        dy = math.sin(ang)
        p1 = (cx - dx * radius, cy - dy * radius)
        p2 = (cx + dx * radius, cy + dy * radius)
        draw.line([p1, p2], fill=color, width=width)
        p1_in = (cx - dx * (radius * 0.45), cy - dy * (radius * 0.45))
        p2_in = (cx + dx * (radius * 0.45), cy + dy * (radius * 0.45))
        draw.line([p1_in, p2_in], fill=(255, 255, 255, 240), width=max(1, width - 1))

# -------------------------------------------------------------------------
# Asset 09: Sector 3 Banner (1024 x 572)
# Sector 3: Dark Rift Command Banner (Amber/Gold Relativistic Accretion Storm)
# -------------------------------------------------------------------------

def generate_sector_3_banner(width=1024, height=572, seed=333):
    print(f"Generating sector-3-banner ({width}x{height})...")
    rng = np.random.RandomState(seed)

    # 1. Relativistic Dark Rift Void & Amber Accretion Storm Base
    y_coords, x_coords = np.mgrid[0:height, 0:width]
    
    # Event Horizon singularity location (center-right offset: cx=680, cy=286)
    scx, scy = 660, 286
    dx = (x_coords - scx)
    dy = (y_coords - scy)
    dist_singularity = np.sqrt(dx ** 2 + (dy * 2.1) ** 2) # Elliptical accretion perspective

    # Base Void: Deep black with warm amber dark-matter glow
    base_r = np.clip(12 + 18 * np.exp(-(dist_singularity) / 380.0), 0, 255)
    base_g = np.clip(8 + 12 * np.exp(-(dist_singularity) / 380.0), 0, 255)
    base_b = np.clip(2 + 4 * np.exp(-(dist_singularity) / 380.0), 0, 255)
    rgb = np.stack([base_r, base_g, base_b], axis=-1).astype(np.float32)

    # Domain Warping for Accretion Storm Filaments
    warp_x = create_octave_noise(width, height, seed + 1, [(8, 5, 0.6), (16, 9, 0.3), (32, 18, 0.1)]) * 80.0
    warp_y = create_octave_noise(width, height, seed + 2, [(8, 5, 0.6), (16, 9, 0.3), (32, 18, 0.1)]) * 50.0

    nx = np.clip(x_coords + warp_x, 0, width - 1)
    ny = np.clip(y_coords + warp_y, 0, height - 1)

    # Swirling Relativistic Accretion Disk (Spiral coords)
    angle = np.arctan2(ny - scy, (nx - scx) * 0.8)
    r_accretion = np.sqrt(((nx - scx) * 0.8) ** 2 + ((ny - scy) * 2.0) ** 2)

    # Accretion ring intensity
    ring1 = np.exp(-((r_accretion - 180) ** 2) / (65 ** 2))
    ring2 = np.exp(-((r_accretion - 320) ** 2) / (110 ** 2))
    disk_intensity = ring1 * 1.5 + ring2 * 0.8
    # Relativistic Doppler beaming (left side moving towards observer is brighter)
    doppler_factor = 1.0 + 0.65 * np.cos(angle + math.pi * 0.8)
    disk_intensity *= np.clip(doppler_factor, 0.2, 2.0)

    # Add turbulent fractal texture to disk
    n_storm = create_octave_noise(width, height, seed + 10, [(16, 9, 0.5), (32, 18, 0.3), (64, 36, 0.15), (128, 72, 0.05)])
    disk_final = smoothstep(0.1, 1.2, disk_intensity * (0.8 + 0.5 * n_storm))

    rgb[:, :, 0] += disk_final * 245.0  # R: Rich Amber
    rgb[:, :, 1] += disk_final * 170.0  # G: Solar Gold
    rgb[:, :, 2] += disk_final * 20.0   # B: Minimal Blue

    # Dark Rift Void (Event horizon silhouette shadow in center)
    event_horizon = smoothstep(55, 95, dist_singularity)
    rgb *= event_horizon[:, :, np.newaxis]

    # Convert to PIL Image for rendering stars, rays, and HUD chassis
    base_img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), mode="RGB").convert("RGBA")

    # 2. Relativistic Energy Rays & Starlight Dust
    fx_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(fx_layer)

    # Graviton Accretion Spikes & Plasma Ejection Rays
    for ray_i in range(16):
        ray_ang = ray_i * (2 * math.pi / 16) + 0.15
        dx_r = math.cos(ray_ang) * 550
        dy_r = math.sin(ray_ang) * 260
        ray_alpha = int(rng.uniform(60, 160))
        fdraw.line([(scx, scy), (scx + dx_r, scy + dy_r)], fill=(255, 193, 7, ray_alpha), width=rng.randint(2, 5))

    # Dense Golden Starfield (1,800 micro stars)
    num_stars = 1800
    sx = rng.uniform(0, width, num_stars)
    sy = rng.uniform(0, height, num_stars)
    sb = rng.exponential(0.35, num_stars)
    for i in range(num_stars):
        b = min(1.0, sb[i])
        if b < 0.08: continue
        col = (255, 230, 160) if rng.rand() > 0.3 else (255, 255, 255)
        fdraw.ellipse([sx[i] - b, sy[i] - b, sx[i] + b, sy[i] + b], fill=(col[0], col[1], col[2], int(b * 240)))

    # 8 Major Amber Beacons with flares
    beacons = [
        (150, 90, 36, (255, 215, 0), 4, 0.0),
        (880, 110, 42, (255, 190, 50), 6, 0.2),
        (220, 480, 32, (255, 230, 140), 4, 0.4),
        (940, 470, 38, (255, 200, 30), 4, 0.1),
        (460, 140, 28, (255, 240, 180), 4, 0.3),
        (760, 420, 30, (255, 180, 20), 4, 0.5),
        (100, 340, 26, (255, 210, 80), 4, 0.2),
        (660, 286, 60, (255, 245, 200), 4, 0.0), # Singularity flare
    ]
    for bx, by, frad, fcol, fsp, fang in beacons:
        fdraw.ellipse([bx - frad * 0.5, by - frad * 0.5, bx + frad * 0.5, by + frad * 0.5], fill=(fcol[0], fcol[1], fcol[2], 80))
        draw_diffraction_flare(fdraw, bx, by, frad, (fcol[0], fcol[1], fcol[2], 220), spikes=fsp, angle_offset=fang, width=2)

    # 3. Tactical Command HUD Frame & Vector Chassis (Geometry Wars / Synthwave)
    hud_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(hud_layer)

    # Outer border & angled cut corners
    pad = 22
    corner_cut = 35
    outer_frame = [
        (pad + corner_cut, pad),
        (width - pad - corner_cut, pad),
        (width - pad, pad + corner_cut),
        (width - pad, height - pad - corner_cut),
        (width - pad - corner_cut, height - pad),
        (pad + corner_cut, height - pad),
        (pad, height - pad - corner_cut),
        (pad, pad + corner_cut),
    ]
    hdraw.polygon(outer_frame, outline=(255, 215, 0, 240), width=3)

    # Inner secondary frame
    pad2 = 32
    inner_frame = [
        (pad2 + corner_cut, pad2),
        (width - pad2 - corner_cut, pad2),
        (width - pad2, pad2 + corner_cut),
        (width - pad2, height - pad2 - corner_cut),
        (width - pad2 - corner_cut, height - pad2),
        (pad2 + corner_cut, height - pad2),
        (pad2, height - pad2 - corner_cut),
        (pad2, pad2 + corner_cut),
    ]
    hdraw.polygon(inner_frame, outline=(255, 179, 0, 140), width=1)

    # Tactical Header Bar & Corner Hazard Brackets
    # Top left bracket
    hdraw.line([(pad, pad + 80), (pad, pad + corner_cut), (pad + corner_cut, pad), (pad + 120, pad)], fill=(255, 215, 0, 255), width=5)
    # Bottom right bracket
    hdraw.line([(width - pad - 120, height - pad), (width - pad - corner_cut, height - pad), (width - pad, height - pad - corner_cut), (width - pad, height - pad - 80)], fill=(255, 215, 0, 255), width=5)

    # Sector Designation Badge & Heraldry Panel (Left Side)
    # Background panel for text
    hdraw.polygon([(45, 60), (380, 60), (410, 170), (45, 170)], fill=(15, 10, 2, 200), outline=(255, 215, 0, 220), width=2)
    # Accent hazard chevrons in badge
    for ch_i in range(5):
        cx_ch = 70 + ch_i * 24
        hdraw.line([(cx_ch, 75), (cx_ch + 12, 95)], fill=(255, 193, 7, 240), width=3)

    # Tactical Typography Vector Strokes: "SECTOR 03" & "DARK RIFT"
    # Draw vector line letters for "SECTOR 03"
    def draw_vector_char(draw, ch, x, y, scale=1.0, col=(255, 255, 255, 255), w=3):
        # Clean geometric 5x7 grid vector character strokes
        chars = {
            'S': [(4,1),(1,1),(0,2),(0,3),(1,4),(3,4),(4,5),(4,6),(3,7),(0,7)],
            'E': [(4,1),(0,1),(0,7),(4,7)], # cross at y=4
            'C': [(4,1),(1,1),(0,2),(0,6),(1,7),(4,7)],
            'T': [(0,1),(4,1)], # stem (2,1) to (2,7)
            'O': [(1,1),(3,1),(4,2),(4,6),(3,7),(1,7),(0,6),(0,2),(1,1)],
            'R': [(0,7),(0,1),(3,1),(4,2),(4,3),(3,4),(0,4)], # leg (2,4) to (4,7)
            '0': [(1,1),(3,1),(4,2),(4,6),(3,7),(1,7),(0,6),(0,2),(1,1)],
            '1': [(1,2),(2,1),(2,7)],
            '2': [(0,2),(1,1),(3,1),(4,2),(4,3),(0,7),(4,7)],
            '3': [(0,1),(4,1),(2,3),(3,4),(4,5),(4,6),(3,7),(0,7)],
            '4': [(3,7),(3,1),(0,4),(4,4)],
            'D': [(0,1),(0,7),(2,7),(4,5),(4,3),(2,1),(0,1)],
            'A': [(0,7),(0,3),(2,1),(4,3),(4,7)], # cross (0,5) to (4,5)
            'K': [(0,1),(0,7)], # branches (4,1)-(0,4)-(4,7)
            'I': [(1,1),(3,1)], # stem (2,1)-(2,7), base (1,7)-(3,7)
            'F': [(4,1),(0,1),(0,7)], # mid (0,4)-(3,4)
            'L': [(0,1),(0,7),(4,7)],
            'G': [(4,2),(2,1),(1,1),(0,2),(0,6),(1,7),(3,7),(4,6),(4,4),(2,4)],
            'N': [(0,7),(0,1),(4,7),(4,1)],
        }
        gw = 5.0 * scale
        gh = 8.0 * scale
        if ch in chars:
            pts = [(x + px * scale, y + py * scale) for px, py in chars[ch]]
            draw.line(pts, fill=col, width=w)
        if ch == 'E':
            draw.line([(x, y + 4 * scale), (x + 3 * scale, y + 4 * scale)], fill=col, width=w)
        elif ch == 'T':
            draw.line([(x + 2 * scale, y + 1 * scale), (x + 2 * scale, y + 7 * scale)], fill=col, width=w)
        elif ch == 'R':
            draw.line([(x + 2 * scale, y + 4 * scale), (x + 4 * scale, y + 7 * scale)], fill=col, width=w)
        elif ch == '0':
            draw.line([(x + 1 * scale, y + 6 * scale), (x + 3 * scale, y + 2 * scale)], fill=col, width=max(1, w - 1))
        elif ch == 'A':
            draw.line([(x + 0.5 * scale, y + 5 * scale), (x + 3.5 * scale, y + 5 * scale)], fill=col, width=w)
        elif ch == 'K':
            draw.line([(x + 4 * scale, y + 1 * scale), (x, y + 4 * scale), (x + 4 * scale, y + 7 * scale)], fill=col, width=w)
        elif ch == 'I':
            draw.line([(x + 2 * scale, y + 1 * scale), (x + 2 * scale, y + 7 * scale)], fill=col, width=w)
            draw.line([(x + 1 * scale, y + 7 * scale), (x + 3 * scale, y + 7 * scale)], fill=col, width=w)
        elif ch == 'F':
            draw.line([(x, y + 4 * scale), (x + 3 * scale, y + 4 * scale)], fill=col, width=w)

    # Render "SECTOR 03"
    word1 = "SECTOR 03"
    cur_x = 65
    for c in word1:
        if c == ' ':
            cur_x += 16
        else:
            draw_vector_char(hdraw, c, cur_x, 115, scale=3.6, col=(255, 215, 0, 255), w=4)
            cur_x += 26

    # Render subtitle "DARK RIFT"
    word2 = "DARK RIFT"
    cur_x = 65
    for c in word2:
        if c == ' ':
            cur_x += 14
        else:
            draw_vector_char(hdraw, c, cur_x, 185, scale=2.4, col=(255, 245, 200, 240), w=3)
            cur_x += 18

    # Graviton Flux telemetry bar at bottom left
    hdraw.polygon([(45, height - 110), (320, height - 110), (340, height - 60), (45, height - 60)], fill=(12, 8, 2, 180), outline=(255, 179, 0, 200), width=1)
    # Segments
    for seg_i in range(12):
        s_col = (255, 215, 0, 240) if seg_i < 8 else ((255, 87, 34, 255) if seg_i < 10 else (255, 23, 68, 255))
        hdraw.rectangle([60 + seg_i * 20, height - 98, 74 + seg_i * 20, height - 72], fill=s_col)

    # Gravitational Warning Icon (Hazard Triangles)
    hx, hy = 370, height - 85
    tri_pts = [(hx, hy - 22), (hx + 24, hy + 18), (hx - 24, hy + 18)]
    hdraw.polygon(tri_pts, outline=(255, 215, 0, 255), width=3)
    hdraw.line([(hx, hy - 10), (hx, hy + 6)], fill=(255, 255, 255, 255), width=3)
    hdraw.ellipse([hx - 2, hy + 10, hx + 2, hy + 14], fill=(255, 255, 255, 255))

    # Multi-Stage Neon Bloom
    fx_blur = fx_layer.filter(ImageFilter.GaussianBlur(2.0))
    hud_tight = hud_layer.filter(ImageFilter.GaussianBlur(2.5))
    hud_med = hud_layer.filter(ImageFilter.GaussianBlur(8.0))
    hud_wide = hud_layer.filter(ImageFilter.GaussianBlur(22.0))

    composite = Image.alpha_composite(base_img, fx_blur)
    composite = Image.alpha_composite(composite, fx_layer)
    composite = Image.alpha_composite(composite, hud_wide)
    composite = Image.alpha_composite(composite, hud_med)
    composite = Image.alpha_composite(composite, hud_tight)
    composite = Image.alpha_composite(composite, hud_layer)

    # Post-Processing
    final_rgb = composite.convert("RGB")
    final_rgb = ImageEnhance.Contrast(final_rgb).enhance(1.15)
    final_rgb = ImageEnhance.Color(final_rgb).enhance(1.20)
    final_rgb = ImageEnhance.Sharpness(final_rgb).enhance(1.10)

    print(f"sector-3-banner generated successfully: {final_rgb.size}")
    return final_rgb

# -------------------------------------------------------------------------
# Asset 10: Sector 4 Banner (1024 x 572)
# Sector 4: Sol Genesis Core Command Banner (Crimson/Solar Thermonuclear Core)
# -------------------------------------------------------------------------

def generate_sector_4_banner(width=1024, height=572, seed=444):
    print(f"Generating sector-4-banner ({width}x{height})...")
    rng = np.random.RandomState(seed)

    # 1. Thermonuclear Solar Core Surface & Coronal Mass Flare Base
    y_coords, x_coords = np.mgrid[0:height, 0:width]
    
    # Solar Limb: Giant curving solar sphere surface (center bottom-right: cx=780, cy=720, radius=520)
    scx, scy = 780, 700
    r_solar = 480.0
    dist_solar = np.sqrt((x_coords - scx) ** 2 + (y_coords - scy) ** 2)

    # Base Void: Deep space obsidian transitioning to hot ruby/crimson corona
    corona_falloff = np.clip(1.0 - (dist_solar - r_solar) / 450.0, 0, 1) ** 1.8
    base_r = np.clip(18 + 140 * corona_falloff, 0, 255)
    base_g = np.clip(2 + 25 * corona_falloff, 0, 255)
    base_b = np.clip(6 + 35 * corona_falloff, 0, 255)
    rgb = np.stack([base_r, base_g, base_b], axis=-1).astype(np.float32)

    # Solar Core Surface (inside r_solar)
    inside_mask = smoothstep(r_solar + 30, r_solar - 60, dist_solar)
    # Supergranulation convection cell noise
    n_gran = create_octave_noise(width, height, seed + 1, [(24, 14, 0.5), (48, 28, 0.3), (96, 56, 0.2)])
    gran_val = np.clip(n_gran + 0.4, 0, 1.5)

    # Core surface colors: Blinding white-yellow center, transitioning to molten ruby
    core_r = inside_mask * (255.0)
    core_g = inside_mask * (160.0 + 80.0 * gran_val)
    core_b = inside_mask * (30.0 + 30.0 * gran_val)

    rgb[:, :, 0] = np.maximum(rgb[:, :, 0], core_r)
    rgb[:, :, 1] = np.maximum(rgb[:, :, 1], core_g)
    rgb[:, :, 2] = np.maximum(rgb[:, :, 2], core_b)

    # Coronal Mass Ejection (CME) Loops & Plasma Flare Shockwaves
    warp_x = create_octave_noise(width, height, seed + 10, [(10, 6, 0.6), (20, 12, 0.3), (40, 24, 0.1)]) * 90.0
    warp_y = create_octave_noise(width, height, seed + 11, [(10, 6, 0.6), (20, 12, 0.3), (40, 24, 0.1)]) * 70.0
    nx = np.clip(x_coords + warp_x, 0, width - 1)
    ny = np.clip(y_coords + warp_y, 0, height - 1)

    dist_warp = np.sqrt((nx - scx) ** 2 + (ny - scy) ** 2)
    # Flare wave arcs
    flare_arc1 = np.exp(-((dist_warp - (r_solar + 90)) ** 2) / (45 ** 2))
    flare_arc2 = np.exp(-((dist_warp - (r_solar + 220)) ** 2) / (70 ** 2))
    flare_total = (flare_arc1 * 1.6 + flare_arc2 * 1.1) * smoothstep(0, 0.8, corona_falloff)

    rgb[:, :, 0] += flare_total * 255.0  # Intense Crimson / Scarlet
    rgb[:, :, 1] += flare_total * 45.0   # Golden fringe
    rgb[:, :, 2] += flare_total * 60.0   # Deep magenta-violet fringe

    base_img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), mode="RGB").convert("RGBA")

    # 2. Coronal Prominences, Starlight & Flares
    fx_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(fx_layer)

    # Prominence Loops (Curving magnetic arcs over solar limb)
    for p_i in range(8):
        p_ang = math.pi * 0.75 + p_i * 0.16
        bx1 = scx + r_solar * math.cos(p_ang)
        by1 = scy + r_solar * math.sin(p_ang)
        h_loop = rng.uniform(80, 180)
        bx2 = scx + (r_solar + h_loop) * math.cos(p_ang + 0.08)
        by2 = scy + (r_solar + h_loop) * math.sin(p_ang + 0.08)
        bx3 = scx + r_solar * math.cos(p_ang + 0.16)
        by3 = scy + r_solar * math.sin(p_ang + 0.16)
        # Draw arc
        fdraw.line([(bx1, by1), (bx2, by2), (bx3, by3)], fill=(255, 230, 100, int(rng.uniform(140, 230))), width=rng.randint(3, 6))

    # Dense Starfield (1,800 stars)
    num_stars = 1800
    sx = rng.uniform(0, width, num_stars)
    sy = rng.uniform(0, height, num_stars)
    sb = rng.exponential(0.35, num_stars)
    for i in range(num_stars):
        b = min(1.0, sb[i])
        if b < 0.08: continue
        col = (255, 200, 210) if rng.rand() > 0.4 else (255, 255, 255)
        fdraw.ellipse([sx[i] - b, sy[i] - b, sx[i] + b, sy[i] + b], fill=(col[0], col[1], col[2], int(b * 240)))

    # Major Crimson / Solar Flares
    beacons = [
        (160, 95, 38, (255, 50, 100), 4, 0.0),
        (380, 180, 44, (255, 210, 50), 6, 0.2),
        (860, 85, 36, (255, 80, 120), 4, 0.3),
        (220, 460, 32, (255, 120, 80), 4, 0.1),
        (560, 490, 50, (255, 255, 200), 4, 0.0), # Solar corona flare
        (100, 310, 28, (255, 60, 110), 4, 0.4),
    ]
    for bx, by, frad, fcol, fsp, fang in beacons:
        fdraw.ellipse([bx - frad * 0.5, by - frad * 0.5, bx + frad * 0.5, by + frad * 0.5], fill=(fcol[0], fcol[1], fcol[2], 90))
        draw_diffraction_flare(fdraw, bx, by, frad, (fcol[0], fcol[1], fcol[2], 230), spikes=fsp, angle_offset=fang, width=2)

    # 3. Tactical Command HUD Frame & Vector Chassis (Sol Genesis Core)
    hud_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(hud_layer)

    # Outer border & angled cut corners
    pad = 22
    corner_cut = 35
    outer_frame = [
        (pad + corner_cut, pad),
        (width - pad - corner_cut, pad),
        (width - pad, pad + corner_cut),
        (width - pad, height - pad - corner_cut),
        (width - pad - corner_cut, height - pad),
        (pad + corner_cut, height - pad),
        (pad, height - pad - corner_cut),
        (pad, pad + corner_cut),
    ]
    hdraw.polygon(outer_frame, outline=(255, 0, 85, 240), width=3)

    pad2 = 32
    inner_frame = [
        (pad2 + corner_cut, pad2),
        (width - pad2 - corner_cut, pad2),
        (width - pad2, pad2 + corner_cut),
        (width - pad2, height - pad2 - corner_cut),
        (width - pad2 - corner_cut, height - pad2),
        (pad2 + corner_cut, height - pad2),
        (pad2, height - pad2 - corner_cut),
        (pad2, pad2 + corner_cut),
    ]
    hdraw.polygon(inner_frame, outline=(255, 179, 0, 160), width=1)

    # Corner brackets in Solar Gold & Crimson
    hdraw.line([(pad, pad + 80), (pad, pad + corner_cut), (pad + corner_cut, pad), (pad + 120, pad)], fill=(255, 0, 85, 255), width=5)
    hdraw.line([(width - pad - 120, height - pad), (width - pad - corner_cut, height - pad), (width - pad, height - pad - corner_cut), (width - pad, height - pad - 80)], fill=(255, 215, 0, 255), width=5)

    # Sector Designation Badge & Heraldry Panel (Left Side)
    hdraw.polygon([(45, 60), (410, 60), (440, 170), (45, 170)], fill=(25, 4, 8, 210), outline=(255, 0, 85, 230), width=2)
    for ch_i in range(5):
        cx_ch = 70 + ch_i * 24
        hdraw.line([(cx_ch, 75), (cx_ch + 12, 95)], fill=(255, 0, 85, 240), width=3)

    # Vector Character drawing helper
    def draw_vector_char(draw, ch, x, y, scale=1.0, col=(255, 255, 255, 255), w=3):
        chars = {
            'S': [(4,1),(1,1),(0,2),(0,3),(1,4),(3,4),(4,5),(4,6),(3,7),(0,7)],
            'E': [(4,1),(0,1),(0,7),(4,7)],
            'C': [(4,1),(1,1),(0,2),(0,6),(1,7),(4,7)],
            'T': [(0,1),(4,1)],
            'O': [(1,1),(3,1),(4,2),(4,6),(3,7),(1,7),(0,6),(0,2),(1,1)],
            'R': [(0,7),(0,1),(3,1),(4,2),(4,3),(3,4),(0,4)],
            '0': [(1,1),(3,1),(4,2),(4,6),(3,7),(1,7),(0,6),(0,2),(1,1)],
            '4': [(3,7),(3,1),(0,4),(4,4)],
            'L': [(0,1),(0,7),(4,7)],
            'G': [(4,2),(2,1),(1,1),(0,2),(0,6),(1,7),(3,7),(4,6),(4,4),(2,4)],
            'N': [(0,7),(0,1),(4,7),(4,1)],
            'I': [(1,1),(3,1)],
        }
        if ch in chars:
            pts = [(x + px * scale, y + py * scale) for px, py in chars[ch]]
            draw.line(pts, fill=col, width=w)
        if ch == 'E':
            draw.line([(x, y + 4 * scale), (x + 3 * scale, y + 4 * scale)], fill=col, width=w)
        elif ch == 'T':
            draw.line([(x + 2 * scale, y + 1 * scale), (x + 2 * scale, y + 7 * scale)], fill=col, width=w)
        elif ch == 'R':
            draw.line([(x + 2 * scale, y + 4 * scale), (x + 4 * scale, y + 7 * scale)], fill=col, width=w)
        elif ch == '0':
            draw.line([(x + 1 * scale, y + 6 * scale), (x + 3 * scale, y + 2 * scale)], fill=col, width=max(1, w - 1))
        elif ch == 'I':
            draw.line([(x + 2 * scale, y + 1 * scale), (x + 2 * scale, y + 7 * scale)], fill=col, width=w)
            draw.line([(x + 1 * scale, y + 7 * scale), (x + 3 * scale, y + 7 * scale)], fill=col, width=w)

    # Render "SECTOR 04"
    word1 = "SECTOR 04"
    cur_x = 65
    for c in word1:
        if c == ' ':
            cur_x += 16
        else:
            draw_vector_char(hdraw, c, cur_x, 115, scale=3.6, col=(255, 0, 85, 255), w=4)
            cur_x += 26

    # Render "SOL GENESIS CORE"
    word2 = "SOL GENESIS"
    cur_x = 65
    for c in word2:
        if c == ' ':
            cur_x += 14
        else:
            draw_vector_char(hdraw, c, cur_x, 185, scale=2.4, col=(255, 230, 160, 240), w=3)
            cur_x += 18

    # Thermonuclear Temperature Gauge at bottom left
    hdraw.polygon([(45, height - 110), (320, height - 110), (340, height - 60), (45, height - 60)], fill=(20, 2, 6, 190), outline=(255, 0, 85, 200), width=1)
    for seg_i in range(12):
        s_col = (255, 179, 0, 240) if seg_i < 6 else ((255, 87, 34, 255) if seg_i < 9 else (255, 0, 85, 255))
        hdraw.rectangle([60 + seg_i * 20, height - 98, 74 + seg_i * 20, height - 72], fill=s_col)

    # Solar Core Warning Icon (Nuclear / Radiation symbol)
    hx, hy = 370, height - 85
    tri_pts = [(hx, hy - 22), (hx + 24, hy + 18), (hx - 24, hy + 18)]
    hdraw.polygon(tri_pts, outline=(255, 0, 85, 255), width=3)
    hdraw.ellipse([hx - 5, hy - 2, hx + 5, hy + 8], fill=(255, 215, 0, 255))
    hdraw.ellipse([hx - 2, hy + 1, hx + 2, hy + 5], fill=(255, 255, 255, 255))

    # Multi-Stage Neon Bloom
    fx_blur = fx_layer.filter(ImageFilter.GaussianBlur(2.0))
    hud_tight = hud_layer.filter(ImageFilter.GaussianBlur(2.5))
    hud_med = hud_layer.filter(ImageFilter.GaussianBlur(8.0))
    hud_wide = hud_layer.filter(ImageFilter.GaussianBlur(22.0))

    composite = Image.alpha_composite(base_img, fx_blur)
    composite = Image.alpha_composite(composite, fx_layer)
    composite = Image.alpha_composite(composite, hud_wide)
    composite = Image.alpha_composite(composite, hud_med)
    composite = Image.alpha_composite(composite, hud_tight)
    composite = Image.alpha_composite(composite, hud_layer)

    # Post-Processing
    final_rgb = composite.convert("RGB")
    final_rgb = ImageEnhance.Contrast(final_rgb).enhance(1.16)
    final_rgb = ImageEnhance.Color(final_rgb).enhance(1.22)
    final_rgb = ImageEnhance.Sharpness(final_rgb).enhance(1.10)

    print(f"sector-4-banner generated successfully: {final_rgb.size}")
    return final_rgb

# -------------------------------------------------------------------------
# Main Execution: Generate and save assets
# -------------------------------------------------------------------------

if __name__ == "__main__":
    # Ensure directories
    os.makedirs("src/assets", exist_ok=True)
    os.makedirs("public/assets", exist_ok=True)
    os.makedirs("dist/assets", exist_ok=True)
    os.makedirs("assets", exist_ok=True)

    # 1. Asset 09: sector-3-banner.jpg (1024 x 572)
    s3_img = generate_sector_3_banner(1024, 572, seed=333)
    assert s3_img.size == (1024, 572), f"Size mismatch: expected (1024, 572), got {s3_img.size}"
    s3_path = "src/assets/sector-3-banner.jpg"
    s3_img.save(s3_path, format="JPEG", quality=96, subsampling=0)
    print(f"Saved {s3_path} ({os.path.getsize(s3_path)} bytes)")

    # 2. Asset 10: sector-4-banner.jpg (1024 x 572)
    s4_img = generate_sector_4_banner(1024, 572, seed=444)
    assert s4_img.size == (1024, 572), f"Size mismatch: expected (1024, 572), got {s4_img.size}"
    s4_path = "src/assets/sector-4-banner.jpg"
    s4_img.save(s4_path, format="JPEG", quality=96, subsampling=0)
    print(f"Saved {s4_path} ({os.path.getsize(s4_path)} bytes)")

    # 3. Mirror to public/assets/, dist/assets/, and assets/
    targets = [
        ("src/assets/sector-3-banner.jpg", ["public/assets/sector-3-banner.jpg", "dist/assets/sector-3-banner.jpg", "assets/sector-3-banner.jpg"]),
        ("src/assets/sector-4-banner.jpg", ["public/assets/sector-4-banner.jpg", "dist/assets/sector-4-banner.jpg", "assets/sector-4-banner.jpg"]),
    ]
    for src, dests in targets:
        for dest in dests:
            shutil.copyfile(src, dest)
            print(f"Mirrored {src} -> {dest}")

    print("Sector banners generation and mirroring complete!")
