# Static Hermes SSR

Compile JavaScript to native code using Facebook's Static Hermes. Pass JSON at runtime, get HTML back. No Node.js needed.

Inspired by [Devon Govett's tweet](https://x.com/devongovett/status/2005538743034470645) about compiling Less.js to a native Rust plugin.

## Benchmark

| Metric | Static Hermes | Node.js |
|--------|---------------|---------|
| Cold start | ~3ms | ~10-12ms |
| Warm (JIT) | ~3ms | <0.1ms |
| Memory (RSS) | ~8MB | ~40-50MB |
| Binary size | ~7MB | N/A (runtime) |

**Key insight:** Static Hermes has consistent ~3ms execution regardless of cold/warm state. Node.js is faster after JIT warmup but has higher cold start latency and memory footprint.

**Best for:**
- Static Hermes: Short-lived processes, serverless/edge, embedding in other languages
- Node.js: Long-running servers where JIT can optimize hot paths

Run the benchmark yourself:
```bash
./performance-test/benchmark.sh
```

## Quick Start

```bash
# Install dependencies
sudo apt install build-essential cmake ninja-build python3

# Download Hermes source (one-time setup)
curl -L https://github.com/facebook/hermes/archive/2757ad0d1f461d8b14e4f21cab6f66ef4d05bcea.zip -o hermes.zip && unzip hermes.zip && mv hermes-* hermes-static_h && rm hermes.zip

# Build Hermes (first time only, ~10-20 min)
cd hermes-static_h
cmake -B cmake-build-release -G Ninja -DCMAKE_BUILD_TYPE=Release -DHERMES_UNICODE_LITE=ON
cmake --build cmake-build-release --target shermes hermesvm_a hermesapi -j$(nproc)
cd ..

# Compile JS to C
hermes-static_h/cmake-build-release/bin/shermes \
    -emit-c -exported-unit=preact_ssr -O \
    -o build/preact-ssr.c src/preact-ssr.mjs

# Compile C and C++ separately, then link
gcc -c -std=gnu11 -DNDEBUG build/preact-ssr.c \
    -I hermes-static_h/include \
    -I hermes-static_h/cmake-build-release/lib/config \
    -o build/preact-ssr.o

g++ -c -std=c++17 src/ssr-wrapper.cpp \
    -I hermes-static_h/include \
    -I hermes-static_h/public \
    -I hermes-static_h/API \
    -I hermes-static_h/API/jsi \
    -I hermes-static_h/cmake-build-release/lib/config \
    -o build/ssr-wrapper.o

g++ build/ssr-wrapper.o build/preact-ssr.o \
    -L hermes-static_h/cmake-build-release/lib \
    -L hermes-static_h/cmake-build-release/API/hermes \
    -L hermes-static_h/cmake-build-release/jsi \
    -L hermes-static_h/cmake-build-release/external/boost/boost_1_86_0/libs/context \
    -Wl,--start-group -lhermesvm_a -lhermesapi -ljsi -lboost_context -Wl,--end-group \
    -lpthread -ldl -lm \
    -o build/ssr-bin

# Run it
./build/ssr-bin '{"counter": 42, "urlPathname": "/"}'
```

## How It Works

```
src/preact-ssr.mjs ──► shermes ──► build/preact-ssr.c ──► gcc ──► .o
                                                                   │
src/ssr-wrapper.cpp ──────────────► g++ ──────────────────► .o     │
                                                                   ▼
                                                g++ + libhermesvm_a ──► build/ssr-bin
```

**JavaScript** exports a function that takes JSON and returns HTML:

```javascript
globalThis.renderPage = function(jsonString) {
    return pageToHtml(JSON.parse(jsonString));
};
```

**C++ wrapper** uses Hermes JSI to call the JS function:

```cpp
extern "C" SHUnit *sh_export_preact_ssr(void);

int main(int argc, char **argv) {
    SHRuntime *shr = _sh_init(0, nullptr);
    auto *hermes = _sh_get_hermes_runtime(shr);

    SHLegacyValue result;
    _sh_unit_init_guarded(shr, sh_export_preact_ssr, &result);

    auto html = hermes->global()
        .getPropertyAsFunction(*hermes, "renderPage")
        .call(*hermes, facebook::jsi::String::createFromUtf8(*hermes, argv[1]))
        .getString(*hermes)
        .utf8(*hermes);

    std::cout << html << std::endl;
    _sh_done(shr);
}
```

## Usage from Other Languages

**Python:**
```python
import subprocess, json
html = subprocess.check_output(['./build/ssr-bin', json.dumps({"counter": 42})]).decode()
```

**PHP:**
```php
$html = shell_exec("./build/ssr-bin '" . json_encode(["counter" => 42]) . "'");
```

**Go:**
```go
out, _ := exec.Command("./build/ssr-bin", `{"counter": 42}`).Output()
```

## Build Notes

| Target | Purpose |
|--------|---------|
| `shermes` | Static Hermes compiler (JS → C) |
| `hermesvm_a` | VM runtime library |
| `hermesapi` | JSI API library |

**Key flags:**
- `-exported-unit=NAME` - Creates `sh_export_NAME()` function, no main()
- `-emit-c` - Output C code
- `-DNDEBUG` - Required when compiling C (must match release build)
- `-DHERMES_UNICODE_LITE=ON` - Skip ICU dependency (optional)

## Project Structure

```
hermes/
├── src/
│   ├── preact-ssr.mjs      # Preact SSR with renderPage export
│   └── ssr-wrapper.cpp     # C++ wrapper using JSI
├── build/                  # Generated (gitignored)
│   ├── preact-ssr.c
│   └── ssr-bin
├── hermes-static_h/        # Clone separately (gitignored)
├── performance-test/
│   └── benchmark.sh
├── example/
│   └── ssr-python-example.py
├── setup-and-build.sh
└── README.md
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
