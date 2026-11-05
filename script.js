const defaults = {
  url: "example.com",
  outerMarkerColor: "#202020",
  innerMarkerColor: "#202020",
  moduleColor: "#202020",
  errorCorrection: "M",
  moduleStyle: "regular-polygon",
  moduleFigure: "cross",
  markersAsModules: false,
  showQrStructure: false,
  outerMarkerStyle: "rounded",
  cutOuterMarkerCorners: false,
  outerMarkerCornersOnly: false,
  innerMarkerStyle: "rounded",
  moduleScale: 100,
  moduleSides: 4,
  moduleCornerRadius: 0,
  moduleRotation: 0,
  moduleMerge: "none",
  exportFormat: "svg",
  exportSize: "256",
  logoSize: 20,
  showLogoArea: false,
  clearLogoArea: false,
};

const state = {
  ...defaults,
  editFindersIndividually: false,
  selectedFinderPattern: 0,
  finderPatterns: null,
  individualCorners: false,
  cornerRadii: null,
  rotationQuarterTurns: false,
  discreteSizes: false,
  moduleSizeCount: 2,
  moduleColorCount: 1,
  moduleExtraColors: Array(3).fill(defaults.moduleColor),
  encodedUrl: defaults.url,
  qr: null,
  moduleSeed: crypto.getRandomValues(new Uint32Array(1))[0],
  moduleRandom: { moduleSides: false, moduleScale: false, moduleCornerRadius: false, moduleRotation: false },
  moduleRandomRanges: {
    moduleSides: { min: 3, max: 9 },
    moduleScale: { min: 70, max: 100 },
    moduleCornerRadius: { min: 0, max: 100 },
    moduleRotation: { min: 0, max: 360 },
  },
  logoDataUrl: "",
  logoAspectRatio: 1,
  logoImage: null,
  logoName: "",
};

