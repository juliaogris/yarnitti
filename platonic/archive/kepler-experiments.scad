// Kepler: connectors for the two stellated dodecahedra.
//
// Both stars are one construction. A pentagram chord crosses two other chords
// of its own face, and those two crossings sit exactly on vertices of the
// core solid. So an edge is a single straight skewer running point to point,
// passing through two core vertices on the way, and each star is thirty equal
// skewers held by two connectors:
//
//   ssd_tip   x12  five skewer ends at a point of the small stellated dodecahedron
//   ssd_cross x20  three skewers passing through a dodecahedron vertex
//   gsd_tip   x20  three skewer ends at a point of the great stellated dodecahedron
//   gsd_cross x12  five skewers passing through an icosahedron vertex
//
// A skewer end stops tip_gap short of the star point it serves, so a skewer
// of length L carries an edge of L + 2 * tip_gap and a core edge of that over
// 4.236. Thirty blunt 30 cm skewers give a small stellated dodecahedron 39 cm
// across and a great one 35 cm, on a core edge of 78 mm. A skewer meets its
// two crossings 111 mm from either end.
//
// Skewers with one pointed end cannot be sorted so that every point lands in
// the same kind of socket: that would need the edge graph to be bipartite, and
// a pentagram face is a five cycle. Cut the points off and use the blunt
// length.
//
// Either tip holds its arms 36 degrees apart, the point angle of a pentagram,
// whichever star it belongs to. The two differ only in how many arms there are
// and how far each leans off the axis.
//
// Render one part at a time, and a crossing in either weave:
//   openscad -o ssd_tip.stl   -D 'part="ssd_tip"'   kepler.scad
//   openscad -o gsd_tip.stl   -D 'part="gsd_tip"'   kepler.scad
//   openscad -o ssd_cross.stl -D 'part="ssd_cross"' -D 'weave="stack"' kepler.scad

part  = "ssd_tip";  // [ssd_tip, ssd_cross, gsd_tip, gsd_cross, gsd_hub, splice]
weave = "pinwheel"; // [pinwheel, stack] - how a crossing separates its skewers

// --- skewer and fit -------------------------------------------------------

bore_d   = 4.1;   // socket bore, mm; take from the test bar in platonic.scad
wall     = 1.8;   // wall around a bore, mm
web      = 1.0;   // material between two bores in a tip, mm
thru_web = 1.6;   // material between two bores at a crossing, mm

socket   = 14;    // how far a skewer end sits in a tip, mm
thru_len = 24;    // length of a tube at a crossing, mm
fin_t    = 2.0;   // thickness of the gussets under the upward arms, mm
pent_r   = 14;    // corner radius of the pentagon joining the gusset feet, mm
pent_t   = 1.2;   // thickness of that pentagon, mm

// --- resolution -----------------------------------------------------------

$fn = 48;

// -------------------------------------------------------------------------

phi   = (1 + sqrt(5)) / 2;
outer = bore_d + 2 * wall;

// Adjacent arms of either tip stand 36 degrees apart, so two bores only clear
// each other this far out along an arm.
tip_gap = (bore_d + web) / tan(18);

// At a core vertex of the all-edges build the closest pair of arms stands 60
// degrees apart, so its bores clear each other sooner than a tip's do.
hub_gap = (bore_d + web) / tan(30);

// The apex of a pyramid sits over the centre of a core face. tan of the angle
// an arm makes with the tip axis is the face circumradius over the apex
// height, which comes out at 1/phi for the small star and 1/phi^2 for the
// great one.
ssd_tilt = atan(1 / phi);
gsd_tilt = atan(1 / (phi * phi));

// A dodecahedron vertex and its three neighbours, an icosahedron vertex and
// its five. The edge directions out of the vertex are the skewer directions
// through the crossing.
dod_v  = [1, 1, 1];
dod_nb = [[0, 1 / phi, phi], [1 / phi, phi, 0], [phi, 0, 1 / phi]];
ico_v  = [0, 1, phi];
ico_nb = [[0, -1, phi], [1, phi, 0], [-1, phi, 0], [phi, 0, 1], [-phi, 0, 1]];

