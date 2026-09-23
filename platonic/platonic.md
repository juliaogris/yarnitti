# Platonic: the summer 2026 piece

Working notes for the second Yarnitti piece, going up for Christmas 2026.
The Apricity notes in `README.md` are the model for this file.

**Platonic** was chosen on 2026-09-04. It reads two ways and both are
true: platonic love is the love between friends, and the stars are
Platonic solids. Section 5 keeps the other candidates.

---

## 1. The idea

Apricity was winter warmth. Christmas in Edithvale is midsummer: long
light, the beach, the bay at its warmest. The second piece turns the
usual Christmas kit inside out. Instead of a northern winter, it is a
southern summer Christmas, made in wool.

Three parts, from big to small:

- **A Christmas tree**, bigger than anything Apricity did. Either a
  living tree on the foreshore or the ELSC forecourt dressed in
  crocheted stars, or a pole wrapped into a tree silhouette.
- **A yarn-wrapped tricycle** and one or two other child-sized toys,
  wrapped whole and parked where children pass.
- **Crocheted stars**, the main piece. Not flat stars: solid stellated
  polyhedra (see section 2), hung in trees along the foreshore and near
  the ELSC.

The stars carry the piece. Tree and toys are the stage.

### Toy ideas, to pick from

Things that already read as "childhood" from across a street, cheap to
find second-hand, and wrappable:

- tricycle (decided)
- rocking horse
- billy cart or a small wooden wagon
- a scooter, leaned against a pole
- a pram
- giant building blocks: crocheted cubes stacked under the tree, doubling
  as presents
- beach bucket and spade, for the summer Christmas angle
- a kite, tethered to a bollard
- a spinning top
- a wreath for the ELSC door
- a stocking hung on an Apricity pole, tying the two pieces together

## 2. The star

The star is a **stellated polyhedron**: a Platonic solid with a pyramid
grown on every face. Kepler named the first one **stella octangula**, the
eight-pointed star. It is an octahedron with a tetrahedron on each of its
eight faces. Seen another way it is two tetrahedra passing through each
other.

Candidates from the same family:

| Star                                    | Core         | Points | Outer triangles | Look                       |
| --------------------------------------- | ------------ | ------ | --------------- | -------------------------- |
| Stellated octahedron (stella octangula) | octahedron   | 8      | 24              | chunky, cubic, sits well   |
| Small stellated dodecahedron            | dodecahedron | 12     | 60              | classic spiky star         |
| Great stellated dodecahedron            | icosahedron  | 20     | 60              | sharpest, most "Christmas" |
| Great icosahedron                       | icosahedron  | 20     | 180             | too many faces for wool    |

The stella octangula is the best first star: 24 identical equilateral
triangles, one shape to learn, no acute points to keep stiff. The great
stellated dodecahedron is the one that looks most like a Christmas star
from a distance, worth one or two big ones on the tree top.

### Construction, first thoughts

- Crochet **equilateral triangles** in one size. Seam three into a cone
  for each point. Seam the cones around the core.
- The core need not be crocheted. A stuffed fabric octahedron, or a
  wire or skewer frame, gives a clean shape.
- Outdoors for a month in summer: **acrylic yarn**, plastic-bag or
  bottle stuffing rather than fibre fill, so rain drains and nothing
  moulds. Weight matters for hanging from branches.
- Sizes: palm-sized for the tree, head-sized for the trail, one big one
  (60 cm across) for the top.
- A **trail of stars** laid out in the pattern of the Southern Cross,
  five stars, would make the piece a map as well as a decoration.

## 3. Palette

Not decided. Options:

- **Summer bay**: white, sand, sea-glass green, hot pink, sun yellow.
  Reads as Christmas here and nowhere else.
- **Classic reworked**: red, green and gold, but in the Apricity
  gradient style so it is clearly the same hand.
- **Night sky**: navy, silver, white, one gold star. Ties to the
  stellated-star idea.

## 4. Where and when

