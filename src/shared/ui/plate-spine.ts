import { create } from './dom';

const LABEL_CLASS =
  'min-h-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold uppercase tracking-[0.18em] [writing-mode:vertical-rl]';

export interface PlateSpine {
  readonly element: HTMLElement;
  setLabel(text: string): void;
  append(node: HTMLElement): void;
}

export function createPlateSpine(closeButton: HTMLElement, label: string): PlateSpine {
  const element = create('div', 'plate-spine');
  const text = create('p', LABEL_CLASS, label);
  element.append(closeButton, text);
  return {
    element,
    setLabel(next) {
      text.textContent = next;
    },
    append(node) {
      element.append(node);
    },
  };
}
