export function hasFinePointer(): boolean {
  return window.matchMedia('(pointer: fine) and (hover: hover)').matches;
}
