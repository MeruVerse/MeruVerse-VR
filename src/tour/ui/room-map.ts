import type { Cleanup } from '../../shared/cleanup';
import { create } from '../../shared/ui/dom';
import { createPanel } from '../../shared/ui/panel';
import { createPlateSpine } from '../../shared/ui/plate-spine';
import type { SceneId, Zone, ZoneId } from '../data/types';

const CURRENT_LABEL = 'Anda di sini';

export interface RoomMapOptions {
  readonly parent: HTMLElement;
  readonly zones: readonly Zone[];
  onSelect(entry: SceneId): void;
  onOpenChange?(open: boolean): void;
}

export interface RoomMap {
  open(): void;
  close(): void;
  setActiveZone(zoneId: ZoneId): void;
  dispose: Cleanup;
}

function createZoneItem(zone: Zone): HTMLLIElement {
  const item = create('li');
  const button = create('button', 'route-stop');
  button.type = 'button';
  button.dataset.zoneId = zone.id;
  button.setAttribute('aria-label', `Buka ${zone.label}`);
  const badge = create('span', 'route-badge', CURRENT_LABEL);
  badge.hidden = true;
  button.append(create('span', '', zone.label), badge);
  item.append(button);
  return item;
}

export function createRoomMap(options: RoomMapOptions): RoomMap {
  const panel = createPanel(options.parent, {
    title: 'Peta Ruang',
    variant: 'side',
    ...(options.onOpenChange ? { onOpenChange: options.onOpenChange } : {}),
  });
  const main = create('div', 'plate-scroll min-w-0 flex-1 overflow-y-auto px-5 py-4');
  const list = create('ul', 'route-line');
  list.setAttribute('aria-label', 'Daftar zona galeri');
  list.append(...options.zones.map(createZoneItem));
  main.append(list);
  panel.body.append(createPlateSpine(panel.closeButton, 'Peta Ruang').element, main);

  const handleClick = (event: Event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-zone-id]');
    const zone = options.zones.find((candidate) => candidate.id === button?.dataset.zoneId);
    if (!zone) return;
    options.onSelect(zone.entry);
    panel.close();
  };
  list.addEventListener('click', handleClick);

  return {
    open: panel.open,
    close: panel.close,
    setActiveZone(zoneId) {
      for (const button of list.querySelectorAll<HTMLButtonElement>('button[data-zone-id]')) {
        const active = button.dataset.zoneId === zoneId;
        button.toggleAttribute('data-active', active);
        if (active) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
        const badge = button.querySelector<HTMLElement>('span:last-child');
        if (badge) badge.hidden = !active;
      }
    },
    dispose() {
      list.removeEventListener('click', handleClick);
      panel.dispose();
    },
  };
}
