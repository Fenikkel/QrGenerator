// All bounds use the same precision in geometry, SVG and Canvas exports.
const logoAreaLimits = new WeakMap();

function normalizeLogoAspectRatio(ratio) {
  return Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
}

function getLogoAreaBox(moduleCount, percent, aspectRatio = 1, quietZone = 0) {
  const round = (value) => Number(value.toFixed(6));
  const ratio = normalizeLogoAspectRatio(aspectRatio);
  const side = moduleCount * percent / 100;
  const width = ratio >= 1 ? side : side * ratio;
  const height = ratio >= 1 ? side / ratio : side;
  const left = round((moduleCount - width) / 2);
  const top = round((moduleCount - height) / 2);
  const right = round((moduleCount + width) / 2);
  const bottom = round((moduleCount + height) / 2);
  return {
    x: round(quietZone + left),
    y: round(quietZone + top),
    width: round(right - left),
    height: round(bottom - top),
  };
}

function getLogoAreaDamage(layout, percent, aspectRatio = 1) {
  const box = getLogoAreaBox(layout.moduleCount, percent, aspectRatio);
  const damaged = new Uint16Array(layout.blocks.length);
  const touched = new Set();
  let protectedFunction = false;
  if (box.width > 0 && box.height > 0) {
    // Coordinates have six decimal places; this tolerance only removes binary
    // floating-point noise where an edge meets a module boundary exactly.
    const epsilon = 1e-9;
    const left = Math.max(0, Math.floor(box.x + epsilon));
    const top = Math.max(0, Math.floor(box.y + epsilon));
    const right = Math.min(layout.moduleCount, Math.ceil(box.x + box.width - epsilon));
    const bottom = Math.min(layout.moduleCount, Math.ceil(box.y + box.height - epsilon));
    for (let row = top; row < bottom; row += 1) {
      for (let column = left; column < right; column += 1) {
        const index = row * layout.moduleCount + column;
        if (layout.functionModules[index] === 1) protectedFunction = true;
        const word = layout.moduleCodewords[index];
        if (word >= 0) touched.add(word);
      }
    }
  }
  // A logo can alter white as well as black cells. Charge each touched data or
  // parity codeword once, independently of its original contents and mask.
  touched.forEach((word) => { damaged[layout.codewordBlocks[word]] += 1; });
  return {
    allowed: !protectedFunction && damaged.every((count, index) => count < layout.blocks[index].correctionCapacity),
    protectedFunction,
    damaged,
    box,
  };
}

function getLogoAreaLimit(layout, aspectRatio = 1) {
  const ratio = normalizeLogoAspectRatio(aspectRatio);
  let cached = logoAreaLimits.get(layout);
  if (!cached) {
    cached = new Map();
    logoAreaLimits.set(layout, cached);
  }
  if (cached.has(ratio)) return cached.get(ratio);
  let maximum = 30;
  while (maximum > 0 && !getLogoAreaDamage(layout, maximum, ratio).allowed) maximum -= 1;
  cached.set(ratio, maximum);
  return maximum;
}

if (typeof module === "object" && module.exports) {
  module.exports = { getLogoAreaBox, getLogoAreaDamage, getLogoAreaLimit };
}
