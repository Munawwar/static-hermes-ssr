#!/bin/bash
# Setup Script for Static Hermes
# Downloads and builds the Hermes compiler (one-time setup)
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HERMES_DIR="$SCRIPT_DIR/hermes-static_h"
HERMES_BUILD="$HERMES_DIR/cmake-build-release"

echo "=== Static Hermes Setup ==="

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

# Build Hermes if needed
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

    echo ""
    echo "✅ Hermes built successfully!"
else
    echo "✅ Hermes already built (skipping)"
fi

echo ""
echo "Hermes compiler: $HERMES_BUILD/bin/shermes"
echo "Libraries: $HERMES_BUILD/lib/"
