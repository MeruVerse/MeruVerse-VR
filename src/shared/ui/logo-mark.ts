const SVG_NS = 'http://www.w3.org/2000/svg';
const MARK_SIZE = '30';

export function createLogoMark(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('width', MARK_SIZE);
  svg.setAttribute('height', MARK_SIZE);
  svg.setAttribute('aria-hidden', 'true');
  const ring = document.createElementNS(SVG_NS, 'circle');
  ring.setAttribute('cx', '16');
  ring.setAttribute('cy', '16');
  ring.setAttribute('r', '14.5');
  ring.setAttribute('fill', 'none');
  ring.setAttribute('stroke-width', '1.5');
  ring.setAttribute('stroke', 'currentColor');
  const peaks = document.createElementNS(SVG_NS, 'path');
  peaks.setAttribute('d', 'M7.5 21.5 14 10.5l4 6.5 2.5-3.5 4 8z');
  peaks.style.fill = 'var(--logo-accent, var(--color-accent))';
  svg.append(ring, peaks);
  return svg;
}
