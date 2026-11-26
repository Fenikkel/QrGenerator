const GOOEY_OUTSET = .25;
const GOOEY_GRID_STEP = .05;
const GOOEY_FINDER_SIZE = 7;
const GOOEY_MODULE_ZONE_SIZE = .5;

function gooeyInfluence(squaredDistance, reach, blend) {
  return squaredDistance < reach * reach ? ((reach - Math.sqrt(squaredDistance)) / blend) ** 2 : 0;
}

function gooeyBallRadius(size, zoneSize) {
  return (size / 100) * zoneSize / 2;
}

function createGooeyGridField(
  { density, ballSize, blendStrength, linkBallSize = 0 }, random,
  { zoneSize = GOOEY_MODULE_ZONE_SIZE, randomizePositions = false } = {},
) {
  const blend = .015 + .28 * blendStrength / 100;
  const center = .5;
  const peripheralRadius = gooeyBallRadius(ballSize, zoneSize);
  const positionSpread = zoneSize / 4;
  const positions = [zoneSize / 2, center, 1 - zoneSize / 2];
  const side = positions.length;
  const centerIndex = Math.floor(side ** 2 / 2);
  const sites = positions.flatMap((y, row) => positions.map((x, column) => {
    const index = row * side + column;
    return { x, y, index, order: random(index) };
  })).filter(({ index }) => index !== centerIndex);
  sites.sort((a, b) => a.order - b.order);
  const balls = [
    { x: center, y: center, index: centerIndex, radius: gooeyBallRadius(100, zoneSize) },
    ...sites.slice(0, density - 1).map(({ x, y, index }) => ({
      x: randomizePositions ? x + (random(index, 1) - .5) * positionSpread : x,
      y: randomizePositions ? y + (random(index, 2) - .5) * positionSpread : y,
      index,
      radius: peripheralRadius,
    })),
  ];
  if (linkBallSize > 0) {
    const occupied = new Map(balls.map((ball) => [ball.index, ball]));
    const radius = gooeyBallRadius(linkBallSize, zoneSize);
    const links = new Map();
    for (const [index, ball] of occupied) {
      const column = index % side;
      const below = index + side;
      const hasRight = column < side - 1;
      const neighbors = [
        hasRight ? occupied.get(index + 1) : null,
        occupied.get(below),
        column > 0 ? occupied.get(below - 1) : null,
        hasRight ? occupied.get(below + 1) : null,
      ];
      for (const neighbor of neighbors) {
        if (!neighbor) continue;
        const dx = neighbor.x - ball.x;
        const dy = neighbor.y - ball.y;
        const offset = (ball.radius - neighbor.radius) / (2 * Math.hypot(dx, dy));
        const x = (ball.x + neighbor.x) / 2 + dx * offset;
        const y = (ball.y + neighbor.y) / 2 + dy * offset;
        // Diagonal links with the same center share one ball.
        links.set(`${x}:${y}`, { x, y, radius });
      }
    }
    balls.push(...links.values());
  }
  const fieldAt = (x, y) => balls.reduce((sum, ball) => (
    sum + gooeyInfluence((x - ball.x) ** 2 + (y - ball.y) ** 2, ball.radius + blend, blend)
  ), 0);
  const contours = traceGooeyLoops(balls, blend, { size: 1, step: 1 / 60, outset: randomizePositions ? .5 : .25 });
  return { contours, fieldAt, blend };
}

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

function traceGooeyLoops(balls, blend, { size = GOOEY_FINDER_SIZE, step = GOOEY_GRID_STEP, outset = GOOEY_OUTSET } = {}) {
  const count = Math.round((size + 2 * outset) / step) + 1;
  const samples = new Float64Array(count * count);
  const coordinate = (index) => index * step - outset;
  const supports = balls.map(({ x, y, radius }) => ({ x, y, reach: radius + blend }));
  const influence = (squaredDistance, reach) => gooeyInfluence(squaredDistance, reach, blend);
  // Each ball only contributes to samples inside its compact area of influence.
  for (const { x, y, reach } of supports) {
    const firstColumn = Math.max(0, Math.ceil((x - reach + outset) / step));
    const lastColumn = Math.min(count - 1, Math.floor((x + reach + outset) / step));
    const firstRow = Math.max(0, Math.ceil((y - reach + outset) / step));
    const lastRow = Math.min(count - 1, Math.floor((y + reach + outset) / step));
    for (let row = firstRow; row <= lastRow; row += 1) {
      const dySquared = (coordinate(row) - y) ** 2;
      for (let column = firstColumn; column <= lastColumn; column += 1) {
        samples[row * count + column] += influence((coordinate(column) - x) ** 2 + dySquared, reach);
      }
    }
  }
  const fieldAt = (x, y) => supports.reduce((sum, ball) => (
    sum + influence((x - ball.x) ** 2 + (y - ball.y) ** 2, ball.reach)
  ), 0);
  return traceGooeyField(samples, count, count, coordinate, fieldAt);
}

