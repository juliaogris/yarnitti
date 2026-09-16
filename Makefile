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
PY    := public/serve.py design/gallery.py platonic/skirts.py platonic/mesh.py platonic/gsd.py
HTML  := public/index.html

OPENSCAD := $(shell command -v openscad || echo /Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD)
SCAD_DIR := platonic
SCAD     := $(SCAD_DIR)/platonic.scad
PARTS    := tip tipmin cross cross8 crossthru test
KEPLER   := $(SCAD_DIR)/kepler.scad
GSD      := gsd_tip gsd_hub
STLS     := $(PARTS:%=$(SCAD_DIR)/%.stl) $(GSD:%=$(SCAD_DIR)/%.stl) $(SCAD_DIR)/tree.stl

.PHONY: lint fmt hooks gallery stl

# Block a push on any lint or workflow error.
lint:
	$(BIOME) lint $(JS) $(CSS)
	$(RUFF) check $(PY)
	actionlint

# Opt-in formatting. Reformats files; review the diff before committing.
fmt:
	$(BIOME) format --write $(JS) $(CSS)
	$(RUFF) format $(PY)
	prettier --write $(HTML) 'design/**/*.md' '$(SCAD_DIR)/*.md'

# Rebuild the gallery images and page from design/gallery.txt.
gallery:
	python3 design/gallery.py

# Render the skewer connectors to STL, one file per part in the .scad.
stl: $(STLS)

$(SCAD_DIR)/%.stl: $(SCAD)
	$(OPENSCAD) -o $@ -D 'part="$*"' $<

# The great stellated dodecahedron parts come from their own .scad. This
# static pattern rule takes precedence over the pattern rule above.
$(GSD:%=$(SCAD_DIR)/%.stl): $(SCAD_DIR)/%.stl: $(KEPLER)
	$(OPENSCAD) -o $@ -D 'part="$*"' $<

# Point git at the versioned hooks directory (run once per clone).
hooks:
	git config core.hooksPath .githooks
	@echo "pre-push hook enabled (.githooks/pre-push)"

# The tree sketch renders without the individual squares, which are for the
# preview only and would take CGAL an age. Its numbers come from
# $(SCAD_DIR)/skirts.py, which also writes the flat patterns and the section.
# One run writes tree_params.scad, section.svg and skirt-1..5.svg together.
# Only the params file is named as a target, because the make shipped with
# macOS predates grouped targets; the drawings come with it.
$(SCAD_DIR)/tree_params.scad: $(SCAD_DIR)/skirts.py
	python3 $(SCAD_DIR)/skirts.py all

# Binary STL, and the fabric sampled coarsely: the surface is smooth either
# way, and this keeps the committed file to a few megabytes.
$(SCAD_DIR)/tree.stl: $(SCAD_DIR)/tree.scad $(SCAD_DIR)/tree-body.scad $(SCAD_DIR)/tree_params.scad $(SCAD_DIR)/gsd.scad
	$(OPENSCAD) -o $@ --export-format binstl -D 'detail=false' -D 'figure=false' $<

# The mesh sleeve sketch shares the tree's numbers.
$(SCAD_DIR)/drawings/mesh.svg: $(SCAD_DIR)/mesh.py $(SCAD_DIR)/skirts.py
	python3 $(SCAD_DIR)/mesh.py

# Plan B: four skirts, the whole tree lowered. Shares tree-body.scad, so the
# shape is described once.
# Writes tree_params-b.scad and section-b.svg together; see the note above.
$(SCAD_DIR)/tree_params-b.scad: $(SCAD_DIR)/skirts.py
	python3 $(SCAD_DIR)/skirts.py b

$(SCAD_DIR)/tree-b.stl: $(SCAD_DIR)/tree-b.scad $(SCAD_DIR)/tree-body.scad $(SCAD_DIR)/tree_params-b.scad $(SCAD_DIR)/gsd.scad
	$(OPENSCAD) -o $@ --export-format binstl -D 'detail=false' -D 'figure=false' $<

$(SCAD_DIR)/drawings/mesh-b.svg: $(SCAD_DIR)/mesh.py $(SCAD_DIR)/skirts.py
	python3 $(SCAD_DIR)/mesh.py b

.PHONY: tree-b
tree-b: $(SCAD_DIR)/tree-b.stl $(SCAD_DIR)/drawings/mesh-b.svg $(SCAD_DIR)/tree_params-b.scad

.PHONY: tree
tree: $(SCAD_DIR)/tree.stl $(SCAD_DIR)/drawings/mesh.svg $(SCAD_DIR)/tree_params.scad
