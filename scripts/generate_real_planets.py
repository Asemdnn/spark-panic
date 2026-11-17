"""
Procedural Planetary Texture Synthesis Engine for Spark Panic
Generates 20 Authentic Real Astronomical Celestial Bodies & Exoplanets.
Resolution: Exact 1024x1024 RGB JPEG with seamless cylindrical horizontal wrapping.
"""

import math
import os
import shutil
import time
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

W = 1024
H = 1024

# -------------------------------------------------------------------------
# Core Mathematical & Seamless Cylindrical Helpers
# -------------------------------------------------------------------------

def create_periodic_fft_noise(w=W, h=H, seed=42, octaves=((2, 1.0), (4, 0.5), (8, 0.25), (16, 0.12), (32, 0.06), (64, 0.03)), aniso_x=1.0):
    """
    Generate fractal Brownian motion noise that is mathematically 100% periodic
    along the horizontal x-axis using 2D Fourier synthesis.
    """
    rng = np.random.RandomState(seed)
    accum = np.zeros((h, w), dtype=np.float32)
    tot = 0.0
    kx, ky = np.meshgrid(np.fft.fftfreq(w), np.fft.fftfreq(h))
    k2 = (kx * aniso_x) ** 2 + ky ** 2 + 1e-7
    for freq, weight in octaves:
        center_k = freq / w
        band_w = freq / (w * 2.8)
        spec = np.exp(-((np.sqrt(k2) - center_k) ** 2) / (2 * (band_w ** 2)))
        phase = rng.uniform(0, 2 * np.pi, (h, w))
        field = np.real(np.fft.ifft2(spec * np.exp(1j * phase)))
        field = (field - field.min()) / (field.max() - field.min() + 1e-6)
        accum += field * weight
        tot += weight
    return accum / tot

def cylindrical_dist(x_coords, y_coords, x0, y0, width=W):
    """
    Compute Euclidean distance on a cylinder of circumference 'width',
    ensuring continuous seamless wrapping across x=0 and x=width.
    """
    dx = np.abs(x_coords - x0)
    dx = np.minimum(dx, width - dx)
    dy = y_coords - y0
    return np.sqrt(dx ** 2 + dy ** 2)

def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0 + 1e-7), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)

def ensure_seamless_wrapping(img_np, blend_w=48):
    """
    Guarantee exact horizontal seam matching across x=0 and x=W-1
    using smooth C1 continuous cosine blend.
    """
    h, w, c = img_np.shape
    res = img_np.copy()
    
    t_left = np.linspace(0, 1, blend_w).reshape(1, blend_w, 1)
    w_left = 0.5 * (1.0 - np.cos(np.pi * t_left)) # 0 at 0, 1 at blend_w
    
    t_right = np.linspace(1, 0, blend_w).reshape(1, blend_w, 1)
    w_right = 0.5 * (1.0 - np.cos(np.pi * t_right)) # 1 at -blend_w, 0 at -1
    
    seam_avg = 0.5 * (img_np[:, 0:1, :] + img_np[:, -1:, :])
    
    res[:, :blend_w, :] = seam_avg * (1.0 - w_left) + img_np[:, :blend_w, :] * w_left
    res[:, -blend_w:, :] = seam_avg * (1.0 - w_right) + img_np[:, -blend_w:, :] * w_right
    return res

# Global coordinate meshgrid
Y_GRID, X_GRID = np.mgrid[0:H, 0:W].astype(np.float32)

