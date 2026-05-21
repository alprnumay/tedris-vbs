/** Minimal Vite `import.meta.env` typing for library `tsc --build` (no Vite dependency). */
interface ImportMetaEnv {
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
