// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { ICON_SVG } from '../src/ui/icons.js';

describe('Crisp Inline Vector SVG Icon System (v2.1)', () => {
  it('should render glowing diamond Star Shard SVG', () => {
    const svg = ICON_SVG.shard();
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z');
  });

  it('should render filled and outlined Star rating SVGs', () => {
    const filledStar = ICON_SVG.star('w-4 h-4 text-cosmic-gold', true);
    const outlinedStar = ICON_SVG.star('w-4 h-4 text-slate-700', false);
    expect(filledStar).toContain('<svg');
    expect(outlinedStar).toContain('<svg');
    expect(filledStar).not.toEqual(outlinedStar);
  });

  it('should render crisp modal close button X SVG', () => {
    const closeSvg = ICON_SVG.close();
    expect(closeSvg).toContain('<svg');
    expect(closeSvg).toContain('M6 6l12 12M18 6L6 18');
  });

  it('should render all utility icons without throwing errors', () => {
    const utilityKeys = [
      'planet', 'rocket', 'refresh', 'bolt', 'shield',
      'wrench', 'book', 'infinity', 'pause', 'play',
      'arrowRight', 'map', 'lock', 'crown', 'trophy', 'pod'
    ];

    utilityKeys.forEach(key => {
      const fn = ICON_SVG[key];
      expect(typeof fn).toBe('function');
      const rendered = fn();
      expect(rendered).toContain('<svg');
      expect(rendered).toContain('</svg>');
    });

    const unmutedVol = ICON_SVG.volume(false);
    const mutedVol = ICON_SVG.volume(true);
    expect(unmutedVol).toContain('<svg');
    expect(mutedVol).toContain('<svg');
    expect(unmutedVol).not.toEqual(mutedVol);
  });

  it('should render distinct custom SVG ship diagrams for all 7 Alien Classes in Codex', () => {
    const classes = ['SCOUT', 'INTERCEPTOR', 'CRYO', 'PHASE', 'DROPSHIP', 'DREADNOUGHT', 'BOSS'];
    const renderedSet = new Set();

    classes.forEach(cls => {
      const shipSvg = ICON_SVG.shipSvg(cls);
      expect(shipSvg).toContain('<svg');
      expect(shipSvg).toContain('viewBox="0 0 48 48"');
      expect(shipSvg).toContain('</svg>');
      // Must be unique for each class
      expect(renderedSet.has(shipSvg)).toBe(false);
      renderedSet.add(shipSvg);
    });

    expect(renderedSet.size).toBe(7);
  });
});
