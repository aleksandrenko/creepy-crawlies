import { defineConfig } from 'vite';

// GitHub Pages serves a project site from /<repo>/, so assets need that prefix. Locally
// and in `vite preview` the site is at the root, hence the env switch rather than a
// hardcoded base.
const base = process.env.GITHUB_ACTIONS ? '/creepy-crawlies/' : '/';

export default defineConfig({
  base,
  server: { port: 5273, open: false },
  build: { target: 'es2022' },
});