- Up early December, down early January, in step with the school
  holidays.
- Clustered around the ELSC and the foreshore trees, like Apricity.
- QR code on the tree and on the tricycle, pointing to the new page.

## 5. Name

Chosen: **Platonic**. The star object itself can be called a hedron
(Greek _hedra_, a seat, then a face of a solid) in notes and patterns.

Apricity set the pattern: one real, slightly obscure word, tied to place
and season, warm in meaning. Candidates that were considered:

- **Hedron**: the ending every Platonic solid shares. Cousin of
  cathedral (_kathedra_, a seat) and Sanhedrin (sitting together).
  Kept for the star object.
- **Kosmos**, **Timaeus**, **Aether**: Plato's cosmos, the dialogue
  that assigns the solids to the elements, and his fifth element.
- **Hoshi**, **Stern**, **Funkeln**, **Twinkle**, **Zvezda**,
  **Stardust**, **Sternstaub**: star words from other languages.
- **Kepler**, **Mimosa**, **Spica**: the man who named the shape and two
  southern stars.
- **Stella Octangula**: Kepler's name for the shape. Precise, but two
  Latin words is heavy for a footpath sign, and it names one star, not
  the piece. Keep it as the name of the star pattern itself.
- **Asterism**: a small named pattern of stars, and the star-shaped
  gleam in a gemstone. Real word, one word, describes many crocheted
  stars hung together.
- **Crux**: the Southern Cross, the constellation on the flag, only
  visible from down here. Also "the heart of the matter". Short. Would
  pair with the five-star trail.
- **Stella Maris**: star of the sea. The bay, and the star that guides
  you home. Carries a Marian echo, which may or may not be wanted.
- **Sternstunde**: German, a shining hour. Austrian roots, but hard for
  a local to say or spell.
- **Solstice**: the piece is up over the summer solstice. Plain, but
  loses the star.

## 6. Site

- New route, sibling of `/apricity`, with the same skeleton and a cool
  or night theme, as `README.md` section 3 planned for non-warm pieces.
- Home page gets the new piece above Apricity once it is up.
- A "how the star is made" note, with the triangle count and a photo of
  the seaming, could be the first "how it's made" page.

## 7. Open questions

- Which star first: stella octangula alone, or a mix of two shapes?
- Living tree or pole tree? Who to ask about dressing a foreshore tree?
- Does the tricycle stay out overnight, or come in?
- Palette.

## 8. Skewer frame prototype

The first star is a frame of 4 mm bamboo skewers held by 3D-printed
connectors, with the wool to follow. The OpenSCAD source is
`platonic/platonic.scad`; `make stl` renders one STL per part into
`platonic/`. Parts: eight three-way tips, six flat four-way crosses for
the midpoints where the two tetrahedra meet, and a test bar of bores to
size the fit before printing the rest.

The crosses sit in one plane, so each star edge is two skewers, point to
cross to point, twenty-four skewers in all. Whole 27 cm skewers give an
edge of about 56 cm and a star about 69 cm point to point. Skewers cut
in half give a 35 cm star from the same parts.

### The inner octahedron

The first star left its core empty. The six crosses sit at the six
vertices of the octahedron the eight pyramids stand on, but nothing ran
along the twelve octahedron edges, so the core held its shape only
through the skewers of the outer star.

`cross8` replaces `cross` and adds those twelve struts. Each hub grows
four more arms on the azimuths that bisect the flat four, rising 45
degrees toward the centre of the star. Every arm is then 60 degrees from
its neighbours and 90 degrees from the one opposite, which is the vertex
figure of the octahedron.

An octahedron edge is exactly half a tetrahedron edge, so an inner strut
spans the same centre-to-centre distance as the tip-to-cross strut
beside it and takes a skewer of the same length. The bore bottom in an
inner arm sits at the mean of the tip gap and the cross gap, and that
makes the two lengths agree. `octa_gap` in the .scad derives it. The
part prints on the same flat face as `cross`, with the four new arms as
45 degree overhangs.

