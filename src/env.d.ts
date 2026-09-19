/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Cloudflare Web Analytics token, set only for production builds (spec 0010). */
  readonly PUBLIC_CF_BEACON_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
