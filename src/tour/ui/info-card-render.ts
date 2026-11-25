import { create } from '../../shared/ui/dom';
import { type ArtworkView, EMPTY_INFO_TEXT } from './artwork-view';

export const NOTE_LABEL = 'Informasi';

const WIDE_FACT_LENGTH = 18;

function renderFacts(view: ArtworkView): HTMLElement {
  const list = create('dl', 'mt-5 grid grid-cols-2 gap-x-4 gap-y-3');
  for (const fact of view.facts) {
    const wide = fact.value.length > WIDE_FACT_LENGTH ? ' col-span-2' : '';
    const cell = create('div', `border-t border-paper/20 pt-2${wide}`);
    cell.append(
      create(
        'dt',
        'text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-paper/55',
        fact.label,
      ),
      create('dd', 'mt-0.5 text-sm font-medium leading-snug', fact.value),
    );
    list.append(cell);
  }
  return list;
}

export function renderView(container: HTMLElement, view: ArtworkView | null): void {
  if (!view) {
    container.replaceChildren(create('p', 'text-base text-paper/80', EMPTY_INFO_TEXT));
    return;
  }
  const nodes: HTMLElement[] = [];
  if (view.imageUrl) {
    const image = create('img', 'mb-4 h-32 w-full bg-ink object-contain');
    image.src = view.imageUrl;
    image.alt = `Foto karya ${view.title}`;
    image.decoding = 'async';
    nodes.push(image);
  }
  nodes.push(
    create(
      'h3',
      'text-balance text-[1.625rem] font-bold leading-[1.1] tracking-[-0.025em]',
      view.title,
    ),
  );
  if (view.facts.length > 0) nodes.push(renderFacts(view));
  nodes.push(
    create(
      'p',
      'mt-5 whitespace-pre-line text-[0.9375rem] leading-relaxed text-paper/80',
      view.description,
    ),
  );
  container.replaceChildren(...nodes);
}