const elements = {
  preview: document.querySelector("#qrPreview"),
  canvasArea: document.querySelector("#canvasArea"),
  previewColumn: document.querySelector(".preview-column"),
  controlsColumn: document.querySelector(".controls-column"),
  workspace: document.querySelector(".workspace"),
  qrContent: document.querySelector(".qr-content"),
  urlInputWrap: document.querySelector("#urlInputWrap"),
  url: document.querySelector("#urlInput"),
  urlHelp: document.querySelector("#urlHelp"),
  encodingMode: document.querySelector("#encodingMode"),
  encodingModes: document.querySelectorAll("#encodingMode [data-mode]"),
  qrVersionInfo: document.querySelector("#qrVersionInfo"),
  qrVersionLabel: document.querySelector("#qrVersionLabel"),
  currentVersion: document.querySelector("#currentVersion"),
  currentDimensions: document.querySelector("#currentDimensions"),
  previousVersion: document.querySelector("#previousVersion"),
  nextVersion: document.querySelector("#nextVersion"),
  errorCorrection: document.querySelector("#errorCorrection"),
  moduleStyle: document.querySelector("#moduleStyle"),
  moduleRandomOptions: document.querySelectorAll("[data-module-random]"),
  moduleRandomRanges: document.querySelectorAll("[data-module-random-range]"),
  moduleSeedField: document.querySelector("#moduleSeedField"),
  moduleSeed: document.querySelector("#moduleSeed"),
  moduleSeedValue: document.querySelector("#moduleSeedValue"),
  polygonProperties: document.querySelectorAll(".polygon-property"),
  shapeProperties: document.querySelectorAll(".shape-property"),
  figureProperties: document.querySelectorAll(".figure-property"),
  moduleFigureOptions: document.querySelectorAll("[data-module-figure]"),
  moduleSides: document.querySelector("#moduleSides"),
  moduleSidesValue: document.querySelector("#moduleSidesValue"),
  moduleCornerRadius: document.querySelector("#moduleCornerRadius"),
  moduleCornerRadiusValue: document.querySelector("#moduleCornerRadiusValue"),
  individualCornersToggle: document.querySelector("#individualCornersToggle"),
  individualCornerControls: document.querySelector("#individualCornerControls"),
  moduleRotation: document.querySelector("#moduleRotation"),
  moduleRotationValue: document.querySelector("#moduleRotationValue"),
  rotationQuarterTurnsToggle: document.querySelector("#rotationQuarterTurnsToggle"),
  moduleMergeOptions: document.querySelectorAll("[data-module-merge]"),
  moduleMergeField: document.querySelector(".module-merge-field"),
  markersAsModules: document.querySelector("#markersAsModules"),
  editAllFinderPatterns: document.querySelector("#editAllFinderPatterns"),
  finderPatternSelector: document.querySelector("#finderPatternSelector"),
  finderPatternOptions: document.querySelectorAll("[data-finder-pattern]"),
  outerMarkerControls: document.querySelector("#outerMarkerControls"),
  innerMarkerControls: document.querySelector("#innerMarkerControls"),
  outerMarkerStyle: document.querySelector("#outerMarkerStyle"),
  cutOuterMarkerCorners: document.querySelector("#cutOuterMarkerCorners"),
  outerMarkerCornersOnly: document.querySelector("#outerMarkerCornersOnly"),
  innerMarkerStyle: document.querySelector("#innerMarkerStyle"),
  moduleScaleField: document.querySelector(".module-size-field"),
  moduleScale: document.querySelector("#moduleScale"),
  moduleScaleValue: document.querySelector("#moduleScaleValue"),
  discreteSizesToggle: document.querySelector("#discreteSizesToggle"),
  moduleSizeCountControl: document.querySelector("#moduleSizeCountControl"),
  moduleSizeCount: document.querySelector("#moduleSizeCount"),
  moduleSizeCountValue: document.querySelector("#moduleSizeCountValue"),
  outerMarkerColor: document.querySelector("#outerMarkerColor"),
  outerMarkerColorValue: document.querySelector("#outerMarkerColorValue"),
  innerMarkerColor: document.querySelector("#innerMarkerColor"),
  innerMarkerColorValue: document.querySelector("#innerMarkerColorValue"),
  moduleColor: document.querySelector("#moduleColor"),
  moduleColorValue: document.querySelector("#moduleColorValue"),
  moduleColorCount: document.querySelector("#moduleColorCount"),
  moduleColorCountValue: document.querySelector("#moduleColorCountValue"),
  moduleColorEditors: document.querySelector("#moduleColorEditors"),
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
const MODULE_PALETTE_CLIP_ID = "module-palette-clip";
const FINDER_PROPERTIES = [
  "markersAsModules", "outerMarkerStyle", "innerMarkerStyle",
  "outerMarkerColor", "innerMarkerColor", "cutOuterMarkerCorners", "outerMarkerCornersOnly",
];
const MODULE_RANGE_PROPERTIES = [
  ["moduleSides", ""], ["moduleScale", "%"],
  ["moduleCornerRadius", "%"], ["moduleRotation", "°"],
];
const FIGURE_RANGE_PROPERTIES = MODULE_RANGE_PROPERTIES.filter(([key]) => ["moduleScale", "moduleRotation"].includes(key));
const MODULE_RANDOM_PROPERTIES = {
  moduleSides: { min: 3, max: 9, salt: 0x9e3779b9 },
  moduleScale: { min: 70, max: 100, salt: 0x243f6a88 },
  moduleCornerRadius: { min: 0, max: 100, salt: 0xb7e15162 },
  moduleRotation: { min: 0, max: 360, salt: 0xdeadbeef },
  moduleColor: { salt: 0xa4093822 },
};
const moduleRandomControls = new Map(Array.from(elements.moduleRandomRanges, (group) => [group.dataset.moduleRandomRange, getRandomRangeControls(group)]));
const individualCornerControls = createIndividualCornerControls();
const moduleColorControls = createModuleColorControls();
const QR_STRUCTURE_REGIONS = [
  { id: "finder", label: "Finder patterns", color: "#EF4444" },
  { id: "separators", label: "Separators", color: "#10B981" },
  { id: "timing", label: "Timing patterns", color: "#EAB308" },
  { id: "version", label: "Version information", color: "#8B5CF6" },
  { id: "format", label: "Format information", color: "#3B82F6" },
  { id: "alignment", label: "Alignment patterns", color: "#D000A7" },
  { id: "quiet", label: "Quiet zone", color: "#06B6D4" },
];
const capacityCache = new Map();
let regularPolygonCache;
let figureGeometryCache;
const figureTemplateCache = new Map();
let moduleShapeCache = { key: "", cells: new Map(), variants: new Map() };
let toastTimer;
let logoDragDepth = 0;
let qrStructurePointerId = null;
let previewTouch = null;
const qrStructureKeys = new Set();
const landscapeLayout = window.matchMedia("(aspect-ratio > 6/5)");

qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

function detectTextMode(value) {
  if (/^\d+$/.test(value)) return "Numeric";
  if (/^[0-9A-Z $%*+\-./:]+$/.test(value)) return "Alphanumeric";
  return "Byte";
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

function updateVersionStep(element, version, amount, mode, previous) {
  element.classList.toggle("is-unavailable", version === null);
  element.replaceChildren();
  element.removeAttribute("aria-label");
  if (version === null) return;

  const sign = previous ? "−" : "+";
  const destination = document.createElement("span");
  destination.className = "version-destination";
  destination.textContent = `V${version}`;
  const quantity = document.createElement("span");
  quantity.className = "version-amount";
  const number = document.createElement("span");
  number.textContent = `${sign}${amount}`;
  const unit = document.createElement("span");
  unit.textContent = formatUnits(amount, mode).split(" ")[1];
  quantity.append(number, unit);
  const arrow = document.createElement("strong");
  arrow.className = "version-arrow";
  arrow.textContent = previous ? "←" : "→";
  element.append(...(previous ? [destination, quantity, arrow] : [quantity, arrow, destination]));
  element.setAttribute("aria-label", `${previous ? "Remove" : "Add"} ${formatUnits(amount, mode)} ${previous ? "to use" : "to reach"} V${version}`);
}

function syncVersionHintsVisibility() {
  const editing = Boolean(state.qr && document.activeElement === elements.url && document.hasFocus() && !document.hidden);
  elements.qrVersionInfo.classList.toggle("is-editing", editing);
  elements.qrVersionInfo.setAttribute("aria-hidden", String(!editing));
  const description = [elements.qrVersionInfo.dataset.description || "QR version"];
  [elements.previousVersion, elements.nextVersion].forEach((step) => {
    const visible = editing && !step.classList.contains("is-unavailable");
    step.setAttribute("aria-hidden", String(!visible));
    if (visible && step.hasAttribute("aria-label")) description.push(step.getAttribute("aria-label"));
  });
  elements.qrVersionInfo.setAttribute("aria-label", description.join(". "));
}

function updateVersionInfo(code, value, mode) {
  if (!code || !mode) {
    elements.qrVersionInfo.hidden = true;
    elements.qrVersionLabel.hidden = true;
    syncVersionHintsVisibility();
    return;
  }

  const moduleCount = code.getModuleCount();
  const version = (moduleCount - 17) / 4;
  const units = getPayloadUnits(value, mode);
  const currentCapacity = getQrCapacity(version, mode, state.errorCorrection);
  const nextAmount = currentCapacity - units + 1;

  elements.qrVersionInfo.hidden = false;
  elements.qrVersionLabel.hidden = false;
  elements.currentVersion.textContent = `V${version}`;
  elements.currentDimensions.textContent = `${moduleCount}×${moduleCount}`;

  const previousAmount = version > 1 ? units - getQrCapacity(version - 1, mode, state.errorCorrection) : 0;
  updateVersionStep(elements.previousVersion, version > 1 ? version - 1 : null, previousAmount, mode, true);
  updateVersionStep(elements.nextVersion, version < 40 ? version + 1 : null, nextAmount, mode, false);
  elements.qrVersionInfo.dataset.description = `QR version ${version}, ${moduleCount} by ${moduleCount} modules`;
  syncVersionHintsVisibility();
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

function createModuleColorControls() {
  return Array.from({ length: 4 }, (_, index) => {
    const group = index === 0 ? elements.moduleColor.closest(".color-input-wrap") : elements.moduleColor.closest(".color-input-wrap").cloneNode(true);
    const input = group.querySelector('input[type="color"]');
    const hexInput = group.querySelector(".hex-input");
    if (index > 0) {
      input.id = `moduleColor${index + 1}`;
      hexInput.id = `moduleColor${index + 1}Value`;
      input.setAttribute("aria-label", `Module color ${index + 1}`);
      hexInput.setAttribute("aria-label", `Module hex color ${index + 1} value`);
      group.hidden = true;
      elements.moduleColorEditors.append(group);
    }
    return { group, input, hexInput };
  });
}

function getModuleColor(index = 0) {
  return index === 0 ? state.moduleColor : state.moduleExtraColors[index - 1];
}

function getModuleColorForCell(row, column) {
  return getModuleColor(state.moduleColorCount === 1 ? 0 : Math.floor(randomModuleFraction("moduleColor", row, column) * state.moduleColorCount));
}

function getModulePalettePaint(code, quietZone = QUIET_ZONE) {
  const palette = Array.from({ length: state.moduleColorCount }, (_, index) => getModuleColor(index));
  if (new Set(palette).size === 1) return null;
  const count = code.getModuleCount();
  const groups = new Map();
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (!code.isDark(row, column)) continue;
      const color = getModuleColorForCell(row, column);
      if (color === state.moduleColor) continue;
      if (!groups.has(color)) groups.set(color, { color, commands: [], cells: [] });
      const group = groups.get(color);
      group.commands.push(`M${column + quietZone} ${row + quietZone}h1v1h-1z`);
      group.cells.push([row, column]);
    }
  }
  return {
    clipData: modulesToPath(code, quietZone),
    dimension: count + quietZone * 2,
    groups: Array.from(groups.values(), ({ color, commands, cells }) => ({ color, d: commands.join(""), cells })),
  };
}

function getRandomRangeControls(group) {
  return {
    group,
    track: group.querySelector(".random-range-track"),
    min: group.querySelector('[data-bound="min"]'),
    max: group.querySelector('[data-bound="max"]'),
    minValue: group.querySelector('[data-bound-value="min"]'),
    maxValue: group.querySelector('[data-bound-value="max"]'),
  };
}

function createIndividualCornerControls() {
  return Array.from({ length: 9 }, (_, index) => {
    const id = `moduleCorner${index + 1}`;
    const field = document.createElement("div");
    field.className = "individual-corner-field";
    field.hidden = true;
    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = `c${index + 1}`;
    const manual = elements.moduleCornerRadius.closest(".range-control").cloneNode(true);
    manual.id = `${id}Control`;
    const input = manual.querySelector("input");
    input.id = id;
    input.disabled = true;
    input.setAttribute("aria-label", `Module corner ${index + 1} radius`);
    const output = manual.querySelector("output");
    output.id = `${id}Value`;
    output.setAttribute("for", id);
    const randomGroup = moduleRandomControls.get("moduleCornerRadius").group.cloneNode(true);
    randomGroup.id = `${id}RandomControl`;
    randomGroup.removeAttribute("data-module-random-range");
    randomGroup.setAttribute("aria-label", `Random radius for corner ${index + 1}`);
    const random = getRandomRangeControls(randomGroup);
    for (const bound of ["min", "max"]) {
      random[bound].id = `${id}${bound === "min" ? "Min" : "Max"}`;
      random[bound].disabled = true;
      random[bound].setAttribute("aria-label", `${bound === "min" ? "Minimum" : "Maximum"} random radius for corner ${index + 1}`);
      random[`${bound}Value`].setAttribute("for", random[bound].id);
    }
    field.append(label, manual, randomGroup);
    elements.individualCornerControls.append(field);
    return { field, label, manual, input, output, random };
  });
}

function syncRandomRangeControls(controls, range, limits, suffix) {
  for (const bound of ["min", "max"]) {
    controls[bound].value = range[bound];
    controls[`${bound}Value`].textContent = `${range[bound]}${suffix}`;
    controls[bound].setAttribute("aria-valuetext", `${range[bound]}${suffix}`);
    const position = (range[bound] - limits.min) / (limits.max - limits.min) * 100;
    controls.group.style.setProperty(`--range-${bound}`, `${position}%`);
  }
  controls.min.setAttribute("aria-valuemax", range.max);
  controls.max.setAttribute("aria-valuemin", range.min);
}

function getVisibleCornerCount() {
  return state.moduleRandom.moduleSides ? state.moduleRandomRanges.moduleSides.max : state.moduleSides;
}

function syncIndividualCornerControls() {
  const enabled = state.moduleStyle === "regular-polygon" && state.individualCorners;
  const count = getVisibleCornerCount();
  const random = state.moduleRandom.moduleCornerRadius;
  elements.individualCornersToggle.setAttribute("aria-pressed", String(state.individualCorners));
  elements.individualCornerControls.hidden = !enabled;
  individualCornerControls.forEach((controls, index) => {
    const visible = enabled && index < count;
    const corner = state.cornerRadii?.[index] || { value: state.moduleCornerRadius, ...state.moduleRandomRanges.moduleCornerRadius };
    controls.field.hidden = !visible;
    controls.manual.hidden = random;
    controls.input.disabled = !visible || random;
    controls.input.value = corner.value;
    controls.output.textContent = `${corner.value}%`;
    controls.random.group.hidden = !random;
    controls.random.min.disabled = !visible || !random;
    controls.random.max.disabled = !visible || !random;
    controls.label.htmlFor = random ? controls.random.min.id : controls.input.id;
    syncRandomRangeControls(controls.random, corner, MODULE_RANDOM_PROPERTIES.moduleCornerRadius, "%");
  });
}

function getModuleRandomRange(key, cornerIndex = null) {
  return cornerIndex === null ? state.moduleRandomRanges[key] : state.cornerRadii[cornerIndex];
}

function getModuleScale() {
  return state.moduleScale / 100;
}

function getRandomModuleProperties(style = state.moduleStyle) {
  if (style === "regular-polygon") return MODULE_RANGE_PROPERTIES;
  if (style === "figure") return FIGURE_RANGE_PROPERTIES;
  return [];
}

function hasRandomModuleProperties(style = state.moduleStyle) {
  return getRandomModuleProperties(style).some(([key]) => state.moduleRandom[key]
    || (key === "moduleRotation" && state.rotationQuarterTurns)
    || (key === "moduleScale" && state.discreteSizes));
}

function randomModuleFraction(key, row, column, cornerIndex = null) {
  const salt = MODULE_RANDOM_PROPERTIES[key].salt ^ (cornerIndex === null ? 0 : Math.imul(cornerIndex + 1, 0x9e3779b1));
  let hash = state.moduleSeed ^ salt ^ Math.imul(row + 1, 0x85ebca6b) ^ Math.imul(column + 1, 0xc2b2ae35);
  hash = Math.imul(hash ^ (hash >>> 16), 0x7feb352d);
  hash = Math.imul(hash ^ (hash >>> 15), 0x846ca68b);
  hash = (hash ^ (hash >>> 16)) >>> 0;
  return hash / 0x100000000;
}

function randomModuleValue(key, row, column, cornerIndex = null) {
  const { min, max } = getModuleRandomRange(key, cornerIndex);
  return min + Math.floor(randomModuleFraction(key, row, column, cornerIndex) * (max - min + 1));
}

function getQuarterTurnRotation(row, column) {
  return (state.moduleRotation + Math.floor(randomModuleFraction("moduleRotation", row, column) * 4) * 90) % 360;
}

function getDiscreteModuleSize(row, column) {
  const { min, max } = MODULE_RANDOM_PROPERTIES.moduleScale;
  const step = Math.floor(randomModuleFraction("moduleScale", row, column) * state.moduleSizeCount);
  return min + (max - min) * step / (state.moduleSizeCount - 1);
}

function setRandomModuleBound(key, bound, value, cornerIndex = null) {
  const limits = MODULE_RANDOM_PROPERTIES[key];
  const range = getModuleRandomRange(key, cornerIndex);
  const minimum = bound === "min" ? limits.min : range.min;
  const maximum = bound === "max" ? limits.max : range.max;
  const next = Math.max(minimum, Math.min(maximum, Math.round(value)));
  const controls = cornerIndex === null ? moduleRandomControls.get(key) : individualCornerControls[cornerIndex].random;
  controls[bound].value = next;
  if (range[bound] === next) return;
  range[bound] = next;
  render();
}

function getModuleGeometry(row, column, style = state.moduleStyle) {
  return getModuleGeometryResolver(style)(row, column);
}

function getModuleGeometryResolver(style = state.moduleStyle) {
  const buildGeometry = style === "figure" ? getFigureGeometry : getRegularPolygonGeometry;
  if (!hasRandomModuleProperties(style)) {
    const geometry = buildGeometry();
    return () => geometry;
  }
  const rangeProperties = getRandomModuleProperties(style);
  const individual = style === "regular-polygon" && state.individualCorners;
  const key = `${style}:${style === "figure" ? state.moduleFigure : ""}:${state.moduleSeed}:` + rangeProperties.map(([property]) => (
    property === "moduleScale" && state.discreteSizes
      ? `size-steps:${state.moduleSizeCount}:${MODULE_RANDOM_PROPERTIES.moduleScale.min}-${MODULE_RANDOM_PROPERTIES.moduleScale.max}`
      : property === "moduleRotation" && state.rotationQuarterTurns
      ? `quarter-turns:${state.moduleRotation % 360}`
      : property === "moduleCornerRadius" && individual
      ? `corners:${state.cornerRadii.slice(0, getVisibleCornerCount()).map((corner) => state.moduleRandom.moduleCornerRadius ? `${corner.min}-${corner.max}` : corner.value).join(",")}`
      : state.moduleRandom[property]
      ? `random:${state.moduleRandomRanges[property].min}-${state.moduleRandomRanges[property].max}`
      : state[property]
  )).join(":");
  if (moduleShapeCache.key !== key) {
    moduleShapeCache = { key, cells: new Map(), variants: new Map() };
  }
  const cache = moduleShapeCache;
  return (row, column) => {
    const cellKey = `${row}:${column}`;
    if (cache.cells.has(cellKey)) return cache.cells.get(cellKey);
    const properties = { moduleFigure: state.moduleFigure };
    rangeProperties.forEach(([property]) => {
      if (individual && property === "moduleCornerRadius") return;
      properties[property] = property === "moduleScale" && state.discreteSizes
        ? getDiscreteModuleSize(row, column)
        : property === "moduleRotation" && state.rotationQuarterTurns
        ? getQuarterTurnRotation(row, column)
        : (state.moduleRandom[property] ? randomModuleValue(property, row, column) : state[property]);
    });
    if (individual) {
      properties.moduleCornerRadii = Array.from({ length: properties.moduleSides }, (_, index) => (
        state.moduleRandom.moduleCornerRadius ? randomModuleValue("moduleCornerRadius", row, column, index) : state.cornerRadii[index].value
      ));
    }
    const variantKey = rangeProperties.map(([property]) => property === "moduleCornerRadius" && individual ? properties.moduleCornerRadii.join(",") : properties[property]).join(":");
    let geometry = cache.variants.get(variantKey);
    if (!geometry) {
      geometry = buildGeometry(properties);
      cache.variants.set(variantKey, geometry);
    }
    cache.cells.set(cellKey, geometry);
    return geometry;
  };
}

function polygonBridgeGeometry(vertices) {
  const xs = vertices.map(([x]) => x);
  const ys = vertices.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {
    start: vertices[0], vertices,
    bounds: { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y },
    pathTail: vertices.slice(1).map(([x, y], i) => (
      `l${formatNumber(x - vertices[i][0], 6)} ${formatNumber(y - vertices[i][1], 6)}`
    )).join("") + "Z",
  };
}

function getRegularPolygonGeometry(properties = state) {
  const sides = properties.moduleSides;
  const cornerValues = properties.moduleCornerRadii || (properties === state && state.individualCorners
    ? state.cornerRadii.slice(0, sides).map((corner) => corner.value) : null);
  const rounding = (cornerValues ? cornerValues[0] : properties.moduleCornerRadius) / 100;
  const uniform = !cornerValues || cornerValues.every((value) => value === cornerValues[0]);
  const rotation = properties.moduleRotation % 360;
  const size = properties.moduleScale / 100;
  const key = `${uniform && rounding === 1 ? "circle" : `${sides}:${uniform ? rounding : cornerValues.join(",")}:${rotation}`}:${size}`;
  if (regularPolygonCache?.key === key) return regularPolygonCache.geometry;

  const turn = Math.PI * 2;
  let start;
  const segments = [];
  if (uniform && rounding === 1) {
    start = [1, 0];
    for (let i = 0; i < 4; i += 1) {
      const startAngle = i * Math.PI / 2;
      const endAngle = startAngle + Math.PI / 2;
      segments.push({ type: "arc", end: [Math.cos(endAngle), Math.sin(endAngle)], center: [0, 0], radius: 1, startAngle, endAngle });
    }
  } else {
    const initialAngle = -Math.PI / 2 + (sides % 2 === 0 ? Math.PI / sides : 0) + rotation * Math.PI / 180;
    const vertices = Array.from({ length: sides }, (_, i) => {
      const angle = initialAngle + i * turn / sides;
      return [Math.cos(angle), Math.sin(angle)];
    });
    if (uniform && rounding === 0) {
      [start] = vertices;
      vertices.slice(1).forEach((end) => segments.push({ type: "line", end }));
    } else {
      const corners = vertices.map(([x, y], i) => {
        const cornerRounding = cornerValues ? cornerValues[i] / 100 : rounding;
        if (cornerRounding === 0) return { type: "line", incoming: [x, y], end: [x, y] };
        const radius = cornerRounding * Math.cos(Math.PI / sides);
        // Moving each fillet center inward by t gives tangencies at t * side / 2.
        const center = [x * (1 - cornerRounding), y * (1 - cornerRounding)];
        const angle = initialAngle + i * turn / sides;
        const startAngle = angle - Math.PI / sides;
        const endAngle = angle + Math.PI / sides;
        return {
          type: "arc", center, radius, startAngle, endAngle,
          incoming: [center[0] + radius * Math.cos(startAngle), center[1] + radius * Math.sin(startAngle)],
          end: [center[0] + radius * Math.cos(endAngle), center[1] + radius * Math.sin(endAngle)],
        };
      });
      start = corners[0].incoming;
      corners.forEach((corner, i) => {
        if (i > 0) segments.push({ type: "line", end: corner.incoming });
        if (corner.type === "arc") segments.push(corner);
      });
    }
  }

  const points = [start, ...segments.map((segment) => segment.end)];
  segments.forEach((segment) => {
    if (segment.type !== "arc") return;
    for (let i = 0; i < 4; i += 1) {
      const angle = i * Math.PI / 2;
      const distance = ((angle - segment.startAngle) % turn + turn) % turn;
      if (distance <= segment.endAngle - segment.startAngle + 1e-10) {
        points.push([segment.center[0] + segment.radius * Math.cos(angle), segment.center[1] + segment.radius * Math.sin(angle)]);
      }
    }
  });
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const factor = size / Math.max(right - left, bottom - top);
  const shiftX = .5 - (left + right) * factor / 2;
  const shiftY = .5 - (top + bottom) * factor / 2;
  const transform = ([x, y]) => [x * factor + shiftX, y * factor + shiftY];
  const supportPoint = (axis, extreme) => {
    const candidates = points.filter((point) => Math.abs(point[axis] - extreme) < 1e-10);
    const point = candidates.reduce((best, candidate) => candidate[1 - axis] < best[1 - axis] ? candidate : best);
    return transform(point);
  };
  const geometry = {
    start: transform(start),
    segments: segments.map((segment) => segment.type === "line"
      ? { type: "line", end: transform(segment.end) }
      : { ...segment, end: transform(segment.end), center: transform(segment.center), radius: segment.radius * factor }),
    bounds: {
      x: .5 - (right - left) * factor / 2,
      y: .5 - (bottom - top) * factor / 2,
      width: (right - left) * factor,
      height: (bottom - top) * factor,
    },
    supportPoints: {
      top: supportPoint(1, top), bottom: supportPoint(1, bottom),
      left: supportPoint(0, left), right: supportPoint(0, right),
    },
  };
  let previous = geometry.start;
  geometry.pathTail = geometry.segments.map((segment) => {
    const delta = `${formatNumber(segment.end[0] - previous[0], 6)} ${formatNumber(segment.end[1] - previous[1], 6)}`;
    previous = segment.end;
    if (segment.type === "line") return `l${delta}`;
    const radius = formatNumber(segment.radius, 6);
    return `a${radius} ${radius} 0 0 1 ${delta}`;
  }).join("") + "Z";
  regularPolygonCache = { key, geometry };
  return geometry;
}

function regularPolygonCommand(x, y, geometry = getRegularPolygonGeometry()) {
  return `M${formatNumber(x + geometry.start[0], 6)} ${formatNumber(y + geometry.start[1], 6)}${geometry.pathTail}`;
}

function regularPolygonMergedPath(code, quietZone) {
  const count = code.getModuleCount();
  const geometries = new Array(count * count);
  const commands = [];
  const exclusionBox = state.clearLogoArea ? getLogoBox(code, quietZone) : null;
  const resolveGeometry = getModuleGeometryResolver("regular-polygon");
  const squareGroups = state.moduleMerge === "square-groups";
  const horizontal = squareGroups || state.moduleMerge === "all" || state.moduleMerge === "horizontal";
  const vertical = squareGroups || state.moduleMerge === "all" || state.moduleMerge === "vertical";
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (!shouldRenderModule(code, row, column, quietZone, null, "regular-polygon")) continue;
      const geometry = resolveGeometry(row, column);
      if (moduleIntersectsBox(row, column, quietZone, exclusionBox, "regular-polygon", geometry)) continue;
      geometries[row * count + column] = geometry;
      commands.push(regularPolygonCommand(column + quietZone, row + quietZone, geometry));
    }
  }
  if (!horizontal && !vertical) return commands.join("");
  const squareConnections = squareGroups ? new Uint8Array(count * count) : null;
  if (squareGroups) {
    // Every internal edge in a full n×n square (n >= 2) belongs to a full
    // 2×2 block. Their union covers all square sizes and allows overlaps.
    for (let row = 0; row < count - 1; row += 1) {
      for (let column = 0; column < count - 1; column += 1) {
        const index = row * count + column;
        if (!geometries[index] || !geometries[index + 1] || !geometries[index + count] || !geometries[index + count + 1]) continue;
        squareConnections[index] |= 3; // Right and down.
        squareConnections[index + 1] |= 2;
        squareConnections[index + count] |= 1;
      }
    }
  }
  const appendBridge = (row, column, bridge) => {
    const x = column + quietZone;
    const y = row + quietZone;
    const bounds = bridge.bounds;
    if (rectangleIntersectsBox(x + bounds.x, y + bounds.y, bounds.width, bounds.height, exclusionBox)) return;
    commands.push(`M${formatNumber(x + bridge.start[0], 6)} ${formatNumber(y + bridge.start[1], 6)}${bridge.pathTail}`);
  };
  const bridgeFor = (first, second, direction) => {
    if (first === second && first.bridges?.[direction]) return first.bridges[direction];
    const a = first.supportPoints;
    const b = second.supportPoints;
    const bridge = polygonBridgeGeometry(direction === "horizontal"
      ? [a.top, [b.top[0] + 1, b.top[1]], [b.bottom[0] + 1, b.bottom[1]], a.bottom]
      : [a.left, a.right, [b.right[0], b.right[1] + 1], [b.left[0], b.left[1] + 1]]);
    if (first === second) (first.bridges ??= {})[direction] = bridge;
    return bridge;
  };
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      const geometry = geometries[row * count + column];
      if (!geometry) continue;
      const right = geometries[row * count + column + 1];
      const down = geometries[(row + 1) * count + column];
      if (horizontal && column + 1 < count && right && (!squareGroups || (squareConnections[row * count + column] & 1))) {
        appendBridge(row, column, bridgeFor(geometry, right, "horizontal"));
      }
      if (vertical && row + 1 < count && down && (!squareGroups || (squareConnections[row * count + column] & 2))) {
        appendBridge(row, column, bridgeFor(geometry, down, "vertical"));
      }
    }
  }
  return commands.join("");
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

