#!/usr/bin/env python3
"""Local dev server for the single-page app.

Serves the files in this directory and falls back to index.html for the SPA
routes (and any unknown path), without a trailing-slash redirect, so the
browser stays on e.g. /spin and the page's relative assets still resolve to
the root. That keeps the client-side router's base detection correct, which
is why plain `python -m http.server` (or symlinked folders) does not work for
reloading a deep route.

Run:  python3 serve.py   then open http://localhost:8765/
"""
import http.server
import os
import socketserver

PORT = 8765
ROUTES = {"apricity", "about", "spin", "hunt", "gallery"}


class Handler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.path.split("?")[0].split("#")[0].strip("/")
        local = self.translate_path(self.path)
        # Hand any route (or unknown path that is not a real file) to the app.
        if path in ROUTES or (path and not os.path.exists(local)):
            self.path = "/index.html"
        return super().send_head()


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"serving the SPA on http://localhost:{PORT}/")
        httpd.serve_forever()
