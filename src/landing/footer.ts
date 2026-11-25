import type { Cleanup } from '../shared/cleanup';
import { create } from '../shared/ui/dom';
import { createLogoMark } from '../shared/ui/logo-mark';
import { LINKS } from './content';

const LINK_CLASS = 'underline decoration-flame decoration-2 underline-offset-4';

function externalLink(label: string, href: string): HTMLAnchorElement {
  const link = create('a', LINK_CLASS, label);
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  return link;
}

export function initFooter(): Cleanup {
  const footer = document.querySelector<HTMLElement>('[data-footer]');
  if (!footer) return () => undefined;
  const wrap = create(
    'div',
    'mx-auto flex max-w-[1200px] flex-col gap-8 md:flex-row md:justify-between',
  );
  const brand = create('p', 'flex items-center gap-3 text-jet');
  brand.append(
    createLogoMark(),
    create('span', 'text-[0.9375rem] font-bold tracking-[0.28em]', 'MERUVERSE'),
  );
  const links = create('p', 'flex flex-wrap gap-x-6 gap-y-2 font-semibold text-jet');
  links.append(externalLink('Artmeru AR', LINKS.ar), externalLink('artmeru.com', LINKS.site));
  const credit = create(
    'p',
    'max-w-sm',
    'Studi Kasus A, mata kuliah Realitas Terkembang, Universitas Brawijaya.',
  );
  wrap.append(brand, credit, links);
  footer.append(wrap);
  return () => wrap.remove();
}
