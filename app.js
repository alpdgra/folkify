/* Folkify — put "Folk" and an unreasonable number of emojis on an image.
   Everything runs client-side; nothing leaves the browser. */

/* ------------------------------------------------------------------ *
 * Emoji pools
 * ------------------------------------------------------------------ */

// The canonical Folk emoji. Weighted heavily so every render still reads
// as the meme even when the rest of the pool goes off the rails.
const ANCHOR = "😭";
const ANCHOR_CHANCE = 0.33;

// Deliberately cursed. Kept to Emoji 14.0 and earlier so nothing renders
// as a tofu box on older phones.
const POOL = [
  "😩","😫","🥹","🥺","😳","🫠","🫥","🫤","🫡","🫢","🫣","🥴","🤤","😵‍💫",
  "🤢","🤮","🥵","🥶","🤠","🥸","🧐","🤓","😈","👺","👹","🤡","👻","👽",
  "💀","☠️","🗿","🧌","🧟","🧛","🧙","🦹","🕺","🧎","🤸","🤳",
  "🫀","🫁","🧠","🦷","🦴","👁️","🫦","👅","🦵","🦶","🫶","🤌","🫰","🤙",
  "🖖","🦾","🦿",
  "🐌","🪱","🦠","🪳","🪰","🦟","🕷️","🕸️","🦂","🐍","🦎","🦖","🦕","🐊",
  "🦧","🦥","🦦","🦨","🦡","🐁","🦇","🦃","🦩","🦚","🦭","🐡","🦞","🦐",
  "🦑","🐙","🐛","🦔","🐖","🐗","🪸",
  "🍞","🧄","🧅","🥒","🫑","🍆","🥔","🫘","🥫","🍢","🍡","🧃","🧋","🍾",
  "🥠","🌭","🥓","🍳","🥚","🫗","🧂",
  "🪵","🪨","🧿","🪬","🔮","🕳️","🚬","⚰️","🪦","🚽","🪠","🧻","🧽","🪣",
  "🧴","🪒","🩹","🩺","💊","🧬","🩸","🩻","🦯","🩼","🪆","🎣","🪝","🪤",
  "🧸","🪅","🎎","🪄","🧹","🪥","🧼","🛗","🚪","🪑","🛋️","🪜","🧯","🪃",
  "🪀","🪁","🎰","🕹️","📠","☎️","📟","💾","💿","📼","🧲","🔩","⚙️","🪚",
  "🪛","🔪","🗡️","🏺","🪩","🪫","🛞","🛟","🫙","🫧",
  "‼️","⁉️","💯","🔥","✨","💫","🌪️","🈵","🉐","㊙️","🆘","⚠️","☢️","☣️",
  "🚱","🛐","♻️","🔞","📴","🈺","🅿️","🆒","🈹",
  "🌵","🪴","🍄","🪹","🪺","🌚","🌝","🌞","🪐","🛸","🎪","🎭","🃏","🀄","🧩"
];

const LAYOUT_LABELS = {
  band: "bottom band",
  banner: "top banner",
  wall: "emoji wall",
  scatter: "sticker chaos",
  sandwich: "sandwich",
  halo: "halo"
};

/* ------------------------------------------------------------------ *
 * Seeded randomness — so nudging a slider tweaks the same roll instead
 * of throwing a completely different image at you.
 * ------------------------------------------------------------------ */

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = (rng, min, max) => min + rng() * (max - min);
const rint = (rng, min, max) => Math.floor(rnd(rng, min, max + 1));
const pickOne = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function pickEmoji(rng) {
  return rng() < ANCHOR_CHANCE ? ANCHOR : pickOne(rng, POOL);
}

function folkWord(rng) {
  const r = rng();
  if (r < 0.55) return "Folk";
  if (r < 0.80) return "FOLK";
  if (r < 0.92) return "folk";
  return "Folk.";
}

function folkTail(rng) {
  if (rng() < 0.35) return "";
  const n = rint(rng, 1, 3);
  const weird = rng() < 0.25;
  let out = "";
  for (let i = 0; i < n; i++) out += weird ? pickOne(rng, POOL) : ANCHOR;
  return out;
}

