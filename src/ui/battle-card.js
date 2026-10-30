// Spark Panic 2.5 - Shareable Holographic Commander Battle Card Generator

import { PLANETS, CHASSIS_CONFIG, TURRET_SKINS, WINGMAN_CONFIG, COSMIC_RELICS } from '../config.js';

export class BattleCardGenerator {
  static renderCard(engine, saveSystem) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // 1. Cyber-Cosmic Deep Space Starfield Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGrad.addColorStop(0, '#03050d');
    bgGrad.addColorStop(0.5, '#070b1a');
    bgGrad.addColorStop(1, '#050713');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 630);

    // Subtle star clusters
    ctx.fillStyle = '#ffffff';
    const starSeeds = [
      [60, 45, 1.5], [180, 120, 2], [320, 60, 1], [540, 95, 2.5], [780, 50, 1], [940, 110, 2],
      [1100, 75, 1.5], [90, 280, 1], [220, 420, 2], [410, 310, 1.5], [680, 460, 2], [850, 360, 1],
      [1020, 490, 2], [1150, 380, 1.5], [140, 560, 2], [370, 580, 1], [600, 590, 2.5], [890, 560, 1.5]
    ];
    for (const [sx, sy, sr] of starSeeds) {
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
    }

    // Nebula ambient glow
    const neb1 = ctx.createRadialGradient(250, 200, 20, 250, 200, 320);
    neb1.addColorStop(0, 'rgba(0, 229, 255, 0.12)');
    neb1.addColorStop(1, 'transparent');
    ctx.fillStyle = neb1;
    ctx.fillRect(0, 0, 1200, 630);

    const neb2 = ctx.createRadialGradient(950, 400, 30, 950, 400, 360);
    neb2.addColorStop(0, 'rgba(224, 64, 251, 0.14)');
    neb2.addColorStop(1, 'transparent');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, 1200, 630);

    // 2. Outer Cybernetic Frame
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, 1152, 582);

    ctx.strokeStyle = 'rgba(224, 64, 251, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 32, 1136, 566);

    // Corner brackets
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    const cornerSize = 28;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(24, 24 + cornerSize); ctx.lineTo(24, 24); ctx.lineTo(24 + cornerSize, 24);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(1176 - cornerSize, 24); ctx.lineTo(1176, 24); ctx.lineTo(1176, 24 + cornerSize);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(24, 606 - cornerSize); ctx.lineTo(24, 606); ctx.lineTo(24 + cornerSize, 606);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(1176 - cornerSize, 606); ctx.lineTo(1176, 606); ctx.lineTo(1176, 606 - cornerSize);
    ctx.stroke();

    // 3. Header Banner
    ctx.font = '900 13px Orbitron, Inter, sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.letterSpacing = '3px';
    ctx.fillText('GUARDIAN COMMAND TELEMETRY • OFFICIAL BATTLE RECORD', 60, 68);

    ctx.font = '900 26px Orbitron, Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('SPARK PANIC: PLANETARY INVASION DEFENSE', 60, 105);

    ctx.font = '700 13px Orbitron, Inter, sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'right';
    ctx.fillText("v2.5 COMMANDER'S ULTIMATE EDITION", 1150, 105);
    ctx.textAlign = 'left';

    // Top Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 122);
    ctx.lineTo(1140, 122);
    ctx.stroke();

    // 4. Left Column: Commander Profile & Target Planet
    const rank = saveSystem.getGuardianRank ? saveSystem.getGuardianRank() : { title: 'COMMANDER' };
    const totalStars = saveSystem.getTotalStars ? saveSystem.getTotalStars() : 0;
    const ascensionTier = saveSystem.data?.ascensionTier || 0;
    const endlessBest = saveSystem.data?.endlessBestWave || 0;

    // Commander Badge Panel
    ctx.fillStyle = 'rgba(12, 18, 40, 0.7)';
    ctx.fillRect(60, 142, 320, 110);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.strokeRect(60, 142, 320, 110);

    ctx.font = '700 10px Orbitron, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('COMMANDER DOSSIER', 78, 168);

    ctx.font = '900 18px Orbitron, sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(rank.title.toUpperCase(), 78, 196);

    ctx.font = '700 12px Orbitron, sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`★ ${totalStars} / 60 LIBERATED STARS`, 78, 224);

    if (ascensionTier > 0) {
      ctx.fillStyle = '#a855f7';
      ctx.fillText(`🌌 ASCENSION TIER ${'I'.repeat(ascensionTier)}`, 78, 242);
    } else {
      ctx.fillStyle = '#e040fb';
      ctx.fillText(`♾️ SIEGE RECORD: WAVE ${endlessBest}`, 78, 242);
    }

    // Mini Planet Illustration & Mission Brief
    const planetId = engine.currentPlanetId || 1;
    const planetCfg = PLANETS.find(p => p.id === planetId) || PLANETS[0];
    const isWin = engine.state === 'VICTORY';
    const isTitan = !!engine.isTitanProtocolMode;
    const isEndless = !!engine.isEndlessMode;

    let missionStatus = isWin ? 'PLANET LIBERATED' : 'PLANET DEFENSE REPORT';
    if (isTitan) missionStatus = isWin ? 'TITAN PROTOCOL CONQUERED' : 'TITAN GAUNTLET RECORD';
    else if (isEndless) missionStatus = `ENDLESS SIEGE WAVE ${engine.currentWave}`;

    ctx.fillStyle = 'rgba(12, 18, 40, 0.7)';
    ctx.fillRect(60, 268, 320, 185);
    ctx.strokeStyle = isWin ? 'rgba(0, 230, 118, 0.35)' : 'rgba(255, 51, 102, 0.35)';
    ctx.strokeRect(60, 268, 320, 185);

    // Draw Mini Planet Sphere
    const pX = 115;
    const pY = 345;
    const pRad = 36;
    const pGrad = ctx.createRadialGradient(pX - 12, pY - 12, 4, pX, pY, pRad);
    pGrad.addColorStop(0, planetCfg.color2 || '#00e5ff');
    pGrad.addColorStop(0.7, planetCfg.color1 || '#0284c7');
    pGrad.addColorStop(1, '#050814');
    ctx.beginPath();
    ctx.arc(pX, pY, pRad, 0, Math.PI * 2);
    ctx.fillStyle = pGrad;
    ctx.fill();

    ctx.strokeStyle = planetCfg.atmo || '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = planetCfg.atmo || '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Planet Metadata
    ctx.font = '900 16px Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(planetCfg.name.toUpperCase(), 175, 335);

    ctx.font = '700 11px Orbitron, sans-serif';
    ctx.fillStyle = isWin ? '#00e676' : '#ff3366';
    ctx.fillText(missionStatus, 175, 355);

    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(planetCfg.title || 'Terran Haven', 175, 375);

    ctx.font = '700 12px Orbitron, sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`WAVE ${engine.currentWave} / ${engine.totalWaves || 2}`, 175, 400);

    // 5. Center/Right Area: Combat Stats & Sparkline Telemetry
    ctx.fillStyle = 'rgba(12, 18, 40, 0.7)';
    ctx.fillRect(405, 142, 735, 311);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(405, 142, 735, 311);

    // Combat Metric Blocks (4 Stats in row)
    const metrics = [
      { label: 'SCORE', val: (engine.score || 0).toLocaleString(), color: '#00e5ff' },
      { label: 'MAX COMBO', val: `x${engine.maxCombo || 1}`, color: '#e040fb' },
      { label: 'VAPORIZED', val: `${engine.enemiesVaporized || 0}`, color: '#00e676' },
      { label: 'CORE INTEGRITY', val: `${Math.round(((engine.planet?.coreHp || 100) / (engine.planet?.maxCoreHp || 100)) * 100)}%`, color: '#ffd700' }
    ];

    const blockW = 168;
    metrics.forEach((m, idx) => {
      const bx = 425 + idx * (blockW + 12);
      ctx.fillStyle = 'rgba(5, 8, 20, 0.85)';
      ctx.fillRect(bx, 158, blockW, 64);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeRect(bx, 158, blockW, 64);

      ctx.font = '700 10px Orbitron, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(m.label, bx + 12, 180);

      ctx.font = '900 18px Orbitron, sans-serif';
      ctx.fillStyle = m.color;
      ctx.fillText(m.val, bx + 12, 206);
    });

    // Sparkline Graph Title & Legend
    const boxX = 405;
    const boxY = 232;
    const boxW = 735;

    ctx.font = '700 11px Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('POST-BATTLE TACTICAL TELEMETRY SPARKLINE', boxX + 16, boxY + 22);

    ctx.font = '600 10px Orbitron, sans-serif';
    ctx.textAlign = 'right';
    const comboLabel = '● Combo Surge Peak';
    const integrityLabel = '● Planetary Integrity';
    const legendSpace = '   ';
    const comboW = (ctx.measureText && ctx.measureText(comboLabel)?.width) || 120;
    const spaceW = (ctx.measureText && ctx.measureText(legendSpace)?.width) || 12;

    ctx.fillStyle = '#e040fb';
    ctx.fillText(comboLabel, boxX + boxW - 16, boxY + 22);

    ctx.fillStyle = '#00e676';
    ctx.fillText(integrityLabel, boxX + boxW - 16 - comboW - spaceW, boxY + 22);
    ctx.textAlign = 'left';

    // Sparkline Chart Box (695 x 110)
    const chartX = 425;
    const chartY = 268;
    const chartW = 695;
    const chartH = 110;

    ctx.fillStyle = 'rgba(3, 5, 12, 0.9)';
    ctx.fillRect(chartX, chartY, chartW, chartH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeRect(chartX, chartY, chartW, chartH);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach(pct => {
      ctx.beginPath();
      ctx.moveTo(chartX, chartY + chartH * pct);
      ctx.lineTo(chartX + chartW, chartY + chartH * pct);
      ctx.stroke();
    });

    // Draw sparklines from engine.telemetryHistory
    const hist = [...(engine.telemetryHistory || [])];
    if (hist.length < 2) {
      hist.unshift({ time: 0, combo: 1, integrity: 100 });
      hist.push({ time: Math.round(engine.missionTimer || 1), combo: Math.max(1, engine.combo || 1), integrity: 85 });
    }

    const n = hist.length;
    let maxC = 5;
    for (const h of hist) if (h.combo > maxC) maxC = h.combo;

    // Draw Integrity curve (#00e676)
    ctx.beginPath();
    hist.forEach((pt, i) => {
      const gx = chartX + 10 + (i / (n - 1)) * (chartW - 20);
      const gy = chartY + chartH - (pt.integrity / 100) * (chartH - 18) - 9;
      if (i === 0) ctx.moveTo(gx, gy);
      else ctx.lineTo(gx, gy);
    });
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw Combo Peak curve (#e040fb)
    ctx.beginPath();
    hist.forEach((pt, i) => {
      const gx = chartX + 10 + (i / (n - 1)) * (chartW - 20);
      const gy = chartY + chartH - (pt.combo / maxC) * (chartH - 24) - 12;
      if (i === 0) ctx.moveTo(gx, gy);
      else ctx.lineTo(gx, gy);
    });
    ctx.strokeStyle = '#e040fb';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Damage Breakdown Bar
    const totalDmg = (engine.damageSources?.turret || 0) + (engine.damageSources?.nova || 0) + (engine.damageSources?.wingman || 0);
    let pT = 55, pN = 30, pW = 15;
    if (totalDmg > 0) {
      pT = Math.round((engine.damageSources.turret / totalDmg) * 100);
      pN = Math.round((engine.damageSources.nova / totalDmg) * 100);
      pW = Math.max(0, 100 - pT - pN);
    }

    ctx.font = '700 10px Orbitron, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`DAMAGE ATTRIBUTION: Turret ${pT}% • Novas ${pN}% • Wingman/Structures ${pW}%`, 425, 400);

    const barY2 = 412;
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(425, barY2, (chartW * pT) / 100, 8);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(425 + (chartW * pT) / 100, barY2, (chartW * pN) / 100, 8);
    ctx.fillStyle = '#00e676';
    ctx.fillRect(425 + (chartW * (pT + pN)) / 100, barY2, (chartW * pW) / 100, 8);

    // 6. Bottom Strip: Active Tactical Loadout & 3 Equipped Cosmic Relics
    ctx.fillStyle = 'rgba(12, 18, 40, 0.7)';
    ctx.fillRect(60, 468, 1080, 95);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.strokeRect(60, 468, 1080, 95);

    // Chassis & Wingman summary
    const chassisId = saveSystem.getSelectedChassis ? saveSystem.getSelectedChassis() : 'striker';
    const chassisCfg = CHASSIS_CONFIG[chassisId] || CHASSIS_CONFIG.striker;
    const skinId = saveSystem.getSelectedTurretSkin ? saveSystem.getSelectedTurretSkin() : 'sentinel';
    const skinCfg = TURRET_SKINS[skinId] || TURRET_SKINS.sentinel;
    const doctrineId = saveSystem.getSelectedWingmanDoctrine ? saveSystem.getSelectedWingmanDoctrine() : 'aegis';
    const doctrineCfg = WINGMAN_CONFIG.doctrines[doctrineId] || WINGMAN_CONFIG.doctrines.aegis;

    ctx.font = '700 9px Orbitron, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('EQUIPPED CHASSIS & SKIN', 80, 492);
    ctx.font = '900 13px Orbitron, sans-serif';
    ctx.fillStyle = chassisCfg.color || '#00e5ff';
    ctx.fillText(`${chassisCfg.name.toUpperCase()} (${skinCfg.name})`, 80, 514);
    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Wingman: ${doctrineCfg.name}`, 80, 536);

    // 3 Equipped Cosmic Relics
    ctx.font = '700 9px Orbitron, sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('ANCIENT COSMIC RELICS (3 SLOTS)', 480, 492);

    const equippedRelics = saveSystem.getEquippedRelics ? saveSystem.getEquippedRelics() : [];
    for (let slot = 0; slot < 3; slot++) {
      const rx = 480 + slot * 215;
      const ry = 502;
      ctx.fillStyle = 'rgba(5, 8, 20, 0.85)';
      ctx.fillRect(rx, ry, 200, 46);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
      ctx.strokeRect(rx, ry, 200, 46);

      const r = equippedRelics[slot];
      if (r) {
        ctx.font = '18px sans-serif';
        ctx.fillText(r.icon, rx + 10, ry + 30);
        ctx.font = '800 11px Orbitron, sans-serif';
        ctx.fillStyle = r.color || '#ffffff';
        ctx.fillText(r.name, rx + 36, ry + 22);
        ctx.font = '600 9px Inter, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('ACTIVE PASSIVE', rx + 36, ry + 36);
      } else {
        ctx.font = '700 10px Orbitron, sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(`[EMPTY RELIC SLOT ${slot + 1}]`, rx + 24, ry + 28);
      }
    }

    // 7. Footer Watermark
    ctx.font = '700 11px Orbitron, Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillText('PLAY FREE ONLINE: asemdnn.github.io/spark-panic/', 60, 590);

    ctx.font = '700 10px Orbitron, sans-serif';
    ctx.fillStyle = 'rgba(0, 229, 255, 0.6)';
    ctx.fillText('COSMIC CARTOGRAPHY VERIFIED • 360° PLANETARY DEFENSE', 740, 590);

    return canvas;
  }

  static renderInto(targetCanvas, engine, saveSystem) {
    const offscreen = this.renderCard(engine, saveSystem);
    if (!targetCanvas) return offscreen;
    targetCanvas.width = 1200;
    targetCanvas.height = 630;
    const ctx = targetCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(offscreen, 0, 0);
    }
    return targetCanvas;
  }

  static downloadCard(canvas, filename = 'spark-panic-commander-card.png') {
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = filename;
    a.href = canvas.toDataURL('image/png');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  static async copyCardToClipboard(canvas, engine) {
    if (!canvas) return false;

    // Try copying image blob if supported
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          return 'IMAGE_COPIED';
        }
      } catch (e) {
        console.debug('Direct image blob clipboard failed, trying text fallback:', e);
      }
    }

    // Fallback: copy formatted tactical stats text for social / Discord
    const score = (engine.score || 0).toLocaleString();
    const combo = engine.maxCombo || 1;
    const wave = engine.currentWave || 1;
    const text = `🪐 SPARK PANIC: PLANETARY INVASION DEFENSE (v2.5)\n` +
      `🛡️ Mission Score: ${score} pts • Max Chain Combo: x${combo} • Wave Reached: ${wave}\n` +
      `🎮 Defend 20 living worlds: https://asemdnn.github.io/spark-panic/`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return 'TEXT_COPIED';
    } else {
      prompt('Copy your Commander Battle Record:', text);
      return 'PROMPT';
    }
  }
}
