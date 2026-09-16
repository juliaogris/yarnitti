// Platonic: connectors for a bamboo-skewer stella octangula.
//
// The star is two regular tetrahedra passing through each other. Every edge
// of one tetrahedron crosses an edge of the other at its midpoint, at a right
// angle, in one plane. Each edge is therefore two skewers, point to cross to
// point, twenty-four skewers in all. Two printed parts hold it together:
//
//   tip    x8  joins three skewer ends at a star point, 60 degrees apart
//   cross  x6  joins four skewer ends in one plane, 90 degrees apart
//   cross8 x6  the cross with four more arms, for the inner octahedron
//   test   x1  a bar of sample bores, to find the bore that grips your skewers
//
// With whole 27 cm skewers the star edge is about 56 cm and the star spans
// about 69 cm point to point. Cut the skewers in half for a 35 cm star.
//
// Render one part at a time:
//   openscad -o tip.stl    -D 'part="tip"'    platonic.scad
//   openscad -o cross.stl  -D 'part="cross"'  platonic.scad
//   openscad -o cross8.stl -D 'part="cross8"' platonic.scad
//   openscad -o test.stl   -D 'part="test"'   platonic.scad
//
// Bamboo skewers sold as 4 mm run from about 3.6 to 4.4 mm. Print the test bar
// first, find the bore a skewer pushes into with firm finger pressure, and set
// bore_d to that before printing the tips and crosses.

part = "tip"; // [tip, tipmin, cross, cross8, crossthru, test]

// --- skewer and fit -------------------------------------------------------

skewer_d = 4.0;   // nominal skewer diameter, mm
bore_d   = 4.4;   // socket bore, mm; take from the test bar
wall     = 2.0;   // wall around a bore, mm

// --- tip ------------------------------------------------------------------

socket_depth = 15;   // how far a skewer end sits in the tip, mm
tip_gap      = 5.5;  // distance from the star point to the bottom of a bore,
                     // mm; keeps the three bores from running into each other

// --- minimal tip ---------------------------------------------------------
// For pointed skewers that taper to nothing over their last 20 mm or so.
// The bore is a matching cone, so the point wedges in along its length and
// the arms can be thin. bore_tip_d is the bore diameter at the apex end.

bore_tip_d    = 0.8;
min_bore_d    = 3.1;   // bore diameter at the mouth, mm
min_wall      = 1.6;   // wall around a bore, mm
min_socket    = 14;    // socket depth, mm
min_tip_gap   = 3;     // apex to bottom of a bore, mm

// --- cross ----------------------------------------------------------------

cross_gap = 5;  // distance from the hub centre to the bottom of a bore, mm;
                // keeps the four bores from running into each other

// --- inner octahedron -----------------------------------------------------
// The eight-way cross carries four more arms, for the twelve struts of the
// inner octahedron the eight pyramids stand on. An octahedron edge is exactly
// half a tetrahedron edge, so an inner strut spans the same centre-to-centre
// distance as the tip-to-cross strut beside it and takes a skewer of the same
// length. That holds only if the bore bottom in an inner arm sits at the mean
// of the two gaps the strut would otherwise meet, so octa_gap is derived
// rather than set. If the star is built with tipmin, override tip_gap with
// min_tip_gap on the command line.

octa_gap = (tip_gap + cross_gap) / 2;

// --- pass-through cross ---------------------------------------------------
// A star built from whole dowels runs one dowel the full length of each
// tetrahedron edge, so the dowel passes through the crossing instead of
// butting into it. The two dowels cannot occupy the same line, so one sits
// nearer the centre of the star than the other by thru_off. Every crossing
// puts the same tetrahedron on the outside, which keeps all six parts
// identical and leaves one tetrahedron a shade larger than the other.
//
// The four inner arms cannot leave the middle of the part, because the inner
// dowel is in the way. They leave a boss stacked beyond it, which pulls the
// octahedron in by thru_boss_z and shortens its edge to match. Render with
// -D 'octa_bore_d=6.1' for 6 mm inner struts.

thru_bore_d = 6.1;   // through bore for a 6 mm dowel, mm
thru_wall   = 2.0;   // wall around a through bore, mm
thru_web    = 1.6;   // material between the two through bores, mm
thru_len    = 30;    // length of a tube along its dowel, mm
thru_skirt  = 2.0;   // how far the square base runs past the tube ends, mm

octa_bore_d = 4.1;   // bore for an inner octahedron strut, mm
octa_wall   = 1.6;   // wall around an inner bore, mm
octa_socket = 20;    // socket depth for an inner strut, mm
octa_boss   = 5;     // boss centre to the bottom of an inner bore, mm

// Distance between the two through bores, and the height of the boss above
// the crossing. The boss clears the inner bore by 1.2 mm of material.
thru_off    = thru_bore_d + thru_web;
thru_boss_z = thru_off / 2 + thru_bore_d / 2 + octa_bore_d / 2 + 1.2;

// --- resolution -----------------------------------------------------------

$fn = 48;

// -------------------------------------------------------------------------

// Edge directions leaving a tetrahedron vertex, with the vertex axis on +z and
// the edges running down and out. Each is atan(1/sqrt(2)), about 35.26
// degrees, off the axis, 120 degrees apart in azimuth. The angle between any
// two is 60 degrees.
tilt = atan(1 / sqrt(2));

function edge_dir(i) = [sin(tilt) * cos(120 * i), sin(tilt) * sin(120 * i), -cos(tilt)];

