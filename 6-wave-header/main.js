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
const ctx = canvas.getContext("2d", { alpha: true });
const hero = document.getElementById("hero");

// Foot line of the arc, as a fraction of hero height. Drives where the
// mountains sit and where the content fade lands. The arc-y lever moves it.
let ARC_Y = 0.38; // around the bottom of the top third

// Two debug guides framing the content fade (remove before launch). The lower
// guide is where body content starts fading; the upper guide is where it is
// completely gone. Each has its own lever; both hide with one toggle (or
// ?guide=0). Pink so they read as scaffolding.
let GUIDE_Y = 0.30;  // lower line: fade starts here
let GUIDE2_Y = 0.22; // upper line: content fully gone above here
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
let lineScale = 1;        // thins every stroke on narrow screens (set in resize)
let archScale = 1;        // flattens the arch on narrow screens (set in resize)
let wobScale = 1;         // more ridge ripples on narrow screens (set in resize)
let fbmOctaves = CFG.octaves; // more jagged detail on narrow screens

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

  const footY = H * footYfrac;
  const xL = W * footLfrac;
  const xR = W * footRfrac;
  const cx = (xL + xR) / 2;
  const a = (xR - xL) / 2; // horizontal radius, fixed -> both feet are points
  const wobPx = H * CFG.wobAmp;
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
    const archH = H * CFG.arch * archScale;
    const bow = lerp(archH * CFG.bowRatio, archH, Math.pow(q, CFG.bowEase));
    // Front ridges (low q) drawn thicker; back ridges thinner.
    ctx.lineWidth = lerp(CFG.lineWidth, CFG.lineWidthBack, q) * lineScale;
    // Front ridges roll in few long swells; back ridges break into more
    // ripples, like waves stacking out to sea.
    const wf = lerp(CFG.wobFreqFront, CFG.wobFreqBack, q) * wobScale;

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const env = Math.sin(Math.PI * t);
      const baseY = footY - bow * env;
      const wob = fbm(t * wf, i * CFG.rowOffset) * wobPx * env;
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

  // Loose strands thinning out and fading from each foot: long on the left,
  // short on the right.
  drawStrand(xL, footY, 0.4, ink, 0.46, 0.024);
  drawStrand(xR, footY, 2.1, ink, 0.13, 0.008);

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
  // The render is static, so a higher pixel ratio costs nothing at runtime and
  // keeps the thin lines crisp on 3x phone screens.
  dpr = Math.min(window.devicePixelRatio || 1, 3);
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
  fbmOctaves = CFG.octaves;
  strands = CFG.strands;
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
if (saved) {
  root.setAttribute("data-theme", saved);
} else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
  root.setAttribute("data-theme", "light");
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

const toggle = document.getElementById("theme-toggle");
if (toggle) {
  toggle.addEventListener("click", () => {
    const next =
      root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("yarnitti-theme", next);
    render();
  });
}
// ---- temporary tuning levers (remove before launch) ----------------------

const leverHeading = document.getElementById("lever-heading");
const outHeading = document.getElementById("out-heading");
if (leverHeading) {
  leverHeading.addEventListener("input", () => {
    root.style.setProperty("--heading-top", `${leverHeading.value}vh`);
    if (outHeading) outHeading.textContent = leverHeading.value;
  });
}

const leverArch = document.getElementById("lever-arch");
const outArch = document.getElementById("out-arch");
if (leverArch) {
  leverArch.addEventListener("input", () => {
    CFG.arch = parseFloat(leverArch.value);
    if (outArch) outArch.textContent = leverArch.value;
    render();
  });
}

function wireLever(id, outId, fn, fmt) {
  const el = document.getElementById(id);
  const out = document.getElementById(outId);
  if (!el) return;
  el.addEventListener("input", () => {
    fn(el.value);
    if (out) out.textContent = fmt ? fmt(el.value) : el.value;
  });
}

// arc y: move the arc (foot line) up or down, independent of the guide.
wireLever("lever-arcy", "out-arcy", (v) => {
  ARC_Y = parseFloat(v);
  footYfrac = ARC_Y;
  render();
}, (v) => parseFloat(v).toFixed(2));

// line: move both pink guides together, keeping the fade margin between them.
const line2El = document.getElementById("lever-line2");
const out2El = document.getElementById("out-line2");
wireLever("lever-line", "out-line", (v) => {
  const gap = GUIDE_Y - GUIDE2_Y; // preserve the current fade margin
  GUIDE_Y = parseFloat(v);
  GUIDE2_Y = GUIDE_Y - gap;
  root.style.setProperty("--foot-pct", (GUIDE_Y * 100).toFixed(1) + "%");
  root.style.setProperty("--gone-pct", (GUIDE2_Y * 100).toFixed(1) + "%");
  if (line2El) line2El.value = GUIDE2_Y.toFixed(2);
  if (out2El) out2El.textContent = GUIDE2_Y.toFixed(2);
  render();
}, (v) => parseFloat(v).toFixed(2));

