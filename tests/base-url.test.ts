import { describe, expect, it } from 'vitest';
import { joinBase, withBase } from '../src/shared/base-url';

describe('joinBase', () => {
  it('menyambung base dan jalur dengan satu garis miring', () => {
    expect(joinBase('/', '/panos/a.webp')).toBe('/panos/a.webp');
    expect(joinBase('/MeruVerse-VR/', '/panos/a.webp')).toBe('/MeruVerse-VR/panos/a.webp');
    expect(joinBase('/MeruVerse-VR', 'panos/a.webp')).toBe('/MeruVerse-VR/panos/a.webp');
  });
});

describe('withBase', () => {
  it('di lingkungan uji base adalah akar sehingga jalur tidak berubah', () => {
    expect(withBase('/karya/x.webp')).toBe('/karya/x.webp');
  });
});