function unit(v) = v / norm(v);

// An orthonormal frame with r on +z, so a crossing can be built with the
// outward radial of its vertex pointing up.
function basis(r) = let(a = abs(r[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0],
                        x = unit(cross(a, r)))
                    [x, cross(r, x), r];

function to_local(b, v) = [v * b[0], v * b[1], v * b[2]];

// Rotate a child so its +z axis lies along v.
module along(v) {
    rotate([0, acos(v[2] / norm(v)), atan2(v[1], v[0])]) children();
}

// A star point: n arms leaving the apex at tilt off the axis, equally spaced
// in azimuth. The apex is at the top and the arms run down and out to one
// horizontal cut, so the part stands on the arm ends with every bore opening
// into the bed.
module star_tip(n, tilt) {
    reach = tip_gap + socket;
    over  = outer;   // run arms and bores past the cut plane
    dirs  = [for (i = [0 : n - 1])
               [sin(tilt) * cos(360 * i / n), sin(tilt) * sin(360 * i / n), -cos(tilt)]];
    base_z = -reach * cos(tilt);
    difference() {
        union() {
            sphere(d = outer);
            for (d = dirs) along(d) cylinder(d = outer, h = reach + over);
        }
        for (d = dirs) along(d)
            translate([0, 0, tip_gap]) cylinder(d = bore_d, h = socket + over);
        translate([0, 0, base_z - 50]) cube(100, center = true);
    }
}

// The angle a core edge makes with the outward radial of its vertex. Every
// edge at the vertex makes the same angle and they are spaced evenly around
// the radial, so the crossing is built from the angle and a count.
ssd_pol = acos(unit(dod_nb[0] - dod_v) * unit(dod_v));
gsd_pol = acos(unit(ico_nb[0] - ico_v) * unit(ico_v));

// A core vertex, with the outward radial on +z. Every skewer runs along one
// of the core edges leaving the vertex, pushed off the vertex far enough that
// no two bores meet. Two ways to push:
//
//   pinwheel  each skewer goes sideways by the same distance, all turning the
//             same way. The vertex stays symmetric and no skewer is further
//             off true than any other.
//   stack     the skewers sit one above another along the radial. Simpler to
//             picture, but the offsets run from zero to (n-1) steps, so the
//             outermost skewer is pushed several times as far off true.
//
// delta is the smallest step that still leaves thru_web of material between
// the closest pair of bores. It is solved from the pair separations, so it is
// right for either weave and for any bore.
//
// The body is the convex hull of a disc on the bed and the tubes. A convex
// solid whose widest part is on the bed has every layer smaller than the one
// below, so it prints without an overhang anywhere.
module star_cross(n, pol) {
    dirs = [for (i = [0 : n - 1])
              [sin(pol) * cos(360 * i / n), sin(pol) * sin(360 * i / n), cos(pol)]];
    offs = weave == "stack"
             ? [for (i = [0 : n - 1]) [0, 0, i - (n - 1) / 2]]
             : [for (d = dirs) unit(cross([0, 0, 1], d))];
    last = n - 1;
    seps = [for (i = [0 : last - 1]) for (j = [i + 1 : last])
              let(c = cross(dirs[i], dirs[j]))
              abs((offs[j] - offs[i]) * c) / norm(c)];
    delta = (bore_d + thru_web) / min(seps);
    low  = min([for (i = [0 : last])
                  delta * offs[i][2] - thru_len / 2 * abs(dirs[i][2]) - outer / 2]);
    rad  = max([for (i = [0 : last])
                  thru_len / 2 * sqrt(1 - dirs[i][2] * dirs[i][2])
                  + delta * norm([offs[i][0], offs[i][1]]) + outer / 2]);
    echo(weave = weave, arms = n, delta = delta, height = -low, radius = rad);
    difference() {
        hull() {
            translate([0, 0, low]) cylinder(r = rad, h = 0.6);
            for (i = [0 : last]) translate(delta * offs[i]) along(dirs[i])
                cylinder(d = outer, h = thru_len, center = true);
        }
        for (i = [0 : last]) translate(delta * offs[i]) along(dirs[i])
            cylinder(d = bore_d, h = 6 * rad + thru_len, center = true);
    }
}

// A sleeve joining two skewers end to end, so one edge can be two skewers
// instead of one. The join lands in the middle third of the edge, between the
// two crossings, with room to spare at either side.
module splice() {
    difference() {
        rotate([0, 90, 0]) cylinder(d = outer, h = 2 * socket + web, center = true);
        for (m = [0, 1]) mirror([m, 0, 0])
            translate([web / 2, 0, 0]) rotate([0, 90, 0])
                cylinder(d = bore_d, h = socket + 1);
        // Flat base for printing.
        translate([0, 0, -outer / 2 - 50 + 0.6]) cube(100, center = true);
    }
}

// The core vertex of a great stellated dodecahedron built with every edge as
// its own strut. Ten arms meet here: five icosahedron edges running down and
// out, and five ridges running up and out to the five star points around the
// vertex. Both rings lean atan(1/phi) off the plane through the vertex, one
// below and one above, and the rings are 36 degrees apart in azimuth, so the
// part is two interleaved fives rather than anything flat. No two arms come
// closer than 60 degrees, the same angle a tip already holds.
//
// It stands on the ends of the five downward arms. Those arms lean only 32
// degrees below the horizontal, so a cut through their end centres would slice
// them lengthwise into feather edges. Each arm keeps a square end instead, and
// one shallow cut puts a small flat on the five that touch the bed. The five
// upward arms overhang at 58 degrees from vertical, so each one sits on a
// gusset down to the bed.
module gsd_hub() {
    lean  = atan(1 / phi);
    reach = hub_gap + socket;
    dirs  = concat(
        [for (i = [0 : 4]) let(a = 18 + 72 * i)
           [cos(lean) * cos(a), cos(lean) * sin(a), -sin(lean)]],
        [for (i = [0 : 4]) let(a = 54 + 72 * i)
           [cos(lean) * cos(a), cos(lean) * sin(a), sin(lean)]]);
    low = -reach * sin(lean) - outer / 2 * cos(lean);
    difference() {
        union() {
            sphere(d = outer);
            for (d = dirs) along(d) cylinder(d = outer, h = reach);
            // Gussets, one vertical web under each upward arm, running the
            // full length of the arm and flat on the bed. They stay in the
            // finished part: they brace the arm roots, carry the arms while
            // printing, and add five strips of bed contact. They sit inside
            // the star behind each ridge, so the crochet never meets them.
            for (i = [0 : 4]) let(a = 54 + 72 * i)
                intersection() {
                    hull() {
                        along(dirs[i + 5]) cylinder(d = outer, h = reach);
                        translate([0, 0, low]) linear_extrude(0.01)
                            projection() along(dirs[i + 5])
                                cylinder(d = outer, h = reach);
                    }
                    rotate([0, 0, a])
                        translate([0, -fin_t / 2, low]) cube([reach + outer, fin_t, 2 * reach]);
                }
            // A thin pentagon on the bed joining the five gusset feet. Its
            // corners lie on the gussets and its flat sides face the downward
            // arms, which keeps it clear of those arms and their struts.
            translate([0, 0, low + 0.6]) rotate([0, 0, 54])
                cylinder(r = pent_r, h = pent_t, $fn = 5);
        }
        for (d = dirs) along(d)
            translate([0, 0, hub_gap]) cylinder(d = bore_d, h = socket + 1);
        translate([0, 0, low + 0.6 - 50]) cube(100, center = true);
    }
}

if (part == "gsd_hub")   gsd_hub();
if (part == "splice")    splice();
if (part == "ssd_tip")   star_tip(5, ssd_tilt);
if (part == "gsd_tip")   star_tip(3, gsd_tilt);
if (part == "ssd_cross") star_cross(3, ssd_pol);
if (part == "gsd_cross") star_cross(5, gsd_pol);
