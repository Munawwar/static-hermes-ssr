#!/usr/bin/env python3
"""
Example: Using Static Hermes SSR in single-shot mode.

This demonstrates calling the compiled SSR binary with JSON input.
Each call spawns a new process (cold start ~2.7ms).
"""

import subprocess
import json

# Render a page by passing JSON to the SSR binary
result = subprocess.run(
    ['./build/ssr-bin', json.dumps({"counter": 42, "urlPathname": "/"})],
    capture_output=True,
    text=True
)

print(result.stdout)
