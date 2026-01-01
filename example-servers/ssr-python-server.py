#!/usr/bin/env python3
"""
Example: Using Static Hermes SSR in persistent server mode.

This demonstrates how to keep the SSR process alive and send multiple
requests via stdin for warm execution (~0.17ms vs ~2.7ms cold start).
"""

import subprocess
import json
import sys
import os


class SSRServer:
    """
    Persistent Static Hermes SSR server.

    Keeps the SSR process alive and handles requests via stdin/stdout.
    Use as a context manager for automatic cleanup.

    Example:
        with SSRServer() as ssr:
            html = ssr.render({"counter": 42, "urlPathname": "/"})
    """

    def __init__(self, binary_path=None):
        """Initialize the SSR server."""
        if binary_path is None:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            project_dir = os.path.dirname(script_dir)
            binary_path = os.path.join(project_dir, "build", "ssr-server")

        if not os.path.exists(binary_path):
            raise FileNotFoundError(
                f"SSR server binary not found: {binary_path}\n"
                "Run ./setup-and-build.sh first"
            )

        self.binary_path = binary_path
        self.process = None

    def start(self):
        """Start the persistent SSR server process."""
        if self.process is not None:
            return  # Already started

        self.process = subprocess.Popen(
            [self.binary_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1  # Line buffered for immediate output
        )

    def render(self, data):
        """
        Render HTML from JSON data.

        Args:
            data: Dictionary or JSON-serializable object

        Returns:
            str: Rendered HTML

        Raises:
            RuntimeError: If server process dies or returns invalid response
        """
        if self.process is None:
            self.start()

        # Send JSON to server
        json_str = json.dumps(data) if isinstance(data, dict) else data
        self.process.stdin.write(json_str + '\n')
        self.process.stdin.flush()

        # Read HTML response
        html = self.process.stdout.readline().strip()

        if not html:
            stderr = self.process.stderr.read()
            raise RuntimeError(f"SSR server died: {stderr}")

        return html

    def close(self):
        """Shut down the SSR server process."""
        if self.process is not None:
            try:
                self.process.stdin.close()
                self.process.wait(timeout=1)
            except:
                self.process.kill()
            finally:
                self.process = None

    def __enter__(self):
        """Context manager entry."""
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()


# Example usage
if __name__ == "__main__":
    print("=== Static Hermes SSR: Persistent Server Example ===\n")

    # Example requests - testing multiple routes
    requests = [
        {"route": "/", "counter": 1},
        {"route": "/about", "user": "Alice"},
        {"route": "/blog"},
        {"route": "/", "counter": 99},
    ]

    # Use context manager for automatic cleanup
    try:
        with SSRServer() as ssr:
            print("Server started. Sending requests...\n")

            for i, data in enumerate(requests, 1):
                print(f"Request {i}: {json.dumps(data)}")

                # Just call render() - no subprocess details needed!
                html = ssr.render(data)

                # Print first 100 chars of HTML
                print(f"Response: {html[:100]}...")
                print()

            print("Closing server...")

        print("Done!")

    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
