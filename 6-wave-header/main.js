/*
 * yarnitti — animated wave header and single-page app
 *
 * A horseshoe arch of woven strands drawn on a canvas. Each strand runs from a
 * sharp point at the left foot, up and over in a wavy ridge, down to a sharp
 * point at the right foot. Wobble falls to zero at the feet so every strand
 * converges to the same two points. Thin lines that invert with the page
 * theme.
 *
 * The arch animates: it spins on load and on clicks, and the /spin route opens
 * a play mode where sliders and drags reshape it. This file also holds the
 * path-based router, the theme toggle, the slide-out menu, and the gallery
 * lightbox.
 *
 * No dependencies. Hand-rolled seeded value noise.
 */

const CFG = {
  seed: 36170,        // from the tinkersynth Slopes panel
  strands: 34,        // line count, from the panel
  steps: 300,         // samples along each arch

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
const ARC_Y = 0.38; // around the bottom of the top third

// Where the scrolling body text dissolves into the arch, as fractions of hero
// height. Fed into --foot-pct / --gone-pct (see resize), which drive the fade
// gradient in style.css: the text starts fading at FADE_START and is fully
// gone by FADE_END above it.
const FADE_START = 0.37; // body content starts fading here
const FADE_END = 0.29;   // content fully gone above here

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
let footLfrac = CFG.footL, footRfrac = CFG.footR;
let tAnim = 0;            // animated noise offset (load / click intro motion)
let lineScale = 1;        // thins every stroke on narrow screens (set in resize)
let archScale = 1;        // flattens the arch on narrow screens (set in resize)
let wobScale = 1;         // more ridge ripples on narrow screens (set in resize)
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

  // On the normal site the wordmark sits in the arch opening, so cap the shown
  // height there to keep the arch above it; the spin playground shows the full
  // (kept) height. The stored value is untouched, so it returns intact in spin.
  // Tie the landing<->spin difference to how far the arch has slid (0 on the
  // landing page, 1 once fully dropped into spin), so both the capped height and
  // the strand length ease across that span in step with the slide rather than
  // snapping the instant spin mode toggles.
  const spinProgress = SPIN_SLIDE > 0
    ? clamp(slideFrac / SPIN_SLIDE, 0, 1)
    : (experiment ? 1 : 0);
  const archEff = lerp(Math.min(liveArch, LANDING_ARCH_MAX), liveArch, spinProgress);
  // The feet sit at their base height plus the spin-mode drop, but never so
  // high that the peak (bow + ripples) would clip at the canvas top: a tall
  // arch pushes the whole thing down just enough to stay on screen.
  const baseFoot = ARC_Y + slideFrac;
  const fitFoot = archEff + liveWobAmp + 0.04;
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
    const backBow = H * archEff * archScale;
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
  // Foot strands shorten as the arch drops into spin, easing with the slide.
  const strandScale = lerp(1, 0.45, spinProgress);
  drawStrand(xL, footY, 0.4, ink, 0.46 * strandScale, 0.024);
  drawStrand(xR, footY, 2.1, ink, 0.13 * strandScale, 0.008);
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
  // A layout thrash (toggling overflow on route change, the mobile URL bar
  // animating, or a device-mode viewport recalculation) can hand back a
  // transient near-zero rect. Keep the last good size rather than rendering the
  // arch into a tiny top-left corner; the next real resize corrects it.
  if (r.width < 50 || r.height < 50) return;
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
  lineScale = small ? 0.6 : 1;
  archScale = 1;
  wobScale = 1;
  strands = Math.round(strandsF); // keep any scrubbed line count across resizes
  steps = Math.max(360, Math.round(0.85 * W));

  // Drive the body-text fade gradient: it starts fading at FADE_START and is
  // fully gone by FADE_END above it.
  root.style.setProperty("--foot-pct", (FADE_START * 100).toFixed(1) + "%");
  root.style.setProperty("--gone-pct", (FADE_END * 100).toFixed(1) + "%");
  render();
}

// ---- theme toggle ----------------------------------------------------------

const root = document.documentElement;
const saved = localStorage.getItem("yarnitti-theme");
// Follow a saved choice if there is one, otherwise default to dark. A manual
// toggle is remembered, so a returning visitor keeps whatever they picked.
root.setAttribute("data-theme", saved || "dark");

