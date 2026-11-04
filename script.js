const defaults = {
  prefix: "",
  url: "example.com",
  outerMarkerColor: "#202020",
  innerMarkerColor: "#202020",
  moduleColor: "#202020",
  errorCorrection: "M",
  moduleStyle: "circuit",
  outerMarkerStyle: "rounded",
  cutOuterMarkerCorners: false,
  outerMarkerCornersOnly: false,
  innerMarkerStyle: "rounded",
  moduleScale: 100,
  exportFormat: "svg",
  exportSize: "256",
  logoSize: 20,
  showLogoArea: false,
  clearLogoArea: false,
};

const state = {
  ...defaults,
  encodedUrl: defaults.url,
  qr: null,
  logoDataUrl: "",
  logoAspectRatio: 1,
  logoImage: null,
  logoName: "",
};

const elements = {
  preview: document.querySelector("#qrPreview"),
  prefix: document.querySelector("#prefixSelect"),
  prefixGroup: document.querySelector("#prefixGroup"),
  prefixText: document.querySelector("#prefixText"),
  removePrefix: document.querySelector("#removePrefix"),
  urlInputWrap: document.querySelector("#urlInputWrap"),
  url: document.querySelector("#urlInput"),
  urlHelp: document.querySelector("#urlHelp"),
  encodingMode: document.querySelector("#encodingMode"),
  encodingModes: document.querySelectorAll("#encodingMode [data-mode]"),
  qrVersionInfo: document.querySelector("#qrVersionInfo"),
  qrVersionLabel: document.querySelector("#qrVersionLabel"),
  previousVersion: document.querySelector("#previousVersion"),
  nextVersion: document.querySelector("#nextVersion"),
  errorCorrection: document.querySelector("#errorCorrection"),
  moduleStyle: document.querySelector("#moduleStyle"),
  outerMarkerStyle: document.querySelector("#outerMarkerStyle"),
  cutOuterMarkerCorners: document.querySelector("#cutOuterMarkerCorners"),
  outerMarkerCornersOnly: document.querySelector("#outerMarkerCornersOnly"),
  innerMarkerStyle: document.querySelector("#innerMarkerStyle"),
  moduleScaleField: document.querySelector(".module-size-field"),
  moduleScale: document.querySelector("#moduleScale"),
  moduleScaleValue: document.querySelector("#moduleScaleValue"),
  outerMarkerColor: document.querySelector("#outerMarkerColor"),
  outerMarkerColorValue: document.querySelector("#outerMarkerColorValue"),
  innerMarkerColor: document.querySelector("#innerMarkerColor"),
  innerMarkerColorValue: document.querySelector("#innerMarkerColorValue"),
  moduleColor: document.querySelector("#moduleColor"),
  moduleColorValue: document.querySelector("#moduleColorValue"),
  logoInput: document.querySelector("#logoInput"),
  logoDropZone: document.querySelector("#logoDropZone"),
  logoFileName: document.querySelector("#logoFileName"),
  logoError: document.querySelector("#logoError"),
  logoSize: document.querySelector("#logoSize"),
  logoSizeValue: document.querySelector("#logoSizeValue"),
  removeLogo: document.querySelector("#removeLogo"),
  showLogoArea: document.querySelector("#showLogoArea"),
  clearLogoArea: document.querySelector("#clearLogoArea"),
  download: document.querySelector("#downloadButton"),
  exportFormat: document.querySelector("#exportFormat"),
  exportSize: document.querySelector("#exportSize"),
  toast: document.querySelector("#toast"),
};

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const QUIET_ZONE = 4;
const capacityCache = new Map();
let toastTimer;
let logoDragDepth = 0;

qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

function detectTextMode(value) {
  if (/^\d+$/.test(value)) return "Numeric";
  if (/^[0-9A-Z $%*+\-./:]+$/.test(value)) return "Alphanumeric";
  return "Byte";
}

function getQrMode(value, prefix) {
  if (!value) return null;
  return prefix ? "Byte" : detectTextMode(value);
}

function updateEncodingMode(mode) {
  elements.encodingModes.forEach((option) => {
    option.classList.toggle("active", option.dataset.mode === mode);
  });
  elements.encodingMode.setAttribute(
    "aria-label",
    mode ? `Detected QR encoding: ${mode}` : "No QR encoding detected",
  );
}

function fitsQrVersion(length, version, mode, errorCorrection) {
  const sample = mode === "Numeric" ? "0" : mode === "Alphanumeric" ? "A" : "a";
  try {
    const code = qrcode(version, errorCorrection);
    code.addData(sample.repeat(length), mode);
    code.make();
    return true;
  } catch {
    return false;
  }
}

function getQrCapacity(version, mode, errorCorrection) {
  const cacheKey = `${version}-${mode}-${errorCorrection}`;
  if (capacityCache.has(cacheKey)) return capacityCache.get(cacheKey);

  let lower = 0;
  let upper = 1;
  while (fitsQrVersion(upper, version, mode, errorCorrection)) {
    lower = upper;
    upper *= 2;
  }

  while (lower + 1 < upper) {
    const middle = Math.floor((lower + upper) / 2);
    if (fitsQrVersion(middle, version, mode, errorCorrection)) lower = middle;
    else upper = middle;
  }

  capacityCache.set(cacheKey, lower);
  return lower;
}

function getPayloadUnits(value, mode) {
  return mode === "Byte" ? qrcode.stringToBytes(value).length : value.length;
}

function formatUnits(amount, mode) {
  const singular = mode === "Numeric" ? "digit" : mode === "Byte" ? "byte" : "character";
  return `${amount} ${singular}${amount === 1 ? "" : "s"}`;
}