function getFigureTemplate(figure, rotation) {
  const key = `${figure}:${rotation}`;
  if (figureTemplateCache.has(key)) return figureTemplateCache.get(key);
  const angle = rotation * Math.PI / 180;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const rotate = ([x, y]) => [(x - .5) * cosine - (y - .5) * sine, (x - .5) * sine + (y - .5) * cosine];
  let start;
  let segments;
  if (figure === "cross") {
    const points = crossModulePoints(.5, .5, 1, false).map(rotate);
    [start] = points;
    segments = points.slice(1).map((end) => ({ type: "line", end }));
  } else {
    const geometry = figure === "heart" ? heartModuleGeometry(0, 0, 1) : roundedStarModuleGeometry(0, 0, 1);
    start = rotate(geometry.start);
    segments = geometry.curves.map((curve) => ({
      type: "cubic",
      controls: [rotate(curve.slice(0, 2)), rotate(curve.slice(2, 4))],
      end: rotate(curve.slice(4, 6)),
    }));
  }
  const points = [start, ...segments.map((segment) => segment.end)];
  let previous = start;
  // Include the actual extrema of each rotated cubic, rather than its
  // control box, so every figure stays centered and fits without distortion.
  segments.forEach((segment) => {
    if (segment.type === "cubic") {
      const [p1, p2] = segment.controls;
      const p0 = previous;
      const p3 = segment.end;
      for (let axis = 0; axis < 2; axis += 1) {
        const a = -p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis];
        const b = 2 * (p0[axis] - 2 * p1[axis] + p2[axis]);
        const c = p1[axis] - p0[axis];
        const discriminant = b * b - 4 * a * c;
        const roots = Math.abs(a) < 1e-12
          ? (Math.abs(b) < 1e-12 ? [] : [-c / b])
          : (discriminant < 0 ? [] : [(-b + Math.sqrt(discriminant)) / (2 * a), (-b - Math.sqrt(discriminant)) / (2 * a)]);
        roots.forEach((t) => {
          if (t <= 0 || t >= 1) return;
          const u = 1 - t;
          points.push([0, 1].map((i) => u ** 3 * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t ** 3 * p3[i]));
        });
      }
    }
    previous = segment.end;
  });
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const factor = 1 / Math.max(right - left, bottom - top);
  const normalize = ([x, y]) => [.5 + (x - (left + right) / 2) * factor, .5 + (y - (top + bottom) / 2) * factor];
  const template = {
    start: normalize(start),
    segments: segments.map((segment) => ({
      ...segment, end: normalize(segment.end),
      ...(segment.controls ? { controls: segment.controls.map(normalize) } : {}),
    })),
    bounds: { x: .5 - (right - left) * factor / 2, y: .5 - (bottom - top) * factor / 2, width: (right - left) * factor, height: (bottom - top) * factor },
  };
  figureTemplateCache.set(key, template);
  return template;
}

