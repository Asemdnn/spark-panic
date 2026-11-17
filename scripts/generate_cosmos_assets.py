"""
High-Fidelity Procedural Art Synthesis for Spark Panic: Planetary Invasion Defense
Batch 1 Asset 03 (game-icon.jpg) & Asset 04 (space-background.jpg)
Cohesive Neon Synthwave / Geometry Wars / Prismatic Indie Art Direction
"""

import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

# -------------------------------------------------------------------------
# Utility Helpers
# -------------------------------------------------------------------------

def create_octave_noise(width, height, seed, octaves):
    """
    Generate fractal Perlin-like noise using bicubic upsampled Gaussian fields.
    octaves: list of tuples (grid_w, grid_h, weight)
    """
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
    # Core circle
    draw.ellipse([cx - r_core, cy - r_core, cx + r_core, cy + r_core], fill=(255, 255, 255, 255))
    
    # Spikes
    for i in range(spikes):
        ang = angle_offset + i * (math.pi / (spikes / 2))
        dx = math.cos(ang)
        dy = math.sin(ang)
        # Main spike
        p1 = (cx - dx * radius, cy - dy * radius)
        p2 = (cx + dx * radius, cy + dy * radius)
        draw.line([p1, p2], fill=color, width=width)
        # Inner brighter spike
        p1_in = (cx - dx * (radius * 0.4), cy - dy * (radius * 0.4))
        p2_in = (cx + dx * (radius * 0.4), cy + dy * (radius * 0.4))
        draw.line([p1_in, p2_in], fill=(255, 255, 255, 230), width=max(1, width - 1))

# -------------------------------------------------------------------------
# Asset 04: Space Background (1376 x 768)
# Deep Cosmic Void Backdrop & Starlight Dust
# -------------------------------------------------------------------------