function updateVersionInfo(code, value, mode) {
  if (!code || !mode) {
    elements.qrVersionInfo.hidden = true;
    elements.qrVersionLabel.hidden = true;
    return;
  }

  const moduleCount = code.getModuleCount();
  const version = (moduleCount - 17) / 4;
  const units = getPayloadUnits(value, mode);
  const currentCapacity = getQrCapacity(version, mode, state.errorCorrection);
  const nextAmount = currentCapacity - units + 1;

  elements.qrVersionInfo.hidden = false;
  elements.qrVersionLabel.hidden = false;
  elements.qrVersionLabel.textContent = `V${version} · ${moduleCount}×${moduleCount}`;

  if (version === 1) {
    elements.previousVersion.textContent = "Minimum version";
  } else {
    const previousCapacity = getQrCapacity(version - 1, mode, state.errorCorrection);
    const previousArrow = document.createElement("strong");
    previousArrow.className = "version-arrow";
    previousArrow.textContent = "←";
    elements.previousVersion.replaceChildren(
      `V${version - 1} `,
      previousArrow,
      ` −${formatUnits(units - previousCapacity, mode)}`,
    );
  }

  if (version === 40) {
    elements.nextVersion.textContent = "Maximum version";
  } else {
    const nextArrow = document.createElement("strong");
    nextArrow.className = "version-arrow";
    nextArrow.textContent = "→";
    elements.nextVersion.replaceChildren(
      `+${formatUnits(nextAmount, mode)} `,
      nextArrow,
      ` V${version + 1}`,
    );
  }

  elements.qrVersionInfo.setAttribute(
    "aria-label",
    `QR version ${version}, ${moduleCount} by ${moduleCount} modules. ${elements.previousVersion.textContent}. ${elements.nextVersion.textContent}.`,
  );
}

function parseLink(value, prefix) {
  const trimmed = value.trim();
  if (!trimmed) return { empty: true };

  const candidate = `${prefix}${trimmed}`;

  if (!prefix) return { value: trimmed };

  if (prefix === "mailto:") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { error: "Enter a valid email address." };
    return { value: candidate };
  }

  if (prefix === "tel:" || prefix === "sms:") {
    if (!/\d/.test(trimmed) || !/^\+?[\d\s().-]+$/.test(trimmed)) return { error: "Enter a valid phone number." };
    return { value: candidate };
  }

  try {
    const parsed = new URL(candidate);
    if (`${parsed.protocol}//` !== prefix || !parsed.hostname) throw new Error("Invalid link");
    return { value: parsed.href };
  } catch {
    return { error: "Enter a valid web address without the prefix." };
  }
}

function updatePrefixField() {
  const selected = elements.prefix.selectedOptions[0];
  const prefix = elements.prefix.value;
  elements.prefixText.textContent = prefix;
  elements.prefixGroup.hidden = !prefix;
  elements.url.placeholder = selected.dataset.placeholder;
  elements.url.inputMode = selected.dataset.inputmode;
  elements.url.autocomplete = selected.dataset.autocomplete;
}

function createQr(value, mode) {
  const code = qrcode(0, state.errorCorrection);
  code.addData(value, mode);
  code.make();
  return code;
}

function formatNumber(value, precision = 2) {
  return Number(value.toFixed(precision)).toString();
}

function roundedRectCommand(x, y, width, height, radius) {
  const left = formatNumber(x);
  const top = formatNumber(y);
  const right = formatNumber(x + width);
  const bottom = formatNumber(y + height);
  const leftRadius = formatNumber(x + radius);
  const rightRadius = formatNumber(x + width - radius);
  const topRadius = formatNumber(y + radius);
  const bottomRadius = formatNumber(y + height - radius);
  return `M${leftRadius} ${top}H${rightRadius}Q${right} ${top} ${right} ${topRadius}V${bottomRadius}Q${right} ${bottom} ${rightRadius} ${bottom}H${leftRadius}Q${left} ${bottom} ${left} ${bottomRadius}V${topRadius}Q${left} ${top} ${leftRadius} ${top}Z`;
}

function circleCommand(centerX, centerY, radius) {
  const r = formatNumber(radius, 4);
  const right = formatNumber(centerX + Number(r), 4);
  const center = formatNumber(centerY, 4);
  // Relative quarter-arcs avoid rounding mismatches between radius and endpoints.
  return `M${right} ${center}a${r} ${r} 0 0 1 -${r} ${r}a${r} ${r} 0 0 1 -${r} -${r}a${r} ${r} 0 0 1 ${r} -${r}a${r} ${r} 0 0 1 ${r} ${r}Z`;
}

function getModuleScale() {
  return state.moduleScale / 100;
}

function crossModulePoints(centerX, centerY, size, rotated) {
  const half = size / 2;
  const arm = size / 6;
  const points = [
    [-arm, -half], [arm, -half], [arm, -arm], [half, -arm],
    [half, arm], [arm, arm], [arm, half], [-arm, half],
    [-arm, arm], [-half, arm], [-half, -arm], [-arm, -arm],
  ];
  return points.map(([dx, dy]) => (
    rotated
      ? [centerX + (dx - dy) * Math.SQRT1_2, centerY + (dx + dy) * Math.SQRT1_2]
      : [centerX + dx, centerY + dy]
  ));
}

function hexagonModulePoints(centerX, centerY, size) {
  const half = size / 2;
  const quarter = size / 4;
  const height = size * Math.sqrt(3) / 4;
  return [
    [-half, 0], [-quarter, -height], [quarter, -height],
    [half, 0], [quarter, height], [-quarter, height],
  ].map(([dx, dy]) => [centerX + dx, centerY + dy]);
}

function heartModuleGeometry(x, y, size) {
  const top = y + size * .07;
  const curves = [
    [.45, .045, .36, 0, .27, 0],
    [.12, 0, 0, .12, 0, .265],
    [0, .47, .21, .67, .5, .86],
    [.79, .67, 1, .47, 1, .265],
    [1, .12, .88, 0, .73, 0],
    [.64, 0, .55, .045, .5, .145],
  ];
  return {
    start: [x + size * .5, top + size * .145],
    curves: curves.map((curve) => curve.map((value, index) => (
      (index % 2 === 0 ? x : top) + value * size
    ))),
  };
}

