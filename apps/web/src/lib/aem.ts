import { ueResource, type ContentModel } from '@ironwood/shared';

const AEM_AUTHOR = import.meta.env.VITE_AEM_AUTHOR_URL as string | undefined;
const AEM_DELIVERY = import.meta.env.VITE_AEM_DELIVERY_URL as string | undefined;

/** Attributes the Adobe Universal Editor reads to make a component selectable/editable in-context. */
export const ueComponentAttrs = (
  fragment: { _path: string },
  model: ContentModel,
  label: string,
): Record<string, string> => ({
  'data-aue-resource': ueResource(fragment._path),
  'data-aue-type': 'component',
  'data-aue-model': model,
  'data-aue-label': label,
});

export const ueTextAttrs = (
  fragment: { _path: string },
  prop: string,
  label: string,
  type: 'text' | 'richtext' = 'text',
): Record<string, string> => ({
  'data-aue-resource': ueResource(fragment._path),
  'data-aue-prop': prop,
  'data-aue-type': type,
  'data-aue-label': label,
});

export const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

/**
 * Wires the page for the real Universal Editor when an AEM author tenant is configured:
 * connection meta tags + the editor's CORS helper (only when framed by the editor).
 */
export function installUniversalEditor(): void {
  if (!AEM_AUTHOR || typeof document === 'undefined') return;
  const meta = (name: string, content: string) => {
    const m = document.createElement('meta');
    m.name = name;
    m.content = content;
    document.head.appendChild(m);
  };
  meta('urn:adobe:aue:system:aemconnection', `aem:${AEM_AUTHOR}`);
  meta('urn:adobe:aue:config:service', 'https://universal-editor-service.adobe.io');
  if (isInIframe()) {
    const s = document.createElement('script');
    s.src = 'https://universal-editor-service.adobe.io/cors.js';
    s.async = true;
    document.head.appendChild(s);
  }
}

/** AEM asset paths are served through Delivery with width/format negotiation; static paths pass through. */
export const isDamAsset = (path: string): boolean => path.startsWith('/content/dam/');

export function imageUrl(path: string, width: number): string {
  if (!isDamAsset(path) || !AEM_DELIVERY) return path;
  return `${AEM_DELIVERY}${path}?width=${width}&preferwebp=true&quality=80`;
}

export function imageSrcSet(path: string, widths: readonly number[]): string | undefined {
  if (!isDamAsset(path) || !AEM_DELIVERY) return undefined;
  return widths.map((w) => `${imageUrl(path, w)} ${w}w`).join(', ');
}
