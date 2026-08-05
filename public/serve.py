#!/usr/bin/env python3
"""Local dev server for the single-page app.

Serves the files in this directory and falls back to index.html for the SPA
routes (and any unknown path), without a trailing-slash redirect, so the
browser stays on e.g. /spin and the page's relative assets still resolve to
the root. That keeps the client-side router's base detection correct, which
is why plain `python -m http.server` (or symlinked folders) does not work for
reloading a deep route.

The server also backs the gallery picker at /_curate.html, which only works
locally: it lists and serves the source photos from ../design/photos, and it
reads and writes ../design/gallery.txt, regenerating the gallery via
../design/gallery.py on save. The picker is optional; every picker route is
inside a "gallery picker" block below and answers only while _curate.html
exists, so deleting that file retires the tool and the blocks can then be
removed here.

Run:  python3 serve.py   then open http://localhost:8765/
"""

import http.server
import io
import json
import os
import socketserver
import subprocess
import sys

PORT = 8765
# Keep in sync with ROUTES in main.js and the fan-out loop in
# .github/workflows/pages.yml.
ROUTES = {"apricity", "about", "spin", "gallery", "contact"}

DESIGN = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "design")
PHOTOS_DIR = os.path.join(DESIGN, "photos")
MANIFEST = os.path.join(DESIGN, "gallery.txt")
GALLERY_PY = os.path.join(DESIGN, "gallery.py")
IMAGE_EXTS = (".jpg", ".jpeg", ".png")


class Handler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.path.split("?")[0].split("#")[0].strip("/")
        # ---- gallery picker (delete together with _curate.html) ----
        if path == "api/photos" and curate_enabled():
            return self.send_json(sorted(
                f for f in os.listdir(PHOTOS_DIR)
                if f.lower().endswith(IMAGE_EXTS)
                and os.path.isfile(os.path.join(PHOTOS_DIR, f))
            ))
        if path == "api/gallery" and curate_enabled():
            with open(MANIFEST, "rb") as f:
                body = f.read()
            return self.send_blob(body, "text/plain; charset=utf-8")
        if path.startswith("design-photos/") and curate_enabled():
            # Serve a source photo by bare filename only, so the URL cannot
            # step outside the photos directory.
            name = os.path.basename(path[len("design-photos/"):])
            local = os.path.join(PHOTOS_DIR, name)
            if name.lower().endswith(IMAGE_EXTS) and os.path.isfile(local):
                with open(local, "rb") as f:
                    body = f.read()
                return self.send_blob(body, "image/jpeg")
            self.send_error(404)
            return None
        # ---- end gallery picker ----
        local = self.translate_path(self.path)
        # Hand any route (or unknown path that is not a real file) to the app.
        if path in ROUTES or (path and not os.path.exists(local)):
            self.path = "/index.html"
        return super().send_head()

    # ---- gallery picker (delete together with _curate.html) ----
    def do_POST(self):
        path = self.path.split("?")[0].strip("/")
        if path != "api/gallery" or not curate_enabled():
            self.send_error(404)
            return
        # The body is the new gallery.txt, verbatim. Write it, then rebuild
        # the gallery images and index.html from it.
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8")
        with open(MANIFEST, "w") as f:
            f.write(body)
        res = subprocess.run(
            [sys.executable, GALLERY_PY],
            capture_output=True,
            text=True,
            check=False,
        )
        out = self.send_json({
            "ok": res.returncode == 0,
            "output": (res.stdout + res.stderr).strip(),
        })
        if out:
            self.copyfile(out, self.wfile)

    def send_json(self, data):
        return self.send_blob(
            json.dumps(data).encode("utf-8"), "application/json"
        )

    def send_blob(self, body, ctype):
        """Reply with an in-memory body, mirroring send_head's contract."""
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        return io.BytesIO(body)
    # ---- end gallery picker ----


def curate_enabled():
    """The picker APIs answer only while the picker page itself exists."""
    return os.path.exists(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "_curate.html")
    )


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    # Rebind the port straight after a restart instead of failing on the
    # previous socket's TIME_WAIT.
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"serving the SPA on http://localhost:{PORT}/")
        httpd.serve_forever()
