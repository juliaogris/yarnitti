// Cone study: one skirt on its own, to work up to the tree.
//
// A frustum with the steepness of the tree's bottom skirt, cut off parallel to
// the base a little below the apex, with straight struts running up the
// surface from the hem ring to the top edge. The fabric is sewn to the hem
// ring, to the top edge and to every strut, and between them it hangs in a
// curve through the sag point of its panel: midway between two struts, low
// down, sag_drop of the way from the cone to the floor.
//
// Units are millimetres.
//
//   openscad platonic/cone.scad
//   openscad -o cone.stl platonic/cone.scad

hem_d    = 1000;  // across the base, mm
top_d    = 120;   // across the cut-off top, mm
height   = 800;   // base to top, mm
struts   = 8;     // straight struts from the hem to the top
skin     = 6;     // thickness of the fabric shell, mm
strut_d  = 10;    // struts, mm
ring_d   = 25;    // hem ring, mm
// Where the fabric of a panel hangs lowest: midway between two struts, and
// this far up the cone, 0 at the hem ring and 1 at the top edge. Below half
// way, because the hem ring is wide and heavy and the panel narrows upward.
sag_t    = 0.25;
sag_drop = 0.45;   // how far that point falls towards the floor
dot_d    = 16;    // the sphere marking the sag point, mm
// How sharply the fabric creases over a strut. 1 leaves a clean fold, below
// that the fold is sharper and the middle of the panel flatter, 2 rounds the
// fold off into a hill.
fin      = 1;
ghost    = false; // draw the shell see-through, so the spheres show

slant = norm([(hem_d - top_d) / 2, height]);
lean  = atan((hem_d - top_d) / 2 / height);   // degrees from vertical
fall  = sag_drop * sag_t * height;            // how far a sag point drops, mm

echo(str("cone: hem ", hem_d, " mm, top ", top_d, " mm, ", height, " mm tall, ",
         round(lean * 10) / 10, " degrees from vertical, slant ", round(slant), " mm"));
echo(str(struts, " struts of ", round(slant), " mm, ", round(PI * hem_d / struts),
         " mm apart round the hem"));
echo(str(struts, " sag spheres on a circle ", round(hem_d + sag_t * (top_d - hem_d)),
         " mm across, the panel ", round(PI * (hem_d + sag_t * (top_d - hem_d)) / struts),
         " mm wide there; each falls ", round(fall), " mm, from ",
         round(sag_t * height), " to ", round(sag_t * height - fall), " mm above the floor"));

// The cone the fabric is cut for: r and z at t, 0 at the hem ring, 1 at the
// top edge.
function cone_r(t) = hem_d / 2 + t * (top_d - hem_d) / 2;
function cone_z(t) = t * height;
function cyl(r, a, z) = [r * cos(a), r * sin(a), z];
function wrap(a) = ((a % 360) + 360) % 360;

// How far the fabric hangs below the cone it is cut for.
//
// Across a panel: 0 on a strut, 1 midway between two. The fabric folds over
// the strut rather than rounding off it, so this rises straight out of zero.
// Up the cone: 0 at the hem ring and at the top edge, 1 at the sag point, a
// smoothstep each side of it. So the fabric stays sewn to both rims and to
// every strut, and passes through the sag point in a curve.
function ss(x) = x * x * (3 - 2 * x);
function across(a) = pow(abs(sin(struts * wrap(a) / 2)), fin);
function along(t) = t <= sag_t ? ss(t / sag_t) : 1 - ss((t - sag_t) / (1 - sag_t));
function drop(a, t) = fall * along(t) * across(a);
function fabric_z(a, t) = cone_z(t) - drop(a, t);

// The fabric as a thin shell on that surface, faces clockwise seen from
// outside as polyhedron wants them. na is a multiple of struts so the struts
// and the sag points land on sample lines.
module shell(c = [0.10, 0.40, 0.20], nt = 80, na = 192) {
  pts = [for (off = [0, skin]) for (s = [0 : nt]) for (b = [0 : na - 1])
           let (a = b * 360 / na, t = s / nt)
           cyl(cone_r(t) - off, a, fabric_z(a, t))];
  N = (nt + 1) * na;
  function o(s, b) = s * na + (b % na);
  function n(s, b) = N + o(s, b);
  faces = concat(
    [for (s = [0 : nt - 1], b = [0 : na - 1]) [o(s, b), o(s + 1, b), o(s + 1, b + 1), o(s, b + 1)]],
    [for (s = [0 : nt - 1], b = [0 : na - 1]) [n(s, b), n(s, b + 1), n(s + 1, b + 1), n(s + 1, b)]],
    [for (b = [0 : na - 1]) [o(0, b), o(0, b + 1), n(0, b + 1), n(0, b)]],
    [for (b = [0 : na - 1]) [o(nt, b), n(nt, b), n(nt, b + 1), o(nt, b + 1)]]);
  color(c, ghost ? 0.25 : 1) polyhedron(points = pts, faces = faces, convexity = 8);
}

// The hem ring of poly pipe, flat.
module ring(c = [0.15, 0.15, 0.15]) {
  color(c) rotate_extrude($fn = 144) translate([hem_d / 2, 0]) circle(d = ring_d, $fn = 12);
}

// One strut, straight from the hem ring to the top edge.
module strut(k, c = [0.1, 0.3, 0.7]) {
  a = k * 360 / struts;
  color(c) hull() {
    translate(cyl(cone_r(0), a, cone_z(0))) sphere(d = strut_d, $fn = 12);
    translate(cyl(cone_r(1), a, cone_z(1))) sphere(d = strut_d, $fn = 12);
  }
}

// The sag point of a panel, now on the fabric.
module dot(k, c = [0.85, 0.20, 0.30]) {
  a = (k + 0.5) * 360 / struts;
  color(c) translate(cyl(cone_r(sag_t), a, fabric_z(a, sag_t))) sphere(d = dot_d, $fn = 16);
}

shell();
ring();
for (k = [0 : struts - 1]) { strut(k); dot(k); }
