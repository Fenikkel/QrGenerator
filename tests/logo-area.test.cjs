const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const qrcode = require("../vendor/qrcode.js");
const { getLogoAreaBox, getLogoAreaDamage, getLogoAreaLimit } = require("../logo-area.js");
qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

// Observe the real encoder's writes and byte interleaving independently of its
// metadata extension. Mask choice doesn't change these positions or owners.
let instrumented = fs.readFileSync(path.join(__dirname, "../vendor/qrcode.js"), "utf8");
instrumented = instrumented.replace("var getBestMaskPattern = function() {", "var getBestMaskPattern = function() { return 0;");
instrumented = instrumented.replace("var mapData = function(data, maskPattern, layout) {", `var mapData = function(data, maskPattern, layout) {
  _this.observedWords = Array.from({length:_moduleCount},()=>Array(_moduleCount).fill(-1));
  _this.observedFunctions = _modules.map(row=>row.map(cell=>cell!==null));`);
instrumented = instrumented.replace("var dark = false;", "_this.observedWords[row][col-c] = byteIndex < data.length ? byteIndex : -1; var dark = false;");
instrumented = instrumented.replace("var createBytes = function(buffer, rsBlocks) {", "var createBytes = function(buffer, rsBlocks) { globalThis.observedOwners=[];");
instrumented = instrumented.replace("data[index] = dcdata[r][i];", "globalThis.observedOwners.push(r); data[index] = dcdata[r][i];");
instrumented = instrumented.replace("data[index] = ecdata[r][i];", "globalThis.observedOwners.push(r); data[index] = ecdata[r][i];");
const reference = {};
vm.runInNewContext(instrumented, reference);

const fixtures = [];
for (let version = 1; version <= 40; version += 1) {
  for (const level of ["L", "M", "Q", "H"]) {
    const code = qrcode(version, level);
    code.addData("a", "Byte");
    code.make();
    fixtures.push({ version, level, code, layout: code.getSymbolLayout() });
  }
}

function referenceDamage(layout, box) {
  const words = Array.from({ length: layout.blocks.length }, () => new Set());
  let protectedFunction = false;
  for (let row = 0; row < layout.moduleCount; row += 1) {
    for (let column = 0; column < layout.moduleCount; column += 1) {
      if (box.width <= 0 || box.height <= 0 || column + 1 <= box.x + 1e-9 || column >= box.x + box.width - 1e-9
        || row + 1 <= box.y + 1e-9 || row >= box.y + box.height - 1e-9) continue;
      const index = row * layout.moduleCount + column;
      if (layout.functionModules[index] === 1) protectedFunction = true;
      const word = layout.moduleCodewords[index];
      if (word >= 0) words[layout.codewordBlocks[word]].add(word);
    }
  }
  return { protectedFunction, damaged: words.map((block) => block.size) };
}

test("all 160 encoded matrices are identical to the original encoder", () => {
  const hash = crypto.createHash("sha256");
  fixtures.forEach(({ version, level, code }) => {
    hash.update(`${version}:${level}:`);
    for (let row = 0; row < code.getModuleCount(); row += 1) {
      let bits = "";
      for (let col = 0; col < code.getModuleCount(); col += 1) bits += code.isDark(row, col) ? "1" : "0";
      hash.update(bits);
    }
  });
  assert.equal(hash.digest("hex"), "005295a9353e60ab0d334e6e474542e1391f5a72812687f91ec9741938362651");
});

