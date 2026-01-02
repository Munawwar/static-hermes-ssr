# Plan: Deploy Static Hermes SSR to AWS Lambda

## Objective

Deploy a **hello world** Static Hermes binary to AWS Lambda and measure **Init Duration** (cold start) from CloudWatch logs. Compare results with other runtimes at https://maxday.github.io/lambda-perf/

**AWS Profile:** Use `--profile personal` for all AWS CLI commands.

**Architecture:** x86_64 only (ARM would require cross-compilation, out of scope)

**Memory:** Start with 128MB (minimum)

**Success metric:** Init Duration statistics (avg, median, min, max, p95)

## Project Context

This project compiles JavaScript to a native binary using Facebook's Static Hermes compiler. For this benchmark:
- Simple "hello world" response (to compare fairly with lambda-perf)
- **No libicu or libssl needed** for hello world (only needed for crypto/Unicode features)
- Binary size: likely much smaller than full SSR binary (~7.5MB)

## Files to Explore

### Core Project Files
- `/home/webdev/Projects/devlab/hermes/README.md` - Project overview, build process
- `/home/webdev/Projects/devlab/hermes/build-ssr-binary.sh` - How the binary is built, linked libraries
- `/home/webdev/Projects/devlab/hermes/build/ssr-bin` - The compiled binary

### Source Files (understand the interface)
- `/home/webdev/Projects/devlab/hermes/src/ssr-single-run.cpp` - Input/output interface
  - Check: does it read from argv[1] or stdin?
  - Output goes to stdout

### Dependencies
- Run `ldd build/hello-bin` to see shared library dependencies
- For hello world: likely just libc/libstdc++ (already in Lambda environment)
- No need to bundle libicu or libssl for this benchmark

## Two Approaches to Test

### Option A: Docker Image

**Pros:**
- AWS caches Docker layers across ALL customers
- Using `public.ecr.aws/lambda/provided:al2023` = likely pre-cached by AWS
- Easier dependency management

**Cons:**
- Container image overhead (even if cached)

### Option B: ZIP Package with Custom Runtime

**Pros:**
- No container image pull at all
- Lambda extracts zip once and caches it
- Potentially faster cold starts
- Smaller package = faster extraction

**Cons:**
- Must bundle all .so files manually
- Need glibc compatibility with Amazon Linux 2023
- More complex setup

**Estimated ZIP size (hello world):**
- Binary: TBD (likely 2-5MB without ICU/SSL features)
- No libicu/libssl needed
- Total: very small, ideal for cold start testing

## Hello World Setup

For fair comparison with lambda-perf benchmarks, create a minimal hello world:

```javascript
// hello.js - compile this instead of the full SSR app
(function() {
  return JSON.stringify({ message: "Hello, World!" });
})();
```

Or modify the existing binary to detect a "hello" route that returns minimal response.

## Lambda Runtime API

For custom runtimes, implement this loop in `bootstrap`:

```bash
#!/bin/bash
set -euo pipefail

API="http://${AWS_LAMBDA_RUNTIME_API}/2018-06-01/runtime"

while true; do
  HEADERS=$(mktemp)
  EVENT=$(curl -sS -LD "$HEADERS" "${API}/invocation/next")
  REQUEST_ID=$(grep -i Lambda-Runtime-Aws-Request-Id "$HEADERS" | tr -d '[:space:]' | cut -d: -f2)

  # Execute binary
  RESPONSE=$(echo "$EVENT" | /var/task/ssr-bin 2>&1) || true

  curl -sS -X POST "${API}/invocation/${REQUEST_ID}/response" -d "$RESPONSE"
done
```

## Measurement Methodology

### Metrics to Collect
- **Init Duration** (cold start): From CloudWatch REPORT line
- **Duration** (warm execution): From CloudWatch REPORT line

### Statistics Required
For both cold starts and warm invocations:
- Average
- Median
- Min
- Max
- P95

### Data Points
- Cold starts: 5-10 measurements
- Warm invocations: 5-10 measurements

### Forcing Cold Starts
No need to wait 15 minutes. Either:
```bash
# Option 1: Change environment variable
aws lambda update-function-configuration \
  --profile personal \
  --function-name hermes-ssr \
  --environment "Variables={TS=$(date +%s)}"

# Option 2: Change memory setting (toggle between 128 and 129)
aws lambda update-function-configuration \
  --profile personal \
  --function-name hermes-ssr \
  --memory-size 129  # then back to 128
```