function roundedStarModuleGeometry(x, y, size) {
  const top = y + size * .01;
  const height = size * .98;
  const curves = [
    [.6, 0, .67, .05, .7, .12],
    [.74, .2, .78, .21, .85, .23],
    [.95, .25, 1, .32, 1, .43],
    [1, .5, .96, .55, .92, .61],
    [.88, .68, .9, .73, .89, .8],
    [.89, .95, .8, 1, .68, 1],
    [.61, 1, .57, .95, .5, .95],
    [.43, .95, .39, 1, .32, 1],
    [.2, 1, .11, .95, .11, .8],
    [.1, .73, .12, .68, .08, .61],
    [.04, .55, 0, .5, 0, .43],
    [0, .32, .05, .25, .15, .23],
    [.22, .21, .26, .2, .3, .12],
    [.33, .05, .4, 0, .5, 0],
  ];
  return {
    start: [x + size * .5, top],
    curves: curves.map((curve) => curve.map((value, index) => (
      index % 2 === 0 ? x + value * size : top + value * height
    ))),
  };
}

function moduleCommand(x, y, style) {
  const size = getModuleScale();
  const inset = (1 - size) / 2;
  const left = x + inset;
  const top = y + inset;

  if (["hearts", "rounded-star"].includes(style)) {
    const { start, curves } = style === "hearts"
      ? heartModuleGeometry(left, top, size)
      : roundedStarModuleGeometry(left, top, size);
    const coordinates = (points) => points.map((value) => formatNumber(value, 4)).join(" ");
    return `M${coordinates(start)}${curves.map((curve) => `C${coordinates(curve)}`).join("")}Z`;
  }
  if (["cross", "cross-rotated", "hexagon"].includes(style)) {
    const points = style === "hexagon"
      ? hexagonModulePoints(x + .5, y + .5, size)
      : crossModulePoints(x + .5, y + .5, size, style === "cross-rotated");
    return points.map(([px, py], index) => (
      `${index === 0 ? "M" : "L"}${formatNumber(px, 4)} ${formatNumber(py, 4)}`
    )).join("") + "Z";
  }
  if (style === "diamond") {
    const centerX = formatNumber(x + .5);
    const centerY = formatNumber(y + .5);
    return `M${centerX} ${formatNumber(top)}L${formatNumber(left + size)} ${centerY}L${centerX} ${formatNumber(top + size)}L${formatNumber(left)} ${centerY}Z`;
  }
  if (style === "dots") return circleCommand(x + .5, y + .5, size / 2);
  if (style === "rounded") return roundedRectCommand(left, top, size, size, size * .35);
  if (style === "soft") return roundedRectCommand(left, top, size, size, size * .16);
  if (size < 1) return roundedRectCommand(left, top, size, size, 0);
  return `M${x} ${y}h1v1h-1z`;
}

function isMarkerModule(row, column, count) {
  const inTop = row < 7;
  const inLeft = column < 7;
  const inRight = column >= count - 7;
  const inBottom = row >= count - 7;
  return (inTop && (inLeft || inRight)) || (inBottom && inLeft);
}

function isCircuitStyle(style = state.moduleStyle) {
  return ["circuit", "circuit-horizontal", "circuit-vertical"].includes(style);
}

function getCircuitWidth() {
  return getModuleScale();
}

function moduleIntersectsBox(row, column, quietZone, box, style = state.moduleStyle) {
  if (!box) return false;
  const size = isCircuitStyle(style) ? getCircuitWidth() : getModuleScale();
  const inset = (1 - size) / 2;
  const left = column + quietZone + inset;
  const top = row + quietZone + inset;
  return rectangleIntersectsBox(left, top, size, size, box);
}

function rectangleIntersectsBox(left, top, width, height, box) {
  if (!box) return false;
  return left + width > box.x
    && left < box.x + box.width
    && top + height > box.y
    && top < box.y + box.height;
}

function shouldRenderModule(code, row, column, quietZone, exclusionBox, style = state.moduleStyle) {
  const count = code.getModuleCount();
  if (row < 0 || column < 0 || row >= count || column >= count) return false;
  return code.isDark(row, column)
    && !isMarkerModule(row, column, count)
    && !moduleIntersectsBox(row, column, quietZone, exclusionBox, style);
}

function circuitSegmentIntersectsBox(x1, y1, x2, y2, width, box) {
  if (!box) return false;
  const radius = width / 2;
  const left = Math.min(x1, x2) - radius;
  const top = Math.min(y1, y2) - radius;
  const segmentWidth = Math.abs(x2 - x1) + width;
  const segmentHeight = Math.abs(y2 - y1) + width;
  return rectangleIntersectsBox(left, top, segmentWidth, segmentHeight, box);
}

function getCircuitGeometry(code, quietZone = QUIET_ZONE, style = state.moduleStyle) {
  const count = code.getModuleCount();
  const width = getCircuitWidth();
  const exclusionBox = state.clearLogoArea ? getLogoBox(code, quietZone) : null;
  const segments = [];
  const dots = [];

  const hasConnection = (row, column, nextRow, nextColumn) => {
    if (style === "circuit-horizontal" && row !== nextRow) return false;
    if (style === "circuit-vertical" && column !== nextColumn) return false;
    if (!shouldRenderModule(code, row, column, quietZone, exclusionBox, style)) return false;
    if (!shouldRenderModule(code, nextRow, nextColumn, quietZone, exclusionBox, style)) return false;
    const x1 = column + quietZone + .5;
    const y1 = row + quietZone + .5;
    const x2 = nextColumn + quietZone + .5;
    const y2 = nextRow + quietZone + .5;
    return !circuitSegmentIntersectsBox(x1, y1, x2, y2, width, exclusionBox);
  };

  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (!shouldRenderModule(code, row, column, quietZone, exclusionBox, style)) continue;
      const x = column + quietZone + .5;
      const y = row + quietZone + .5;
      const right = hasConnection(row, column, row, column + 1);
      const down = hasConnection(row, column, row + 1, column);
      const connectionCount = Number(right)
        + Number(down)
        + Number(hasConnection(row, column, row, column - 1))
        + Number(hasConnection(row, column, row - 1, column));

      if (right) segments.push({ x1: x, y1: y, x2: x + 1, y2: y });
      if (down) segments.push({ x1: x, y1: y, x2: x, y2: y + 1 });
      if (connectionCount === 0) dots.push({ x, y });
    }
  }

  return { segments, dots, width };
}