test("automatic version choice and payload matrices remain unchanged", () => {
  const cases = [
    ["example.com", "Byte", "M", 21, "e4bab1c029d2326cdc41746243fc07116384ba2388840ae1b88619f3d194a588"],
    ["1234567890123456789012345678901234567890", "Numeric", "L", 21, "1a01b17ec9aa044b36f57ba6f1632bd8ab60f996b9161df06bb502dc014e90bb"],
    ["HELLO WORLD 123", "Alphanumeric", "Q", 21, "c55b8f99fa81519fe14074c1ac2efb03ffeaa119e1ff29d898af440d38ed50a1"],
    ["áé 中文 😀", "Byte", "H", 29, "47c3c297436da1b6d106806f8729251e4bf4d3790d059c2dc13171121cf22d43"],
    ["a".repeat(2200), "Byte", "M", 173, "1bfbf981156a7602c936cb0cb3285425a587f3ae9dc4ff8efb5202600da1fe07"],
  ];
  for (const [content, mode, level, count, expected] of cases) {
    const code = qrcode(0, level);
    code.addData(content, mode);
    code.make();
    assert.equal(code.getModuleCount(), count);
    const bits = [];
    for (let row = 0; row < count; row += 1) for (let col = 0; col < count; col += 1) bits.push(code.isDark(row, col) ? "1" : "0");
    assert.equal(crypto.createHash("sha256").update(bits.join("")).digest("hex"), expected);
  }
});

test("module mappings and block owners match the actual encoder in V1–V40 and L/M/Q/H", () => {
  fixtures.forEach(({ version, level, layout }) => {
    const code = reference.qrcode(version, level);
    code.addData("a", "Byte");
    code.make();
    assert.deepEqual([...layout.codewordBlocks], Array.from(reference.observedOwners));
    const histogram = new Uint8Array(layout.codewordBlocks.length);
    for (let row = 0; row < layout.moduleCount; row += 1) {
      for (let col = 0; col < layout.moduleCount; col += 1) {
        const index = row * layout.moduleCount + col;
        assert.equal(layout.moduleCodewords[index], code.observedWords[row][col]);
        assert.equal(layout.functionModules[index] > 0, code.observedFunctions[row][col]);
        if (layout.moduleCodewords[index] >= 0) histogram[layout.moduleCodewords[index]] += 1;
      }
    }
    assert.ok(histogram.every((count) => count === 8), "each codeword maps to exactly eight bits");
    layout.blocks.forEach((block, index) => {
      assert.equal([...layout.codewordBlocks].filter((owner) => owner === index).length, block.totalCount);
      assert.equal(block.correctionCapacity, Math.floor((block.totalCount - block.dataCount) / 2));
    });
  });
});

test("all 800 version/level/aspect combinations have a strict maximal size", () => {
  fixtures.forEach(({ version, level, layout }) => {
    for (const ratio of [.25, .5, 1, 2, 4]) {
      const maximum = getLogoAreaLimit(layout, ratio);
      assert.ok(maximum >= 10 && maximum <= 30, `${version}/${level}/${ratio}: ${maximum}`);
      for (const size of [maximum, maximum + 1]) {
        if (size > 30) continue;
        const actual = getLogoAreaDamage(layout, size, ratio);
        const expected = referenceDamage(layout, actual.box);
        assert.deepEqual([...actual.damaged], expected.damaged);
        assert.equal(actual.protectedFunction, expected.protectedFunction);
        assert.equal(actual.allowed, size === maximum);
        if (actual.allowed) actual.damaged.forEach((count, index) => assert.ok(count < layout.blocks[index].correctionCapacity));
      }
    }
  });
});

test("reaching a block's exact correction capacity is rejected", () => {
  let checked = 0;
  for (const { layout } of fixtures) {
    for (let size = 10; size <= 30; size += 1) {
      const damage = getLogoAreaDamage(layout, size);
      if (!damage.protectedFunction && damage.damaged.every((count, index) => count <= layout.blocks[index].correctionCapacity)
        && damage.damaged.some((count, index) => count === layout.blocks[index].correctionCapacity)) {
        assert.equal(damage.allowed, false);
        checked += 1;
      }
    }
  }
  assert.ok(checked > 0);
});