def generate_space_background(width=1376, height=768, seed=42):
    print(f"Generating space-background ({width}x{height})...")
    rng = np.random.RandomState(seed)

    # 1. Base Deep Cosmic Void with slight vertical/radial gradient
    y_coords, x_coords = np.mgrid[0:height, 0:width]
    cx, cy = width * 0.5, height * 0.52
    dist_center = np.sqrt(((x_coords - cx) / (width * 0.6)) ** 2 + ((y_coords - cy) / (height * 0.6)) ** 2)
    
    # Inky cosmic base: Very deep navy/black (#020108 to #080518)
    base_r = np.clip(3 + 8 * (1.0 - np.clip(dist_center * 0.8, 0, 1)), 0, 255)
    base_g = np.clip(2 + 7 * (1.0 - np.clip(dist_center * 0.8, 0, 1)), 0, 255)
    base_b = np.clip(8 + 20 * (1.0 - np.clip(dist_center * 0.8, 0, 1)), 0, 255)
    rgb = np.stack([base_r, base_g, base_b], axis=-1).astype(np.float32)

    # 2. Volumetric Multi-Spectral Cosmic Nebulae
    # We use domain warping to get swirling turbulent gas filaments
    warp_x = create_octave_noise(width, height, seed + 1, [(8, 5, 0.6), (16, 9, 0.3), (32, 18, 0.1)]) * 120.0
    warp_y = create_octave_noise(width, height, seed + 2, [(8, 5, 0.6), (16, 9, 0.3), (32, 18, 0.1)]) * 120.0

    # Grid for sampling with warp
    nx = np.clip(x_coords + warp_x, 0, width - 1).astype(np.float32) / width
    ny = np.clip(y_coords + warp_y, 0, height - 1).astype(np.float32) / height

    # Nebula 1: Majestic Deep Violet / Magenta Cosmic Rift (Sector 2 theme)
    n_mag = create_octave_noise(width, height, seed + 10, [(12, 7, 0.5), (24, 14, 0.3), (48, 27, 0.15), (96, 54, 0.05)])
    diag_falloff1 = np.exp(-((nx * 1.2 - ny - 0.1) ** 2) / 0.18)
    cloud_mag = np.clip((n_mag + 0.4) * diag_falloff1 * 1.5, 0, 1.8)
    cloud_mag = smoothstep(0.1, 1.3, cloud_mag)
    rgb[:, :, 0] += cloud_mag * 115.0  # R
    rgb[:, :, 1] += cloud_mag * 25.0   # G
    rgb[:, :, 2] += cloud_mag * 140.0  # B

    # Nebula 2: Glowing Cyan / Azure Ionization Veil (Sector 1 theme)
    n_cyan = create_octave_noise(width, height, seed + 20, [(10, 6, 0.5), (20, 12, 0.3), (40, 24, 0.15), (80, 48, 0.05)])
    diag_falloff2 = np.exp(-((nx * 0.9 + ny * 1.1 - 0.95) ** 2) / 0.15)
    cloud_cyan = np.clip((n_cyan + 0.35) * diag_falloff2 * 1.6, 0, 2.0)
    cloud_cyan = smoothstep(0.12, 1.4, cloud_cyan)
    rgb[:, :, 0] += cloud_cyan * 15.0   # R
    rgb[:, :, 1] += cloud_cyan * 140.0  # G
    rgb[:, :, 2] += cloud_cyan * 210.0  # B

    # Nebula 3: Warm Solar Amber / Gold Stardust Filaments (Sector 3 & 4 theme)
    n_gold = create_octave_noise(width, height, seed + 30, [(14, 8, 0.5), (28, 16, 0.3), (56, 32, 0.15)])
    center_patch = np.exp(-(((nx - 0.62) * 1.6) ** 2 + ((ny - 0.45) * 1.8) ** 2) / 0.12)
    cloud_gold = np.clip((n_gold + 0.3) * center_patch * 1.8, 0, 2.0)
    cloud_gold = smoothstep(0.15, 1.3, cloud_gold)
    rgb[:, :, 0] += cloud_gold * 210.0  # R
    rgb[:, :, 1] += cloud_gold * 135.0  # G
    rgb[:, :, 2] += cloud_gold * 25.0   # B

    # Interstellar Absorption Dust Lanes (Dark Silhouettes)
    n_dark = create_octave_noise(width, height, seed + 40, [(16, 9, 0.6), (32, 18, 0.3), (64, 36, 0.1)])
    dark_mask = smoothstep(0.45, 0.9, n_dark)
    rgb *= (1.0 - 0.55 * dark_mask[:, :, np.newaxis])

    # Convert base to PIL Image for rendering galaxies, stars, and vectors
    img_rgb = np.clip(rgb, 0, 255).astype(np.uint8)
    base_img = Image.fromarray(img_rgb, mode="RGB")

    # 3. Render Distant Galaxies
    galaxy_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(galaxy_layer)

    # Galaxy A: Grand Spiral Galaxy at (340, 230)
    gx1, gy1 = 340, 230
    for r in range(120, 0, -2):
        alpha = int(45 * (1.0 - (r / 120.0) ** 0.6))
        gdraw.ellipse([gx1 - r * 1.4, gy1 - r * 0.7, gx1 + r * 1.4, gy1 + r * 0.7], fill=(60, 110, 200, alpha))
    for r in range(40, 0, -2):
        alpha = int(120 * (1.0 - (r / 40.0) ** 0.8))
        gdraw.ellipse([gx1 - r * 1.2, gy1 - r * 0.6, gx1 + r * 1.2, gy1 + r * 0.6], fill=(160, 220, 255, alpha))
    for r in range(12, 0, -1):
        alpha = int(220 * (1.0 - (r / 12.0)))
        gdraw.ellipse([gx1 - r, gy1 - r * 0.8, gx1 + r, gy1 + r * 0.8], fill=(255, 250, 240, alpha))

    # Logarithmic Spiral Arms
    for arm_offset in [0, math.pi]:
        for theta_deg in range(0, 480, 4):
            theta = math.radians(theta_deg)
            r_arm = 8.0 * math.exp(0.32 * theta)
            if r_arm > 130:
                break
            tilt = -0.35  # tilt angle
            raw_x = r_arm * math.cos(theta + arm_offset) * 1.3
            raw_y = r_arm * math.sin(theta + arm_offset) * 0.65
            # rotate by tilt
            px = gx1 + raw_x * math.cos(tilt) - raw_y * math.sin(tilt)
            py = gy1 + raw_x * math.sin(tilt) + raw_y * math.cos(tilt)
            
            # Star forming knots along spiral arms
            star_sz = rng.uniform(0.8, 2.5)
            c_tint = (120, 230, 255, int(rng.uniform(70, 180))) if rng.rand() > 0.3 else (255, 140, 210, int(rng.uniform(80, 170)))
            gdraw.ellipse([px - star_sz, py - star_sz, px + star_sz, py + star_sz], fill=c_tint)

    # Galaxy B: Edge-on Lenticular Galaxy at (1100, 530)
    gx2, gy2 = 1100, 530
    for r in range(90, 0, -2):
        alpha = int(35 * (1.0 - (r / 90.0) ** 0.5))
        gdraw.ellipse([gx2 - r * 1.8, gy2 - r * 0.25, gx2 + r * 1.8, gy2 + r * 0.25], fill=(190, 140, 70, alpha))
    for r in range(25, 0, -1):
        alpha = int(140 * (1.0 - (r / 25.0)))
        gdraw.ellipse([gx2 - r * 1.2, gy2 - r * 0.35, gx2 + r * 1.2, gy2 + r * 0.35], fill=(255, 220, 160, alpha))
    # Equatorial dust lane
    gdraw.line([gx2 - 120, gy2, gx2 + 120, gy2], fill=(8, 4, 14, 180), width=3)

    # Galaxy C: Faint Magellanic Azure Cloud at (860, 160)
    gx3, gy3 = 860, 160
    for _ in range(350):
        ox = rng.randn() * 45
        oy = rng.randn() * 25
        sz = rng.uniform(0.8, 2.0)
        a = int(rng.uniform(30, 130))
        gdraw.ellipse([gx3 + ox - sz, gy3 + oy - sz, gx3 + ox + sz, gy3 + oy + sz], fill=(100, 210, 255, a))

    # Composite galaxy layer with blur for ethereal look
    galaxy_blurred = galaxy_layer.filter(ImageFilter.GaussianBlur(1.2))
    base_img = Image.alpha_composite(base_img.convert("RGBA"), galaxy_blurred)

    # 4. Dense Atmospheric Starfield (3 tiers: micro, medium, major beacons)
    star_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(star_layer)

    # Tier 1: 3,500 Micro Stars
    num_micro = 3600
    star_x = rng.uniform(0, width, num_micro)
    star_y = rng.uniform(0, height, num_micro)
    star_b = rng.exponential(scale=0.35, size=num_micro)
    star_colors = [
        (255, 255, 255),  # Pure white
        (200, 235, 255),  # O/B Blue
        (180, 220, 255),  # Cyan-white
        (255, 245, 215),  # Warm white
        (255, 215, 160),  # Golden K-type
        (255, 175, 175),  # M-type red
    ]

    for i in range(num_micro):
        x, y = star_x[i], star_y[i]
        b = min(1.0, star_b[i])
        if b < 0.08:
            continue
        alpha = int(b * 255)
        col = star_colors[rng.randint(len(star_colors))]
        sz = 0.5 + b * 1.1
        sdraw.ellipse([x - sz, y - sz, x + sz, y + sz], fill=(col[0], col[1], col[2], alpha))

    # Tier 2: 220 Medium Stars with soft halos
    num_med = 220
    med_x = rng.uniform(0, width, num_med)
    med_y = rng.uniform(0, height, num_med)
    for i in range(num_med):
        x, y = med_x[i], med_y[i]
        col = star_colors[rng.randint(len(star_colors))]
        halo_r = rng.uniform(2.5, 6.0)
        # Soft outer halo
        sdraw.ellipse([x - halo_r, y - halo_r, x + halo_r, y + halo_r], fill=(col[0], col[1], col[2], int(rng.uniform(30, 80))))
        # Bright core
        sdraw.ellipse([x - 1.2, y - 1.2, x + 1.2, y + 1.2], fill=(255, 255, 255, 240))

    # Tier 3: 16 Major Brilliant Beacons with 4-point & 6-point diffraction spikes
    beacons = [
        (180, 110, 42, (180, 240, 255), 4, 0.0),
        (540, 380, 36, (255, 230, 180), 6, 0.2),
        (920, 610, 38, (160, 220, 255), 4, 0.4),
        (1240, 140, 44, (255, 210, 140), 4, 0.1),
        (710, 95, 30, (200, 240, 255), 4, 0.5),
        (390, 680, 32, (255, 190, 240), 4, 0.3),
        (1300, 690, 35, (170, 235, 255), 6, 0.0),
        (80, 480, 30, (255, 240, 200), 4, 0.2),
        (620, 520, 28, (190, 225, 255), 4, 0.6),
        (1010, 290, 34, (255, 220, 160), 4, 0.15),
        (260, 390, 25, (200, 245, 255), 4, 0.0),
        (810, 410, 32, (255, 200, 180), 4, 0.4),
        (1190, 450, 28, (180, 230, 255), 4, 0.3),
        (470, 190, 26, (255, 235, 210), 4, 0.2),
        (160, 620, 28, (190, 240, 255), 4, 0.5),
        (970, 80, 32, (255, 210, 240), 4, 0.25),
    ]

    for bx, by, r_flare, fcol, sp_count, rot in beacons:
        # Wide halo
        sdraw.ellipse([bx - r_flare * 0.8, by - r_flare * 0.8, bx + r_flare * 0.8, by + r_flare * 0.8],
                      fill=(fcol[0], fcol[1], fcol[2], 40))
        # Medium halo
        sdraw.ellipse([bx - r_flare * 0.4, by - r_flare * 0.4, bx + r_flare * 0.4, by + r_flare * 0.4],
                      fill=(fcol[0], fcol[1], fcol[2], 100))
        # Diffraction flare
        draw_diffraction_flare(sdraw, bx, by, r_flare, (fcol[0], fcol[1], fcol[2], 210), spikes=sp_count, angle_offset=rot, width=2)

    # 5. Fine Stardust Shimmer (floating prismatic motes)
    for _ in range(800):
        px = rng.uniform(0, width)
        py = rng.uniform(0, height)
        sz = rng.uniform(0.6, 1.8)
        c_choice = rng.rand()
        if c_choice < 0.4:
            c = (0, 229, 255, int(rng.uniform(50, 180))) # Cyan
        elif c_choice < 0.7:
            c = (224, 64, 251, int(rng.uniform(50, 170))) # Magenta
        else:
            c = (255, 179, 0, int(rng.uniform(50, 180)))  # Amber
        sdraw.ellipse([px - sz, py - sz, px + sz, py + sz], fill=c)

    # Composite starfield with multi-pass bloom
    star_blur = star_layer.filter(ImageFilter.GaussianBlur(1.0))
    star_glow = star_layer.filter(ImageFilter.GaussianBlur(3.5))
    final_img = Image.alpha_composite(base_img, star_glow)
    final_img = Image.alpha_composite(final_img, star_blur)
    final_img = Image.alpha_composite(final_img, star_layer)

    # 6. Filmic Vignette & High-Contrast Grading
    final_rgb = final_img.convert("RGB")
    enhancer_contrast = ImageEnhance.Contrast(final_rgb)
    final_rgb = enhancer_contrast.enhance(1.12)
    enhancer_color = ImageEnhance.Color(final_rgb)
    final_rgb = enhancer_color.enhance(1.15)

    # Subtle vignette
    vignette = Image.new("L", (width, height), 0)
    vdraw = ImageDraw.Draw(vignette)
    vdraw.ellipse([-width * 0.2, -height * 0.2, width * 1.2, height * 1.2], fill=255)
    vignette = vignette.filter(ImageFilter.GaussianBlur(90))
    v_arr = np.array(vignette, dtype=np.float32) / 255.0
    v_factor = 0.65 + 0.35 * v_arr

    arr_final = np.array(final_rgb, dtype=np.float32)
    arr_final *= v_factor[:, :, np.newaxis]
    arr_final = np.clip(arr_final, 0, 255).astype(np.uint8)

    result = Image.fromarray(arr_final, mode="RGB")
    print(f"space-background generated successfully: {result.size}")
    return result

