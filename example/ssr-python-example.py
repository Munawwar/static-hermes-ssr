#!/usr/bin/env python3
"""
Test script for the Static Hermes compiled SSR binary with dynamic JSON input.

This demonstrates calling the compiled JavaScript SSR code from Python
with different JSON payloads.
"""

import subprocess
import json
import sys
import time


def render_page(json_data: dict) -> str:
    """
    Render a page by calling the compiled SSR binary with JSON data.

    Args:
        json_data: Dictionary containing page context (counter, urlPathname, etc.)

    Returns:
        HTML string rendered by the SSR binary
    """
    json_str = json.dumps(json_data)

    result = subprocess.run(
        ['./build/ssr-bin', json_str],
        capture_output=True,
        text=True,
        timeout=5
    )

    if result.returncode != 0:
        raise RuntimeError(f"SSR failed: {result.stderr}")

    return result.stdout.strip()


def test_basic_execution():
    """Test basic execution with default page context."""
    print("=== Test 1: Basic Execution ===")

    page_context = {"counter": 10, "urlPathname": "/"}
    print(f"Input JSON: {json.dumps(page_context)}")
    print()

    try:
        html = render_page(page_context)

        print("HTML Output (first 500 chars):")
        print("-" * 60)
        print(html[:500] + "..." if len(html) > 500 else html)
        print("-" * 60)

        # Verify HTML structure
        assert '<div' in html, "Should contain div tags"
        assert 'Welcome' in html, "Should contain Welcome text"
        assert 'Counter' in html, "Should contain Counter component"
        assert '10' in html, "Should contain counter value 10"

        print("\nTest passed: Valid HTML generated")
        return True

    except FileNotFoundError:
        print("ERROR: Binary './build/ssr-bin' not found")
        print("Please run ./setup-and-build.sh first")
        return False
    except subprocess.TimeoutExpired:
        print("ERROR: Binary execution timed out")
        return False
    except AssertionError as e:
        print(f"Test failed: {e}")
        return False


def test_dynamic_counter():
    """Test with different counter values."""
    print("\n=== Test 2: Dynamic Counter Values ===")

    test_cases = [
        {"counter": 0, "urlPathname": "/"},
        {"counter": 42, "urlPathname": "/"},
        {"counter": 999, "urlPathname": "/"},
    ]

    for page_context in test_cases:
        try:
            html = render_page(page_context)
            counter_val = str(page_context["counter"])

            if counter_val in html:
                print(f"  counter={counter_val}: PASS (found in HTML)")
            else:
                print(f"  counter={counter_val}: FAIL (not found in HTML)")
                return False

        except Exception as e:
            print(f"  counter={page_context['counter']}: ERROR - {e}")
            return False

    print("Test passed: All counter values rendered correctly")
    return True


def test_different_pages():
    """Test with different URL pathnames."""
    print("\n=== Test 3: Different URL Pathnames ===")

    test_cases = [
        {"counter": 10, "urlPathname": "/"},
        {"counter": 10, "urlPathname": "/about"},
        {"counter": 10, "urlPathname": "/contact"},
    ]

    for page_context in test_cases:
        try:
            html = render_page(page_context)
            print(f"  urlPathname='{page_context['urlPathname']}': OK ({len(html)} chars)")
        except Exception as e:
            print(f"  urlPathname='{page_context['urlPathname']}': ERROR - {e}")
            return False

    print("Test passed: Different pages rendered")
    return True


def benchmark_execution():
    """Benchmark the execution speed."""
    print("\n=== Test 4: Performance Benchmark ===")

    page_context = {"counter": 42, "urlPathname": "/"}
    iterations = 100

    print(f"Running {iterations} iterations...")

    start = time.time()
    for i in range(iterations):
        render_page(page_context)
    end = time.time()

    elapsed = end - start
    avg_ms = (elapsed / iterations) * 1000

    print(f"Total time: {elapsed:.2f}s")
    print(f"Average per execution: {avg_ms:.2f}ms")
    print(f"Throughput: {iterations/elapsed:.2f} req/s")

    print("\nBenchmark complete")
    return True


def demo_usage():
    """Demonstrate how to use the SSR binary from Python."""
    print("\n=== Demo: Python Integration ===")
    print()
    print("Example code:")
    print("-" * 60)
    print("""
import subprocess
import json

def render_ssr(page_data):
    result = subprocess.run(
        ['./build/ssr-bin', json.dumps(page_data)],
        capture_output=True,
        text=True
    )
    return result.stdout

# Render home page with counter at 42
html = render_ssr({
    "counter": 42,
    "urlPathname": "/"
})

print(html)
""")
    print("-" * 60)

    # Actually run the demo
    try:
        html = render_page({"counter": 42, "urlPathname": "/"})
        print("\nActual output preview:")
        print(html[:200] + "...")
    except Exception as e:
        print(f"\nDemo failed: {e}")


def main():
    """Run all tests."""
    print("Static Hermes SSR Test Suite (Dynamic JSON Input)")
    print("=" * 60)
    print()

    all_passed = True

    if not test_basic_execution():
        all_passed = False
        print("\nStopping tests due to basic execution failure.")
        return 1

    if not test_dynamic_counter():
        all_passed = False

    if not test_different_pages():
        all_passed = False

    try:
        benchmark_execution()
    except FileNotFoundError:
        pass

    demo_usage()

    print("\n" + "=" * 60)
    if all_passed:
        print("All tests passed!")
        return 0
    else:
        print("Some tests failed.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
