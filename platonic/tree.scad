// Platonic: sketch of the granny-square Christmas tree.
//
// Five cone skirts of crocheted squares set on point hang round a lamp post,
// each tied straight to the post at a strap and carrying a fibreglass ring in
// its scalloped hem. Each strap sits a little way up the skirt above, so the
// skirts overlap like shingles; the overlapped top of a skirt is drawn grey.
// Low-stretch cords run straight from every hem ring to its strap and hold
// the cone; between them the fabric droops.
// A great stellated dodecahedron sits on top, around the post.
//
// Units are millimetres. Every number comes from design/skirts.py; edit it
// there and rerun the script. The square counts print on every render.
//
//   openscad platonic/tree.scad
//   openscad -o tree.stl --export-format binstl -D 'detail=false' -D 'figure=false' platonic/tree.scad

use <gsd.scad>

detail = true;        // draw the individual squares (slow, pretty)
figure = true;        // stand a 1.7 m person beside the tree for scale
// How finely the fabric is sampled: steps up a skirt and steps round it. The
// surface is smooth, so this only sets how many facets the STL carries. The
// committed tree.stl is built coarse to keep the file small; raise both for a
// smoother picture.
fab_nt = 24;
fab_na = 144;

// --- tree ------------------------------------------------------------------

// Tree numbers come from design/skirts.py, which writes tree_params.scad:
// pole_h, post_d, squares, hoop_d, hoop_z, hem_d, hem_z, tier_squares,
// star_span, star_lift, hem_first, cord_phase, sag_t, sag_drop and fin.
// Edit them there and run the script.
include <tree_params.scad>
include <tree-body.scad>
