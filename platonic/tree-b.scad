// Plan B: the tree with four skirts, if the granny squares run short.
//
// Skirt 5 is left off and the whole tree comes down 1.23 m, so skirt 4's hem
// lands where skirt 5's was and the tree still stands on the ground. Every
// remaining skirt keeps its own geometry, so the flat patterns are unchanged.
// The numbers come from platonic/skirts.py:
//
//   python3 platonic/skirts.py b
//   openscad -o tree-b.stl --export-format binstl -D 'detail=false' -D 'figure=false' platonic/tree-b.scad

use <gsd.scad>

detail = true;        // draw the individual squares (slow, pretty)
figure = true;        // stand a 1.7 m person beside the tree for scale
fab_nt = 24;
fab_na = 144;

include <tree_params-b.scad>
include <tree-body.scad>