### Measurement Script

```bash
#!/bin/bash
# measure.sh - Collect cold start and warm invocation data

FUNCTION_NAME="hermes-ssr"
PROFILE="personal"
COLD_RUNS=10
WARM_RUNS=10

FUNCTION_URL=$(aws lambda get-function-url-config \
  --profile $PROFILE \
  --function-name $FUNCTION_NAME \
  --query 'FunctionUrl' --output text)

echo "=== Cold Start Measurements ==="
for i in $(seq 1 $COLD_RUNS); do
  echo "Cold start $i/$COLD_RUNS"

  # Force cold start
  aws lambda update-function-configuration \
    --profile $PROFILE \
    --function-name $FUNCTION_NAME \
    --environment "Variables={RUN=$i}" > /dev/null

  aws lambda wait function-updated \
    --profile $PROFILE \
    --function-name $FUNCTION_NAME

  # Invoke
  curl -s "$FUNCTION_URL" -d '{}' > /dev/null

  sleep 2
done

echo ""
echo "=== Warm Invocation Measurements ==="
# First invoke to warm up
curl -s "$FUNCTION_URL" -d '{}' > /dev/null
sleep 1

for i in $(seq 1 $WARM_RUNS); do
  echo "Warm invocation $i/$WARM_RUNS"
  curl -s "$FUNCTION_URL" -d '{}' > /dev/null
  sleep 0.5
done

echo ""
echo "=== Fetching Results ==="
echo "Run this to get the data:"
echo "aws logs filter-log-events \\"
echo "  --profile $PROFILE \\"
echo "  --log-group-name /aws/lambda/$FUNCTION_NAME \\"
echo "  --filter-pattern 'REPORT' \\"
echo "  --start-time \$(date -d '10 minutes ago' +%s000)"
```

### Parsing Results

```bash
# Extract Init Duration (cold starts only have this)
aws logs filter-log-events \
  --profile personal \
  --log-group-name /aws/lambda/hermes-ssr \
  --filter-pattern 'Init Duration' \
  --start-time $(date -d '10 minutes ago' +%s000) \
  --query 'events[].message' --output text | \
  grep -oP 'Init Duration: \K[0-9.]+' | \
  sort -n

# Extract Duration (all invocations)
aws logs filter-log-events \
  --profile personal \
  --log-group-name /aws/lambda/hermes-ssr \
  --filter-pattern 'REPORT' \
  --start-time $(date -d '10 minutes ago' +%s000) \
  --query 'events[].message' --output text | \
  grep -oP 'Duration: \K[0-9.]+' | \
  sort -n
```

## Implementation Steps

### Phase 1: Create Hello World Binary

1. [ ] Create minimal hello world JS that returns `{"message":"Hello, World!"}`
2. [ ] Build with shermes: `shermes -emit-c -exported-unit=hello -O -o hello.c hello.js`
3. [ ] Compile to binary (follow build-ssr-binary.sh pattern)
4. [ ] Test locally: `./hello-bin '{}'` should return hello world JSON

### Phase 2: Option A - Docker Deployment

1. [ ] Create `lambda/Dockerfile`:
   ```dockerfile
   FROM public.ecr.aws/lambda/provided:al2023

   # No extra runtime libs needed for hello world
   # (libicu/libssl only needed for crypto/Unicode features)

   COPY bootstrap /var/runtime/bootstrap
   COPY hello-bin /var/task/hello-bin

   RUN chmod +x /var/runtime/bootstrap /var/task/hello-bin

   ENTRYPOINT ["/var/runtime/bootstrap"]
   ```

2. [ ] Create `lambda/bootstrap` (Runtime API implementation)

3. [ ] Test locally with Lambda RIE

4. [ ] Push to ECR and deploy

5. [ ] Create Function URL

6. [ ] Run measurements

### Phase 3: Option B - ZIP Deployment

1. [ ] Find all required .so files:
   ```bash
   ldd build/hello-bin | grep "=> /" | awk '{print $3}'
   ```

