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
PY    := public/serve.py design/gallery.py platonic/skirts.py platonic/mesh.py platonic/gsd.py platonic/gi.py
HTML  := public/index.html

OPENSCAD := $(shell command -v openscad || echo /Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD)
SCAD_DIR := platonic
SCAD     := $(SCAD_DIR)/platonic.scad
PARTS    := tip tipmin tip5 tip4 cross cross8 crossthru test
KEPLER   := $(SCAD_DIR)/kepler.scad
GSD      := gsd_tip gsd_hub
DODECA   := $(SCAD_DIR)/dodeca.scad
DODECA_P := dodeca_vertex
SSD      := $(SCAD_DIR)/ssd.scad
SSD_P    := ssd_tip ssd_hub
ICOSA    := $(SCAD_DIR)/icosa.scad
ICOSA_P  := icosa_vertex
GD       := $(SCAD_DIR)/gd.scad
GD_P     := gd_hub
OCTA     := $(SCAD_DIR)/octa.scad
CUBE     := $(SCAD_DIR)/cube.scad
TETRA    := $(SCAD_DIR)/tetra.scad
SPIN     := $(SCAD_DIR)/spinner.scad
SPIN_P   := spin_cup spin_cup_shell spin_stand spin_test
GI       := $(SCAD_DIR)/gi.scad
GI_P     := gi_tip gi_hub gi_corner gi_model
STLS     := $(PARTS:%=$(SCAD_DIR)/%.stl) $(GSD:%=$(SCAD_DIR)/%.stl) \
            $(DODECA_P:%=$(SCAD_DIR)/%.stl) $(SSD_P:%=$(SCAD_DIR)/%.stl) \
            $(ICOSA_P:%=$(SCAD_DIR)/%.stl) $(GD_P:%=$(SCAD_DIR)/%.stl) \
            $(GI_P:%=$(SCAD_DIR)/%.stl) \
            $(SCAD_DIR)/octa_vertex.stl $(SCAD_DIR)/cube_vertex.stl \
            $(SCAD_DIR)/tetra_vertex.stl $(SPIN_P:%=$(SCAD_DIR)/%.stl) \
            $(SCAD_DIR)/tree.stl

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

# The dodecahedron vertex likewise comes from its own .scad.
$(DODECA_P:%=$(SCAD_DIR)/%.stl): $(SCAD_DIR)/%.stl: $(DODECA)
	$(OPENSCAD) -o $@ -D 'part="$*"' $<

# So does the small stellated dodecahedron.
$(SSD_P:%=$(SCAD_DIR)/%.stl): $(SCAD_DIR)/%.stl: $(SSD)
	$(OPENSCAD) -o $@ -D 'part="$*"' $<

# And the icosahedron vertex.
$(ICOSA_P:%=$(SCAD_DIR)/%.stl): $(SCAD_DIR)/%.stl: $(ICOSA)
	$(OPENSCAD) -o $@ -D 'part="$*"' $<

# And the great dodecahedron hub. Its dimple part is dodeca_vertex.
$(GD_P:%=$(SCAD_DIR)/%.stl): $(SCAD_DIR)/%.stl: $(GD)
	$(OPENSCAD) -o $@ -D 'part="$*"' $<

# The octahedron and cube vertices share vertex.scad.
$(SCAD_DIR)/octa_vertex.stl: $(OCTA) $(SCAD_DIR)/vertex.scad $(SCAD_DIR)/yarn.scad
	$(OPENSCAD) -o $@ $<

$(SCAD_DIR)/cube_vertex.stl: $(CUBE) $(SCAD_DIR)/vertex.scad $(SCAD_DIR)/yarn.scad
	$(OPENSCAD) -o $@ $<

$(SCAD_DIR)/tetra_vertex.stl: $(TETRA) $(SCAD_DIR)/vertex.scad
	$(OPENSCAD) -o $@ $<

# The spinner for the small octangula.
$(SPIN_P:%=$(SCAD_DIR)/%.stl): $(SCAD_DIR)/%.stl: $(SPIN)
	$(OPENSCAD) -o $@ -D 'part="$*"' $<

# The great icosahedron reads its geometry from gi_geom.scad, which gi.py
# writes.
$(GI_P:%=$(SCAD_DIR)/%.stl): $(SCAD_DIR)/%.stl: $(GI) $(SCAD_DIR)/gi_geom.scad
	$(OPENSCAD) -o $@ -D 'part="$*"' $<

$(SCAD_DIR)/gi_geom.scad: $(SCAD_DIR)/gi.py
	python3 $(SCAD_DIR)/gi.py

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