# -------------------------------------------------------------------------
# 1. Earth (earth.jpg / aerilon.jpg)
# -------------------------------------------------------------------------
def generate_earth(seed=101):
    print("Synthesizing Planet 01: Earth...")
    ocean_deep = np.array([8, 28, 64], dtype=np.float32)
    ocean_shelf = np.array([14, 165, 233], dtype=np.float32)
    ocean_mid = np.array([12, 58, 128], dtype=np.float32)
    
    fbm_land = create_periodic_fft_noise(W, H, seed, octaves=((2, 1.2), (4, 0.8), (8, 0.4), (16, 0.2), (32, 0.1)))
    lat_factor = 1.0 - np.abs(Y_GRID / H - 0.5) * 1.3
    land_elevation = fbm_land * 0.7 + lat_factor * 0.3
    
    north_ice = smoothstep(0.18, 0.05, Y_GRID / H)
    south_ice = smoothstep(0.82, 0.95, Y_GRID / H)
    ice_mask = np.clip(north_ice + south_ice, 0.0, 1.0)
    
    land_mask = smoothstep(0.51, 0.54, land_elevation)
    shelf_mask = smoothstep(0.48, 0.51, land_elevation) * (1.0 - land_mask)
    
    fbm_veg = create_periodic_fft_noise(W, H, seed + 1, octaves=((4, 0.6), (12, 0.4), (32, 0.2)))
    veg_color = np.array([27, 85, 42], dtype=np.float32)
    desert_color = np.array([217, 135, 38], dtype=np.float32)
    mountain_color = np.array([95, 90, 82], dtype=np.float32)
    
    desert_weight = smoothstep(0.35, 0.65, np.abs(Y_GRID / H - 0.5) * 2.5) * smoothstep(0.4, 0.7, fbm_veg)
    mountain_weight = smoothstep(0.68, 0.85, land_elevation)
    
    land_rgb = veg_color * (1.0 - desert_weight[:, :, None]) + desert_color * desert_weight[:, :, None]
    land_rgb = land_rgb * (1.0 - mountain_weight[:, :, None]) + mountain_color * mountain_weight[:, :, None]
    
    ocean_rgb = ocean_deep * (1.0 - shelf_mask[:, :, None]) + ocean_shelf * shelf_mask[:, :, None]
    ocean_rgb = ocean_rgb * 0.8 + ocean_mid * 0.2
    
    rgb = ocean_rgb * (1.0 - land_mask[:, :, None]) + land_rgb * land_mask[:, :, None]
    
    ice_rgb = np.array([248, 250, 255], dtype=np.float32)
    rgb = rgb * (1.0 - ice_mask[:, :, None]) + ice_rgb * ice_mask[:, :, None]
    
    fbm_clouds = create_periodic_fft_noise(W, H, seed + 2, octaves=((3, 1.0), (6, 0.6), (14, 0.3), (28, 0.15)), aniso_x=0.85)
    cloud_mask = smoothstep(0.55, 0.78, fbm_clouds)
    
    shadow_offset_x = 8
    shadow_offset_y = 6
    cloud_shadow = np.roll(np.roll(cloud_mask, shadow_offset_x, axis=1), shadow_offset_y, axis=0)
    rgb = rgb * (1.0 - cloud_shadow[:, :, None] * 0.35)
    
    cloud_rgb = np.array([255, 255, 255], dtype=np.float32)
    rgb = rgb * (1.0 - cloud_mask[:, :, None] * 0.9) + cloud_rgb * (cloud_mask[:, :, None] * 0.9)
    
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 2. Mars (mars.jpg / aquatis.jpg)
# -------------------------------------------------------------------------
def generate_mars(seed=202):
    print("Synthesizing Planet 02: Mars...")
    dust_rust = np.array([194, 65, 12], dtype=np.float32)
    dust_dark = np.array([124, 45, 18], dtype=np.float32)
    dust_ochre = np.array([234, 88, 12], dtype=np.float32)
    basalt_albedo = np.array([59, 20, 10], dtype=np.float32)
    
    fbm_topo = create_periodic_fft_noise(W, H, seed, octaves=((2, 1.0), (5, 0.6), (12, 0.3), (24, 0.15), (48, 0.08)))
    fbm_albedo = create_periodic_fft_noise(W, H, seed + 1, octaves=((2, 0.8), (4, 0.5), (10, 0.2)))
    
    rgb = dust_rust * fbm_topo[:, :, None] + dust_ochre * (1.0 - fbm_topo[:, :, None])
    dark_mask = smoothstep(0.52, 0.75, fbm_albedo)
    rgb = rgb * (1.0 - dark_mask[:, :, None] * 0.65) + basalt_albedo * (dark_mask[:, :, None] * 0.65)
    
    canyon_center_y = H * 0.52 + np.sin(X_GRID / W * np.pi * 2.0 * 2.0) * 18.0
    dist_canyon_y = np.abs(Y_GRID - canyon_center_y)
    dist_canyon_x = np.abs(X_GRID - W * 0.52)
    dist_canyon_x = np.minimum(dist_canyon_x, W - dist_canyon_x)
    in_canyon_span = smoothstep(W * 0.24, W * 0.18, dist_canyon_x)
    canyon_fissure = smoothstep(30.0, 4.0, dist_canyon_y) * in_canyon_span
    canyon_color = np.array([25, 6, 4], dtype=np.float32)
    canyon_rim = np.array([245, 158, 11], dtype=np.float32)
    rim_mask = smoothstep(36.0, 30.0, dist_canyon_y) * (1.0 - smoothstep(30.0, 18.0, dist_canyon_y)) * in_canyon_span
    rgb = rgb * (1.0 - canyon_fissure[:, :, None]) + canyon_color * canyon_fissure[:, :, None]
    rgb += canyon_rim * rim_mask[:, :, None] * 0.4
    
    dist_olympus = cylindrical_dist(X_GRID, Y_GRID, W * 0.24, H * 0.38)
    olympus_mask = smoothstep(75.0, 15.0, dist_olympus)
    caldera_mask = smoothstep(18.0, 6.0, dist_olympus)
    olympus_rim = np.array([251, 146, 60], dtype=np.float32)
    caldera_color = np.array([55, 12, 8], dtype=np.float32)
    rgb = rgb * (1.0 - olympus_mask[:, :, None] * 0.4) + olympus_rim * (olympus_mask[:, :, None] * 0.4)
    rgb = rgb * (1.0 - caldera_mask[:, :, None]) + caldera_color * caldera_mask[:, :, None]
    
    north_cap = smoothstep(0.12, 0.04, Y_GRID / H)
    south_cap = smoothstep(0.88, 0.96, Y_GRID / H)
    polar_cap = np.clip(north_cap + south_cap, 0.0, 1.0)
    ice_color = np.array([250, 245, 245], dtype=np.float32)
    rgb = rgb * (1.0 - polar_cap[:, :, None]) + ice_color * polar_cap[:, :, None]
    
    rng = np.random.RandomState(seed + 9)
    for _ in range(16):
        cx = rng.uniform(0, W)
        cy = rng.uniform(H * 0.15, H * 0.85)
        cr = rng.uniform(10, 36)
        cdist = cylindrical_dist(X_GRID, Y_GRID, cx, cy)
        c_rim = smoothstep(cr + 4, cr, cdist) * (1.0 - smoothstep(cr, cr - 4, cdist))
        c_floor = smoothstep(cr - 2, 0, cdist)
        rgb += np.array([60, 25, 10], dtype=np.float32) * c_rim[:, :, None]
        rgb -= np.array([40, 15, 8], dtype=np.float32) * c_floor[:, :, None]
        
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 3. Venus (venus.jpg / solaria.jpg)
# -------------------------------------------------------------------------
def generate_venus(seed=303):
    print("Synthesizing Planet 03: Venus...")
    col_butter = np.array([254, 240, 138], dtype=np.float32)
    col_amber = np.array([245, 158, 11], dtype=np.float32)
    col_ochre = np.array([217, 119, 6], dtype=np.float32)
    col_cream = np.array([254, 249, 195], dtype=np.float32)
    
    fbm_bands = create_periodic_fft_noise(W, H, seed, octaves=((2, 1.0), (4, 0.7), (8, 0.4), (20, 0.2)), aniso_x=0.25)
    fbm_turb = create_periodic_fft_noise(W, H, seed + 1, octaves=((6, 0.8), (16, 0.4), (32, 0.2)))
    
    chevron_x = (X_GRID / W * 2.0 * np.pi) + np.abs(Y_GRID / H - 0.5) * 3.5
    chevron_wave = (np.sin(chevron_x * 2.0) + 1.0) * 0.5
    
    veil_mix = fbm_bands * 0.55 + chevron_wave * 0.30 + fbm_turb * 0.15
    rgb = col_butter * (1.0 - veil_mix[:, :, None]) + col_amber * veil_mix[:, :, None]
    
    billow_mask = smoothstep(0.65, 0.88, fbm_turb)
    rgb = rgb * (1.0 - billow_mask[:, :, None] * 0.6) + col_cream * (billow_mask[:, :, None] * 0.6)
    
    polar_vortex = smoothstep(0.18, 0.04, Y_GRID / H) + smoothstep(0.82, 0.96, Y_GRID / H)
    rgb = rgb * (1.0 - polar_vortex[:, :, None] * 0.3) + col_ochre * (polar_vortex[:, :, None] * 0.3)
    
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 4. Mercury (mercury.jpg / verdantia.jpg)
# -------------------------------------------------------------------------
def generate_mercury(seed=404):
    print("Synthesizing Planet 04: Mercury...")
    col_charcoal = np.array([30, 41, 59], dtype=np.float32)
    col_slate = np.array([71, 85, 105], dtype=np.float32)
    col_silver = np.array([148, 163, 184], dtype=np.float32)
    col_ejecta = np.array([226, 232, 240], dtype=np.float32)
    
    fbm_basalt = create_periodic_fft_noise(W, H, seed, octaves=((3, 1.0), (8, 0.6), (18, 0.3), (36, 0.15), (72, 0.08)))
    rgb = col_charcoal * (1.0 - fbm_basalt[:, :, None]) + col_slate * fbm_basalt[:, :, None]
    
    dist_caloris = cylindrical_dist(X_GRID, Y_GRID, W * 0.48, H * 0.50)
    basin_rim = smoothstep(145.0, 135.0, dist_caloris) * (1.0 - smoothstep(135.0, 125.0, dist_caloris))
    basin_floor = smoothstep(130.0, 40.0, dist_caloris)
    rgb += col_silver * basin_rim[:, :, None] * 0.6
    rgb = rgb * (1.0 - basin_floor[:, :, None] * 0.35) + col_charcoal * (basin_floor[:, :, None] * 0.35)
    
    for cx_ratio, cy_ratio, num_rays in [(0.25, 0.35, 12), (0.78, 0.68, 14)]:
        cx = W * cx_ratio
        cy = H * cy_ratio
        dist_c = cylindrical_dist(X_GRID, Y_GRID, cx, cy)
        dx = np.abs(X_GRID - cx)
        dx = np.minimum(dx, W - dx) * np.sign(X_GRID - cx)
        ang = np.arctan2(Y_GRID - cy, dx)
        ray_pattern = (np.cos(ang * num_rays) ** 8) * np.exp(-dist_c / 280.0)
        rgb += col_ejecta * ray_pattern[:, :, None] * 0.8
        c_bowl = smoothstep(22.0, 0.0, dist_c)
        rgb += col_ejecta * c_bowl[:, :, None] * 0.7
        
    rng = np.random.RandomState(seed + 12)
    for _ in range(40):
        cx = rng.uniform(0, W)
        cy = rng.uniform(0, H)
        cr = rng.uniform(6, 28)
        cdist = cylindrical_dist(X_GRID, Y_GRID, cx, cy)
        c_rim = smoothstep(cr + 3, cr, cdist) * (1.0 - smoothstep(cr, cr - 3, cdist))
        c_dark = smoothstep(cr - 2, 0, cdist)
        rgb += col_silver * c_rim[:, :, None] * 0.4
        rgb -= col_charcoal * c_dark[:, :, None] * 0.25
        
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 5. Luna (luna.jpg / cryon.jpg)
# -------------------------------------------------------------------------
def generate_luna(seed=505):
    print("Synthesizing Planet 05: Luna...")
    col_mare = np.array([28, 33, 40], dtype=np.float32)
    col_highland = np.array([192, 199, 210], dtype=np.float32)
    col_crater_bright = np.array([245, 248, 255], dtype=np.float32)
    
    fbm_moon = create_periodic_fft_noise(W, H, seed, octaves=((2, 1.2), (4, 0.7), (8, 0.4), (16, 0.2), (32, 0.1)))
    mare_mask = smoothstep(0.48, 0.38, fbm_moon)
    
    for mx, my, mr in [(0.32*W, 0.35*H, 130), (0.55*W, 0.32*H, 90), (0.65*W, 0.48*H, 100), (0.22*W, 0.50*H, 150)]:
        mdist = cylindrical_dist(X_GRID, Y_GRID, mx, my)
        mare_mask = np.maximum(mare_mask, smoothstep(mr, mr * 0.3, mdist) * 0.85)
        
    rgb = col_highland * (1.0 - mare_mask[:, :, None]) + col_mare * mare_mask[:, :, None]
    
    tycho_x = W * 0.52
    tycho_y = H * 0.76
    dist_tycho = cylindrical_dist(X_GRID, Y_GRID, tycho_x, tycho_y)
    dx = np.abs(X_GRID - tycho_x)
    dx = np.minimum(dx, W - dx) * np.sign(X_GRID - tycho_x)
    ang_tycho = np.arctan2(Y_GRID - tycho_y, dx)
    tycho_rays = (np.cos(ang_tycho * 18) ** 6) * np.exp(-dist_tycho / 420.0)
    rgb += col_crater_bright * tycho_rays[:, :, None] * 0.95
    tycho_center = smoothstep(24.0, 0.0, dist_tycho)
    rgb += col_crater_bright * tycho_center[:, :, None] * 0.9
    
    rng = np.random.RandomState(seed + 15)
    for _ in range(35):
        cx = rng.uniform(0, W)
        cy = rng.uniform(0, H)
        cr = rng.uniform(8, 30)
        cdist = cylindrical_dist(X_GRID, Y_GRID, cx, cy)
        c_rim = smoothstep(cr + 3, cr, cdist) * (1.0 - smoothstep(cr, cr - 3, cdist))
        c_dark = smoothstep(cr - 2, 0, cdist)
        rgb += col_crater_bright * c_rim[:, :, None] * 0.45
        rgb -= np.array([30, 30, 35], dtype=np.float32) * c_dark[:, :, None] * 0.3
        
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 6. Jupiter (jupiter.jpg / pyros.jpg)
# -------------------------------------------------------------------------
def generate_jupiter(seed=606):
    print("Synthesizing Planet 06: Jupiter...")
    c_belt_dark = np.array([120, 53, 15], dtype=np.float32)
    c_belt_red = np.array([180, 60, 20], dtype=np.float32)
    c_zone_cream = np.array([254, 215, 170], dtype=np.float32)
    c_zone_salmon = np.array([251, 146, 60], dtype=np.float32)
    c_white = np.array([255, 250, 245], dtype=np.float32)
    
    y_norm = Y_GRID / H
    band_profile = (np.sin(y_norm * np.pi * 16.0) + np.sin(y_norm * np.pi * 32.0) * 0.3 + 1.3) / 2.6
    
    fbm_shear = create_periodic_fft_noise(W, H, seed, octaves=((2, 1.0), (6, 0.7), (16, 0.4), (36, 0.15)), aniso_x=0.15)
    fbm_vort = create_periodic_fft_noise(W, H, seed + 1, octaves=((8, 0.8), (20, 0.4), (40, 0.2)))
    
    mix = np.clip(band_profile * 0.65 + fbm_shear * 0.25 + fbm_vort * 0.10, 0.0, 1.0)
    rgb = c_belt_dark * (1.0 - mix[:, :, None]) + c_zone_cream * mix[:, :, None]
    rgb = rgb * 0.6 + (c_belt_red * (1.0 - mix[:, :, None]) + c_zone_salmon * mix[:, :, None]) * 0.4
    
    grs_x = W * 0.68
    grs_y = H * 0.62
    dx = np.abs(X_GRID - grs_x)
    dx = np.minimum(dx, W - dx)
    dy = (Y_GRID - grs_y) * 1.7
    dist_grs = np.sqrt(dx ** 2 + dy ** 2)
    
    grs_collar = smoothstep(85.0, 65.0, dist_grs)
    grs_core = smoothstep(45.0, 0.0, dist_grs)
    grs_color_core = np.array([168, 30, 20], dtype=np.float32)
    grs_color_collar = np.array([234, 88, 12], dtype=np.float32)
    
    rgb = rgb * (1.0 - grs_collar[:, :, None]) + grs_color_collar * grs_collar[:, :, None]
    rgb = rgb * (1.0 - grs_core[:, :, None]) + grs_color_core * grs_core[:, :, None]
    
    for px_ratio in [0.20, 0.35, 0.48, 0.82, 0.94]:
        px = W * px_ratio
        py = H * 0.72
        pdist = cylindrical_dist(X_GRID, Y_GRID, px, py)
        p_mask = smoothstep(14.0, 0.0, pdist)
        rgb = rgb * (1.0 - p_mask[:, :, None]) + c_white * p_mask[:, :, None]
        
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 7. Saturn (saturn.jpg / zephyria.jpg)
# -------------------------------------------------------------------------
def generate_saturn(seed=707):
    print("Synthesizing Planet 07: Saturn...")
    c_gold = np.array([202, 138, 4], dtype=np.float32)
    c_butter = np.array([254, 240, 138], dtype=np.float32)
    c_amber = np.array([217, 119, 6], dtype=np.float32)
    c_cream = np.array([254, 249, 195], dtype=np.float32)
    
    y_norm = Y_GRID / H
    band_profile = (np.sin(y_norm * np.pi * 22.0) + np.sin(y_norm * np.pi * 11.0) * 0.4 + 1.4) / 2.8
    fbm_sat = create_periodic_fft_noise(W, H, seed, octaves=((2, 1.0), (6, 0.5), (18, 0.2)), aniso_x=0.12)
    
    mix = np.clip(band_profile * 0.75 + fbm_sat * 0.25, 0.0, 1.0)
    rgb = c_amber * (1.0 - mix[:, :, None]) + c_butter * mix[:, :, None]
    rgb = rgb * 0.7 + (c_gold * (1.0 - mix[:, :, None]) + c_cream * mix[:, :, None]) * 0.3
    
    hex_mask = smoothstep(0.16, 0.06, Y_GRID / H)
    ang_polar = np.arctan2(Y_GRID - H * 0.08, X_GRID - W * 0.5)
    hex_pattern = (np.cos(ang_polar * 6.0) + 1.0) * 0.5
    rgb = rgb * (1.0 - (hex_mask * hex_pattern)[:, :, None] * 0.35) + np.array([180, 120, 20], dtype=np.float32) * ((hex_mask * hex_pattern)[:, :, None] * 0.35)
    
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 8. Uranus (uranus.jpg / obsidian.jpg)
# -------------------------------------------------------------------------
def generate_uranus(seed=808):
    print("Synthesizing Planet 08: Uranus...")
    c_cyan_deep = np.array([8, 145, 178], dtype=np.float32)
    c_teal = np.array([6, 182, 212], dtype=np.float32)
    c_aqua = np.array([103, 232, 249], dtype=np.float32)
    c_ice_cirrus = np.array([207, 250, 254], dtype=np.float32)
    
    fbm_methane = create_periodic_fft_noise(W, H, seed, octaves=((2, 1.0), (6, 0.4), (16, 0.15)), aniso_x=0.20)
    y_norm = Y_GRID / H
    polar_hood = smoothstep(0.35, 0.02, y_norm) + smoothstep(0.65, 0.98, y_norm)
    
    mix = np.clip(fbm_methane * 0.6 + polar_hood * 0.4, 0.0, 1.0)
    rgb = c_cyan_deep * (1.0 - mix[:, :, None]) + c_teal * mix[:, :, None]
    rgb = rgb * (1.0 - polar_hood[:, :, None] * 0.4) + c_aqua * (polar_hood[:, :, None] * 0.4)
    
    fbm_cirrus = create_periodic_fft_noise(W, H, seed + 1, octaves=((4, 1.0), (12, 0.5)), aniso_x=0.08)
    cirrus_mask = smoothstep(0.72, 0.88, fbm_cirrus)
    rgb = rgb * (1.0 - cirrus_mask[:, :, None] * 0.5) + c_ice_cirrus * (cirrus_mask[:, :, None] * 0.5)
    
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 9. Neptune (neptune.jpg / lumina.jpg)
# -------------------------------------------------------------------------
def generate_neptune(seed=909):
    print("Synthesizing Planet 09: Neptune...")
    c_cobalt = np.array([29, 78, 216], dtype=np.float32)
    c_royal = np.array([30, 64, 175], dtype=np.float32)
    c_deep = np.array([23, 37, 84], dtype=np.float32)
    c_electric = np.array([59, 130, 246], dtype=np.float32)
    c_white_cirrus = np.array([255, 255, 255], dtype=np.float32)
    
    fbm_winds = create_periodic_fft_noise(W, H, seed, octaves=((2, 1.0), (6, 0.6), (16, 0.3)), aniso_x=0.15)
    y_norm = Y_GRID / H
    bands = (np.sin(y_norm * np.pi * 12.0) + 1.0) * 0.5
    mix = np.clip(fbm_winds * 0.65 + bands * 0.35, 0.0, 1.0)
    
    rgb = c_deep * (1.0 - mix[:, :, None]) + c_cobalt * mix[:, :, None]
    rgb = rgb * 0.7 + (c_royal * (1.0 - mix[:, :, None]) + c_electric * mix[:, :, None]) * 0.3
    
    gds_x = W * 0.38
    gds_y = H * 0.52
    dx = np.abs(X_GRID - gds_x)
    dx = np.minimum(dx, W - dx)
    dy = (Y_GRID - gds_y) * 1.8
    dist_gds = np.sqrt(dx ** 2 + dy ** 2)
    gds_mask = smoothstep(55.0, 15.0, dist_gds)
    gds_color = np.array([8, 14, 45], dtype=np.float32)
    rgb = rgb * (1.0 - gds_mask[:, :, None] * 0.75) + gds_color * (gds_mask[:, :, None] * 0.75)
    
    cirrus_fbm = create_periodic_fft_noise(W, H, seed + 3, octaves=((4, 1.0), (14, 0.6)), aniso_x=0.08)
    cirrus_mask = smoothstep(0.70, 0.88, cirrus_fbm)
    rgb = rgb * (1.0 - cirrus_mask[:, :, None] * 0.9) + c_white_cirrus * (cirrus_mask[:, :, None] * 0.9)
    
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 10. Pluto (pluto.jpg / vortexia.jpg)
# -------------------------------------------------------------------------
def generate_pluto(seed=1010):
    print("Synthesizing Planet 10: Pluto...")
    c_tholin_dark = np.array([69, 26, 3], dtype=np.float32)
    c_tholin_mid = np.array([154, 52, 18], dtype=np.float32)
    c_tholin_ochre = np.array([180, 83, 9], dtype=np.float32)
    c_ice_heart = np.array([253, 244, 227], dtype=np.float32)
    c_ice_pure = np.array([255, 250, 245], dtype=np.float32)
    
    fbm_crust = create_periodic_fft_noise(W, H, seed, octaves=((2, 1.0), (6, 0.6), (14, 0.3), (28, 0.15)))
    rgb = c_tholin_dark * (1.0 - fbm_crust[:, :, None]) + c_tholin_mid * fbm_crust[:, :, None]
    rgb = rgb * 0.7 + c_tholin_ochre * 0.3
    
    heart_x = W * 0.52
    heart_y = H * 0.48
    dist_left = cylindrical_dist(X_GRID, Y_GRID, heart_x - 45, heart_y)
    dist_right = cylindrical_dist(X_GRID, Y_GRID, heart_x + 40, heart_y - 15)
    heart_mask = np.maximum(smoothstep(110.0, 30.0, dist_left), smoothstep(85.0, 25.0, dist_right) * 0.85)
    
    fbm_cells = create_periodic_fft_noise(W, H, seed + 1, octaves=((16, 0.8), (32, 0.4)))
    cell_rims = smoothstep(0.48, 0.52, fbm_cells) * 0.15
    
    heart_rgb = c_ice_heart * (1.0 - cell_rims[:, :, None]) + c_ice_pure * cell_rims[:, :, None]
    rgb = rgb * (1.0 - heart_mask[:, :, None]) + heart_rgb * heart_mask[:, :, None]
    
    mountain_fbm = create_periodic_fft_noise(W, H, seed + 2, octaves=((12, 1.0), (30, 0.5)))
    margin_mask = smoothstep(125.0, 105.0, dist_left) * (1.0 - smoothstep(105.0, 85.0, dist_left))
    rgb += np.array([240, 245, 250], dtype=np.float32) * (margin_mask * mountain_fbm)[:, :, None] * 0.5
    
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 11. Europa (europa.jpg / aethelgard.jpg)
# -------------------------------------------------------------------------
def generate_europa(seed=1111):
    print("Synthesizing Planet 11: Europa...")
    c_ice_base = np.array([248, 250, 252], dtype=np.float32)
    c_ice_frost = np.array([224, 242, 254], dtype=np.float32)
    c_lineae = np.array([153, 27, 27], dtype=np.float32)
    c_lineae_ochre = np.array([194, 65, 12], dtype=np.float32)
    
    fbm_ice = create_periodic_fft_noise(W, H, seed, octaves=((3, 1.0), (8, 0.5), (20, 0.2)))
    rgb = c_ice_base * (1.0 - fbm_ice[:, :, None] * 0.25) + c_ice_frost * (fbm_ice[:, :, None] * 0.25)
    
    lineae_canvas = np.zeros((H, W), dtype=np.float32)
    rng = np.random.RandomState(seed + 7)
    for _ in range(24):
        p_y = rng.uniform(H * 0.1, H * 0.9)
        curve_amp = rng.uniform(15, 45)
        curve_freq = rng.randint(1, 4)
        phase = rng.uniform(0, 2 * np.pi)
        line_y = p_y + np.sin(X_GRID / W * np.pi * 2.0 * curve_freq + phase) * curve_amp
        dist_line = np.abs(Y_GRID - line_y)
        ridge1 = smoothstep(6.0, 1.5, np.abs(dist_line - 4.0))
        ridge2 = smoothstep(6.0, 1.5, np.abs(dist_line + 4.0))
        center_fissure = smoothstep(3.0, 0.5, dist_line)
        lineae_canvas = np.maximum(lineae_canvas, np.maximum(ridge1, ridge2) * 0.8 + center_fissure * 0.5)
        
    fbm_chaos = create_periodic_fft_noise(W, H, seed + 9, octaves=((4, 1.0), (12, 0.6)))
    chaos_mask = smoothstep(0.68, 0.85, fbm_chaos) * 0.6
    
    rgb = rgb * (1.0 - chaos_mask[:, :, None]) + c_lineae_ochre * chaos_mask[:, :, None]
    rgb = rgb * (1.0 - lineae_canvas[:, :, None] * 0.9) + c_lineae * (lineae_canvas[:, :, None] * 0.9)
    
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 12. Titan (titan.jpg / chronos.jpg)
# -------------------------------------------------------------------------
def generate_titan(seed=1212):
    print("Synthesizing Planet 12: Titan...")
    c_haze_deep = np.array([234, 88, 12], dtype=np.float32)
    c_haze_bright = np.array([251, 146, 60], dtype=np.float32)
    c_methane_sea = np.array([15, 23, 42], dtype=np.float32)
    c_dunes = np.array([120, 53, 15], dtype=np.float32)
    
    fbm_haze = create_periodic_fft_noise(W, H, seed, octaves=((2, 1.0), (5, 0.6), (14, 0.25)))
    rgb = c_haze_deep * (1.0 - fbm_haze[:, :, None]) + c_haze_bright * fbm_haze[:, :, None]
    
    eq_band = smoothstep(0.20, 0.45, Y_GRID / H) * smoothstep(0.80, 0.55, Y_GRID / H)
    fbm_dunes = create_periodic_fft_noise(W, H, seed + 1, octaves=((4, 1.0), (12, 0.6)), aniso_x=0.25)
    dune_mask = eq_band * smoothstep(0.52, 0.75, fbm_dunes) * 0.65
    rgb = rgb * (1.0 - dune_mask[:, :, None]) + c_dunes * dune_mask[:, :, None]
    
    polar_north = smoothstep(0.25, 0.05, Y_GRID / H)
    fbm_lakes = create_periodic_fft_noise(W, H, seed + 2, octaves=((3, 1.0), (8, 0.6)))
    lake_mask = polar_north * smoothstep(0.54, 0.72, fbm_lakes)
    rgb = rgb * (1.0 - lake_mask[:, :, None] * 0.9) + c_methane_sea * (lake_mask[:, :, None] * 0.9)
    
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 13. Io (io.jpg / mycelia.jpg)
# -------------------------------------------------------------------------
def generate_io(seed=1313):
    print("Synthesizing Planet 13: Io...")
    c_sulfur_yellow = np.array([234, 179, 8], dtype=np.float32)
    c_sulfur_bright = np.array([250, 204, 21], dtype=np.float32)
    c_frost_white = np.array([254, 249, 195], dtype=np.float32)
    c_lava_black = np.array([15, 23, 42], dtype=np.float32)
    c_sulfur_red = np.array([220, 38, 38], dtype=np.float32)
    
    fbm_io = create_periodic_fft_noise(W, H, seed, octaves=((2, 1.0), (6, 0.6), (14, 0.3), (28, 0.15)))
    rgb = c_sulfur_yellow * (1.0 - fbm_io[:, :, None]) + c_sulfur_bright * fbm_io[:, :, None]
    
    frost_mask = smoothstep(0.68, 0.88, fbm_io) * 0.4
    rgb = rgb * (1.0 - frost_mask[:, :, None]) + c_frost_white * frost_mask[:, :, None]
    
    volcanoes = [
        (0.32 * W, 0.42 * H, 45, 120),
        (0.68 * W, 0.65 * H, 35, 140),
        (0.85 * W, 0.35 * H, 25, 80),
        (0.18 * W, 0.78 * H, 30, 95)
    ]
    for vx, vy, r_caldera, r_plume in volcanoes:
        vdist = cylindrical_dist(X_GRID, Y_GRID, vx, vy)
        plume_ring = smoothstep(r_plume + 15, r_plume, vdist) * (1.0 - smoothstep(r_plume, r_plume - 20, vdist))
        rgb = rgb * (1.0 - plume_ring[:, :, None] * 0.75) + c_sulfur_red * (plume_ring[:, :, None] * 0.75)
        caldera_mask = smoothstep(r_caldera, r_caldera * 0.3, vdist)
        rgb = rgb * (1.0 - caldera_mask[:, :, None]) + c_lava_black * caldera_mask[:, :, None]
        
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 14. Enceladus (enceladus.jpg / ferrum.jpg)
# -------------------------------------------------------------------------
def generate_enceladus(seed=1414):
    print("Synthesizing Planet 14: Enceladus...")
    c_white_ice = np.array([255, 255, 255], dtype=np.float32)
    c_ice_tint = np.array([241, 245, 249], dtype=np.float32)
    c_tiger_blue = np.array([2, 132, 199], dtype=np.float32)
    c_tiger_cyan = np.array([56, 189, 248], dtype=np.float32)
    
    fbm_ice = create_periodic_fft_noise(W, H, seed, octaves=((3, 1.0), (8, 0.5), (18, 0.2)))
    rgb = c_white_ice * (1.0 - fbm_ice[:, :, None] * 0.12) + c_ice_tint * (fbm_ice[:, :, None] * 0.12)
    
    south_pole = smoothstep(0.72, 0.95, Y_GRID / H)
    tiger_canvas = np.zeros((H, W), dtype=np.float32)
    for offset_y in [0.78, 0.83, 0.88, 0.93]:
        base_y = H * offset_y
        stripe_y = base_y + np.sin(X_GRID / W * np.pi * 2.0 * 2.0) * 14.0
        dist_stripe = np.abs(Y_GRID - stripe_y)
        fissure = smoothstep(7.0, 1.5, dist_stripe)
        halo = smoothstep(18.0, 4.0, dist_stripe) * 0.5
        tiger_canvas = np.maximum(tiger_canvas, fissure + halo)
        
    stripe_mask = south_pole * tiger_canvas
    rgb = rgb * (1.0 - stripe_mask[:, :, None] * 0.85) + c_tiger_blue * (stripe_mask[:, :, None] * 0.85)
    rgb += c_tiger_cyan * (stripe_mask[:, :, None] * 0.4)
    
    north_pole = smoothstep(0.35, 0.05, Y_GRID / H)
    rng = np.random.RandomState(seed + 8)
    for _ in range(15):
        cx = rng.uniform(0, W)
        cy = rng.uniform(0, H * 0.4)
        cr = rng.uniform(8, 24)
        cdist = cylindrical_dist(X_GRID, Y_GRID, cx, cy)
        c_rim = smoothstep(cr + 3, cr, cdist) * (1.0 - smoothstep(cr, cr - 3, cdist)) * north_pole
        rgb -= np.array([25, 25, 30], dtype=np.float32) * c_rim[:, :, None] * 0.35
        
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 15. Ceres (ceres.jpg / eclipse.jpg)
# -------------------------------------------------------------------------
def generate_ceres(seed=1515):
    print("Synthesizing Planet 15: Ceres...")
    c_regolith_dark = np.array([30, 41, 59], dtype=np.float32)
    c_regolith_mid = np.array([71, 85, 105], dtype=np.float32)
    c_bright_facula = np.array([255, 255, 255], dtype=np.float32)
    c_bright_halo = np.array([203, 213, 225], dtype=np.float32)
    
    fbm_ceres = create_periodic_fft_noise(W, H, seed, octaves=((2, 1.0), (6, 0.6), (16, 0.3), (32, 0.15)))
    rgb = c_regolith_dark * (1.0 - fbm_ceres[:, :, None]) + c_regolith_mid * fbm_ceres[:, :, None]
    
    occator_x = W * 0.42
    occator_y = H * 0.45
    dist_occator = cylindrical_dist(X_GRID, Y_GRID, occator_x, occator_y)
    
    c_rim = smoothstep(65.0, 55.0, dist_occator) * (1.0 - smoothstep(55.0, 45.0, dist_occator))
    c_floor = smoothstep(50.0, 20.0, dist_occator)
    rgb += np.array([30, 30, 35], dtype=np.float32) * c_rim[:, :, None] * 0.5
    rgb = rgb * (1.0 - c_floor[:, :, None] * 0.3)
    
    facula_core = smoothstep(16.0, 0.0, dist_occator)
    facula_rays = smoothstep(42.0, 0.0, dist_occator) * 0.5
    rgb = rgb * (1.0 - facula_rays[:, :, None]) + c_bright_halo * facula_rays[:, :, None]
    rgb = rgb * (1.0 - facula_core[:, :, None]) + c_bright_facula * facula_core[:, :, None]
    
    h_dist = cylindrical_dist(X_GRID, Y_GRID, W * 0.75, H * 0.62)
    h_core = smoothstep(12.0, 0.0, h_dist)
    h_halo = smoothstep(35.0, 0.0, h_dist) * 0.4
    rgb = rgb * (1.0 - h_halo[:, :, None]) + c_bright_halo * h_halo[:, :, None]
    rgb = rgb * (1.0 - h_core[:, :, None]) + c_bright_facula * h_core[:, :, None]
    
    rng = np.random.RandomState(seed + 11)
    for _ in range(25):
        cx = rng.uniform(0, W)
        cy = rng.uniform(0, H)
        cr = rng.uniform(6, 22)
        cdist = cylindrical_dist(X_GRID, Y_GRID, cx, cy)
        crim = smoothstep(cr + 2, cr, cdist) * (1.0 - smoothstep(cr, cr - 2, cdist))
        rgb += np.array([25, 25, 30], dtype=np.float32) * crim[:, :, None] * 0.4
        
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 16. Proxima Centauri b (proxima-b.jpg / hyperion.jpg)
# -------------------------------------------------------------------------
def generate_proxima_b(seed=1616):
    print("Synthesizing Planet 16: Proxima Centauri b...")
    c_flare_scorch = np.array([185, 28, 28], dtype=np.float32)
    c_burnt_umber = np.array([127, 29, 29], dtype=np.float32)
    c_terminator_sea = np.array([30, 58, 138], dtype=np.float32)
    c_night_frost = np.array([148, 163, 184], dtype=np.float32)
    
    dist_dayside = np.abs(X_GRID - W * 0.25)
    dist_dayside = np.minimum(dist_dayside, W - dist_dayside) / (W * 0.5)
    
    fbm_crust = create_periodic_fft_noise(W, H, seed, octaves=((2, 1.0), (5, 0.6), (12, 0.3), (28, 0.15)))
    
    rgb = c_burnt_umber * (1.0 - fbm_crust[:, :, None]) + c_flare_scorch * fbm_crust[:, :, None]
    
    term_ribbon = smoothstep(0.35, 0.50, dist_dayside) * smoothstep(0.65, 0.50, dist_dayside)
    fbm_sea = create_periodic_fft_noise(W, H, seed + 1, octaves=((3, 1.0), (8, 0.5)))
    sea_mask = term_ribbon * smoothstep(0.48, 0.65, fbm_sea)
    rgb = rgb * (1.0 - sea_mask[:, :, None]) + c_terminator_sea * sea_mask[:, :, None]
    
    night_weight = smoothstep(0.60, 0.90, dist_dayside)
    rgb = rgb * (1.0 - night_weight[:, :, None] * 0.6) + c_night_frost * (night_weight[:, :, None] * 0.6)
    
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 17. TRAPPIST-1e (trappist-1e.jpg / astralis.jpg)
# -------------------------------------------------------------------------
def generate_trappist_1e(seed=1717):
    print("Synthesizing Planet 17: TRAPPIST-1e...")
    c_ocean_deep = np.array([23, 37, 84], dtype=np.float32)
    c_ocean_mid = np.array([30, 64, 175], dtype=np.float32)
    c_land_forest = np.array([20, 83, 45], dtype=np.float32)
    c_ice_sheet = np.array([241, 245, 249], dtype=np.float32)
    c_cloud_swirl = np.array([255, 255, 255], dtype=np.float32)
    
    dist_dayside = np.abs(X_GRID - W * 0.3)
    dist_dayside = np.minimum(dist_dayside, W - dist_dayside) / (W * 0.5)
    
    fbm_ocean = create_periodic_fft_noise(W, H, seed, octaves=((3, 1.0), (8, 0.5)))
    rgb = c_ocean_deep * (1.0 - fbm_ocean[:, :, None]) + c_ocean_mid * fbm_ocean[:, :, None]
    
    term_band = smoothstep(0.25, 0.45, dist_dayside) * smoothstep(0.70, 0.50, dist_dayside)
    fbm_land = create_periodic_fft_noise(W, H, seed + 1, octaves=((3, 1.0), (6, 0.6), (16, 0.3)))
    land_mask = term_band * smoothstep(0.52, 0.68, fbm_land)
    rgb = rgb * (1.0 - land_mask[:, :, None]) + c_land_forest * land_mask[:, :, None]
    
    night_ice = smoothstep(0.65, 0.92, dist_dayside)
    rgb = rgb * (1.0 - night_ice[:, :, None] * 0.85) + c_ice_sheet * (night_ice[:, :, None] * 0.85)
    
    fbm_clouds = create_periodic_fft_noise(W, H, seed + 2, octaves=((3, 1.0), (7, 0.6), (15, 0.3)))
    cloud_mask = smoothstep(0.58, 0.80, fbm_clouds) * 0.85
    rgb = rgb * (1.0 - cloud_mask[:, :, None]) + c_cloud_swirl * cloud_mask[:, :, None]
    
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 18. Kepler-452b (kepler-452b.jpg / voidreach.jpg)
# -------------------------------------------------------------------------
def generate_kepler_452b(seed=1818):
    print("Synthesizing Planet 18: Kepler-452b...")
    c_ocean_sapphire = np.array([2, 132, 199], dtype=np.float32)
    c_ocean_abyss = np.array([12, 74, 110], dtype=np.float32)
    c_land_emerald = np.array([5, 150, 105], dtype=np.float32)
    c_land_moss = np.array([4, 120, 87], dtype=np.float32)
    c_mountain = np.array([75, 85, 99], dtype=np.float32)
    c_cloud_white = np.array([255, 255, 255], dtype=np.float32)
    
    fbm_world = create_periodic_fft_noise(W, H, seed, octaves=((2, 1.2), (5, 0.7), (12, 0.4), (24, 0.2)))
    land_mask = smoothstep(0.50, 0.54, fbm_world)
    
    ocean_rgb = c_ocean_abyss * (1.0 - fbm_world[:, :, None]) + c_ocean_sapphire * fbm_world[:, :, None]
    land_rgb = c_land_moss * (1.0 - fbm_world[:, :, None]) + c_land_emerald * fbm_world[:, :, None]
    mountain_mask = smoothstep(0.68, 0.82, fbm_world)
    land_rgb = land_rgb * (1.0 - mountain_mask[:, :, None]) + c_mountain * mountain_mask[:, :, None]
    
    rgb = ocean_rgb * (1.0 - land_mask[:, :, None]) + land_rgb * land_mask[:, :, None]
    
    fbm_clouds = create_periodic_fft_noise(W, H, seed + 2, octaves=((3, 1.0), (8, 0.6), (18, 0.3)), aniso_x=0.75)
    cloud_mask = smoothstep(0.56, 0.78, fbm_clouds) * 0.92
    rgb = rgb * (1.0 - cloud_mask[:, :, None]) + c_cloud_white * cloud_mask[:, :, None]
    
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 19. 55 Cancri e (55-cancri-e.jpg / omega-prime.jpg)
# -------------------------------------------------------------------------
def generate_55_cancri_e(seed=1919):
    print("Synthesizing Planet 19: 55 Cancri e...")
    c_graphite_crust = np.array([15, 23, 42], dtype=np.float32)
    c_carbon_dark = np.array([24, 24, 27], dtype=np.float32)
    c_lava_bright = np.array([254, 240, 138], dtype=np.float32)
    c_lava_orange = np.array([249, 115, 22], dtype=np.float32)
    c_lava_crimson = np.array([220, 38, 38], dtype=np.float32)
    
    fbm_plates = create_periodic_fft_noise(W, H, seed, octaves=((3, 1.0), (8, 0.6), (18, 0.3), (36, 0.15)))
    fbm_magma = create_periodic_fft_noise(W, H, seed + 1, octaves=((6, 1.0), (16, 0.5)))
    
    fissures = 1.0 - np.abs(fbm_plates - 0.5) * 2.0
    lava_river = smoothstep(0.85, 0.98, fissures)
    
    dayside_dist = np.abs(X_GRID - W * 0.30)
    dayside_dist = np.minimum(dayside_dist, W - dayside_dist)
    lava_lake = smoothstep(W * 0.22, W * 0.08, dayside_dist)
    
    lava_tot = np.clip(lava_river * 0.85 + lava_lake * 0.95, 0.0, 1.0)
    
    rgb = c_carbon_dark * (1.0 - fbm_plates[:, :, None]) + c_graphite_crust * fbm_plates[:, :, None]
    lava_col = c_lava_crimson * (1.0 - fbm_magma[:, :, None]) + c_lava_orange * fbm_magma[:, :, None]
    lava_col = lava_col * 0.7 + c_lava_bright * 0.3
    
    rgb = rgb * (1.0 - lava_tot[:, :, None]) + lava_col * lava_tot[:, :, None]
    
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# 20. Kepler-22b (kepler-22b.jpg / genesis.jpg)
# -------------------------------------------------------------------------
def generate_kepler_22b(seed=2020):
    print("Synthesizing Planet 20: Kepler-22b...")
    c_ocean_abyss = np.array([8, 145, 178], dtype=np.float32)
    c_ocean_azure = np.array([6, 182, 212], dtype=np.float32)
    c_bio_cyan = np.array([0, 229, 255], dtype=np.float32)
    c_bio_emerald = np.array([0, 230, 118], dtype=np.float32)
    c_steam_veil = np.array([224, 242, 254], dtype=np.float32)
    
    fbm_ocean = create_periodic_fft_noise(W, H, seed, octaves=((2, 1.0), (5, 0.6), (12, 0.3)))
    rgb = c_ocean_abyss * (1.0 - fbm_ocean[:, :, None]) + c_ocean_azure * fbm_ocean[:, :, None]
    
    fbm_bio = create_periodic_fft_noise(W, H, seed + 1, octaves=((4, 1.0), (12, 0.7), (24, 0.35)))
    bio_filaments = smoothstep(0.70, 0.88, fbm_bio)
    bio_color = c_bio_cyan * 0.65 + c_bio_emerald * 0.35
    rgb += bio_color * bio_filaments[:, :, None] * 0.75
    
    fbm_steam = create_periodic_fft_noise(W, H, seed + 2, octaves=((3, 1.0), (8, 0.5), (18, 0.2)), aniso_x=0.8)
    steam_mask = smoothstep(0.60, 0.82, fbm_steam) * 0.65
    rgb = rgb * (1.0 - steam_mask[:, :, None] * 0.7) + c_steam_veil * (steam_mask[:, :, None] * 0.7)
    
    return np.clip(ensure_seamless_wrapping(rgb), 0, 255).astype(np.uint8)

