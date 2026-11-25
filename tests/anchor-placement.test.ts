import { describe, expect, it } from 'vitest';
import { placeAnchored } from '../src/shared/ui/anchor-placement';

const VIEWPORT = { width: 1000, height: 700 };
const CARD = { width: 300, height: 200 };
const MARGIN = 16;
const GAP = 40;

describe('placeAnchored', () => {
  it('menaruh kartu di atas hotspot dan memusatkannya secara horizontal', () => {
    const placement = placeAnchored({ x: 500, y: 400 }, CARD, VIEWPORT, MARGIN, GAP);
    expect(placement.side).toBe('above');
    expect(placement.x).toBe(350);
    expect(placement.y).toBe(160);
  });

  it('turun ke bawah hotspot bila tidak muat di atas', () => {
    const placement = placeAnchored({ x: 500, y: 150 }, CARD, VIEWPORT, MARGIN, GAP);
    expect(placement.side).toBe('below');
    expect(placement.y).toBe(190);
  });

  it('ekor menunjuk tepat ke hotspot bila tidak terjepit tepi', () => {
    const placement = placeAnchored({ x: 500, y: 400 }, CARD, VIEWPORT, MARGIN, GAP);
    expect(placement.x + placement.tailX).toBe(500);
  });

  it('kartu tertahan di tepi kiri dan ekornya tetap mengarah ke hotspot', () => {
    const placement = placeAnchored({ x: 40, y: 400 }, CARD, VIEWPORT, MARGIN, GAP);
    expect(placement.x).toBe(MARGIN);
    expect(placement.x + placement.tailX).toBeCloseTo(40, 0);
  });

  it('kartu tertahan di tepi kanan', () => {
    const placement = placeAnchored({ x: 990, y: 400 }, CARD, VIEWPORT, MARGIN, GAP);
    expect(placement.x).toBe(VIEWPORT.width - CARD.width - MARGIN);
  });

  it('ekor tidak keluar dari badan kartu walau hotspot jauh di luar layar', () => {
    const far = placeAnchored({ x: -500, y: 400 }, CARD, VIEWPORT, MARGIN, GAP);
    expect(far.tailX).toBeGreaterThan(0);
    expect(far.tailX).toBeLessThan(CARD.width);
    const beyond = placeAnchored({ x: 5000, y: 400 }, CARD, VIEWPORT, MARGIN, GAP);
    expect(beyond.tailX).toBeGreaterThan(0);
    expect(beyond.tailX).toBeLessThan(CARD.width);
  });

  it('kartu tidak pernah melewati batas atas atau bawah layar', () => {
    for (const y of [-100, 0, 100, 350, 600, 900]) {
      const placement = placeAnchored({ x: 500, y }, CARD, VIEWPORT, MARGIN, GAP);
      expect(placement.y).toBeGreaterThanOrEqual(MARGIN);
      expect(placement.y + CARD.height).toBeLessThanOrEqual(VIEWPORT.height - MARGIN);
    }
  });

  it('kartu lebih besar dari layar tetap mulai di margin, bukan negatif', () => {
    const placement = placeAnchored(
      { x: 100, y: 100 },
      { width: 2000, height: 2000 },
      VIEWPORT,
      MARGIN,
      GAP,
    );
    expect(placement.x).toBe(MARGIN);
    expect(placement.y).toBe(MARGIN);
  });
});
