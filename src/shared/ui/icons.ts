const SVG_NS = 'http://www.w3.org/2000/svg';
const ICON_SIZE = '20';

const PATHS = {
  map: 'M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7 9 4Zm0 0v13m6-10v13',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  shrink: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5',
  exit: 'M10 5H5v14h5M14 8l4 4-4 4M18 12H9',
} as const;

export type IconName = keyof typeof PATHS;

export function createIcon(name: IconName): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', ICON_SIZE);
  svg.setAttribute('height', ICON_SIZE);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.append(document.createElementNS(SVG_NS, 'path'));
  setIcon(svg, name);
  return svg;
}

export function setIcon(svg: SVGSVGElement, name: IconName): void {
  svg.querySelector('path')?.setAttribute('d', PATHS[name]);
}
