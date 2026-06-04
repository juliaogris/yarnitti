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

  footY: 0.66,        // height of the two feet, fraction of canvas height
  footL: 0.10,        // left foot x, fraction of width
  footR: 0.90,        // right foot x

  bowMin: 0.08,       // bow height of the lowest (front) strand, fraction H
  bowMax: 0.48,       // bow height of the highest (back) strand -> tall arch
  bowEase: 1.1,       // >1 crowds strands toward the low bows

  wobAmp: 0.09,       // ridge wobble, fraction of height -> higher peaks
  wobFreq: 6.0,       // number of crests across the arch
  octaves: 4,         // higher -> more jagged ridgeline

  lineWidth: 1.1,
};

const canvas = document.getElementById("waves");
const ctx = canvas.getContext("2d", { alpha: false });
const hero = document.getElementById("hero");

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
  for (let o = 0; o < CFG.octaves; o++) {
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

function render() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = CFG.lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.globalAlpha = 1;

  const footY = H * CFG.footY;
  const xL = W * CFG.footL;
  const xR = W * CFG.footR;
  const cx = (xL + xR) / 2;
  const a = (xR - xL) / 2; // horizontal radius, fixed -> both feet are points
  const wobPx = H * CFG.wobAmp;

  // x is the same for every strand at a given step, so each step is one
  // screen column: an upper-silhouette per column gives hidden-line removal.
  const colX = new Float32Array(steps + 1);
  for (let s = 0; s <= steps; s++) {
    colX[s] = cx - a * Math.cos((Math.PI * s) / steps);
  }
  const horizon = new Float32Array(steps + 1).fill(Infinity);
  const ys = new Float32Array(steps + 1);

  // Draw front (low bow) to back (high bow). A back point is drawn only where
  // it rises above every nearer ridge, so front hills occlude the ones behind.
  for (let i = 0; i < strands; i++) {
    const q = strands > 1 ? i / (strands - 1) : 1;
    const bow = lerp(H * CFG.bowMin, H * CFG.bowMax, Math.pow(q, CFG.bowEase));

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const env = Math.sin(Math.PI * t);
      const baseY = footY - bow * env;
      const wob = fbm(t * CFG.wobFreq, i * 0.37) * wobPx * env;
      ys[s] = baseY - wob;
    }

    // Stroke only the visible runs (above the silhouette), as broken subpaths.
    let drawing = false;
    for (let s = 0; s <= steps; s++) {
      const visible = ys[s] <= horizon[s];
      if (visible) {
        if (!drawing) {
          ctx.beginPath();
          ctx.moveTo(colX[s], ys[s]);
          drawing = true;
        } else {
          ctx.lineTo(colX[s], ys[s]);
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
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = hero.getBoundingClientRect();
  W = r.width;
  H = r.height;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const small = W < 640;
  strands = small ? Math.round(CFG.strands * 0.9) : CFG.strands;
  steps = Math.max(200, Math.round((small ? 0.6 : 0.85) * W));
  render();
}

window.addEventListener("resize", resize);
resize();
