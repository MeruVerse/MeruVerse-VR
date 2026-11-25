import type { Cleanup } from '../../shared/cleanup';
import { create } from '../../shared/ui/dom';
import { createIcon, setIcon } from '../../shared/ui/icons';
import type { NarrationPlayer } from './narration-player';

const LABEL = 'Dengarkan deskripsi';

export interface NarrationButton {
  readonly element: HTMLButtonElement;
  dispose: Cleanup;
}

/** Tombol pengeras suara untuk satu narasi. Selama berbunyi berubah menjadi tombol henti. */
export function createNarrationButton(player: NarrationPlayer, url: string): NarrationButton {
  const element = create('button', 'plate-voice');
  element.type = 'button';
  element.setAttribute('aria-label', LABEL);
  const icon = createIcon('speaker');
  element.append(icon);

  const sync = () => {
    const playing = player.isPlaying(url);
    element.setAttribute('aria-pressed', String(playing));
    setIcon(icon, playing ? 'stop' : 'speaker');
  };
  const handleClick = () => player.toggle(url);
  element.addEventListener('click', handleClick);
  const unsubscribe = player.subscribe(sync);
  sync();

  return {
    element,
    dispose() {
      unsubscribe();
      element.removeEventListener('click', handleClick);
    },
  };
}