function getFigureGeometry(properties = state) {
  const rotation = properties.moduleRotation % 360;
  const size = properties.moduleScale / 100;
  const key = `${properties.moduleFigure}:${rotation}:${size}`;
  if (figureGeometryCache?.key === key) return figureGeometryCache.geometry;
  const template = getFigureTemplate(properties.moduleFigure, rotation);
  const scale = ([x, y]) => [.5 + (x - .5) * size, .5 + (y - .5) * size];
  const geometry = {
    start: scale(template.start),
    segments: template.segments.map((segment) => ({
      ...segment, end: scale(segment.end),
      ...(segment.controls ? { controls: segment.controls.map(scale) } : {}),
    })),
    bounds: {
      x: .5 + (template.bounds.x - .5) * size, y: .5 + (template.bounds.y - .5) * size,
      width: template.bounds.width * size, height: template.bounds.height * size,
    },
  };
  let previous = geometry.start;
  geometry.pathTail = geometry.segments.map((segment) => {
    const coordinates = [...(segment.controls || []), segment.end].map(([x, y]) => (
      `${formatNumber(x - previous[0], 6)} ${formatNumber(y - previous[1], 6)}`
    )).join(" ");
    previous = segment.end;
    return `${segment.type === "cubic" ? "c" : "l"}${coordinates}`;
  }).join("") + "Z";
  figureGeometryCache = { key, geometry };
  return geometry;
}

