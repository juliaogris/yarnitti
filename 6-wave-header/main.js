/*
 * yarnitti — wave header (horseshoe, b&w, static)
 *
 * A horseshoe arch of woven strands. Each strand runs from a sharp point at
 * the left foot, up and over in a wavy ridge, down to a sharp point at the
 * right foot. Wobble falls to zero at the feet so every strand converges to
 * the same two points. Uniform thin white lines on black. Static, no motion
 * (that comes later).
 *
 * No dependencies. Hand-rolled seeded value noise.
 */

const CFG = {
  seed: 36170,        // from the tinkersynth Slopes panel
  strands: 34,        // line count, from the panel
  steps: 300,         // samples along each arch

  footY: 0.54,        // height of the two feet, fraction of canvas height
  footL: 0.10,        // left foot x, fraction of width
  footR: 0.90,        // right foot x

  arch: 0.26,         // overall arch height (back bow), fraction H (arch lever)
  bowRatio: 0.62,     // front bow as a fraction of the back bow: higher ->
                      // the bottom line curves into a horseshoe, not flat
  bowEase: 1.1,       // >1 crowds strands toward the low bows

  wobAmp: 0.09,       // ridge wobble, fraction of height -> higher peaks
  wobFreqFront: 3.0,  // front: few long swells
  wobFreqBack: 9.5,   // back: many small ripples
  octaves: 3,         // higher -> more jagged ridgeline (4 = more jagged)
  rowOffset: 0.37,    // per-row noise offset (lower -> aligned swells)

  jitterAmp: 0,       // hand-drawn tremor off (smooth lines)
  jitterFreq: 26,
  xJitterAmp: 0,

  lineWidth: 2.7,      // front (low / foreground) ridges, thicker
  lineWidthBack: 2.0,  // back (high) ridges, a little thinner
};

const canvas = document.getElementById("waves");
const ctx = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
const hero = document.getElementById("hero");

// Foot line of the arc, as a fraction of hero height. Drives where the
// mountains sit and where the content fade lands. The arc-y lever moves it.
let ARC_Y = 0.38; // around the bottom of the top third

// Two debug guides framing the content fade (remove before launch). The lower
// guide is where body content starts fading; the upper guide is where it is
// completely gone. Each has its own lever; both hide with one toggle (or
// ?guide=0). Pink so they read as scaffolding.
let GUIDE_Y = 0.37;  // lower line: fade starts here
let GUIDE2_Y = 0.29; // upper line: content fully gone above here
let SHOW_GUIDE = new URLSearchParams(location.search).get("guide") === "1";
const GUIDE_COLOR = "#ff2d8e";

// ---- seeded value noise ---------------------------------------------------

function makePerm(seed) {
  let a = seed >>> 0;
  const rand = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return [...p, ...p];
}
const perm = makePerm(CFG.seed);

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;
const latt = (xi, yi) => (perm[(perm[xi & 255] + yi) & 255] / 255) * 2 - 1;

function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = fade(xf), v = fade(yf);
  const aa = latt(xi, yi), ba = latt(xi + 1, yi);
  const ab = latt(xi, yi + 1), bb = latt(xi + 1, yi + 1);
  return lerp(lerp(aa, ba, u), lerp(ab, bb, u), v);
}

