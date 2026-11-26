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
  const { fieldAt: centerField } = context.createGooeyGridField(settings, (zone) => zone);
  for (let density = 1; density <= 9; density += 1) {
    const { fieldAt } = context.createGooeyGridField({ ...settings, density }, (zone) => zone);
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
    const { fieldAt: centerField } = context.createGooeyGridField(settings, (zone) => zone);
    assert.ok(centerField(.75 - 1e-6, .5) > 1);
    assert.ok(centerField(.75 + 1e-6, .5) < 1);

    const { fieldAt } = context.createGooeyGridField({ ...settings, density: 2 }, (zone) => zone);
    const peripheralField = (x) => fieldAt(x, .25) - centerField(x, .25);
    const edge = .25 - ballSize / 400;
    assert.ok(peripheralField(edge + 1e-6) > 1);
    assert.ok(peripheralField(edge - 1e-6) < 1);
  }
});

test("the inner finder grid fits nine positions and keeps a full-size central metaball", () => {
  const settings = { density: 9, ballSize: 25, blendStrength: 0 };
  const { contours, fieldAt } = context.createGooeyGridField(settings, (zone) => zone, { zoneSize: 1 / 3 });
  assert.equal(contours.length, 9);
  for (const x of [1 / 6, .5, 5 / 6]) {
    for (const y of [1 / 6, .5, 5 / 6]) {
      assert.ok(fieldAt(x, y) > 1);
    }
  }

  const center = (ballSize) => context.createGooeyGridField(
    { ...settings, density: 1, ballSize }, (zone) => zone, { zoneSize: 1 / 3 },
  ).fieldAt;
  assert.ok(center(25)(2 / 3 - 1e-6, .5) > 1);
  assert.ok(center(100)(2 / 3 + 1e-6, .5) < 1);
});

test("randomized finder positions use both coordinates within each peripheral zone", () => {
  const settings = { density: 2, ballSize: 25, blendStrength: 0 };
  const options = { zoneSize: 1 / 3, randomizePositions: true };
  const center = context.createGooeyGridField({ ...settings, density: 1 }, () => 0, options);
  const peak = ((settings.ballSize / 600 + center.blend) / center.blend) ** 2;
  for (const zone of [0, 1, 2, 3, 5, 6, 7, 8]) {
    const random = (index, axis = 0) => [Number(index !== zone), .1, .8][axis];
    const { fieldAt } = context.createGooeyGridField(settings, random, options);
    const column = zone % 3;
    const row = Math.floor(zone / 3);
    const x = (column + .5) / 3 - .4 / 12;
    const y = (row + .5) / 3 + .3 / 12;
    assert.ok(Math.abs(fieldAt(x, y) - center.fieldAt(x, y) - peak) < 1e-9);
    const centerX = (column + .5) / 3;
    const centerY = (row + .5) / 3;
    assert.ok(fieldAt(centerX, centerY) - center.fieldAt(centerX, centerY) < peak / 2);
  }
});

test("equal-size finder balls have one link at each shared edge and corner", () => {
  const settings = { density: 9, ballSize: 100, blendStrength: 0 };
  const grid = (overrides) => context.createGooeyGridField({ ...settings, ...overrides }, (zone) => zone, { zoneSize: 1 / 3 });
  const base = grid({ linkBallSize: 0 });
  assert.deepEqual(base.contours, grid({}).contours);
  const linked = grid({ linkBallSize: 25 });
  const linkPeak = ((.25 / 6 + base.blend) / base.blend) ** 2;
  const assertOneLink = (x, y) => {
    assert.ok(Math.abs(linked.fieldAt(x, y) - base.fieldAt(x, y) - linkPeak) < 1e-9);
  };
  for (const center of [1 / 6, .5, 5 / 6]) {
    for (const edge of [1 / 3, 2 / 3]) {
      assertOneLink(center, edge);
      assertOneLink(edge, center);
    }
  }
  for (const x of [1 / 3, 2 / 3]) {
    for (const y of [1 / 3, 2 / 3]) {
      assertOneLink(x, y);
    }
  }
  for (const [zone, x] of [[0, 1 / 3], [2, 2 / 3]]) {
    const sparse = context.createGooeyGridField(
      { ...settings, density: 2, linkBallSize: 25 }, (index) => Number(index !== zone), { zoneSize: 1 / 3 },
    );
    assert.ok(sparse.fieldAt(x, 1 / 3) > 1);
    assert.ok(sparse.fieldAt(1 - x, 1 / 3) < 1);
  }
});

test("finder links on the central ball are centered between the facing edges", () => {
  const settings = { density: 2, ballSize: 25, blendStrength: 0 };
  for (const zone of [0, 1, 2, 3, 5, 6, 7, 8]) {
    const order = (index) => Number(index !== zone);
    const unlinked = context.createGooeyGridField(settings, order, { zoneSize: 1 / 3 });
    const linked = context.createGooeyGridField({ ...settings, linkBallSize: 25 }, order, { zoneSize: 1 / 3 });
    const x = (zone % 3 + .5) / 3;
    const y = (Math.floor(zone / 3) + .5) / 3;
    const distance = Math.hypot(x - .5, y - .5);
    const distanceFromCenter = (1 / 6 + distance - .25 / 6) / 2;
    const linkX = .5 + (x - .5) * distanceFromCenter / distance;
    const linkY = .5 + (y - .5) * distanceFromCenter / distance;
    const linkPeak = ((.25 / 6 + linked.blend) / linked.blend) ** 2;
    assert.ok(Math.abs(linked.fieldAt(linkX, linkY) - unlinked.fieldAt(linkX, linkY) - linkPeak) < 1e-9);
    assert.equal(linked.fieldAt((x + .5) / 2, (y + .5) / 2), unlinked.fieldAt((x + .5) / 2, (y + .5) / 2));
  }
});

test("each merge adds a metaball at the edge midpoint with a zone-relative diameter", () => {
  const moduleField = (blendStrength) => context.createGooeyGridField({ density: 1, ballSize: 50, blendStrength }, () => 0);
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
