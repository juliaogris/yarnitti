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

| Star | Core | Points | Outer triangles | Look |
|---|---|---|---|---|
| Stellated octahedron (stella octangula) | octahedron | 8 | 24 | chunky, cubic, sits well |
| Small stellated dodecahedron | dodecahedron | 12 | 60 | classic spiky star |
| Great stellated dodecahedron | icosahedron | 20 | 60 | sharpest, most "Christmas" |
| Great icosahedron | icosahedron | 20 | 180 | too many faces for wool |

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
(Greek *hedra*, a seat, then a face of a solid) in notes and patterns.

Apricity set the pattern: one real, slightly obscure word, tied to place
and season, warm in meaning. Candidates that were considered:

- **Hedron**: the ending every Platonic solid shares. Cousin of
  cathedral (*kathedra*, a seat) and Sanhedrin (sitting together).
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