function circuitTrackPath(geometry) {
  return geometry.segments.map(({ x1, y1, x2, y2 }) => (
    `M${formatNumber(x1)} ${formatNumber(y1)}L${formatNumber(x2)} ${formatNumber(y2)}`
  )).join("");
}

function circuitDotPath(geometry) {
  return geometry.dots.map(({ x, y }) => circleCommand(x, y, geometry.width / 2)).join("");
}

function modulesToPath(code, quietZone = QUIET_ZONE, style = state.moduleStyle) {
  const count = code.getModuleCount();
  const commands = [];
  const exclusionBox = state.clearLogoArea ? getLogoBox(code, quietZone) : null;

  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (!shouldRenderModule(code, row, column, quietZone, exclusionBox, style)) continue;
      const x = column + quietZone;
      const y = row + quietZone;
      commands.push(moduleCommand(x, y, style));
    }
  }

  return commands.join("");
}

function markerPositions(code, quietZone = QUIET_ZONE) {
  const edge = code.getModuleCount() - 7;
  return [
    [quietZone, quietZone],
    [quietZone + edge, quietZone],
    [quietZone, quietZone + edge],
  ];
}

function cornerRoundedRectCommand(x, y, size, radius, markerIndex, inward) {
  const flipX = (markerIndex === 1) !== inward;
  const flipY = (markerIndex === 2) !== inward;
  const point = (dx, dy) => {
    const px = x + (flipX ? size - dx : dx);
    const py = y + (flipY ? size - dy : dy);
    return `${formatNumber(px)} ${formatNumber(py)}`;
  };
  return `M${point(radius, 0)}L${point(size, 0)}L${point(size, size)}L${point(0, size)}L${point(0, radius)}Q${point(0, 0)} ${point(radius, 0)}Z`;
}

function oppositeCornersRectCommand(x, y, size, radius, reverse) {
  const point = (dx, dy) => (
    `${formatNumber(x + (reverse ? size - dx : dx))} ${formatNumber(y + dy)}`
  );
  return `M${point(radius, 0)}L${point(size, 0)}L${point(size, size - radius)}Q${point(size, size)} ${point(size - radius, size)}L${point(0, size)}L${point(0, radius)}Q${point(0, 0)} ${point(radius, 0)}Z`;
}

function hasOuterMarkerClip() {
  return state.cutOuterMarkerCorners || state.outerMarkerCornersOnly;
}

function outerMarkerClipCommand(x, y, scale = 1) {
  const third = 7 * scale / 3;
  const nearX = formatNumber(x + third, 4);
  const farX = formatNumber(x + 2 * third, 4);
  const nearY = formatNumber(y + third, 4);
  const farY = formatNumber(y + 2 * third, 4);
  const left = formatNumber(x, 4);
  const right = formatNumber(x + 7 * scale, 4);
  const top = formatNumber(y, 4);
  const bottom = formatNumber(y + 7 * scale, 4);
  if (state.outerMarkerCornersOnly) {
    return `M${left} ${top}H${nearX}V${nearY}H${left}Z`
      + `M${farX} ${top}H${right}V${nearY}H${farX}Z`
      + `M${left} ${farY}H${nearX}V${bottom}H${left}Z`
      + `M${farX} ${farY}H${right}V${bottom}H${farX}Z`;
  }
  return `M${nearX} ${top}H${farX}V${nearY}H${right}V${farY}H${farX}V${bottom}H${nearX}V${farY}H${left}V${nearY}H${nearX}Z`;
}

function getMarkerClips(code) {
  if (!hasOuterMarkerClip()) return [];
  return markerPositions(code).map(([x, y], markerIndex) => ({
    id: `outer-marker-cut-${markerIndex}`,
    d: outerMarkerClipCommand(x, y),
  }));
}

function getMarkerShape(x, y, markerIndex, part, scale = 1) {
  const outer = part === "outer";
  const style = state[`${part}MarkerStyle`];
  const color = state[`${part}MarkerColor`];
  const inset = (outer ? .5 : 2) * scale;
  const size = (outer ? 6 : 3) * scale;
  const radius = (outer ? 1.25 : .8) * scale;
  const attributes = outer
    ? {
      fill: "none", stroke: color, "stroke-width": scale,
      ...(hasOuterMarkerClip() ? { "clip-path": `url(#outer-marker-cut-${markerIndex})` } : {}),
    }
    : { fill: color };

  if (style === "circle") {
    return { tag: "circle", attributes: { ...attributes, cx: x + 3.5 * scale, cy: y + 3.5 * scale, r: size / 2 } };
  }
  if (["outer-rounded", "inner-rounded"].includes(style)) {
    return {
      tag: "path",
      attributes: { ...attributes, d: cornerRoundedRectCommand(x + inset, y + inset, size, radius, markerIndex, style === "inner-rounded") },
    };
  }
  if (["opposite-inward-rounded", "opposite-outward-rounded"].includes(style)) {
    const reverse = (markerIndex !== 0) !== (style === "opposite-outward-rounded");
    return {
      tag: "path",
      attributes: { ...attributes, d: oppositeCornersRectCommand(x + inset, y + inset, size, radius, reverse) },
    };
  }
  return {
    tag: "rect",
    attributes: { ...attributes, x: x + inset, y: y + inset, width: size, height: size, rx: style === "rounded" ? radius : 0 },
  };
}

function setAttributes(node, attributes) {
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
  return node;
}