function fbm(x, y) {
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let o = 0; o < fbmOctaves; o++) {
    sum += amp * noise2(x * freq, y * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

// ---- render (static) ------------------------------------------------------

let W = 0, H = 0, dpr = 1;
let strands = CFG.strands, steps = CFG.steps;
let footLfrac = CFG.footL, footRfrac = CFG.footR, footYfrac = CFG.footY;
let tAnim = 0;            // animated noise offset (load / click intro motion)
let lineScale = 1;        // thins every stroke on narrow screens (set in resize)
let archScale = 1;        // flattens the arch on narrow screens (set in resize)
let wobScale = 1;         // more ridge ripples on narrow screens (set in resize)
let strandScale = 1;      // shortens the dangling foot strands in spin mode
let lineWidthMul = 1;     // scales every ridge stroke (the Thickness slider)
let slideFrac = 0;        // how far the whole arch is dropped within the canvas
let fbmOctaves = CFG.octaves; // more jagged detail on narrow screens
// The arch band (top silhouette to the feet), set each render so a drag can
// grab the mountains anywhere within it.
let bandTop = null, bandCx = 0, bandA = 0, bandSteps = 0, bandFootY = 0;

// Live, scrub-adjustable copies of the ridge parameters. Vertical drags over
// the lines change whichever one the footer picker has selected, so the
// mountains can be reshaped by hand while prototyping.
let liveArch = CFG.arch;             // overall mountain height
let liveWobAmp = CFG.wobAmp;         // ripple height
let liveWobFreqBack = CFG.wobFreqBack; // ripple count (jaggedness)
let strandsF = CFG.strands;          // fractional line count, rounded into `strands`
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Read the live theme colours so the canvas inverts with the page.
function themeColors() {
  const cs = getComputedStyle(document.documentElement);
  return {
    bg: cs.getPropertyValue("--bg").trim() || "#000",
    ink: cs.getPropertyValue("--ink").trim() || "#fff",
  };
}

function render() {
  const { ink } = themeColors();
  ctx.clearRect(0, 0, W, H); // transparent: the page background shows through

  ctx.strokeStyle = ink;
  ctx.lineWidth = CFG.lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.globalAlpha = 1;

  // The feet sit at their base height plus the spin-mode drop, but never so
  // high that the peak (bow + ripples) would clip at the canvas top: a tall
  // arch pushes the whole thing down just enough to stay on screen.
  const baseFoot = footYfrac + slideFrac;
  const fitFoot = liveArch + liveWobAmp + 0.04;
  const footY = H * Math.max(baseFoot, fitFoot);
  const xL = W * footLfrac;
  const xR = W * footRfrac;
  const cx = (xL + xR) / 2;
  const a = (xR - xL) / 2; // horizontal radius, fixed -> both feet are points
  const wobPx = H * liveWobAmp;
  const jitPx = H * CFG.jitterAmp;
  const xJitPx = W * CFG.xJitterAmp;

  // x is the same for every strand at a given step, so each step is one
  // screen column: an upper-silhouette per column gives hidden-line removal.
  const colX = new Float32Array(steps + 1);
  for (let s = 0; s <= steps; s++) {
    colX[s] = cx - a * Math.cos((Math.PI * s) / steps);
  }
  const horizon = new Float32Array(steps + 1).fill(Infinity);
  const ys = new Float32Array(steps + 1);
  const xs = new Float32Array(steps + 1);

  // Draw front (low bow) to back (high bow). A back point is drawn only where
  // it rises above every nearer ridge, so front hills occlude the ones behind.
  for (let i = 0; i < strands; i++) {
    const q = strands > 1 ? i / (strands - 1) : 1;
    // Height raises the back (top) arc while the front (bottom) arc stays put,
    // so growing height mostly lifts the peak rather than the whole shape.
    const frontBow = H * CFG.arch * CFG.bowRatio * archScale;
    const backBow = H * liveArch * archScale;
    const bow = lerp(frontBow, backBow, Math.pow(q, CFG.bowEase));
    // Front ridges (low q) drawn thicker; back ridges thinner.
    ctx.lineWidth = lerp(CFG.lineWidth, CFG.lineWidthBack, q) * lineScale * lineWidthMul;
    // Front ridges roll in few long swells; back ridges break into more
    // ripples, like waves stacking out to sea.
    const wf = lerp(CFG.wobFreqFront, liveWobFreqBack, q) * wobScale;

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const env = Math.sin(Math.PI * t);
      const baseY = footY - bow * env;
      const wob = fbm(t * wf + tAnim, i * CFG.rowOffset) * wobPx * env;
      // Fine hand-drawn tremor on top of the main wobble; tapers to zero at
      // the feet so the strands still converge to a sharp point.
      const jit = fbm(t * CFG.jitterFreq + i * 3.1, i * 0.9 + 50) * jitPx * env;
      const xJit = fbm(t * CFG.jitterFreq * 0.7 + i * 4.2, 80) * xJitPx * env;
      ys[s] = baseY - wob - jit;
      xs[s] = colX[s] + xJit;
    }

    // Stroke only the visible runs (above the silhouette), as broken subpaths.
    let drawing = false;
    for (let s = 0; s <= steps; s++) {
      const visible = ys[s] <= horizon[s];
      if (visible) {
        if (!drawing) {
          ctx.beginPath();
          ctx.moveTo(xs[s], ys[s]);
          drawing = true;
        } else {
          ctx.lineTo(xs[s], ys[s]);
        }
      } else if (drawing) {
        ctx.stroke();
        drawing = false;
      }
    }
    if (drawing) ctx.stroke();

    // Raise the silhouette so this ridge occludes everything further back.
    for (let s = 0; s <= steps; s++) {
      if (ys[s] < horizon[s]) horizon[s] = ys[s];
    }
  }

  // Remember the arch band (top silhouette down to the feet) so a drag can grab
  // the mountains anywhere between the top and bottom lines, not only on a line.
  bandTop = horizon;
  bandCx = cx;
  bandA = a;
  bandSteps = steps;
  bandFootY = footY;

  // Loose strands thinning out and fading from each foot: long on the left,
  // short on the right.
  drawStrand(xL, footY, 0.4, ink, 0.46 * strandScale, 0.024);
  drawStrand(xR, footY, 2.1, ink, 0.13 * strandScale, 0.008);

  // Debug-only guides (remove before launch). Draw on top so they are always
  // visible; each sits at its own height, independent of the arc.
  if (SHOW_GUIDE) {
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = GUIDE_COLOR;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
    for (const frac of [GUIDE_Y, GUIDE2_Y]) {
      const y = H * frac;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// A loose strand dropping from a foot, tapering and fading as it falls.
function drawStrand(footX, footY, sway, ink, lenFrac, waveAmt) {
  const len = H * lenFrac;
  const seg = 46;
  ctx.strokeStyle = ink;
  ctx.lineCap = "round";
  let px = footX;
  let py = footY;
  for (let s = 1; s <= seg; s++) {
    const t = s / seg;
    const y = footY + len * t;
    const x = footX + Math.sin(t * Math.PI * 2.2 + sway) * H * waveAmt * t * (1 - 0.25 * t);
    ctx.lineWidth = lerp(2.6, 0.15, t) * lineScale; // thins out toward the end
    ctx.globalAlpha = t < 0.6 ? 1 : Math.max(0, 1 - (t - 0.6) / 0.4); // fades
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x, y);
    ctx.stroke();
    px = x;
    py = y;
  }
  ctx.globalAlpha = 1;
}

function resize() {
  // Cap the pixel ratio at 2: the canvas now animates, so a 3x backing store
  // is a lot of pixels to redraw each frame and causes occasional jank on
  // retina/phone screens. 2x stays crisp enough.
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = hero.getBoundingClientRect();
  W = r.width;
  H = r.height;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Render the mountains with the same values at every width (arch height,
  // wobble, detail), except on mobile the lines are a touch thinner and the
  // feet (with their dangling strands) spread out toward the edges, widening
  // the arch and clearing the centre for body text.
  const small = W < 640;
  footLfrac = small ? 0.04 : CFG.footL;
  footRfrac = small ? 0.96 : CFG.footR;
  footYfrac = ARC_Y;
  lineScale = small ? 0.6 : 1;
  archScale = 1;
  wobScale = 1;
  strands = Math.round(strandsF); // keep any scrubbed line count across resizes
  steps = Math.max(360, Math.round(0.85 * W));

  // Frame the content fade with the two pink guides: it starts at the lower
  // line and is fully gone at the upper one.
  root.style.setProperty("--foot-pct", (GUIDE_Y * 100).toFixed(1) + "%");
  root.style.setProperty("--gone-pct", (GUIDE2_Y * 100).toFixed(1) + "%");
  render();
}

// ---- theme toggle ----------------------------------------------------------

const root = document.documentElement;
const saved = localStorage.getItem("yarnitti-theme");
// Always set an explicit theme: follow a saved choice, otherwise the browser
// preference, falling back to dark. Leaving it unset would drop the palette.
if (saved) {
  root.setAttribute("data-theme", saved);
} else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
  root.setAttribute("data-theme", "light");
} else {
  root.setAttribute("data-theme", "dark");
}

// Prototyping overrides: ?theme=light&scrollto=N
const params = new URLSearchParams(location.search);
const isMobile = window.matchMedia("(max-width: 640px)").matches;
const themeParam = params.get("theme");
if (themeParam) root.setAttribute("data-theme", themeParam);
const scrollToParam = params.get("scrollto");
if (scrollToParam) {
  window.addEventListener("load", () => window.scrollTo(0, +scrollToParam));
}

function toggleTheme() {
  const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
  root.setAttribute("data-theme", next);
  localStorage.setItem("yarnitti-theme", next);
  render();
}
document.getElementById("menu-theme")?.addEventListener("click", toggleTheme);

// hamburger menu: animate the button to an X and slide the menu panel and its
// backdrop in and out together.
const menuToggle = document.getElementById("menu-toggle");
const menu = document.getElementById("menu");
const menuBackdrop = document.getElementById("menu-backdrop");
function setMenu(open) {
  menuToggle?.classList.toggle("is-open", open);
  menuToggle?.setAttribute("aria-expanded", String(open));
  menuToggle?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  menu?.classList.toggle("is-open", open);
  menuBackdrop?.classList.toggle("is-open", open);
  document.getElementById("levers")?.classList.toggle("is-hidden", open);
}
menuToggle?.addEventListener("click", () =>
  setMenu(!menuToggle.classList.contains("is-open")));
menuBackdrop?.addEventListener("click", () => setMenu(false));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});
menu?.querySelectorAll(".menu__link").forEach((a) =>
  a.addEventListener("click", () => setMenu(false)));
if (params.get("menu") === "1") setMenu(true); // prototyping: open on load

// sound toggle (placeholder; no audio wired yet).
const menuSound = document.getElementById("menu-sound");
menuSound?.addEventListener("click", () => {
  const on = menuSound.getAttribute("aria-pressed") !== "true";
  menuSound.setAttribute("aria-pressed", String(on));
});

// ---- intro motion -----------------------------------------------------------
// On load (and on every click on the mountains) the ridges undulate, then
// decelerate to a standstill within 7 seconds. Each run continues from the
// current offset so a mid-run click never snaps.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TAU = 1.5;          // seconds; how long the spin coasts (long, like a roundabout)
const ACCEL = 1.0;        // how fast actual speed chases the target (lower = gentler ramp)
const CLICK_BOOST = 1.6;  // target speed added per click (gentle, builds slowly)
const LOAD_BOOST = 1.9;   // a bit more kick on first load
const VEL_MAX = 8;        // cap, reached at roughly five quick clicks
const BRAKE_TAU = 0.22;   // seconds; gentle coast to a stop, never a hard cut
const NUDGE_AT = 0.2;     // ridge speed at which the welcome nudge fires, while
                          // the spin is still going but slow (a second or two
                          // before it fully stops), not after it halts
let peakedVel = false;    // the load spin has reached speed, so a later slowdown is the wind-down
let vel = 0;              // current ridge-pattern speed
let targetVel = 0;        // speed it is easing toward (clicks raise it, friction lowers it)
let braking = false;      // a stop request: decelerate quickly to a halt
let steady = false;       // hold a constant spin speed (the experiment Play control)
let steadyVel = 0;        // the speed to hold while steady
let experiment = false;   // the "Spin" play mode is open
let lastFrame = null;
let animRAF = null;

// The wool ball and the hamburger each give one welcoming nudge once the load
// spin has coasted to a halt, so the motions do not compete for attention.
// The ball also waits until it is actually on screen, since on a short mobile
// viewport it starts below the fold. The nudge rides .yarn-divider, not the
// filtered ball, because iOS Safari skips transform animations on an element
// that carries an SVG filter. The class clears itself on animationend so a
// later hover or tap can replay the same nudge (re-adding a still-present
// animation never restarts it).
const yarnBall = document.querySelector(".yarn-ball");
const yarnDivider = yarnBall?.closest(".yarn-divider");
const hamburger = document.querySelector(".hamburger");
[yarnDivider, hamburger].forEach((el) =>
  el?.addEventListener("animationend", () => el.classList.remove("nudge")));
function nudgeBall() {
  if (!yarnDivider || reduceMotion) return;
  yarnDivider.classList.add("nudge");
}
let introSettled = false;
let ballVisible = false;
let ballIntroNudged = false;
let hamburgerNudged = false;
function maybeIntroNudge() {
  if (reduceMotion || !introSettled) return;
  if (!hamburgerNudged) {
    hamburgerNudged = true;
    hamburger?.classList.add("nudge");
  }
  if (ballVisible && !ballIntroNudged) {
    ballIntroNudged = true;
    nudgeBall();
  }
}
function animate(now) {
  if (lastFrame === null) lastFrame = now;
  const dt = Math.min(0.05, (now - lastFrame) / 1000); // clamp big tab-switch gaps
  lastFrame = now;
  if (braking) {
    targetVel = 0;
    vel *= Math.exp(-dt / BRAKE_TAU);                  // quick, smooth stop
  } else if (steady) {
    targetVel = steadyVel;                             // hold a set speed, no friction
    vel += (targetVel - vel) * Math.min(1, ACCEL * dt);
  } else {
    targetVel *= Math.exp(-dt / TAU);                  // friction on the target
    vel += (targetVel - vel) * Math.min(1, ACCEL * dt); // ease the real speed toward it
  }
  tAnim += vel * dt;
  // Fire the welcome nudge while the load spin is winding down but not yet
  // stopped. Wait until it has actually picked up speed, so the ramp at the
  // very start does not trip the threshold.
  if (Math.abs(vel) > 0.6) peakedVel = true;
  if (peakedVel && !braking && !introSettled && Math.abs(vel) < NUDGE_AT) {
    introSettled = true;
    maybeIntroNudge();
  }
  render();
  const keepGoing = (steady && Math.abs(steadyVel) > 0.02) ||
    Math.abs(vel) > 0.02 || Math.abs(targetVel) > 0.02;
  if (keepGoing) {
    animRAF = requestAnimationFrame(animate);
  } else {
    vel = 0;
    targetVel = 0;
    braking = false;
    lastFrame = null;
    animRAF = null;
    introSettled = true; // the ridges have settled; greet with the nudges
    maybeIntroNudge();
  }
}
// Each click adds to the target speed, so more (and faster) clicks build up
// more motion; the real speed eases in and out so it starts and stops gently.
function startAnim(boost) {
  if (reduceMotion) return;
  braking = false;
  // Push in whatever direction we are already moving (default to + at rest), so
  // clicking continues and speeds up the current spin rather than fighting it.
  const cur = Math.abs(vel) >= Math.abs(targetVel) ? vel : targetVel;
  const dir = cur === 0 ? 1 : Math.sign(cur);
  targetVel = Math.max(-VEL_MAX, Math.min(VEL_MAX, targetVel + boost * dir));
  if (animRAF === null) {
    lastFrame = null;
    animRAF = requestAnimationFrame(animate);
  }
}
// Drag state (declared before the click handler, which ignores a click that
// was really the end of a drag).
const SCRUB = 0.0015; // tAnim units per CSS pixel dragged (lower = less reactive)
let pressing = false;
let didDrag = false;
let canScrub = false;  // the press started on a line, so a drag may scrub
let pressOnUI = false; // the press started on the menu/controls
let dragLastX = 0;
let dragLastY = 0;
let dragLastT = 0;
let dragVel = 0;
let dragPrevVel = 0; // spin at the moment a drag takes over (for additive flicks)
let pressOnBall = false; // the press started on the wool ball, so it toggles spin

// Every adjustable parameter behind one model: a range, a getter and a setter.
// Each gets its own labelled slider; a vertical line-drag also nudges height.
// "speed" drives the steady spin rather than the static shape.
const SPIN_SLIDE = 0.22; // how far the arch drops within the canvas in spin mode
const PARAMS = {
  height: { min: 0.18, max: 0.42, step: 0.005,
    get: () => liveArch, set: (v) => { liveArch = v; } },
  jagged: { min: 3, max: 26, step: 0.1,
    get: () => liveWobFreqBack,
    set: (v) => { liveWobFreqBack = v; fbmOctaves = Math.round(clamp(2 + (v - 3) / 23 * 4, 1, 6)); } },
  lines: { min: 8, max: 74, step: 1,
    get: () => strandsF, set: (v) => { strandsF = v; strands = Math.round(v); } },
  wobble: { min: 0.02, max: 0.24, step: 0.005,
    get: () => liveWobAmp, set: (v) => { liveWobAmp = v; } },
  thickness: { min: 0.3, max: 2.6, step: 0.05,
    get: () => lineWidthMul, set: (v) => { lineWidthMul = v; } },
  // Centre is stopped; the knob left drifts left, right drifts right.
  speed: { min: -6, max: 6, step: 0.1,
    get: () => -steadyVel,
    set: (v) => { steadyVel = -v; steady = Math.abs(v) > 0.02; if (steady) braking = false; } },
};
const paramMax = (p) => (typeof p.max === "function" ? p.max() : p.max);

// A vertical drag on the lines nudges the arch height (the most natural drag),
// and the Height slider follows.
function applyScrub(dy) {
  const p = PARAMS.height;
  const max = paramMax(p);
  const v = clamp(p.get() + (-dy) * (max - p.min) * 0.004, p.min, max);
  p.set(v);
  syncSliders();
  if (animRAF === null) render();
}

// Is the pointer over the wool ball? The ball is HTML behind the full-screen
// canvas, so it never receives events itself; hit-test its box by hand.
function isOnBall(e) {
  if (!yarnBall) return false;
  const r = yarnBall.getBoundingClientRect();
  return e.clientX >= r.left && e.clientX <= r.right &&
         e.clientY >= r.top && e.clientY <= r.bottom;
}

// Is the pointer within the arch band, anywhere between the top silhouette and
// the feet (not just on a drawn line)? Maps the x to its arch column and checks
// the y against that column's top and the foot line.
function isInBand(e) {
  if (!bandTop) return false;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (x < 0 || x > rect.width || y < 0 || y > rect.height) return false;
  const cosv = clamp((bandCx - x) / bandA, -1, 1);
  const s = Math.round((bandSteps * Math.acos(cosv)) / Math.PI);
  const pad = 16; // a little tolerance above the ridge and below the feet
  return y >= bandTop[s] - pad && y <= bandFootY + pad;
}
function stopMotion() {
  if (animRAF === null && vel === 0 && targetVel === 0) return;
  braking = true; // decelerate quickly to a halt rather than cutting dead
  targetVel = 0;
  if (animRAF === null) {
    lastFrame = null;
    animRAF = requestAnimationFrame(animate);
  }
}
// A press that starts on a line can scrub; any other press may be a tap. We
// decide which at let-go: a scrub leaves momentum, a tap brakes to a stop, a
// cancelled press (e.g. a vertical scroll) does nothing.
document.addEventListener("pointerdown", (e) => {
  if (reduceMotion) return;
  pressing = true;
  didDrag = false;
  pressOnBall = isOnBall(e);
  if (pressOnBall) nudgeBall(); // immediate feedback, even on a touch that scrolls
  pressOnUI = !!e.target.closest(".menu, .menu-backdrop, .hamburger, .levers, .scrub-pick");
  // A scrub may begin anywhere inside the experiment, or on a line otherwise.
  canScrub = !pressOnBall && !pressOnUI && (experiment || isInBand(e));
  dragLastX = e.clientX;
  dragLastY = e.clientY;
  dragLastT = e.timeStamp;
});
document.addEventListener("pointermove", (e) => {
  if (!pressing || !canScrub) return;
  const dx = e.clientX - dragLastX;
  const dy = e.clientY - dragLastY;
  if (!didDrag) {
    if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) return; // ignore jitter
    didDrag = true;
    braking = false;
  }
  const dt = Math.max(0.008, (e.timeStamp - dragLastT) / 1000);
  // Horizontal push spins the flywheel: the drag imparts speed. Pushing faster
  // (or the other way) changes the spin; pushing slower in the same direction
  // never brakes it, so "keep pushing" keeps it going, like a roundabout. The
  // loop moves the pattern at this speed, so we don't shift it directly here.
  const fv = Math.max(-VEL_MAX, Math.min(VEL_MAX, (-dx / dt) * SCRUB));
  if (Math.sign(fv) !== Math.sign(vel) || Math.abs(fv) > Math.abs(vel)) {
    if (experiment && Math.abs(dx) > 2) steady = false; // a manual grab takes over Play
    vel = fv;
  }
  targetVel = vel;
  // Vertical drag reshapes the mountains, but only inside the experiment.
  if (experiment) applyScrub(dy);
  dragLastX = e.clientX;
  dragLastY = e.clientY;
  dragLastT = e.timeStamp;
  if (vel !== 0 && animRAF === null) {
    lastFrame = null;
    animRAF = requestAnimationFrame(animate);
  }
});
function endPress(deliberate) {
  if (!pressing) return;
  pressing = false;
  if (pressOnUI || didDrag) return; // scrub keeps coasting; UI is not ours
  if (pressOnBall) {                // a full tap on the ball opens or closes the play mode
    if (deliberate) experiment ? exitSpin() : navigate("spin"); // (a scroll does not)
    return;
  }
  if (experiment) return;           // bare taps inside the experiment do nothing
  // On the normal site a tap on the mountains toggles the drift: start it from
  // a near standstill, stop it when it is already moving.
  if (deliberate) {
    const speed = Math.max(Math.abs(vel), Math.abs(targetVel));
    if (speed > 0.3) stopMotion();
    else startAnim(LOAD_BOOST);
  }
}
document.addEventListener("pointerup", () => endPress(true));
document.addEventListener("pointercancel", () => endPress(false));

