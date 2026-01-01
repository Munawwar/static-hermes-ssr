#!/usr/bin/env python3
"""
Example: Using Static Hermes SSR in single-run mode (multi-route).

This demonstrates calling the compiled SSR binary with JSON input.
Each call spawns a new process (cold start ~2.7ms).

The binary supports multiple routes - just specify the route in JSON.
"""

import subprocess
import json

# Render home page
result = subprocess.run(
    ['./build/ssr-bin', json.dumps({"route": "/", "counter": 42})],
    capture_output=True,
    text=True
)
print("=== Home Page ===")
print(result.stdout[:200] + "...\n")

# Render about page
result = subprocess.run(
    ['./build/ssr-bin', json.dumps({"route": "/about", "user": "Bob"})],
    capture_output=True,
    text=True
)
print("=== About Page ===")
print(result.stdout[:200] + "...\n")

# Render blog page
result = subprocess.run(
    ['./build/ssr-bin', json.dumps({"route": "/blog"})],
    capture_output=True,
    text=True
)
print("=== Blog Page ===")
print(result.stdout[:200] + "...")
