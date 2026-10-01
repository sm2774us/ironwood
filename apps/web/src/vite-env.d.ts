/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_AUTHOR_TOKEN?: string;
  readonly VITE_AEM_AUTHOR_URL?: string;
  readonly VITE_AEM_DELIVERY_URL?: string;
  readonly VITE_GA4_ID?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