# -------------------------------------------------------------------------
# Asset 03: Game Icon & Holographic Crest (1024 x 1024)
# High-Res App Icon & Holographic Crest
# Futuristic military insignia/emblem of the Planetary Defense Force
# -------------------------------------------------------------------------

def generate_game_icon(width=1024, height=1024, seed=777):
    print(f"Generating game-icon ({width}x{height})...")
    rng = np.random.RandomState(seed)
    cx, cy = width // 2, height // 2

    # 1. Dark Deep Space Canvas with subtle radial gradient & nebula glow
    y_coords, x_coords = np.mgrid[0:height, 0:width]
    r_map = np.sqrt(((x_coords - cx) / (width * 0.5)) ** 2 + ((y_coords - cy) / (height * 0.5)) ** 2)
    
    # Deep void background with dark indigo-cyan radial aura
    bg_r = np.clip(6 + 14 * np.exp(-(r_map ** 2) / 0.4), 0, 255)
    bg_g = np.clip(8 + 25 * np.exp(-(r_map ** 2) / 0.45), 0, 255)
    bg_b = np.clip(18 + 48 * np.exp(-(r_map ** 2) / 0.5), 0, 255)
    bg_arr = np.stack([bg_r, bg_g, bg_b], axis=-1).astype(np.float32)

    icon_img = Image.fromarray(bg_arr.astype(np.uint8), mode="RGB").convert("RGBA")

    # 2. Hexagonal / Triangular Cyber Lattice Background Grid
    grid_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grid_layer)
    hex_size = 38.0
    h_h = hex_size * math.sqrt(3)
    cols = int(width / (hex_size * 1.5)) + 3
    rows = int(height / h_h) + 3

    for r_idx in range(-2, rows):
        for c_idx in range(-2, cols):
            hx = c_idx * hex_size * 1.5
            hy = r_idx * h_h + ((c_idx % 2) * (h_h * 0.5))
            d_center = math.hypot(hx - cx, hy - cy) / (width * 0.48)
            if d_center < 1.05:
                # Faint glowing hexagonal boundary
                pts = []
                for a_i in range(6):
                    ang = a_i * (math.pi / 3.0)
                    pts.append((hx + hex_size * 0.85 * math.cos(ang), hy + hex_size * 0.85 * math.sin(ang)))
                alpha = int(32 * (1.0 - (d_center ** 1.8)))
                if alpha > 0:
                    gdraw.polygon(pts, outline=(0, 240, 255, alpha))

    # Grid blur
    icon_img = Image.alpha_composite(icon_img, grid_layer.filter(ImageFilter.GaussianBlur(1.0)))

    # Vector Artwork Layers (Sharp layer + Bloom layers)
    vector_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vector_layer)

    # 3. Concentric Tactical Reticles & Planetary Defense Telemetry Rings
    telemetry_rings = [
        (460, (0, 229, 255, 70), 1, True),   # Outer coordinate ring
        (430, (255, 215, 0, 90), 2, False),   # Outer gold ring
        (380, (0, 240, 255, 140), 2, False),  # Primary tactical ring
        (340, (0, 180, 216, 80), 1, True),   # Segmented inner ring
        (220, (255, 193, 7, 160), 2, False),  # Reactor boundary ring
        (170, (0, 240, 255, 180), 3, False),  # Plasma containment ring
    ]

    for radius, col, lwidth, is_segmented in telemetry_rings:
        if is_segmented:
            # Draw segmented dashed arc ticks
            num_segs = 64
            for seg in range(num_segs):
                if seg % 2 == 0:
                    a1 = seg * (2 * math.pi / num_segs)
                    a2 = (seg + 0.7) * (2 * math.pi / num_segs)
                    deg1 = math.degrees(a1)
                    deg2 = math.degrees(a2)
                    vdraw.arc([cx - radius, cy - radius, cx + radius, cy + radius], start=deg1, end=deg2, fill=col, width=lwidth)
        else:
            vdraw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], outline=col, width=lwidth)

    # Cardinal & Intercardinal Tactical Radar Spokes & Coordinate Ticks
    for deg in range(0, 360, 15):
        rad = math.radians(deg)
        r_in = 430
        r_out = 450 if deg % 90 == 0 else (442 if deg % 45 == 0 else 436)
        w = 3 if deg % 90 == 0 else (2 if deg % 45 == 0 else 1)
        col = (255, 215, 0, 220) if deg % 90 == 0 else (0, 240, 255, 180)
        p1 = (cx + r_in * math.cos(rad), cy + r_in * math.sin(rad))
        p2 = (cx + r_out * math.cos(rad), cy + r_out * math.sin(rad))
        vdraw.line([p1, p2], fill=col, width=w)

    # 4. Planetary Defense Force Stylized Shield Lattice (Aegis Crest)
    # The crest consists of:
    # - Heavy outer geometric faceted shield
    # - Angled shoulder notches
    # - Flanking chevron interceptor wings
    # - Inner layered armor rails

    shield_outer = [
        (cx, cy - 420),        # Top apex
        (cx + 260, cy - 360),  # Upper right shoulder
        (cx + 380, cy - 220),  # Flank wing top right
        (cx + 340, cy + 40),   # Flank wing mid right
        (cx + 280, cy + 220),  # Lower right taper
        (cx + 120, cy + 380),  # Pre-apex right
        (cx, cy + 450),        # Bottom sharp apex
        (cx - 120, cy + 380),  # Pre-apex left
        (cx - 280, cy + 220),  # Lower left taper
        (cx - 340, cy + 40),   # Flank wing mid left
        (cx - 380, cy - 220),  # Flank wing top left
        (cx - 260, cy - 360),  # Upper left shoulder
    ]

    # Semi-transparent shield body fill
    vdraw.polygon(shield_outer, fill=(2, 24, 48, 140))

    # Multi-tier Glowing Shield Borders
    vdraw.polygon(shield_outer, outline=(0, 240, 255, 240), width=6)

    # Inner concentric shield lattice (scale 0.88)
    def scale_poly(poly, scale, center):
        return [((p[0] - center[0]) * scale + center[0], (p[1] - center[1]) * scale + center[1]) for p in poly]

    shield_inner_1 = scale_poly(shield_outer, 0.88, (cx, cy))
    vdraw.polygon(shield_inner_1, outline=(255, 215, 0, 230), width=4)

    shield_inner_2 = scale_poly(shield_outer, 0.76, (cx, cy))
    vdraw.polygon(shield_inner_2, outline=(0, 229, 255, 180), width=2)

    # Faceted Internal Geometry Lines (Prismatic Diamond Trusses)
    for p in shield_inner_1[::2]:
        vdraw.line([(cx, cy), p], fill=(0, 240, 255, 120), width=2)
    for p in shield_outer[1::2]:
        vdraw.line([(cx, cy - 100), p], fill=(255, 193, 7, 100), width=1)

    # Chevron Interceptor Wings (Flanking Aerodynamic Blades)
    for side in [-1, 1]:
        wing1 = [
            (cx + side * 310, cy - 140),
            (cx + side * 440, cy - 40),
            (cx + side * 410, cy + 80),
            (cx + side * 300, cy - 10),
        ]
        vdraw.polygon(wing1, fill=(5, 35, 65, 180), outline=(0, 240, 255, 240), width=3)
        # Wing energy slot
        vdraw.line([(cx + side * 330, cy - 70), (cx + side * 400, cy + 20)], fill=(255, 215, 0, 255), width=3)

        wing2 = [
            (cx + side * 280, cy + 60),
            (cx + side * 380, cy + 170),
            (cx + side * 340, cy + 260),
            (cx + side * 260, cy + 170),
        ]
        vdraw.polygon(wing2, fill=(8, 25, 55, 180), outline=(255, 193, 7, 230), width=3)

    # 5. Planetary Defense Heraldry & Chevrons (Top & Bottom Crest Details)
    # 3 Golden Military Rank Stars above the Reactor Core
    star_positions = [(cx - 90, cy - 250), (cx, cy - 275), (cx + 90, cy - 250)]
    for sx, sy in star_positions:
        # Draw 4-point star emblem
        r_s = 20
        pts_star = [
            (sx, sy - r_s),
            (sx + r_s * 0.35, sy - r_s * 0.35),
            (sx + r_s, sy),
            (sx + r_s * 0.35, sy + r_s * 0.35),
            (sx, sy + r_s),
            (sx - r_s * 0.35, sy + r_s * 0.35),
            (sx - r_s, sy),
            (sx - r_s * 0.35, sy - r_s * 0.35),
        ]
        vdraw.polygon(pts_star, fill=(255, 240, 180, 255), outline=(255, 215, 0, 255), width=2)
        vdraw.ellipse([sx - 4, sy - 4, sx + 4, sy + 4], fill=(255, 255, 255, 255))

    # Triple Chevron Flight Bars below the reactor
    for ch_idx, ch_y in enumerate([cy + 250, cy + 285, cy + 320]):
        span = 140 - ch_idx * 25
        depth = 35
        pts_ch = [
            (cx - span, ch_y),
            (cx, ch_y + depth),
            (cx + span, ch_y),
            (cx + span, ch_y + 16),
            (cx, ch_y + depth + 16),
            (cx - span, ch_y + 16),
        ]
        vdraw.polygon(pts_ch, fill=(0, 229, 255, 200), outline=(255, 255, 255, 220), width=2)

    # 6. Central Glowing Plasma Reactor Core
    # Outer Heavy Containment Housing (Octagon)
    oct_r = 175
    oct_pts = []
    for i in range(8):
        ang = i * (math.pi / 4.0) + (math.pi / 8.0)
        oct_pts.append((cx + oct_r * math.cos(ang), cy + oct_r * math.sin(ang)))
    vdraw.polygon(oct_pts, fill=(10, 20, 45, 230), outline=(255, 215, 0, 255), width=6)

    # Stator / Magnetic Conduits locking the reactor
    for i in range(8):
        ang = i * (math.pi / 4.0) + (math.pi / 8.0)
        p_base = (cx + (oct_r - 20) * math.cos(ang), cy + (oct_r - 20) * math.sin(ang))
        p_ext = (cx + (oct_r + 45) * math.cos(ang), cy + (oct_r + 45) * math.sin(ang))
        vdraw.line([p_base, p_ext], fill=(0, 240, 255, 255), width=5)
        vdraw.ellipse([p_ext[0] - 5, p_ext[1] - 5, p_ext[0] + 5, p_ext[1] + 5], fill=(255, 255, 255, 255))

    # Turbine Segmented Blades
    num_blades = 12
    for b in range(num_blades):
        b_ang = b * (2 * math.pi / num_blades)
        p_in = (cx + 90 * math.cos(b_ang), cy + 90 * math.sin(b_ang))
        p_out = (cx + 145 * math.cos(b_ang + 0.15), cy + 145 * math.sin(b_ang + 0.15))
        vdraw.line([p_in, p_out], fill=(255, 193, 7, 220), width=3)

    # Plasma Core Radial Multi-Spectral Rings
    plasma_radii = [
        (130, (0, 240, 255, 160)),
        (105, (0, 180, 216, 200)),
        (80, (255, 215, 0, 220)),
        (55, (0, 240, 255, 240)),
        (35, (160, 240, 255, 255)),
        (18, (255, 255, 255, 255)),
    ]
    for pr, pcol in plasma_radii:
        vdraw.ellipse([cx - pr, cy - pr, cx + pr, cy + pr], fill=pcol)

    # 4 Cardinal High-Energy Plasma Discharge Beams
    beam_len = 260
    for ang in [0, math.pi * 0.5, math.pi, math.pi * 1.5]:
        dx, dy = math.cos(ang), math.sin(ang)
        p_start = (cx + dx * 20, cy + dy * 20)
        p_end = (cx + dx * beam_len, cy + dy * beam_len)
        vdraw.line([p_start, p_end], fill=(0, 240, 255, 240), width=4)
        vdraw.line([p_start, (cx + dx * (beam_len * 0.6), cy + dy * (beam_len * 0.6))], fill=(255, 255, 255, 255), width=2)

    # Brilliant Starlight / Lens Glints at key vector apexes
    glint_nodes = [
        (cx, cy, 75, (255, 255, 255), 4, 0.0, 3),            # Reactor core center
        (cx, cy - 420, 48, (0, 240, 255), 4, 0.0, 2),        # Top apex
        (cx, cy + 450, 48, (0, 240, 255), 4, 0.0, 2),        # Bottom apex
        (cx + 380, cy - 220, 36, (255, 215, 0), 4, 0.4, 2),  # Right wing tip
        (cx - 380, cy - 220, 36, (255, 215, 0), 4, -0.4, 2), # Left wing tip
    ]
    for gx, gy, g_rad, g_col, g_sp, g_rot, g_w in glint_nodes:
        draw_diffraction_flare(vdraw, gx, gy, g_rad, (g_col[0], g_col[1], g_col[2], 240), spikes=g_sp, angle_offset=g_rot, width=g_w)

    # 7. Multi-Stage Hyper-Bloom & Neon Glow Passes (Geometry Wars Aesthetic)
    bloom_tight = vector_layer.filter(ImageFilter.GaussianBlur(3.0))
    bloom_med = vector_layer.filter(ImageFilter.GaussianBlur(10.0))
    bloom_wide = vector_layer.filter(ImageFilter.GaussianBlur(28.0))

    # Composite layers: Background + Wide Bloom + Med Bloom + Tight Bloom + Crisp Sharp Vector Layer
    icon_composite = Image.alpha_composite(icon_img, bloom_wide)
    icon_composite = Image.alpha_composite(icon_composite, bloom_med)
    icon_composite = Image.alpha_composite(icon_composite, bloom_tight)
    icon_composite = Image.alpha_composite(icon_composite, vector_layer)

    # 8. Post-Processing & Grading
    final_rgb = icon_composite.convert("RGB")
    enhancer_contrast = ImageEnhance.Contrast(final_rgb)
    final_rgb = enhancer_contrast.enhance(1.18)
    enhancer_color = ImageEnhance.Color(final_rgb)
    final_rgb = enhancer_color.enhance(1.22)
    enhancer_sharp = ImageEnhance.Sharpness(final_rgb)
    final_rgb = enhancer_sharp.enhance(1.15)

    print(f"game-icon generated successfully: {final_rgb.size}")
    return final_rgb

