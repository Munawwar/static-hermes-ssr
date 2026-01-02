#!/bin/bash
# Build Script for SSR Binary
# Compiles a JavaScript bundle to native binary using Static Hermes
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HERMES_DIR="$SCRIPT_DIR/hermes-static_h"
HERMES_BUILD="$HERMES_DIR/cmake-build-release"
SRC_DIR="$SCRIPT_DIR/src"
BUILD_DIR="$SCRIPT_DIR/build"

# Default parameters (can be overridden)
JS_BUNDLE="${JS_BUNDLE:-example-frontend/dist/bundle.mjs}"
UNIT_NAME="${UNIT_NAME:-ssr_router}"
OUTPUT_PREFIX="${OUTPUT_PREFIX:-ssr}"

echo "=== Building SSR Binary ==="
echo "JavaScript bundle: $JS_BUNDLE"
echo "Unit name: $UNIT_NAME"
echo "Output: $BUILD_DIR/${OUTPUT_PREFIX}-bin, $BUILD_DIR/${OUTPUT_PREFIX}-server"
echo ""

# Check Hermes is built
if [ ! -f "$HERMES_BUILD/bin/shermes" ]; then
    echo "ERROR: Hermes not built. Run ./setup-hermes.sh first"
    exit 1
fi

# Check bundle exists
if [ ! -f "$JS_BUNDLE" ]; then
    echo "ERROR: JavaScript bundle not found: $JS_BUNDLE"
    echo "Build it first (e.g., cd example-frontend && npm run build)"
    exit 1
fi

mkdir -p "$BUILD_DIR"

# Detect OS for platform-specific flags
OS="$(uname -s)"
echo "Detected OS: $OS"

if [ "$OS" = "Darwin" ]; then
    # macOS: no --start-group, no -ldl, link Security + CommonCrypto frameworks
    LINK_GROUP_START=""
    LINK_GROUP_END=""
    PLATFORM_LIBS="-framework Security"
else
    # Linux: use --start-group for circular deps
    LINK_GROUP_START="-Wl,--start-group"
    LINK_GROUP_END="-Wl,--end-group"
    PLATFORM_LIBS="-ldl"

    # Check for OpenSSL and link if available
    if pkg-config --exists openssl 2>/dev/null || [ -f /usr/include/openssl/sha.h ]; then
        echo "OpenSSL found - crypto.subtle will be available"
        PLATFORM_LIBS="$PLATFORM_LIBS -lssl -lcrypto"
    else
        echo "OpenSSL not found - crypto.subtle will NOT be available"
        echo "  Install with: sudo apt install libssl-dev"
    fi

    # Check for ICU and link if available (for full Unicode/Intl support)
    if pkg-config --exists icu-uc 2>/dev/null; then
        echo "ICU found - full Unicode/Intl support enabled"
        PLATFORM_LIBS="$PLATFORM_LIBS $(pkg-config --libs icu-uc icu-i18n)"
    elif [ -f /usr/include/unicode/uchar.h ]; then
        echo "ICU found - full Unicode/Intl support enabled"
        PLATFORM_LIBS="$PLATFORM_LIBS -licuuc -licui18n -licudata"
    fi
fi

# Step 1: Compile JavaScript bundle to C with shermes
echo "Step 1: Compiling JS to C with shermes..."
"$HERMES_BUILD/bin/shermes" \
    -emit-c \
    -exported-unit="$UNIT_NAME" \
    -O \
    -o "$BUILD_DIR/${UNIT_NAME}.c" \
    "$JS_BUNDLE"

# Step 2: Compile C file
echo "Step 2: Compiling C..."
gcc -c -std=gnu11 -DNDEBUG -O2 \
    "$BUILD_DIR/${UNIT_NAME}.c" \
    -I "$HERMES_DIR/include" \
    -I "$HERMES_BUILD/lib/config" \
    -o "$BUILD_DIR/${UNIT_NAME}.o"

# Step 3: Compile C++ single-run wrapper
echo "Step 3: Compiling C++ single-run wrapper..."
g++ -c -std=c++17 -DNDEBUG -O2 \
    -DUNIT_NAME="$UNIT_NAME" \
    "$SRC_DIR/ssr-single-run.cpp" \
    -I "$HERMES_DIR/include" \
    -I "$HERMES_DIR/public" \
    -I "$HERMES_DIR/API" \
    -I "$HERMES_DIR/API/jsi" \
    -I "$HERMES_BUILD/lib/config" \
    -o "$BUILD_DIR/ssr-single-run.o"

# Step 4: Link single-run binary
echo "Step 4: Linking ${OUTPUT_PREFIX}-bin..."
g++ \
    "$BUILD_DIR/ssr-single-run.o" \
    "$BUILD_DIR/${UNIT_NAME}.o" \
    -L "$HERMES_BUILD/lib" \
    -L "$HERMES_BUILD/API/hermes" \
    -L "$HERMES_BUILD/jsi" \
    -L "$HERMES_BUILD/external/boost/boost_1_86_0/libs/context" \
    $LINK_GROUP_START \
    -lhermesvm_a -lhermesapi -ljsi -lboost_context \
    $LINK_GROUP_END \
    -lpthread $PLATFORM_LIBS -lm \
    -o "$BUILD_DIR/${OUTPUT_PREFIX}-bin"

# Step 5: Compile C++ server wrapper
echo "Step 5: Compiling C++ server wrapper..."
g++ -c -std=c++17 -DNDEBUG -O2 \
    -DUNIT_NAME="$UNIT_NAME" \
    "$SRC_DIR/ssr-server.cpp" \
    -I "$HERMES_DIR/include" \
    -I "$HERMES_DIR/public" \
    -I "$HERMES_DIR/API" \
    -I "$HERMES_DIR/API/jsi" \
    -I "$HERMES_BUILD/lib/config" \
    -o "$BUILD_DIR/ssr-server.o"

# Step 6: Link server binary
echo "Step 6: Linking ${OUTPUT_PREFIX}-server..."
g++ \
    "$BUILD_DIR/ssr-server.o" \
    "$BUILD_DIR/${UNIT_NAME}.o" \
    -L "$HERMES_BUILD/lib" \
    -L "$HERMES_BUILD/API/hermes" \
    -L "$HERMES_BUILD/jsi" \
    -L "$HERMES_BUILD/external/boost/boost_1_86_0/libs/context" \
    $LINK_GROUP_START \
    -lhermesvm_a -lhermesapi -ljsi -lboost_context \
    $LINK_GROUP_END \
    -lpthread $PLATFORM_LIBS -lm \
    -o "$BUILD_DIR/${OUTPUT_PREFIX}-server"

# Clean up object files
rm -f "$BUILD_DIR/${UNIT_NAME}.o" "$BUILD_DIR/ssr-single-run.o" "$BUILD_DIR/ssr-server.o"

echo ""
echo "=== Build Complete ==="
echo "Binary (single-run): $BUILD_DIR/${OUTPUT_PREFIX}-bin ($(du -h "$BUILD_DIR/${OUTPUT_PREFIX}-bin" | cut -f1))"
echo "Binary (server):      $BUILD_DIR/${OUTPUT_PREFIX}-server ($(du -h "$BUILD_DIR/${OUTPUT_PREFIX}-server" | cut -f1))"
echo ""
echo "Test single-run:"
echo "  ./$BUILD_DIR/${OUTPUT_PREFIX}-bin '{\"route\": \"/\", \"counter\": 42}'"
echo ""
echo "Test server (stdin):"
echo "  echo '{\"route\": \"/about\", \"user\": \"Alice\"}' | ./$BUILD_DIR/${OUTPUT_PREFIX}-server"
