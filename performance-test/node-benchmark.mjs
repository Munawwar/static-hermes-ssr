// Node.js ESM benchmark for comparison with Static Hermes SSR
import { performance } from 'perf_hooks';

// Save native console before polyfills override it
const log = (...args) => process.stdout.write(args.join(' ') + '\n');

// Load the same ESM bundle (sets globalThis.renderPage)
await import('../example-frontend/dist/bundle.mjs');

const iterations = 100;
const warmupIterations = 10;

// Warmup
for (let i = 0; i < warmupIterations; i++) {
  globalThis.renderPage(JSON.stringify({ route: '/', counter: i }));
}

// Benchmark
const times = [];
for (let i = 0; i < iterations; i++) {
  const start = performance.now();
  globalThis.renderPage(JSON.stringify({ route: '/', counter: i }));
  const end = performance.now();
  times.push(end - start);
}

const avg = times.reduce((a, b) => a + b, 0) / times.length;
const min = Math.min(...times);
const max = Math.max(...times);

log('Node.js ESM warm execution benchmark (' + iterations + ' runs):');
log('  Average: ' + avg.toFixed(3) + 'ms');
log('  Min:     ' + min.toFixed(3) + 'ms');
log('  Max:     ' + max.toFixed(3) + 'ms');
log('  Requests/sec: ~' + Math.round(1000 / avg));