# -------------------------------------------------------------------------
# Main Execution: Generate and save assets
# -------------------------------------------------------------------------

if __name__ == "__main__":
    import os
    import shutil

    # Ensure output directories
    os.makedirs("src/assets", exist_ok=True)
    os.makedirs("public/assets", exist_ok=True)
    os.makedirs("dist/assets", exist_ok=True)
    os.makedirs("assets", exist_ok=True)

    # 1. Asset 04: space-background.jpg (1376 x 768)
    bg_img = generate_space_background(1376, 768, seed=1024)
    assert bg_img.size == (1376, 768), f"Dimension mismatch: expected (1376, 768), got {bg_img.size}"
    
    bg_path_src = "src/assets/space-background.jpg"
    bg_img.save(bg_path_src, format="JPEG", quality=96, subsampling=0)
    print(f"Saved {bg_path_src} ({os.path.getsize(bg_path_src)} bytes)")

    # 2. Asset 03: game-icon.jpg (1024 x 1024)
    icon_img = generate_game_icon(1024, 1024, seed=2048)
    assert icon_img.size == (1024, 1024), f"Dimension mismatch: expected (1024, 1024), got {icon_img.size}"

    icon_path_src = "src/assets/game-icon.jpg"
    icon_img.save(icon_path_src, format="JPEG", quality=96, subsampling=0)
    print(f"Saved {icon_path_src} ({os.path.getsize(icon_path_src)} bytes)")

    # 3. Mirror to public/assets/, dist/assets/, and assets/
    targets = [
        ("src/assets/space-background.jpg", ["public/assets/space-background.jpg", "dist/assets/space-background.jpg", "assets/space-background.jpg"]),
        ("src/assets/game-icon.jpg", ["public/assets/game-icon.jpg", "dist/assets/game-icon.jpg", "assets/game-icon.jpg"]),
    ]
    for src, dests in targets:
        for dest in dests:
            shutil.copyfile(src, dest)
            print(f"Mirrored {src} -> {dest}")

    print("Generation and mirroring complete!")