// ---- experiment ("Spin") play mode -----------------------------------------
// The /spin route drives this through showRoute. Opening it locks the page to
// the mountains and reveals the control panel. Closing keeps whatever shape was
// made and lets the spin coast to a halt.
function setExperiment(on) {
  if (experiment === on) return;
  experiment = on;
  document.body.classList.toggle("experiment", on);
  strandScale = on ? 0.45 : 1; // shorter dangling strands while playing
  setSlide(on ? SPIN_SLIDE : 0); // drop the arch down within the canvas
  if (on) {
    nudgeBall();
    PARAMS.speed.set(-1.2); // start with a slow drift to the left
    braking = false;
    syncSliders();          // reflect the speed (and shape) on the panel
    if (animRAF === null) { lastFrame = null; animRAF = requestAnimationFrame(animate); }
  } else {
    steady = false;     // drop the held speed
    stopMotion();       // coast gently to a stop, keeping the new shape
  }
  if (animRAF === null) render(); // reflect the strand change if not animating
}
// Ease the arch's drop in and out. Done in JS (re-rendering) rather than a CSS
// transform so the peak is drawn within the canvas and never clipped at the
// top. On the very first paint it snaps, so a direct load of /spin shows the
// arch already dropped without sliding.
let slideTarget = 0;
let slideRAF = null;
let firstPaint = true;
function tweenSlide() {
  slideFrac += (slideTarget - slideFrac) * 0.06; // ~1s ease at 60fps
  const done = Math.abs(slideTarget - slideFrac) < 0.001;
  if (done) { slideFrac = slideTarget; slideRAF = null; }
  else slideRAF = requestAnimationFrame(tweenSlide);
  if (animRAF === null) render(); // the spin loop already repaints when running
}
function setSlide(target) {
  slideTarget = target;
  if (firstPaint) { slideFrac = target; return; } // no slide on initial load
  if (slideRAF === null) slideRAF = requestAnimationFrame(tweenSlide);
}
// Stop drifting and return the speed slider to its centre.
function stopSpin() {
  steadyVel = 0;
  steady = false;
  stopMotion(); // coast gently to a halt
  syncSliders();
}
function resetShape() {
  liveArch = CFG.arch;
  liveWobAmp = CFG.wobAmp;
  liveWobFreqBack = CFG.wobFreqBack;
  fbmOctaves = CFG.octaves;
  strandsF = CFG.strands;
  strands = CFG.strands;
  lineWidthMul = 1;
  stopSpin();
  if (animRAF === null) render();
}