function moduleCommand(x, y, style) {
  if (style === "regular-polygon") return regularPolygonCommand(x, y);
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

function getFinderSettings(markerIndex = state.selectedFinderPattern) {
  return state.editFindersIndividually && state.finderPatterns ? state.finderPatterns[markerIndex] : state;
}

function getAppearanceSettings(key) {
  return FINDER_PROPERTIES.includes(key) ? getFinderSettings() : state;
}

function getFinderPatternIndex(row, column, count) {
  if (row < 7 && column < 7) return 0;
  if (row < 7 && column >= count - 7) return 1;
  if (row >= count - 7 && column < 7) return 2;
  return -1;
}

function isMarkerModule(row, column, count) {
  return getFinderPatternIndex(row, column, count) >= 0;
}

function isCircuitStyle(style = state.moduleStyle) {
  return ["circuit", "circuit-horizontal", "circuit-vertical"].includes(style);
}

function getCircuitWidth() {
  return getModuleScale();
}

function moduleIntersectsBox(row, column, quietZone, box, style = state.moduleStyle, geometry = null) {
  if (!box) return false;
  if (["regular-polygon", "figure"].includes(style)) {
    const bounds = (geometry || getModuleGeometry(row, column, style)).bounds;
    return rectangleIntersectsBox(column + quietZone + bounds.x, row + quietZone + bounds.y, bounds.width, bounds.height, box);
  }
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
  const markerIndex = getFinderPatternIndex(row, column, count);
  return code.isDark(row, column)
    && (markerIndex < 0 || getFinderSettings(markerIndex).markersAsModules)
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
  if (style === "regular-polygon") return regularPolygonMergedPath(code, quietZone);
  const count = code.getModuleCount();
  const commands = [];
  const exclusionBox = state.clearLogoArea ? getLogoBox(code, quietZone) : null;
  const resolveGeometry = style === "figure" ? getModuleGeometryResolver(style) : null;

  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (!shouldRenderModule(code, row, column, quietZone, resolveGeometry ? null : exclusionBox, style)) continue;
      const geometry = resolveGeometry ? resolveGeometry(row, column) : null;
      if (geometry && moduleIntersectsBox(row, column, quietZone, exclusionBox, style, geometry)) continue;
      const x = column + quietZone;
      const y = row + quietZone;
      commands.push(style === "figure"
        ? regularPolygonCommand(x, y, geometry)
        : moduleCommand(x, y, style));
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

function hasOuterMarkerClip(markerIndex = state.selectedFinderPattern) {
  const settings = getFinderSettings(markerIndex);
  return settings.cutOuterMarkerCorners || settings.outerMarkerCornersOnly;
}

function getShapeRendering() {
  const squareMarkers = [0, 1, 2].every((markerIndex) => {
    const settings = getFinderSettings(markerIndex);
    return settings.markersAsModules || (settings.outerMarkerStyle === "square" && settings.innerMarkerStyle === "square" && !hasOuterMarkerClip(markerIndex));
  });
  return state.moduleStyle === "square" && squareMarkers ? "crispEdges" : "geometricPrecision";
}

function outerMarkerClipCommand(x, y, scale = 1, markerIndex = state.selectedFinderPattern) {
  const third = 7 * scale / 3;
  const nearX = formatNumber(x + third, 4);
  const farX = formatNumber(x + 2 * third, 4);
  const nearY = formatNumber(y + third, 4);
  const farY = formatNumber(y + 2 * third, 4);
  const left = formatNumber(x, 4);
  const right = formatNumber(x + 7 * scale, 4);
  const top = formatNumber(y, 4);
  const bottom = formatNumber(y + 7 * scale, 4);
  if (getFinderSettings(markerIndex).outerMarkerCornersOnly) {
    return `M${left} ${top}H${nearX}V${nearY}H${left}Z`
      + `M${farX} ${top}H${right}V${nearY}H${farX}Z`
      + `M${left} ${farY}H${nearX}V${bottom}H${left}Z`
      + `M${farX} ${farY}H${right}V${bottom}H${farX}Z`;
  }
  return `M${nearX} ${top}H${farX}V${nearY}H${right}V${farY}H${farX}V${bottom}H${nearX}V${farY}H${left}V${nearY}H${nearX}Z`;
}

function getMarkerClips(code) {
  return markerPositions(code).flatMap(([x, y], markerIndex) => (
    getFinderSettings(markerIndex).markersAsModules || !hasOuterMarkerClip(markerIndex) ? [] : [{
      id: `outer-marker-cut-${markerIndex}`,
      d: outerMarkerClipCommand(x, y, 1, markerIndex),
    }]
  ));
}

function getMarkerShape(x, y, markerIndex, part, scale = 1) {
  const outer = part === "outer";
  const settings = getFinderSettings(markerIndex);
  const style = settings[`${part}MarkerStyle`];
  const color = settings[`${part}MarkerColor`];
  const inset = (outer ? .5 : 2) * scale;
  const size = (outer ? 6 : 3) * scale;
  const radius = (outer ? 1.25 : .8) * scale;
  const attributes = outer
    ? {
      fill: "none", stroke: color, "stroke-width": scale,
      ...(hasOuterMarkerClip(markerIndex) ? { "clip-path": `url(#outer-marker-cut-${markerIndex})` } : {}),
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
  const palette = getModulePalettePaint(code);
  if (palette) {
    const definitions = document.createElementNS(SVG_NAMESPACE, "defs");
    const clip = setAttributes(document.createElementNS(SVG_NAMESPACE, "clipPath"), { id: MODULE_PALETTE_CLIP_ID, clipPathUnits: "userSpaceOnUse" });
    clip.append(setAttributes(document.createElementNS(SVG_NAMESPACE, "path"), { d: palette.clipData }));
    definitions.append(clip);
    const layer = setAttributes(document.createElementNS(SVG_NAMESPACE, "g"), { "clip-path": `url(#${MODULE_PALETTE_CLIP_ID})`, "shape-rendering": "crispEdges" });
    layer.append(setAttributes(document.createElementNS(SVG_NAMESPACE, "rect"), { width: palette.dimension, height: palette.dimension, fill: state.moduleColor }));
    palette.groups.forEach(({ d, color }) => layer.append(setAttributes(document.createElementNS(SVG_NAMESPACE, "path"), { d, fill: color })));
    svg.append(definitions, layer);
    return;
  }
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
    if (getFinderSettings(markerIndex).markersAsModules) return;
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

function getAlignmentPatternPositions(version) {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : 2 * Math.floor((version * 4 + count * 2 + 1) / (count * 2 - 2));
  const positions = [6];
  for (let index = count - 1, position = version * 4 + 10; index > 0; index -= 1, position -= step) {
    positions.splice(1, 0, position);
  }
  return positions;
}

function getQrStructure(code, quietZone = QUIET_ZONE) {
  const count = code.getModuleCount();
  const version = (count - 17) / 4;
  const dimension = count + quietZone * 2;
  const cells = new Uint8Array(dimension * dimension);
  const regions = QR_STRUCTURE_REGIONS.map((region) => ({ ...region, count: 0, path: "" }));
  const types = Object.fromEntries(regions.map((region, index) => [region.id, index + 1]));
  const at = (row, column) => (row + quietZone) * dimension + column + quietZone;
  const mark = (row, column, type) => { cells[at(row, column)] = type; };

  for (let row = 0; row < dimension; row += 1) {
    const start = row * dimension;
    if (row < quietZone || row >= count + quietZone) {
      cells.fill(types.quiet, start, start + dimension);
    } else {
      cells.fill(types.quiet, start, start + quietZone);
      cells.fill(types.quiet, start + quietZone + count, start + dimension);
    }
  }

  for (const [row, column] of [[0, 0], [0, count - 7], [count - 7, 0]]) {
    for (let dy = -1; dy <= 7; dy += 1) {
      for (let dx = -1; dx <= 7; dx += 1) {
        if (row + dy < 0 || column + dx < 0 || row + dy >= count || column + dx >= count) continue;
        const finder = dy >= 0 && dy < 7 && dx >= 0 && dx < 7;
        mark(row + dy, column + dx, finder ? types.finder : types.separators);
      }
    }
  }

  const positions = getAlignmentPatternPositions(version);
  for (const row of positions) {
    for (const column of positions) {
      if (cells[at(row, column)]) continue;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) mark(row + dy, column + dx, types.alignment);
      }
    }
  }

  for (let index = 8; index < count - 8; index += 1) {
    if (!cells[at(6, index)]) mark(6, index, types.timing);
    if (!cells[at(index, 6)]) mark(index, 6, types.timing);
  }

  if (version >= 7) {
    for (let index = 0; index < 18; index += 1) {
      mark(Math.floor(index / 3), count - 11 + index % 3, types.version);
      mark(count - 11 + index % 3, Math.floor(index / 3), types.version);
    }
  }
  for (let index = 0; index < 15; index += 1) {
    const row = index < 6 ? index : index < 8 ? index + 1 : count - 15 + index;
    const column = index < 8 ? count - index - 1 : index === 8 ? 7 : 14 - index;
    mark(row, 8, types.format);
    mark(8, column, types.format);
  }

  // Combine cells into horizontal runs so the overlay has no internal grid lines.
  for (let row = 0; row < dimension; row += 1) {
    for (let column = 0; column < dimension;) {
      const type = cells[row * dimension + column];
      let end = column + 1;
      while (end < dimension && cells[row * dimension + end] === type) end += 1;
      if (type) {
        const region = regions[type - 1];
        const length = end - column;
        region.count += length;
        region.path += `M${column} ${row}h${length}v1h-${length}Z`;
      }
      column = end;
    }
  }
  return { version, dimension, cells, regions };
}

function appendSvgQrStructureGuide(svg, code) {
  if (!state.showQrStructure) return;
  const structure = getQrStructure(code);
  const guide = setAttributes(document.createElementNS(SVG_NAMESPACE, "g"), {
    class: "qr-structure-guide", "aria-hidden": "true", "shape-rendering": "crispEdges",
  });
  structure.regions.forEach((region) => {
    if (!region.count) return;
    guide.append(setAttributes(document.createElementNS(SVG_NAMESPACE, "path"), {
      d: region.path, fill: region.color, "data-region": region.id,
    }));
  });
  svg.append(guide);
}

function appendSvgLogoGuide(svg, code) {
  if (!state.showLogoArea || state.showQrStructure) return;
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

function syncLogoGuideControl() {
  elements.showLogoArea.disabled = state.showQrStructure;
  elements.showLogoArea.checked = state.showLogoArea && !state.showQrStructure;
}

function updateQrStructureHold() {
  const visible = Boolean(state.qr && (qrStructurePointerId !== null || qrStructureKeys.size));
  if (state.showQrStructure === visible) return;
  state.showQrStructure = visible;
  syncLogoGuideControl();
  elements.preview.querySelectorAll(".qr-structure-guide, .logo-area-guide").forEach((guide) => guide.remove());
  if (!state.qr) return;
  appendSvgQrStructureGuide(elements.preview, state.qr);
  appendSvgLogoGuide(elements.preview, state.qr);
}

function releaseQrStructureHold() {
  const pointerId = qrStructurePointerId ?? previewTouch?.pointerId;
  qrStructurePointerId = null;
  previewTouch = null;
  qrStructureKeys.clear();
  if (pointerId != null && elements.previewColumn.hasPointerCapture(pointerId)) {
    elements.previewColumn.releasePointerCapture(pointerId);
  }
  updateQrStructureHold();
}

function resizeQrTextField() {
  const textarea = elements.url;
  const style = getComputedStyle(textarea);
  const lineHeight = Number.parseFloat(style.lineHeight);
  const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
  const border = Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth);
  const scrollTop = textarea.scrollTop;
  textarea.style.height = "auto";
  textarea.style.overflowY = "hidden";
  const contentHeight = textarea.scrollHeight;
  const maxHeight = lineHeight * 3 + padding;
  textarea.style.height = `${Math.min(maxHeight, Math.max(lineHeight + padding, contentHeight)) + border}px`;
  textarea.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";
  textarea.classList.toggle("has-scroll", contentHeight > maxHeight);
  textarea.scrollTop = scrollTop;
}

function updatePreviewDetailsHeight() {
  const gap = Number.parseFloat(getComputedStyle(elements.previewColumn).rowGap) || 0;
  const contentHeight = landscapeLayout.matches ? elements.qrContent.getBoundingClientRect().height + gap : 0;
  elements.workspace.style.setProperty("--preview-details-height", `${Math.ceil(contentHeight)}px`);
}

function updateContentPlacement() {
  const parent = landscapeLayout.matches ? elements.previewColumn : elements.controlsColumn;
  if (elements.qrContent.parentNode !== parent) {
    const focused = document.activeElement;
    const restoreFocus = elements.qrContent.contains(focused);
    const selection = focused === elements.url
      ? [focused.selectionStart, focused.selectionEnd, focused.selectionDirection] : null;
    parent.insertBefore(elements.qrContent, landscapeLayout.matches ? null : parent.firstChild);
    if (restoreFocus) {
      focused.focus({ preventScroll: true });
      if (selection) focused.setSelectionRange(...selection);
    }
  }
  updatePreviewDetailsHeight();
}

function clearPreview() {
  releaseQrStructureHold();
  elements.canvasArea.style.removeProperty("--checkerboard-size");
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
  resizeQrTextField();
  const trimmedValue = elements.url.value.trim();
  const qrMode = trimmedValue ? detectTextMode(trimmedValue) : null;
  syncLogoGuideControl();
  const finderSettings = getFinderSettings();
  elements.editAllFinderPatterns.setAttribute("aria-pressed", String(!state.editFindersIndividually));
  elements.editAllFinderPatterns.setAttribute("aria-expanded", String(state.editFindersIndividually));
  elements.finderPatternSelector.hidden = !state.editFindersIndividually;
  elements.finderPatternOptions.forEach((button) => {
    button.setAttribute("aria-pressed", String(state.editFindersIndividually && Number(button.dataset.finderPattern) === state.selectedFinderPattern));
  });
  elements.markersAsModules.checked = finderSettings.markersAsModules;
  elements.outerMarkerControls.hidden = finderSettings.markersAsModules;
  elements.innerMarkerControls.hidden = finderSettings.markersAsModules;
  updateEncodingMode(qrMode);
  for (const part of ["outer", "inner"]) {
    elements[`${part}MarkerStyle`].value = finderSettings[`${part}MarkerStyle`];
    elements[`${part}MarkerColor`].value = finderSettings[`${part}MarkerColor`];
    elements[`${part}MarkerColorValue`].value = finderSettings[`${part}MarkerColor`].toUpperCase();
  }
  elements.cutOuterMarkerCorners.checked = finderSettings.cutOuterMarkerCorners;
  elements.outerMarkerCornersOnly.checked = finderSettings.outerMarkerCornersOnly;
  elements.moduleColorCount.value = state.moduleColorCount;
  elements.moduleColorCount.setAttribute("aria-valuetext", `${state.moduleColorCount} ${state.moduleColorCount === 1 ? "color" : "colors"}`);
  elements.moduleColorCountValue.textContent = String(state.moduleColorCount);
  moduleColorControls.forEach((controls, index) => {
    controls.group.hidden = index >= state.moduleColorCount;
    controls.input.disabled = controls.group.hidden;
    controls.hexInput.disabled = controls.group.hidden;
    controls.input.value = getModuleColor(index);
    controls.hexInput.value = getModuleColor(index).toUpperCase();
  });
  elements.moduleStyle.value = state.moduleStyle;
  elements.polygonProperties.forEach((field) => { field.hidden = state.moduleStyle !== "regular-polygon"; });
  elements.shapeProperties.forEach((field) => { field.hidden = !["regular-polygon", "figure"].includes(state.moduleStyle); });
  elements.moduleMergeField.hidden = state.moduleStyle !== "regular-polygon";
  elements.figureProperties.forEach((field) => { field.hidden = state.moduleStyle !== "figure"; });
  elements.moduleFigureOptions.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.moduleFigure === state.moduleFigure));
  });
  elements.moduleRandomOptions.forEach((button) => {
    const key = button.dataset.moduleRandom;
    const supportsRandom = getRandomModuleProperties().some(([property]) => property === key);
    const isRandom = supportsRandom && state.moduleRandom[key];
    const individual = key === "moduleCornerRadius" && supportsRandom && state.individualCorners;
    const discrete = key === "moduleScale" && supportsRandom && state.discreteSizes;
    button.hidden = !supportsRandom;
    button.setAttribute("aria-pressed", String(state.moduleRandom[key]));
    elements[key].closest(".range-control").hidden = isRandom || individual || discrete;
    elements[key].disabled = isRandom || individual || discrete;
    const controls = moduleRandomControls.get(key);
    controls.group.hidden = !isRandom || individual || discrete;
    controls.min.disabled = !isRandom || individual || discrete;
    controls.max.disabled = !isRandom || individual || discrete;
    button.previousElementSibling.htmlFor = discrete ? elements.moduleSizeCount.id : individual
      ? (isRandom ? individualCornerControls[0].random.min.id : individualCornerControls[0].input.id)
      : (isRandom ? controls.min.id : key);
  });
  syncIndividualCornerControls();
  elements.rotationQuarterTurnsToggle.setAttribute("aria-pressed", String(state.rotationQuarterTurns));
  elements.moduleRotation.setAttribute("aria-label", state.rotationQuarterTurns ? "Initial module rotation for random 90° steps" : "Module rotation");
  const supportsDiscreteSizes = getRandomModuleProperties().some(([key]) => key === "moduleScale");
  elements.discreteSizesToggle.hidden = !supportsDiscreteSizes;
  elements.discreteSizesToggle.setAttribute("aria-pressed", String(state.discreteSizes));
  elements.moduleSizeCountControl.hidden = !supportsDiscreteSizes || !state.discreteSizes;
  elements.moduleSizeCount.disabled = elements.moduleSizeCountControl.hidden;
  elements.moduleSizeCount.value = state.moduleSizeCount;
  elements.moduleSizeCount.setAttribute("aria-valuetext", `${state.moduleSizeCount} sizes`);
  elements.moduleSizeCountValue.textContent = String(state.moduleSizeCount);
  elements.moduleSeedField.hidden = !hasRandomModuleProperties() && state.moduleColorCount === 1;
  elements.moduleSeed.value = state.moduleSeed;
  elements.moduleSeedValue.textContent = String(state.moduleSeed);
  elements.moduleMergeOptions.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.moduleMerge === state.moduleMerge));
  });
  MODULE_RANGE_PROPERTIES.forEach(([key, suffix]) => {
    elements[key].value = state[key];
    elements[`${key}Value`].textContent = `${state[key]}${suffix}`;
    const controls = moduleRandomControls.get(key);
    const range = state.moduleRandomRanges[key];
    const limits = MODULE_RANDOM_PROPERTIES[key];
    syncRandomRangeControls(controls, range, limits, suffix);
  });
  elements.logoSizeValue.textContent = `${state.logoSize}%`;

  if (!trimmedValue) {
    state.qr = null;
    state.encodedUrl = "";
    setValidation();
    updateVersionInfo(null);
    clearPreview();
    elements.download.disabled = true;
    return;
  }

  try {
    state.qr = createQr(trimmedValue, qrMode);
    state.encodedUrl = trimmedValue;
  } catch {
    state.qr = null;
    state.encodedUrl = "";
    setValidation("The content is too long to generate a QR code.");
    updateVersionInfo(null);
    clearPreview();
    elements.download.disabled = true;
    return;
  }

  setValidation();
  updateVersionInfo(state.qr, trimmedValue, qrMode);
  const dimension = state.qr.getModuleCount() + QUIET_ZONE * 2;
  elements.canvasArea.style.setProperty("--checkerboard-size", `calc(200% / ${dimension})`);
  elements.preview.replaceChildren();
  appendSvgModules(elements.preview, state.qr);
  appendSvgMarkers(elements.preview, state.qr);
  appendSvgLogo(elements.preview, state.qr);
  appendSvgQrStructureGuide(elements.preview, state.qr);
  appendSvgLogoGuide(elements.preview, state.qr);
  elements.preview.setAttribute("viewBox", `0 0 ${dimension} ${dimension}`);
  elements.preview.setAttribute("shape-rendering", getShapeRendering());
  elements.download.disabled = false;
}

