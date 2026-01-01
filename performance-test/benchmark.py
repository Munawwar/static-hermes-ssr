#!/usr/bin/env python3
"""
Warm execution benchmark for Static Hermes SSR server.

Keeps the process alive and measures execution time for repeated requests,
eliminating process spawn overhead.
"""

import subprocess
import json
import time
import sys
import os

# Configuration
NUM_WARMUP = 10  # Requests to skip for JIT warmup
NUM_REQUESTS = 100  # Requests to measure
TEST_JSON = {"counter": 42, "urlPathname": "/"}

# Get project directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
SERVER_BIN = os.path.join(PROJECT_DIR, "build", "ssr-server")
SINGLE_BIN = os.path.join(PROJECT_DIR, "build", "ssr-bin")

# Check if binaries exist
if not os.path.exists(SERVER_BIN):
    print(f"ERROR: {SERVER_BIN} not found")
    print("Run ./setup-and-build.sh first")
    sys.exit(1)

if not os.path.exists(SINGLE_BIN):
    print(f"ERROR: {SINGLE_BIN} not found")
    print("Run ./setup-and-build.sh first")
    sys.exit(1)

print("=== Static Hermes SSR: Warm vs Cold Benchmark ===\n")

# === Cold Start Benchmark (single-shot binary) ===
print(f"Running cold start benchmark ({NUM_REQUESTS} runs)...")
cold_times = []

for i in range(NUM_REQUESTS):
    start = time.perf_counter()
    result = subprocess.run(
        [SINGLE_BIN, json.dumps(TEST_JSON)],
        capture_output=True,
        text=True
    )
    end = time.perf_counter()

    if result.returncode != 0:
        print(f"ERROR: Cold run {i+1} failed: {result.stderr}")
        sys.exit(1)

    cold_times.append((end - start) * 1000)  # Convert to ms

cold_avg = sum(cold_times) / len(cold_times)
cold_min = min(cold_times)
cold_max = max(cold_times)

print(f"  Average: {cold_avg:.3f}ms")
print(f"  Min:     {cold_min:.3f}ms")
print(f"  Max:     {cold_max:.3f}ms")
print()

# === Warm Execution Benchmark (persistent server) ===
print(f"Starting persistent server...")
print(f"  Warmup: {NUM_WARMUP} requests")
print(f"  Measure: {NUM_REQUESTS} requests")
print()

# Start the server process
process = subprocess.Popen(
    [SERVER_BIN],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    bufsize=1  # Line buffered
)

warm_times = []
json_line = json.dumps(TEST_JSON) + '\n'

try:
    # Warmup phase
    for i in range(NUM_WARMUP):
        process.stdin.write(json_line)
        process.stdin.flush()
        line = process.stdout.readline()
        if not line:
            stderr = process.stderr.read()
            print(f"ERROR: Server died during warmup: {stderr}")
            sys.exit(1)

    # Measurement phase
    for i in range(NUM_REQUESTS):
        start = time.perf_counter()
        process.stdin.write(json_line)
        process.stdin.flush()
        line = process.stdout.readline()
        end = time.perf_counter()

        if not line:
            stderr = process.stderr.read()
            print(f"ERROR: Server died at request {i+1}: {stderr}")
            sys.exit(1)

        warm_times.append((end - start) * 1000)  # Convert to ms

    # Close the server
    process.stdin.close()
    process.wait(timeout=1)

except Exception as e:
    print(f"ERROR: {e}")
    process.kill()
    sys.exit(1)

warm_avg = sum(warm_times) / len(warm_times)
warm_min = min(warm_times)
warm_max = max(warm_times)

print(f"Warm execution benchmark complete:")
print(f"  Average: {warm_avg:.3f}ms")
print(f"  Min:     {warm_min:.3f}ms")
print(f"  Max:     {warm_max:.3f}ms")
print()

# === Comparison ===
speedup = cold_avg / warm_avg if warm_avg > 0 else 0

print("=== Comparison ===")
print(f"{'Metric':<20} {'Cold Start':<15} {'Warm (Server)':<15} {'Improvement'}")
print("-" * 70)
print(f"{'Average':<20} {cold_avg:>12.3f}ms {warm_avg:>12.3f}ms   {speedup:>6.2f}x faster")
print(f"{'Min':<20} {cold_min:>12.3f}ms {warm_min:>12.3f}ms")
print(f"{'Max':<20} {cold_max:>12.3f}ms {warm_max:>12.3f}ms")
print()

# === Interpretation ===
print("=== Analysis ===")
if warm_avg < 1.0:
    print(f"✓ Warm execution is {warm_avg:.3f}ms - sub-millisecond!")
elif warm_avg < cold_avg * 0.5:
    print(f"✓ Significant improvement: {speedup:.1f}x faster with persistent server")
else:
    print(f"? Unexpected: warm execution not significantly faster")
    print(f"  This suggests most time is in JS execution, not process overhead")

print()
print("Key insights:")
print(f"- Process spawn overhead: ~{(cold_avg - warm_avg):.3f}ms")
print(f"- Actual JS execution: ~{warm_avg:.3f}ms")
print(f"- Requests/sec (cold): ~{1000/cold_avg:.0f}")
print(f"- Requests/sec (warm): ~{1000/warm_avg:.0f}")