# -------------------------------------------------------------------------
# Execution & File Distribution Pipeline
# -------------------------------------------------------------------------

PLANET_SPECS = [
    ("earth.jpg", "aerilon.jpg", generate_earth),
    ("mars.jpg", "aquatis.jpg", generate_mars),
    ("venus.jpg", "solaria.jpg", generate_venus),
    ("mercury.jpg", "verdantia.jpg", generate_mercury),
    ("luna.jpg", "cryon.jpg", generate_luna),
    ("jupiter.jpg", "pyros.jpg", generate_jupiter),
    ("saturn.jpg", "zephyria.jpg", generate_saturn),
    ("uranus.jpg", "obsidian.jpg", generate_uranus),
    ("neptune.jpg", "lumina.jpg", generate_neptune),
    ("pluto.jpg", "vortexia.jpg", generate_pluto),
    ("europa.jpg", "aethelgard.jpg", generate_europa),
    ("titan.jpg", "chronos.jpg", generate_titan),
    ("io.jpg", "mycelia.jpg", generate_io),
    ("enceladus.jpg", "ferrum.jpg", generate_enceladus),
    ("ceres.jpg", "eclipse.jpg", generate_ceres),
    ("proxima-b.jpg", "hyperion.jpg", generate_proxima_b),
    ("trappist-1e.jpg", "astralis.jpg", generate_trappist_1e),
    ("kepler-452b.jpg", "voidreach.jpg", generate_kepler_452b),
    ("55-cancri-e.jpg", "omega-prime.jpg", generate_55_cancri_e),
    ("kepler-22b.jpg", "genesis.jpg", generate_kepler_22b)
]

