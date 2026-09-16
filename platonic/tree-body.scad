// Everything the tree model is, except which set of numbers it runs on.
//
// platonic/tree.scad includes tree_params.scad and then this file; tree-b.scad
// includes tree_params-b.scad and then this file. The two plans share every
// module, so the shape can only ever be described in one place.
post_h  = 6500;           // lamp post height to draw, mm
function diag(i) = squares[i] * sqrt(2);

palette = [
  [0.85, 0.20, 0.30], [0.95, 0.60, 0.15], [0.98, 0.85, 0.20],
  [0.20, 0.55, 0.85], [0.60, 0.30, 0.70], [0.95, 0.40, 0.65],
  [0.30, 0.75, 0.65], [0.95, 0.95, 0.90],
];
border = [0.10, 0.40, 0.20];

// --- geometry ---------------------------------------------------------------

// Where the skirt emerges from under the hem above, and its diameter there.
function vis_z(i)  = i == 0 ? hoop_z[0] : hem_z[i - 1];
function dia_at(i, z) = hem_d[i] + (hoop_d[i] - hem_d[i]) * (z - hem_z[i]) / (hoop_z[i] - hem_z[i]);
function vis_d(i)  = dia_at(i, vis_z(i));

function slant(i)  = norm([hem_d[i] / 2 - hoop_d[i] / 2, hoop_z[i] - hem_z[i]]);
function vslant(i) = norm([hem_d[i] / 2 - vis_d(i) / 2, vis_z(i) - hem_z[i]]);
function around(i) = floor(PI * hem_d[i] / diag(i));      // squares on the hem row, as design/skirts.py

// Flat pattern of a skirt: a ring sector with inner radius rf1 at the hoop
// and outer radius rf2 at the hem ring. Every row holds around(i) squares,
// and each row inward is exp(-half) closer to the centre, half being half the
// angular step of a square; that is what keeps the squares square on a cone.
function rf1(i)    = slant(i) * hoop_d[i] / (hem_d[i] - hoop_d[i]);
function rf2(i)    = rf1(i) + slant(i);
function half(i)   = PI * (hem_d[i] - hoop_d[i]) / slant(i) / around(i) / 2;
function rows(i)   = floor(ln(rf2(i) / rf1(i)) / half(i)) + 1;  // top row reaches past the hoop
function count(i)  = tier_squares[i];  // from design/skirts.py, merges included
function area(i)   = PI * (vis_d(i) + hem_d[i]) / 2 * vslant(i);
function total(n = len(hoop_d)) = n == 0 ? 0 : count(n - 1) + total(n - 1);
function area_total(n = len(hoop_d)) = n == 0 ? 0 : area(n - 1) + area_total(n - 1);
function hidden(i) = PI * (hoop_d[i] + vis_d(i)) / 2 * (slant(i) - vslant(i)) / 1e6;
function hidden_total(n = len(hoop_d)) = n == 0 ? 0 : hidden(n - 1) + hidden_total(n - 1);

for (i = [0 : len(hoop_d) - 1])
  echo(str("tier ", i + 1, ": strapped to the ", hoop_d[i], " mm post",
           ", hem ", hem_d[i], " mm, visible slant ", round(vslant(i)), " of ", round(slant(i)), " mm, ",
           around(i), " a row, ", rows(i), " rows, ", count(i), " squares"));
echo(str("total ", total(), " squares, ~", round(area_total() / 1e6 * 0.8), " kg 8-ply on the visible fabric; hidden ~",
         round(hidden_total() * 10) / 10, " m2"));
function ring_len(n = len(hem_d)) = n == 0 ? 0 : PI * hem_d[n - 1] + ring_len(n - 1);
echo(str("hem rings: ", [for (d = hem_d) round(PI * d) / 1000], " m each, ", round(ring_len()) / 1000, " m in all"));

// --- parts -----------------------------------------------------------------

module post() {
  color([0.35, 0.35, 0.38]) cylinder(h = post_h, d = post_d, $fn = 32);
}

