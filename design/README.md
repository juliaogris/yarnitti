# Yarnitti

A community yarn-art project — Edithvale, Melbourne.
`yarnitti.org` · Not a business. A love letter to a place and its people.

> **Why it matters, in one line:** I love my land, my people, and creative
> expression, and many hours of obsessive crochet with a touch of soft civil
> disobedience aligns perfectly with who I am.

This is the design home for the site. It covers what the project is, the copy
you can lift straight onto the page, and the visual and interaction direction.

---

## 1. The project

### What Yarnitti is

An art project, not a business. It grows from love for **Edithvale**, on Port
Phillip Bay, Melbourne, for its bay, its wetlands, and above all its people.

The name is a portmanteau of *yarn graffiti* and *knitting*. The work is **yarn
bombing**: wrapping ordinary street furniture (electricity poles, lamp posts,
bollards) in hand-crocheted granny squares in warm, winter-coloured gradients.
What is usually grey and overlooked becomes a small burst of colour and care,
placed quietly in public for whoever walks past.

Each installation carries a **QR code** linking to the story online, turning a
glance on the footpath into an invitation to read, to belong, and to feel part
of the place.

**Why crochet:** fun, low-setup, portable. After amigurumi, it became a coping
strategy alongside full-time software work and being mum to a 10- and
13-year-old. It fits my life better than woodworking could.

### Apricity — the current work

The first series of yarn-bombed poles, lamp posts and bollards is called
**Apricity**, an old English word meaning the warmth of the sun in winter. The
name is lived, not decorative: it *is* winter. The squares glow in winter
colours (reds, oranges, golds, deep purples) like sunrise on a cold morning.
Apricity is a many-hours labour of love, made together with Julia's mum.

Apricity is one work across many installations, clustered around the
**Edithvale Life Saving Club (ELSC)**, the centre of my life, and near my home,
the train station, and the people I love.

All pieces link to one page: `https://yarnitti.org/apriciti`

The pieces stay up until the **September equinox**, then come down. If people
like them, a thank-you is welcome; if not, I take them down. The piece is meant
to spark joy, not annoy. A contact route lets anyone who dislikes a piece say
so.

### The bay, the swim, and the people

For 5+ years I have swum most mornings, around 7am, in the cold bay with a
loose group, no name, no leader, self-organising over WhatsApp. Most are women,
many 60+; I am 46.

They are funny, strong, and care deeply about social justice, left-leaning,
from many backgrounds: teachers, a Buddhist teacher, an opera singer, a doctor,
a chemical engineer, a salesperson. Through them I learned what it means to
belong, to be respected and loved.

Every morning there is a shared sense of awe at the sunrise and the bay. It
binds me to this land. **Apricity is a portrait of those mornings:** the cold,
the colour, and the warmth we make together.

### The bigger picture

Yarnitti is the umbrella; Apricity is the first series. More are hoped for.

---

## 2. Site structure

`yarnitti.org` is a small site that grows one piece at a time.

- **Home** — introduces Yarnitti as a practice. Tagline, one strong pole photo,
  one line on what it is. Future pieces are posted here too.
- **Apricity** (`/apricity`) — the page each code points to: the definition
  first, then the story of the swim and the bay, why it exists (the labour of
  love), a photo of Julia and her mum crocheting, and the intent. A note on
  soft resistance and being an active participant in urban landscape design
  also lives here.
- **The works / map** — every installation around Edithvale; a self-guided
  trail near the ELSC.
- **The makers** — the swim group's story (anonymous; they have no name or
  leader).
- **About** — who you are, why Edithvale, that it is art not business.

---

## 3. Design feel

Two feelings anchor the whole site.

- **Warmth arriving slowly.** Apricity is the winter sun after cold water. The
  experience should warm as you move through it: cold bay-blue at the top, the
  morning swim, thawing into golden wool tones lower down, the sun.
- **Handmade, not designed.** Slight imperfection is the point. Wobbly lines,
  things taped a little crooked, real photographed texture rather than flat
  vector polish. A hand-crafted look throughout.

### Shared skeleton, swappable theme

Each page shares one skeleton: the `yarnitti` wordmark, the same navigation,
layout and footer. The theme is a separate layer on top. The home page and any
non-warm future piece use a cold or neutral palette; Apricity uses a warm
palette. Not every future piece will be warm, so the warmth must live in the
theme and not in the structure.

---

## 4. Parallax explorations

Julia likes a parallax effect and wants it tied to yarn. Parallax means layers
moving at different speeds as you scroll, and yarn is already layered, so the
two map naturally: a soft knit texture drifting slowly in back, motifs at a
medium speed, loose strands moving fastest in front, so it feels like wool is
being laid down as you move.

