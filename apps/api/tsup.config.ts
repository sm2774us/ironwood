import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  clean: true,
  sourcemap: true,
  // Workspace package ships TS source — bundle it; everything else stays an external runtime dep.
  noExternal: ['@ironwood/shared'],
});
