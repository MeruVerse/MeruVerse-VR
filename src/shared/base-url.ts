export function joinBase(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

export function withBase(path: string): string {
  return joinBase(import.meta.env.BASE_URL, path);
}

export const HOME_URL = import.meta.env.BASE_URL;