function appendSvgModules(svg, code) {
  if (isCircuitStyle()) {
    const geometry = getCircuitGeometry(code);
    const trackData = circuitTrackPath(geometry);
    const dotData = circuitDotPath(geometry);

    if (trackData) {
      svg.append(setAttributes(document.createElementNS(SVG_NAMESPACE, "path"), {
        d: trackData,
        fill: "none",
        stroke: state.moduleColor,
        "stroke-width": formatNumber(geometry.width),
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }));
    }
    if (dotData) {
      svg.append(setAttributes(document.createElementNS(SVG_NAMESPACE, "path"), {
        d: dotData,
        fill: state.moduleColor,
      }));
    }
    return;
  }

  svg.append(setAttributes(document.createElementNS(SVG_NAMESPACE, "path"), {
    d: modulesToPath(code),
    fill: state.moduleColor,
  }));
}

function appendSvgMarkers(svg, code) {
  const clips = getMarkerClips(code);
  if (clips.length) {
    const definitions = document.createElementNS(SVG_NAMESPACE, "defs");
    clips.forEach(({ id, d }) => {
      const clip = setAttributes(document.createElementNS(SVG_NAMESPACE, "clipPath"), {
        id, clipPathUnits: "userSpaceOnUse",
      });
      clip.append(setAttributes(document.createElementNS(SVG_NAMESPACE, "path"), { d }));
      definitions.append(clip);
    });
    svg.append(definitions);
  }
  markerPositions(code).forEach(([x, y], markerIndex) => {
    ["outer", "inner"].forEach((part) => {
      const { tag, attributes } = getMarkerShape(x, y, markerIndex, part);
      svg.append(setAttributes(document.createElementNS(SVG_NAMESPACE, tag), attributes));
    });
  });
}

function getLogoBox(code, quietZone = QUIET_ZONE) {
  const count = code.getModuleCount();
  const maximum = count * (state.logoSize / 100);
  const ratio = state.logoAspectRatio || 1;
  const width = ratio >= 1 ? maximum : maximum * ratio;
  const height = ratio >= 1 ? maximum / ratio : maximum;
  return {
    x: quietZone + (count - width) / 2,
    y: quietZone + (count - height) / 2,
    width,
    height,
  };
}

function appendSvgLogo(svg, code) {
  if (!state.logoDataUrl) return;
  const box = getLogoBox(code);
  const image = setAttributes(document.createElementNS(SVG_NAMESPACE, "image"), {
    x: formatNumber(box.x),
    y: formatNumber(box.y),
    width: formatNumber(box.width),
    height: formatNumber(box.height),
    href: state.logoDataUrl,
    preserveAspectRatio: "xMidYMid meet",
  });
  svg.append(image);
}

function appendSvgLogoGuide(svg, code) {
  if (!state.showLogoArea) return;
  const box = getLogoBox(code);
  const guide = setAttributes(document.createElementNS(SVG_NAMESPACE, "rect"), {
    x: formatNumber(box.x),
    y: formatNumber(box.y),
    width: formatNumber(box.width),
    height: formatNumber(box.height),
    class: "logo-area-guide",
  });
  svg.append(guide);
}

function clearPreview() {
  elements.preview.replaceChildren();
  elements.preview.removeAttribute("viewBox");
  elements.preview.removeAttribute("shape-rendering");
}

function setValidation(message = "") {
  const hasError = Boolean(message);
  elements.url.setAttribute("aria-invalid", String(hasError));
  elements.urlInputWrap.classList.toggle("has-error", hasError);
  elements.urlHelp.textContent = message;
  elements.urlHelp.hidden = !hasError;
  elements.urlHelp.classList.toggle("error", hasError);
}

function render() {
  const trimmedValue = elements.url.value.trim();
  const qrMode = getQrMode(trimmedValue, elements.prefix.value);
  const result = parseLink(trimmedValue, elements.prefix.value);
  updateEncodingMode(qrMode);
  elements.outerMarkerColorValue.value = state.outerMarkerColor.toUpperCase();
  elements.cutOuterMarkerCorners.checked = state.cutOuterMarkerCorners;
  elements.outerMarkerCornersOnly.checked = state.outerMarkerCornersOnly;
  elements.innerMarkerColorValue.value = state.innerMarkerColor.toUpperCase();
  elements.moduleColorValue.value = state.moduleColor.toUpperCase();
  elements.moduleScale.value = state.moduleScale;
  elements.moduleScaleValue.textContent = `${state.moduleScale}%`;
  elements.logoSizeValue.textContent = `${state.logoSize}%`;

  if (result.empty) {
    state.qr = null;
    state.encodedUrl = "";
    setValidation();
    updateVersionInfo(null);
    clearPreview();
    elements.download.disabled = true;
    return;
  }

  if (result.error) {
    state.qr = null;
    state.encodedUrl = "";
    setValidation(result.error);
    updateVersionInfo(null);
    clearPreview();
    elements.download.disabled = true;
    return;
  }

  try {
    state.qr = createQr(result.value, qrMode);
    state.encodedUrl = result.value;
  } catch {
    state.qr = null;
    state.encodedUrl = "";
    setValidation("The link is too long to generate a QR code.");
    updateVersionInfo(null);
    clearPreview();
    elements.download.disabled = true;
    return;
  }

  setValidation();
  updateVersionInfo(state.qr, result.value, qrMode);
  const dimension = state.qr.getModuleCount() + QUIET_ZONE * 2;
  elements.preview.replaceChildren();
  appendSvgModules(elements.preview, state.qr);
  appendSvgMarkers(elements.preview, state.qr);
  appendSvgLogo(elements.preview, state.qr);
  appendSvgLogoGuide(elements.preview, state.qr);
  elements.preview.setAttribute("viewBox", `0 0 ${dimension} ${dimension}`);
  elements.preview.setAttribute(
    "shape-rendering",
    state.moduleStyle === "square" && state.outerMarkerStyle === "square" && state.innerMarkerStyle === "square" && !hasOuterMarkerClip() ? "crispEdges" : "geometricPrecision",
  );
  elements.download.disabled = false;
}

function setColor(key, value) {
  state[key] = value.toLowerCase();
  elements[key].value = state[key];
  render();
}

