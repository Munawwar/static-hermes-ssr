#!/bin/bash
# Complete build script for Static Hermes SSR
# This is a convenience wrapper that calls the individual build steps
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Static Hermes SSR: Complete Build ==="
echo ""

# Step 1: Setup Hermes (if not already built)
echo "Step 1/3: Setting up Hermes compiler..."
./setup-hermes.sh
echo ""

# Step 2: Build frontend bundle
echo "Step 2/3: Building frontend (Preact → esbuild → bundle)..."
cd example-frontend
npm run build
cd "$SCRIPT_DIR"
echo ""

# Step 3: Compile bundle to native binary
echo "Step 3/3: Compiling bundle to native binary..."
JS_BUNDLE=example-frontend/dist/bundle.mjs ./build-ssr-binary.sh
echo ""

echo "=== ✅ Complete Build Finished ==="
echo ""
echo "Test the binaries:"
echo "  ./build/ssr-bin '{\"route\": \"/\", \"counter\": 42}'"
echo "  ./build/ssr-bin '{\"route\": \"/about\", \"user\": \"Alice\"}'"
echo "  echo '{\"route\": \"/blog\"}' | ./build/ssr-server"
