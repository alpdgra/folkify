/* Folkify — put "Folk" and an unreasonable number of emojis on an image.
   Everything runs client-side; nothing leaves the browser. */

/* ------------------------------------------------------------------ *
 * Emoji pools
 * ------------------------------------------------------------------ */

// The canonical Folk emoji. The weirdness slider decides how often the
// pool below gets a turn instead.
const ANCHOR = "😭";

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

const pickOne = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// weird is the slider: 0 keeps it a pure 😭 wall, 1 goes fully off the rails.
function pickEmoji(rng, weird) {
  return rng() < weird ? pickOne(rng, POOL) : ANCHOR;
}

function folkWord(rng) {
  const r = rng();
  if (r < 0.55) return "Folk";
  if (r < 0.80) return "FOLK";
  if (r < 0.92) return "folk";
  return "Folk.";
}

/* ------------------------------------------------------------------ *
 * Drawing helpers
 * ------------------------------------------------------------------ */

const FOLK_FONT = 'Anton, Impact, "Haettenschweiler", "Arial Narrow Bold", sans-serif';
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';

const folkFont = (px) => `${Math.max(6, Math.round(px))}px ${FOLK_FONT}`;
const emojiFont = (px) => `${Math.max(6, Math.round(px))}px ${EMOJI_FONT}`;

function drawEmoji(ctx, ch, x, y, size) {
  ctx.save();
  ctx.font = emojiFont(size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ch, x, y);
  ctx.restore();
}

// White fill, heavy black outline, left-aligned on the first emoji row.
function drawWord(ctx, word, x, cy, size) {
  ctx.save();
  ctx.font = folkFont(size);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = size * 0.2;
  ctx.shadowOffsetY = size * 0.05;
  ctx.lineWidth = Math.max(2, size * 0.14);
  ctx.strokeStyle = "#000";
  ctx.strokeText(word, x, cy);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#fff";
  ctx.fillText(word, x, cy);
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Layout
 *
 * One fixed composition: the word, then emojis running on from it and
 * wrapping into full-width rows underneath. Nothing about the placement
 * is random — only which emojis turn up, how many, and where the block
 * sits vertically.
 * ------------------------------------------------------------------ */

const POSITIONS = ["top", "middle", "bottom"];

function layout(ctx, rng, S) {
  const { W, H, T, count, weird, position, textScale } = S;

  const margin = T * 0.03;
  const left = margin;
  const right = W - margin;
  const lineW = right - left;

  const emojiSize = T * 0.105;
  const step = emojiSize * 0.92;
  const rowH = emojiSize * 0.95;

  // Shrink the word if it would run past the right edge on its own.
  const word = folkWord(rng);
  let textSize = emojiSize * 1.15 * textScale;
  ctx.font = folkFont(textSize);
  let wordW = ctx.measureText(word).width;
  if (wordW > lineW) {
    textSize *= lineW / wordW;
    ctx.font = folkFont(textSize);
    wordW = ctx.measureText(word).width;
  }

  const firstRowH = Math.max(rowH, textSize * 0.8);
  const firstX = left + wordW + emojiSize * 0.18;

  // How much fits: the tail of the word's row, then full rows below it.
  const perRow = Math.max(1, Math.floor(lineW / step));
  const firstRowSlots = Math.max(0, Math.floor((right - firstX) / step));
  const maxRows = Math.max(1, Math.floor((H - margin * 2 - firstRowH) / rowH) + 1);
  const capacity = Math.max(1, firstRowSlots + (maxRows - 1) * perRow);

  const n = clamp(Math.round(1 + count * (capacity - 1)), 1, capacity);

  // Rows this many emojis actually occupies, so the block can be anchored.
  const overflow = Math.max(0, n - firstRowSlots);
  const rows = 1 + Math.ceil(overflow / perRow);
  const blockH = firstRowH + (rows - 1) * rowH;

  let top = position === 0 ? margin
    : position === 1 ? (H - blockH) / 2
    : H - margin - blockH;
  top = clamp(top, margin, Math.max(margin, H - margin - blockH));

  drawWord(ctx, word, left, top + firstRowH / 2, textSize);

  let x = firstX;
  let row = 0;                 // row 0 is the one the word sits on
  let slots = firstRowSlots;
  for (let i = 0; i < n; i++) {
    if (slots <= 0) {
      row++;
      slots = perRow;
      x = left;
    }
    const y = row === 0
      ? top + firstRowH / 2
      : top + firstRowH + (row - 1) * rowH + rowH / 2;
    drawEmoji(ctx, pickEmoji(rng, weird), x + emojiSize / 2, y, emojiSize);
    x += step;
    slots--;
  }

  return n;
}

/* ------------------------------------------------------------------ *
 * App state + rendering
 * ------------------------------------------------------------------ */

const MAX_DIM = 1600;

const state = {
  img: null,
  seed: (Math.random() * 1e9) | 0,
  count: 0.5,
  weird: 0.5,
  position: 2,
  textScale: 1,
  placed: 0
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

  // T blends the short side with the geometric mean, so the word and the
  // emojis stay legible on very wide or very tall images.
  const shortSide = Math.min(W, H);
  state.placed = layout(ctx, rng, {
    W, H,
    T: shortSide * 0.75 + Math.sqrt(W * H) * 0.25,
    count: state.count,
    weird: state.weird,
    position: state.position,
    textScale: state.textScale
  });

  $("countOut").textContent = state.placed;
  $("rollLabel").textContent = `seed #${state.seed} · ${W}×${H}`;
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

const positionInput = $("position");
const countInput = $("count");
const weirdInput = $("weird");
const textInput = $("textScale");

function weirdWord(v) {
  if (v < 0.05) return "pure 😭";
  if (v < 0.3) return "mostly 😭";
  if (v < 0.6) return "mixed";
  if (v < 0.85) return "weird";
  return "unhinged";
}

positionInput.addEventListener("input", () => {
  state.position = parseInt(positionInput.value, 10);
  $("positionOut").textContent = POSITIONS[state.position];
  render();
});

countInput.addEventListener("input", () => {
  state.count = parseFloat(countInput.value);
  render();
});

weirdInput.addEventListener("input", () => {
  state.weird = parseFloat(weirdInput.value);
  $("weirdOut").textContent = weirdWord(state.weird);
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