// Prototyping overrides: ?theme=light&scrollto=N
const params = new URLSearchParams(location.search);
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
// Wire every theme toggle (the drawer's and the wide-screen header's).
document.querySelectorAll(".js-theme").forEach((b) =>
  b.addEventListener("click", toggleTheme));

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

// sound toggle (placeholder; no audio wired yet). Keep every sound button (the
// drawer's and the header's) in sync.
const soundButtons = document.querySelectorAll(".js-sound");
soundButtons.forEach((b) =>
  b.addEventListener("click", () => {
    const on = b.getAttribute("aria-pressed") !== "true";
    soundButtons.forEach((x) => x.setAttribute("aria-pressed", String(on)));
  }));

// ---- intro motion -----------------------------------------------------------
// On load (and on every click on the mountains) the ridges undulate, then
// decelerate to a standstill within 7 seconds. Each run continues from the
// current offset so a mid-run click never snaps.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TAU = 1.5;          // seconds; how long the spin coasts (long, like a roundabout)
const ACCEL = 1.0;        // how fast actual speed chases the target (lower = gentler ramp)
const LOAD_BOOST = 1.9;   // kick added on first load and on each click
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
// The home wordmark and every subpage carry their own wool ball, but only the
// active page's is on screen. Track them all so a tap or nudge always lands on
// the visible one, not just the first in the document.
const yarnBalls = Array.from(document.querySelectorAll(".yarn-ball"));
const yarnDividers = yarnBalls.map((b) => b.closest(".yarn-divider")).filter(Boolean);
const hamburger = document.querySelector(".hamburger");
[...yarnDividers, hamburger].forEach((el) =>
  el?.addEventListener("animationend", () => el.classList.remove("nudge")));
