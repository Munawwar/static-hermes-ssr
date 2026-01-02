#!/bin/bash
# Measure cold start and warm invocation times for hermes-hello Lambda

FUNCTION_NAME="hermes-hello"
PROFILE="personal"
COLD_RUNS=10
WARM_RUNS=10

FUNCTION_URL="https://n7sdbmhtwf5odcyc7pf25wzkmi0kclwp.lambda-url.eu-west-1.on.aws/"

echo "=== Static Hermes Lambda Cold Start Benchmark ==="
echo "Function: $FUNCTION_NAME"
echo "Cold runs: $COLD_RUNS"
echo "Warm runs: $WARM_RUNS"
echo ""

# Record start time for log filtering
START_TIME=$(date +%s000)

echo "=== Cold Start Measurements ==="
for i in $(seq 1 $COLD_RUNS); do
  echo -n "Cold start $i/$COLD_RUNS... "

  # Force cold start by updating environment variable
  aws lambda update-function-configuration \
    --profile $PROFILE \
    --function-name $FUNCTION_NAME \
    --environment "Variables={RUN=$i}" > /dev/null 2>&1

  # Wait for function to be updated
  aws lambda wait function-updated \
    --profile $PROFILE \
    --function-name $FUNCTION_NAME

  # Invoke
  curl -s "$FUNCTION_URL" -d '{}' > /dev/null

  echo "done"
  sleep 2
done

echo ""
echo "=== Warm Invocation Measurements ==="
# First invoke to warm up (already warm from last cold start, but let's be sure)
echo "Warming up..."
curl -s "$FUNCTION_URL" -d '{}' > /dev/null
sleep 1

for i in $(seq 1 $WARM_RUNS); do
  echo -n "Warm invocation $i/$WARM_RUNS... "
  curl -s "$FUNCTION_URL" -d '{}' > /dev/null
  echo "done"
  sleep 0.5
done

echo ""
echo "=== Waiting for logs to propagate ==="
sleep 5

echo ""
echo "=== Results ==="

# Fetch and parse Init Duration (cold starts)
echo "Cold Start Init Durations (ms):"
INIT_DURATIONS=$(aws logs filter-log-events \
  --profile $PROFILE \
  --log-group-name /aws/lambda/$FUNCTION_NAME \
  --filter-pattern 'Init Duration' \
  --start-time $START_TIME \
  --query 'events[].message' --output text 2>/dev/null | \
  grep -oP 'Init Duration: \K[0-9.]+' | sort -n)

echo "$INIT_DURATIONS"
echo ""

# Calculate statistics
echo "Statistics:"
echo "$INIT_DURATIONS" | awk '
BEGIN { min=999999; max=0; sum=0; count=0 }
{
  values[NR] = $1
  sum += $1
  count++
  if ($1 < min) min = $1
  if ($1 > max) max = $1
}
END {
  if (count == 0) { print "No data"; exit }
  avg = sum / count

  # Sort for median and p95
  n = asort(values)
  if (n % 2 == 1) median = values[int(n/2)+1]
  else median = (values[n/2] + values[n/2+1]) / 2

  p95_idx = int(n * 0.95)
  if (p95_idx < 1) p95_idx = 1
  p95 = values[p95_idx]

  printf "  Count:  %d\n", count
  printf "  Min:    %.2f ms\n", min
  printf "  Max:    %.2f ms\n", max
  printf "  Avg:    %.2f ms\n", avg
  printf "  Median: %.2f ms\n", median
  printf "  P95:    %.2f ms\n", p95
}'

echo ""
echo "=== Comparison with lambda-perf benchmarks (128MB, x86_64) ==="
echo "  Rust:    ~12ms"
echo "  Go:      ~10ms"
echo "  Node.js: ~150-250ms"
echo "  Python:  ~100-200ms"