Counts for the full star: eight tips, six `cross8`, and thirty-six
skewers, twenty-four for the outer star and twelve for the core.

### A star of whole dowels

A bigger octangula uses one 6 mm × 1.2 m dowel for each tetrahedron
edge, twelve dowels in all. The dowel passes through its crossing instead
of stopping in it. The star then spans about 1.47 m.

`crossthru` holds two dowels that pass each other 7.7 mm apart, with the
same tetrahedron on the outside at all six crossings. Its body is the
convex hull of a square base, the two tubes and a boss, so it prints
without overhangs. The four inner octahedron arms leave the boss, which
sits 10.15 mm nearer the centre than the crossing. The octahedron edge
is therefore 586 mm, not 600 mm, and the 4 mm inner struts are cut to
576 mm. Print the crossings in PETG, because PLA softens in summer sun.

### A small star with tied crossings

`tip5` and `tip4` are the star point for a hand-sized octangula of round
bamboo stakes, 5 mm and 4 mm. One stake runs a whole tetrahedron edge
and is tied to the stake it crosses at its midpoint, so nothing is
printed for a crossing and the star needs eight parts and twelve stakes.
The two tetrahedra then sit a stake thickness apart at each crossing,
the same offset `crossthru` holds with a printed part.

The point is a sphere with three tubes on it, as on the great stellated
dodecahedron tip, not the filled cone of `tip`. A stake end stops short
of the point by the distance at which two bores 60 degrees apart clear
each other, 6.1 mm on `tip5` and 5.1 mm on `tip4`. Both sockets are
10 mm deep. The bores are 5.1 mm and 4.1 mm, for dowels cut square, not
for the tapered end of a skewer. The wall is 1.6 mm and 1.5 mm.

With 100 mm stakes the star is 145 mm across on 5 mm stakes and 142 mm
on 4 mm. Four 300 mm flower stakes cut into thirds give the twelve. The
.scad prints the edge and the span for any stake length.

PLA at 0.15 mm with a 15 mm brim, on one plate of eight: `tip5` is
17.6 g and 3 h 05 min, `tip4` is 13.4 g and 2 h 30 min. A single tip is
2.5 g and 28 min, or 2.0 g and 24 min. Eight on the plate also keep each
layer long enough to cool, which a lone tip does not.

## 9. Great stellated dodecahedron prototype

The second star is a great stellated dodecahedron: an icosahedron with a
tall triangular pyramid on each of its twenty faces. Only three
Platonic solids have stellations. The octahedron has one, the stella
octangula. The dodecahedron has three, and the great stellated
dodecahedron is one of them.

It was chosen over the small stellated dodecahedron for three reasons.
Each point is three triangles seamed into a cone, the same as an
octangula point. Each tip joins three stakes, like the octangula tips.
And it reads most like a Christmas star from a distance. The surface is
sixty triangles, but they are not equilateral. Each one has angles of
36, 72 and 72 degrees.

### Frame

Every edge is its own stake, and no stake passes through a connector.
The OpenSCAD source is `platonic/kepler.scad`, and `make stl` renders
both parts.

- `gsd_tip`, twenty of them, joins three ridge stakes at a star point.
- `gsd_hub`, twelve of them, joins five core stakes and five ridge
  stakes at an icosahedron vertex.

A ridge is phi (1.618) times a core edge. With 5 mm × 30 cm bamboo
flower stakes:

- 60 ridge stakes, uncut at 300 mm
- 30 core stakes, cut to 182.4 mm
- 90 stakes in all, two packs of fifty
- the star is 923 mm across

The core length allows for where the stake ends stop inside the tips and
hubs. The .scad prints it for any ridge length.

### Printing

- Bore 5.1 mm, socket 14 mm deep.
- The hub's five upward arms overhang 58 degrees from vertical. A 2 mm
  gusset under each arm holds it up while printing and stays in the
  part. A 1.2 mm pentagon on the bed joins the five gusset feet and the
  five downward arms, so every foot is tied to the others. A hub printed
  with a smaller pentagon lost a foot off the bed.
