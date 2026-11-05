const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const qrcode = require("../vendor/qrcode.js");

// Compare the UI's alignment positions with the encoder's actual reserved
// cells, including the special spacing in V32 and all timing intersections.
const source = fs.readFileSync(path.join(__dirname, "../script.js"), "utf8");
const positions = source.slice(source.indexOf("function getAlignmentPatternPositions("), source.indexOf("function getAlignmentArtwork("));
const context = { alignmentPositionsCache: new Map() };
vm.createContext(context);
vm.runInContext(positions, context);

test("alignment footprints match the encoder in V1–V40 and L/M/Q/H", () => {
  for (let version = 1; version <= 40; version += 1) {
    for (const level of ["L", "M", "Q", "H"]) {
      const code = qrcode(version, level);
      code.addData("a", "Byte");
      code.make();
      const layout = code.getSymbolLayout();
      const actual = context.getAlignmentPatterns(code);
      const footprint = new Uint8Array(layout.moduleCount ** 2);
      actual.forEach(({ row, column, index }, i) => {
        assert.equal(index, i);
        let dark = 0;
        for (let dy = -2; dy <= 2; dy += 1) {
          for (let dx = -2; dx <= 2; dx += 1) {
            const cell = (row + dy) * layout.moduleCount + column + dx;
            assert.equal(footprint[cell], 0, "alignment patterns never overlap");
            footprint[cell] = 1;
            dark += Number(code.isDark(row + dy, column + dx));
          }
        }
        assert.equal(dark, 17, "a standard alignment has a 16-cell frame and one-cell center");
      });
      assert.deepEqual(footprint, Uint8Array.from(layout.functionModules, (role) => Number(role === 2)), `V${version} ${level}`);
      assert.equal(actual.length, version === 1 ? 0 : (Math.floor(version / 7) + 2) ** 2 - 3);
      assert.equal(context.getAlignmentPatterns(code), actual, "positions are cached by dimension");
    }
  }
});
