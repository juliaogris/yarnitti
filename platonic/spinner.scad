// Spinner: a stand that lets the small stella octangula spin on one point.
//
// The star is the hand-sized one from platonic.scad: 4 mm bamboo stakes
// glued into eight tip4 points. A 608 skateboard bearing, 8 mm bore, 22 mm
// outside and 7 mm wide, sits in the stand. The cup is glued into the
// bearing's inner ring, and one point of the star pushes into the cup and
// lifts out again. The cup and the star then turn together on the bearing.
//
//   spin_cup        x1  a peg for the bearing bore under a socket for one
//                       tip4, shaped like the point: a ball and three tubes
//   spin_cup_shell  x1  the same cup with a pyramid socket that wraps the
//                       whole point, glue and all, and a lip at each corner
//                       that clicks over the top of the point
//   spin_stand      x1  a base with a pocket for the bearing's outer ring
//   spin_test       x1  a short peg and a pocket ring, to check both press fits
//
// Two points of the star sit on the axis, one in the cup and one straight
// above it, so the star turns balanced.
//
// Render one part at a time:
//   openscad -o spin_cup.stl -D 'part="spin_cup"' spinner.scad
//   openscad -o spin_cup_shell.stl -D 'part="spin_cup_shell"' spinner.scad
//   openscad -o spin_stand.stl -D 'part="spin_stand"' spinner.scad
//   openscad -o spin_test.stl -D 'part="spin_test"' spinner.scad

part = "spin_cup"; // [spin_cup, spin_cup_shell, spin_stand, spin_test]

// --- bearing --------------------------------------------------------------

brg_bore  = 8;      // inner ring bore, mm
brg_od    = 22;     // outer ring diameter, mm
brg_w     = 7;      // bearing width, mm
brg_in_od = 11.5;   // the cup touches the inner ring only inside this, mm
brg_out_id = 18.5;  // the stand touches the outer ring only outside this, mm

// --- fit ------------------------------------------------------------------

peg_d    = 7.95;    // peg for the 8 mm bore; a press fit, mm
pocket_d = 22.1;    // pocket for the 22 mm outer ring; a press fit, mm
tip_gap  = 0.2;     // clearance round the star point in the cup, mm

// --- star point, matching tip4 in platonic.scad ----------------------------

tip_bore  = 4.1;    // stake bore of tip4, mm
tip_wall  = 1.5;    // wall of tip4, mm
tip_reach = 15.1;   // star point to the end of a tip4 arm, mm

// --- cup and stand --------------------------------------------------------

collar_h = 1.5;     // lifts the cup clear of the bearing's outer ring, mm
cup_d    = 30;      // cup diameter, mm
grip     = 10;      // how far up the arms the cup holds the point, mm
lip      = 0.3;     // how far each lip of the shell cup reaches over the
                    // top of the point, mm
lip_h    = 1.0;     // height of the lead-in above each lip, mm
shell_d  = 32;      // diameter of the shell cup, mm
floor_t  = 2.0;     // cup material under the point, mm
stand_d  = 60;      // stand diameter, mm
stand_t  = 3;       // stand material under the bearing, mm

$fn = 64;

// -------------------------------------------------------------------------

tip_outer = tip_bore + 2 * tip_wall;

// A tetrahedron edge leaves its point atan(1/sqrt(2)), 35.26 degrees, off the
// point's axis, 120 degrees apart in azimuth. In the cup the point faces down,
// so the arms run up and out.
tilt = atan(1 / sqrt(2));
function arm_dir(i) = [sin(tilt) * cos(120 * i), sin(tilt) * sin(120 * i), cos(tilt)];

module along(v) {
    rotate([0, acos(v[2] / norm(v)), atan2(v[1], v[0])]) children();
}

