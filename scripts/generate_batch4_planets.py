"""
High-Fidelity Procedural Art Synthesis for Spark Panic: Planetary Invasion Defense
Batch 4 Asset 21 (nebulon.jpg) & Asset 22 (obsidian.jpg)
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
# Asset 21: Planet Nebulon (1024 x 1024)
# Gaseous Emerald Star Cradle: ionized jade and teal nebula filaments,
# newborn protostars, glowing space dust.
# -------------------------------------------------------------------------

def generate_nebulon_planet(width=1024, height=1024, seed=2101):
    print(f"Generating nebulon.jpg ({width}x{height})...")
    rng = np.random.RandomState(seed)
    cx, cy = width // 2, height // 2
    r_planet = 355.0

    # 1. Background Deep Void & Emerald Stardust
    y_coords, x_coords = np.mgrid[0:height, 0:width]
    dist_c = np.sqrt(((x_coords - cx) / 512.0) ** 2 + ((y_coords - cy) / 512.0) ** 2)

    bg_r = np.clip(2 + 5 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    bg_g = np.clip(10 + 25 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    bg_b = np.clip(8 + 18 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    rgb = np.stack([bg_r, bg_g, bg_b], axis=-1).astype(np.float32)

    # Background Emerald/Teal Nebula Veils
    n_veil = create_octave_noise(width, height, seed + 1, [(8, 8, 0.6), (16, 16, 0.3), (32, 32, 0.1)])
    veil_mask = smoothstep(0.25, 0.85, n_veil)
    rgb[:, :, 0] += veil_mask * 10.0
    rgb[:, :, 1] += veil_mask * 85.0
    rgb[:, :, 2] += veil_mask * 65.0

    # 2. Spherical Planet Geometry & 3D Normal Mapping
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

    # 3. Gaseous Emerald Star Cradle Surface Patterns
    # Multi-octave domain warping for ionized fluid eddies
    warp_x = create_octave_noise(width, height, seed + 10, [(10, 10, 0.6), (20, 20, 0.3), (40, 40, 0.1)]) * 70.0
    warp_y = create_octave_noise(width, height, seed + 11, [(10, 10, 0.6), (20, 20, 0.3), (40, 40, 0.1)]) * 45.0

    nx_w = norm_x + warp_x / 360.0
    ny_w = norm_y + warp_y / 360.0

    # Swirling gas streams & ionization ribbons
    gas_whorl = 0.5 + 0.5 * np.sin(ny_w * 22.0 + nx_w * 12.0)
    n_jade = create_octave_noise(width, height, seed + 20, [(16, 16, 0.5), (32, 32, 0.3), (64, 64, 0.15), (128, 128, 0.05)])
    gas_final = smoothstep(0.12, 0.88, gas_whorl * 0.65 + n_jade * 0.5)

    # Protostar Birth Nests (concentrated glowing cores along gas ridges)
    n_cores = create_octave_noise(width, height, seed + 30, [(24, 24, 0.7), (48, 48, 0.3)])
    proto_mask = smoothstep(0.68, 0.95, n_cores) * smoothstep(0.2, 0.8, gas_final)

    # Palette: Ionized Jade, Radiant Emerald, Deep Forest Abyss, Silver-Cyan
    p_r = 15.0 + 45.0 * gas_final + proto_mask * 190.0
    p_g = 120.0 + 125.0 * gas_final + proto_mask * 135.0
    p_b = 85.0 + 85.0 * gas_final + proto_mask * 180.0

    # 3D Limb Darkening & Lighting
    limb_dark = (norm_z ** 0.54)
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

    # Add Rayleigh limb arc
    rgb[:, :, 0] += atmo_glow * 60.0
    rgb[:, :, 1] += atmo_glow * 255.0
    rgb[:, :, 2] += atmo_glow * 210.0

    base_img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), mode="RGB").convert("RGBA")

    # 4. Newborn Protostars & Starlight Flares
    fx_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(fx_layer)

    # Protostars inside the planet cradle and background flares
    protostars = [
        (cx - 120, cy - 80, 44, (180, 255, 230), 6, 0.0),
        (cx + 80, cy - 140, 38, (140, 255, 200), 4, 0.2),
        (cx - 60, cy + 110, 42, (200, 255, 240), 4, 0.4),
        (cx + 140, cy + 60, 36, (120, 250, 210), 4, 0.1),
        (160, 200, 30, (140, 240, 200), 4, 0.3),
        (860, 810, 32, (160, 255, 220), 4, 0.15),
        (820, 220, 28, (150, 245, 210), 4, 0.5),
    ]
    for bx, by, frad, fcol, fsp, fang in beacons if 'beacons' in locals() else protostars:
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

    print(f"nebulon.jpg generated successfully: {final_rgb.size}")
    return final_rgb

# -------------------------------------------------------------------------
# Asset 22: Planet Obsidian (1024 x 1024)
# Volcanic Basalt & Magma Caverns: dark basalt tectonic plates,
# glowing magma rivers, incandescent cinder plumes.
# -------------------------------------------------------------------------

def generate_obsidian_planet(width=1024, height=1024, seed=2202):
    print(f"Generating obsidian.jpg ({width}x{height})...")
    rng = np.random.RandomState(seed)
    cx, cy = width // 2, height // 2
    r_planet = 355.0

    # 1. Background Void with Ember Sparks & Volcanic Ash Haze
    y_coords, x_coords = np.mgrid[0:height, 0:width]
    dist_c = np.sqrt(((x_coords - cx) / 512.0) ** 2 + ((y_coords - cy) / 512.0) ** 2)

    bg_r = np.clip(16 + 22 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    bg_g = np.clip(6 + 8 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    bg_b = np.clip(4 + 6 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    rgb = np.stack([bg_r, bg_g, bg_b], axis=-1).astype(np.float32)

    # Background volcanic ash smoke
    n_ash = create_octave_noise(width, height, seed + 1, [(8, 8, 0.6), (16, 16, 0.3), (32, 32, 0.1)])
    ash_mask = smoothstep(0.3, 0.85, n_ash)
    rgb[:, :, 0] += ash_mask * 40.0
    rgb[:, :, 1] += ash_mask * 12.0
    rgb[:, :, 2] += ash_mask * 8.0

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

    # Sunward Light Vector (Upper left: lx=-0.6, ly=-0.45, lz=0.66)
    lx, ly, lz = -0.60, -0.45, 0.66
    l_mag = math.sqrt(lx**2 + ly**2 + lz**2)
    lx, ly, lz = lx / l_mag, ly / l_mag, lz / l_mag
    dot_light = np.clip(norm_x * lx + norm_y * ly + norm_z * lz, 0.0, 1.0)
    term = smoothstep(0.0, 0.70, dot_light)

    # 3. Basalt Tectonic Plates & Glowing Magma Fissure Network
    # Voronoi/cellular plate simulation using distance to random feature points
    num_plate_centers = 36
    px = rng.uniform(-1.0, 1.0, num_plate_centers)
    py = rng.uniform(-1.0, 1.0, num_plate_centers)

    # Compute distance to closest and second closest plate centers
    d1 = np.full_like(norm_x, 999.0)
    d2 = np.full_like(norm_x, 999.0)
    for i in range(num_plate_centers):
        d_i = np.sqrt((norm_x - px[i]) ** 2 + (norm_y - py[i]) ** 2)
        closer = d_i < d1
        d2 = np.where(closer, d1, np.minimum(d2, d_i))
        d1 = np.where(closer, d_i, d1)

    # Ridge boundary between tectonic plates (magma fissure line)
    fissure_dist = d2 - d1
    # Modulate fissure with fractal turbulence
    n_magma = create_octave_noise(width, height, seed + 10, [(16, 16, 0.5), (32, 32, 0.3), (64, 64, 0.15), (128, 128, 0.05)])
    fissure_intensity = smoothstep(0.065 + 0.03 * n_magma, 0.005, fissure_dist)

    # Major Volcanic Calderas (Hot spots)
    num_calderas = 8
    cx_cal = rng.uniform(-0.7, 0.7, num_calderas)
    cy_cal = rng.uniform(-0.7, 0.7, num_calderas)
    caldera_mask = np.zeros_like(norm_x)
    for ci in range(num_calderas):
        d_cal = np.sqrt((norm_x - cx_cal[ci]) ** 2 + (norm_y - cy_cal[ci]) ** 2)
        caldera_mask += np.exp(-((d_cal) ** 2) / (0.09 ** 2))
    caldera_mask = np.clip(caldera_mask, 0, 1.5)

    # Combine total magma thermal glow
    total_magma = np.clip(fissure_intensity * 1.4 + caldera_mask * 1.2, 0, 2.0)

    # Basalt Plate Texture (Dark Charcoal & Obsidian)
    n_basalt = create_octave_noise(width, height, seed + 20, [(24, 24, 0.6), (48, 48, 0.3), (96, 96, 0.1)])
    basalt_r = 28.0 + 20.0 * n_basalt
    basalt_g = 22.0 + 15.0 * n_basalt
    basalt_b = 24.0 + 15.0 * n_basalt

    # Magma Color Gradient (Core white-yellow -> Molten orange -> Deep lava red)
    magma_r = np.clip(total_magma * 255.0, 0, 255)
    magma_g = np.clip(total_magma * 135.0, 0, 255)
    magma_b = np.clip(smoothstep(0.7, 1.4, total_magma) * 160.0, 0, 255)

    # Basalt surface lighting (sunward + ambient)
    limb_dark = (norm_z ** 0.52)
    surface_r = basalt_r * (0.08 + 0.92 * term) * (0.35 + 0.65 * limb_dark)
    surface_g = basalt_g * (0.08 + 0.92 * term) * (0.35 + 0.65 * limb_dark)
    surface_b = basalt_b * (0.08 + 0.92 * term) * (0.35 + 0.65 * limb_dark)

    # Crucial feature: Magma is SELF-LUMINOUS, glowing even on the night hemisphere!
    surface_r = np.maximum(surface_r, magma_r)
    surface_g = np.maximum(surface_g, magma_g)
    surface_b = np.maximum(surface_b, magma_b)

    # Rayleigh/Volcanic Atmospheric Scattering Rim (Crimson/Solar limb)
    sunward_edge = np.clip(-dx * lx - dy * ly, 0, r_planet) / r_planet
    atmo_arc = smoothstep(r_planet - 15, r_planet, dist_planet) * smoothstep(r_planet + 13, r_planet, dist_planet)
    atmo_glow = atmo_arc * (sunward_edge ** 1.5)

    # Blend Planet
    p_alpha = smoothstep(r_planet + 1.5, r_planet - 1.5, dist_planet)[:, :, np.newaxis]
    planet_rgb = np.stack([surface_r, surface_g, surface_b], axis=-1)
    rgb = rgb * (1.0 - p_alpha) + planet_rgb * p_alpha

    # Add Volcanic Limb Glow
    rgb[:, :, 0] += atmo_glow * 255.0
    rgb[:, :, 1] += atmo_glow * 65.0
    rgb[:, :, 2] += atmo_glow * 25.0

    base_img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), mode="RGB").convert("RGBA")

    # 4. Caldera Incandescent Flares & Ember Sparks
    fx_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(fx_layer)

    # Caldera thermal flares
    for ci in range(num_calderas):
        # Map normal coord to screen coord
        scx = cx + cx_cal[ci] * r_planet
        scy = cy + cy_cal[ci] * r_planet
        if math.hypot(scx - cx, scy - cy) < r_planet - 20:
            draw_diffraction_flare(fdraw, scx, scy, 36, (255, 120, 30), spikes=4, angle_offset=ci * 0.4, width=2)

    # Drifting incandescent cinder motes
    for _ in range(400):
        ex = rng.uniform(cx - r_planet * 1.2, cx + r_planet * 1.2)
        ey = rng.uniform(cy - r_planet * 1.2, cy + r_planet * 1.2)
        sz = rng.uniform(0.8, 2.2)
        e_alpha = int(rng.uniform(60, 220))
        fdraw.ellipse([ex - sz, ey - sz, ex + sz, ey + sz], fill=(255, 140, 20, e_alpha))

    # Multi-Stage Neon Bloom
    fx_blur = fx_layer.filter(ImageFilter.GaussianBlur(3.0))
    fx_wide = fx_layer.filter(ImageFilter.GaussianBlur(14.0))

    composite = Image.alpha_composite(base_img, fx_wide)
    composite = Image.alpha_composite(composite, fx_blur)
    composite = Image.alpha_composite(composite, fx_layer)

    # Post-Processing
    final_rgb = composite.convert("RGB")
    final_rgb = ImageEnhance.Contrast(final_rgb).enhance(1.18)
    final_rgb = ImageEnhance.Color(final_rgb).enhance(1.22)
    final_rgb = ImageEnhance.Sharpness(final_rgb).enhance(1.10)

    print(f"obsidian.jpg generated successfully: {final_rgb.size}")
    return final_rgb

# -------------------------------------------------------------------------
# Main Execution: Generate and save assets
# -------------------------------------------------------------------------

if __name__ == "__main__":
    # Ensure directories
    os.makedirs("src/assets/planets", exist_ok=True)
    os.makedirs("public/assets/planets", exist_ok=True)
    os.makedirs("dist/assets/planets", exist_ok=True)

    # 1. Asset 21: nebulon.jpg (1024 x 1024)
    nebulon_img = generate_nebulon_planet(1024, 1024, seed=2101)
    assert nebulon_img.size == (1024, 1024), f"Dimension mismatch: expected (1024, 1024), got {nebulon_img.size}"
    nebulon_path = "src/assets/planets/nebulon.jpg"
    nebulon_img.save(nebulon_path, format="JPEG", quality=96, subsampling=0)
    print(f"Saved {nebulon_path} ({os.path.getsize(nebulon_path)} bytes)")

    # 2. Asset 22: obsidian.jpg (1024 x 1024)
    obsidian_img = generate_obsidian_planet(1024, 1024, seed=2202)
    assert obsidian_img.size == (1024, 1024), f"Dimension mismatch: expected (1024, 1024), got {obsidian_img.size}"
    obsidian_path = "src/assets/planets/obsidian.jpg"
    obsidian_img.save(obsidian_path, format="JPEG", quality=96, subsampling=0)
    print(f"Saved {obsidian_path} ({os.path.getsize(obsidian_path)} bytes)")

    # 3. Mirror to public/assets/planets/ and dist/assets/planets/
    targets = [
        ("src/assets/planets/nebulon.jpg", ["public/assets/planets/nebulon.jpg", "dist/assets/planets/nebulon.jpg"]),
        ("src/assets/planets/obsidian.jpg", ["public/assets/planets/obsidian.jpg", "dist/assets/planets/obsidian.jpg"]),
    ]
    for src, dests in targets:
        for dest in dests:
            shutil.copyfile(src, dest)
            print(f"Mirrored {src} -> {dest}")

    print("Batch 4 planet generation and mirroring complete!")