function setLogoError(message = "") {
  elements.logoError.textContent = message;
  elements.logoError.hidden = !message;
}

function containsUnsafeCss(value) {
  if (/@import|javascript:|expression\s*\(/i.test(value)) return true;
  const urls = [...value.matchAll(/url\(([^)]+)\)/gi)];
  return urls.some((match) => {
    const target = match[1].trim().replace(/^['"]|['"]$/g, "");
    return !target.startsWith("#") && !/^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(target);
  });
}

function sanitizeLogoSvg(source) {
  const documentNode = new DOMParser().parseFromString(source, "image/svg+xml");
  const root = documentNode.documentElement;
  if (root.localName !== "svg" || documentNode.querySelector("parsererror")) {
    throw new Error("Choose a valid SVG file.");
  }

  documentNode.querySelectorAll("script, foreignObject, iframe, object, embed, audio, video").forEach((node) => node.remove());

  documentNode.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();

      if (name.startsWith("on") || /javascript:/i.test(value)) {
        node.removeAttribute(attribute.name);
        return;
      }

      if (name === "href" || name === "xlink:href") {
        const allowedReference = value.startsWith("#") || /^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(value);
        if (!allowedReference) node.removeAttribute(attribute.name);
        return;
      }

      if ((name === "style" || value.toLowerCase().includes("url(")) && containsUnsafeCss(value)) {
        node.removeAttribute(attribute.name);
      }
    });
  });

  documentNode.querySelectorAll("style").forEach((node) => {
    if (containsUnsafeCss(node.textContent || "")) node.remove();
  });

  if (!root.getAttribute("xmlns")) root.setAttribute("xmlns", SVG_NAMESPACE);

  const viewBox = (root.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
  let aspectRatio = 1;
  if (viewBox.length === 4 && viewBox[2] > 0 && viewBox[3] > 0) {
    aspectRatio = viewBox[2] / viewBox[3];
  } else {
    const width = Number.parseFloat(root.getAttribute("width"));
    const height = Number.parseFloat(root.getAttribute("height"));
    if (width > 0 && height > 0) aspectRatio = width / height;
  }

  return {
    source: new XMLSerializer().serializeToString(root),
    aspectRatio,
  };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("The SVG could not be read.")));
    reader.readAsDataURL(blob);
  });
}

function loadLogoImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("The SVG could not be rendered.")));
    image.src = source;
  });
}

async function handleLogoFile(file) {
  if (!file) return;
  setLogoError();

  if (!/\.svg$/i.test(file.name) && file.type !== "image/svg+xml") {
    setLogoError("Choose an SVG file.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setLogoError("The SVG must be smaller than 5 MB.");
    return;
  }

  try {
    const sanitized = sanitizeLogoSvg(await file.text());
    const dataUrl = await blobToDataUrl(new Blob([sanitized.source], { type: "image/svg+xml" }));
    const image = await loadLogoImage(dataUrl);
    state.logoDataUrl = dataUrl;
    state.logoAspectRatio = sanitized.aspectRatio;
    state.logoImage = image;
    state.logoName = file.name;
    elements.logoFileName.textContent = file.name;
    elements.logoFileName.title = file.name;
    elements.logoDropZone.classList.add("has-logo");
    elements.removeLogo.hidden = false;
    render();
  } catch (error) {
    setLogoError(error.message || "The SVG could not be loaded.");
  }
}

function clearLogo(renderAfter = true) {
  logoDragDepth = 0;
  state.logoDataUrl = "";
  state.logoAspectRatio = 1;
  state.logoImage = null;
  state.logoName = "";
  elements.logoInput.value = "";
  elements.logoFileName.textContent = "SVG · Max 5 MB";
  elements.logoFileName.removeAttribute("title");
  elements.logoDropZone.classList.remove("has-logo", "drag-active");
  elements.removeLogo.hidden = true;
  setLogoError();
  if (renderAfter) render();
}

elements.url.addEventListener("input", render);
elements.prefix.addEventListener("change", () => {
  updatePrefixField();
  render();
});
elements.removePrefix.addEventListener("click", () => {
  elements.prefix.value = "";
  updatePrefixField();
  render();
  elements.url.focus();
});
elements.errorCorrection.addEventListener("change", () => {
  state.errorCorrection = elements.errorCorrection.value;
  render();
});

["moduleStyle", "outerMarkerStyle", "innerMarkerStyle"].forEach((key) => {
  elements[key].addEventListener("change", () => {
    state[key] = elements[key].value;
    render();
  });
});

elements.moduleScale.addEventListener("input", () => {
  state.moduleScale = Number(elements.moduleScale.value);
  render();
});

[
  ["cutOuterMarkerCorners", "outerMarkerCornersOnly"],
  ["outerMarkerCornersOnly", "cutOuterMarkerCorners"],
].forEach(([key, otherKey]) => {
  elements[key].addEventListener("change", () => {
    state[key] = elements[key].checked;
    if (state[key]) state[otherKey] = false;
    render();
  });
});

elements.logoInput.addEventListener("change", async () => {
  const [file] = elements.logoInput.files;
  await handleLogoFile(file);
  elements.logoInput.value = "";
});

elements.logoDropZone.addEventListener("click", (event) => {
  if (event.target === elements.logoInput || event.target === elements.removeLogo) return;
  elements.logoInput.click();
});

elements.logoDropZone.addEventListener("keydown", (event) => {
  if (event.target === elements.logoInput || event.target === elements.removeLogo) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  elements.logoInput.click();
});

elements.logoDropZone.addEventListener("dragenter", (event) => {
  event.preventDefault();
  logoDragDepth += 1;
  elements.logoDropZone.classList.add("drag-active");
});

elements.logoDropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
});

elements.logoDropZone.addEventListener("dragleave", () => {
  logoDragDepth = Math.max(0, logoDragDepth - 1);
  if (logoDragDepth === 0) elements.logoDropZone.classList.remove("drag-active");
});