- 15 mm brim on both parts, no slicer support. A stacked crossing
  printed without a brim came off the bed, so every part gets one.
- PLA at 0.15 mm: a hub is 17.0 g and 2 h 46 min, a tip is 5.0 g and
  56 min. The full set is about 304 g and 52 hours.

Print one hub and one tip first and check the fit with a stake.

## 10. Dodecahedron frame

The third frame is a plain dodecahedron, no stellation: twelve pentagons,
thirty edges and twenty vertices. Every edge is its own dowel, and the
frame needs one printed part, twenty `dodeca_vertex`. The OpenSCAD source
is `platonic/dodeca.scad`.

Three edges meet at a vertex, 108 degrees apart, which is the interior
angle of the pentagon they bound. Put the outward direction on +z and all
three arms lean 20.9 degrees below the horizontal, so the part is a wide,
flat Y rather than a tripod. A dowel end stops 3.2 mm short of the
vertex, where two bores 108 degrees apart clear each other, and the
socket is 14 mm deep. The bore is 4.1 mm for 4 mm dowels.

With 300 mm dowels the edge is 306.3 mm and the frame is 866 mm across.
The .scad prints both for any dowel length.

### Printing

That shallow lean is the whole problem with the part. An arm rises
0.39 mm for every 0.15 mm layer, which no perimeter can bridge, so each
arm gets a 2 mm gusset filling the wedge between its underside and the
bed, the same fix the great stellated dodecahedron hub uses. A 1.2 mm
triangle on the bed joins the three gusset feet. The arm ends keep their
square cut, and one shallow cut puts a flat on the three that touch the
bed.

PLA at 0.15 mm with a 15 mm brim: a vertex is 3.0 g and 32 min, ten on
one plate are 27 g and 4 h 53 min. The set of twenty is about 60 g and
10 hours, which is a fifth of what the great stellated dodecahedron
costs.

## 11. Small stellated dodecahedron

The star passed over in section 9 is built after all. It is a dodecahedron
with a pentagonal pyramid on each of its twelve faces. The OpenSCAD source
is `platonic/ssd.scad`.

Every edge is its own stake, as in the great stellated dodecahedron, and
no stake passes through a connector.

- `ssd_tip`, twelve of them, joins five ridge stakes at a star point.
- `ssd_hub`, twenty of them, joins three core stakes and three ridge
  stakes at a dodecahedron vertex.

A ridge is phi times a core edge, the same ratio the great star has. The
frame takes sixty ridge stakes and thirty core stakes, ninety in all.

At a dodecahedron vertex a ridge carries straight on from the core edge it
meets, so the hub is three straight lines crossing at a point rather than
six separate arms. The two stakes of a line butt inside the hub. That is
what lets one part hold six stake ends: every bore stops 4.3 mm short of
the centre, so no two bores meet. The pass-through build in
`archive/kepler-experiments.scad` uses the same fact the other way, running
one skewer the whole length of an edge.

With 4 mm stakes:

| ridge stake | core stake | star across |
| ----------- | ---------- | ----------- |
| 280 mm      | 172.2 mm   | 900 mm      |
| 140 mm      | 85.6 mm    | 470 mm      |
| 93 mm       | 56.6 mm    | 325 mm      |

### Printing

Every arm of the hub leans only 20.9 degrees off the horizontal, below on
the core side and above on the ridge side, so each one gets a 2 mm gusset
down to the bed and a 1.2 mm hexagon joins the six feet. The gusset is cut
off at the end face of its arm, because the shadow of an arm that shallow
reaches further out than the arm does and would otherwise close over the
socket.

PLA at 0.15 mm with a 15 mm brim: a tip is 4.4 g and 48 min, a hub is
5.9 g and 1 h 05. The full set is about 170 g and 31 hours.

Print one of each first and check the fit with a stake.