// Rotate a child so its +z axis lies along v.
module along(v) {
    rotate([0, acos(v[2] / norm(v)), atan2(v[1], v[0])]) children();
}

// The star point is at the top. The three arms run down and are cut by one
// horizontal plane, so the part stands on a flat face with the bores opening
// downward into the bed. Along each bore the socket is socket_depth deep,
// measured from that face.
module tip() {
    outer_d = bore_d + 2 * wall;
    reach   = tip_gap + socket_depth;
    base_z  = -reach * cos(tilt);
    over    = outer_d;  // run arms and bores past the cut plane
    difference() {
        hull() {
            sphere(d = outer_d);
            for (i = [0 : 2]) along(edge_dir(i)) cylinder(d = outer_d, h = reach + over);
        }
        for (i = [0 : 2]) along(edge_dir(i))
            translate([0, 0, tip_gap]) cylinder(d = bore_d, h = socket_depth + over);
        // Flat base through the arm ends.
        translate([0, 0, base_z - 50]) cube(100, center = true);
    }
}

// Three thin arms meeting at a small sphere, no hull, so the part is as
// small as the bores allow. Same orientation and flat base as tip().
module tip_min() {
    outer_d = min_bore_d + 2 * min_wall;
    reach   = min_tip_gap + min_socket;
    base_z  = -reach * cos(tilt);
    over    = outer_d;
    difference() {
        union() {
            sphere(d = outer_d);
            for (i = [0 : 2]) along(edge_dir(i)) cylinder(d = outer_d, h = reach + over);
        }
        for (i = [0 : 2]) along(edge_dir(i))
            translate([0, 0, min_tip_gap])
                cylinder(d1 = bore_tip_d, d2 = min_bore_d, h = min_socket);
        for (i = [0 : 2]) along(edge_dir(i))
            translate([0, 0, min_tip_gap + min_socket - 0.01])
                cylinder(d = min_bore_d, h = over + 1);
        translate([0, 0, base_z - 50]) cube(100, center = true);
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

// The cross with four more arms, one per octahedron edge meeting this hub.
// In this frame the centre of the star lies on +z, so those four arms rise 45
// degrees out of the print bed, on the azimuths that bisect the coplanar
// arms. Each one sits 60 degrees from its neighbours, the angle the tip
// already holds, and 45 degrees is shallow enough to print without support.
module cross8() {
    outer_d    = bore_d + 2 * wall;
    reach      = cross_gap + socket_depth;
    octa_reach = octa_gap + socket_depth;
    difference() {
        union() {
            sphere(d = outer_d);
            for (a = [0 : 90 : 270]) rotate([0, 90, a]) cylinder(d = outer_d, h = reach);
            for (a = [45 : 90 : 315]) rotate([0, 0, a]) rotate([0, 45, 0])
                cylinder(d = outer_d, h = octa_reach);
        }
        for (a = [0 : 90 : 270]) rotate([0, 90, a])
            translate([0, 0, cross_gap]) cylinder(d = bore_d, h = socket_depth + 1);
        for (a = [45 : 90 : 315]) rotate([0, 0, a]) rotate([0, 45, 0])
            translate([0, 0, octa_gap]) cylinder(d = bore_d, h = socket_depth + 1);
        // Flat base for printing.
        translate([0, 0, -outer_d / 2 - 50 + 0.6]) cube(100, center = true);
    }
}

// The crossing for a star of whole dowels. The outer dowel runs along x at
// the bottom, the inner one along y above it, and the four arms for the
// inner octahedron leave a boss above both.
//
// The body is the convex hull of a square base, the two tubes and the boss,
// which makes a low pyramid. Every horizontal slice of a convex solid whose
// widest part is on the bed is smaller than the one below it, so the body
// prints without a single overhang, and it puts material where the dowels
// try to lever the part apart. Only the four arms overhang, at 45 degrees.
module cross_thru() {
    outer  = thru_bore_d + 2 * thru_wall;
    boss_d = octa_bore_d + 2 * octa_wall;
    za     = outer / 2;              // outer dowel axis, tube sitting on the bed
    zb     = za + thru_off;          // inner dowel axis
    zboss  = (za + zb) / 2 + thru_boss_z;
    half   = thru_len / 2 + thru_skirt;
    difference() {
        union() {
            hull() {
                linear_extrude(0.6) square(2 * half, center = true);
                translate([0, 0, za]) rotate([0, 90, 0])
                    cylinder(d = outer, h = thru_len, center = true);
                translate([0, 0, zb]) rotate([-90, 0, 0])
                    cylinder(d = outer, h = thru_len, center = true);
                translate([0, 0, zboss]) sphere(d = boss_d);
            }
            for (a = [45 : 90 : 315]) translate([0, 0, zboss])
                rotate([0, 0, a]) rotate([0, 45, 0])
                    cylinder(d = boss_d, h = octa_boss + octa_socket);
        }
        translate([0, 0, za]) rotate([0, 90, 0])
            cylinder(d = thru_bore_d, h = 2 * half + 2, center = true);
        translate([0, 0, zb]) rotate([-90, 0, 0])
            cylinder(d = thru_bore_d, h = 2 * half + 2, center = true);
        for (a = [45 : 90 : 315]) translate([0, 0, zboss])
            rotate([0, 0, a]) rotate([0, 45, 0])
                translate([0, 0, octa_boss])
                    cylinder(d = octa_bore_d, h = octa_socket + 1);
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
if (part == "tipmin") tip_min();
if (part == "cross") cross();
if (part == "cross8") cross8();
if (part == "crossthru") cross_thru();
if (part == "test") test();
