/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_WHATSAPP_NUMBER?: string;
  readonly PUBLIC_INSTAGRAM_HANDLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
