#!/usr/bin/env python3
"""
serve.py — Run the Cafe Milano app locally to preview it before deploying.

Usage:
    python3 serve.py [port]

Then open the printed URL in your browser. Default port is 8000.

Notes:
- Service workers and "Add to Home Screen" normally require HTTPS, but
  browsers make an exception for localhost, so this works fine for local
  testing. It will NOT work for "Add to Home Screen" testing on a phone
  unless you tunnel it over HTTPS (e.g. with ngrok) or deploy it for real
  (see README.md).
- Ctrl+C to stop the server.
"""

import http.server
import socketserver
import sys
import webbrowser
from pathlib import Path

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
DIRECTORY = Path(__file__).parent

# Make sure .webmanifest is served with the right MIME type
EXTRA_MIME_TYPES = {
    ".webmanifest": "application/manifest+json",
    ".js": "application/javascript",
}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

    def guess_type(self, path):
        ext = Path(path).suffix
        if ext in EXTRA_MIME_TYPES:
            return EXTRA_MIME_TYPES[ext]
        return super().guess_type(path)

    def end_headers(self):
        # Disable caching during local testing so edits show up immediately
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()


def main():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/index.html"
        print(f"Serving Cafe Milano app at {url}")
        print("Press Ctrl+C to stop.\n")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