function setColor(key, value) {
  const settings = getAppearanceSettings(key);
  settings[key] = value.toLowerCase();
  elements[key].value = settings[key];
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
elements.url.addEventListener("focus", syncVersionHintsVisibility);
elements.url.addEventListener("blur", syncVersionHintsVisibility);
window.addEventListener("focus", syncVersionHintsVisibility);
window.addEventListener("blur", syncVersionHintsVisibility);
document.addEventListener("visibilitychange", syncVersionHintsVisibility);
elements.errorCorrection.addEventListener("change", () => {
  state.errorCorrection = elements.errorCorrection.value;
  render();
});

["moduleStyle", "outerMarkerStyle", "innerMarkerStyle"].forEach((key) => {
  elements[key].addEventListener("change", () => {
    getAppearanceSettings(key)[key] = elements[key].value;
    render();
  });
});

elements.previewColumn.addEventListener("wheel", (event) => {
  if (event.ctrlKey || !event.deltaY) return;
  if (event.target === elements.url && elements.url.scrollHeight > elements.url.clientHeight) return;
  event.preventDefault();
  const lineHeight = Number.parseFloat(getComputedStyle(elements.controlsColumn).lineHeight) || 24;
  const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? lineHeight
    : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? elements.controlsColumn.clientHeight : 1;
  elements.controlsColumn.scrollTop += event.deltaY * unit;
}, { passive: false });

elements.previewColumn.addEventListener("touchmove", (event) => {
  if (event.cancelable && event.touches.length === 1 && !elements.qrContent.contains(event.target)) event.preventDefault();
}, { passive: false });

elements.previewColumn.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch" && !event.isPrimary) {
    releaseQrStructureHold();
    return;
  }
  if (elements.qrContent.contains(event.target)) return;
  if (!event.isPrimary || event.button !== 0 || qrStructurePointerId !== null || previewTouch) return;
  const showStructure = state.qr && elements.canvasArea.contains(event.target);
  if (!showStructure && event.pointerType !== "touch") return;
  event.preventDefault();
  if (event.pointerType === "touch") {
    previewTouch = { pointerId: event.pointerId, startY: event.clientY, lastY: event.clientY, dragging: false };
  }
  if (showStructure) qrStructurePointerId = event.pointerId;
  elements.previewColumn.setPointerCapture(event.pointerId);
  updateQrStructureHold();
});

