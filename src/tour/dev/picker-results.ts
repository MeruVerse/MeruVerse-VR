import type { PickerResultGroup } from './picker-panel';

export const INITIAL_YAW_SLOT = 'initialYaw';

export interface PickerResults {
  set(sceneId: string, slot: string, line: string): void;
  has(sceneId: string, slot: string): boolean;
  clear(): void;
  groups(): PickerResultGroup[];
  asText(): string;
}

interface Entry {
  readonly sceneId: string;
  readonly line: string;
}

export function createPickerResults(): PickerResults {
  const entries = new Map<string, Entry>();
  const keyOf = (sceneId: string, slot: string) => `${sceneId}|${slot}`;

  function groups(): PickerResultGroup[] {
    const bySceneId = new Map<string, string[]>();
    for (const { sceneId, line } of entries.values()) {
      bySceneId.set(sceneId, [...(bySceneId.get(sceneId) ?? []), line]);
    }
    return [...bySceneId].map(([sceneId, lines]) => ({ sceneId, lines }));
  }

  return {
    set: (sceneId, slot, line) => entries.set(keyOf(sceneId, slot), { sceneId, line }),
    has: (sceneId, slot) => entries.has(keyOf(sceneId, slot)),
    clear: () => entries.clear(),
    groups,
    asText: () =>
      groups()
        .map((group) => [`[${group.sceneId}]`, ...group.lines].join('\n'))
        .join('\n\n'),
  };
}
