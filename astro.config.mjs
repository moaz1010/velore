import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  devToolbar: { enabled: false },
  adapter: vercel(),
  integrations: [react(), tailwind()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  vite: {
    server: {
      allowedHosts: ['.sg2.manus.computer'],
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
});
