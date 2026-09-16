# Code review, full site (2026-07-15)

A read of every source file: `public/main.js` (1490 lines), `public/style.css`
(1031), `public/index.html` (383), `public/serve.py`, `public/_sounds.html`,
`Makefile`, `.github/workflows/pages.yml`. `make lint` passes clean. Verified
against the working tree at commit `b16dd82`.

## Behaviour findings

### 1. Spin mode ignores prefers-reduced-motion (medium, a11y)
Every other motion entry point is gated on `reduceMotion`: `startAnim`,
`navNudge`, `nudgeBall`, and the whole pointer-scrub path. But
`setExperiment(true)` starts the drift unconditionally: it calls
`PARAMS.speed.set(-1.2)` and kicks off `requestAnimationFrame(animate)`
directly. The `tweenSlide` arch drop is also ungated. A visitor with reduced
motion set who opens /spin (via the menu link, which still works) gets
auto-playing animation. Suggested fix: in `setExperiment`, skip the initial
speed and the slide tween when `reduceMotion` is set, so the playground opens
still and only moves on an explicit slider change.

### 2. The first cue after enabling sound is silent (low)
`loadSample` returns null while a sample is still fetching, and `playNote`
bails on a null buffer. `setSound(true)` plays `sfx.on()` immediately, so the
confirmation cue that tells the visitor sound is now on never sounds on the
first click. The comment accepts this ("the next trigger catches it"), but
the confirmation cue is the one case where the dropped note is the whole
point. Suggested fix: prefetch the cue samples inside `setSound(true)` and
play the confirmation once the glockenspiel buffer resolves, or have
`playNote` chain onto the in-flight fetch.

### 3. Scrub speed exceeds the Speed slider's range (low, cosmetic)
The pointer scrub clamps to `VEL_MAX` (8), but the Speed slider's range is
-6..6. A fast flick in spin mode holds `steadyVel` at up to 8 while the
slider pegs at 6, so the knob no longer reflects the real speed and nudging
it snaps the speed down. Either clamp the scrubbed `steadyVel` to the
slider's 6, or widen the slider to `VEL_MAX`.

### 4. Arpeggio pan direction may be inverted (check by ear)
Tracing the signs: slider right gives negative `vel` (the speed param negates
on set), which moves the pattern right, and `dir = vel >= 0 ? 1 : -1` then
pans the piano notes left. If that is deliberate, a comment would save the
next reader the trace; if not, flip the sign in `pan = dir * spd * 0.7`.
I am not fully certain of the visual direction from reading alone, so trust
your ears over this trace.

### 5. Dead mailto fallback in the contact form (cleanup)
`CONTACT_ENDPOINT` is set, so the `if (!CONTACT_ENDPOINT)` mailto branch is
dead code, and the comment above it ("Until the URL is set...") describes a
state that no longer exists. Either delete the branch or reword the comment
to say it is a deliberate fallback for reverting the endpoint.

### 6. Contact form accepts junk email and has no spam guard (low)
The form is `novalidate` and the handler only checks non-empty, so
`type="email"` never validates and "abc" goes through. There is also no
honeypot field, and the Apps Script URL is public in the source (inherent to
client-side forms), so the Sheet will collect whatever bots post. A hidden
honeypot input plus a cheap regex check would filter most of it. Also note
the documented no-cors tradeoff: any completed request shows the thank-you,
including a backend 500.

## Accessibility

### 7. Lightbox focus is not managed on open/close (medium-low)
`inert` handling is correct now, but opening the lightbox leaves focus on the
gallery thumbnail behind the overlay, and closing does not restore anything.
Escape and the arrow keys work because they are document-level, so keyboard
operation is fine; a screen reader's context just does not follow the dialog.
Standard fix: focus `#lightbox-close` on open, remember the opening cell, and
refocus it on close.

### 8. Menu drawer has no focus trap (low)
Tab can walk out of the open drawer into the page behind the backdrop. Escape
closes it, so this is minor for a small site.

## Deploy and hygiene

### 9. Dev files ship to the live site (low)
The Pages artifact is all of `public/`, which includes `_sounds.html` (the
temporary sound-audition page, marked noindex) and `serve.py`. Also 21 of the
27 files in `public/sounds/` are unreferenced by `main.js` (the whole
directory is only 532K, so this is tidiness, not weight). Options: move dev
files out of `public/`, delete the unused samples (originals are re-fetchable
from the FluidR3 soundfont), or add an exclusion step in the workflow.

### 10. Actions pinned to Node-20-era versions (low)
The deploy run warns that `checkout@v4`, `configure-pages@v5`,
`upload-pages-artifact@v3` and `deploy-pages@v4` target Node 20, which the
runners now force onto Node 24. Bump to the current majors when convenient;
nothing is broken today.

## Stale comments and dead config (tiny)

- `ARC_Y`'s comment says "The arc-y lever moves it"; the levers are long
  gone.
- `CFG.steps` (300) is dead: `resize()` always overwrites `steps` with
  `Math.max(360, ...)`, so 300 can never take effect. Delete the field or
  use it as the floor.
- `paramMax` still supports a function-valued `max`, but every param now has
  a numeric max. Harmless leftover from the dynamic height cap.

## Performance (optional, invisible at current sizes)

- `render()` allocates four Float32Arrays (roughly 20KB) every frame while
  animating, which churns the GC. Hoisting them and reallocating only in
  `resize()` is a small, contained change.
- `themeColors()` runs `getComputedStyle` every frame. Caching the two
  colours and invalidating on theme toggle would drop it.

## What is in good order (checked, no action)

- The route list is documented as needing sync in all three places
  (`main.js`, `serve.py`, `pages.yml`) and all three currently match,
  including the uppercase `/APRICITY` QR special case.
- Fonts are trimmed to the two families actually used.
- Gallery uses thumbnails plus `loading="lazy"`; all referenced images and
  sound samples exist (verified against `ls`).
- No `innerHTML` anywhere, external links carry `rel="noopener"`, OG and
  twitter meta are complete with absolute URLs.
- Sound is off by default, gesture-gated, remembered in localStorage, and
  every cue no-ops safely when off; the monophonic voice-steal logic is
  clean.
- The lint gate (Biome, Ruff, actionlint) passes and is wired to a
  versioned pre-push hook.
- Everything from the 2026-06 cleanup review has been done.

## Suggested order

1. Reduced-motion gate in `setExperiment` (finding 1), the one real
   behaviour bug.
2. Lightbox focus management (finding 7), small and mechanical.
3. Contact-form honeypot and email check (finding 6) before the QR codes go
   up and traffic arrives.
4. The rest as touch-the-file-anyway cleanups.