// The ball currently displayed. The balls are <svg> elements, which do not
// expose offsetParent, so test the measured box instead: a ball on a hidden
// subpage (display:none) measures 0x0, the visible one has real dimensions.
function visibleBall() {
  return yarnBalls.find((b) => {
    const r = b.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }) || null;
}
const yarnBall = yarnBalls[0]; // the home ball: drives the one-time intro nudge
function nudgeBall() {
  if (reduceMotion) return;
  visibleBall()?.closest(".yarn-divider")?.classList.add("nudge");
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
let pressOnBall = false; // the press started on the wool ball, so it toggles spin
let pressOnLine = false; // the press landed on a drawn line, so it drives the spin
let pressInBand = false; // the press landed anywhere on the arch band

// Every adjustable parameter behind one model: a range, a getter and a setter.
// Each gets its own labelled slider; a vertical line-drag also nudges height.
// "speed" drives the steady spin rather than the static shape.
const SPIN_SLIDE = 0.22; // how far the arch drops within the canvas in spin mode
// Tallest arch shown on the normal (non-spin) site. Keep it low enough that the
// arch fits above ARC_Y without the fit-foot push lowering the feet onto the
// wordmark: LANDING_ARCH_MAX + the default wobAmp + the 0.04 top margin must
// stay at or below ARC_Y (0.25 + 0.09 + 0.04 = 0.38 = ARC_Y). A taller cap
// pushes the feet past ARC_Y, and the arch covers the heading at desktop widths.
const LANDING_ARCH_MAX = 0.25;
const PARAMS = {
  height: { min: 0.18, max: 0.48, step: 0.005,
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
  reflectSlider("height"); // cheap single-slider update, not a full syncSliders
  if (animRAF === null) render();
}

// Is the pointer over the wool ball? The ball is HTML behind the full-screen
// canvas, so it never receives events itself; hit-test its box by hand.
function isOnBall(e) {
  const ball = visibleBall();
  if (!ball) return false;
  const r = ball.getBoundingClientRect();
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
// Is the pointer on an actual drawn line (the horseshoe strokes), rather than
// the empty space inside or around it? The canvas is transparent except where
// the lines are painted, so sample the pixel alpha in a small neighbourhood of
// the click: any opaque pixel means a line is under the pointer. This is what
// lets a tap on the wordmark text or a photo fall through while a tap on the
// lines still drives the spin.
function isOnLine(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return false;
  const dpr = canvas.width / rect.width;
  // Generous tolerance so the dense tangle of strands near the top reads as one
  // interactive region: the small gaps between lines are bridged, while the open
  // centre and the wordmark (well clear of any stroke) stay non-interactive.
  const reach = Math.max(2, Math.round(13 * dpr));
  const px = Math.round(x * dpr);
  const py = Math.round(y * dpr);
  const x0 = Math.max(0, px - reach);
  const y0 = Math.max(0, py - reach);
  const w = Math.min(canvas.width - x0, reach * 2 + 1);
  const h = Math.min(canvas.height - y0, reach * 2 + 1);
  if (w <= 0 || h <= 0) return false;
  const data = ctx.getImageData(x0, y0, w, h).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 24) return true; // a non-transparent pixel: a line is here
  }
  return false;
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
  // Menu, controls, and any interactive content (links, buttons, the gallery
  // grid, the lightbox) own their own clicks; the spin never steals them.
  pressOnUI = !!e.target.closest(
    ".menu, .menu-backdrop, .hamburger, .scrub-pick, " +
    ".gallery-grid, .lightbox, a, button, input, label, select, textarea");
  pressOnLine = !pressOnBall && !pressOnUI && isOnLine(e);
  // While the arch is already drifting, a click anywhere on the band stops it
  // (the lines sweep, so a pixel-perfect line hit would be hard to land).
  pressInBand = !pressOnBall && !pressOnUI && isInBand(e);
  // A scrub may begin anywhere inside the experiment, or on a line otherwise.
  canScrub = !pressOnBall && !pressOnUI && (experiment || pressOnLine);
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
  // A narrow screen has far fewer CSS pixels to drag across, so the same flick
  // imparts less speed than on desktop. Scale sensitivity up as the viewport
  // narrows (no change at desktop widths) so the scrub feels the same on mobile.
  const wScale = Math.max(1, 1100 / window.innerWidth);
  const fv = Math.max(-VEL_MAX, Math.min(VEL_MAX, (-dx / dt) * SCRUB * wScale));
  if (experiment) {
    // In play mode a horizontal scrub sets the speed and the Speed slider
    // follows. Low-pass the target so frame-to-frame jitter in fv does not make
    // the slider (or spin) jumpy, and drive vel directly so it stays responsive
    // rather than easing in slowly. A near-vertical drag leaves the spin
    // untouched so it can reshape the height without stopping.
    if (Math.abs(dx) > 2) {
      steadyVel += (fv - steadyVel) * 0.4;
      vel = steadyVel;
      steady = true;        // hold the scrubbed speed after release
      reflectSlider("speed"); // cheap single-slider update, no per-move syncSliders
    }
  } else if (Math.sign(fv) !== Math.sign(vel) || Math.abs(fv) > Math.abs(vel)) {
    vel = fv; // flywheel: a push only ever adds speed on the normal site
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
  if (!deliberate) return;
  // On the normal site a tap on the mountains toggles the drift. While it is
  // already moving, a tap anywhere on the band stops it (the lines sweep, so a
  // pixel-perfect line hit is hard to land). At rest, only a tap on a line
  // starts it, so taps on the wordmark or empty space select text or do nothing.
  const speed = Math.max(Math.abs(vel), Math.abs(targetVel));
  if (speed > 0.3) {
    if (pressInBand) stopMotion();
  } else if (pressOnLine) {
    startAnim(LOAD_BOOST);
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
  // Mirror the class on <html> too: in spin mode the body has no flow content,
  // so touches land on the root element and its touch-action is what governs
  // whether the browser steals the gesture from the scrub.
  document.documentElement.classList.toggle("experiment", on);
  setSlide(on ? SPIN_SLIDE : 0); // drop the arch down within the canvas
  if (on) {
    setCollapsed(false);    // always open the panel expanded
    nudgeBall();
    PARAMS.speed.set(-1.2); // start with a slow drift to the left
    braking = false;
    syncSliders();          // reflect the speed (and shape) on the panel
    if (animRAF === null) { lastFrame = null; animRAF = requestAnimationFrame(animate); }
  } else {
    // Leave spin mode still drifting: release the held speed but do not brake,
    // so the arch keeps its current speed and coasts down on the long natural
    // friction (TAU) rather than stopping short.
    steady = false;
    braking = false;
    targetVel = vel;
    if (animRAF === null && vel !== 0) { lastFrame = null; animRAF = requestAnimationFrame(animate); }
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
    // The canvas is pointer-events: none and the body has no box over the
    // mountains, so the hovered element there is the root <html>. Set the cursor
    // on it (descendants inherit, and keep their own where it matters). This
    // runs only on hover devices, so it never affects touch. Let the control
    // panel and menu keep their own cursors; show a grab while dragging; in spin
    // mode the whole backdrop scrubs so grab everywhere; otherwise grab over the
    // arch band, and clear elsewhere so text keeps its I-beam.
    let cursor;
    if (e.target.closest(".scrub-pick, .menu, .menu-backdrop, .hamburger, .topnav, .spin-close")) {
      cursor = "";
    } else if (pressing && canScrub && didDrag) {
      cursor = "grabbing";
    } else if (overBall) {
      cursor = "pointer";
    } else if (experiment || isInBand(e)) {
      // isInBand is a cheap geometric test; avoid the per-move getImageData that
      // isOnLine would do, which made dragging laggy.
      cursor = "grab";
    } else {
      cursor = "";
    }
    document.documentElement.style.cursor = cursor;
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
const sliderByParam = {};
rangeEls.forEach((el) => { sliderByParam[el.dataset.param] = el; });
// Update a single slider's position cheaply (one DOM write). Use this during a
// scrub instead of syncSliders, which rewrites every slider's min/max/step/value
// each move and janks the drag on mobile.
function reflectSlider(param) {
  const el = sliderByParam[param];
  if (el) el.value = PARAMS[param].get();
}
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
document.getElementById("spin-close")?.addEventListener("click", exitSpin);
// Collapse arrow: slide the control panel down to just the chevron, and back.
const scrubPick = document.querySelector(".scrub-pick");
const scrubCollapse = document.getElementById("scrub-collapse");
function setCollapsed(collapsed) {
  scrubPick?.classList.toggle("is-collapsed", collapsed);
  scrubCollapse?.setAttribute("aria-expanded", String(!collapsed));
  scrubCollapse?.setAttribute("aria-label", collapsed ? "Show controls" : "Hide controls");
}
scrubCollapse?.addEventListener("click", () =>
  setCollapsed(!scrubPick.classList.contains("is-collapsed")));
syncSliders();

// ---- single-page-app router ------------------------------------------------
// Path-based routes, all served by this one page (the deploy copies index.html
// into each route folder). Clicks on internal links push history and swap the
// visible subpage without a reload; back/forward and direct loads both work.
// Keep this list in sync with serve.py (ROUTES) and .github/workflows/pages.yml
// (the fan-out loop); a new route must be added in all three or its deep link
// 404s in one environment but not another.
const ROUTES = ["", "apricity", "about", "spin", "gallery", "contact"];
const BASE = new URL(".", document.currentScript?.src || location.href).pathname;
let prevRoute = "";
let routeInited = false; // skip the nav nudge on the first (load-time) showRoute
let navDir = 1;          // flips each switch so repeated navigation sways

// A gentle sideways drift when moving between subpages, so the arch acknowledges
// the change without the full load spin. Alternate the direction each switch so
// back-and-forth navigation sways rather than building up one-way speed. Honour
// reduced motion (the whole intro/spin system is already gated on it).
const NAV_NUDGE = 1.2; // peak target speed of the per-switch drift
function navNudge() {
  if (reduceMotion) return;
  navDir = -navDir;
  braking = false;
  steady = false;
  targetVel = NAV_NUDGE * navDir; // friction (TAU) eases it back to a standstill
  if (animRAF === null) {
    lastFrame = null;
    animRAF = requestAnimationFrame(animate);
  }
}
function routeFromPath() {
  let r = decodeURIComponent(location.pathname);
  if (r.startsWith(BASE)) r = r.slice(BASE.length);
  // Lowercase so a printed QR code in any case (e.g. /APRICITY) resolves to the
  // canonical lowercase route rather than falling through to the 404 subpage.
  r = r.replace(/^\/+|\/+$/g, "").toLowerCase();
  if (r === "" || ROUTES.includes(r)) return r;
  return "404"; // unknown path: show the not-found subpage
}
function showRoute(route) {
  const fromRoute = document.body.dataset.route || "";
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
  // Nudge the mountains on a real switch between subpages. Skip the first paint
  // (the load spin already runs), the /spin route (it drives its own motion),
  // and leaving /spin (exitSpin keeps the arch coasting).
  if (routeInited && route !== "spin" && fromRoute !== "spin" && route !== fromRoute) {
    navNudge();
  }
  routeInited = true;
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

// ---- gallery lightbox ----
// Click a thumbnail to enlarge its full-size photo. Close with the X, the
// backdrop, or Escape. Step between photos with the arrows, the keyboard, or
// a horizontal swipe on touch screens. The list wraps at both ends.
const galleryCells = Array.from(document.querySelectorAll(".gallery-cell"));
const gallerySrcs = galleryCells.map((c) => c.dataset.full);
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
let lightboxIndex = 0;

function showPhoto(i) {
  lightboxIndex = (i + gallerySrcs.length) % gallerySrcs.length;
  lightboxImg.src = gallerySrcs[lightboxIndex];
}
function openLightbox(i) {
  if (!lightbox) return;
  showPhoto(i);
  lightbox.classList.add("is-open");
  lightbox.inert = false; // allow focus in; inert (not aria-hidden) avoids
                          // hiding the focused close button from assistive tech
  document.body.classList.add("lb-open");
}
function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove("is-open");
  lightbox.inert = true; // moves focus off the close button as it hides
  document.body.classList.remove("lb-open");
}
const lightboxOpen = () => lightbox?.classList.contains("is-open");

galleryCells.forEach((cell, i) =>
  cell.addEventListener("click", () => openLightbox(i)));
document.getElementById("lightbox-close")?.addEventListener("click", closeLightbox);
document.getElementById("lightbox-prev")?.addEventListener("click", () => showPhoto(lightboxIndex - 1));
document.getElementById("lightbox-next")?.addEventListener("click", () => showPhoto(lightboxIndex + 1));
// A click on the dark backdrop (not the image or a button) closes the viewer.
lightbox?.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (!lightboxOpen()) return;
  if (e.key === "Escape") closeLightbox();
  else if (e.key === "ArrowLeft") showPhoto(lightboxIndex - 1);
  else if (e.key === "ArrowRight") showPhoto(lightboxIndex + 1);
});
// Horizontal swipe to page between photos; ignore mostly-vertical drags.
let touchX = 0;
let touchY = 0;
lightbox?.addEventListener("touchstart", (e) => {
  touchX = e.changedTouches[0].clientX;
  touchY = e.changedTouches[0].clientY;
}, { passive: true });
lightbox?.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - touchX;
  const dy = e.changedTouches[0].clientY - touchY;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
    showPhoto(lightboxIndex + (dx < 0 ? 1 : -1));
  }
}, { passive: true });

