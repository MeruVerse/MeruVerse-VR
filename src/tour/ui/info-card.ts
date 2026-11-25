import type { Cleanup } from '../../shared/cleanup';
import { create } from '../../shared/ui/dom';
import { type AnchorProvider, createPanel } from '../../shared/ui/panel';
import { createPlateSpine } from '../../shared/ui/plate-spine';
import type { Artist, Artwork } from '../data/types';
import { type ArtworkView, buildNoteView, resolveArtworkViews } from './artwork-view';
import { NOTE_LABEL, renderView } from './info-card-render';
import { createNarrationButton, type NarrationButton } from './narration-button';
import { createNarrationPlayer } from './narration-player';
import { nextTabIndex } from './tab-navigation';

const ARTWORK_TITLE = 'Informasi Karya';
const NOTE_TITLE = 'Informasi';
const NOTE_ID = 'note';
const SCROLL_CLASS = 'plate-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5 outline-none';

export interface InfoCardOptions {
  readonly parent: HTMLElement;
  readonly artworks: readonly Artwork[];
  readonly artists: readonly Artist[];
  readonly narratedIds: ReadonlySet<string>;
  onOpenChange?(open: boolean): void;
}

export interface InfoCard {
  open(artworkIds: readonly string[], anchor: AnchorProvider): void;
  openNote(title: string, body: string, anchor: AnchorProvider): void;
  close(): void;
  dispose: Cleanup;
}

let cardCount = 0;

export function createInfoCard(options: InfoCardOptions): InfoCard {
  cardCount += 1;
  const idPrefix = `info-card-${cardCount}`;
  const narration = createNarrationPlayer();
  let narrationButton: NarrationButton | null = null;
  const panel = createPanel(options.parent, {
    title: ARTWORK_TITLE,
    variant: 'anchored',
    onOpenChange(open) {
      if (!open) narration.stop();
      options.onOpenChange?.(open);
    },
  });
  const spine = createPlateSpine(panel.closeButton, '');
  const tabList = create('div', 'flex flex-col gap-1.5');
  tabList.setAttribute('role', 'tablist');
  tabList.setAttribute('aria-orientation', 'vertical');
  tabList.setAttribute('aria-label', 'Karya di titik ini');
  const content = create('div', SCROLL_CLASS);
  content.tabIndex = 0;
  const main = create('div', 'flex min-h-0 min-w-0 flex-1 flex-col');
  main.append(content);
  spine.append(tabList);
  panel.body.append(spine.element, main);

  let views: ArtworkView[] = [];
  let tabs: HTMLButtonElement[] = [];

  function select(index: number, focus: boolean): void {
    tabs.forEach((tab, position) => {
      const selected = position === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    const view = views[index] ?? null;
    spine.setLabel(view?.artist ?? NOTE_LABEL);
    narration.stop();
    narrationButton?.dispose();
    narrationButton = view?.audioUrl ? createNarrationButton(narration, view.audioUrl) : null;
    renderView(content, view, narrationButton?.element ?? null);
    content.scrollTop = 0;
    if (focus) tabs[index]?.focus();
    if (tabs.length > 1) content.setAttribute('aria-labelledby', `${idPrefix}-tab-${index}`);
  }

  function buildTabs(): void {
    tabs = views.map((view, index) => {
      const tab = create('button', 'plate-step', String(index + 1));
      tab.setAttribute('aria-label', view.title);
      tab.type = 'button';
      tab.id = `${idPrefix}-tab-${index}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', `${idPrefix}-content`);
      tab.title = view.title;
      return tab;
    });
    const multiple = tabs.length > 1;
    tabList.hidden = !multiple;
    tabList.replaceChildren(...(multiple ? tabs : []));
    content.id = `${idPrefix}-content`;
    content.setAttribute('role', multiple ? 'tabpanel' : 'region');
    if (multiple) {
      content.removeAttribute('aria-label');
    } else {
      content.setAttribute('aria-label', 'Rincian karya');
      content.removeAttribute('aria-labelledby');
    }
  }

  const handleTabClick = (event: Event) => {
    const clicked = (event.target as Element).closest('button') as HTMLButtonElement | null;
    const index = clicked ? tabs.indexOf(clicked) : -1;
    if (index >= 0) select(index, false);
  };
  const handleTabKeyDown = (event: KeyboardEvent) => {
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    const next = nextTabIndex(current, tabs.length, event.key);
    if (next === null) return;
    event.preventDefault();
    select(next, true);
  };
  const handleVisibility = () => {
    if (document.hidden) narration.stop();
  };
  tabList.addEventListener('click', handleTabClick);
  tabList.addEventListener('keydown', handleTabKeyDown);
  document.addEventListener('visibilitychange', handleVisibility);

  function show(nextViews: ArtworkView[], panelTitle: string, anchor: AnchorProvider): void {
    views = nextViews;
    panel.setTitle(panelTitle);
    buildTabs();
    select(0, false);
    panel.open(anchor);
  }

  return {
    open(artworkIds, anchor) {
      const views = resolveArtworkViews(
        artworkIds,
        options.artworks,
        options.artists,
        options.narratedIds,
      );
      show(views, ARTWORK_TITLE, anchor);
    },
    openNote(title, body, anchor) {
      show([buildNoteView(NOTE_ID, title, body)], NOTE_TITLE, anchor);
    },
    close: panel.close,
    dispose() {
      tabList.removeEventListener('click', handleTabClick);
      tabList.removeEventListener('keydown', handleTabKeyDown);
      document.removeEventListener('visibilitychange', handleVisibility);
      narrationButton?.dispose();
      narration.dispose();
      panel.dispose();
    },
  };
}
