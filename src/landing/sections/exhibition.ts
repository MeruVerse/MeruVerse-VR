import { gsap } from 'gsap';
import type { Cleanup } from '../../shared/cleanup';
import { create } from '../../shared/ui/dom';
import { EXHIBITION, LINKS } from '../content';
import { revealOnScroll } from '../reveal';

const IMAGE_SIZE = 1280;
const TITLE_CLASS =
  'mt-6 text-balance text-[clamp(3rem,8vw,7.5rem)] font-extrabold leading-[0.9] tracking-[-0.045em]';
const TERM_CLASS = 'text-sm font-semibold uppercase tracking-[0.14em] text-ash';
const LINK_CLASS =
  'mt-10 inline-block text-sm font-semibold underline decoration-flame decoration-2 underline-offset-4';

function buildFacts(): HTMLElement {
  const facts = create('dl', 'mt-10 grid gap-8 sm:grid-cols-2');
  const date = create('div');
  date.append(
    create('dt', TERM_CLASS, 'Tanggal'),
    create('dd', 'mt-2 text-xl font-bold leading-snug tracking-[-0.01em]', EXHIBITION.dates),
  );
  const place = create('div');
  place.append(
    create('dt', TERM_CLASS, 'Tempat'),
    create('dd', 'mt-2 text-xl font-bold leading-snug tracking-[-0.01em]', EXHIBITION.place),
    create('dd', 'mt-1 text-ash', EXHIBITION.address),
  );
  facts.append(date, place);
  return facts;
}

function buildArtists(): { title: HTMLElement; list: HTMLElement } {
  const list = create('ul', 'mt-4 columns-2 gap-x-8 sm:columns-3');
  list.append(
    ...EXHIBITION.artists.map((name) => create('li', 'break-inside-avoid py-1 text-lg', name)),
  );
  return { title: create('h3', `${TERM_CLASS} mt-14`, EXHIBITION.artistsTitle), list };
}

export function initExhibition(): Cleanup {
  const section = document.querySelector<HTMLElement>('[data-exhibition]');
  if (!section) return () => undefined;

  const grid = create('div', 'mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-12 lg:gap-16');
  const figure = create('figure', 'lg:col-span-5');
  const frame = create('div', 'aspect-[4/5] overflow-hidden rounded-[30px] bg-fog');
  const image = create('img', 'size-full object-cover');
  image.src = EXHIBITION.image.src;
  image.srcset = `${EXHIBITION.image.small} 640w, ${EXHIBITION.image.src} 1280w`;
  image.sizes = '(min-width: 1024px) 448px, 100vw';
  image.alt = EXHIBITION.image.alt;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.width = IMAGE_SIZE;
  image.height = IMAGE_SIZE;
  frame.append(image);
  figure.append(frame);

  const text = create('div', 'lg:col-span-7');
  const label = create('p', TERM_CLASS, EXHIBITION.label);
  const title = create('h2', TITLE_CLASS, EXHIBITION.title);
  const summary = create('div', 'mt-10 max-w-xl space-y-5 text-lg leading-relaxed text-charcoal');
  summary.append(...EXHIBITION.summary.map((paragraph) => create('p', '', paragraph)));
  const site = create('a', LINK_CLASS, 'artmeru.com');
  site.href = LINKS.site;
  site.target = '_blank';
  site.rel = 'noopener';
  const facts = buildFacts();
  const artists = buildArtists();
  text.append(label, title, facts, summary, artists.title, artists.list, site);
  grid.append(figure, text);
  section.append(grid);

  const context = gsap.context(() => {
    revealOnScroll([figure, label, title, facts, summary]);
    revealOnScroll([artists.title, artists.list]);
  }, section);
  return () => {
    context.revert();
    grid.remove();
  };
}
