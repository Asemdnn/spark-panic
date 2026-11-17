"""
High-Fidelity Procedural Art Synthesis for Spark Panic: Planetary Invasion Defense
Batch 5 Asset 27 (tempest.jpg) & Asset 28 (vespera.jpg)
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
# Asset 27: Planet Tempest (1024 x 1024)
# Hyper-Storm Cyclonic Vortex: perpetual planetary hurricane,
# high-voltage electrical branching lightning arcs, violet-cyan cyclonic eyes.
# -------------------------------------------------------------------------

def generate_tempest_planet(width=1024, height=1024, seed=2701):
    print(f"Generating tempest.jpg ({width}x{height})...")
    rng = np.random.RandomState(seed)
    cx, cy = width // 2, height // 2
    r_planet = 355.0

    # 1. Background Void with Storm Discharge Auroras
    y_coords, x_coords = np.mgrid[0:height, 0:width]
    dist_c = np.sqrt(((x_coords - cx) / 512.0) ** 2 + ((y_coords - cy) / 512.0) ** 2)

    bg_r = np.clip(8 + 14 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    bg_g = np.clip(4 + 8 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    bg_b = np.clip(16 + 32 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    rgb = np.stack([bg_r, bg_g, bg_b], axis=-1).astype(np.float32)

    # Ambient Storm Aurora in Background
    n_aurora = create_octave_noise(width, height, seed + 1, [(8, 8, 0.6), (16, 16, 0.3), (32, 32, 0.1)])
    aurora_mask = smoothstep(0.28, 0.85, n_aurora)
    rgb[:, :, 0] += aurora_mask * 35.0
    rgb[:, :, 1] += aurora_mask * 15.0
    rgb[:, :, 2] += aurora_mask * 80.0

    # 2. Spherical Geometry & 3D Normal Mapping
    dx = x_coords - cx
    dy = y_coords - cy
    dist_planet = np.sqrt(dx ** 2 + dy ** 2)
    planet_mask = dist_planet <= r_planet

    z_sph = np.zeros_like(dist_planet)
    z_sph[planet_mask] = np.sqrt(r_planet ** 2 - dist_planet[planet_mask] ** 2)

    norm_x = np.zeros_like(dist_planet)
    norm_y = np.zeros_like(dist_planet)
    norm_z = np.zeros_like(dist_planet)
    norm_x[planet_mask] = dx[planet_mask] / r_planet
    norm_y[planet_mask] = dy[planet_mask] / r_planet
    norm_z[planet_mask] = z_sph[planet_mask] / r_planet

    # Sunward Light Vector (Upper left: lx=-0.58, ly=-0.48, lz=0.66)
    lx, ly, lz = -0.58, -0.48, 0.66
    l_mag = math.sqrt(lx**2 + ly**2 + lz**2)
    lx, ly, lz = lx / l_mag, ly / l_mag, lz / l_mag
    dot_light = np.clip(norm_x * lx + norm_y * ly + norm_z * lz, 0.0, 1.0)
    term = smoothstep(0.0, 0.72, dot_light)

    # 3. Hyper-Storm Cyclonic Vortex Simulation
    # Main Eye location offset to (cx - 70, cy - 50)
    eye_x, eye_y = cx - 70, cy - 50
    ang_eye = np.arctan2(y_coords - eye_y, x_coords - eye_x)
    r_eye = np.sqrt((x_coords - eye_x) ** 2 + (y_coords - eye_y) ** 2)

    # Logarithmic spiral shear
    spiral_phase = ang_eye * 4.0 - np.log(np.maximum(r_eye, 10.0)) * 5.0
    spiral_bands = 0.5 + 0.5 * np.sin(spiral_phase)

    # Domain-warped turbulence
    warp_x = create_octave_noise(width, height, seed + 10, [(12, 12, 0.6), (24, 24, 0.3), (48, 48, 0.1)]) * 65.0
    warp_y = create_octave_noise(width, height, seed + 11, [(12, 12, 0.6), (24, 24, 0.3), (48, 48, 0.1)]) * 45.0
    n_storm = create_octave_noise(width, height, seed + 20, [(16, 16, 0.5), (32, 32, 0.3), (64, 64, 0.15), (128, 128, 0.05)])

    storm_clouds = smoothstep(0.15, 0.85, spiral_bands * 0.6 + n_storm * 0.5)

    # Cyclone Eye Center (Deep violet-cyan void inside eye)
    eye_hole = smoothstep(30, 80, r_eye)
    eye_rim = np.exp(-((r_eye - 85) ** 2) / (25 ** 2))

    # Palette: Deep Violet (#311B92), Electric Indigo (#6200EA), Storm Cyan (#00E5FF), Hyper-White
    p_r = 45.0 + 75.0 * storm_clouds + eye_rim * 80.0
    p_g = 25.0 + 85.0 * storm_clouds + eye_rim * 140.0
    p_b = 95.0 + 135.0 * storm_clouds + eye_rim * 160.0

    # 3D Limb Darkening & Lighting
    limb_dark = (norm_z ** 0.52)
    surface_r = p_r * (0.12 + 0.88 * term) * (0.35 + 0.65 * limb_dark)
    surface_g = p_g * (0.12 + 0.88 * term) * (0.35 + 0.65 * limb_dark)
    surface_b = p_b * (0.12 + 0.88 * term) * (0.35 + 0.65 * limb_dark)

    # Rayleigh Atmospheric Scattering Rim
    sunward_edge = np.clip(-dx * lx - dy * ly, 0, r_planet) / r_planet
    atmo_arc = smoothstep(r_planet - 16, r_planet, dist_planet) * smoothstep(r_planet + 14, r_planet, dist_planet)
    atmo_glow = atmo_arc * (sunward_edge ** 1.6)

    # Blend Planet
    p_alpha = smoothstep(r_planet + 1.5, r_planet - 1.5, dist_planet)[:, :, np.newaxis]
    planet_rgb = np.stack([surface_r, surface_g, surface_b], axis=-1)
    rgb = rgb * (1.0 - p_alpha) + planet_rgb * p_alpha

    # Add Rayleigh arc
    rgb[:, :, 0] += atmo_glow * 110.0
    rgb[:, :, 1] += atmo_glow * 210.0
    rgb[:, :, 2] += atmo_glow * 255.0

    base_img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), mode="RGB").convert("RGBA")

    # 4. Branching High-Voltage Electrical Lightning Arcs
    fx_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(fx_layer)

    # Recursive branching lightning generator
    def draw_lightning_bolt(draw, p_start, p_end, depth=4, col=(200, 245, 255, 240), w=2):
        if depth == 0:
            draw.line([p_start, p_end], fill=col, width=w)
            return
        mx = (p_start[0] + p_end[0]) * 0.5 + rng.randn() * (18.0 * depth)
        my = (p_start[1] + p_end[1]) * 0.5 + rng.randn() * (18.0 * depth)
        mid = (mx, my)
        draw_lightning_bolt(draw, p_start, mid, depth - 1, col, w)
        draw_lightning_bolt(draw, mid, p_end, depth - 1, col, w)
        # Fork branch
        if rng.rand() > 0.4 and depth > 1:
            fork_end = (mx + rng.randn() * 35, my + rng.randn() * 35)
            draw_lightning_bolt(draw, mid, fork_end, depth - 2, (160, 230, 255, 180), max(1, w - 1))

    # 12 major lightning super-strikes across the storm disc
    for _ in range(12):
        ang_l = rng.uniform(0, 2 * math.pi)
        r_l1 = rng.uniform(40, r_planet - 90)
        r_l2 = r_l1 + rng.uniform(60, 160)
        p1 = (cx + r_l1 * math.cos(ang_l), cy + r_l1 * math.sin(ang_l))
        p2 = (cx + r_l2 * math.cos(ang_l + rng.uniform(-0.4, 0.4)), cy + r_l2 * math.sin(ang_l + rng.uniform(-0.4, 0.4)))
        draw_lightning_bolt(fdraw, p1, p2, depth=4, col=(220, 250, 255, 255), w=2)
        # Core flash at lightning root
        fdraw.ellipse([p1[0] - 8, p1[1] - 8, p1[0] + 8, p1[1] + 8], fill=(255, 255, 255, 200))

    # Cyclonic Eye Center Flare & Ambient Flares
    beacons = [
        (eye_x, eye_y, 48, (180, 240, 255), 6, 0.0), # Eye core
        (cx + 160, cy - 140, 38, (200, 220, 255), 4, 0.3),
        (cx - 180, cy + 160, 42, (160, 240, 255), 4, 0.1),
        (150, 210, 28, (180, 210, 255), 4, 0.4),
        (870, 800, 32, (190, 230, 255), 4, 0.2),
    ]
    for bx, by, frad, fcol, fsp, fang in beacons:
        fdraw.ellipse([bx - frad * 0.5, by - frad * 0.5, bx + frad * 0.5, by + frad * 0.5], fill=(fcol[0], fcol[1], fcol[2], 85))
        draw_diffraction_flare(fdraw, bx, by, frad, (fcol[0], fcol[1], fcol[2], 230), spikes=fsp, angle_offset=fang, width=2)

    # Multi-Stage Neon Bloom
    fx_blur = fx_layer.filter(ImageFilter.GaussianBlur(3.0))
    fx_wide = fx_layer.filter(ImageFilter.GaussianBlur(14.0))

    composite = Image.alpha_composite(base_img, fx_wide)
    composite = Image.alpha_composite(composite, fx_blur)
    composite = Image.alpha_composite(composite, fx_layer)

    # Post-Processing
    final_rgb = composite.convert("RGB")
    final_rgb = ImageEnhance.Contrast(final_rgb).enhance(1.16)
    final_rgb = ImageEnhance.Color(final_rgb).enhance(1.22)
    final_rgb = ImageEnhance.Sharpness(final_rgb).enhance(1.10)

    print(f"tempest.jpg generated successfully: {final_rgb.size}")
    return final_rgb

# -------------------------------------------------------------------------
# Asset 28: Planet Vespera (1024 x 1024)
# Twilight Bioluminescent Fungi Forest: ethereal perpetual twilight,
# glowing indigo-magenta spore canopies, luminescent mycelial rivers.
# -------------------------------------------------------------------------

def generate_vespera_planet(width=1024, height=1024, seed=2802):
    print(f"Generating vespera.jpg ({width}x{height})...")
    rng = np.random.RandomState(seed)
    cx, cy = width // 2, height // 2
    r_planet = 355.0

    # 1. Background Void with Twilight Spore Dust Haze
    y_coords, x_coords = np.mgrid[0:height, 0:width]
    dist_c = np.sqrt(((x_coords - cx) / 512.0) ** 2 + ((y_coords - cy) / 512.0) ** 2)

    bg_r = np.clip(14 + 18 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    bg_g = np.clip(3 + 6 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    bg_b = np.clip(18 + 28 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    rgb = np.stack([bg_r, bg_g, bg_b], axis=-1).astype(np.float32)

    # Ambient Bioluminescent Spore Clouds in Space
    n_spore = create_octave_noise(width, height, seed + 1, [(8, 8, 0.6), (16, 16, 0.3), (32, 32, 0.1)])
    spore_mask = smoothstep(0.28, 0.85, n_spore)
    rgb[:, :, 0] += spore_mask * 45.0
    rgb[:, :, 1] += spore_mask * 10.0
    rgb[:, :, 2] += spore_mask * 65.0

    # 2. Spherical Geometry & 3D Normal Mapping
    dx = x_coords - cx
    dy = y_coords - cy
    dist_planet = np.sqrt(dx ** 2 + dy ** 2)
    planet_mask = dist_planet <= r_planet

    z_sph = np.zeros_like(dist_planet)
    z_sph[planet_mask] = np.sqrt(r_planet ** 2 - dist_planet[planet_mask] ** 2)

    norm_x = np.zeros_like(dist_planet)
    norm_y = np.zeros_like(dist_planet)
    norm_z = np.zeros_like(dist_planet)
    norm_x[planet_mask] = dx[planet_mask] / r_planet
    norm_y[planet_mask] = dy[planet_mask] / r_planet
    norm_z[planet_mask] = z_sph[planet_mask] / r_planet

    # Low-angle Twilight Light Vector (Upper left: lx=-0.65, ly=-0.35, lz=0.67)
    lx, ly, lz = -0.65, -0.35, 0.67
    l_mag = math.sqrt(lx**2 + ly**2 + lz**2)
    lx, ly, lz = lx / l_mag, ly / l_mag, lz / l_mag
    dot_light = np.clip(norm_x * lx + norm_y * ly + norm_z * lz, 0.0, 1.0)
    # Deep twilight terminator
    term = smoothstep(0.0, 0.65, dot_light)

    # 3. Bioluminescent Fungi Canopy & Mycelial River Networks
    # Voronoi / cellular forest canopies
    num_canopy_centers = 40
    px = rng.uniform(-1.0, 1.0, num_canopy_centers)
    py = rng.uniform(-1.0, 1.0, num_canopy_centers)

    d1 = np.full_like(norm_x, 999.0)
    d2 = np.full_like(norm_x, 999.0)
    for i in range(num_canopy_centers):
        d_i = np.sqrt((norm_x - px[i]) ** 2 + (norm_y - py[i]) ** 2)
        closer = d_i < d1
        d2 = np.where(closer, d1, np.minimum(d2, d_i))
        d1 = np.where(closer, d_i, d1)

    # Canopy cluster centers (blobs) vs mycelial rivers (ridges)
    canopy_clusters = np.exp(-((d1) ** 2) / (0.16 ** 2))
    mycelial_rivers = smoothstep(0.05, 0.008, d2 - d1)

    # Modulate with fractal noise
    n_mycelium = create_octave_noise(width, height, seed + 10, [(16, 16, 0.5), (32, 32, 0.3), (64, 64, 0.15), (128, 128, 0.05)])
    mycelial_active = mycelial_rivers * (0.7 + 0.6 * n_mycelium)

    # Terrain base (Deep Indigo Twilight Crust)
    n_soil = create_octave_noise(width, height, seed + 20, [(20, 20, 0.6), (40, 40, 0.3), (80, 80, 0.1)])
    soil_r = 20.0 + 15.0 * n_soil
    soil_g = 8.0 + 10.0 * n_soil
    soil_b = 35.0 + 20.0 * n_soil

    # Bioluminescence Colors:
    # Canopy: Glowing Magenta / Orchid (#E040FB, #D500F9)
    # Mycelial Rivers: Electric Cyan / Jade (#00E5FF, #1DE9B6)
    bio_r = canopy_clusters * 230.0 + mycelial_active * 30.0
    bio_g = canopy_clusters * 50.0 + mycelial_active * 225.0
    bio_b = canopy_clusters * 250.0 + mycelial_active * 240.0

    # Terrain lighting with twilight
    limb_dark = (norm_z ** 0.52)
    surface_r = soil_r * (0.08 + 0.92 * term) * (0.35 + 0.65 * limb_dark)
    surface_g = soil_g * (0.08 + 0.92 * term) * (0.35 + 0.65 * limb_dark)
    surface_b = soil_b * (0.08 + 0.92 * term) * (0.35 + 0.65 * limb_dark)

    # Crucial: Bioluminescent fungal networks are SELF-LUMINOUS across both day and night hemispheres!
    surface_r = np.maximum(surface_r, bio_r)
    surface_g = np.maximum(surface_g, bio_g)
    surface_b = np.maximum(surface_b, bio_b)

    # Rayleigh Atmospheric Scattering Rim (Orchid/Violet limb)
    sunward_edge = np.clip(-dx * lx - dy * ly, 0, r_planet) / r_planet
    atmo_arc = smoothstep(r_planet - 15, r_planet, dist_planet) * smoothstep(r_planet + 13, r_planet, dist_planet)
    atmo_glow = atmo_arc * (sunward_edge ** 1.5)

    # Blend Planet
    p_alpha = smoothstep(r_planet + 1.5, r_planet - 1.5, dist_planet)[:, :, np.newaxis]
    planet_rgb = np.stack([surface_r, surface_g, surface_b], axis=-1)
    rgb = rgb * (1.0 - p_alpha) + planet_rgb * p_alpha

    # Add Atmospheric Rim
    rgb[:, :, 0] += atmo_glow * 190.0
    rgb[:, :, 1] += atmo_glow * 60.0
    rgb[:, :, 2] += atmo_glow * 255.0

    base_img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), mode="RGB").convert("RGBA")

    # 4. Phosphorescent Spore Clouds & Mycelial Flares
    fx_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(fx_layer)

    # Floating luminescent spore motes
    for _ in range(500):
        sx = rng.uniform(cx - r_planet * 1.15, cx + r_planet * 1.15)
        sy = rng.uniform(cy - r_planet * 1.15, cy + r_planet * 1.15)
        sz = rng.uniform(0.8, 2.4)
        c_pick = rng.rand()
        if c_pick < 0.6:
            col = (224, 64, 251, int(rng.uniform(70, 220))) # Magenta spore
        else:
            col = (0, 229, 255, int(rng.uniform(70, 220)))  # Cyan spore
        fdraw.ellipse([sx - sz, sy - sz, sx + sz, sy + sz], fill=col)

    # Major canopy phosphorescent beacons
    canopy_flares = [
        (cx - 100, cy - 70, 42, (230, 80, 255), 4, 0.0),
        (cx + 120, cy + 90, 40, (0, 240, 255), 4, 0.3),
        (cx - 70, cy + 130, 36, (240, 90, 255), 4, 0.1),
        (160, 210, 28, (210, 80, 255), 4, 0.4),
        (870, 790, 32, (180, 100, 255), 4, 0.2),
    ]
    for bx, by, frad, fcol, fsp, fang in canopy_flares:
        fdraw.ellipse([bx - frad * 0.5, by - frad * 0.5, bx + frad * 0.5, by + frad * 0.5], fill=(fcol[0], fcol[1], fcol[2], 85))
        draw_diffraction_flare(fdraw, bx, by, frad, (fcol[0], fcol[1], fcol[2], 230), spikes=fsp, angle_offset=fang, width=2)

    # Multi-Stage Neon Bloom
    fx_blur = fx_layer.filter(ImageFilter.GaussianBlur(3.0))
    fx_wide = fx_layer.filter(ImageFilter.GaussianBlur(14.0))

    composite = Image.alpha_composite(base_img, fx_wide)
    composite = Image.alpha_composite(composite, fx_blur)
    composite = Image.alpha_composite(composite, fx_layer)

    # Post-Processing
    final_rgb = composite.convert("RGB")
    final_rgb = ImageEnhance.Contrast(final_rgb).enhance(1.15)
    final_rgb = ImageEnhance.Color(final_rgb).enhance(1.22)
    final_rgb = ImageEnhance.Sharpness(final_rgb).enhance(1.10)

    print(f"vespera.jpg generated successfully: {final_rgb.size}")
    return final_rgb

# -------------------------------------------------------------------------
# Main Execution: Generate and save assets
# -------------------------------------------------------------------------

if __name__ == "__main__":
    # Ensure directories
    os.makedirs("src/assets/planets", exist_ok=True)
    os.makedirs("public/assets/planets", exist_ok=True)
    os.makedirs("dist/assets/planets", exist_ok=True)

    # 1. Asset 27: tempest.jpg (1024 x 1024)
    tempest_img = generate_tempest_planet(1024, 1024, seed=2701)
    assert tempest_img.size == (1024, 1024), f"Dimension mismatch: expected (1024, 1024), got {tempest_img.size}"
    tempest_path = "src/assets/planets/tempest.jpg"
    tempest_img.save(tempest_path, format="JPEG", quality=96, subsampling=0)
    print(f"Saved {tempest_path} ({os.path.getsize(tempest_path)} bytes)")

    # 2. Asset 28: vespera.jpg (1024 x 1024)
    vespera_img = generate_vespera_planet(1024, 1024, seed=2802)
    assert vespera_img.size == (1024, 1024), f"Dimension mismatch: expected (1024, 1024), got {vespera_img.size}"
    vespera_path = "src/assets/planets/vespera.jpg"
    vespera_img.save(vespera_path, format="JPEG", quality=96, subsampling=0)
    print(f"Saved {vespera_path} ({os.path.getsize(vespera_path)} bytes)")

    # 3. Mirror to public/assets/planets/ and dist/assets/planets/
    targets = [
        ("src/assets/planets/tempest.jpg", ["public/assets/planets/tempest.jpg", "dist/assets/planets/tempest.jpg"]),
        ("src/assets/planets/vespera.jpg", ["public/assets/planets/vespera.jpg", "dist/assets/planets/vespera.jpg"]),
    ]
    for src, dests in targets:
        for dest in dests:
            shutil.copyfile(src, dest)
            print(f"Mirrored {src} -> {dest}")

    print("Batch 5 planet generation and mirroring complete!")