// Desktop hover, hit-tested by hand because the canvas sits over everything:
// over the ball, nudge it once on entry and show a pointer cursor; over a
// ridge line, show a grab cursor; otherwise default. Gated to real hover
// devices so a touch (answered with a synthetic mousemove by some browsers)
// never triggers it.
const canHover = window.matchMedia("(hover: hover)").matches;
let ballHovering = false;
if (canHover) {
  document.addEventListener("mousemove", (e) => {
    const overBall = isOnBall(e); // cheap rect test, run every move for snappy hover
    if (overBall !== ballHovering) {
      ballHovering = overBall;
      if (overBall) nudgeBall();
    }
    canvas.style.cursor = overBall ? "pointer" : isInBand(e) ? "grab" : "default";
  });
}

// Nudge the ball on first scroll-into-view (it can start below the fold on a
// short mobile viewport); maybeIntroNudge only fires once the spin has settled.
if (yarnBall && "IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) {
        ballVisible = true;
        maybeIntroNudge();
      }
    }
  }, { threshold: 0.6 });
  io.observe(yarnBall);
} else {
  ballVisible = true;
}

// Control panel: one labelled slider per parameter, plus the transport.
const rangeEls = document.querySelectorAll(".exp-range");
// Push the model values out to every slider (ranges and current positions).
function syncSliders() {
  rangeEls.forEach((el) => {
    const p = PARAMS[el.dataset.param];
    el.min = p.min;
    el.max = paramMax(p);
    el.step = p.step;
    el.value = p.get();
  });
}
rangeEls.forEach((el) => {
  const key = el.dataset.param;
  el.addEventListener("input", () => {
    PARAMS[key].set(parseFloat(el.value));
    el.value = PARAMS[key].get(); // snap back if the value was capped
    if (key === "wobble") syncSliders(); // ripple height changes the height cap
    if (key === "speed") {
      if (steady && animRAF === null) { lastFrame = null; animRAF = requestAnimationFrame(animate); }
    } else if (animRAF === null) {
      render();
    }
  });
});
document.getElementById("exp-stop")?.addEventListener("click", stopSpin);
document.getElementById("exp-reset")?.addEventListener("click", resetShape);
document.getElementById("exp-done")?.addEventListener("click", exitSpin);
syncSliders();