/* ------------------------------------------------------------------ *
 * Drawing helpers
 * ------------------------------------------------------------------ */

const FOLK_FONT = 'Anton, Impact, "Haettenschweiler", "Arial Narrow Bold", sans-serif';
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';

const folkFont = (px) => `${Math.max(6, Math.round(px))}px ${FOLK_FONT}`;
const emojiFont = (px) => `${Math.max(6, Math.round(px))}px ${EMOJI_FONT}`;

function drawEmoji(ctx, ch, x, y, size, rot = 0, shadow = false) {
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.font = emojiFont(size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.06;
  }
  ctx.fillText(ch, 0, 0);
  ctx.restore();
}

// A horizontal run of emojis, edge to edge, slightly overlapping.
function emojiRow(ctx, rng, { y, size, width, jitter = 0.12, rot = 0.3, overlap = 0.9 }) {
  const step = Math.max(4, size * overlap);
  const count = Math.ceil(width / step) + 2;
  const start = -rng() * step;
  for (let i = 0; i < count; i++) {
    const s = size * (1 + (rng() - 0.5) * jitter * 2);
    const x = start + i * step + step / 2;
    const dy = (rng() - 0.5) * size * jitter;
    drawEmoji(ctx, pickEmoji(rng), x, y + dy, s, (rng() - 0.5) * rot);
  }
}

// Draws "Folk" plus an optional trailing emoji run, as one centred unit.
// The word and the emojis are measured separately so the emojis never get
// a text outline slapped on them.
function drawFolkLine(ctx, { word, tail, cx, cy, size, maxWidth, tilt = 0, fill = "#fff", stroke = "#000", strokeW = 0.14, shadow = true }) {
  const tailScale = 0.82;
  const measure = (s) => {
    ctx.font = folkFont(s);
    const w = ctx.measureText(word).width;
    ctx.font = emojiFont(s * tailScale);
    const t = tail ? ctx.measureText(tail).width : 0;
    const gap = tail ? s * 0.12 : 0;
    return { w, t, gap, total: w + gap + t };
  };

  let m = measure(size);
  if (m.total > maxWidth) {
    size = Math.max(8, size * (maxWidth / m.total));
    m = measure(size);
  }

  ctx.save();
  ctx.translate(cx, cy);
  if (tilt) ctx.rotate(tilt);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  const left = -m.total / 2;

  ctx.font = folkFont(size);
  if (shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = size * 0.2;
    ctx.shadowOffsetY = size * 0.05;
  }
  if (stroke !== "none") {
    ctx.lineWidth = Math.max(2, size * strokeW);
    ctx.strokeStyle = stroke;
    ctx.strokeText(word, left + m.w / 2, 0);
  }
  ctx.shadowColor = "transparent";
  ctx.fillStyle = fill;
  ctx.fillText(word, left + m.w / 2, 0);

  if (tail) {
    ctx.font = emojiFont(size * tailScale);
    ctx.fillText(tail, left + m.w + m.gap + m.t / 2, 0);
  }
  ctx.restore();
  return size;
}

// Widest a line centred on cx can be without spilling out of the frame.
function safeWidth(cx, W, frac = 0.92) {
  return Math.max(W * 0.25, Math.min(W * frac, 2 * Math.min(cx, W - cx) - W * 0.03));
}

