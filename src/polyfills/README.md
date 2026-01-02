# Web API Polyfills for Static Hermes SSR

This package provides Web API polyfills for running JavaScript in Static Hermes compiled binaries. It enables frontend SSR bundles (Preact, React, etc.) to run from non-JS languages without needing Node.js.

## Installation

```bash
cd src/polyfills
npm install
```

## Usage

The polyfills are automatically injected when building with esbuild:

```bash
cd example-frontend
node build-bundle.mjs
```

Or import manually in your entry point:

```javascript
import '../src/polyfills/index.js';
// ... your app code
```

## API Coverage

### From NPM Packages (well-tested)

| API | Package | Notes |
|-----|---------|-------|
| `Event`, `EventTarget` | [event-target-shim](https://github.com/nicolaracco/event-target-shim) | Full spec compliance |
| `AbortController`, `AbortSignal` | [abort-controller](https://github.com/nicolaracco/abort-controller) | Works with event-target-shim |
| `structuredClone` | [@ungap/structured-clone](https://github.com/nicolaracco/structured-clone) | Handles circular refs, Maps, Sets |
| `Blob`, `File` | [blob-polyfill](https://github.com/nicolaracco/blob-polyfill) | Complete implementation |

### Custom Implementations (optimized for SSR)

| API | File | Notes |
|-----|------|-------|
| `URL`, `URLSearchParams` | `url.js` | Lightweight (~10KB vs 200KB+ from core-js) |
| `DOMException` | `exception.js` | Full error codes |
| `CustomEvent` | `index.js` | Extends event-target-shim Event |
| `atob`, `btoa` | `base64.js` | Fallback (Hermes has built-in) |
| `setTimeout`, `setInterval` | `timers.js` | **Stubs** - return IDs but never fire |
| `queueMicrotask` | `timers.js` | Works via Promise |
| `requestAnimationFrame` | `timers.js` | **Stub** - no-op |
| `FileReader` | `filereader.js` | Async file reading |
| `Headers`, `Request`, `Response` | `fetch-types.js` | HTTP types |
| `fetch` | `fetch-types.js` | **Stub** - throws error |
| `crypto.randomUUID` | `crypto.js` | Uses native `getRandomValues` |
| `console.log/warn/error` | `console.js` | Captured to `globalThis.__console__` |

### Native C++ (injected via JSI)

| API | File | Notes |
|-----|------|-------|
| `performance.now()` | `native-apis.h` | High-resolution monotonic clock |
| `crypto.getRandomValues()` | `native-apis.h` | OS secure random |

## Bundle Variants

### Full (`index.js`)
All polyfills including Blob, FileReader, HTTP types, structuredClone.

```javascript
import './polyfills/index.js';
```

**Bundle size: ~120KB** (polyfills only)

### Minimal (`minimal.js`)
Lightweight version - excludes Blob, fetch types, structuredClone.

```javascript
import './polyfills/minimal.js';
```

**Bundle size: ~30KB** (polyfills only)

## Why Custom URL Instead of core-js?

We tested `core-js-pure` for URL/URLSearchParams but it adds ~200KB due to CommonJS baggage and internal dependencies. Our custom implementation is ~10KB and covers the common SSR use cases.

If you need perfect WHATWG URL spec compliance (punycode, IDNA), you can swap in `core-js-pure`:

```javascript
// In your own polyfills file:
import URL from 'core-js-pure/actual/url/index.js';
import URLSearchParams from 'core-js-pure/actual/url-search-params/index.js';
globalThis.URL = URL;
globalThis.URLSearchParams = URLSearchParams;
```

## Important Notes

### Timer Behavior
`setTimeout` and `setInterval` are **stubs** that return IDs but never execute callbacks. This is intentional for SSR which is synchronous. If your code depends on timers, refactor to not require them during SSR.

### Fetch is Stubbed
`fetch()` throws an error because network I/O requires native implementation. Data should be passed into your SSR function via JSON, not fetched during render.

```javascript
// DON'T do this in SSR:
const data = await fetch('/api/data');  // Throws error

// DO this instead:
globalThis.renderPage = function(jsonInput) {
  const data = JSON.parse(jsonInput);  // Data passed from host
  return renderApp(data);
};
```

### Console Capture
Console output is captured to `globalThis.__console__` for retrieval by the host language:

```javascript
console.log('Hello');
console.warn('Warning');

// Retrieve from host (C++, Python, etc.)
const logs = globalThis.__console__.getOutput();
// [{ level: 'log', message: 'Hello', timestamp: 1234567890 }, ...]
```

### crypto.getRandomValues
This requires the native C++ implementation. Make sure your C++ wrapper calls `hermes_ssr::installNativeAPIs(*hermes)` before loading the JS unit.

## Size Summary

| Component | Size |
|-----------|------|
| Custom URL/URLSearchParams | ~10KB |
| event-target-shim | ~3KB |
| abort-controller | ~2KB |
| @ungap/structured-clone | ~5KB |
| blob-polyfill | ~8KB |
| Custom (timers, console, etc.) | ~10KB |
| **Full bundle** | ~120KB |
| **Minimal bundle** | ~30KB |

## Skipping Polyfills

To build without polyfills (for testing or size optimization):

```bash
SKIP_POLYFILLS=1 node build-bundle.mjs
```

## Phase 2 (Not Yet Implemented)

These APIs require additional native dependencies:

| API | Requires | Size Impact |
|-----|----------|-------------|
| `fetch()` | libcurl or HTTP client | ~200KB |
| `crypto.subtle.*` | OpenSSL or libsodium | ~300KB |
| `CompressionStream` | zlib | ~70KB |
| `ReadableStream`, `WritableStream` | web-streams-polyfill | ~30KB |

## Development

To update dependencies:

```bash
cd src/polyfills
npm update
```

To build a standalone bundle:

```bash
npm run build
# Output: dist/polyfills.bundle.js
```