module collar(z, h = 40) {
  color([0.1, 0.1, 0.1]) translate([0, 0, z - h / 2])
    difference() { cylinder(h = h, d = post_d + 16, $fn = 32); translate([0, 0, -1]) cylinder(h = h + 2, d = post_d, $fn = 32); }
}

// Every skirt is strapped straight to the post, so a strap is all there is.
module hoop(i) {
  collar(hoop_z[i]);
}

// --- fabric and cords -------------------------------------------------------
//
// t runs from 0 at the hem ring to 1 at the strap. The cords run straight up
// the cone from the ring to the strap at the angles in cord_phase[i]. The
// fabric is sewn to the hem ring, to the strap and to every cord, and between
// them it hangs in a curve through the panel's sag point: midway between two
// cords, sag_t of the way up, fallen sag_drop of the way from the cone down to
// the hem ring's own plane. So the fabric never hangs below its ring.
function cone_r(i, t) = hem_d[i] / 2 + t * (hoop_d[i] / 2 - hem_d[i] / 2);
function cone_z(i, t) = hem_z[i] + t * (hoop_z[i] - hem_z[i]);
function cyl(r, a, z) = [r * cos(a), r * sin(a), z];
function wrap(a) = ((a % 360) + 360) % 360;
function ss(x) = x * x * (3 - 2 * x);
// Across a panel: 0 on a cord, 1 midway to the next, whatever the spacing.
// The fabric folds over a cord rather than rounding off it, so this rises
// straight out of zero.
function bump(i, a) = let (cs = cord_phase[i], n = len(cs))
  max([for (k = [0 : n - 1]) let (w = n == 1 ? 360 : wrap(cs[(k + 1) % n] - cs[k]), f = wrap(a - cs[k]) / w)
       f < 1 ? pow(abs(sin(180 * f)), fin) : 0]);
// Up the skirt: 0 at the hem ring and at the strap, 1 at the sag point.
function along(t) = t <= sag_t ? ss(t / sag_t) : 1 - ss((t - sag_t) / (1 - sag_t));
function fall(i) = sag_drop * sag_t * (hoop_z[i] - hem_z[i]);
function drop(i, a, t) = fall(i) * along(t) * bump(i, a);
function fabric_z(i, a, t) = cone_z(i, t) - drop(i, a, t);

// The fabric between t0 and t1 as a closed shell th thick, faces clockwise
// seen from outside as polyhedron wants them.
module fabric(i, t0, t1, c, nt = fab_nt, na = fab_na, th = 6) {
  pts = [for (off = [0, th]) for (s = [0 : nt]) for (b = [0 : na - 1])
           let (a = b * 360 / na, t = t0 + (t1 - t0) * s / nt)
           cyl(cone_r(i, t) - off, a, fabric_z(i, a, t))];
  N = (nt + 1) * na;
  function o(s, b) = s * na + (b % na);
  function n(s, b) = N + o(s, b);
  faces = concat(
    [for (s = [0 : nt - 1], b = [0 : na - 1]) [o(s, b), o(s + 1, b), o(s + 1, b + 1), o(s, b + 1)]],
    [for (s = [0 : nt - 1], b = [0 : na - 1]) [n(s, b), n(s, b + 1), n(s + 1, b + 1), n(s + 1, b)]],
    [for (b = [0 : na - 1]) [o(0, b), o(0, b + 1), n(0, b + 1), n(0, b)]],
    [for (b = [0 : na - 1]) [o(nt, b), n(nt, b), n(nt, b + 1), o(nt, b + 1)]]);
  color(c) polyhedron(points = pts, faces = faces, convexity = 4);
}

// One cord as a rod straight up the cone from the ring to the strap.
module cord(i, k, d = 10) {
  p0 = cyl(cone_r(i, 0), cord_phase[i][k], cone_z(i, 0));
  p1 = cyl(cone_r(i, 1), cord_phase[i][k], cone_z(i, 1));
  color([0.1, 0.3, 0.7]) hull() { translate(p0) sphere(d = d, $fn = 8); translate(p1) sphere(d = d, $fn = 8); }
}

// The hem ring, a fibreglass rod on the big skirts and a metal craft hoop on
// the two small ones, flat either way.
module ring(i, d = 12) {
  color([0.15, 0.15, 0.15]) translate([0, 0, hem_z[i]])
    rotate_extrude($fn = 96) translate([hem_d[i] / 2, 0]) circle(d = d, $fn = 12);
}

