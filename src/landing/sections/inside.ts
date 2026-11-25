import { gsap } from 'gsap';
import type { Cleanup } from '../../shared/cleanup';
import { create } from '../../shared/ui/dom';
import { INSIDE } from '../content';
import { revealOnScroll } from '../reveal';

const HEADING_CLASS =
  'text-balance text-[clamp(3rem,8vw,7.5rem)] font-extrabold leading-[0.9] tracking-[-0.045em]';

export function initInside(): Cleanup {
  const section = document.querySelector<HTMLElement>('[data-inside]');
  if (!section) return () => undefined;

  const wrap = create('div', 'mx-auto max-w-[1200px]');
  const heading = create('h2', HEADING_CLASS, INSIDE.title);
  const list = create('dl', 'mt-16 border-b border-haze');
  const rows = INSIDE.rows.map((row) => {
    const item = create('div', 'grid gap-4 border-t border-haze py-10 md:grid-cols-12 md:gap-10');
    item.append(
      create(
        'dt',
        'text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-none tracking-[-0.04em] md:col-span-5',
        row.term,
      ),
      create('dd', 'max-w-xl text-xl leading-relaxed text-charcoal md:col-span-7', row.text),
    );
    return item;
  });
  list.append(...rows);
  wrap.append(heading, list);
  section.append(wrap);

  const context = gsap.context(() => revealOnScroll([heading, ...rows]), section);
  return () => {
    context.revert();
    wrap.remove();
  };
}