elements.logoDropZone.addEventListener("dragend", () => {
  logoDragDepth = 0;
  elements.logoDropZone.classList.remove("drag-active");
});

elements.logoDropZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  logoDragDepth = 0;
  elements.logoDropZone.classList.remove("drag-active");
  const [file] = event.dataTransfer?.files || [];
  await handleLogoFile(file);
});

elements.removeLogo.addEventListener("click", (event) => {
  event.stopPropagation();
  clearLogo();
});

elements.logoSize.addEventListener("input", () => {
  state.logoSize = Number(elements.logoSize.value);
  render();
});

elements.showLogoArea.addEventListener("change", () => {
  state.showLogoArea = elements.showLogoArea.checked;
  render();
});

elements.clearLogoArea.addEventListener("change", () => {
  state.clearLogoArea = elements.clearLogoArea.checked;
  render();
});

["outerMarkerColor", "innerMarkerColor", "moduleColor"].forEach((key) => {
  const colorInput = elements[key];
  const hexInput = elements[`${key}Value`];
  colorInput.addEventListener("input", () => setColor(key, colorInput.value));

  hexInput.addEventListener("input", () => {
    const value = hexInput.value.trim();
    if (!/^#?[\da-f]{6}$/i.test(value)) return;
    setColor(key, `#${value.replace("#", "")}`);
  });

  hexInput.addEventListener("blur", () => {
    const value = hexInput.value.trim().replace("#", "");
    if (/^[\da-f]{3}$/i.test(value)) {
      setColor(key, `#${[...value].map((character) => character.repeat(2)).join("")}`);
    } else {
      render();
    }
  });

  hexInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") hexInput.blur();
    if (event.key === "Escape") {
      hexInput.value = state[key].toUpperCase();
      hexInput.blur();
    }
  });
});

