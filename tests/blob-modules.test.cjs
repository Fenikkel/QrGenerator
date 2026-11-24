const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../script.js"), "utf8");
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));
const context = vm.createContext({ state: { moduleSeed: 2803551451 } });
vm.runInContext([
  section("const MODULE_RANDOM_PROPERTIES", "const moduleRandomControls"),
  section("function formatNumber(", "function roundedRectCommand("),
  section("function randomModuleFraction(", "function randomModuleValue("),
  section("function fitModulePath(", "function getFigureGeometry("),
  section("function modulePathTail(", "function moduleCommand("),
].join("\n"), context);

test("Blob curves stay simple at maximum Noise and Smooth for a seed with tightly spaced points", () => {
  const geometry = context.getBlobGeometry({
    moduleSides: 9, moduleNoise: 100, moduleSmooth: 100, moduleRotation: 0, moduleScale: 100,
  });
  const points = [geometry.start];
  let start = geometry.start;
  for (const { controls: [first, second], end } of geometry.segments) {
    for (let step = 1; step <= 16; step += 1) {
      const t = step / 16;
      const u = 1 - t;
      points.push([0, 1].map((axis) => u ** 3 * start[axis] + 3 * u * u * t * first[axis]
        + 3 * u * t * t * second[axis] + t ** 3 * end[axis]));
    }
    start = end;
  }
  const orientation = ([ax, ay], [bx, by], [cx, cy]) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  for (let i = 0; i < points.length - 2; i += 1) {
    for (let j = i + 2; j < points.length - 1; j += 1) {
      const [a, b, c, d] = [points[i], points[i + 1], points[j], points[j + 1]];
      const crosses = orientation(a, b, c) * orientation(a, b, d) < 0
        && orientation(c, d, a) * orientation(c, d, b) < 0;
      assert.ok(!crosses, `segments ${i} and ${j} cross`);
    }
  }
});