Five throwaway prototypes explore distinct parallax techniques. They live in
the repo root as self-contained HTML, CSS and vanilla JS, each with a cold home
page (`index.html`) and a warm Apricity page (`apricity.html`). A gallery at
the repo-root `index.html` links them all. Lorem ipsum stands in for real copy.

1. **Depth layers** (`1-depth-layers/`) — a knit texture, yarn balls and the
   hero card each move at their own speed. The classic layered-depth effect,
   "knitting itself in".
2. **Following a thread** (`2-thread-follow/`) — a single yarn strand draws
   itself down the page as you scroll and sways gently. Cheap to build and
   strongly on-theme; one thread connects every section.
3. **Scrapbook on linen** (`3-scrapbook-linen/`) — taped cards pinned to a
   woven linen background drift at different rates. Pointer movement adds depth
   on desktop. The most clearly hand-crafted of the five, and the easiest.
4. **Stitch reveal** (`4-stitch-reveal/`) — each section is knit in row by row,
   clipped open from the top as it scrolls into view.
5. **Warm-up motifs** (`5-warmup-motifs/`) — the background interpolates from
   cold to warm as scroll progresses, while granny-square motifs float at
   varied depths. The most literal expression of "warmth arriving slowly".

### Generative wave header (in progress)

A separate exploration: a tinkersynth-inspired generative wave-field as the
page header, carrying three threads at once — the **yarn** (the line itself),
the **graffiti** (boldness, soft rule-breaking) and the **bay waves** of
Edithvale. Subtle pointer / touch / tilt interaction nudges the waves, the way
a tinkersynth lever reshapes its art. Mobile-first. Lands on the home page
first, Apricity later. Base art derived from `design/sublime-treasure.svg`.

### Constraints honoured

- **Mobile.** Responsive layouts, `requestAnimationFrame` with passive scroll
  listeners for smoothness on touch, and a workaround for iOS unreliable
  fixed-background attachment.
- **Reduced motion.** Every prototype honours `prefers-reduced-motion: reduce`,
  disabling the parallax transforms and revealing content statically.
- **Accessibility of warmth.** Because warmth lives in the theme layer, the cold
  and warm palettes can each be tuned for contrast independently.

---

## 5. Ready-to-use copy

Lift these straight onto the site or signage. Edit freely, written in your
voice.

### Taglines

- Yarnitti — the warmth of the sun in winter, left on the street for you to
  find.
- A love letter to Edithvale, one crocheted square at a time.

### Homepage "About"

> Yarnitti is an art project, not a business, made out of love for Edithvale:
> its bay, its wetlands, its people. I wrap the everyday furniture of the
> street in hand-crocheted, winter-coloured squares, each carrying a QR code to
> the story behind it. A small way of making a place feel held.

### Apricity page intro

> **Apricity** (n.) — the warmth of the sun in winter.
>
> These poles and posts around Edithvale are wrapped in squares the colours of
> a cold-morning sunrise. I made them for the people I swim with at 7am, and for
> anyone needing a little warmth on the way past.

### The swimmers

> Most mornings a loose group of us swim in the cold bay around 7am. They taught
> me what it means to belong. Every sunrise, a shared awe binds me to this land.
> Yarnitti is what that feeling looks like in yarn.

### Tone

Warm, plain-spoken, unhurried. First person. Quietly political, about
belonging, care, and place, without being preachy. Let the colour and the bay
do the talking.

---

## 6. Features worth considering

- **Guestbook** — a "leave a note", or something yarn-themed; sign-in via
  Google / Apple / Facebook; built on Firebase.
- **Interactive map** of installations, doubling as a bay walking trail.
- **Per-piece QR codes** — pieces could link to slightly different notes (a
  small treasure hunt).
- **Seasonal colour story** — pieces are up only Apr–Sep (down at the equinox).
- **A gentle "how it's made" page** — squares, gradients, crocheted codes, peg
  template.
- **Care + ethics note** — weatherproofing, responsible removal, respect for
  street furniture and council.

---

## 7. Open questions and deferred decisions

- **Spelling:** the work is **Apricity** but the URL reads **/apriciti**.
  Decide which is official before printing QR codes so link and name match.
- **Crocheted QR codes** do not scan reliably yet. Refining the quiet-zone
  border as more purple yarn arrives.
- Are the swimmers ok being described, even anonymously?
- Final wording for the home page, the Apricity story, and contact.
- Final colour palette and type choices.
- Which parallax direction (or combination) to carry forward.
- Real photography, including the photo of Julia and her mum.

---

Yarnitti · Edithvale, Melbourne · `yarnitti.org`