function buildSvg(code, size) {
  const dimension = code.getModuleCount() + QUIET_ZONE * 2;
  let moduleData;
  if (isCircuitStyle()) {
    const geometry = getCircuitGeometry(code);
    const trackData = circuitTrackPath(geometry);
    const dotData = circuitDotPath(geometry);
    moduleData = `${trackData ? `<path d="${trackData}" fill="none" stroke="${state.moduleColor}" stroke-width="${formatNumber(geometry.width)}" stroke-linecap="round" stroke-linejoin="round"/>` : ""}${dotData ? `<path d="${dotData}" fill="${state.moduleColor}"/>` : ""}`;
  } else {
    moduleData = `<path d="${modulesToPath(code)}" fill="${state.moduleColor}"/>`;
  }
  const markerData = markerPositions(code).map(([x, y], markerIndex) => {
    return ["outer", "inner"].map((part) => {
      const { tag, attributes } = getMarkerShape(x, y, markerIndex, part);
      const data = Object.entries(attributes).map(([name, value]) => `${name}="${value}"`).join(" ");
      return `<${tag} ${data}/>`;
    }).join("");
  }).join("");
  const clipData = getMarkerClips(code).map(({ id, d }) => (
    `<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${d}"/></clipPath>`
  )).join("");
  const definitions = clipData ? `<defs>${clipData}</defs>` : "";
  const rendering = state.moduleStyle === "square" && state.outerMarkerStyle === "square" && state.innerMarkerStyle === "square" && !hasOuterMarkerClip()
    ? "crispEdges"
    : "geometricPrecision";
  let logoData = "";
  if (state.logoDataUrl) {
    const box = getLogoBox(code);
    logoData = `<image x="${formatNumber(box.x)}" y="${formatNumber(box.y)}" width="${formatNumber(box.width)}" height="${formatNumber(box.height)}" href="${state.logoDataUrl}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${dimension} ${dimension}" shape-rendering="${rendering}">${definitions}${moduleData}${markerData}${logoData}</svg>\n`;
}

function addRoundedRectPath(context, x, y, width, height, radius) {
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function addCanvasModule(context, left, top, moduleSize) {
  const scale = getModuleScale();
  const renderedSize = moduleSize * scale;
  const inset = (moduleSize - renderedSize) / 2;

  if (["hearts", "rounded-star"].includes(state.moduleStyle)) {
    const { start, curves } = state.moduleStyle === "hearts"
      ? heartModuleGeometry(left + inset, top + inset, renderedSize)
      : roundedStarModuleGeometry(left + inset, top + inset, renderedSize);
    context.moveTo(...start);
    curves.forEach((curve) => context.bezierCurveTo(...curve));
    context.closePath();
    return;
  }
  if (["cross", "cross-rotated", "hexagon"].includes(state.moduleStyle)) {
    const points = state.moduleStyle === "hexagon"
      ? hexagonModulePoints(left + moduleSize / 2, top + moduleSize / 2, renderedSize)
      : crossModulePoints(left + moduleSize / 2, top + moduleSize / 2, renderedSize, state.moduleStyle === "cross-rotated");
    points.forEach(([x, y], index) => {
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.closePath();
    return;
  }
  if (state.moduleStyle === "diamond") {
    const centerX = left + moduleSize * .5;
    const centerY = top + moduleSize * .5;
    context.moveTo(centerX, top + inset);
    context.lineTo(left + inset + renderedSize, centerY);
    context.lineTo(centerX, top + inset + renderedSize);
    context.lineTo(left + inset, centerY);
    context.closePath();
    return;
  }
  if (state.moduleStyle === "dots") {
    context.moveTo(left + moduleSize * .5 + renderedSize * .5, top + moduleSize * .5);
    context.arc(left + moduleSize * .5, top + moduleSize * .5, renderedSize * .5, 0, Math.PI * 2);
    return;
  }

  const radius = state.moduleStyle === "rounded" ? renderedSize * .35 : renderedSize * .16;
  addRoundedRectPath(
    context,
    left + inset,
    top + inset,
    renderedSize,
    renderedSize,
    radius,
  );
}

function drawCanvasCircuit(context, geometry, moduleSize, offset) {
  context.save();
  context.strokeStyle = state.moduleColor;
  context.fillStyle = state.moduleColor;
  context.lineWidth = geometry.width * moduleSize;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (geometry.segments.length) {
    context.beginPath();
    geometry.segments.forEach(({ x1, y1, x2, y2 }) => {
      context.moveTo(offset + x1 * moduleSize, offset + y1 * moduleSize);
      context.lineTo(offset + x2 * moduleSize, offset + y2 * moduleSize);
    });
    context.stroke();
  }

  if (geometry.dots.length) {
    context.beginPath();
    geometry.dots.forEach(({ x, y }) => {
      const centerX = offset + x * moduleSize;
      const centerY = offset + y * moduleSize;
      const radius = geometry.width * moduleSize / 2;
      context.moveTo(centerX + radius, centerY);
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    });
    context.fill();
  }

  context.restore();
}

function drawCanvasMarkers(context, code, moduleSize, offset, quietZone) {
  context.fillStyle = state.innerMarkerColor;
  context.strokeStyle = state.outerMarkerColor;
  context.lineWidth = moduleSize;
  context.lineCap = "butt";

  markerPositions(code, quietZone).forEach(([moduleX, moduleY], markerIndex) => {
    const x = offset + moduleX * moduleSize;
    const y = offset + moduleY * moduleSize;

    ["outer", "inner"].forEach((part) => {
      const { tag, attributes } = getMarkerShape(x, y, markerIndex, part, moduleSize);
      const draw = part === "outer" ? "stroke" : "fill";
      context.save();
      if (part === "outer" && hasOuterMarkerClip()) {
        context.clip(new Path2D(outerMarkerClipCommand(x, y, moduleSize)));
      }
      if (tag === "path") {
        context[draw](new Path2D(attributes.d));
      } else {
        context.beginPath();
        if (tag === "circle") {
          context.arc(attributes.cx, attributes.cy, attributes.r, 0, Math.PI * 2);
        } else if (attributes.rx) {
          addRoundedRectPath(context, attributes.x, attributes.y, attributes.width, attributes.height, attributes.rx);
        } else {
          context.rect(attributes.x, attributes.y, attributes.width, attributes.height);
        }
        context[draw]();
      }
      context.restore();
    });
  });
}

function drawQrToCanvas(context, code, size) {
  const count = code.getModuleCount();
  // Use whole pixels per module whenever possible. This avoids soft or uneven
  // module edges in PNG files and keeps the result easier for cameras to read.
  const quietZone = count + QUIET_ZONE * 2 <= size
    ? QUIET_ZONE
    : Math.max(0, Math.floor((size - count) / 2));
  const dimension = count + quietZone * 2;
  const integerModuleSize = Math.floor(size / dimension);
  const moduleSize = integerModuleSize || size / dimension;
  const offset = integerModuleSize ? Math.floor((size - moduleSize * dimension) / 2) : 0;
  const exclusionBox = state.clearLogoArea ? getLogoBox(code, quietZone) : null;

  context.clearRect(0, 0, size, size);
  context.fillStyle = state.moduleColor;

  if (isCircuitStyle()) {
    drawCanvasCircuit(context, getCircuitGeometry(code, quietZone), moduleSize, offset);
  } else {
    if (state.moduleStyle !== "square") context.beginPath();

    for (let row = 0; row < count; row += 1) {
      for (let column = 0; column < count; column += 1) {
        if (!shouldRenderModule(code, row, column, quietZone, exclusionBox)) continue;
        const left = offset + (column + quietZone) * moduleSize;
        const top = offset + (row + quietZone) * moduleSize;

        if (state.moduleStyle === "square") {
          if (state.moduleScale === 100) {
            const roundedLeft = Math.round(left);
            const roundedTop = Math.round(top);
            const right = offset + Math.round((column + quietZone + 1) * moduleSize);
            const bottom = offset + Math.round((row + quietZone + 1) * moduleSize);
            context.fillRect(roundedLeft, roundedTop, right - roundedLeft, bottom - roundedTop);
          } else {
            const renderedSize = moduleSize * (state.moduleScale / 100);
            const inset = (moduleSize - renderedSize) / 2;
            context.fillRect(left + inset, top + inset, renderedSize, renderedSize);
          }
        } else {
          addCanvasModule(context, left, top, moduleSize);
        }
      }
    }

    if (state.moduleStyle !== "square") context.fill();
  }

  drawCanvasMarkers(context, code, moduleSize, offset, quietZone);

  if (state.logoImage) {
    const box = getLogoBox(code, quietZone);
    context.drawImage(
      state.logoImage,
      offset + box.x * moduleSize,
      offset + box.y * moduleSize,
      box.width * moduleSize,
      box.height * moduleSize,
    );
  }
}

function downloadFile(blob, filename) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showToast(format, size) {
  clearTimeout(toastTimer);
  elements.toast.textContent = `${format.toUpperCase()} · ${size} px downloaded`;
  elements.toast.classList.add("show");
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2400);
}

function getFilename(size, extension) {
  let hostname = "link";
  try {
    hostname = new URL(state.encodedUrl).hostname.replace(/^www\./, "").replace(/[^a-z\d]+/gi, "-").replace(/^-|-$/g, "") || "link";
  } catch {
    // The download button is disabled whenever the URL is invalid.
  }
  return `qr-${hostname}-${size}x${size}.${extension}`;
}

elements.download.addEventListener("click", () => {
  if (!state.qr) return;
  const format = elements.exportFormat.value;
  const size = Number(elements.exportSize.value);

  if (format === "svg") {
    const blob = new Blob([buildSvg(state.qr, size)], { type: "image/svg+xml;charset=utf-8" });
    downloadFile(blob, getFilename(size, "svg"));
    showToast(format, size);
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  drawQrToCanvas(canvas.getContext("2d"), state.qr, size);
  canvas.toBlob((blob) => {
    if (!blob) return;
    downloadFile(blob, getFilename(size, "png"));
    showToast(format, size);
  }, "image/png");
});

updatePrefixField();
render();
