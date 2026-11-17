"""
High-Fidelity Procedural Art Synthesis for Spark Panic: Planetary Invasion Defense
Batch 3 Asset 15 (chronos.jpg) & Asset 16 (cygnus.jpg)
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
# Asset 15: Planet Chronos (1024 x 1024)
# Temporal Gravitational Distortion: golden relativistic warp rings,
# temporal anomaly vortex, amber energy flares.
# -------------------------------------------------------------------------

def generate_chronos_planet(width=1024, height=1024, seed=1501):
    print(f"Generating chronos.jpg ({width}x{height})...")
    rng = np.random.RandomState(seed)
    cx, cy = width // 2, height // 2
    r_planet = 345.0

    # 1. Background Void & Ambient Amber/Obsidian Dust
    y_coords, x_coords = np.mgrid[0:height, 0:width]
    dist_c = np.sqrt(((x_coords - cx) / 512.0) ** 2 + ((y_coords - cy) / 512.0) ** 2)

    bg_r = np.clip(10 + 16 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    bg_g = np.clip(6 + 10 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    bg_b = np.clip(2 + 4 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    rgb = np.stack([bg_r, bg_g, bg_b], axis=-1).astype(np.float32)

    # Background ambient stardust
    n_dust = create_octave_noise(width, height, seed + 1, [(8, 8, 0.6), (16, 16, 0.3), (32, 32, 0.1)])
    dust_mask = smoothstep(0.2, 0.9, n_dust)
    rgb[:, :, 0] += dust_mask * 45.0
    rgb[:, :, 1] += dust_mask * 28.0
    rgb[:, :, 2] += dust_mask * 5.0

    # 2. Relativistic Warp Ring System Geometry Setup
    # Ring tilt angle = -22 degrees (-0.38 radians)
    tilt = -0.38
    cos_t, sin_t = math.cos(tilt), math.sin(tilt)
    rx = (x_coords - cx) * cos_t + (y_coords - cy) * sin_t
    ry = -(x_coords - cx) * sin_t + (y_coords - cy) * cos_t
    r_ring = np.sqrt(rx ** 2 + (ry * 3.2) ** 2)

    # Ring Profile (inner 370px, outer 505px, with Cassini Division gap at 435px)
    ring_band1 = np.exp(-((r_ring - 405) ** 2) / (25 ** 2))
    ring_band2 = np.exp(-((r_ring - 475) ** 2) / (22 ** 2))
    cassini_gap = 1.0 - np.exp(-((r_ring - 438) ** 2) / (7 ** 2))
    ring_density = (ring_band1 * 1.4 + ring_band2 * 1.1) * cassini_gap
    ring_density = np.clip(ring_density, 0, 1.8)

    # Ring noise filaments
    n_ring = create_octave_noise(width, height, seed + 2, [(32, 32, 0.7), (64, 64, 0.3)])
    ring_tex = ring_density * (0.8 + 0.35 * n_ring)

    # 3. Back Rings (behind planet: ry > 0 relative to tilted plane)
    dx = x_coords - cx
    dy = y_coords - cy
    dist_planet = np.sqrt(dx ** 2 + dy ** 2)
    behind_mask = (ry > 0) & (dist_planet >= r_planet - 2)

    rgb[:, :, 0] += behind_mask * ring_tex * 240.0
    rgb[:, :, 1] += behind_mask * ring_tex * 180.0
    rgb[:, :, 2] += behind_mask * ring_tex * 30.0

    # 4. Spherical Planet Surface Generation
    planet_mask = dist_planet <= r_planet
    z_sph = np.zeros_like(dist_planet)
    z_sph[planet_mask] = np.sqrt(r_planet ** 2 - dist_planet[planet_mask] ** 2)

    # 3D Normal Mapping
    norm_x = np.zeros_like(dist_planet)
    norm_y = np.zeros_like(dist_planet)
    norm_z = np.zeros_like(dist_planet)
    norm_x[planet_mask] = dx[planet_mask] / r_planet
    norm_y[planet_mask] = dy[planet_mask] / r_planet
    norm_z[planet_mask] = z_sph[planet_mask] / r_planet

    # Dynamic Sunward Lighting (Light source: upper left lx=-0.55, ly=-0.5, lz=0.67)
    lx, ly, lz = -0.55, -0.50, 0.67
    l_mag = math.sqrt(lx**2 + ly**2 + lz**2)
    lx, ly, lz = lx / l_mag, ly / l_mag, lz / l_mag
    dot_light = np.clip(norm_x * lx + norm_y * ly + norm_z * lz, 0.0, 1.0)
    # Day-night terminator gradient
    term = smoothstep(0.0, 0.75, dot_light)

    # Temporal Anomaly Vortex & Harmonic Distortion Whorls
    # Polar vortex at (cx - 80, cy - 60)
    vx, vy = cx - 80, cy - 60
    ang_vortex = np.arctan2(y_coords - vy, x_coords - vx)
    r_vortex = np.sqrt((x_coords - vx) ** 2 + (y_coords - vy) ** 2)
    # Logarithmic swirl coordinates
    swirl_x = x_coords + 45.0 * np.sin(ang_vortex * 3.0 + r_vortex / 28.0)
    swirl_y = y_coords + 45.0 * np.cos(ang_vortex * 3.0 + r_vortex / 28.0)

    n_chrono1 = create_octave_noise(width, height, seed + 10, [(16, 16, 0.5), (32, 32, 0.3), (64, 64, 0.15), (128, 128, 0.05)])
    n_chrono2 = create_octave_noise(width, height, seed + 20, [(12, 12, 0.6), (24, 24, 0.3), (48, 48, 0.1)])

    # Harmonic distortion wave bands
    wave_bands = 0.5 + 0.5 * np.sin(norm_y * 18.0 + n_chrono1 * 4.0)
    time_dilation_core = np.exp(-((r_vortex - 60) ** 2) / (45 ** 2))

    # Surface Color Composite (Amber/Gold/Obsidian)
    p_r = 180.0 * wave_bands + 70.0 * n_chrono2 + time_dilation_core * 120.0
    p_g = 120.0 * wave_bands + 40.0 * n_chrono2 + time_dilation_core * 90.0
    p_b = 15.0 * wave_bands + 5.0 * n_chrono2 + time_dilation_core * 10.0

    # 3D Limb Darkening (astronomical perimeter falloff)
    limb_dark = (norm_z ** 0.55)
    # Combine with sunward lighting
    surface_r = p_r * (0.15 + 0.85 * term) * (0.35 + 0.65 * limb_dark)
    surface_g = p_g * (0.15 + 0.85 * term) * (0.35 + 0.65 * limb_dark)
    surface_b = p_b * (0.15 + 0.85 * term) * (0.35 + 0.65 * limb_dark)

    # Rayleigh Atmospheric Scattering Arc (Glowing golden limb on sunward side)
    sunward_edge = np.clip(-dx * lx - dy * ly, 0, r_planet) / r_planet
    atmo_arc = smoothstep(r_planet - 16, r_planet, dist_planet) * smoothstep(r_planet + 12, r_planet, dist_planet)
    atmo_glow = atmo_arc * (sunward_edge ** 1.5)

    # Blend surface onto canvas
    p_alpha = smoothstep(r_planet + 1.5, r_planet - 1.5, dist_planet)[:, :, np.newaxis]
    planet_rgb = np.stack([surface_r, surface_g, surface_b], axis=-1)
    rgb = rgb * (1.0 - p_alpha) + planet_rgb * p_alpha

    # Add atmospheric scattering rim
    rgb[:, :, 0] += atmo_glow * 255.0
    rgb[:, :, 1] += atmo_glow * 200.0
    rgb[:, :, 2] += atmo_glow * 50.0

    # 5. Front Rings (in front of planet: ry <= 0)
    front_mask = (ry <= 0)
    # Ring shadow on planet: where rings cast shadow onto planet surface
    # Ring plane projection
    r_front_tex = front_mask * ring_tex
    rgb[:, :, 0] += r_front_tex * 245.0
    rgb[:, :, 1] += r_front_tex * 185.0
    rgb[:, :, 2] += r_front_tex * 35.0

    # Convert to PIL
    base_img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), mode="RGB").convert("RGBA")

    # 6. Relativistic Energy Flares & Starlight Beacons
    fx_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(fx_layer)

    # Golden starlight beacons at ring ansae and vortex core
    beacons = [
        (cx - 390, cy + 155, 45, (255, 215, 0), 4, 0.0), # Left ring ansa
        (cx + 410, cy - 165, 48, (255, 230, 80), 4, 0.3), # Right ring ansa
        (vx, vy, 40, (255, 245, 180), 6, 0.1),            # Vortex core
        (140, 180, 26, (255, 200, 50), 4, 0.2),
        (880, 820, 30, (255, 220, 100), 4, 0.4),
        (820, 210, 28, (255, 210, 60), 4, 0.15),
    ]
    for bx, by, frad, fcol, fsp, fang in beacons:
        fdraw.ellipse([bx - frad * 0.5, by - frad * 0.5, bx + frad * 0.5, by + frad * 0.5], fill=(fcol[0], fcol[1], fcol[2], 85))
        draw_diffraction_flare(fdraw, bx, by, frad, (fcol[0], fcol[1], fcol[2], 230), spikes=fsp, angle_offset=fang, width=2)

    # Temporal Anomaly Ring Ticks / Reticles
    for a_deg in range(0, 360, 30):
        a_rad = math.radians(a_deg)
        tx = cx + 470 * math.cos(a_rad) * cos_t - (470 / 3.2) * math.sin(a_rad) * sin_t
        ty = cy + 470 * math.cos(a_rad) * sin_t + (470 / 3.2) * math.sin(a_rad) * cos_t
        fdraw.ellipse([tx - 3, ty - 3, tx + 3, ty + 3], fill=(255, 215, 0, 200))

    # Multi-Stage Neon Bloom
    fx_blur = fx_layer.filter(ImageFilter.GaussianBlur(3.0))
    fx_wide = fx_layer.filter(ImageFilter.GaussianBlur(14.0))

    composite = Image.alpha_composite(base_img, fx_wide)
    composite = Image.alpha_composite(composite, fx_blur)
    composite = Image.alpha_composite(composite, fx_layer)

    # Post-Processing
    final_rgb = composite.convert("RGB")
    final_rgb = ImageEnhance.Contrast(final_rgb).enhance(1.15)
    final_rgb = ImageEnhance.Color(final_rgb).enhance(1.20)
    final_rgb = ImageEnhance.Sharpness(final_rgb).enhance(1.10)

    print(f"chronos.jpg generated successfully: {final_rgb.size}")
    return final_rgb

# -------------------------------------------------------------------------
# Asset 16: Planet Cygnus (1024 x 1024)
# Cyan Stellar Giant with Ring System: luminous starlight whorls,
# delicate silver-cyan particle rings.
# -------------------------------------------------------------------------

def generate_cygnus_planet(width=1024, height=1024, seed=1602):
    print(f"Generating cygnus.jpg ({width}x{height})...")
    rng = np.random.RandomState(seed)
    cx, cy = width // 2, height // 2
    r_planet = 350.0

    # 1. Background Void & Cyan/Electric Stardust
    y_coords, x_coords = np.mgrid[0:height, 0:width]
    dist_c = np.sqrt(((x_coords - cx) / 512.0) ** 2 + ((y_coords - cy) / 512.0) ** 2)

    bg_r = np.clip(3 + 8 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    bg_g = np.clip(10 + 24 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    bg_b = np.clip(18 + 48 * np.exp(-(dist_c ** 2) / 0.6), 0, 255)
    rgb = np.stack([bg_r, bg_g, bg_b], axis=-1).astype(np.float32)

    # Nebula Veil in Background
    n_veil = create_octave_noise(width, height, seed + 1, [(8, 8, 0.6), (16, 16, 0.3), (32, 32, 0.1)])
    veil_mask = smoothstep(0.25, 0.85, n_veil)
    rgb[:, :, 0] += veil_mask * 15.0
    rgb[:, :, 1] += veil_mask * 75.0
    rgb[:, :, 2] += veil_mask * 130.0

    # 2. Delicate Silver-Cyan Particle Ring Geometry
    # Ring tilt angle = +24 degrees (+0.42 radians)
    tilt = 0.42
    cos_t, sin_t = math.cos(tilt), math.sin(tilt)
    rx = (x_coords - cx) * cos_t + (y_coords - cy) * sin_t
    ry = -(x_coords - cx) * sin_t + (y_coords - cy) * cos_t
    r_ring = np.sqrt(rx ** 2 + (ry * 3.4) ** 2)

    # Multi-band fine particle rings (radius 380px to 510px)
    ring_band1 = np.exp(-((r_ring - 410) ** 2) / (18 ** 2))
    ring_band2 = np.exp(-((r_ring - 455) ** 2) / (15 ** 2))
    ring_band3 = np.exp(-((r_ring - 490) ** 2) / (16 ** 2))
    ring_gap1 = 1.0 - np.exp(-((r_ring - 435) ** 2) / (6 ** 2))
    ring_gap2 = 1.0 - np.exp(-((r_ring - 472) ** 2) / (5 ** 2))

    ring_density = (ring_band1 * 1.3 + ring_band2 * 1.4 + ring_band3 * 1.1) * ring_gap1 * ring_gap2
    n_ring = create_octave_noise(width, height, seed + 2, [(32, 32, 0.6), (64, 64, 0.4)])
    ring_tex = np.clip(ring_density * (0.85 + 0.3 * n_ring), 0, 1.8)

    # Back Rings (ry > 0, behind planet)
    dx = x_coords - cx
    dy = y_coords - cy
    dist_planet = np.sqrt(dx ** 2 + dy ** 2)
    behind_mask = (ry > 0) & (dist_planet >= r_planet - 2)

    rgb[:, :, 0] += behind_mask * ring_tex * 160.0
    rgb[:, :, 1] += behind_mask * ring_tex * 230.0
    rgb[:, :, 2] += behind_mask * ring_tex * 255.0

    # 3. Spherical Gas Giant Surface
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

    # Banded Jovian Jet Streams & Shimmering Starlight Whorls
    # Domain warping for fluid atmospheric shear
    warp_x = create_octave_noise(width, height, seed + 10, [(12, 12, 0.6), (24, 24, 0.3), (48, 48, 0.1)]) * 55.0
    warp_y = create_octave_noise(width, height, seed + 11, [(12, 12, 0.6), (24, 24, 0.3), (48, 48, 0.1)]) * 25.0

    ny_warped = norm_y + warp_y / 350.0
    # Alternating jet stream bands
    jet_bands = 0.5 + 0.5 * np.sin(ny_warped * 24.0)

    # Fine turbulent eddies
    n_eddy = create_octave_noise(width, height, seed + 20, [(20, 20, 0.5), (40, 40, 0.3), (80, 80, 0.2)])
    gas_pattern = smoothstep(0.1, 0.9, jet_bands * 0.7 + n_eddy * 0.5)

    # Starlight Oval Whorls (Anticyclonic storms, like Great Red Spot but electric cyan)
    storm_cx, storm_cy = cx - 110, cy + 90
    d_storm = np.sqrt(((x_coords - storm_cx) / 80.0) ** 2 + ((y_coords - storm_cy) / 45.0) ** 2)
    storm_whorl = np.exp(-(d_storm ** 2) / 0.5)

    # Color Palette: Brilliant Cyan (#00E5FF), Ice Blue (#A0E8FF), Deep Azure (#03045E), Silver (#E8F8FF)
    p_r = 10.0 + 80.0 * gas_pattern + storm_whorl * 120.0
    p_g = 130.0 + 110.0 * gas_pattern + storm_whorl * 125.0
    p_b = 200.0 + 55.0 * gas_pattern + storm_whorl * 55.0

    # 3D Limb Darkening & Lighting
    limb_dark = (norm_z ** 0.52)
    surface_r = p_r * (0.12 + 0.88 * term) * (0.35 + 0.65 * limb_dark)
    surface_g = p_g * (0.12 + 0.88 * term) * (0.35 + 0.65 * limb_dark)
    surface_b = p_b * (0.12 + 0.88 * term) * (0.35 + 0.65 * limb_dark)

    # Specular Glint & Rayleigh Atmospheric Scattering
    sunward_edge = np.clip(-dx * lx - dy * ly, 0, r_planet) / r_planet
    atmo_arc = smoothstep(r_planet - 15, r_planet, dist_planet) * smoothstep(r_planet + 14, r_planet, dist_planet)
    atmo_glow = atmo_arc * (sunward_edge ** 1.6)

    # Blend Planet
    p_alpha = smoothstep(r_planet + 1.5, r_planet - 1.5, dist_planet)[:, :, np.newaxis]
    planet_rgb = np.stack([surface_r, surface_g, surface_b], axis=-1)
    rgb = rgb * (1.0 - p_alpha) + planet_rgb * p_alpha

    # Add Rayleigh atmospheric glow
    rgb[:, :, 0] += atmo_glow * 140.0
    rgb[:, :, 1] += atmo_glow * 240.0
    rgb[:, :, 2] += atmo_glow * 255.0

    # 4. Front Rings (ry <= 0)
    front_mask = (ry <= 0)
    r_front_tex = front_mask * ring_tex
    rgb[:, :, 0] += r_front_tex * 180.0
    rgb[:, :, 1] += r_front_tex * 235.0
    rgb[:, :, 2] += r_front_tex * 255.0

    base_img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), mode="RGB").convert("RGBA")

    # 5. Starlight Beacons & Prismatic Glints
    fx_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(fx_layer)

    beacons = [
        (cx - 410, cy - 180, 48, (160, 235, 255), 4, 0.0), # Left ring ansa
        (cx + 420, cy + 185, 46, (180, 240, 255), 4, 0.3), # Right ring ansa
        (storm_cx, storm_cy, 38, (240, 255, 255), 6, 0.1), # Storm core
        (160, 840, 30, (140, 220, 255), 4, 0.2),
        (860, 160, 32, (180, 230, 255), 4, 0.4),
        (240, 210, 28, (150, 235, 255), 4, 0.15),
    ]
    for bx, by, frad, fcol, fsp, fang in beacons:
        fdraw.ellipse([bx - frad * 0.5, by - frad * 0.5, bx + frad * 0.5, by + frad * 0.5], fill=(fcol[0], fcol[1], fcol[2], 85))
        draw_diffraction_flare(fdraw, bx, by, frad, (fcol[0], fcol[1], fcol[2], 230), spikes=fsp, angle_offset=fang, width=2)

    # Particle rings orbital tick markers
    for a_deg in range(0, 360, 30):
        a_rad = math.radians(a_deg)
        tx = cx + 465 * math.cos(a_rad) * cos_t - (465 / 3.4) * math.sin(a_rad) * sin_t
        ty = cy + 465 * math.cos(a_rad) * sin_t + (465 / 3.4) * math.sin(a_rad) * cos_t
        fdraw.ellipse([tx - 2, ty - 2, tx + 2, ty + 2], fill=(200, 240, 255, 210))

    # Multi-Stage Neon Bloom
    fx_blur = fx_layer.filter(ImageFilter.GaussianBlur(3.0))
    fx_wide = fx_layer.filter(ImageFilter.GaussianBlur(14.0))

    composite = Image.alpha_composite(base_img, fx_wide)
    composite = Image.alpha_composite(composite, fx_blur)
    composite = Image.alpha_composite(composite, fx_layer)

    # Post-Processing
    final_rgb = composite.convert("RGB")
    final_rgb = ImageEnhance.Contrast(final_rgb).enhance(1.15)
    final_rgb = ImageEnhance.Color(final_rgb).enhance(1.20)
    final_rgb = ImageEnhance.Sharpness(final_rgb).enhance(1.10)

    print(f"cygnus.jpg generated successfully: {final_rgb.size}")
    return final_rgb

# -------------------------------------------------------------------------
# Main Execution: Generate and save assets
# -------------------------------------------------------------------------

if __name__ == "__main__":
    # Ensure directories
    os.makedirs("src/assets/planets", exist_ok=True)
    os.makedirs("public/assets/planets", exist_ok=True)
    os.makedirs("dist/assets/planets", exist_ok=True)

    # 1. Asset 15: chronos.jpg (1024 x 1024)
    chronos_img = generate_chronos_planet(1024, 1024, seed=1501)
    assert chronos_img.size == (1024, 1024), f"Dimension mismatch: expected (1024, 1024), got {chronos_img.size}"
    chronos_path = "src/assets/planets/chronos.jpg"
    chronos_img.save(chronos_path, format="JPEG", quality=96, subsampling=0)
    print(f"Saved {chronos_path} ({os.path.getsize(chronos_path)} bytes)")

    # 2. Asset 16: cygnus.jpg (1024 x 1024)
    cygnus_img = generate_cygnus_planet(1024, 1024, seed=1602)
    assert cygnus_img.size == (1024, 1024), f"Dimension mismatch: expected (1024, 1024), got {cygnus_img.size}"
    cygnus_path = "src/assets/planets/cygnus.jpg"
    cygnus_img.save(cygnus_path, format="JPEG", quality=96, subsampling=0)
    print(f"Saved {cygnus_path} ({os.path.getsize(cygnus_path)} bytes)")

    # 3. Mirror to public/assets/planets/ and dist/assets/planets/
    targets = [
        ("src/assets/planets/chronos.jpg", ["public/assets/planets/chronos.jpg", "dist/assets/planets/chronos.jpg"]),
        ("src/assets/planets/cygnus.jpg", ["public/assets/planets/cygnus.jpg", "dist/assets/planets/cygnus.jpg"]),
    ]
    for src, dests in targets:
        for dest in dests:
            shutil.copyfile(src, dest)
            print(f"Mirrored {src} -> {dest}")

    print("Batch 3 planet generation and mirroring complete!")
