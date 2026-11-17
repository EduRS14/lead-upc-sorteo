/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHEET_URL?: string;
  readonly VITE_SHEET_TOKEN?: string;
  readonly VITE_USE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