test("white modules and parity codewords also consume the logo budget", () => {
  let whiteOnlyWords = 0;
  let parityWords = 0;
  fixtures.forEach(({ code, layout }) => {
    const maximum = getLogoAreaLimit(layout);
    const box = getLogoAreaBox(layout.moduleCount, maximum);
    const all = new Set(), dark = new Set();
    for (let row = 0; row < layout.moduleCount; row += 1) for (let col = 0; col < layout.moduleCount; col += 1) {
      if (col + 1 <= box.x || col >= box.x + box.width || row + 1 <= box.y || row >= box.y + box.height) continue;
      const word = layout.moduleCodewords[row * layout.moduleCount + col];
      if (word < 0) continue;
      all.add(word);
      if (code.isDark(row, col)) dark.add(word);
    }
    whiteOnlyWords += [...all].filter((word) => !dark.has(word)).length;
    const dataWords = layout.blocks.reduce((sum, block) => sum + block.dataCount, 0);
    parityWords += [...all].filter((word) => word >= dataWords).length;
  });
  assert.ok(whiteOnlyWords > 0);
  assert.ok(parityWords > 0);
});

test("alignment patterns can be covered, while all other functional areas stay protected", () => {
  const v1 = fixtures.find((item) => item.version === 1 && item.level === "H").layout;
  assert.equal(getLogoAreaDamage(v1, 20).protectedFunction, true);
  assert.equal(getLogoAreaLimit(v1), 14);
  const v7 = fixtures.find((item) => item.version === 7 && item.level === "H").layout;
  const center = Math.floor(v7.moduleCount / 2);
  assert.equal(v7.functionModules[center * v7.moduleCount + center], 2);
  const damage = getLogoAreaDamage(v7, 10);
  assert.equal(damage.allowed, true);
  assert.equal(damage.protectedFunction, false);
  assert.equal(damage.damaged.reduce((sum, count) => sum + count, 0), 0);
  for (const version of [2, 7, 14, 32, 40]) {
    const layout = fixtures.find((item) => item.version === version).layout;
    const centersPerAxis = Math.floor(version / 7) + 2;
    assert.equal([...layout.functionModules].filter((role) => role === 2).length, (centersPerAxis ** 2 - 3) * 25);
  }
});

test("bounds share six-decimal precision, stay centered, and translate with the quiet zone", () => {
  for (const count of [21, 25, 45, 145, 177]) for (const size of [10, 14, 23, 30]) for (const ratio of [.25, 1 / 3, 1, 1.23456789, 4]) {
    const box = getLogoAreaBox(count, size, ratio);
    const shifted = getLogoAreaBox(count, size, ratio, 4);
    assert.ok(Math.abs(box.x + box.width / 2 - count / 2) < 1e-6);
    assert.ok(Math.abs(box.y + box.height / 2 - count / 2) < 1e-6);
    assert.ok(Math.abs(shifted.x - box.x - 4) < 1e-9);
    assert.ok(Math.abs(shifted.y - box.y - 4) < 1e-9);
    assert.equal(shifted.width, box.width);
    assert.equal(shifted.height, box.height);
    Object.values(box).forEach((value) => assert.equal(Number(value.toFixed(6)), value));
  }
  for (const invalid of [0, -1, NaN, Infinity]) assert.deepEqual(getLogoAreaBox(21, 14, invalid), getLogoAreaBox(21, 14, 1));
});

test("metadata and limits are reused without modifying the QR", () => {
  const { code, layout } = fixtures[0];
  assert.equal(code.getSymbolLayout(), layout);
  const another = qrcode(1, "L");
  another.addData("b", "Byte");
  another.make();
  assert.equal(another.getSymbolLayout(), layout);
  const pending = qrcode(1, "L");
  assert.throws(() => pending.getSymbolLayout());
  let reads = 0;
  const observed = { ...layout, get functionModules() { reads += 1; return layout.functionModules; } };
  const maximum = getLogoAreaLimit(observed, 1);
  const firstReads = reads;
  assert.ok(firstReads > 0);
  assert.equal(getLogoAreaLimit(observed, 1), maximum);
  assert.equal(reads, firstReads);
  getLogoAreaLimit(observed, 2);
  assert.ok(reads > firstReads);
});