elements.previewColumn.addEventListener("pointermove", (event) => {
  if (event.pointerId !== previewTouch?.pointerId) return;
  if (!previewTouch.dragging && Math.abs(event.clientY - previewTouch.startY) < 8) return;
  event.preventDefault();
  previewTouch.dragging = true;
  qrStructurePointerId = null;
  updateQrStructureHold();
  elements.controlsColumn.scrollTop += previewTouch.lastY - event.clientY;
  previewTouch.lastY = event.clientY;
});

function finishQrStructurePointer(event) {
  const matchesTouch = event.pointerId === previewTouch?.pointerId;
  if (event.pointerId !== qrStructurePointerId && !matchesTouch) return;
  if (matchesTouch) previewTouch = null;
  if (event.pointerId === qrStructurePointerId) qrStructurePointerId = null;
  updateQrStructureHold();
}

window.addEventListener("pointerup", finishQrStructurePointer, true);
window.addEventListener("pointercancel", finishQrStructurePointer, true);
elements.previewColumn.addEventListener("lostpointercapture", finishQrStructurePointer);
elements.canvasArea.addEventListener("contextmenu", (event) => {
  if (state.showQrStructure) event.preventDefault();
});
elements.canvasArea.addEventListener("keydown", (event) => {
  if (!state.qr || (event.key !== " " && event.key !== "Enter")) return;
  event.preventDefault();
  qrStructureKeys.add(event.key);
  updateQrStructureHold();
});
window.addEventListener("keyup", (event) => {
  if (!qrStructureKeys.delete(event.key)) return;
  event.preventDefault();
  updateQrStructureHold();
}, true);
elements.canvasArea.addEventListener("blur", releaseQrStructureHold);
window.addEventListener("blur", releaseQrStructureHold);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) releaseQrStructureHold();
});

elements.editAllFinderPatterns.addEventListener("click", () => {
  if (!state.editFindersIndividually && !state.finderPatterns) {
    state.finderPatterns = Array.from({ length: 3 }, () => (
      Object.fromEntries(FINDER_PROPERTIES.map((key) => [key, state[key]]))
    ));
  }
  state.editFindersIndividually = !state.editFindersIndividually;
  render();
});

elements.finderPatternOptions.forEach((button) => {
  const index = Number(button.dataset.finderPattern);
  button.addEventListener("click", () => {
    if (state.selectedFinderPattern === index) return;
    state.selectedFinderPattern = index;
    render();
  });
});

elements.markersAsModules.addEventListener("change", () => {
  getFinderSettings().markersAsModules = elements.markersAsModules.checked;
  render();
});

MODULE_RANGE_PROPERTIES.forEach(([key]) => {
  elements[key].addEventListener("input", () => {
    state[key] = Number(elements[key].value);
    render();
  });
});

elements.moduleRandomOptions.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.moduleRandom;
    if (key === "moduleRotation") state.rotationQuarterTurns = false;
    if (key === "moduleScale") state.discreteSizes = false;
    state.moduleRandom[key] = !state.moduleRandom[key];
    render();
  });
});

elements.individualCornersToggle.addEventListener("click", () => {
  if (!state.cornerRadii) {
    state.cornerRadii = Array.from({ length: 9 }, () => ({ value: state.moduleCornerRadius, ...state.moduleRandomRanges.moduleCornerRadius }));
  }
  state.individualCorners = !state.individualCorners;
  render();
});

elements.rotationQuarterTurnsToggle.addEventListener("click", () => {
  state.rotationQuarterTurns = !state.rotationQuarterTurns;
  state.moduleRandom.moduleRotation = false;
  render();
});

elements.discreteSizesToggle.addEventListener("click", () => {
  state.discreteSizes = !state.discreteSizes;
  state.moduleRandom.moduleScale = false;
  render();
});

elements.moduleSizeCount.addEventListener("input", () => {
  state.moduleSizeCount = Number(elements.moduleSizeCount.value);
  render();
});

elements.moduleColorCount.addEventListener("input", () => {
  state.moduleColorCount = Number(elements.moduleColorCount.value);
  render();
});

