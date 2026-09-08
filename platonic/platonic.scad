// Platonic: connectors for a bamboo-skewer stella octangula.
//
// The star is two regular tetrahedra passing through each other. Every edge
// of one tetrahedron crosses an edge of the other at its midpoint, at a right
// angle, in one plane. Each edge is therefore two skewers, point to cross to
// point, twenty-four skewers in all. Two printed parts hold it together:
//
//   tip    x8  joins three skewer ends at a star point, 60 degrees apart
//   cross  x6  joins four skewer ends in one plane, 90 degrees apart
//   test   x1  a bar of sample bores, to find the bore that grips your skewers
//
// With whole 27 cm skewers the star edge is about 56 cm and the star spans
// about 69 cm point to point. Cut the skewers in half for a 35 cm star.
//
// Render one part at a time:
//   openscad -o tip.stl   -D 'part="tip"'   platonic.scad
//   openscad -o cross.stl -D 'part="cross"' platonic.scad
//   openscad -o test.stl  -D 'part="test"'  platonic.scad
//
// Bamboo skewers sold as 4 mm run from about 3.6 to 4.4 mm. Print the test bar
// first, find the bore a skewer pushes into with firm finger pressure, and set
// bore_d to that before printing the tips and crosses.

part = "tip"; // [tip, cross, test]

// --- skewer and fit -------------------------------------------------------

skewer_d = 4.0;   // nominal skewer diameter, mm
bore_d   = 4.4;   // socket bore, mm; take from the test bar
wall     = 2.0;   // wall around a bore, mm

// --- tip ------------------------------------------------------------------

socket_depth = 15;   // how far a skewer end sits in the tip, mm
tip_gap      = 5.5;  // distance from the star point to the bottom of a bore,
                     // mm; keeps the three bores from running into each other
tip_flat     = 4;    // the point is cut flat here for a print base, mm

// --- cross ----------------------------------------------------------------

cross_gap = 5;  // distance from the hub centre to the bottom of a bore, mm;
                // keeps the four bores from running into each other

// --- resolution -----------------------------------------------------------

$fn = 48;

// -------------------------------------------------------------------------

// Edge directions leaving a tetrahedron vertex, with the vertex axis on +z.
// Each is atan(1/sqrt(2)), about 35.26 degrees, off the axis, 120 degrees
// apart in azimuth. The angle between any two is 60 degrees.
tilt = atan(1 / sqrt(2));

function edge_dir(i) = [sin(tilt) * cos(120 * i), sin(tilt) * sin(120 * i), cos(tilt)];

// Rotate a child so its +z axis lies along v.
module along(v) {
    rotate([0, acos(v[2] / norm(v)), atan2(v[1], v[0])]) children();
}

module tip() {
    outer_d = bore_d + 2 * wall;
    reach   = tip_gap + socket_depth;
    difference() {
        hull() {
            sphere(d = outer_d);
            for (i = [0 : 2]) along(edge_dir(i)) cylinder(d = outer_d, h = reach);
        }
        for (i = [0 : 2]) along(edge_dir(i))
            translate([0, 0, tip_gap]) cylinder(d = bore_d, h = socket_depth + 1);
        // Flat base at the star point.
        translate([0, 0, -tip_flat - 50]) cube(100, center = true);
    }
}

// Four arms in the xy plane. Printed flat, so the bores run horizontally; the
// flat face at z = 0 is the print base.
module cross() {
    outer_d = bore_d + 2 * wall;
    reach   = cross_gap + socket_depth;
    difference() {
        union() {
            sphere(d = outer_d);
            for (a = [0 : 90 : 270]) rotate([0, 90, a]) cylinder(d = outer_d, h = reach);
        }
        for (a = [0 : 90 : 270]) rotate([0, 90, a])
            translate([0, 0, cross_gap]) cylinder(d = bore_d, h = socket_depth + 1);
        // Flat base for printing.
        translate([0, 0, -outer_d / 2 - 50 + 0.6]) cube(100, center = true);
    }
}

module test() {
    bores = [3.8, 4.0, 4.2, 4.4, 4.6, 4.8];
    pitch = 10;
    depth = 12;
    difference() {
        translate([-pitch / 2, -5, 0]) cube([pitch * len(bores), 10, depth]);
        for (i = [0 : len(bores) - 1])
            translate([i * pitch, 0, 2]) cylinder(d = bores[i], h = depth);
        // Bore size embossed into the side, so the bar reads after printing.
        for (i = [0 : len(bores) - 1])
            translate([i * pitch, -5.01, depth / 2]) rotate([90, 0, 0])
                mirror([0, 0, 1]) linear_extrude(0.6)
                    text(str(bores[i]), size = 3, halign = "center", valign = "center");
    }
}

if (part == "tip") tip();
if (part == "cross") cross();
if (part == "test") test();
