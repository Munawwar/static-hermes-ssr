#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Building Web API Test Suite ==="

# Check for required tools
if ! command -v npx &> /dev/null; then
    echo "Error: npx not found. Install Node.js first."
    exit 1
fi

# Ensure node_modules exist (use example-frontend's)
if [ ! -d "$PROJECT_DIR/example-frontend/node_modules" ]; then
    echo "Installing dependencies..."
    cd "$PROJECT_DIR/example-frontend" && npm install && cd "$PROJECT_DIR"
fi

# Create build directory
mkdir -p "$PROJECT_DIR/build"

# Step 1: Bundle with esbuild (run from example-frontend for node_modules resolution)
echo "Step 1: Bundling test with esbuild..."
cd "$PROJECT_DIR/example-frontend"
npx esbuild "$SCRIPT_DIR/web-apis.js" \
    --bundle \
    --format=esm \
    --platform=node \
    --target=es2020 \
    --outfile="$PROJECT_DIR/build/test-bundle.mjs"
cd "$PROJECT_DIR"

# Step 2: Compile to C with shermes
echo "Step 2: Compiling to C with shermes..."
SHERMES="$PROJECT_DIR/hermes-static_h/cmake-build-release/bin/shermes"

if [ ! -f "$SHERMES" ]; then
    echo "Error: shermes not found at $SHERMES"
    echo "Run ./setup-hermes.sh first"
    exit 1
fi

"$SHERMES" \
    -emit-c \
    -exported-unit="web_api_tests" \
    -O \
    -o "$PROJECT_DIR/build/test-bundle.c" \
    "$PROJECT_DIR/build/test-bundle.mjs"

# Step 3: Compile C to object
echo "Step 3: Compiling C..."
HERMES_INCLUDE="$PROJECT_DIR/hermes-static_h/include"
HERMES_BUILD="$PROJECT_DIR/hermes-static_h/cmake-build-release"
gcc -c -std=gnu11 -DNDEBUG -O2 \
    -I"$HERMES_INCLUDE" \
    -I"$HERMES_BUILD/lib/config" \
    "$PROJECT_DIR/build/test-bundle.c" \
    -o "$PROJECT_DIR/build/test-bundle.o"

# Step 4: Compile test runner wrapper
echo "Step 4: Compiling test runner..."
cat > "$PROJECT_DIR/build/test-runner.cpp" << 'RUNNER_EOF'
#include <hermes/VM/static_h.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>
#include <iostream>

// Include native APIs
#include "../src/native-apis.h"

// Generated from shermes with -exported-unit="web_api_tests"
extern "C" SHUnit *sh_export_web_api_tests(void);

int main() {
    // Initialize the Static Hermes runtime
    SHRuntime *shr = _sh_init(0, nullptr);
    if (!shr) {
        std::cerr << "Failed to initialize Hermes runtime" << std::endl;
        return 1;
    }

    // Get the JSI HermesRuntime interface
    facebook::hermes::HermesRuntime *hermes = _sh_get_hermes_runtime(shr);
    if (!hermes) {
        std::cerr << "Failed to get HermesRuntime" << std::endl;
        _sh_done(shr);
        return 1;
    }

    // Install native Web APIs
    hermes_ssr::installNativeAPIs(*hermes);

    // Initialize the compiled JS unit (this runs the top-level code including tests)
    SHLegacyValue resultOrExc;
    if (!_sh_unit_init_guarded(shr, sh_export_web_api_tests, &resultOrExc)) {
        std::cerr << "Failed to initialize JS unit" << std::endl;
        _sh_done(shr);
        return 1;
    }

    // Cleanup
    _sh_done(shr);
    return 0;
}
RUNNER_EOF

HERMES_DIR="$PROJECT_DIR/hermes-static_h"

g++ -c -std=c++17 -DNDEBUG -O2 \
    -I"$HERMES_DIR/include" \
    -I"$HERMES_DIR/public" \
    -I"$HERMES_DIR/API" \
    -I"$HERMES_DIR/API/jsi" \
    -I"$HERMES_BUILD/lib/config" \
    "$PROJECT_DIR/build/test-runner.cpp" \
    -o "$PROJECT_DIR/build/test-runner.o"

# Step 5: Link
echo "Step 5: Linking..."

OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then
    LINK_GROUP_START=""
    LINK_GROUP_END=""
    PLATFORM_LIBS="-framework Security"
else
    LINK_GROUP_START="-Wl,--start-group"
    LINK_GROUP_END="-Wl,--end-group"
    PLATFORM_LIBS="-ldl"

    # Check for OpenSSL
    if pkg-config --exists openssl 2>/dev/null || [ -f /usr/include/openssl/sha.h ]; then
        PLATFORM_LIBS="$PLATFORM_LIBS -lssl -lcrypto"
    fi
fi

g++ -o "$PROJECT_DIR/build/test-runner" \
    "$PROJECT_DIR/build/test-runner.o" \
    "$PROJECT_DIR/build/test-bundle.o" \
    -L "$HERMES_BUILD/lib" \
    -L "$HERMES_BUILD/API/hermes" \
    -L "$HERMES_BUILD/jsi" \
    -L "$HERMES_BUILD/external/boost/boost_1_86_0/libs/context" \
    $LINK_GROUP_START \
    -lhermesvm_a -lhermesapi -ljsi -lboost_context \
    $LINK_GROUP_END \
    -lpthread $PLATFORM_LIBS -lm

echo ""
echo "=== Running Tests ==="
echo ""
"$PROJECT_DIR/build/test-runner"
