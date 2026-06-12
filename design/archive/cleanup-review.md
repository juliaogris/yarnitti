# Cleanup review — public site

> STATUS (2026-06-12): Archived. Every item below has been addressed in the
> code (the two launch-blocker bugs, the font-request trim, the scratch font
> pages, and all the dead CSS/JS for levers, scroll cue, spin panel, and debug
> guides). The route list now carries cross-reference comments in all three
> files. Kept for the record only; do not treat as an open to-do list.

A read-through of `public/` (`index.html`, `main.js`, `style.css`,
`serve.py`) plus the deploy workflow. Grouped by priority. Nothing here is
urgent for it to work; it works. This is about shedding the prototyping
scaffolding before launch and removing a couple of real bugs.

Note: at the time of writing there are uncommitted edits in `index.html`,
`main.js`, and `style.css`, so line numbers may drift.

---

## 1. Bugs (fix regardless of cleanup)

### Contact email points at the wrong domain
- `index.html`: the menu "Say hello" link is `mailto:hello@yarnitti.com`.
- The project domain is `yarnitti.org` (see `design/README.md` and the
  domain task). Unless you also own `yarnitti.com` and forward it, this
  sends mail into the void.
- **Fix:** change to `hello@yarnitti.org`, or whatever the real inbox is.

### 404 base path is hardcoded to the project-pages path
- `.github/workflows/pages.yml` builds `404.html` with
  `<base href="/yarnitti/">`.
- That is correct only while the site lives at
  `juliaogris.github.io/yarnitti/`. On the apex domain `yarnitti.org` the
  base must be `/`, or the not-found page loads its CSS/JS from the wrong
  place. The workflow comment already flags this.
- **Fix:** when the custom domain goes live, change that `sed` to
  `<base href="/">`. See the domain notes for the full move.

---

## 2. Prototyping scaffolding to remove before launch

### Scratch font-picker pages
- `public/_bodyfonts.html` and `_tagfonts.html` are font comparison
  pages, both headed "Delete before launch."
- **Action:** delete both (or move to an `archive/` dir if you want to keep
  them around).

### The giant Google Fonts request
- `index.html` requests ~20 font families (Andika, Bitter, Chilanka,
  DM Sans, EB Garamond, Fraunces, Itim, Karla, Klee One, Lora, Mali,
  Mulish, Newsreader, Nunito, Spectral, Vollkorn, and more). That is
  leftover from the font-picker exploration.
- The live CSS uses only **Over the Rainbow** (wordmark), **Coming Soon**
  (body and menu), and **Hanken Grotesk** (tagline variable). **Space
  Grotesk** appears only inside dead `.levers` / `.hero__scroll` rules
  (see below), so once those go it is unused too.
- **Action:** trim the `<link>` to the three (or four) families actually
  used. This is the single biggest page-weight win and removes a long
  blocking request on first paint.

### Dead "tuning levers" CSS and JS
- The old bottom tuning bar (`.levers`, `.levers__reset`, `.levers__step`,
  `#out-tagfont`, `#out-bodyfont`) has no markup left in `index.html`, but:
  - `style.css` still carries ~12 rules for it.
  - `main.js` still toggles `#levers` `is-hidden` in `setMenu` (two refs)
    against an element that never exists.
- **Action:** delete the `.levers*` block from `style.css`, the
  `#out-tagfont`/`#out-bodyfont` rule, and the `document.getElementById
  ("levers")` line in `setMenu`.

### Dead scroll-cue CSS
- `.hero__scroll`, `.hero__chev`, and the `chevBounce` keyframes are styled
  but there is no scroll-cue element in the HTML. `.hero__chev` is also
  listed in the experiment fade selector and the reduced-motion block, both
  matching nothing.
- **Action:** remove these rules, or re-add the element if you wanted the
  cue. Decide which; right now it is half-removed.

### Dead Spin-panel CSS
- `.scrub-pick__label` and `.scrub-pick__opts` are styled but the current
  footer markup uses neither.
- **Action:** drop both rules.

### Debug guide lines
- `main.js` has `SHOW_GUIDE` / `GUIDE_COLOR` / the pink dashed-line
  drawing block, all marked "remove before launch."
- **Careful:** `GUIDE_Y` and `GUIDE2_Y` are doing double duty. They are
  debug-guide positions *and* the real values fed into `--foot-pct` /
  `--gone-pct`, which drive the body-text fade gradient. So the pink-line
  drawing and the `SHOW_GUIDE` toggle can go, but the two numbers must
  stay (rename them to something like `FADE_START` / `FADE_END` so their
  real job is obvious).

### `?guide`, `?theme`, `?scrollto`, `?menu` query overrides
- Prototyping conveniences in `main.js`. Harmless to ship, but `?guide`
  becomes dead once the guide drawing is removed.
- **Action:** drop `?guide` with the guide code; keep the rest if useful.

### Placeholder UI with no behaviour
- The menu **sound toggle** (`#menu-sound`) flips `aria-pressed` but wires
  no audio ("placeholder; no audio wired yet").
- **About**, **Gallery**, **Treasure Hunt**, and parts of **Apricity** are
  placeholder copy ("on its way").
- **Action:** content decision, not code. Either hide the sound button and
  unfinished routes until they do something, or leave them as
  honestly-labelled stubs. Flagging so the choice is deliberate.

---

## 3. Maintainability (lower priority, no rush)

### The route list is duplicated in three places
- `main.js` `ROUTES = ["", "apricity", "about", "spin", "hunt", "gallery"]`
- `serve.py` `ROUTES = {"apricity", "about", "spin", "hunt", "gallery"}`
- `pages.yml` `for r in apricity about spin hunt gallery`
- Add a route and you must edit all three or a deep link 404s in one
  environment but not another.
- **Action:** no clean single-source without a build step, so at minimum
  add a comment in each pointing at the other two. A tiny `routes.txt`
  read by `serve.py` and the workflow would remove two of the three copies
  if you want to go further.

### `CFG.footY` is dead
- `CFG.footY = 0.54` is overwritten every resize by `footYfrac = ARC_Y`
  (`0.38`), so the `0.54` never takes effect.
- **Action:** delete `CFG.footY` and the `footYfrac` indirection, or wire
  `ARC_Y` through `CFG` so there is one source for the foot height.

### Module-scope mutable state
- `main.js` keeps a large bank of top-level `let`s (`vel`, `targetVel`,
  `liveArch`, `slideFrac`, etc.). Fine for a single-file canvas toy and
  not worth a rewrite, but if this grows, group the animation state into
  one object so it is clearer what resets together.

### `main.js` header comment is stale
- The top comment says "Static, no motion (that comes later)." The file is
  now fully animated with a spin mode and a router.
- **Action:** update the header to describe what the file actually does.

---

## 4. Things that are fine (checked, leave alone)

- `willReadFrequently: true` on the canvas context is correct: `isOnLine`
  reads pixels back every hover/click.
- The DPR cap at 2 in `resize()` is a deliberate perf choice, commented.
- The per-route `<base href="../">` injection is fine at the apex domain;
  only the absolute 404 base needs the path change.
- Accessibility basics are in good order: `aria-label`s on icon buttons,
  `aria-hidden` on decorative SVG, `prefers-reduced-motion` honoured.

---

## Suggested order

1. Fix the two bugs (email domain, 404 base) — these are launch blockers.
2. Trim the font request and delete the two scratch HTML files — biggest
   visible cleanup, lowest risk.
3. Remove the dead CSS/JS (levers, scroll cue, spin-panel, guides), keeping
   the two fade numbers.
4. Maintainability items whenever, no urgency.
