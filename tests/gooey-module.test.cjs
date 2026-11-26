const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, "../gooey-polygon.js"), "utf8"), context);

test("density counts the center and fills distinct peripheral positions", () => {
  const positions = [.25, .5, .75];
  const orderedZones = [0, 1, 2, 3, 5, 6, 7, 8];
  const settings = { density: 1, ballSize: 25, blendStrength: 0 };
  const { fieldAt: centerField } = context.createGooeyModuleField(settings, (zone) => zone);
  for (let density = 1; density <= 9; density += 1) {
    const { fieldAt } = context.createGooeyModuleField({ ...settings, density }, (zone) => zone);
    assert.equal(fieldAt(.5, .5), centerField(.5, .5));
    orderedZones.forEach((zone, index) => {
      const x = positions[zone % 3];
      const y = positions[Math.floor(zone / 3)];
      assert.equal(fieldAt(x, y) > centerField(x, y), index < density - 1);
    });
  }
});

test("peripheral ball size leaves the center at one zone width", () => {
  for (const ballSize of [25, 50, 100]) {
    const settings = { density: 1, ballSize, blendStrength: 70 };
    const { fieldAt: centerField } = context.createGooeyModuleField(settings, (zone) => zone);
    assert.ok(centerField(.75 - 1e-6, .5) > 1);
    assert.ok(centerField(.75 + 1e-6, .5) < 1);

    const { fieldAt } = context.createGooeyModuleField({ ...settings, density: 2 }, (zone) => zone);
    const peripheralField = (x) => fieldAt(x, .25) - centerField(x, .25);
    const edge = .25 - ballSize / 400;
    assert.ok(peripheralField(edge + 1e-6) > 1);
    assert.ok(peripheralField(edge - 1e-6) < 1);
  }
});

test("each merge adds a metaball at the edge midpoint with a zone-relative diameter", () => {
  const moduleField = (blendStrength) => context.createGooeyModuleField({ density: 1, ballSize: 50, blendStrength }, () => 0);
  const weak = moduleField(0);
  const strong = moduleField(100);

  for (const direction of ["horizontal", "vertical"]) {
    const axis = direction === "horizontal" ? 0 : 1;
    for (const size of [25, 50]) {
      const loops = context.traceGooeyModulePair(weak, weak, direction, size);
      assert.equal(loops.length, 3);
      const link = loops.find((loop) => loop.some((point) => point[axis] < 1)
        && loop.some((point) => point[axis] > 1));
      assert.ok(link);
      const across = link.map((point) => point[axis]);
      const along = link.map((point) => point[1 - axis]);
      assert.ok(Math.abs((Math.min(...across) + Math.max(...across)) / 2 - 1) < .001);
      assert.ok(Math.abs((Math.min(...along) + Math.max(...along)) / 2 - .5) < .001);
      assert.ok(Math.abs(Math.max(...along) - Math.min(...along) - size / 200) < .015);
    }
    assert.equal(context.traceGooeyModulePair(weak, weak, direction, 100).length, 1);
    assert.equal(context.traceGooeyModulePair(strong, strong, direction, 50).length, 1);
  }
});

test("link density spaces one to three metaballs on the line between module centers", () => {
  const emptyModule = { fieldAt: () => 0, blend: .015 };
  for (const direction of ["horizontal", "vertical"]) {
    const axis = direction === "horizontal" ? 0 : 1;
    for (const density of [1, 2, 3]) {
      const loops = context.traceGooeyModulePair(emptyModule, emptyModule, direction, 25, density);
      const centers = loops.map((loop) => [0, 1].map((coordinate) => {
        const values = loop.map((point) => point[coordinate]);
        return (Math.min(...values) + Math.max(...values)) / 2;
      })).sort((a, b) => a[axis] - b[axis]);
      assert.equal(centers.length, density);
      centers.forEach((center, index) => {
        const expected = .5 + (index + 1) / (density + 1);
        assert.ok(Math.abs(center[axis] - expected) < .01);
        assert.ok(Math.abs(center[1 - axis] - .5) < .001);
      });
    }
  }
});