def main():
    start_time = time.time()
    print("=" * 70)
    print("Starting Authentic Real Astronomical Planet & Exoplanet Synthesis")
    print(f"Target count: {len(PLANET_SPECS)} Celestial Bodies (40 output files)")
    print("Target resolution: 1024 x 1024 RGB JPEG, Seamless Cylindrical Wrapping")
    print("=" * 70)
    
    src_dir = "src/assets/planets"
    pub_dir = "public/assets/planets"
    dist_dir = "dist/assets/planets"
    
    for d in [src_dir, pub_dir, dist_dir]:
        os.makedirs(d, exist_ok=True)
        
    generated_records = []
    
    for idx, (real_name, classic_name, generator_fn) in enumerate(PLANET_SPECS, start=1):
        t0 = time.time()
        rgb_data = generator_fn(seed=idx * 100 + 42)
        
        # Verify seamless wrapping continuity across edge columns
        diff_seam = np.max(np.abs(rgb_data[:, 0, :].astype(int) - rgb_data[:, -1, :].astype(int)))
        
        img = Image.fromarray(rgb_data, mode="RGB")
        
        src_real = os.path.join(src_dir, real_name)
        src_classic = os.path.join(src_dir, classic_name)
        
        img.save(src_real, "JPEG", quality=95, optimize=True)
        img.save(src_classic, "JPEG", quality=95, optimize=True)
        
        for fn in [real_name, classic_name]:
            shutil.copyfile(os.path.join(src_dir, fn), os.path.join(pub_dir, fn))
            shutil.copyfile(os.path.join(src_dir, fn), os.path.join(dist_dir, fn))
            
        t_elap = time.time() - t0
        file_kb = os.path.getsize(src_real) / 1024.0
        print(f"[{idx:02d}/20] Generated '{real_name}' & '{classic_name}' ({img.size[0]}x{img.size[1]}, {file_kb:.1f} KB, seam_diff={diff_seam}) in {t_elap:.2f}s")
        generated_records.append({
            "index": idx,
            "real_name": real_name,
            "classic_name": classic_name,
            "size": img.size,
            "kb": file_kb,
            "seam_diff": diff_seam
        })
        
    total_time = time.time() - start_time
    print("=" * 70)
    print(f"Synthesis Complete: 20 celestial bodies (40 files x 3 dirs = 120 asset files) in {total_time:.2f} seconds!")
    print("=" * 70)

if __name__ == "__main__":
    main()
