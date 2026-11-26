const GOOEY_OUTSET = .25;
const GOOEY_GRID_STEP = .05;
const GOOEY_FINDER_SIZE = 7;

function createGooeyPolygonLoops(vertices, settings, random) {
  const blend = .04 + .16 * settings.blendStrength / 100;
  const balls = distributeGooeyBalls(vertices, settings, random, blend);
  return traceGooeyLoops(balls, blend);
}

function distributeGooeyBalls(vertices, settings, random, blend) {
  const center = GOOEY_FINDER_SIZE / 2;
  const guide = vertices.map((point) => point.map((value) => center + (value - center) * (center - .5) / center));
  let length = 0;
  const edges = guide.map(([x, y], index) => {
    const next = guide[(index + 1) % guide.length];
    const dx = next[0] - x;
    const dy = next[1] - y;
    const size = Math.hypot(dx, dy);
    const start = length;
    length += size;
    return { x, y, dx, dy, size, start, end: length };
  });
  const step = length / settings.density;
  const phase = random(-1, 0);
  const sizeVariation = .04 + .14 * settings.sizeVariation / 100;
  const spacingVariation = .055 + .125 * settings.spacingVariation / 100;
  const deviation = .10 * settings.pathDeviation / 100;
  const balls = Array.from({ length: settings.density }, (_, index) => {
    const distance = ((index + phase + (2 * random(index, 0) - 1) * spacingVariation) * step + length) % length;
    const edge = edges.find(({ end }) => distance < end);
    const position = (distance - edge.start) / edge.size;
    const shift = (2 * random(index, 1) - 1) * deviation / edge.size;
    const x = edge.x + edge.dx * position - edge.dy * shift;
    const y = edge.y + edge.dy * position + edge.dx * shift;
    const innerX = Math.max(1.9 - x, 0, x - 5.1);
    const innerY = Math.max(1.9 - y, 0, y - 5.1);
    const limit = Math.min(
      x + GOOEY_OUTSET, y + GOOEY_OUTSET,
      GOOEY_FINDER_SIZE + GOOEY_OUTSET - x, GOOEY_FINDER_SIZE + GOOEY_OUTSET - y,
      Math.hypot(innerX, innerY),
    ) - blend;
    const radius = Math.min(limit, .5 + (2 * random(index, 2) - 1) * sizeVariation);
    return { x, y, radius, limit };
  });

  balls.forEach((ball, index) => {
    const next = balls[(index + 1) % balls.length];
    const requiredOverlap = Math.hypot(next.x - ball.x, next.y - ball.y) + .02;
    const gap = requiredOverlap - ball.radius - next.radius;
    if (gap <= 0 || requiredOverlap > ball.limit + next.limit) return;
    const addedToNext = Math.min(next.limit - next.radius, Math.max(gap / 2, gap - (ball.limit - ball.radius)));
    next.radius += addedToNext;
    ball.radius += gap - addedToNext;
  });
  return balls;
}

function traceGooeyLoops(balls, blend) {
  const count = Math.round((GOOEY_FINDER_SIZE + 2 * GOOEY_OUTSET) / GOOEY_GRID_STEP) + 1;
  const samples = new Float64Array(count * count);
  const coordinate = (index) => index * GOOEY_GRID_STEP - GOOEY_OUTSET;
  const supports = balls.map(({ x, y, radius }) => ({ x, y, reach: radius + blend }));
  const influence = (squaredDistance, reach) => squaredDistance < reach * reach
    ? ((reach - Math.sqrt(squaredDistance)) / blend) ** 2 : 0;
  // Each ball only contributes to samples inside its compact area of influence.
  for (const { x, y, reach } of supports) {
    const firstColumn = Math.max(0, Math.ceil((x - reach + GOOEY_OUTSET) / GOOEY_GRID_STEP));
    const lastColumn = Math.min(count - 1, Math.floor((x + reach + GOOEY_OUTSET) / GOOEY_GRID_STEP));
    const firstRow = Math.max(0, Math.ceil((y - reach + GOOEY_OUTSET) / GOOEY_GRID_STEP));
    const lastRow = Math.min(count - 1, Math.floor((y + reach + GOOEY_OUTSET) / GOOEY_GRID_STEP));
    for (let row = firstRow; row <= lastRow; row += 1) {
      const dySquared = (coordinate(row) - y) ** 2;
      for (let column = firstColumn; column <= lastColumn; column += 1) {
        samples[row * count + column] += influence((coordinate(column) - x) ** 2 + dySquared, reach);
      }
    }
  }

  const crossings = new Map();
  const getCrossing = (from, to) => {
    const key = Math.min(from, to) * 2 + (Math.abs(to - from) === 1 ? 0 : 1);
    if (crossings.has(key)) return crossings.get(key);
    const t = (1 - samples[from]) / (samples[to] - samples[from]);
    const x = coordinate(from % count + (to % count - from % count) * t);
    const row = Math.floor(from / count);
    const y = coordinate(row + (Math.floor(to / count) - row) * t);
    const crossing = { point: [x, y], neighbors: [] };
    crossings.set(key, crossing);
    return crossing;
  };
  const connect = (a, b) => {
    a.neighbors.push(b);
    b.neighbors.push(a);
  };
  for (let row = 0; row < count - 1; row += 1) {
    for (let column = 0; column < count - 1; column += 1) {
      const cell = row * count + column;
      const corners = [cell, cell + 1, cell + count + 1, cell + count];
      const inside = corners.map((index) => samples[index] >= 1);
      if (inside.every((value) => value === inside[0])) continue;
      const sides = corners.map((from, index) => {
        const next = (index + 1) % 4;
        return inside[index] === inside[next] ? null : getCrossing(from, corners[next]);
      });
      const active = sides.filter(Boolean);
      if (active.length === 2) {
        connect(...active);
      } else {
        // A saddle has four crossings. The center chooses which corners to connect around.
        const x = coordinate(column + .5);
        const y = coordinate(row + .5);
        const centerInside = supports.reduce((sum, ball) => sum + influence((x - ball.x) ** 2 + (y - ball.y) ** 2, ball.reach), 0) >= 1;
        inside.forEach((value, index) => {
          if (value !== centerInside) connect(sides[(index + 3) % 4], sides[index]);
        });
      }
    }
  }

  const visited = new Set();
  const loops = [];
  for (const start of crossings.values()) {
    if (visited.has(start)) continue;
    const loop = [];
    let current = start;
    let previous = null;
    while (current && !visited.has(current)) {
      visited.add(current);
      loop.push(current.point);
      const next = current.neighbors.find((neighbor) => neighbor !== previous);
      previous = current;
      current = next;
    }
    if (current === start && loop.length >= 3) loops.push(loop);
  }
  return loops;
}
