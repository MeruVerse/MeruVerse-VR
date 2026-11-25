import type { Hotspot } from '../data/types';

const DECIMAL_SCALE = 10;

export function roundCoordinate(value: number): number {
  const rounded = Math.round(value * DECIMAL_SCALE) / DECIMAL_SCALE;
  return rounded === 0 ? 0 : rounded;
}

function quote(value: string): string {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

export function formatPoint(yaw: number, pitch: number): string {
  return `{ yaw: ${roundCoordinate(yaw)}, pitch: ${roundCoordinate(pitch)} }`;
}

export function formatInitialYaw(yaw: number): string {
  return `{ initialYaw: ${roundCoordinate(yaw)} }`;
}

export function formatHotspotSnippet(hotspot: Hotspot, yaw: number, pitch: number): string {
  const fields = [
    `id: ${quote(hotspot.id)}`,
    `type: ${quote(hotspot.type)}`,
    `yaw: ${roundCoordinate(yaw)}`,
    `pitch: ${roundCoordinate(pitch)}`,
  ];
  if (hotspot.type === 'nav') fields.push(`target: ${quote(hotspot.target)}`);
  else if ('artworkIds' in hotspot) {
    fields.push(`artworkIds: [${hotspot.artworkIds.map(quote).join(', ')}]`);
  } else fields.push(`title: ${quote(hotspot.title)}`, `body: ${quote(hotspot.body)}`);
  if (hotspot.label !== undefined) fields.push(`label: ${quote(hotspot.label)}`);
  return `{ ${fields.join(', ')} },`;
}
