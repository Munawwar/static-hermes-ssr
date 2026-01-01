#!/bin/bash
# Performance benchmark for Static Hermes SSR binary

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SSR_BIN="$PROJECT_DIR/build/ssr-bin"

RUNS=5
TEST_JSON='{"counter": 42, "urlPathname": "/"}'

echo "============================================================"
echo "Static Hermes SSR Performance Benchmark"
echo "============================================================"
echo
echo "Binary: $SSR_BIN"
echo "Input:  $TEST_JSON"
echo "Runs:   $RUNS"
echo

if [ ! -f "$SSR_BIN" ]; then
    echo "ERROR: Binary not found"
    echo "Run ./setup-and-build.sh first"
    exit 1
fi

# Get memory usage (run once with /usr/bin/time -v)
MEMORY_KB=$(/usr/bin/time -v "$SSR_BIN" "$TEST_JSON" 2>&1 >/dev/null | grep "Maximum resident" | grep -oE '[0-9]+')

printf "%-5s %-12s %-15s\n" "Run" "Time (ms)" "Output (bytes)"
echo "-----------------------------------"

TIMES=()

for i in $(seq 1 $RUNS); do
    # Get time in nanoseconds
    START=$(date +%s%N)
    OUTPUT=$("$SSR_BIN" "$TEST_JSON")
    END=$(date +%s%N)

    # Calculate elapsed in milliseconds (using bc for floating point)
    ELAPSED_NS=$((END - START))
    ELAPSED_MS=$(echo "scale=2; $ELAPSED_NS / 1000000" | bc)

    OUTPUT_SIZE=${#OUTPUT}

    printf "%-5s %-12s %-15s\n" "$i" "$ELAPSED_MS" "$OUTPUT_SIZE"

    TIMES+=("$ELAPSED_MS")
done

echo "-----------------------------------"
echo

# Calculate stats
SUM=0
MIN=${TIMES[0]}
MAX=${TIMES[0]}

for t in "${TIMES[@]}"; do
    SUM=$(echo "$SUM + $t" | bc)
    if (( $(echo "$t < $MIN" | bc -l) )); then MIN=$t; fi
    if (( $(echo "$t > $MAX" | bc -l) )); then MAX=$t; fi
done

AVG=$(echo "scale=2; $SUM / $RUNS" | bc)
MEMORY_MB=$(echo "scale=1; $MEMORY_KB / 1024" | bc)
THROUGHPUT=$(echo "scale=0; 1000 / $AVG" | bc)

echo "Summary:"
echo
echo "  Execution Time:"
echo "    Average: $AVG ms"
echo "    Min:     $MIN ms"
echo "    Max:     $MAX ms"
echo
echo "  Memory Usage (Max RSS): $MEMORY_KB KB ($MEMORY_MB MB)"
echo
echo "  Estimated Throughput: $THROUGHPUT req/s"
echo