function bar(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Layout presets
 * ------------------------------------------------------------------ */

function bottomBand(ctx, rng, S) {
  const { W, H, T, amount, textScale } = S;
  const size = T * (0.105 - amount * 0.025);
  const rows = 1 + (rng() < amount * 0.4 ? 1 : 0);
  const bandH = Math.min(H * 0.5, rows * size * 0.92 + size * 0.58);
  const top = H - bandH;

  if (rng() < 0.6) bar(ctx, 0, top, W, bandH, "#000");

  for (let r = 0; r < rows; r++) {
    emojiRow(ctx, rng, { y: top + size * 0.75 + r * size * 0.92, size, width: W });
  }

  const textSize = T * 0.22 * textScale;
  const cy = clamp(top - textSize * 0.62, textSize * 0.6, H - textSize * 0.6);
  drawFolkLine(ctx, {
    word: folkWord(rng), tail: folkTail(rng),
    cx: W / 2, cy, size: textSize, maxWidth: safeWidth(W / 2, W),
    tilt: rng() < 0.25 ? rnd(rng, -0.05, 0.05) : 0
  });
}

function topBanner(ctx, rng, S) {
  const { W, H, T, amount, textScale } = S;
  const light = rng() < 0.65;
  const bannerH = Math.min(H * 0.45, T * 0.3);
  bar(ctx, 0, 0, W, bannerH, light ? "#fff" : "#000");

  const textSize = bannerH * 0.44 * textScale;
  drawFolkLine(ctx, {
    word: folkWord(rng), tail: "",
    cx: W / 2, cy: bannerH * 0.31, size: textSize, maxWidth: safeWidth(W / 2, W, 0.9),
    fill: light ? "#000" : "#fff", stroke: "none", shadow: false
  });

  const rowSize = bannerH * (0.38 - amount * 0.07);
  emojiRow(ctx, rng, { y: bannerH * 0.72, size: rowSize, width: W, rot: 0.18 });

  // Spill out of the banner only at the top of the slider.
  if (rng() < amount * 0.4) {
    emojiRow(ctx, rng, { y: bannerH + rowSize * 0.6, size: rowSize, width: W });
  }
  if (rng() < amount * 0.6) {
    emojiRow(ctx, rng, { y: H - rowSize * 0.75, size: rowSize, width: W });
  }
}

function emojiWall(ctx, rng, S) {
  const { W, H, T, amount, textScale } = S;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Thin the wall by leaving cells empty rather than by growing the emojis —
  // scaling them up just hides the photo behind fewer, bigger faces.
  const cell = T * (0.31 - amount * 0.08);
  const fill = 0.2 + amount * 0.8;
  const cols = Math.ceil(W / cell) + 1;
  const rows = Math.ceil(H / cell) + 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng() > fill) continue;
      const x = c * cell + cell / 2 + (rng() - 0.5) * cell * 0.2;
      const y = r * cell + cell / 2 + (rng() - 0.5) * cell * 0.2;
      drawEmoji(ctx, pickEmoji(rng), x, y, cell * rnd(rng, 0.85, 1.05), (rng() - 0.5) * 0.25);
    }
  }

  drawFolkLine(ctx, {
    word: folkWord(rng), tail: "",
    cx: W / 2, cy: H * rnd(rng, 0.42, 0.58),
    size: T * 0.34 * textScale, maxWidth: safeWidth(W / 2, W, 0.9),
    strokeW: 0.16, tilt: rng() < 0.3 ? rnd(rng, -0.08, 0.08) : 0
  });
}

function scatter(ctx, rng, S) {
  const { W, H, T, amount, textScale } = S;
  const total = Math.round(clamp((2 + amount * 5) * rnd(rng, 0.7, 1.4) * (W * H) / (T * T), 2, 400));
  const under = Math.round(total * 0.7);

  const sticker = () => {
    const size = T * rnd(rng, 0.06, 0.18);
    drawEmoji(ctx, pickEmoji(rng), rnd(rng, size * 0.4, W - size * 0.4), rnd(rng, size * 0.4, H - size * 0.4), size, rnd(rng, -0.6, 0.6), rng() < 0.5);
  };

  for (let i = 0; i < under; i++) sticker();

  const cx = W * rnd(rng, 0.4, 0.6);
  drawFolkLine(ctx, {
    word: folkWord(rng), tail: folkTail(rng),
    cx, cy: H * rnd(rng, 0.22, 0.78),
    size: T * 0.26 * textScale, maxWidth: safeWidth(cx, W, 0.88),
    tilt: rnd(rng, -0.14, 0.14)
  });

  // A few stickers land on top of the word — that's the point.
  for (let i = under; i < total; i++) sticker();
}

