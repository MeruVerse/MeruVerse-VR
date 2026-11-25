export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export type AnchorSide = 'above' | 'below';

export interface AnchorPlacement {
  readonly x: number;
  readonly y: number;
  readonly side: AnchorSide;
  readonly tailX: number;
}

const TAIL_INSET = 24;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), Math.max(min, max));

export function placeAnchored(
  anchor: Point,
  card: Size,
  viewport: Size,
  margin: number,
  gap: number,
): AnchorPlacement {
  const fitsAbove = anchor.y - gap - card.height >= margin;
  const rawY = fitsAbove ? anchor.y - gap - card.height : anchor.y + gap;
  const y = clamp(rawY, margin, viewport.height - card.height - margin);
  const x = clamp(anchor.x - card.width / 2, margin, viewport.width - card.width - margin);
  return {
    x,
    y,
    side: fitsAbove ? 'above' : 'below',
    tailX: clamp(anchor.x - x, TAIL_INSET, card.width - TAIL_INSET),
  };
}
