import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type { Cleanup } from '../../shared/cleanup';
import { prefersReducedMotion } from '../../shared/motion/reduced-motion';
import { DISTANCE, DURATION, EASE, SCALE, STAGGER } from '../../shared/motion/tokens';
import { create } from '../../shared/ui/dom';
import { LINKS, VISIT } from '../content';

const TERM_CLASS = 'text-sm font-semibold uppercase tracking-[0.14em] text-charcoal';

function buildVisit(container: HTMLElement): void {
  const list = create('dl', 'space-y-8');
  for (const row of VISIT.rows) {
    const item = create('div');
    item.append(
      create('dt', TERM_CLASS, row.term),
      create('dd', 'mt-2 text-lg leading-snug', row.text),
    );
    list.append(item);
  }
  const site = create(
    'a',
    'inline-block font-semibold underline decoration-flame decoration-2 underline-offset-4',
    VISIT.siteLabel,
  );
  site.href = LINKS.site;
  site.target = '_blank';
  site.rel = 'noopener';
  container.append(list, site);
  site.classList.add('mt-8');
}

export function initCta(): Cleanup {
  const section = document.querySelector<HTMLElement>('[data-cta]');
  const title = section?.querySelector<HTMLElement>('h2');
  const note = section?.querySelector<HTMLElement>('[data-cta-note]');
  const button = section?.querySelector<HTMLElement>('[data-portal]');
  const visit = section?.querySelector<HTMLElement>('[data-visit]');
  if (!section || !title || !note || !button || !visit) return () => undefined;

  buildVisit(visit);
  if (prefersReducedMotion()) return () => undefined;

  gsap.registerPlugin(SplitText);
  let split: SplitText | null = null;
  const context = gsap.context(() => {
    split = SplitText.create(title, { type: 'lines', mask: 'lines' });
    const timeline = gsap.timeline({
      scrollTrigger: { trigger: title, start: 'top 85%', once: true },
    });
    timeline.from(split.lines, {
      yPercent: 110,
      duration: DURATION.slow,
      ease: EASE.out,
      stagger: STAGGER.lines,
    });
    timeline.from(
      [note, visit],
      { opacity: 0, y: DISTANCE.revealY, duration: DURATION.base, ease: EASE.out },
      '-=0.6',
    );
    timeline.from(
      button,
      { opacity: 0, scale: SCALE.popFrom, duration: DURATION.base, ease: EASE.out },
      '-=0.4',
    );
  }, section);
  return () => {
    split?.revert();
    context.revert();
  };
}
