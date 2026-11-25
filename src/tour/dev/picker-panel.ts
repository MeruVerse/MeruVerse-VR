import type { Cleanup } from '../../shared/cleanup';
import { create } from '../../shared/ui/dom';

export interface PickerPendingItem {
  readonly id: string;
  readonly label: string;
  readonly done: boolean;
}

export interface PickerResultGroup {
  readonly sceneId: string;
  readonly lines: readonly string[];
}

export interface PickerView {
  readonly active: boolean;
  readonly sceneId: string;
  readonly pending: readonly PickerPendingItem[];
  readonly selectedId: string | null;
  readonly lastPoint: string | null;
  readonly groups: readonly PickerResultGroup[];
  readonly status: string;
}

export interface PickerPanelHandlers {
  onSelect(hotspotId: string | null): void;
  onCopyAll(): void;
  onClear(): void;
}

export interface PickerPanel {
  render(view: PickerView): void;
  dispose: Cleanup;
}

const BUTTON_CLASS =
  'rounded bg-ink px-2 py-1 text-left text-xs text-paper aria-pressed:bg-paper aria-pressed:text-ink';

function actionButton(text: string, action: string): HTMLButtonElement {
  const button = create('button', BUTTON_CLASS, text);
  button.type = 'button';
  button.dataset.action = action;
  return button;
}

export function createPickerPanel(parent: HTMLElement, handlers: PickerPanelHandlers): PickerPanel {
  const root = create(
    'aside',
    'fixed bottom-4 right-4 z-30 flex max-h-[70dvh] w-80 flex-col gap-2 overflow-y-auto rounded-card bg-ink-2/95 p-4 text-xs text-paper shadow-2xl',
  );
  root.setAttribute('aria-label', 'Hotspot picker (mode pengembangan)');
  root.hidden = true;
  const heading = create('h2', 'font-display text-xl', 'Hotspot Picker');
  const hint = create('p', 'text-paper/70', 'H: mode penempatan, I: simpan arah awal');
  const sceneLine = create('p');
  const lastPoint = create('p');
  const pendingList = create('div', 'flex flex-col gap-1');
  pendingList.setAttribute('role', 'group');
  pendingList.setAttribute('aria-label', 'Hotspot yang belum ditempatkan');
  const results = create('pre', 'whitespace-pre-wrap break-words rounded bg-ink p-2');
  results.setAttribute('aria-label', 'Hasil siap tempel');
  const actions = create('div', 'flex gap-2');
  actions.append(actionButton('Salin semua', 'copy-all'), actionButton('Kosongkan', 'clear'));
  const status = create('p', 'text-paper/80');
  status.setAttribute('role', 'status');
  root.append(heading, hint, sceneLine, lastPoint, pendingList, results, actions, status);
  parent.append(root);

  const handleClick = (event: Event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!button) return;
    if (button.dataset.action === 'copy-all') handlers.onCopyAll();
    else if (button.dataset.action === 'clear') handlers.onClear();
    else if (button.dataset.hotspotId) {
      const pressed = button.getAttribute('aria-pressed') === 'true';
      handlers.onSelect(pressed ? null : button.dataset.hotspotId);
    }
  };
  root.addEventListener('click', handleClick);

  return {
    render(view) {
      root.hidden = !view.active;
      sceneLine.textContent = `Scene: ${view.sceneId}`;
      lastPoint.textContent = `Titik terakhir: ${view.lastPoint ?? '-'}`;
      pendingList.replaceChildren(
        ...view.pending.map((item) => {
          const button = create('button', BUTTON_CLASS, `${item.done ? '✓ ' : ''}${item.label}`);
          button.type = 'button';
          button.dataset.hotspotId = item.id;
          button.title = item.id;
          button.setAttribute('aria-pressed', String(item.id === view.selectedId));
          return button;
        }),
      );
      results.textContent = view.groups.length
        ? view.groups.map((group) => [`[${group.sceneId}]`, ...group.lines].join('\n')).join('\n\n')
        : 'Belum ada hasil';
      status.textContent = view.status;
    },
    dispose() {
      root.removeEventListener('click', handleClick);
      root.remove();
    },
  };
}
