# Static Hermes SSR - Multi-stage Docker Build
#
# Stage 1: Hermes compiler (cached, ~10-20 min first time)
# Stage 2: Build tools + stable deps (node, esbuild, polyfills)
# Stage 3: App build (fast rebuilds when code changes)
# Stage 4: Minimal runtime (~80MB production image)
#
# Usage:
#   docker build -t ssr-app .
#   docker run --rm ssr-app '{"route": "/", "counter": 42}'

# =============================================================================
# Stage 1: Hermes Builder (rarely changes)
# =============================================================================
FROM ubuntu:24.04 AS hermes-builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    ninja-build \
    python3 \
    git \
    curl \
    ca-certificates \
    libicu-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /hermes-src
ARG HERMES_COMMIT=2757ad0d1f461d8b14e4f21cab6f66ef4d05bcea
RUN curl -L "https://github.com/facebook/hermes/archive/${HERMES_COMMIT}.zip" -o hermes.zip \
    && unzip -q hermes.zip \
    && mv hermes-* hermes \
    && rm hermes.zip

WORKDIR /hermes-src/hermes
RUN cmake -B build -G Ninja \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_INTERPROCEDURAL_OPTIMIZATION=ON \
    -DHERMES_UNICODE_LITE=OFF \
    -DHERMES_USE_STATIC_ICU=OFF

# Build ExtensionsBytecodeInclude first to avoid dependency issues
RUN cmake --build build --target ExtensionsBytecodeInclude \
    && cmake --build build --target shermes hermesvm_a hermesapi

# =============================================================================
# Stage 2: Build Tools + Stable Dependencies (changes occasionally)
# =============================================================================
FROM ubuntu:24.04 AS build-tools

ENV DEBIAN_FRONTEND=noninteractive

# Install all build-time dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libicu-dev \
    libssl-dev \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Copy Hermes compiler and libraries
COPY --from=hermes-builder /hermes-src/hermes/build/bin/shermes /usr/local/bin/
COPY --from=hermes-builder /hermes-src/hermes/build/lib/*.a /usr/local/lib/hermes/
COPY --from=hermes-builder /hermes-src/hermes/build/API/hermes/*.a /usr/local/lib/hermes/
COPY --from=hermes-builder /hermes-src/hermes/build/jsi/*.a /usr/local/lib/hermes/
COPY --from=hermes-builder /hermes-src/hermes/build/external/boost/boost_1_86_0/libs/context/*.a /usr/local/lib/hermes/
COPY --from=hermes-builder /hermes-src/hermes/include /usr/local/include/hermes
COPY --from=hermes-builder /hermes-src/hermes/public /usr/local/include/hermes-public
COPY --from=hermes-builder /hermes-src/hermes/API /usr/local/include/hermes-api
COPY --from=hermes-builder /hermes-src/hermes/build/lib/config /usr/local/include/hermes-config

WORKDIR /app

# Install polyfill dependencies (stable, cached)
COPY src/polyfills/package*.json ./src/polyfills/
RUN cd src/polyfills && npm install --omit=dev 2>/dev/null || true

# Install frontend build tools (esbuild, cached)
COPY example-frontend/package*.json ./example-frontend/
RUN cd example-frontend && npm install

# =============================================================================
# Stage 3: App Build (changes frequently)
# =============================================================================
FROM build-tools AS app-builder

# Copy source files
COPY src/ ./src/
COPY example-frontend/ ./example-frontend/

# Build JS bundle
RUN cd example-frontend && npm run build

# Build SSR binary
ARG UNIT_NAME=ssr_router
ARG OUTPUT_NAME=ssr-bin

# Compile JS to C
RUN shermes \
    -emit-c \
    -exported-unit="${UNIT_NAME}" \
    -O \
    -o /tmp/${UNIT_NAME}.c \
    example-frontend/dist/bundle.mjs

# Compile and link
RUN gcc -c -std=gnu11 -DNDEBUG -O2 \
    /tmp/${UNIT_NAME}.c \
    -I /usr/local/include/hermes \
    -I /usr/local/include/hermes-config \
    -o /tmp/${UNIT_NAME}.o \
    && g++ -c -std=c++17 -DNDEBUG -O2 \
    -DUNIT_NAME="${UNIT_NAME}" \
    src/ssr-single-run.cpp \
    -I /usr/local/include/hermes \
    -I /usr/local/include/hermes-public \
    -I /usr/local/include/hermes-api \
    -I /usr/local/include/hermes-api/jsi \
    -I /usr/local/include/hermes-config \
    -o /tmp/ssr-single-run.o \
    && g++ \
    /tmp/ssr-single-run.o \
    /tmp/${UNIT_NAME}.o \
    -L /usr/local/lib/hermes \
    -Wl,--start-group \
    -lhermesvm_a -lhermesapi -ljsi -lboost_context \
    -Wl,--end-group \
    -lpthread -ldl -lssl -lcrypto -lm \
    $(pkg-config --libs icu-uc icu-i18n) \
    -o /app/${OUTPUT_NAME}

# =============================================================================
# Stage 4: Runtime (minimal production image)
# =============================================================================
FROM ubuntu:24.04 AS runtime

ENV DEBIAN_FRONTEND=noninteractive

# Only runtime libraries - no build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    libicu74 \
    libssl3t64 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=app-builder /app/ssr-bin ./ssr-bin

ENTRYPOINT ["/app/ssr-bin"]
