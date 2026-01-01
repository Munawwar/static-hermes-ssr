# Static Hermes SSR

Compile JavaScript to native code using Facebook's Static Hermes. Pass JSON at runtime, get HTML back. No Node.js needed.

Two binaries are built:
- `ssr-bin` - Single-shot mode (cold start ~2.7ms)
- `ssr-server` - Persistent server mode (warm execution ~0.17ms)

Inspired by [Devon Govett's tweet](https://x.com/devongovett/status/2005538743034470645) about compiling Less.js to a native Rust plugin.

## Benchmark

### Cold Start (Single-Shot)
| Metric | Value |
|--------|-------|
| Execution time | ~2.7ms |
| Memory (RSS) | ~8MB |
| Binary size | ~7MB |
| Requests/sec | ~369 |

### Warm Execution (Persistent Server)
| Metric | Value |
|--------|-------|
| Execution time | **~0.17ms** |
| Memory (RSS) | ~8MB |
| Requests/sec | **~5,795** |
| Speedup | **15.7x faster** |

**Key insights:**
- **Process spawn overhead**: ~2.5ms (93% of cold start time!)
- **Actual JS execution**: Only ~0.17ms
- **No JIT needed**: AOT compilation delivers sub-millisecond performance immediately
- **Persistent server**: Achieves Node.js-level warm performance (~0.1-0.2ms) without JIT

**Comparison with Node.js:**

| Metric | Static Hermes (Cold) | Static Hermes (Warm) | Node.js (Cold) | Node.js (Warm) |
|--------|---------------------|---------------------|----------------|----------------|
| Execution | ~2.7ms | **~0.17ms** | ~10-12ms | ~0.1ms |
| Memory | ~8MB | ~8MB | ~40-50MB | ~40-50MB |

**Best for:**
- **Cold/short-lived**: Static Hermes wins (2.7ms vs 10-12ms)
- **Warm/persistent**: Comparable performance (~0.17ms vs ~0.1ms), but 5x less memory

Run the benchmark yourself:
```bash
python3 performance-test/benchmark.py
```

This benchmark tests both cold start (using `ssr-bin`) and warm execution (using `ssr-server`) modes.

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

### Single-Shot (Cold Start)
Best for infrequent requests or serverless functions.

**Python:**
```python
import subprocess, json

result = subprocess.run(
    ['./build/ssr-bin', json.dumps({"counter": 42, "urlPathname": "/"})],
    capture_output=True,
    text=True
)
html = result.stdout
```

**PHP:**
```php
$html = shell_exec("./build/ssr-bin '" . json_encode(["counter" => 42]) . "'");
```

**Go:**
```go
out, _ := exec.Command("./build/ssr-bin", `{"counter": 42}`).Output()
```

### Persistent Server (Warm)
Best for high-throughput applications. Keep the process alive and pipe JSON via stdin.

**Python (using SSRServer helper class):**
```python
# See example/ssr-python-server.py for the SSRServer class implementation
# Copy the SSRServer class or use the pattern below:

with SSRServer() as ssr:
    for data in requests:
        html = ssr.render(data)  # ~0.17ms per request!
```

**Python (manual subprocess):**
```python
import subprocess, json

# Start once
process = subprocess.Popen(
    ['./build/ssr-server'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    text=True,
    bufsize=1
)

# Reuse for multiple requests
for data in requests:
    process.stdin.write(json.dumps(data) + '\n')
    process.stdin.flush()
    html = process.stdout.readline()
```

**PHP (using proc_open):**
```php
$process = proc_open('./build/ssr-server', [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w']
], $pipes);

foreach ($requests as $data) {
    fwrite($pipes[0], json_encode($data) . "\n");
    $html = fgets($pipes[1]);
}
```

## Examples

Two Python examples are included in the `example/` directory:

**Single-shot mode** (`ssr-python-example.py`):
```bash
python3 example/ssr-python-example.py
```
A minimal example (just 20 lines) showing how to call the SSR binary with JSON input.

**Persistent server mode** (`ssr-python-server.py`):
```bash
python3 example/ssr-python-server.py
```
Demonstrates warm execution with a clean `SSRServer` class that abstracts away subprocess details:
```python
with SSRServer() as ssr:
    html = ssr.render({"counter": 42, "urlPathname": "/"})
```
This is **15.7x faster** than single-shot mode (~0.17ms vs ~2.7ms).

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
│   ├── ssr-wrapper.cpp     # Single-shot wrapper (cold start)
│   └── ssr-server.cpp      # Persistent server (warm execution)
├── build/                  # Generated (gitignored)
│   ├── preact-ssr.c        # Compiled JS → C
│   ├── ssr-bin             # Single-shot binary (~7MB)
│   └── ssr-server          # Server binary (~7MB)
├── hermes-static_h/        # Download separately (gitignored)
├── performance-test/
│   └── benchmark.py        # Benchmarks both cold and warm modes
├── example/
│   ├── ssr-python-example.py  # Single-shot example
│   └── ssr-python-server.py   # Persistent server example
├── setup-and-build.sh      # Build script (builds both binaries)
├── PLAN.md                 # Implementation plan for warm execution
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