// line 2: upper pink guide alone, which sets the fade margin (the gap to line).
wireLever("lever-line2", "out-line2", (v) => {
  GUIDE2_Y = parseFloat(v);
  root.style.setProperty("--gone-pct", (GUIDE2_Y * 100).toFixed(1) + "%");
  render();
}, (v) => parseFloat(v).toFixed(2));

// fold: hero height (vh); resize so the canvas refits.
wireLever("lever-fold", "out-fold", (v) => {
  root.style.setProperty("--hero-h", `${v}vh`);
  resize();
});
// space: gap between the tagline and the body (rem); 0 = tight to heading.
wireLever("lever-space", "out-space", (v) => {
  root.style.setProperty("--body-gap", `${v}rem`);
});
// body: body text size scale.
wireLever("lever-body", "out-body", (v) => {
  root.style.setProperty("--body-scale", v);
}, (v) => parseFloat(v).toFixed(2));

// guide toggle: show or hide the pink debug line.
const guideBtn = document.getElementById("lever-guide");
if (guideBtn) {
  const syncGuideBtn = () => {
    guideBtn.textContent = SHOW_GUIDE ? "hide line" : "show line";
    guideBtn.setAttribute("aria-pressed", String(SHOW_GUIDE));
  };
  syncGuideBtn();
  guideBtn.addEventListener("click", () => {
    SHOW_GUIDE = !SHOW_GUIDE;
    syncGuideBtn();
    render();
  });
}

// body font picker (temporary). Cycle the lead and prose through candidate
// body fonts. ?bodyfont=N preselects one. Remove before launch.
const BODY_FONTS = [
  { name: "Fraunces", css: '"Fraunces", Georgia, serif' },
  { name: "Newsreader", css: '"Newsreader", Georgia, serif' },
  { name: "Lora", css: '"Lora", Georgia, serif' },
  { name: "Vollkorn", css: '"Vollkorn", Georgia, serif' },
  { name: "Bitter", css: '"Bitter", Georgia, serif' },
  { name: "EB Garamond", css: '"EB Garamond", Georgia, serif' },
  { name: "Spectral", css: '"Spectral", Georgia, serif' },
  { name: "Nunito", css: '"Nunito", system-ui, sans-serif' },
  { name: "Mulish", css: '"Mulish", system-ui, sans-serif' },
  { name: "Hanken Grotesk", css: '"Hanken Grotesk", system-ui, sans-serif' },
  { name: "Karla", css: '"Karla", system-ui, sans-serif' },
  { name: "DM Sans", css: '"DM Sans", system-ui, sans-serif' },
  { name: "Mali", css: '"Mali", Georgia, serif' },
  { name: "Coming Soon", css: '"Coming Soon", Georgia, serif' },
  { name: "Itim", css: '"Itim", system-ui, sans-serif' },
  { name: "Chilanka", css: '"Chilanka", system-ui, sans-serif' },
  { name: "Klee One", css: '"Klee One", Georgia, serif' },
  { name: "Andika", css: '"Andika", system-ui, sans-serif' },
];
const bodyOut = document.getElementById("out-bodyfont");
let bodyIdx = 12; // Mali (the chosen body font)
function applyBodyFont() {
  const f = BODY_FONTS[bodyIdx];
  root.style.setProperty("--body-font", f.css);
  if (bodyOut) bodyOut.textContent = f.name;
}
const bodyParam = parseInt(params.get("bodyfont") || "", 10);
if (Number.isInteger(bodyParam) && bodyParam >= 0 && bodyParam < BODY_FONTS.length) {
  bodyIdx = bodyParam;
}
const stepBody = (d) => {
  bodyIdx = (bodyIdx + d + BODY_FONTS.length) % BODY_FONTS.length;
  applyBodyFont();
};
document.getElementById("bodyfont-prev")?.addEventListener("click", () => stepBody(-1));
document.getElementById("bodyfont-next")?.addEventListener("click", () => stepBody(1));
applyBodyFont();

// reset: restore every lever to its default and replay its handler.
const LEVER_DEFAULTS = {
  "lever-heading": isMobile ? "24" : "28",
  "lever-arch": "0.26",
  "lever-arcy": "0.38",
  "lever-line": "0.30",
  "lever-line2": "0.22",
  "lever-fold": "70",
  "lever-space": "9",
  "lever-body": "1",
};
const resetBtn = document.getElementById("lever-reset");
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    for (const [id, value] of Object.entries(LEVER_DEFAULTS)) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.value = value;
      el.dispatchEvent(new Event("input"));
    }
  });
}

// On mobile the wordmark rests higher, so show 24 on the heading slider.
if (isMobile) {
  const lh = document.getElementById("lever-heading");
  const oh = document.getElementById("out-heading");
  if (lh) lh.value = "24";
  if (oh) oh.textContent = "24";
}

window.addEventListener("resize", resize);
resize();
