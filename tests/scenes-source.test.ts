import { describe, expect, it } from 'vitest';
import draft from '../content/scenes.draft.json';
import { SCENES, ZONES } from '../src/tour/data/scenes';
import type { Hotspot } from '../src/tour/data/types';

const candidateLinks: readonly { from: string; to: string }[] = draft.candidateLinks;

const navEdges = (hotspots: readonly Hotspot[], from: string) =>
  hotspots.flatMap((hotspot) => (hotspot.type === 'nav' ? [`${from}>${hotspot.target}`] : []));

describe('scenes.ts mengikuti content/scenes.draft.json', () => {
  it('urutan scene sama dengan rute', () => {
    expect(SCENES.map((scene) => scene.id)).toEqual(draft.route);
  });

  it('judul, zona, arah awal, dan panorama sama dengan draf', () => {
    for (const source of draft.scenes) {
      const scene = SCENES.find((candidate) => candidate.id === source.id);
      expect(scene?.title).toBe(source.title);
      expect(scene?.zone).toBe(source.zone);
      expect(scene?.initialYaw).toBe(source.initialYaw);
      expect(scene?.panorama).toEqual(source.panorama);
    }
  });

  it('label dan entry zona sama dengan draf', () => {
    expect(ZONES).toEqual(draft.zones);
  });

  it('hotspot nav tepat sama dengan links dua arah, tanpa candidateLinks', () => {
    const expected = draft.links.flatMap((link) => [
      `${link.from}>${link.to}`,
      `${link.to}>${link.from}`,
    ]);
    const actual = SCENES.flatMap((scene) => navEdges(scene.hotspots, scene.id));
    expect([...actual].sort()).toEqual([...expected].sort());
    for (const candidate of candidateLinks) {
      expect(actual).not.toContain(`${candidate.from}>${candidate.to}`);
    }
  });

  it('tidak ada label hotspot buatan sendiri', () => {
    const hotspots = SCENES.flatMap((scene) => scene.hotspots);
    expect(hotspots.some((hotspot) => hotspot.label !== undefined)).toBe(false);
  });

  it('tidak memakai nama ruang lama "Ruang Instalasi"', () => {
    expect(JSON.stringify([SCENES, ZONES])).not.toContain('Instalasi');
  });
});