// ---- contact form ("Say hello") --------------------------------------------
// Posts {email, message} to CONTACT_ENDPOINT. The backend is yours to wire: a
// Google Apps Script web app that appends a row to a Sheet and emails a
// notification is the cheapest path (see design/contact-backend.md). Set its
// "/exec" URL below. The POST is sent no-cors, so the row is written but the
// opaque response cannot be read; a completed request is treated as success.
// Until the URL is set, the form falls back to the visitor's mail client.
const CONTACT_ENDPOINT = ""; // e.g. "https://script.google.com/macros/s/AKfy.../exec"
const contactForm = document.getElementById("contact-form");
const contactStatus = document.getElementById("contact-status");
contactForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = contactForm.email.value.trim();
  const message = contactForm.message.value.trim();
  if (!email || !message) {
    contactStatus.textContent = "A few words and your email, and it is on its way.";
    return;
  }
  if (!CONTACT_ENDPOINT) {
    // No backend yet: hand the note to the visitor's own mail client.
    const body = encodeURIComponent(message + "\n\nFrom " + email);
    const subject = encodeURIComponent("Hello from yarnitti.org");
    window.location.href =
      "mailto:hello@yarnitti.org?subject=" + subject + "&body=" + body;
    return;
  }
  const send = contactForm.querySelector(".contact-form__send");
  send.disabled = true;
  contactStatus.textContent = "Sending…";
  try {
    const data = new FormData();
    data.append("email", email);
    data.append("message", message);
    await fetch(CONTACT_ENDPOINT, { method: "POST", mode: "no-cors", body: data });
    contactForm.reset();
    contactStatus.textContent = "Thank you, your note is on its way.";
  } catch {
    contactStatus.textContent =
      "That did not send. Please write to hello@yarnitti.org instead.";
  } finally {
    send.disabled = false;
  }
});

window.addEventListener("resize", resize);
// On mobile the visual viewport (URL bar show/hide, pinch-zoom) is the reliable
// resize signal; the window resize event can lag behind or miss it, leaving the
// canvas sized to a stale viewport.
window.visualViewport?.addEventListener("resize", resize);
resize();
startAnim(LOAD_BOOST);
showRoute(routeFromPath()); // render the subpage for the URL we loaded on
// Enable the arch slide transition only after the first paint, so loading
// straight into /spin shows it already settled rather than sliding on load.
requestAnimationFrame(() => { firstPaint = false; });