elements.moduleFigureOptions.forEach((button) => {
  const figure = button.dataset.moduleFigure;
  const geometry = getFigureGeometry({ moduleFigure: figure, moduleScale: 80, moduleRotation: 0 });
  button.querySelector("path").setAttribute("d", regularPolygonCommand(0, 0, geometry));
  button.addEventListener("click", () => {
    if (state.moduleFigure === figure) return;
    state.moduleFigure = figure;
    render();
  });
});

function bindRandomRangeControls(controls, key, cornerIndex = null) {
  for (const bound of ["min", "max"]) {
    controls[bound].addEventListener("input", () => {
      setRandomModuleBound(key, bound, Number(controls[bound].value), cornerIndex);
    });
  }

  // Native thumbs handle their own dragging. Tapping the shared rail moves
  // the nearer thumb, including when both thumbs start at the same value.
  let railPointer = null;
  const valueAtPointer = (event) => {
    const rect = controls.track.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (event.clientX - rect.left - 8) / Math.max(1, rect.width - 16)));
    const limits = MODULE_RANDOM_PROPERTIES[key];
    return Math.round(limits.min + position * (limits.max - limits.min));
  };
  controls.track.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0 || event.target.matches("input")) return;
    const value = valueAtPointer(event);
    const range = getModuleRandomRange(key, cornerIndex);
    const bound = value < (range.min + range.max) / 2 ? "min" : "max";
    event.preventDefault();
    railPointer = { id: event.pointerId, bound };
    controls[bound].focus({ preventScroll: true });
    controls.track.setPointerCapture(event.pointerId);
    setRandomModuleBound(key, bound, value, cornerIndex);
  });
  controls.track.addEventListener("pointermove", (event) => {
    if (railPointer?.id !== event.pointerId) return;
    setRandomModuleBound(key, railPointer.bound, valueAtPointer(event), cornerIndex);
  });
  const endRailPointer = (event) => {
    if (railPointer?.id !== event.pointerId) return;
    railPointer = null;
    if (controls.track.hasPointerCapture(event.pointerId)) controls.track.releasePointerCapture(event.pointerId);
  };
  controls.track.addEventListener("pointerup", endRailPointer);
  controls.track.addEventListener("pointercancel", endRailPointer);
  controls.track.addEventListener("lostpointercapture", endRailPointer);
}

moduleRandomControls.forEach((controls, key) => bindRandomRangeControls(controls, key));
individualCornerControls.forEach((controls, index) => {
  controls.input.addEventListener("input", () => {
    state.cornerRadii[index].value = Number(controls.input.value);
    render();
  });
  bindRandomRangeControls(controls.random, "moduleCornerRadius", index);
});

elements.moduleSeed.addEventListener("input", () => {
  state.moduleSeed = Number(elements.moduleSeed.value);
  render();
});

elements.moduleMergeOptions.forEach((button) => {
  button.addEventListener("click", () => {
    const merge = button.dataset.moduleMerge;
    if (state.moduleMerge === merge) return;
    state.moduleMerge = merge;
    render();
  });
});

[
  ["cutOuterMarkerCorners", "outerMarkerCornersOnly"],
  ["outerMarkerCornersOnly", "cutOuterMarkerCorners"],
].forEach(([key, otherKey]) => {
  elements[key].addEventListener("change", () => {
    const settings = getFinderSettings();
    settings[key] = elements[key].checked;
    if (settings[key]) settings[otherKey] = false;
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

function bindColorEditor(colorInput, hexInput, getValue, applyValue) {
  colorInput.addEventListener("input", () => applyValue(colorInput.value));

  hexInput.addEventListener("input", () => {
    const value = hexInput.value.trim();
    if (!/^#?[\da-f]{6}$/i.test(value)) return;
    applyValue(`#${value.replace("#", "")}`);
  });

  hexInput.addEventListener("blur", () => {
    const value = hexInput.value.trim().replace("#", "");
    if (/^[\da-f]{3}$/i.test(value)) {
      applyValue(`#${[...value].map((character) => character.repeat(2)).join("")}`);
    } else {
      render();
    }
  });

  hexInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") hexInput.blur();
    if (event.key === "Escape") {
      hexInput.value = getValue().toUpperCase();
      hexInput.blur();
    }
  });
}

["outerMarkerColor", "innerMarkerColor", "moduleColor"].forEach((key) => {
  bindColorEditor(elements[key], elements[`${key}Value`], () => getAppearanceSettings(key)[key], (value) => setColor(key, value));
});
moduleColorControls.slice(1).forEach((controls, index) => {
  bindColorEditor(controls.input, controls.hexInput, () => getModuleColor(index + 1), (value) => {
    state.moduleExtraColors[index] = value.toLowerCase();
    render();
  });
});

function buildSvg(code, size) {
  const dimension = code.getModuleCount() + QUIET_ZONE * 2;
  let moduleData;
  const palette = getModulePalettePaint(code);
  if (palette) {
    moduleData = `<defs><clipPath id="${MODULE_PALETTE_CLIP_ID}" clipPathUnits="userSpaceOnUse"><path d="${palette.clipData}"/></clipPath></defs><g clip-path="url(#${MODULE_PALETTE_CLIP_ID})" shape-rendering="crispEdges"><rect width="${palette.dimension}" height="${palette.dimension}" fill="${state.moduleColor}"/>${palette.groups.map(({ d, color }) => `<path d="${d}" fill="${color}"/>`).join("")}</g>`;
  } else if (isCircuitStyle()) {
    const geometry = getCircuitGeometry(code);
    const trackData = circuitTrackPath(geometry);
    const dotData = circuitDotPath(geometry);
    moduleData = `${trackData ? `<path d="${trackData}" fill="none" stroke="${state.moduleColor}" stroke-width="${formatNumber(geometry.width)}" stroke-linecap="round" stroke-linejoin="round"/>` : ""}${dotData ? `<path d="${dotData}" fill="${state.moduleColor}"/>` : ""}`;
  } else {
    moduleData = `<path d="${modulesToPath(code)}" fill="${state.moduleColor}"/>`;
  }
  const markerData = markerPositions(code).map(([x, y], markerIndex) => {
    if (getFinderSettings(markerIndex).markersAsModules) return "";
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
  const rendering = getShapeRendering();
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
  context.lineWidth = moduleSize;
  context.lineCap = "butt";

  markerPositions(code, quietZone).forEach(([moduleX, moduleY], markerIndex) => {
    if (getFinderSettings(markerIndex).markersAsModules) return;
    const x = offset + moduleX * moduleSize;
    const y = offset + moduleY * moduleSize;

    ["outer", "inner"].forEach((part) => {
      const { tag, attributes } = getMarkerShape(x, y, markerIndex, part, moduleSize);
      const draw = part === "outer" ? "stroke" : "fill";
      context.save();
      if (part === "outer") context.strokeStyle = attributes.stroke;
      else context.fillStyle = attributes.fill;
      if (part === "outer" && hasOuterMarkerClip(markerIndex)) {
        context.clip(new Path2D(outerMarkerClipCommand(x, y, moduleSize, markerIndex)));
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

function drawCanvasModulePalette(context, palette, moduleSize, offset, quietZone) {
  if (!palette.clipData) return;
  context.save();
  context.fillStyle = state.moduleColor;
  context.translate(offset, offset);
  context.scale(moduleSize, moduleSize);
  context.fill(new Path2D(palette.clipData));
  context.restore();
  // Draw the original alpha coverage once. Coloring cells with source-atop
  // on the same canvas preserves subpixel coverage with the finder patterns.
  context.save();
  context.globalCompositeOperation = "source-atop";
  palette.groups.forEach(({ color, cells }) => {
    context.fillStyle = color;
    context.beginPath();
    cells.forEach(([row, column]) => {
      const left = Math.round(offset + (column + quietZone) * moduleSize);
      const top = Math.round(offset + (row + quietZone) * moduleSize);
      const right = Math.round(offset + (column + quietZone + 1) * moduleSize);
      const bottom = Math.round(offset + (row + quietZone + 1) * moduleSize);
      context.rect(left, top, right - left, bottom - top);
    });
    context.fill();
  });
  context.restore();
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

  const palette = getModulePalettePaint(code, quietZone);
  if (palette) {
    drawCanvasModulePalette(context, palette, moduleSize, offset, quietZone);
  } else if (isCircuitStyle()) {
    drawCanvasCircuit(context, getCircuitGeometry(code, quietZone), moduleSize, offset);
  } else if (["regular-polygon", "figure"].includes(state.moduleStyle)) {
    context.save();
    context.translate(offset, offset);
    context.scale(moduleSize, moduleSize);
    context.fill(new Path2D(modulesToPath(code, quietZone)));
    context.restore();
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

landscapeLayout.addEventListener("change", () => {
  releaseQrStructureHold();
  updateContentPlacement();
});
let qrTextFieldWidth = 0;
const previewDetailsObserver = new ResizeObserver(() => {
  const width = elements.url.getBoundingClientRect().width;
  if (width !== qrTextFieldWidth) {
    qrTextFieldWidth = width;
    resizeQrTextField();
  }
  updatePreviewDetailsHeight();
});
previewDetailsObserver.observe(elements.qrContent);

updateContentPlacement();
render();
