# Static Hermes SSR

Compile a example preact frontend to native binary using Facebook's Static Hermes¹ and use it from any language. Pass JSON at runtime, get HTML back. No Node.js needed.

**Two execution modes:**
- `ssr-bin` - Single-run mode (cold start ~2.5ms)
- `ssr-server` - Persistent server mode (warm execution ~0.08ms)

¹ Static Hermes vs Regular Hermes: Static does a AOT compilation to C (which then can be compiled to native binary) compared to regular Hermes which compiles to bytecode and a runtime then executes it.

Partly inspired by [Devon Govett's tweet](https://x.com/devongovett/status/2005538743034470645) about compiling Less.js to a native Rust plugin.

Limitations:
1. Only ES2022 is allowed currently by Hermes
2. Hermes doesn't support dynamic imports
3. I polyfilled a few Web APIs, but expect missing features / differences from spec. Check [Web API Polyfills](#web-api-polyfills) section below.

## Performance

| Mode | Execution | Memory | Requests/sec |
|------|-----------|--------|--------------|
| Single-run (cold) | ~3.3ms | ~8MB | ~300 |
| Persistent (warm) | **~0.09ms** | ~8MB | **~11,000** |
| Node.js (warm) | ~0.03ms | ~50MB | ~29,000 |

Baseline binary size: ~5MB

Notes:
- All JS pages / routes are in one binary. It's still ~5MB binary size. Adding multiple routes hardly increases the binary size.
- Node.js V8 JIT is faster. *But* practically at <1ms per req (per core), most likely isn't going to be your bottleneck

Run benchmarks:
```bash
python3 performance-test/benchmark.py    # Static Hermes
node performance-test/node-benchmark.mjs # Node.js comparison
```

## Quick start

```bash
# 1. Install system dependencies
sudo apt install build-essential cmake ninja-build python3 nodejs npm

# Optional: for crypto.subtle (SHA-256, HMAC, etc.)
sudo apt install libssl-dev

# 2. Download Hermes source (one-time setup)
curl -L https://github.com/facebook/hermes/archive/2757ad0d1f461d8b14e4f21cab6f66ef4d05bcea.zip -o hermes.zip && unzip hermes.zip && mv hermes-* hermes-static_h && rm hermes.zip

# 3. Install frontend dependencies (Preact + esbuild)
cd example-frontend && npm install && cd ..

# 4. Build everything (Hermes + frontend + binary)
./setup-and-build.sh

# 5. Test it!
./build/ssr-bin '{"route": "/", "counter": 42}'
./build/ssr-bin '{"route": "/about", "user": "Alice"}'
./build/ssr-bin '{"route": "/blog"}'
```

## Usage Examples

The `example-servers/` directory contains Python examples demonstrating both execution modes:
- **Single-run mode** (`ssr-python-single-run.py`) - Cold start, spawn process per request
- **Persistent server mode** (`ssr-python-server.py`) - Warm execution, 15.7x faster (~0.17ms vs ~2.7ms)

Both binaries accept JSON input and return HTML. Works with any language via subprocess (Python, PHP, Go, etc.).

## Build System

**Platforms:** Linux (primary), macOS (secondary)

First we build the JS bundle: `Preact JSX → esbuild → bundle.mjs`. The `example-frontend/` directory contains Preact components and a multi-route dispatcher

Second step the build to binary: `bundle.mjs → shermes → C → gcc → native binary (~7MB)`. The C++ wrappers in `src/` are generic that can be used for your own JS bundles (check `Custom builds` section).

Build scripts are split for reusability:
- `setup-hermes.sh` - One-time Hermes compiler setup
- `build-ssr-binary.sh` - Generic binary builder (configurable via `JS_BUNDLE`, `UNIT_NAME`, `OUTPUT_PREFIX` env vars)
- `setup-and-build.sh` - Runs the above two scripts in one script

### Custom builds
```bash
JS_BUNDLE=my-app/dist/bundle.mjs UNIT_NAME=my_app OUTPUT_PREFIX=myapp ./build-ssr-binary.sh
```


## Web APIs

### Native APIs (C++)

These are implemented in `src/native-apis.h` using OS-level APIs for performance and security:

| API | Status | Notes |
|-----|--------|-------|
| `performance.now()` | Full | High-resolution monotonic clock |
| `performance.timeOrigin` | Full | Runtime creation timestamp |
| `crypto.getRandomValues()` | Full | Linux: `getrandom()`, macOS: `SecRandomCopyBytes` |
| `crypto.subtle.digest()` | Optional | SHA-1, SHA-256, SHA-384, SHA-512. Requires OpenSSL (Linux) or CommonCrypto (macOS) |
| `crypto.subtle.sign()` | Optional | HMAC only. Requires OpenSSL/CommonCrypto |
| `crypto.subtle.importKey()` | Optional | Raw format only. Requires OpenSSL/CommonCrypto |

### JavaScript Polyfills

The `src/polyfills/` directory provides Web APIs for SSR. Most work but aren't 100% spec-compliant:

| API | Status | Notes |
|-----|--------|-------|
| `console.log/warn/error` | Full | Outputs to stderr |
| `atob`, `btoa` | Full | Base64 encoding/decoding |
| `crypto.randomUUID` | Full | Uses native `crypto.getRandomValues` |
| `structuredClone` | Full | Via `@ungap/structured-clone` npm package |
| `AbortController`, `AbortSignal` | Partial | Missing: `timeout()`, `any()`, `reason` |
| `URL`, `URLSearchParams` | Partial | Missing: Punycode/IDNA, IPv6, `ftp:`/`file:` schemes |
| `Event`, `CustomEvent`, `EventTarget` | Partial | No bubbling/capture phase (SSR doesn't need it) |
| `DOMException` | Partial | Basic error subclass |
| `Blob`, `File`, `FileReader` | Partial | Rarely needed for SSR; no `stream()` |
| `Headers`, `Request`, `Response` | Stub | Structure only, no actual fetch |
| `setTimeout`, `setInterval` | Stub | No-op for SSR (returns dummy IDs) |

## Troubleshooting

**Permission denied during build:**
```bash
sudo chown -R $USER:$USER hermes-static_h/cmake-build-release
```

**Undefined reference to `_sh_model_*_dbg`:**
Add `-DNDEBUG` when compiling the generated C file.

**Undefined reference to `hoost_*`:**
Link with `-lboost_context`.
