# Static Hermes SSR

Compile a example preact frontend to native binary using Facebook's Static Hermes¹ and use it from any language. Pass JSON at runtime, get HTML back. No Node.js needed.

**Two execution modes:**
- `ssr-bin` - Single-run mode (cold start ~2.7ms)
- `ssr-server` - Persistent server mode (warm execution ~0.17ms)

¹ Static Hermes vs Regular Hermes: Static does a AOT compilation to C (which then can be compiled to native binary) compared to regular Hermes which compiles to bytecode and a runtime then executes it.

Partly inspired by [Devon Govett's tweet](https://x.com/devongovett/status/2005538743034470645) about compiling Less.js to a native Rust plugin.

## Performance

| Mode | Execution | Memory | Requests/sec |
|------|-----------|--------|--------------|
| Single-run (cold) | ~2.7ms | ~8MB | ~369 |
| Persistent (warm) | **~0.17ms** | ~8MB | **~5,795** |
| Node.js (cold) | ~10-12ms | ~40-50MB | - |
| Node.js (warm) | ~0.1ms | ~40-50MB | - |

Notes:
- All JS pages / routes are in one binary (~7MB). Adding multiple routes hardly increases the binary size.
- How is it as fast as v8 optimized JIT, which is a mind-blowing feat!? I am not sure. I am going to attribute it to the AOT compilation magic Static Hermes does

Run: `python3 performance-test/benchmark.py`

## Quick start

```bash
# 1. Install system dependencies
sudo apt install build-essential cmake ninja-build python3 nodejs npm

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

## Troubleshooting

**Permission denied during build:**
```bash
sudo chown -R $USER:$USER hermes-static_h/cmake-build-release
```

**Undefined reference to `_sh_model_*_dbg`:**
Add `-DNDEBUG` when compiling the generated C file.

**Undefined reference to `hoost_*`:**
Link with `-lboost_context`.
