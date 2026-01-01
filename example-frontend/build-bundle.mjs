#!/usr/bin/env node
/**
 * esbuild bundler for Static Hermes SSR
 *
 * Bundles all Preact components and dependencies into a single file
 * that can be compiled with shermes.
 */

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('📦 Bundling Preact SSR with esbuild...\n');

try {
  const result = await esbuild.build({
    entryPoints: [join(__dirname, 'src/router.jsx')],
    bundle: true,
    format: 'esm',
    target: 'es2020',
    outfile: join(__dirname, 'dist/bundle.mjs'),
    platform: 'neutral',
    jsx: 'automatic',
    jsxImportSource: 'preact',
    logLevel: 'info',
    minify: false, // Keep readable for debugging
  });

  console.log('\n✅ Bundle created: dist/bundle.mjs');
  console.log(`📊 Bundle size: ${(result.metafile ? 'N/A' : 'check dist/bundle.mjs')}`);

} catch (error) {
  console.error('❌ Bundling failed:', error);
  process.exit(1);
}
