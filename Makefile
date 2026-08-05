# Quality gate for the yarnitti static site.
#
# `make lint` is what the pre-push hook runs and what blocks a push. It only
# reports problems; it never rewrites files. `make fmt` is opt-in: it applies
# the formatters, which reformat heavily (Biome and Prettier expand the compact
# single-line CSS rules and rewrap the JS), so it is kept out of the gate.
#
# Tools are fetched on demand: Biome via npx, Ruff via uvx. actionlint and
# prettier are expected on PATH. Enable the hook once with `make hooks`.

BIOME := npx --yes @biomejs/biome@2.4.16
RUFF  := uvx ruff
JS    := public/main.js
CSS   := public/style.css
PY    := public/serve.py design/gallery.py
HTML  := public/index.html

.PHONY: lint fmt hooks gallery

# Block a push on any lint or workflow error.
lint:
	$(BIOME) lint $(JS) $(CSS)
	$(RUFF) check $(PY)
	actionlint

# Opt-in formatting. Reformats files; review the diff before committing.
fmt:
	$(BIOME) format --write $(JS) $(CSS)
	$(RUFF) format $(PY)
	prettier --write $(HTML) 'design/**/*.md'

# Rebuild the gallery images and page from design/gallery.txt.
gallery:
	python3 design/gallery.py

# Point git at the versioned hooks directory (run once per clone).
hooks:
	git config core.hooksPath .githooks
	@echo "pre-push hook enabled (.githooks/pre-push)"