function sandwich(ctx, rng, S) {
  const { W, H, T, amount, textScale } = S;
  const size = T * (0.11 - amount * 0.025);
  const topRows = 1 + (rng() < amount * 0.4 ? 1 : 0);
  const botRows = 1 + (rng() < amount * 0.4 ? 1 : 0);
  const opaque = rng() < 0.55;

  const topH = Math.min(H * 0.35, topRows * size * 0.92 + size * 0.58);
  if (opaque) bar(ctx, 0, 0, W, topH, "#000");
  for (let r = 0; r < topRows; r++) {
    emojiRow(ctx, rng, { y: size * 0.75 + r * size * 0.92, size, width: W });
  }

  const botH = Math.min(H * 0.35, botRows * size * 0.92 + size * 0.58);
  if (opaque) bar(ctx, 0, H - botH, W, botH, "#000");
  for (let r = 0; r < botRows; r++) {
    emojiRow(ctx, rng, { y: H - botH + size * 0.75 + r * size * 0.92, size, width: W });
  }

  drawFolkLine(ctx, {
    word: folkWord(rng), tail: folkTail(rng),
    cx: W / 2, cy: H / 2, size: T * 0.3 * textScale, maxWidth: safeWidth(W / 2, W, 0.9)
  });
}

function halo(ctx, rng, S) {
  const { W, H, T, amount, textScale } = S;
  const cx = W / 2;
  const cy = H * rnd(rng, 0.45, 0.55);
  const rings = 1 + (rng() < amount * 0.35 ? 1 : 0);
  const radial = rng() < 0.5;
  const size0 = T * 0.095;

  for (let ring = 0; ring < rings; ring++) {
    const shrink = 1 - ring * 0.26;
    const rx = (W * 0.42 - size0 * 0.6) * shrink;
    const ry = (H * 0.42 - size0 * 0.6) * shrink;
    if (Math.min(rx, ry) < size0 * 0.7) break;
    // Scale the ring population with its circumference so wide or tall
    // frames get a full orbit instead of a handful of lonely emojis.
    const count = clamp(Math.round(Math.PI * (rx + ry) / (size0 * 1.6) * (0.45 + amount * 0.6)), 5, 120);
    const spin = rng() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const a = spin + (i / count) * Math.PI * 2 + (rng() - 0.5) * 0.12;
      const size = size0 * rnd(rng, 0.8, 1.15);
      const rot = radial ? a + Math.PI / 2 : rnd(rng, -0.45, 0.45);
      drawEmoji(ctx, pickEmoji(rng), cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, size, rot, true);
    }
  }

  const inner = Math.max(T * 0.4, (W * 0.42 - size0 * 0.6) * 1.4);
  drawFolkLine(ctx, {
    word: folkWord(rng), tail: "",
    cx, cy, size: T * 0.26 * textScale, maxWidth: Math.min(safeWidth(cx, W, 0.9), inner)
  });
}

const PRESETS = [
  ["band", bottomBand],
  ["banner", topBanner],
  ["wall", emojiWall],
  ["scatter", scatter],
  ["sandwich", sandwich],
  ["halo", halo]
];

/* ------------------------------------------------------------------ *
 * App state + rendering
 * ------------------------------------------------------------------ */

const MAX_DIM = 1600;

const state = {
  img: null,
  seed: (Math.random() * 1e9) | 0,
  amount: 0.5,
  textScale: 1,
  layout: ""
};

const $ = (id) => document.getElementById(id);
const canvas = $("canvas");
const ctx = canvas.getContext("2d");