2. [ ] Create ZIP structure:
   ```
   lambda-zip/
   ├── bootstrap          # Runtime API script
   ├── hello-bin          # The binary
   └── lib/               # Shared libraries
       ├── libicuuc.so.74
       ├── libicui18n.so.74
       ├── libicudata.so.74
       ├── libssl.so.3
       └── libcrypto.so.3
   ```

3. [ ] Update bootstrap to set LD_LIBRARY_PATH:
   ```bash
   #!/bin/bash
   export LD_LIBRARY_PATH=/var/task/lib:$LD_LIBRARY_PATH
   # ... rest of runtime API loop
   ```

4. [ ] Create ZIP:
   ```bash
   cd lambda-zip && zip -r ../hermes-lambda.zip .
   ```

5. [ ] Deploy:
   ```bash
   aws lambda create-function \
     --profile personal \
     --function-name hermes-ssr-zip \
     --runtime provided.al2023 \
     --handler bootstrap \
     --zip-file fileb://hermes-lambda.zip \
     --role arn:aws:iam::ACCOUNT_ID:role/lambda-basic-execution \
     --memory-size 128 \
     --timeout 30 \
     --architectures x86_64
   ```

6. [ ] Create Function URL and run measurements

### Phase 4: Compare Results

1. [ ] Calculate statistics for both approaches:
   - Docker cold start: avg, median, min, max, p95
   - ZIP cold start: avg, median, min, max, p95
   - Docker warm: avg, median, min, max, p95
   - ZIP warm: avg, median, min, max, p95

2. [ ] Compare with lambda-perf benchmarks:
   - https://maxday.github.io/lambda-perf/
   - Look at similar runtimes (Rust, Go, C++) for comparison

3. [ ] Document findings

## Files to Create

```
lambda/
├── hello.js                # Minimal hello world JS
├── Dockerfile              # Docker approach
├── bootstrap               # Lambda Runtime API script
├── build-hello.sh          # Build hello world binary
├── deploy-docker.sh        # Docker deployment script
├── deploy-zip.sh           # ZIP deployment script
├── measure.sh              # Measurement script
├── parse-results.sh        # Parse CloudWatch logs
└── cleanup.sh              # Delete all AWS resources
```

## Expected Results

**Comparison targets from lambda-perf (128MB, x86_64):**
- Rust: ~12ms cold start
- Go: ~10ms cold start
- Node.js: ~150-250ms cold start
- Python: ~100-200ms cold start

**Our predictions:**
- Static Hermes (Docker): 50-200ms? (container overhead + binary)
- Static Hermes (ZIP): 20-100ms? (no container, just binary load)

The interesting question: Can a native-compiled JS binary compete with Rust/Go cold starts?

## Cleanup

```bash
#!/bin/bash
# cleanup.sh
PROFILE="personal"

# Docker approach
aws lambda delete-function-url-config --profile $PROFILE --function-name hermes-ssr 2>/dev/null
aws lambda delete-function --profile $PROFILE --function-name hermes-ssr 2>/dev/null
aws ecr batch-delete-image --profile $PROFILE --repository-name hermes-ssr --image-ids imageTag=latest 2>/dev/null
aws ecr delete-repository --profile $PROFILE --repository-name hermes-ssr 2>/dev/null

# ZIP approach
aws lambda delete-function-url-config --profile $PROFILE --function-name hermes-ssr-zip 2>/dev/null
aws lambda delete-function --profile $PROFILE --function-name hermes-ssr-zip 2>/dev/null

# CloudWatch logs (optional - costs nothing to keep)
# aws logs delete-log-group --profile $PROFILE --log-group-name /aws/lambda/hermes-ssr
# aws logs delete-log-group --profile $PROFILE --log-group-name /aws/lambda/hermes-ssr-zip

echo "Cleanup complete"
```

## References

- Lambda Perf Benchmarks: https://maxday.github.io/lambda-perf/
- AWS Lambda Custom Runtimes: https://docs.aws.amazon.com/lambda/latest/dg/runtimes-custom.html
- Lambda Runtime API: https://docs.aws.amazon.com/lambda/latest/dg/runtimes-api.html
- Lambda Container Images: https://docs.aws.amazon.com/lambda/latest/dg/images-create.html
- Lambda RIE: https://github.com/aws/aws-lambda-runtime-interface-emulator
