#!/bin/bash
# Static Hermes SSR Build Script
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HERMES_DIR="$SCRIPT_DIR/hermes-static_h"
HERMES_BUILD="$HERMES_DIR/cmake-build-release"
SRC_DIR="$SCRIPT_DIR/src"
BUILD_DIR="$SCRIPT_DIR/build"

echo "=== Static Hermes SSR Build ==="

# Check for Hermes source
if [ ! -d "$HERMES_DIR" ]; then
    echo "ERROR: Hermes source not found at $HERMES_DIR"
    echo
    echo "Download it with:"
    echo "  curl -L https://github.com/facebook/hermes/archive/2757ad0d1f461d8b14e4f21cab6f66ef4d05bcea.zip -o hermes.zip && unzip hermes.zip && mv hermes-* hermes-static_h && rm hermes.zip"
    exit 1
fi

# Check dependencies
command -v cmake >/dev/null || { echo "ERROR: cmake not found"; exit 1; }
command -v g++ >/dev/null || { echo "ERROR: g++ not found"; exit 1; }

# Use lite unicode if ICU not available
USE_ICU_LITE=OFF
pkg-config --exists icu-uc 2>/dev/null || USE_ICU_LITE=ON

# Step 1: Build Hermes
if [ ! -f "$HERMES_BUILD/bin/shermes" ]; then
    echo "Building Hermes (first time, ~10-20 min)..."

    GENERATOR="Unix Makefiles"
    command -v ninja >/dev/null && GENERATOR="Ninja"

    cmake -B "$HERMES_BUILD" -S "$HERMES_DIR" \
        -G "$GENERATOR" \
        -DCMAKE_BUILD_TYPE=Release \
        -DHERMES_UNICODE_LITE=$USE_ICU_LITE

    cmake --build "$HERMES_BUILD" --target shermes -j$(nproc)
    cmake --build "$HERMES_BUILD" --target hermesvm_a -j$(nproc)
    cmake --build "$HERMES_BUILD" --target hermesapi -j$(nproc)
fi

mkdir -p "$BUILD_DIR"

# Step 2: Compile JS to C
echo "Compiling JS to C..."
"$HERMES_BUILD/bin/shermes" \
    -emit-c \
    -exported-unit=preact_ssr \
    -O \
    -o "$BUILD_DIR/preact-ssr.c" \
    "$SRC_DIR/preact-ssr.mjs"

# Step 3: Compile C file
echo "Compiling C..."
gcc -c -std=gnu11 -DNDEBUG \
    "$BUILD_DIR/preact-ssr.c" \
    -I "$HERMES_DIR/include" \
    -I "$HERMES_BUILD/lib/config" \
    -o "$BUILD_DIR/preact-ssr.o"

# Step 4: Compile C++ wrapper (single-shot version)
echo "Compiling C++ wrapper..."
g++ -c -std=c++17 \
    "$SRC_DIR/ssr-wrapper.cpp" \
    -I "$HERMES_DIR/include" \
    -I "$HERMES_DIR/public" \
    -I "$HERMES_DIR/API" \
    -I "$HERMES_DIR/API/jsi" \
    -I "$HERMES_BUILD/lib/config" \
    -o "$BUILD_DIR/ssr-wrapper.o"

# Step 5: Link single-shot binary
echo "Linking ssr-bin..."
g++ \
    "$BUILD_DIR/ssr-wrapper.o" \
    "$BUILD_DIR/preact-ssr.o" \
    -L "$HERMES_BUILD/lib" \
    -L "$HERMES_BUILD/API/hermes" \
    -L "$HERMES_BUILD/jsi" \
    -L "$HERMES_BUILD/external/boost/boost_1_86_0/libs/context" \
    -Wl,--start-group \
    -lhermesvm_a -lhermesapi -ljsi -lboost_context \
    -Wl,--end-group \
    -lpthread -ldl -lm \
    -o "$BUILD_DIR/ssr-bin"

# Step 6: Compile C++ server (persistent version)
echo "Compiling C++ server..."
g++ -c -std=c++17 \
    "$SRC_DIR/ssr-server.cpp" \
    -I "$HERMES_DIR/include" \
    -I "$HERMES_DIR/public" \
    -I "$HERMES_DIR/API" \
    -I "$HERMES_DIR/API/jsi" \
    -I "$HERMES_BUILD/lib/config" \
    -o "$BUILD_DIR/ssr-server.o"

# Step 7: Link server binary
echo "Linking ssr-server..."
g++ \
    "$BUILD_DIR/ssr-server.o" \
    "$BUILD_DIR/preact-ssr.o" \
    -L "$HERMES_BUILD/lib" \
    -L "$HERMES_BUILD/API/hermes" \
    -L "$HERMES_BUILD/jsi" \
    -L "$HERMES_BUILD/external/boost/boost_1_86_0/libs/context" \
    -Wl,--start-group \
    -lhermesvm_a -lhermesapi -ljsi -lboost_context \
    -Wl,--end-group \
    -lpthread -ldl -lm \
    -o "$BUILD_DIR/ssr-server"

# Clean up object files
rm -f "$BUILD_DIR/preact-ssr.o" "$BUILD_DIR/ssr-wrapper.o" "$BUILD_DIR/ssr-server.o"

echo ""
echo "=== Build Complete ==="
echo "Binary (single-shot): $BUILD_DIR/ssr-bin ($(du -h "$BUILD_DIR/ssr-bin" | cut -f1))"
echo "Binary (server):      $BUILD_DIR/ssr-server ($(du -h "$BUILD_DIR/ssr-server" | cut -f1))"
echo ""
echo "Test single-shot:"
echo "  ./build/ssr-bin '{\"counter\": 42, \"urlPathname\": \"/\"}'"
echo ""
echo "Test server (stdin):"
echo "  echo '{\"counter\": 42, \"urlPathname\": \"/\"}' | ./build/ssr-server"