module skirt(i) {
  ring(i);
  tv = (vis_z(i) - hem_z[i]) / (hoop_z[i] - hem_z[i]);  // where the skirt above covers it
  fabric(i, 0, tv, border);
  if (tv < 1) fabric(i, tv, 1, [0.55, 0.55, 0.5]);
  for (k = [0 : len(cord_phase[i]) - 1]) cord(i, k);
  if (detail) squares(i);
  hem(i);
}

// Squares on point, laid on the frustum surface row by row, each row a
// little smaller than the one below, as in the flat pattern.
module squares(i) {
  n = around(i);
  tilt = atan2(hem_d[i] / 2 - hoop_d[i] / 2, hoop_z[i] - hem_z[i]);
  for (row = [0 : rows(i) - 1], k = [0 : n - 1]) {
    rf = rf2(i) * exp(-row * half(i));            // flat radius of this row
    t = (rf2(i) - rf) / slant(i);                 // 0 at hem, 1 at hoop
    a = (k + (row % 2) / 2) * 360 / n;
    r = cone_r(i, t);
    z = fabric_z(i, a, t);
    side = rf * 2 * half(i) / sqrt(2);
    c = palette[(k * 7 + row * 3 + i) % len(palette)];
    color(c) rotate([0, 0, a]) translate([r + 4, 0, z])
      rotate([0, -tilt, 0]) rotate([45, 0, 0])
        cube([3, side * 0.9, side * 0.9], center = true);
  }
}

// The lower halves of the hem row's squares, hanging straight down from the
// hem ring. Each follows the ring's curve along its top edge and comes to a
// point below, so it is a triangle drawn on a vertical cylinder.
module hem(i) {
  n = around(i);
  r = hem_d[i] / 2;
  d = 2 * PI * r / n;                  // diagonal of a hem square, on the ring
  segs = 6;
  for (k = [0 : n - 1]) {
    a = (k + hem_first) * 360 / n;     // the tip; a cord comes down between two
    da = 360 / n / 2;                  // half the square's angular width
    c = palette[(k * 5 + i) % len(palette)];
    color(c) for (j = [0 : segs - 1]) {
      f0 = -1 + 2 * j / segs;
      f1 = -1 + 2 * (j + 1) / segs;
      hull() for (f = [f0, f1], zf = [0, 1]) {
        drop = zf * d / 2 * (1 - abs(f));
        rotate([0, 0, a + f * da]) translate([r, 0, hem_z[i] - drop]) cube([4, 0.5, 0.5], center = true);
      }
    }
  }
}

// Great stellated dodecahedron on top with the post through it, edge up as
// gsd.scad has it. The two spikes straight up and the two straight down are
// left off, and so are the two core struts that would cross the post at the
// top and bottom of the core. The core hangs star_lift above the top strap;
// its circumradius is 0.4195 of the half span. A ridge strut, core vertex to
// tip, is 0.357 of the span; a core edge 0.221.
module star(span = star_span) {
  core = 0.4195 * span / 2;
  echo(str("star span ", span, " mm, ridge struts ", round(0.357 * span), " mm, core edges ", round(0.221 * span),
           " mm, centre at ", round(pole_h + star_lift + core), " mm, core bottom ", round(pole_h + star_lift), " mm, strap at ", pole_h, " mm"));
  color([0.98, 0.85, 0.20]) translate([0, 0, pole_h + star_lift + core]) gsd(span, below = 0.9, above = 0.9);
}

module person(h = 1700) {
  color([0.6, 0.6, 0.6]) translate([hem_d[len(hem_d) - 1] / 2 + 600, 0, 0]) {
    cylinder(h = h - 250, d = 350, $fn = 16);
    translate([0, 0, h - 120]) sphere(d = 240, $fn = 16);
  }
}

// --- assembly ---------------------------------------------------------------

post();
star();          // span is point to opposite point, mm
for (i = [0 : len(hoop_d) - 1]) { hoop(i); skirt(i); }
if (figure) person();