// The socket for one star point, with its point at the origin and its arms
// running up past the top of the cup. By default it is the outside of tip4,
// grown by tip_gap: a ball and three tubes. With shell it is the hull of that
// shape, a three-sided pyramid that wraps the whole point, for a point already
// glued to its stakes, glue and all. Neither is round, so the point cannot
// turn in it.
module point_socket(shell = false) {
    d = tip_outer + 2 * tip_gap;
    module parts() {
        sphere(d = d);
        for (i = [0 : 2]) along(arm_dir(i)) cylinder(d = d, h = 2 * tip_reach);
    }
    if (shell) hull() parts(); else parts();
}

// The top face of tip4 is a flat cut across all three arms, tip_top above
// the point. At that height the outermost edge of an arm is tip_r out from
// the axis.
tip_top = tip_reach * cos(tilt);
tip_r   = tip_top * tan(tilt) + tip_outer / 2 / cos(tilt);

// How high the socket runs above the point, and the cup height under it.
function grip_of(shell) = shell ? tip_top + lip_h : grip;
function cup_h_of(shell) = grip_of(shell) + tip_outer / 2 + tip_gap + floor_t;
cup_h = cup_h_of(false);

// The cup as it stands on the bearing: the peg runs down through the bearing
// bore, a collar sits on the inner ring, and the cup body sits above the
// collar, clear of the outer ring. The star point sits grip below the top of
// the cup body.
//
// The shell cup comes up to the top face of the point. A ring round the axis
// at that height cuts the three outermost corners of the socket back to lip
// inside the point's outer edges, which leaves a small lip at each corner
// that holds the point down. Above each lip a lead-in widens over lip_h, so
// the point pushes past it.
module cup_upright(shell = false) {
    h = cup_h_of(shell);
    g = grip_of(shell);
    difference() {
        union() {
            translate([0, 0, -collar_h - brg_w]) {
                cylinder(d = peg_d, h = brg_w - 0.6);
                // A chamfer on the peg end leads it into the bore.
                translate([0, 0, -0.6]) cylinder(d1 = peg_d - 1.2, d2 = peg_d, h = 0.6);
            }
            translate([0, 0, -collar_h - 0.6]) cylinder(d = brg_in_od, h = collar_h + 0.6);
            cylinder(d = shell ? shell_d : cup_d, h = h);
        }
        translate([0, 0, h - g]) difference() {
            point_socket(shell);
            if (shell) translate([0, 0, tip_top]) difference() {
                cylinder(r = 2 * tip_r, h = lip_h + 1);
                translate([0, 0, -0.01])
                    cylinder(r1 = tip_r - lip, r2 = tip_r + tip_gap, h = lip_h + 0.02);
                translate([0, 0, lip_h]) cylinder(r = 2 * tip_r, h = 2);
            }
        }
    }
}

// Printed upside down: the cup's open top on the bed and the peg straight up,
// so the peg prints round.
module spin_cup(shell = false) {
    translate([0, 0, cup_h_of(shell)]) rotate([180, 0, 0]) cup_upright(shell);
}

// The stand: a disc with the bearing pocket in the top. A hole under the
// pocket leaves only a ledge under the outer ring, so the inner ring and the
// peg turn free.
module spin_stand() {
    h = stand_t + brg_w;
    difference() {
        cylinder(d = stand_d, h = h);
        translate([0, 0, stand_t]) cylinder(d = pocket_d, h = brg_w + 1);
        translate([0, 0, -1]) cylinder(d = brg_out_id, h = h + 2);
        // A small chamfer at the pocket mouth leads the bearing in.
        translate([0, 0, h - 0.6]) cylinder(d1 = pocket_d, d2 = pocket_d + 1.2, h = 0.61);
    }
}

// A 4 mm slice of each fit: a peg on a disc, and a ring with the pocket.
module spin_test() {
    cylinder(d = 14, h = 1.5);
    translate([0, 0, 1.5]) cylinder(d = peg_d, h = 4);
    translate([30, 0, 0]) difference() {
        cylinder(d = pocket_d + 6, h = 4);
        translate([0, 0, -1]) cylinder(d = pocket_d, h = 6);
    }
}

if (part == "spin_cup")       spin_cup();
if (part == "spin_cup_shell") spin_cup(shell = true);
if (part == "spin_stand")     spin_stand();
if (part == "spin_test")      spin_test();
