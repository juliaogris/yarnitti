// Platonic: connectors for a bamboo-skewer stella octangula.
//
// The star is two regular tetrahedra passing through each other. Each
// tetrahedron edge is one 27 cm skewer, twelve skewers in all. Every edge of
// one tetrahedron crosses an edge of the other at its midpoint, at a right
// angle. Two printed parts hold it together:
//
//   tip    x8  joins three skewer ends at a star point, 60 degrees apart
//   cross  x6  clips two crossing skewers at their midpoints
//   test   x1  a bar of sample bores, to find the bore that grips your skewers
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

cross_size = 16;   // footprint of the clip, mm
cross_wall = 1.6;  // bamboo-to-bamboo wall between the two channels, mm

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

module cross() {
    offset_z = (bore_d + cross_wall) / 2;
    height   = 2 * offset_z + bore_d + 2 * wall;
    difference() {
        // A rounded block.
        hull() for (x = [-1, 1], y = [-1, 1])
            translate([x * (cross_size / 2 - 2), y * (cross_size / 2 - 2), 0])
                cylinder(r = 2, h = height, center = true);
        // One channel along x above, one along y below.
        translate([0, 0,  offset_z]) rotate([0, 90, 0]) cylinder(d = bore_d, h = cross_size + 2, center = true);
        translate([0, 0, -offset_z]) rotate([90, 0, 0]) cylinder(d = bore_d, h = cross_size + 2, center = true);
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
