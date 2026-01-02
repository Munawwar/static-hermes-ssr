#!/usr/bin/env node
/**
 * esbuild bundler for Static Hermes SSR
 *
 * Bundles all Preact components and dependencies into a single file
 * that can be compiled with shermes.
 *
 * Includes Web API polyfills for SSR compatibility.
 */

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Polyfills directory
const polyfillsDir = join(__dirname, '..', 'src', 'polyfills');

console.log('📦 Bundling Preact SSR with esbuild...\n');

// Option to skip polyfills (for testing or when using native APIs only)
const includePolyfills = process.env.SKIP_POLYFILLS !== '1';

try {
  await esbuild.build({
    entryPoints: [join(__dirname, 'src/router.jsx')],
    bundle: true,
    format: 'esm',
    target: 'es2022', // Hermes supports up to ES2022
    outfile: join(__dirname, 'dist/bundle.mjs'),
    platform: 'neutral',
    // Required for neutral platform to resolve npm packages correctly
    mainFields: ['module', 'main'],
    conditions: ['import', 'default'],
    jsx: 'automatic',
    jsxImportSource: 'preact',
    logLevel: 'info',
    minify: false, // Keep readable for debugging
    define: {
      'process.env.SSR': 'true'
    },
    // Inject polyfills at the start of the bundle
    inject: includePolyfills ? [join(polyfillsDir, 'index.js')] : [],
    // Resolve polyfill imports
    alias: {
      '@hermes-ssr/polyfills': polyfillsDir,
    },
    // Resolve from polyfills node_modules
    nodePaths: [join(polyfillsDir, 'node_modules')],
  });

  console.log('\n✅ Bundle created: dist/bundle.mjs');
  if (includePolyfills) {
    console.log('📦 Includes Web API polyfills from src/polyfills/');
  } else {
    console.log('⚠️  Polyfills skipped (SKIP_POLYFILLS=1)');
  }

} catch (error) {
  console.error('❌ Bundling failed:', error);
  process.exit(1);
}
