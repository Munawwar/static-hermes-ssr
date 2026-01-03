#!/bin/bash
echo "=== Cold Start Measurements ==="
TOTAL=0
COUNT=0

for i in 1 2 3 4 5; do
    aws lambda update-function-configuration --function-name hermes-hello --environment "Variables={RUN=${i}${RANDOM}}" > /dev/null 2>&1
    sleep 4

    RESULT=$(aws lambda invoke --function-name hermes-hello --cli-binary-format raw-in-base64-out --payload '{}' --log-type Tail /tmp/out.json --query 'LogResult' --output text | base64 -d | grep -oP 'Init Duration: \K[\d.]+')

    if [ -n "$RESULT" ]; then
        echo "Run $i: ${RESULT}ms"
        TOTAL=$(echo "$TOTAL + $RESULT" | bc)
        COUNT=$((COUNT + 1))
    else
        echo "Run $i: No init duration (warm?)"
    fi
done

if [ $COUNT -gt 0 ]; then
    AVG=$(echo "scale=2; $TOTAL / $COUNT" | bc)
    echo ""
    echo "Average: ${AVG}ms (over $COUNT cold starts)"
fi
