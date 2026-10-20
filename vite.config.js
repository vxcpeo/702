import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// The dev server watches this directory tree. Generated and QA output
// (a702/, dist/ and output/) is written by build:all and the Playwright suites,
// so watching it retriggers the watcher on every build and can end the process
// with ECANCELED. Only parent source is hand-edited, so those trees stay out of
// the watcher. server.watch.ignored replaces Vite's defaults rather than adding
// to them, so the default node_modules and .git entries are restated here; the
// a702 mirror has its own build command when it needs a server.
const generated = ['**/node_modules/**', '**/.git/**', '**/a702/**', '**/dist/**', '**/output/**'];

export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: { alias: { buffer: 'buffer/' } },
  server: { watch: { ignored: generated } },
});