function render() {
  if (!state.img) return;
  const img = state.img;

  const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  const W = Math.max(1, Math.round(img.naturalWidth * scale));
  const H = Math.max(1, Math.round(img.naturalHeight * scale));
  canvas.width = W;
  canvas.height = H;

  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0, W, H);

  const rng = mulberry32(state.seed);
  const [name, draw] = PRESETS[Math.floor(rng() * PRESETS.length)];
  state.layout = name;

  // U is the short side; T is a blend of the short side and the geometric
  // mean, so text and emojis stay legible on very wide or very tall images.
  const shortSide = Math.min(W, H);
  const S = {
    W, H,
    T: shortSide * 0.75 + Math.sqrt(W * H) * 0.25,
    amount: state.amount,
    textScale: state.textScale
  };
  draw(ctx, rng, S);

  // Corner spam, because sometimes it needs a little more.
  if (rng() < 0.1 + state.amount * 0.3) {
    const n = rint(rng, 1, 4);
    for (let i = 0; i < n; i++) {
      const size = S.T * rnd(rng, 0.08, 0.16);
      const corner = rint(rng, 0, 3);
      const x = corner % 2 === 0 ? size * 0.6 : W - size * 0.6;
      const y = corner < 2 ? size * 0.6 : H - size * 0.6;
      drawEmoji(ctx, pickEmoji(rng), x + rnd(rng, -size * 0.4, size * 0.4), y + rnd(rng, -size * 0.4, size * 0.4), size, rnd(rng, -0.5, 0.5), true);
    }
  }

  $("rollLabel").textContent = `layout: ${LAYOUT_LABELS[name]} · seed #${state.seed} · ${W}×${H}`;
}

async function loadImage(file) {
  if (!file || !file.type.startsWith("image/")) {
    alert("That needs to be an image file.");
    return;
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = async () => {
    state.img = img;
    state.seed = (Math.random() * 1e9) | 0;
    $("dropzone").hidden = true;
    $("stage").hidden = false;
    try { await document.fonts.ready; } catch (_) { /* fonts are best-effort */ }
    render();
    $("stage").scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    alert("Couldn't read that image, sorry.");
  };
  img.src = url;
}

/* ------------------------------------------------------------------ *
 * Wiring
 * ------------------------------------------------------------------ */

const dropzone = $("dropzone");
const fileInput = $("fileInput");

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
});
fileInput.addEventListener("change", (e) => {
  if (e.target.files[0]) loadImage(e.target.files[0]);
  e.target.value = "";
});

["dragenter", "dragover"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add("dragging"); })
);
["dragleave", "drop"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove("dragging"); })
);
dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) loadImage(file);
});

// Drop anywhere on the page once an image is already loaded.
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) loadImage(file);
});

window.addEventListener("paste", (e) => {
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith("image/")) {
      loadImage(item.getAsFile());
      break;
    }
  }
});

$("rerollBtn").addEventListener("click", () => {
  state.seed = (Math.random() * 1e9) | 0;
  render();
});

$("newBtn").addEventListener("click", () => {
  state.img = null;
  $("stage").hidden = true;
  $("dropzone").hidden = false;
});

const densityInput = $("density");
const textInput = $("textScale");

function densityWord(v) {
  if (v < 0.1) return "barely";
  if (v < 0.3) return "restrained";
  if (v < 0.6) return "normal";
  if (v < 0.8) return "a lot";
  if (v < 0.95) return "unwell";
  return "biblical";
}

densityInput.addEventListener("input", () => {
  state.amount = parseFloat(densityInput.value);
  $("densityOut").textContent = densityWord(state.amount);
  render();
});

textInput.addEventListener("input", () => {
  state.textScale = parseFloat(textInput.value);
  $("textOut").textContent = Math.round(state.textScale * 100) + "%";
  render();
});

$("downloadBtn").addEventListener("click", () => {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `folk-${state.seed}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
});

$("copyBtn").addEventListener("click", async () => {
  const btn = $("copyBtn");
  const original = btn.textContent;
  try {
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    btn.textContent = "Copied ✅";
  } catch (_) {
    btn.textContent = "Can't copy 😭";
  }
  setTimeout(() => { btn.textContent = original; }, 1600);
});

// Keyboard: space re-rolls once an image is loaded.
window.addEventListener("keydown", (e) => {
  if (e.key !== " " || !state.img) return;
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === "INPUT" || tag === "BUTTON" || tag === "TEXTAREA") return;
  e.preventDefault();
  state.seed = (Math.random() * 1e9) | 0;
  render();
});