function traceGooeyModulePair(first, second, direction, linkBallSize, linkDensity = 1) {
  const dx = direction === "horizontal" ? 1 : 0;
  const dy = 1 - dx;
  const width = 1 + dx;
  const height = 1 + dy;
  const steps = 40;
  const columns = width * steps + 3;
  const rows = height * steps + 3;
  const coordinate = (index) => (index - 1) / steps;
  const samples = new Float64Array(columns * rows);
  const linkCenters = Array.from({ length: linkDensity }, (_, index) => {
    const offset = (index + 1) / (linkDensity + 1);
    return [.5 + dx * offset, .5 + dy * offset];
  });
  const blend = (first.blend + second.blend) / 2;
  const reach = gooeyBallRadius(linkBallSize, GOOEY_MODULE_ZONE_SIZE) + blend;
  const combinedField = (x, y) => {
    let field = first.fieldAt(x, y) + second.fieldAt(x - dx, y - dy);
    for (const [linkX, linkY] of linkCenters) {
      field += gooeyInfluence((x - linkX) ** 2 + (y - linkY) ** 2, reach, blend);
    }
    return field;
  };
  for (let row = 1; row < rows - 1; row += 1) {
    for (let column = 1; column < columns - 1; column += 1) {
      samples[row * columns + column] = combinedField(coordinate(column), coordinate(row));
    }
  }
  const loops = traceGooeyField(samples, columns, rows, coordinate, combinedField);
  // The combined contour belongs only to the two participating cells.
  return loops.map((loop) => loop.map(([x, y]) => [Math.max(0, Math.min(width, x)), Math.max(0, Math.min(height, y))]));
}

function simplifyGooeyModuleLoop(loop) {
  const points = [...loop, loop[0]];
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  const keepCorners = (first, last) => {
    const [x, y] = points[first];
    const [endX, endY] = points[last];
    const dx = endX - x;
    const dy = endY - y;
    const length = dx * dx + dy * dy;
    let distance = .002 ** 2;
    let farthest = -1;
    for (let index = first + 1; index < last; index += 1) {
      const [px, py] = points[index];
      const progress = length ? Math.max(0, Math.min(1, ((px - x) * dx + (py - y) * dy) / length)) : 0;
      const candidate = (px - x - dx * progress) ** 2 + (py - y - dy * progress) ** 2;
      if (candidate > distance) {
        distance = candidate;
        farthest = index;
      }
    }
    if (farthest < 0) return;
    keep[farthest] = 1;
    keepCorners(first, farthest);
    keepCorners(farthest, last);
  };
  keepCorners(0, points.length - 1);
  return loop.filter((_, index) => keep[index]);
}

function traceGooeyField(samples, columns, rows, coordinate, fieldAt) {
  const crossings = new Map();
  const getCrossing = (from, to) => {
    const key = Math.min(from, to) * 2 + (Math.abs(to - from) === 1 ? 0 : 1);
    if (crossings.has(key)) return crossings.get(key);
    const t = (1 - samples[from]) / (samples[to] - samples[from]);
    const x = coordinate(from % columns + (to % columns - from % columns) * t);
    const row = Math.floor(from / columns);
    const y = coordinate(row + (Math.floor(to / columns) - row) * t);
    const crossing = { point: [x, y], next: null };
    crossings.set(key, crossing);
    return crossing;
  };
  for (let row = 0; row < rows - 1; row += 1) {
    for (let column = 0; column < columns - 1; column += 1) {
      const cell = row * columns + column;
      const firstInside = samples[cell] >= 1;
      if ((samples[cell + 1] >= 1) === firstInside && (samples[cell + columns + 1] >= 1) === firstInside
        && (samples[cell + columns] >= 1) === firstInside) continue;
      const corners = [cell, cell + 1, cell + columns + 1, cell + columns];
      const inside = corners.map((index) => samples[index] >= 1);
      const sides = corners.map((from, index) => {
        const next = (index + 1) % 4;
        return inside[index] === inside[next] ? null : getCrossing(from, corners[next]);
      });
      const active = sides.flatMap((crossing, side) => crossing ? [side] : []);
      // Orient the boundary with the filled region to its right, including around holes.
      const connect = (a, b) => {
        if (inside[a]) sides[a].next = sides[b];
        else sides[b].next = sides[a];
      };
      if (active.length === 2) {
        connect(...active);
      } else {
        // A saddle has four crossings. The center chooses which corners to connect around.
        const x = coordinate(column + .5);
        const y = coordinate(row + .5);
        const centerInside = fieldAt(x, y) >= 1;
        inside.forEach((value, index) => {
          if (value !== centerInside) connect((index + 3) % 4, index);
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
    while (current && !visited.has(current)) {
      visited.add(current);
      loop.push(current.point);
      current = current.next;
    }
    if (current === start && loop.length >= 3) loops.push(loop);
  }
  return loops;
}