// ---- single-page-app router ------------------------------------------------
// Path-based routes, all served by this one page (the deploy copies index.html
// into each route folder). Clicks on internal links push history and swap the
// visible subpage without a reload; back/forward and direct loads both work.
const ROUTES = ["", "apricity", "about", "spin", "hunt", "gallery"];
const BASE = new URL(".", document.currentScript?.src || location.href).pathname;
let prevRoute = "";
function routeFromPath() {
  let r = decodeURIComponent(location.pathname);
  if (r.startsWith(BASE)) r = r.slice(BASE.length);
  r = r.replace(/^\/+|\/+$/g, "");
  if (r === "" || ROUTES.includes(r)) return r;
  return "404"; // unknown path: show the not-found subpage
}
function showRoute(route) {
  setMenu(false);
  document.body.dataset.route = route;
  document.querySelectorAll(".subpage").forEach((el) =>
    el.classList.toggle("is-active", (el.dataset.route || "") === route));
  document.querySelectorAll("a[data-route]").forEach((a) =>
    a.classList.toggle("is-current", a.dataset.route === route));
  setExperiment(route === "spin");
  if (route !== "spin") {
    prevRoute = route;       // remember where to return when leaving /spin
    window.scrollTo(0, 0);
  }
}
function navigate(route, push = true) {
  if (!ROUTES.includes(route)) route = "";
  if (push) history.pushState({ route }, "", BASE + route);
  showRoute(route);
}
function exitSpin() { navigate(prevRoute || ""); }
window.addEventListener("popstate", () => showRoute(routeFromPath()));
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-route]");
  if (!a) return;
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  navigate(a.dataset.route);
});
// Give each nav link its real URL so copy-link and open-in-new-tab work.
document.querySelectorAll("a[data-route]").forEach((a) => {
  a.setAttribute("href", BASE + a.dataset.route);
});

window.addEventListener("resize", resize);
resize();
startAnim(LOAD_BOOST);
showRoute(routeFromPath()); // render the subpage for the URL we loaded on
// Enable the arch slide transition only after the first paint, so loading
// straight into /spin shows it already settled rather than sliding on load.
requestAnimationFrame(() => { firstPaint = false; });
