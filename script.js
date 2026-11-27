const defaults = {
  url: "example.com",
  outerMarkerColor: "#202020",
  innerMarkerColor: "#202020",
  moduleColor: "#202020",
  errorCorrection: "M",
  moduleStyle: "regular-polygon",
  moduleFigure: "cross",
  outerAsModules: false,
  innerAsModules: false,
  showQrStructure: false,
  outerMarkerStyle: "regular-polygon",
  cutOuterMarkerCorners: false,
  outerMarkerCornersOnly: false,
  innerMarkerStyle: "regular-polygon",
  moduleScale: 100,
  moduleSides: 4,
  moduleCornerRadius: 0,
  moduleNoise: 36,
  moduleSmooth: 78,
  moduleRotation: 0,
  moduleGooeyDensity: 4,
  moduleGooeyBallSize: 50,
  moduleGooeyBlendStrength: 70,
  moduleGooeyLinkBallSize: 80,
  moduleGooeyLinkDensity: 1,
  moduleGooeyMerge: "all",
  moduleMerge: "none",
  backgroundColor: "transparent",
  exportFormat: "svg",
  exportSize: "256",
  logoSize: 20,
  showLogoArea: false,
  clearLogoArea: false,
};

const STRESS_TEST_DEFAULTS = {
  blur: false, contrast: false, lowLight: false, glare: false, noise: false,
};
const WOBBLY_DEFAULTS = { wobble: 55, edgeBend: 0, cornerRadius: 0 };

const state = {
  ...defaults,
  editFindersIndividually: false,
  selectedFinderPattern: 0,
  finderPatterns: null,
  outerPolygon: createFinderPolygonSettings(),
  outerWobbly: { ...WOBBLY_DEFAULTS },
  outerGooey: { density: 56, sizeVariation: 60, spacingVariation: 55, pathDeviation: 55, blendStrength: 80 },
  innerPolygon: { ...createFinderPolygonSettings(), moduleNoise: defaults.moduleNoise, moduleSmooth: defaults.moduleSmooth },
  innerWobbly: { ...WOBBLY_DEFAULTS },
  innerGooey: { density: 9, ballSize: 75, blendStrength: 45, linkBallSize: 40 },
  alignmentAsModules: true,
  alignment: createAlignmentSettings(),
  individualCorners: false,
  cornerRadii: null,
  rotationQuarterTurns: false,
  moduleSteps: {
    moduleScale: { enabled: false, count: 2 },
    moduleNoise: { enabled: false, count: 2 },
    moduleSmooth: { enabled: false, count: 2 },
  },
  moduleColorCount: 1,
  moduleExtraColors: Array(3).fill(defaults.moduleColor),
  moduleWobble: WOBBLY_DEFAULTS.wobble,
  moduleEdgeBend: WOBBLY_DEFAULTS.edgeBend,
  moduleFigures: [defaults.moduleFigure],
  encodedUrl: defaults.url,
  qr: null,
  moduleSeed: crypto.getRandomValues(new Uint32Array(1))[0],
  moduleRandom: {
    moduleSides: false, moduleScale: false, moduleCornerRadius: false,
    moduleRotation: false, moduleNoise: false, moduleSmooth: false,
    moduleGooeyDensity: true, moduleGooeyBallSize: true, moduleGooeyBlendStrength: false,
    moduleGooeyLinkBallSize: false,
  },
  moduleRandomRanges: {
    moduleSides: { min: 3, max: 9 },
    moduleScale: { min: 70, max: 100 },
    moduleCornerRadius: { min: 0, max: 100 },
    moduleRotation: { min: 0, max: 360 },
    moduleNoise: { min: 0, max: 100 },
    moduleSmooth: { min: 0, max: 100 },
    moduleGooeyDensity: { min: 3, max: 7 },
    moduleGooeyBallSize: { min: 50, max: 75 },
    moduleGooeyBlendStrength: { min: 0, max: 100 },
    moduleGooeyLinkBallSize: { min: 25, max: 100 },
  },
  logoDataUrl: "",
  logoAspectRatio: 1,
  logoImage: null,
  logoName: "",
  stressTests: { ...STRESS_TEST_DEFAULTS },
};

const elements = {
  preview: document.querySelector("#qrPreview"),
  canvasArea: document.querySelector("#canvasArea"),
  previewSurface: document.querySelector("#qrPreviewSurface"),
  stressTests: document.querySelectorAll("[data-stress-test]"),
  stressNoise: document.querySelector("#stressNoise"),
  stressGlare: document.querySelector("#stressGlare"),
  sectionResets: document.querySelectorAll("[data-reset-section]"),
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
  moduleStepsOptions: document.querySelectorAll("[data-module-steps]"),
  moduleSeedField: document.querySelector("#moduleSeedField"),
  moduleSeed: document.querySelector("#moduleSeed"),
  moduleSeedValue: document.querySelector("#moduleSeedValue"),
  polygonProperties: document.querySelectorAll(".polygon-property"),
  wobblyProperties: document.querySelectorAll(".wobbly-property"),
  blobProperties: document.querySelectorAll(".blob-property"),
  gooeyProperties: document.querySelectorAll(".gooey-property"),
  shapeProperties: document.querySelectorAll(".shape-property"),
  figureProperties: document.querySelectorAll(".figure-property"),
  moduleSizeField: document.querySelector(".module-size-field"),
  moduleFigureOptions: document.querySelectorAll("[data-module-figure]"),
  moduleSides: document.querySelector("#moduleSides"),
  moduleSidesValue: document.querySelector("#moduleSidesValue"),
  moduleWobble: document.querySelector("#moduleWobble"),
  moduleWobbleValue: document.querySelector("#moduleWobbleValue"),
  moduleEdgeBend: document.querySelector("#moduleEdgeBend"),
  moduleEdgeBendValue: document.querySelector("#moduleEdgeBendValue"),
  moduleCornerRadius: document.querySelector("#moduleCornerRadius"),
  moduleCornerRadiusValue: document.querySelector("#moduleCornerRadiusValue"),
  moduleNoise: document.querySelector("#moduleNoise"),
  moduleNoiseValue: document.querySelector("#moduleNoiseValue"),
  moduleSmooth: document.querySelector("#moduleSmooth"),
  moduleSmoothValue: document.querySelector("#moduleSmoothValue"),
  moduleGooeyDensity: document.querySelector("#moduleGooeyDensity"),
  moduleGooeyDensityValue: document.querySelector("#moduleGooeyDensityValue"),
  moduleGooeyBallSize: document.querySelector("#moduleGooeyBallSize"),
  moduleGooeyBallSizeValue: document.querySelector("#moduleGooeyBallSizeValue"),
  moduleGooeyBlendStrength: document.querySelector("#moduleGooeyBlendStrength"),
  moduleGooeyBlendStrengthValue: document.querySelector("#moduleGooeyBlendStrengthValue"),
  moduleGooeyLinkBallSize: document.querySelector("#moduleGooeyLinkBallSize"),
  moduleGooeyLinkBallSizeValue: document.querySelector("#moduleGooeyLinkBallSizeValue"),
  moduleGooeyLinkDensity: document.querySelector("#moduleGooeyLinkDensity"),
  moduleGooeyLinkDensityValue: document.querySelector("#moduleGooeyLinkDensityValue"),
  individualCornersToggle: document.querySelector("#individualCornersToggle"),
  individualCornerControls: document.querySelector("#individualCornerControls"),
  moduleRotation: document.querySelector("#moduleRotation"),
  moduleRotationValue: document.querySelector("#moduleRotationValue"),
  rotationQuarterTurnsToggle: document.querySelector("#rotationQuarterTurnsToggle"),
  moduleMergeOptions: document.querySelectorAll("[data-module-merge]"),
  moduleMergeField: document.querySelector(".module-merge-field"),
  finderModulesOptions: document.querySelectorAll("[data-finder-modules]"),
  alignmentAsModules: document.querySelector("#alignmentAsModules"),
  alignmentProperties: document.querySelector("#alignmentProperties"),
  alignmentSection: document.querySelector(".alignment-patterns-section"),
  outerMarkerProperties: document.querySelector("#outerMarkerProperties"),
  innerMarkerProperties: document.querySelector("#innerMarkerProperties"),
  editAllFinderPatterns: document.querySelector("#editAllFinderPatterns"),
  finderPatternSelector: document.querySelector("#finderPatternSelector"),
  finderPatternOptions: document.querySelectorAll("[data-finder-pattern]"),
  outerMarkerControls: document.querySelector("#outerMarkerControls"),
  innerMarkerControls: document.querySelector("#innerMarkerControls"),
  outerMarkerStyle: document.querySelector("#outerMarkerStyle"),
  outerWobblyProperties: document.querySelector("#outerWobblyProperties"),
  outerGooeyProperties: document.querySelector("#outerGooeyProperties"),
  cutOuterMarkerCorners: document.querySelector("#cutOuterMarkerCorners"),
  outerMarkerCornersOnly: document.querySelector("#outerMarkerCornersOnly"),
  innerMarkerStyle: document.querySelector("#innerMarkerStyle"),
  innerPolygonProperties: document.querySelector("#innerPolygonProperties"),
  innerWobblyProperties: document.querySelector("#innerWobblyProperties"),
  innerGooeyProperties: document.querySelector("#innerGooeyProperties"),
  moduleScale: document.querySelector("#moduleScale"),
  moduleScaleValue: document.querySelector("#moduleScaleValue"),
  outerMarkerColor: document.querySelector("#outerMarkerColor"),
  outerMarkerColorValue: document.querySelector("#outerMarkerColorValue"),
  innerMarkerColor: document.querySelector("#innerMarkerColor"),
  innerMarkerColorValue: document.querySelector("#innerMarkerColorValue"),
  moduleColor: document.querySelector("#moduleColor"),
  moduleColorValue: document.querySelector("#moduleColorValue"),
  moduleColorCount: document.querySelector("#moduleColorCount"),
  moduleColorCountValue: document.querySelector("#moduleColorCountValue"),
  moduleColorEditors: document.querySelector("#moduleColorEditors"),
  backgroundColor: document.querySelector("#backgroundColor"),
  backgroundColorValue: document.querySelector("#backgroundColorValue"),
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
const OUTER_FINDER_SIZE = 7;
const OUTER_FINDER_SIDE_LIMITS = { min: 4, max: 12, step: 4 };
const FIXED_FINDER_POLYGON_TRANSFORM = { moduleScale: 100, moduleRotation: 0 };
const FINDER_PROPERTIES = [
  "outerAsModules", "innerAsModules", "outerMarkerStyle", "innerMarkerStyle",
  "outerMarkerColor", "innerMarkerColor", "cutOuterMarkerCorners", "outerMarkerCornersOnly",
  "outerPolygon", "outerWobbly", "outerGooey", "innerPolygon", "innerWobbly", "innerGooey",
];
const sectionDefaults = {
  module: structuredClone(Object.fromEntries([
    ...Object.keys(state).filter((key) => key.startsWith("module") && key !== "moduleSeed"),
    "individualCorners", "cornerRadii", "rotationQuarterTurns",
  ].map((key) => [key, state[key]]))),
  finders: structuredClone(Object.fromEntries(FINDER_PROPERTIES.map((key) => [key, state[key]]))),
};
const MODULE_RANGE_PROPERTIES = [
  ["moduleSides", ""], ["moduleScale", "%"],
  ["moduleCornerRadius", "%"], ["moduleNoise", "%"],
  ["moduleSmooth", "%"], ["moduleRotation", "°"],
];
const POLYGON_RANGE_PROPERTIES = MODULE_RANGE_PROPERTIES.filter(([key]) => !["moduleNoise", "moduleSmooth"].includes(key));
const WOBBLY_DEFORMATION_PROPERTIES = [["moduleWobble", "%"], ["moduleEdgeBend", "%"]];
const WOBBLY_RANGE_PROPERTIES = [...POLYGON_RANGE_PROPERTIES, ...WOBBLY_DEFORMATION_PROPERTIES];
const BLOB_RANGE_PROPERTIES = MODULE_RANGE_PROPERTIES.filter(([key]) => key !== "moduleCornerRadius");
const FIGURE_RANGE_PROPERTIES = POLYGON_RANGE_PROPERTIES.filter(([key]) => ["moduleScale", "moduleRotation"].includes(key));
const GOOEY_RANGE_PROPERTIES = [
  ["moduleGooeyDensity", ""], ["moduleGooeyBallSize", "%"], ["moduleGooeyBlendStrength", "%"],
];
const ALL_MODULE_RANGE_PROPERTIES = [
  ...MODULE_RANGE_PROPERTIES, ...WOBBLY_DEFORMATION_PROPERTIES, ...GOOEY_RANGE_PROPERTIES,
  ["moduleGooeyLinkBallSize", "%"], ["moduleGooeyLinkDensity", ""],
];
const MODULE_FIGURES = ["cross", "heart", "rounded-star"];
const MODULE_RANDOM_PROPERTIES = {
  moduleSides: { min: 3, max: 9, salt: 0x9e3779b9 },
  moduleScale: { min: 70, max: 100, salt: 0x243f6a88 },
  moduleCornerRadius: { min: 0, max: 100, salt: 0xb7e15162 },
  moduleRotation: { min: 0, max: 360, salt: 0xdeadbeef },
  moduleNoise: { min: 0, max: 100, salt: 0x299f31d0 },
  moduleSmooth: { min: 0, max: 100, salt: 0xd1310ba6 },
  moduleGooeyDensity: { min: 1, max: 9, salt: 0xbb67ae85 },
  moduleGooeyBallSize: { min: 25, max: 100, salt: 0x3c6ef372 },
  moduleGooeyBlendStrength: { min: 0, max: 100, salt: 0xa54ff53a },
  moduleGooeyLinkBallSize: { min: 25, max: 100, salt: 0x510e527f },
  moduleBlobContour: { salt: 0x98dfb5ac },
  moduleGooeyZones: { salt: 0x1f83d9ab },
  innerGooeyZones: { salt: 0x5be0cd19 },
  wobblyContour: { salt: 0xa13b1f37 },
  gooeyContour: { salt: 0x9b05688c },
  moduleColor: { salt: 0xa4093822 },
  moduleFigure: { salt: 0x082efa98 },
  alignmentOuterColor: { salt: 0x452821e6 },
  alignmentInnerColor: { salt: 0x38d01377 },
};
const moduleRandomControls = new Map(Array.from(elements.moduleRandomRanges, (group) => [group.dataset.moduleRandomRange, getRandomRangeControls(group)]));
const moduleStepsControls = new Map(Array.from(elements.moduleStepsOptions, (button) => {
  const group = document.getElementById(button.getAttribute("aria-controls"));
  return [button.dataset.moduleSteps, { button, group, input: group.querySelector("input"), output: group.querySelector("output") }];
}));
const individualCornerControls = createIndividualCornerControls();
const moduleColorControls = createModuleColorControls();
const outerPolygonControls = createFinderPolygonControls("outer", {
  sideLimits: OUTER_FINDER_SIDE_LIMITS,
  fixedPolygonProperties: FIXED_FINDER_POLYGON_TRANSFORM,
});
const finderCustomStyleControls = [
  ["outer", "Wobbly", "wobbly-polygon"], ["inner", "Wobbly", "wobbly-polygon"],
  ["outer", "Gooey", "gooey-polygon"], ["inner", "Gooey", "gooey"],
].map(([part, type, style]) => {
  const key = `${part}${type}`;
  const container = elements[`${key}Properties`];
  const property = type.toLowerCase();
  const controls = Array.from(container.querySelectorAll(`[data-${property}]`), (input) => ({
    key: input.dataset[property], input, output: input.parentElement.querySelector("output"),
  }));
  return { part, key, container, style, controls };
});
const innerPolygonControls = createFinderPolygonControls("inner", { rangeProperties: MODULE_RANGE_PROPERTIES });
const finderPolygonControls = { outer: outerPolygonControls, inner: innerPolygonControls };
const alignmentControls = Object.fromEntries(["outer", "inner"].map((part) => [part, createAlignmentControls(part)]));
const finderPolygonCache = new Map();
const alignmentPolygonCache = new Map();
const alignmentPositionsCache = new Map();
const QR_STRUCTURE_REGIONS = [
  { id: "finder", label: "Finder patterns", color: "#EF4444" },
  { id: "separators", label: "Separators", color: "#10B981" },
  { id: "timing", label: "Timing patterns", color: "#EAB308" },
  { id: "version", label: "Version information", color: "#8B5CF6" },
  { id: "format", label: "Format information", color: "#3B82F6" },
  { id: "alignment", label: "Alignment patterns", color: "#D000A7" },
  { id: "error-correction", label: "Error correction codewords", color: "#808080" },
  { id: "quiet", label: "Quiet zone", color: "#06B6D4" },
];
const capacityCache = new Map();
let regularPolygonCache;
let figureGeometryCache;
let gooeyModuleCache;
const figureTemplateCache = new Map();
let moduleShapeCache = { key: "", cells: new Map(), variants: new Map() };
let toastTimer;
let logoDragDepth = 0;
let logoLoadRevision = 0;
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

function createFinderPolygonSettings() {
  return {
    moduleSides: 4, moduleScale: 100, moduleCornerRadius: 0, moduleRotation: 0, moduleFigure: "cross",
    individualCorners: false, cornerRadii: null,
  };
}

function createAlignmentSettings() {
  return {
    outerMarkerStyle: "regular-polygon", innerMarkerStyle: "regular-polygon",
    outerPolygon: createFinderPolygonSettings(), innerPolygon: createFinderPolygonSettings(),
    outerColorCount: 1, innerColorCount: 1,
    outerColors: Array(4).fill("#202020"), innerColors: Array(4).fill("#202020"),
  };
}

function createFinderPolygonControls(part, {
  prefix = part,
  container = document.querySelector(`#${part}PolygonProperties`),
  owner = `${part === "outer" ? "Outer" : "Inner"} marker`,
  getSettings = () => getFinderSettings()[`${part}Polygon`],
  rangeProperties = POLYGON_RANGE_PROPERTIES,
  sideLimits = {},
  fixedPolygonProperties = {},
} = {}) {
  const controls = { rangeProperties, fixedPolygonProperties };
  const controlId = (id) => `${prefix}${id[0].toUpperCase()}${id.slice(1)}`;
  controls.figureField = document.createElement("div");
  controls.figureField.className = "range-field";
  controls.figureField.setAttribute("role", "group");
  controls.figureField.setAttribute("aria-label", `${owner} figure`);
  controls.figureField.hidden = true;
  controls.figureField.append(elements.moduleFigureOptions[0].parentElement.cloneNode(true));
  controls.figures = Array.from(controls.figureField.querySelectorAll("button"));
  controls.figures.forEach((button) => {
    const figure = button.dataset.moduleFigure;
    button.removeAttribute("data-module-figure");
    button.dataset.finderFigure = figure;
    button.setAttribute("aria-label", `${owner}: ${button.getAttribute("aria-label")}`);
    button.addEventListener("click", () => {
      const settings = getSettings();
      if (settings.moduleFigure === figure) return;
      settings.moduleFigure = figure;
      render();
    });
  });
  container.append(controls.figureField);
  rangeProperties.forEach(([key]) => {
    const field = document.createElement("div");
    field.className = "range-field";
    const heading = document.createElement("div");
    heading.className = "property-heading";
    const label = document.createElement("label");
    label.htmlFor = controlId(key);
    label.textContent = elements[key].closest(".range-field").querySelector(".property-heading label").textContent;
    heading.append(label);
    const manual = elements[key].closest(".range-control").cloneNode(true);
    manual.id = `${controlId(key)}Control`;
    const input = manual.querySelector("input");
    input.id = controlId(key);
    if (key === "moduleSides") Object.assign(input, sideLimits);
    input.setAttribute("aria-label", `${owner} ${label.textContent.toLowerCase()}`);
    const output = manual.querySelector("output");
    output.id = `${controlId(key)}Value`;
    output.setAttribute("for", input.id);
    field.append(heading, manual);
    container.append(field);
    controls[key] = { field, input, output, manual, label };
    input.addEventListener("input", () => { getSettings()[key] = Number(input.value); render(); });
    if (key === "moduleCornerRadius") {
      controls.individual = elements.individualCornersToggle.cloneNode(true);
      controls.individual.id = controlId("individualCornersToggle");
      controls.individual.setAttribute("aria-label", `Edit ${owner.toLowerCase()} corners individually`);
      controls.individual.setAttribute("aria-controls", controlId("individualCornerControls"));
      heading.append(controls.individual);
      controls.cornerContainer = document.createElement("div");
      controls.cornerContainer.id = controlId("individualCornerControls");
      controls.cornerContainer.className = "individual-corner-controls";
      controls.cornerContainer.setAttribute("role", "group");
      controls.cornerContainer.setAttribute("aria-label", `${owner} individual corner radii`);
      controls.cornerContainer.hidden = true;
      field.append(controls.cornerContainer);
      controls.corners = createIndividualCornerControls({
        prefix: `${prefix}Corner`, container: controls.cornerContainer, source: input, randomSource: null, label: owner,
        count: sideLimits.max ?? Number(elements.moduleSides.max),
      });
      controls.corners.forEach((corner, index) => {
        corner.input.addEventListener("input", () => { getSettings().cornerRadii[index].value = Number(corner.input.value); render(); });
      });
      controls.individual.addEventListener("click", () => {
        const settings = getSettings();
        settings.cornerRadii ||= controls.corners.map(() => ({ value: settings.moduleCornerRadius }));
        settings.individualCorners = !settings.individualCorners;
        render();
      });
    }
  });
  return controls;
}

function syncFinderPolygonControls(part, finder = getFinderSettings(), editor = finderPolygonControls[part]) {
  const settings = finder[`${part}Polygon`];
  const style = finder[`${part}MarkerStyle`];
  const sidesOnly = style === "wobbly-polygon" || style === "gooey-polygon";
  const activeProperties = getModuleRangeProperties(style);
  const hasIndividualCorners = style === "regular-polygon" && settings.individualCorners;
  editor.figureField.hidden = style !== "figure";
  editor.figures.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.finderFigure === settings.moduleFigure));
  });
  editor.rangeProperties.forEach(([key, suffix]) => {
    const control = editor[key];
    const fixed = style === "regular-polygon" && Object.hasOwn(editor.fixedPolygonProperties, key);
    control.field.hidden = sidesOnly ? key !== "moduleSides" : fixed || !activeProperties.some(([property]) => property === key);
    const individual = key === "moduleCornerRadius" && hasIndividualCorners;
    control.input.value = settings[key];
    control.output.textContent = `${settings[key]}${suffix}`;
    control.manual.hidden = individual;
    control.input.disabled = individual || control.field.hidden;
    control.label.htmlFor = individual ? editor.corners[0].input.id : control.input.id;
  });
  editor.individual.setAttribute("aria-pressed", String(settings.individualCorners));
  editor.cornerContainer.hidden = !hasIndividualCorners;
  editor.corners.forEach((control, index) => {
    const visible = hasIndividualCorners && index < settings.moduleSides;
    const value = settings.cornerRadii?.[index].value ?? settings.moduleCornerRadius;
    control.field.hidden = !visible;
    control.input.disabled = !visible;
    control.input.value = value;
    control.output.textContent = `${value}%`;
  });
}

function createAlignmentControls(part) {
  const title = part === "outer" ? "Outer" : "Inner";
  const prefix = `alignment${title}`;
  const polygon = createFinderPolygonControls(part, {
    prefix,
    owner: `Alignment ${part}`,
    container: document.querySelector(`#${prefix}PolygonProperties`),
    getSettings: () => state.alignment[`${part}Polygon`],
  });
  const style = document.querySelector(`#${prefix}Style`);
  style.addEventListener("change", () => {
    state.alignment[`${part}MarkerStyle`] = style.value;
    render();
  });
  const count = document.querySelector(`#${prefix}ColorCount`);
  const output = document.querySelector(`#${prefix}ColorCountValue`);
  count.addEventListener("input", () => {
    state.alignment[`${part}ColorCount`] = Number(count.value);
    render();
  });
  const colors = createModuleColorControls(
    document.querySelector(`#${prefix}Color`), document.querySelector(`#${prefix}ColorEditors`),
    `${prefix}Color`, `Alignment ${part}`,
  );
  colors.forEach((control, index) => {
    bindColorEditor(control.input, control.hexInput,
      () => state.alignment[`${part}Colors`][index],
      (value) => { state.alignment[`${part}Colors`][index] = value.toLowerCase(); render(); });
  });
  return { polygon, style, count, output, colors };
}

function syncAlignmentControls() {
  const version = state.qr ? (state.qr.getModuleCount() - 17) / 4 : 0;
  elements.alignmentSection.hidden = version < 2;
  elements.alignmentAsModules.setAttribute("aria-pressed", String(state.alignmentAsModules));
  elements.alignmentAsModules.setAttribute("aria-expanded", String(!state.alignmentAsModules));
  elements.alignmentProperties.hidden = state.alignmentAsModules;
  for (const part of ["outer", "inner"]) {
    const controls = alignmentControls[part];
    syncFinderPolygonControls(part, state.alignment, controls.polygon);
    controls.style.value = state.alignment[`${part}MarkerStyle`];
    const count = getAlignmentColorCount(part, state.qr);
    controls.count.closest(".range-control").hidden = version < 7;
    controls.count.disabled = version < 7;
    controls.count.closest(".range-field").querySelector("label").htmlFor = version < 7 ? controls.colors[0].input.id : controls.count.id;
    controls.count.value = count;
    controls.count.setAttribute("aria-valuetext", `${count} ${count === 1 ? "color" : "colors"}`);
    controls.output.textContent = count;
    controls.colors.forEach((control, index) => {
      control.group.hidden = index >= count;
      control.input.disabled = control.hexInput.disabled = index >= count;
      control.input.value = state.alignment[`${part}Colors`][index];
      control.hexInput.value = state.alignment[`${part}Colors`][index].toUpperCase();
    });
  }
  const randomAlignmentColors = !state.alignmentAsModules && ["outer", "inner"].some((part) => getAlignmentColorCount(part, state.qr) > 1);
  const hasSeededFinder = [0, 1, 2].some((index) => {
    const finder = getFinderSettings(index);
    return (!finder.innerAsModules && ["blob", "gooey", "wobbly-polygon"].includes(finder.innerMarkerStyle))
      || (!finder.outerAsModules && ["wobbly-polygon", "gooey-polygon"].includes(finder.outerMarkerStyle));
  });
  elements.moduleSeedField.hidden = !["blob", "gooey", "wobbly-polygon"].includes(state.moduleStyle) && !hasRandomModuleProperties()
    && state.moduleColorCount === 1 && !randomAlignmentColors && !hasSeededFinder;
}

function getPatternPolygon(style, settings) {
  const rangeProperties = style === "blob" ? BLOB_RANGE_PROPERTIES : POLYGON_RANGE_PROPERTIES;
  const properties = Object.fromEntries(rangeProperties.map(([key]) => [key, settings[key]]));
  if (style === "blob") return { geometry: getBlobGeometry(properties), properties };
  const figure = style === "figure";
  properties.moduleFigure = settings.moduleFigure;
  if (!figure && settings.individualCorners) properties.moduleCornerRadii = settings.cornerRadii.slice(0, settings.moduleSides).map((corner) => corner.value);
  return { geometry: figure ? getFigureGeometry(properties) : getRegularPolygonGeometry(properties), properties };
}

function getFinderPolygon(markerIndex, part = "outer") {
  const finder = getFinderSettings(markerIndex);
  const style = finder[`${part}MarkerStyle`];
  const wobbly = style === "wobbly-polygon" ? finder[`${part}Wobbly`] : null;
  const outerGooey = style === "gooey-polygon" ? finder.outerGooey : null;
  const innerGooey = style === "gooey" ? finder.innerGooey : null;
  const polygon = finder[`${part}Polygon`];
  const fixedTransform = wobbly || (part === "outer" && (style === "regular-polygon" || outerGooey));
  const settings = fixedTransform ? { ...polygon, ...FIXED_FINDER_POLYGON_TRANSFORM } : polygon;
  const color = finder[`${part}MarkerColor`];
  const cacheIndex = `${part}:${markerIndex}`;
  const seed = wobbly || outerGooey || innerGooey || style === "blob" ? state.moduleSeed : null;
  const cacheKey = JSON.stringify([style, settings, color, wobbly ?? outerGooey ?? innerGooey, seed]);
  if (finderPolygonCache.get(cacheIndex)?.key === cacheKey) return finderPolygonCache.get(cacheIndex).value;
  let shape;
  if (outerGooey) {
    const guide = getRegularPolygonGeometry({ ...settings, moduleCornerRadius: 0 });
    const vertices = [guide.start, ...guide.segments.map(({ end }) => end)]
      .map((point) => point.map((value) => value * OUTER_FINDER_SIZE));
    const random = (index, channel) => randomModuleFraction("gooeyContour", 0, index, channel);
    shape = { geometry: { loops: createGooeyPolygonLoops(vertices, outerGooey, random) }, properties: settings };
  } else if (innerGooey) {
    const random = (zone, channel = 0) => randomModuleFraction("innerGooeyZones", channel, zone);
    const { contours } = createGooeyGridField(innerGooey, random, { zoneSize: 1 / 3, randomizePositions: true });
    shape = { geometry: { loops: contours }, properties: settings };
  } else if (wobbly) {
    shape = { geometry: getWobblyPolygonGeometry(settings, wobbly), properties: settings };
  } else {
    shape = getPatternPolygon(style, settings);
  }
  const value = { ...shape, color };
  finderPolygonCache.set(cacheIndex, { key: cacheKey, value });
  return value;
}

function finderPolygonCommand(x, y, markerIndex, part = "outer", scale = 1) {
  const { geometry } = getFinderPolygon(markerIndex, part);
  const factor = (part === "outer" ? OUTER_FINDER_SIZE : 3) * scale;
  if (geometry.loops) return gooeyPolygonCommand(geometry.loops, x, y, part === "outer" ? scale : factor);
  return scaledPolygonCommand(geometry, x, y, factor);
}

function gooeyPolygonCommand(loops, x, y, scale) {
  const position = ([px, py]) => `${formatNumber(x + px * scale, 5)} ${formatNumber(y + py * scale, 5)}`;
  return loops.map((loop) => `M${position(gooeyMidpoint(loop.at(-1), loop[0]))}${loop.map((point, index) => (
    `Q${position(point)} ${position(gooeyMidpoint(point, loop[(index + 1) % loop.length]))}`
  )).join("")}Z`).join("");
}

function gooeyMidpoint([ax, ay], [bx, by]) {
  return [(ax + bx) / 2, (ay + by) / 2];
}

function scaledPolygonCommand(geometry, x, y, factor) {
  const start = geometry.start.map((value, index) => (index === 0 ? x : y) + value * factor);
  let previous = geometry.start;
  return `M${start.map((value) => formatNumber(value, 6)).join(" ")}` + geometry.segments.map((segment) => {
    const delta = segment.end.map((value, index) => formatNumber((value - previous[index]) * factor, 6)).join(" ");
    previous = segment.end;
    if (segment.type === "line") return `l${delta}`;
    if (segment.type === "cubic") {
      // Absolute endpoints close curved figures exactly, avoiding tiny closing
      // edges that can change the stroke join between SVG and Canvas.
      const points = [...segment.controls, segment.end].map((point) => point.map((value, index) => formatNumber((index === 0 ? x : y) + value * factor, 6)).join(" ")).join(" ");
      return `C${points}`;
    }
    const radius = formatNumber(segment.radius * factor, 6);
    return `a${radius} ${radius} 0 0 1 ${delta}`;
  }).join("") + "Z";
}

function createModuleColorControls(source = elements.moduleColor, container = elements.moduleColorEditors, prefix = "moduleColor", label = "Module") {
  return Array.from({ length: 4 }, (_, index) => {
    const group = index === 0 ? source.closest(".color-input-wrap") : source.closest(".color-input-wrap").cloneNode(true);
    const input = group.querySelector('input[type="color"]');
    const hexInput = group.querySelector(".hex-input");
    if (index > 0) {
      input.id = `${prefix}${index + 1}`;
      hexInput.id = `${prefix}${index + 1}Value`;
      input.setAttribute("aria-label", `${label} color ${index + 1}`);
      hexInput.setAttribute("aria-label", `${label} hex color ${index + 1} value`);
      group.hidden = true;
      container.append(group);
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

function createIndividualCornerControls({
  prefix = "moduleCorner", container = elements.individualCornerControls, source = elements.moduleCornerRadius,
  randomSource = moduleRandomControls.get("moduleCornerRadius").group, label: owner = "Module", count = Number(elements.moduleSides.max),
} = {}) {
  return Array.from({ length: count }, (_, index) => {
    const id = `${prefix}${index + 1}`;
    const field = document.createElement("div");
    field.className = "individual-corner-field";
    field.hidden = true;
    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = `c${index + 1}`;
    const manual = source.closest(".range-control").cloneNode(true);
    manual.id = `${id}Control`;
    const input = manual.querySelector("input");
    input.id = id;
    input.disabled = true;
    input.setAttribute("aria-label", `${owner} corner ${index + 1} radius`);
    const output = manual.querySelector("output");
    output.id = `${id}Value`;
    output.setAttribute("for", id);
    field.append(label, manual);
    container.append(field);
    if (!randomSource) return { field, label, manual, input, output };
    const randomGroup = randomSource.cloneNode(true);
    randomGroup.id = `${id}RandomControl`;
    randomGroup.removeAttribute("data-module-random-range");
    randomGroup.setAttribute("aria-label", `Random ${owner.toLowerCase()} radius for corner ${index + 1}`);
    const random = getRandomRangeControls(randomGroup);
    for (const bound of ["min", "max"]) {
      random[bound].id = `${id}${bound === "min" ? "Min" : "Max"}`;
      random[bound].disabled = true;
      random[bound].setAttribute("aria-label", `${bound === "min" ? "Minimum" : "Maximum"} random ${owner.toLowerCase()} radius for corner ${index + 1}`);
      random[`${bound}Value`].setAttribute("for", random[bound].id);
    }
    field.append(randomGroup);
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
  const available = state.moduleStyle === "regular-polygon";
  const enabled = available && state.individualCorners;
  const count = getVisibleCornerCount();
  const random = state.moduleRandom.moduleCornerRadius;
  elements.individualCornersToggle.setAttribute("aria-pressed", String(state.individualCorners));
  elements.individualCornersToggle.hidden = !available;
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

function getModuleRangeProperties(style = state.moduleStyle) {
  if (style === "regular-polygon") return POLYGON_RANGE_PROPERTIES;
  if (style === "wobbly-polygon") return WOBBLY_RANGE_PROPERTIES;
  if (style === "blob") return BLOB_RANGE_PROPERTIES;
  if (style === "figure") return FIGURE_RANGE_PROPERTIES;
  if (style === "gooey") return GOOEY_RANGE_PROPERTIES;
  return [];
}

function hasRandomModuleProperties(style = state.moduleStyle) {
  return (style === "figure" && state.moduleFigures.length > 1)
    || getModuleRangeProperties(style).some(([key]) => state.moduleRandom[key]
      || (key === "moduleRotation" && state.rotationQuarterTurns)
      || state.moduleSteps[key]?.enabled);
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

function getSteppedModuleValue(key, row, column) {
  const { min, max } = MODULE_RANDOM_PROPERTIES[key];
  const { count } = state.moduleSteps[key];
  const step = Math.floor(randomModuleFraction(key, row, column) * count);
  return min + (max - min) * step / (count - 1);
}

function getModuleFigureForCell(row, column) {
  return state.moduleFigures[state.moduleFigures.length === 1 ? 0 : Math.floor(randomModuleFraction("moduleFigure", row, column) * state.moduleFigures.length)];
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
  const buildGeometry = style === "gooey" ? getGooeyModuleGeometry
    : style === "wobbly-polygon" ? getWobblyModuleGeometry
    : style === "figure" ? getFigureGeometry : style === "blob" ? getBlobGeometry : getRegularPolygonGeometry;
  if (!hasRandomModuleProperties(style)) {
    const geometry = buildGeometry(style === "figure" ? {
      moduleFigure: state.moduleFigures[0], moduleScale: state.moduleScale, moduleRotation: state.moduleRotation,
    } : state);
    return () => geometry;
  }
  const rangeProperties = getModuleRangeProperties(style);
  const individual = style === "regular-polygon" && state.individualCorners;
  const randomGooeyZones = style === "gooey" && state.moduleRandom.moduleGooeyDensity;
  const key = `${style}:${style === "figure" ? state.moduleFigures.join(",") : ""}:${state.moduleSeed}:` + rangeProperties.map(([property]) => (
    state.moduleSteps[property]?.enabled
      ? `steps:${state.moduleSteps[property].count}`
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
    const properties = { moduleFigure: style === "figure" ? getModuleFigureForCell(row, column) : state.moduleFigure };
    rangeProperties.forEach(([property]) => {
      if (individual && property === "moduleCornerRadius") return;
      properties[property] = state.moduleSteps[property]?.enabled
        ? getSteppedModuleValue(property, row, column)
        : property === "moduleRotation" && state.rotationQuarterTurns
        ? getQuarterTurnRotation(row, column)
        : (state.moduleRandom[property] ? randomModuleValue(property, row, column) : state[property]);
    });
    if (individual) {
      properties.moduleCornerRadii = Array.from({ length: properties.moduleSides }, (_, index) => (
        state.moduleRandom.moduleCornerRadius ? randomModuleValue("moduleCornerRadius", row, column, index) : state.cornerRadii[index].value
      ));
    }
    let variantKey = (style === "figure" ? `${properties.moduleFigure}:` : "")
      + rangeProperties.map(([property]) => property === "moduleCornerRadius" && individual ? properties.moduleCornerRadii.join(",") : properties[property]).join(":");
    if (randomGooeyZones) {
      const random = (zone) => randomModuleFraction("moduleGooeyZones", row, column, zone);
      const zones = selectGooeyPeripheralZones(properties.moduleGooeyDensity, random).sort((a, b) => a - b);
      properties.moduleGooeyPeripheralZones = zones;
      variantKey += `:${zones.join(",")}`;
    }
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

function getWobblyPolygonGeometry(properties, { wobble, edgeBend, cornerRadius = 0 }) {
  if (wobble === 0 && edgeBend === 0) return getRegularPolygonGeometry({ ...properties, moduleCornerRadius: cornerRadius });

  const base = getRegularPolygonGeometry({ ...properties, moduleScale: 100, moduleCornerRadius: 0 });
  const size = properties.moduleScale / 100;
  const maxShift = wobble / 100 * .35 / OUTER_FINDER_SIZE;
  const maxBend = edgeBend / 100 * .25 / OUTER_FINDER_SIZE;
  const vertices = [base.start, ...base.segments.map(({ end }) => end)].map(([x, y], index) => {
    const direction = Math.PI * 2 * randomModuleFraction("wobblyContour", index, 0);
    const shift = maxShift * (.4 + .6 * randomModuleFraction("wobblyContour", index, 1));
    return [x + shift * Math.cos(direction), y + shift * Math.sin(direction)];
  });
  if (maxBend === 0 && cornerRadius === 0) {
    const sides = vertices.slice(1).map((end) => ({ type: "line", end }));
    return fitModulePath(vertices[0], sides, size, { maxScale: size });
  }

  const trim = cornerRadius / 200;
  const span = 1 - 2 * trim;
  const edges = vertices.map(([x, y], index) => {
    const [nextX, nextY] = vertices[(index + 1) % vertices.length];
    const dx = nextX - x;
    const dy = nextY - y;
    const bend = maxBend * (2 * randomModuleFraction("wobblyContour", index, 2) - 1);
    const offset = 4 * bend / Math.hypot(dx, dy);
    const pointAt = (t) => [x + dx * t - dy * offset * t * (1 - t), y + dy * t + dx * offset * t * (1 - t)];
    const tangentAt = (t) => [dx - dy * offset * (1 - 2 * t), dy + dx * offset * (1 - 2 * t)];
    return {
      start: pointAt(trim), end: pointAt(1 - trim),
      incoming: tangentAt(trim), outgoing: tangentAt(1 - trim),
    };
  });
  const segments = [];
  edges.forEach((edge, index) => {
    if (span > 0) {
      segments.push(maxBend === 0 ? { type: "line", end: edge.end } : {
        type: "cubic", end: edge.end,
        controls: [
          edge.start.map((value, axis) => value + edge.incoming[axis] * span / 3),
          edge.end.map((value, axis) => value - edge.outgoing[axis] * span / 3),
        ],
      });
    }
    if (trim > 0) {
      const next = edges[(index + 1) % edges.length];
      const [ax, ay] = edge.outgoing;
      const [bx, by] = next.incoming;
      const cosine = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by));
      const halfCosine = Math.sqrt(Math.max(0, (1 + cosine) / 2));
      // The circular-arc handle factor keeps the join tangent to both trimmed edges.
      const handle = trim * 4 * halfCosine / (3 * (1 + halfCosine));
      segments.push({
        type: "cubic", end: next.start,
        controls: [
          edge.end.map((value, axis) => value + edge.outgoing[axis] * handle),
          next.start.map((value, axis) => value - next.incoming[axis] * handle),
        ],
      });
    }
  });
  return fitModulePath(edges[0].start, segments, size, { maxScale: size });
}

function getWobblyModuleGeometry(properties) {
  const geometry = getWobblyPolygonGeometry(properties, {
    wobble: properties.moduleWobble,
    edgeBend: properties.moduleEdgeBend,
    cornerRadius: properties.moduleCornerRadius,
  });
  geometry.pathTail ??= modulePathTail(geometry);
  return geometry;
}

function moduleGeometryCommand(x, y, geometry) {
  return `M${formatNumber(x + geometry.start[0], 6)} ${formatNumber(y + geometry.start[1], 6)}${geometry.pathTail}`;
}

function supportsModuleMerge(style) {
  return style === "regular-polygon" || style === "wobbly-polygon" || style === "blob" || style === "gooey";
}

function getModuleMergeKey(style = state.moduleStyle) {
  return style === "gooey" ? "moduleGooeyMerge" : "moduleMerge";
}

function mergedModulesPath(code, quietZone, style) {
  const count = code.getModuleCount();
  const geometries = new Array(count * count);
  const commands = [];
  const exclusionBox = state.clearLogoArea ? getLogoBox(code, quietZone) : null;
  const resolveGeometry = getModuleGeometryResolver(style);
  const mergeMode = state[getModuleMergeKey(style)];
  const squareGroups = mergeMode === "square-groups";
  const horizontal = squareGroups || mergeMode === "all" || mergeMode === "horizontal";
  const vertical = squareGroups || mergeMode === "all" || mergeMode === "vertical";
  const fusedCells = style === "gooey" && (horizontal || vertical) ? new Uint8Array(count * count) : null;
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (!shouldRenderModule(code, row, column, quietZone, null, style)) continue;
      const geometry = resolveGeometry(row, column);
      if (moduleIntersectsBox(row, column, quietZone, exclusionBox, style, geometry)) continue;
      geometries[row * count + column] = geometry;
      if (!fusedCells) commands.push(moduleGeometryCommand(column + quietZone, row + quietZone, geometry));
    }
  }
  if (!horizontal && !vertical) return commands.join("");
  const randomLinkSize = state.moduleRandom.moduleGooeyLinkBallSize;
  const fixedLinkSize = state.moduleGooeyLinkBallSize;
  const linkDensity = state.moduleGooeyLinkDensity;
  const linkRange = state.moduleRandomRanges.moduleGooeyLinkBallSize;
  const linkSizeSettings = randomLinkSize ? `${linkRange.min}-${linkRange.max}` : fixedLinkSize;
  const linkSettings = `${linkDensity}:${linkSizeSettings}`;
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
    if (!bridge) return false;
    const x = column + quietZone;
    const y = row + quietZone;
    const bounds = bridge.bounds;
    if (rectangleIntersectsBox(x + bounds.x, y + bounds.y, bounds.width, bounds.height, exclusionBox)) return false;
    commands.push(`M${formatNumber(x + bridge.start[0], 6)} ${formatNumber(y + bridge.start[1], 6)}${bridge.pathTail}`);
    return true;
  };
  const bridgeFor = (first, second, direction, row, column) => {
    if (style === "gooey") {
      if (first.gooeyBridges?.settings !== linkSettings) {
        first.gooeyBridges = { settings: linkSettings, pairs: new WeakMap() };
      }
      const cache = first.gooeyBridges.pairs;
      let bridges = cache.get(second);
      if (!bridges) cache.set(second, bridges = {});
      const toRight = direction === "horizontal";
      // Hash the edge midpoint on a grid with twice the resolution of the modules.
      const linkSize = randomLinkSize
        ? randomModuleValue("moduleGooeyLinkBallSize", 2 * row + Number(!toRight), 2 * column + Number(toRight))
        : fixedLinkSize;
      const key = `${direction}:${linkSize}`;
      return bridges[key] ??= getGooeyContourGeometry(traceGooeyModulePair(first, second, direction, linkSize, linkDensity));
    }
    if (first === second && first.bridges && Object.hasOwn(first.bridges, direction)) return first.bridges[direction];
    const a = first.supportPoints;
    const b = second.supportPoints;
    const vertices = direction === "horizontal"
      ? [a.top, [b.top[0] + 1, b.top[1]], [b.bottom[0] + 1, b.bottom[1]], a.bottom]
      : [a.left, a.right, [b.right[0], b.right[1] + 1], [b.left[0], b.left[1] + 1]];
    const bridge = polygonBridgeGeometry(vertices);
    if (first === second) (first.bridges ??= {})[direction] = bridge;
    return bridge;
  };
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      const index = row * count + column;
      const geometry = geometries[index];
      if (!geometry) continue;
      const right = geometries[index + 1];
      const down = geometries[index + count];
      if (horizontal && column + 1 < count && right && (!squareGroups || (squareConnections[index] & 1))) {
        const merged = appendBridge(row, column, bridgeFor(geometry, right, "horizontal", row, column));
        if (fusedCells && merged) fusedCells[index] = fusedCells[index + 1] = 1;
      }
      if (vertical && row + 1 < count && down && (!squareGroups || (squareConnections[index] & 2))) {
        const merged = appendBridge(row, column, bridgeFor(geometry, down, "vertical", row, column));
        if (fusedCells && merged) fusedCells[index] = fusedCells[index + count] = 1;
      }
    }
  }
  if (fusedCells) geometries.forEach((geometry, index) => {
    if (geometry && !fusedCells[index]) {
      commands.push(moduleGeometryCommand(index % count + quietZone, Math.floor(index / count) + quietZone, geometry));
    }
  });
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
  const template = fitModulePath(start, segments, 1);
  figureTemplateCache.set(key, template);
  return template;
}

function fitModulePath(start, segments, size, { maxScale = Infinity } = {}) {
  const points = [start, ...segments.map((segment) => segment.end)];
  let previous = start;
  // The extrema of each cubic keep the rendered contour within its cell and
  // give Merge points on the contour itself.
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
  const extreme = (axis, direction) => points.reduce((best, point) => {
    const distance = (point[axis] - best[axis]) * direction;
    return distance > 0 || (distance === 0 && point[1 - axis] < best[1 - axis]) ? point : best;
  });
  const leftPoint = extreme(0, -1);
  const rightPoint = extreme(0, 1);
  const topPoint = extreme(1, -1);
  const bottomPoint = extreme(1, 1);
  const left = leftPoint[0];
  const right = rightPoint[0];
  const top = topPoint[1];
  const bottom = bottomPoint[1];
  const factor = Math.min(maxScale, size / Math.max(right - left, bottom - top));
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  const normalize = ([x, y]) => [.5 + (x - centerX) * factor, .5 + (y - centerY) * factor];
  return {
    start: normalize(start),
    segments: segments.map((segment) => ({
      ...segment, end: normalize(segment.end),
      ...(segment.controls ? { controls: segment.controls.map(normalize) } : {}),
    })),
    bounds: { x: .5 - (right - left) * factor / 2, y: .5 - (bottom - top) * factor / 2, width: (right - left) * factor, height: (bottom - top) * factor },
    supportPoints: { left: normalize(leftPoint), right: normalize(rightPoint), top: normalize(topPoint), bottom: normalize(bottomPoint) },
  };
}

function getBlobGeometry(properties) {
  const sides = properties.moduleSides;
  const noise = properties.moduleNoise / 100;
  const tension = properties.moduleSmooth / 100 * 1.34 / 6;
  const turn = Math.PI * 2 / sides;
  const initialAngle = -Math.PI / 2 + (sides % 2 === 0 ? Math.PI / sides : 0) + properties.moduleRotation % 360 * Math.PI / 180;
  const samples = Array.from({ length: sides }, (_, index) => 2 * randomModuleFraction("moduleBlobContour", 0, 0, index) - 1);
  const radii = samples.map((sample, index) => {
    // Blend neighboring samples for a softer contour and keep each point away from the center.
    const softened = sample * .58 + (samples.at(index - 1) + samples[(index + 1) % sides]) * .21;
    return Math.max(.35, 1 + softened * noise);
  });
  const points = radii.map((radius, index) => {
    const angle = initialAngle + index * turn;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
  let segments;
  if (tension === 0) {
    segments = points.slice(1).map((end) => ({ type: "line", end }));
  } else {
    // Keep each handle on its own side of the angle bisector so adjacent curves cannot cross.
    const neighborWeight = 1 + 2 * Math.cos(turn);
    const handles = radii.map((radius, index) => {
      const next = (index + 1) % sides;
      const previousRadius = radii.at(index - 1);
      const nextRadius = radii[next];
      const reach = Math.max(nextRadius + neighborWeight * previousRadius, previousRadius + neighborWeight * nextRadius);
      const amount = Math.min(tension, radius / reach);
      const previous = points.at(index - 1);
      return points[next].map((value, axis) => (value - previous[axis]) * amount);
    });
    segments = points.map((point, index) => {
      const next = (index + 1) % sides;
      const end = points[next];
      const first = point.map((value, axis) => value + handles[index][axis]);
      const second = end.map((value, axis) => value - handles[next][axis]);
      return { type: "cubic", end, controls: [first, second] };
    });
  }
  const geometry = fitModulePath(points[0], segments, properties.moduleScale / 100);
  geometry.pathTail = modulePathTail(geometry);
  return geometry;
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
  geometry.pathTail = modulePathTail(geometry);
  figureGeometryCache = { key, geometry };
  return geometry;
}

function getGooeyModuleGeometry(properties = state) {
  const { moduleGooeyDensity: density, moduleGooeyBallSize: ballSize, moduleGooeyBlendStrength: blendStrength } = properties;
  const peripheralZones = properties.moduleGooeyPeripheralZones;
  const key = `${state.moduleSeed}:${density}:${ballSize}:${blendStrength}:${peripheralZones?.join(",") ?? ""}`;
  if (gooeyModuleCache?.key === key) return gooeyModuleCache.geometry;

  const random = (zone) => randomModuleFraction("moduleGooeyZones", 0, zone);
  const { contours, fieldAt, blend } = createGooeyGridField({ density, ballSize, blendStrength }, random, { peripheralZones });
  const geometry = { ...getGooeyContourGeometry(contours), fieldAt, blend };
  gooeyModuleCache = { key, geometry };
  return geometry;
}

function getGooeyContourGeometry(contours) {
  const loops = contours.map((loop) => simplifyGooeyModuleLoop(loop));
  const loopStart = (loop) => gooeyMidpoint(loop.at(-1), loop[0]);
  const start = loopStart(loops[0]);
  let previous = start;
  const relative = ([x, y]) => `${formatNumber(x - previous[0], 4)} ${formatNumber(y - previous[1], 4)}`;
  const pathTail = loops.map((loop, loopIndex) => {
    const first = loopStart(loop);
    const move = loopIndex ? `m${relative(first)}` : "";
    previous = first;
    const curves = loop.map((point, index) => {
      const end = gooeyMidpoint(point, loop[(index + 1) % loop.length]);
      const curve = `q${relative(point)} ${relative(end)}`;
      previous = end;
      return curve;
    }).join("");
    return move + curves + "Z";
  }).join("");

  const points = loops.flat();
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { start, pathTail, bounds: { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y } };
}

function modulePathTail({ start, segments }, precision = 6) {
  let previous = start;
  return segments.map((segment) => {
    const coordinates = [...(segment.controls || []), segment.end].map(([x, y]) => (
      `${formatNumber(x - previous[0], precision)} ${formatNumber(y - previous[1], precision)}`
    )).join(" ");
    previous = segment.end;
    return `${segment.type === "cubic" ? "c" : "l"}${coordinates}`;
  }).join("") + "Z";
}

function moduleCommand(x, y, style) {
  if (style === "regular-polygon") return moduleGeometryCommand(x, y, getRegularPolygonGeometry());
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

function getFinderModulePart(row, column, count, markerIndex = getFinderPatternIndex(row, column, count)) {
  if (markerIndex < 0) return null;
  const localRow = row - (markerIndex === 2 ? count - 7 : 0);
  const localColumn = column - (markerIndex === 1 ? count - 7 : 0);
  return localRow >= 2 && localRow <= 4 && localColumn >= 2 && localColumn <= 4 ? "inner" : "outer";
}

function isCircuitStyle(style = state.moduleStyle) {
  return ["circuit", "circuit-horizontal", "circuit-vertical"].includes(style);
}

function getCircuitWidth() {
  return getModuleScale();
}

function moduleIntersectsBox(row, column, quietZone, box, style = state.moduleStyle, geometry = null) {
  if (!box) return false;
  if (supportsModuleMerge(style) || style === "figure") {
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
  const part = getFinderModulePart(row, column, count, markerIndex);
  return code.isDark(row, column)
    && (part === null || getFinderSettings(markerIndex)[`${part}AsModules`])
    && (state.alignmentAsModules || code.getSymbolLayout().functionModules[row * count + column] !== 2)
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
  if (supportsModuleMerge(style)) return mergedModulesPath(code, quietZone, style);
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
        ? moduleGeometryCommand(x, y, geometry)
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

function getOuterMarkerOutset(finder) {
  return !finder.outerAsModules && finder.outerMarkerStyle === "gooey-polygon" ? GOOEY_OUTSET : 0;
}

function getShapeRendering() {
  const squareMarkers = [0, 1, 2].every((markerIndex) => {
    const settings = getFinderSettings(markerIndex);
    return ["outer", "inner"].every((part) => settings[`${part}AsModules`]
      || (settings[`${part}MarkerStyle`] === "square" && (part === "inner" || !hasOuterMarkerClip(markerIndex))));
  });
  return state.moduleStyle === "square" && squareMarkers && state.alignmentAsModules ? "crispEdges" : "geometricPrecision";
}

function outerMarkerClipCommand(x, y, scale = 1, markerIndex = state.selectedFinderPattern) {
  const finder = getFinderSettings(markerIndex);
  const size = OUTER_FINDER_SIZE * scale;
  const third = size / 3;
  const outset = getOuterMarkerOutset(finder) * scale;
  const nearX = formatNumber(x + third, 4);
  const farX = formatNumber(x + 2 * third, 4);
  const nearY = formatNumber(y + third, 4);
  const farY = formatNumber(y + 2 * third, 4);
  const left = formatNumber(x - outset, 4);
  const right = formatNumber(x + size + outset, 4);
  const top = formatNumber(y - outset, 4);
  const bottom = formatNumber(y + size + outset, 4);
  if (finder.outerMarkerCornersOnly) {
    return `M${left} ${top}H${nearX}V${nearY}H${left}Z`
      + `M${farX} ${top}H${right}V${nearY}H${farX}Z`
      + `M${left} ${farY}H${nearX}V${bottom}H${left}Z`
      + `M${farX} ${farY}H${right}V${bottom}H${farX}Z`;
  }
  return `M${nearX} ${top}H${farX}V${nearY}H${right}V${farY}H${farX}V${bottom}H${nearX}V${farY}H${left}V${nearY}H${nearX}Z`;
}

function getMarkerClips(code) {
  return markerPositions(code).flatMap(([x, y], markerIndex) => {
    const finder = getFinderSettings(markerIndex);
    if (finder.outerAsModules) return [];
    const cuts = hasOuterMarkerClip(markerIndex);
    const cutId = `outer-marker-cut-${markerIndex}`;
    const clips = cuts ? [{ id: cutId, d: outerMarkerClipCommand(x, y, 1, markerIndex) }] : [];
    if (finder.outerMarkerStyle !== "gooey-polygon") {
      clips.push({ id: `outer-marker-shape-${markerIndex}`, d: finderPolygonCommand(x, y, markerIndex), ...(cuts ? { clip: cutId } : {}) });
    }
    return clips;
  });
}

function getMarkerShape(x, y, markerIndex, part, scale = 1) {
  const { geometry, properties, color } = getFinderPolygon(markerIndex, part);
  if (part === "outer") {
    if (geometry.loops) {
      return { tag: "path", attributes: {
        d: gooeyPolygonCommand(geometry.loops, x, y, scale), fill: color, "fill-rule": "evenodd",
        ...(hasOuterMarkerClip(markerIndex) ? { "clip-path": `url(#outer-marker-cut-${markerIndex})` } : {}),
      } };
    }
    return { tag: "path", attributes: {
      d: finderPolygonCommand(x, y, markerIndex, part, scale), fill: "none", stroke: color,
      "stroke-width": 2 * properties.moduleScale / 100 * scale,
      "stroke-linejoin": "miter", "stroke-miterlimit": 10,
      "clip-path": `url(#outer-marker-shape-${markerIndex})`,
    } };
  }
  return { tag: "path", attributes: {
    d: finderPolygonCommand(x + 2 * scale, y + 2 * scale, markerIndex, part, scale), fill: color,
    ...(geometry.loops ? { "fill-rule": "evenodd" } : {}),
  } };
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
    clips.forEach(({ id, d, clip: cutClip }) => {
      const clip = setAttributes(document.createElementNS(SVG_NAMESPACE, "clipPath"), {
        id, clipPathUnits: "userSpaceOnUse",
      });
      clip.append(setAttributes(document.createElementNS(SVG_NAMESPACE, "path"), { d, ...(cutClip ? { "clip-path": `url(#${cutClip})` } : {}) }));
      definitions.append(clip);
    });
    svg.append(definitions);
  }
  markerPositions(code).forEach(([x, y], markerIndex) => {
    ["outer", "inner"].forEach((part) => {
      if (getFinderSettings(markerIndex)[`${part}AsModules`]) return;
      const { tag, attributes } = getMarkerShape(x, y, markerIndex, part);
      svg.append(setAttributes(document.createElementNS(SVG_NAMESPACE, tag), attributes));
    });
  });
}

function getLogoBox(code, quietZone = QUIET_ZONE) {
  return getLogoAreaBox(code.getModuleCount(), state.logoSize, state.logoAspectRatio, quietZone);
}

function syncLogoSize(code) {
  const maximum = code ? getLogoAreaLimit(code.getSymbolLayout(), state.logoAspectRatio) : 30;
  const minimum = Math.min(10, maximum);
  state.logoSize = Math.max(minimum, Math.min(maximum, Math.round(state.logoSize)));
  elements.logoSize.min = minimum;
  elements.logoSize.max = maximum;
  elements.logoSize.value = state.logoSize;
  elements.logoSize.title = `Maximum: ${maximum}%`;
  elements.logoSize.setAttribute("aria-valuetext", `${state.logoSize}%`);
  elements.logoSizeValue.textContent = `${state.logoSize}%`;
}

function appendSvgLogo(svg, code) {
  if (!state.logoDataUrl) return;
  const box = getLogoBox(code);
  const image = setAttributes(document.createElementNS(SVG_NAMESPACE, "image"), {
    x: formatNumber(box.x, 6),
    y: formatNumber(box.y, 6),
    width: formatNumber(box.width, 6),
    height: formatNumber(box.height, 6),
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

function getAlignmentPatterns(code) {
  const count = code.getModuleCount();
  if (alignmentPositionsCache.has(count)) return alignmentPositionsCache.get(count);
  const positions = getAlignmentPatternPositions((count - 17) / 4);
  const patterns = [];
  for (const row of positions) {
    for (const column of positions) {
      if ((row === 6 && (column === 6 || column === count - 7)) || (row === count - 7 && column === 6)) continue;
      patterns.push({ row, column, index: patterns.length });
    }
  }
  alignmentPositionsCache.set(count, patterns);
  return patterns;
}

function getAlignmentColorCount(part, code) {
  return code && code.getModuleCount() >= 45 ? state.alignment[`${part}ColorCount`] : 1;
}

function getAlignmentArtwork(code, quietZone = QUIET_ZONE) {
  const artwork = { clips: [], shapes: [], clearClip: null };
  if (state.alignmentAsModules) return artwork;
  const patterns = getAlignmentPatterns(code);
  if (!patterns.length) return artwork;
  const polygons = Object.fromEntries(["outer", "inner"].map((part) => {
    const style = state.alignment[`${part}MarkerStyle`];
    const settings = state.alignment[`${part}Polygon`];
    const key = JSON.stringify([style, settings]);
    if (alignmentPolygonCache.get(part)?.key !== key) {
      alignmentPolygonCache.set(part, { key, value: getPatternPolygon(style, settings) });
    }
    return [part, alignmentPolygonCache.get(part).value];
  }));
  for (const pattern of patterns) {
    for (const part of ["outer", "inner"]) {
      const { geometry, properties } = polygons[part];
      const title = part === "outer" ? "Outer" : "Inner";
      const count = getAlignmentColorCount(part, code);
      const colorIndex = count === 1 ? 0 : Math.floor(randomModuleFraction(`alignment${title}Color`, pattern.row, pattern.column) * count);
      const color = state.alignment[`${part}Colors`][colorIndex];
      const inset = part === "outer" ? 2 : 0;
      const d = scaledPolygonCommand(geometry, quietZone + pattern.column - inset, quietZone + pattern.row - inset, part === "outer" ? 5 : 1);
      const attributes = { d, "data-alignment-pattern": pattern.index, "data-part": part };
      if (part === "outer") {
        const id = `alignment-outer-shape-${pattern.index}`;
        artwork.clips.push({ id, d });
        Object.assign(attributes, {
          fill: "none", stroke: color, "stroke-width": 2 * properties.moduleScale / 100,
          "stroke-linejoin": "miter", "stroke-miterlimit": 10, "clip-path": `url(#${id})`,
        });
      } else attributes.fill = color;
      artwork.shapes.push(attributes);
    }
  }
  if (state.clearLogoArea) {
    const box = getLogoBox(code, quietZone);
    const dimension = code.getModuleCount() + quietZone * 2;
    const d = `M0 0h${dimension}v${dimension}H0Z` +
      `M${formatNumber(box.x, 6)} ${formatNumber(box.y, 6)}h${formatNumber(box.width, 6)}v${formatNumber(box.height, 6)}h-${formatNumber(box.width, 6)}Z`;
    artwork.clearClip = "alignment-logo-clear";
    artwork.clips.push({ id: artwork.clearClip, d, "clip-rule": "evenodd" });
  }
  return artwork;
}

function appendSvgAlignmentPatterns(svg, code) {
  const artwork = getAlignmentArtwork(code);
  if (!artwork.shapes.length) return;
  const definitions = document.createElementNS(SVG_NAMESPACE, "defs");
  artwork.clips.forEach(({ id, ...attributes }) => {
    const clip = setAttributes(document.createElementNS(SVG_NAMESPACE, "clipPath"), { id, clipPathUnits: "userSpaceOnUse" });
    clip.append(setAttributes(document.createElementNS(SVG_NAMESPACE, "path"), attributes));
    definitions.append(clip);
  });
  const layer = setAttributes(document.createElementNS(SVG_NAMESPACE, "g"), {
    class: "alignment-patterns", ...(artwork.clearClip ? { "clip-path": `url(#${artwork.clearClip})` } : {}),
  });
  artwork.shapes.forEach((attributes) => layer.append(setAttributes(document.createElementNS(SVG_NAMESPACE, "path"), attributes)));
  svg.append(definitions, layer);
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

  for (const { row, column } of getAlignmentPatterns(code)) {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) mark(row + dy, column + dx, types.alignment);
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

  // The encoder interleaves all data codewords first, then correction codewords.
  // Its map includes white bits too, and excludes function/remainder modules.
  const layout = code.getSymbolLayout();
  const dataCodewords = layout.blocks.reduce((total, block) => total + block.dataCount, 0);
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (layout.moduleCodewords[row * count + column] >= dataCodewords) {
        mark(row, column, types["error-correction"]);
      }
    }
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
    x: formatNumber(box.x, 6),
    y: formatNumber(box.y, 6),
    width: formatNumber(box.width, 6),
    height: formatNumber(box.height, 6),
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
  syncAlignmentControls();
  updateStressTestPreview();
}

function updateStressTestPreview() {
  const tests = state.stressTests;
  elements.stressTests.forEach((button) => button.setAttribute("aria-pressed", String(tests[button.dataset.stressTest])));
  const filters = [];
  if (tests.blur) filters.push("blur(1.2px)");
  if (tests.contrast) filters.push("contrast(0.55)");
  if (tests.lowLight) filters.push("brightness(0.6)");
  const active = Boolean(state.qr && Object.values(tests).some(Boolean));
  elements.previewSurface.classList.toggle("is-stressed", active);
  elements.previewSurface.style.filter = active ? filters.join(" ") : "";
  elements.stressNoise.hidden = !state.qr || !tests.noise;
  elements.stressGlare.hidden = !state.qr || !tests.glare;
}

function resetSection(section) {
  if (section === "module") {
    Object.assign(state, structuredClone(sectionDefaults.module));
  } else if (section === "finders") {
    Object.assign(state, structuredClone(sectionDefaults.finders), {
      editFindersIndividually: false, selectedFinderPattern: 0, finderPatterns: null,
    });
  } else if (section === "alignments") {
    state.alignmentAsModules = true;
    state.alignment = createAlignmentSettings();
  } else if (section === "background") {
    state.backgroundColor = defaults.backgroundColor;
  } else if (section === "logo") {
    clearLogo(false);
    state.logoSize = defaults.logoSize;
    state.showLogoArea = defaults.showLogoArea;
    state.clearLogoArea = defaults.clearLogoArea;
    elements.clearLogoArea.checked = state.clearLogoArea;
  } else if (section === "stress") {
    state.stressTests = { ...STRESS_TEST_DEFAULTS };
    updateStressTestPreview();
    return;
  }
  render();
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
  elements.finderModulesOptions.forEach((button) => {
    const part = button.dataset.finderModules;
    const asModules = finderSettings[`${part}AsModules`];
    button.setAttribute("aria-pressed", String(asModules));
    button.setAttribute("aria-expanded", String(!asModules));
    elements[`${part}MarkerProperties`].hidden = asModules;
  });
  updateEncodingMode(qrMode);
  for (const part of ["outer", "inner"]) {
    elements[`${part}MarkerStyle`].value = finderSettings[`${part}MarkerStyle`];
    elements[`${part}MarkerColor`].value = finderSettings[`${part}MarkerColor`];
    elements[`${part}MarkerColorValue`].value = finderSettings[`${part}MarkerColor`].toUpperCase();
  }
  elements.cutOuterMarkerCorners.setAttribute("aria-pressed", String(finderSettings.cutOuterMarkerCorners));
  elements.outerMarkerCornersOnly.setAttribute("aria-pressed", String(finderSettings.outerMarkerCornersOnly));
  elements.innerPolygonProperties.hidden = finderSettings.innerMarkerStyle === "gooey";
  finderCustomStyleControls.forEach(({ part, key, container, style, controls }) => {
    const visible = finderSettings[`${part}MarkerStyle`] === style && !finderSettings[`${part}AsModules`];
    container.hidden = !visible;
    controls.forEach(({ key: property, input, output }) => {
      const value = finderSettings[key][property];
      input.disabled = !visible;
      input.value = value;
      output.textContent = property === "density" ? String(value) : `${value}%`;
    });
  });
  syncFinderPolygonControls("outer", finderSettings);
  syncFinderPolygonControls("inner", finderSettings);
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
  const showModuleGooey = state.moduleStyle === "gooey";
  const showModuleWobbly = state.moduleStyle === "wobbly-polygon";
  const showModulePolygon = state.moduleStyle === "regular-polygon";
  const mergeMode = state[getModuleMergeKey()];
  const showGooeyLinks = showModuleGooey && mergeMode !== "none";
  elements.moduleSizeField.hidden = showModuleGooey;
  elements.gooeyProperties.forEach((field) => { field.hidden = !showModuleGooey; });
  elements.wobblyProperties.forEach((field) => { field.hidden = !showModuleWobbly; });
  elements.moduleWobble.disabled = elements.moduleEdgeBend.disabled = !showModuleWobbly;
  elements.moduleGooeyLinkBallSize.closest(".range-field").hidden = !showGooeyLinks;
  elements.moduleGooeyLinkDensity.closest(".range-field").hidden = !showGooeyLinks;
  elements.moduleGooeyLinkDensity.disabled = !showGooeyLinks;
  const supportsMerge = supportsModuleMerge(state.moduleStyle);
  const randomProperties = getModuleRangeProperties();
  elements.moduleSides.closest(".range-field").hidden = !supportsMerge || showModuleGooey;
  elements.polygonProperties.forEach((field) => { field.hidden = !showModulePolygon && !showModuleWobbly; });
  elements.blobProperties.forEach((field) => { field.hidden = state.moduleStyle !== "blob"; });
  elements.shapeProperties.forEach((field) => { field.hidden = showModuleGooey || (!supportsMerge && state.moduleStyle !== "figure"); });
  elements.moduleMergeField.hidden = !supportsMerge;
  elements.figureProperties.forEach((field) => { field.hidden = state.moduleStyle !== "figure"; });
  elements.moduleFigureOptions.forEach((button) => {
    button.setAttribute("aria-pressed", String(state.moduleFigures.includes(button.dataset.moduleFigure)));
  });
  elements.moduleRandomOptions.forEach((button) => {
    const key = button.dataset.moduleRandom;
    const supportsRandom = key === "moduleGooeyLinkBallSize"
      ? showGooeyLinks : randomProperties.some(([property]) => property === key);
    const isRandom = supportsRandom && state.moduleRandom[key];
    const individual = key === "moduleCornerRadius" && showModulePolygon && state.individualCorners;
    const steps = state.moduleSteps[key];
    const stepsControls = moduleStepsControls.get(key);
    const discrete = supportsRandom && Boolean(steps?.enabled);
    button.hidden = !supportsRandom;
    button.setAttribute("aria-pressed", String(state.moduleRandom[key]));
    elements[key].closest(".range-control").hidden = isRandom || individual || discrete;
    elements[key].disabled = !supportsRandom || isRandom || individual || discrete;
    const controls = moduleRandomControls.get(key);
    controls.group.hidden = !isRandom || individual || discrete;
    controls.min.disabled = !isRandom || individual || discrete;
    controls.max.disabled = !isRandom || individual || discrete;
    button.previousElementSibling.htmlFor = discrete ? stepsControls.input.id : individual
      ? (isRandom ? individualCornerControls[0].random.min.id : individualCornerControls[0].input.id)
      : (isRandom ? controls.min.id : key);
    if (stepsControls) {
      stepsControls.button.hidden = !supportsRandom;
      stepsControls.button.setAttribute("aria-pressed", String(steps.enabled));
      stepsControls.group.hidden = !discrete;
      stepsControls.input.disabled = !discrete;
      stepsControls.input.value = steps.count;
      stepsControls.input.setAttribute("aria-valuetext", `${steps.count} ${key === "moduleScale" ? "sizes" : "steps"}`);
      stepsControls.output.textContent = String(steps.count);
    }
  });
  syncIndividualCornerControls();
  elements.rotationQuarterTurnsToggle.setAttribute("aria-pressed", String(state.rotationQuarterTurns));
  elements.moduleRotation.setAttribute("aria-label", state.rotationQuarterTurns ? "Initial module rotation for random 90° steps" : "Module rotation");
  elements.moduleSeed.value = state.moduleSeed;
  elements.moduleSeedValue.textContent = String(state.moduleSeed);
  elements.moduleMergeOptions.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.moduleMerge === mergeMode));
  });
  ALL_MODULE_RANGE_PROPERTIES.forEach(([key, suffix]) => {
    elements[key].value = state[key];
    elements[`${key}Value`].textContent = `${state[key]}${suffix}`;
    const controls = moduleRandomControls.get(key);
    if (!controls) return;
    const range = state.moduleRandomRanges[key];
    const limits = MODULE_RANDOM_PROPERTIES[key];
    syncRandomRangeControls(controls, range, limits, suffix);
  });
  const transparentBackground = state.backgroundColor === "transparent";
  elements.backgroundColor.parentElement.toggleAttribute("data-transparent", transparentBackground);
  if (!transparentBackground) elements.backgroundColor.value = state.backgroundColor;
  elements.backgroundColorValue.value = transparentBackground ? "Transparent" : state.backgroundColor.toUpperCase();
  if (!trimmedValue) {
    state.qr = null;
    state.encodedUrl = "";
    syncLogoSize(null);
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
    syncLogoSize(null);
    setValidation("The content is too long to generate a QR code.");
    updateVersionInfo(null);
    clearPreview();
    elements.download.disabled = true;
    return;
  }

  syncLogoSize(state.qr);
  syncAlignmentControls();
  setValidation();
  updateVersionInfo(state.qr, trimmedValue, qrMode);
  const dimension = state.qr.getModuleCount() + QUIET_ZONE * 2;
  elements.canvasArea.style.setProperty("--checkerboard-size", `calc(200% / ${dimension})`);
  elements.preview.replaceChildren();
  if (!transparentBackground) {
    elements.preview.append(setAttributes(document.createElementNS(SVG_NAMESPACE, "rect"), {
      width: dimension, height: dimension, fill: state.backgroundColor,
    }));
  }
  appendSvgModules(elements.preview, state.qr);
  appendSvgMarkers(elements.preview, state.qr);
  appendSvgAlignmentPatterns(elements.preview, state.qr);
  appendSvgLogo(elements.preview, state.qr);
  appendSvgQrStructureGuide(elements.preview, state.qr);
  updateStressTestPreview();
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
  const revision = ++logoLoadRevision;
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
    if (revision !== logoLoadRevision) return;
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
    if (revision === logoLoadRevision) setLogoError(error.message || "The SVG could not be loaded.");
  }
}

function clearLogo(renderAfter = true) {
  logoLoadRevision += 1;
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

finderCustomStyleControls.forEach(({ key, controls }) => {
  controls.forEach(({ key: property, input }) => {
    input.addEventListener("input", () => {
      getFinderSettings()[key][property] = Number(input.value);
      render();
    });
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
      structuredClone(Object.fromEntries(FINDER_PROPERTIES.map((key) => [key, state[key]])))
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

elements.finderModulesOptions.forEach((button) => {
  button.addEventListener("click", () => {
    const settings = getFinderSettings();
    const key = `${button.dataset.finderModules}AsModules`;
    settings[key] = !settings[key];
    render();
  });
});

elements.alignmentAsModules.addEventListener("click", () => {
  state.alignmentAsModules = !state.alignmentAsModules;
  render();
});

ALL_MODULE_RANGE_PROPERTIES.forEach(([key]) => {
  elements[key].addEventListener("input", () => {
    state[key] = Number(elements[key].value);
    render();
  });
});

elements.moduleRandomOptions.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.moduleRandom;
    if (key === "moduleRotation") state.rotationQuarterTurns = false;
    if (state.moduleSteps[key]) state.moduleSteps[key].enabled = false;
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

moduleStepsControls.forEach(({ button, input }, key) => {
  button.addEventListener("click", () => {
    const steps = state.moduleSteps[key];
    steps.enabled = !steps.enabled;
    state.moduleRandom[key] = false;
    render();
  });
  input.addEventListener("input", () => {
    state.moduleSteps[key].count = Number(input.value);
    render();
  });
});

elements.moduleColorCount.addEventListener("input", () => {
  state.moduleColorCount = Number(elements.moduleColorCount.value);
  render();
});

elements.moduleFigureOptions.forEach((button) => {
  const figure = button.dataset.moduleFigure;
  const geometry = getFigureGeometry({ moduleFigure: figure, moduleScale: 80, moduleRotation: 0 });
  button.querySelector("path").setAttribute("d", moduleGeometryCommand(0, 0, geometry));
  button.addEventListener("click", () => {
    const selected = new Set(state.moduleFigures);
    if (selected.has(figure)) {
      if (selected.size === 1) return;
      selected.delete(figure);
    } else {
      selected.add(figure);
    }
    state.moduleFigures = MODULE_FIGURES.filter((value) => selected.has(value));
    state.moduleFigure = state.moduleFigures[0];
    render();
  });
});

[...Object.values(finderPolygonControls), ...Object.values(alignmentControls).map((controls) => controls.polygon)].forEach((editor) => {
  editor.figures.forEach((button) => {
    const geometry = getFigureGeometry({ moduleFigure: button.dataset.finderFigure, moduleScale: 80, moduleRotation: 0 });
    button.querySelector("path").setAttribute("d", moduleGeometryCommand(0, 0, geometry));
  });
});

function bindRandomRangeControls(controls, key, cornerIndex = null, { getRange = () => getModuleRandomRange(key, cornerIndex), setBound = (bound, value) => setRandomModuleBound(key, bound, value, cornerIndex) } = {}) {
  for (const bound of ["min", "max"]) {
    controls[bound].addEventListener("input", () => {
      setBound(bound, Number(controls[bound].value));
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
    const range = getRange();
    const bound = value < (range.min + range.max) / 2 ? "min" : "max";
    event.preventDefault();
    railPointer = { id: event.pointerId, bound };
    controls[bound].focus({ preventScroll: true });
    controls.track.setPointerCapture(event.pointerId);
    setBound(bound, value);
  });
  controls.track.addEventListener("pointermove", (event) => {
    if (railPointer?.id !== event.pointerId) return;
    setBound(railPointer.bound, valueAtPointer(event));
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
    const key = getModuleMergeKey();
    if (state[key] === merge) return;
    state[key] = merge;
    render();
  });
});

[
  ["cutOuterMarkerCorners", "outerMarkerCornersOnly"],
  ["outerMarkerCornersOnly", "cutOuterMarkerCorners"],
].forEach(([key, otherKey]) => {
  elements[key].addEventListener("click", () => {
    const settings = getFinderSettings();
    settings[key] = !settings[key];
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

elements.stressTests.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.stressTest;
    state.stressTests[key] = !state.stressTests[key];
    updateStressTestPreview();
  });
});

elements.sectionResets.forEach((button) => {
  button.addEventListener("click", () => resetSection(button.dataset.resetSection));
});

function bindColorEditor(colorInput, hexInput, getValue, applyValue, { allowTransparent = false } = {}) {
  colorInput.addEventListener("input", () => applyValue(colorInput.value));

  hexInput.addEventListener("input", () => {
    const value = hexInput.value.trim();
    if (allowTransparent && value.toLowerCase() === "transparent") {
      applyValue("transparent");
    } else if (/^#?[\da-f]{6}$/i.test(value)) {
      applyValue(`#${value.replace("#", "")}`);
    }
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
bindColorEditor(elements.backgroundColor, elements.backgroundColorValue, () => state.backgroundColor, (value) => {
  state.backgroundColor = value.toLowerCase();
  render();
}, { allowTransparent: true });

function buildSvg(code, size) {
  const dimension = code.getModuleCount() + QUIET_ZONE * 2;
  const backgroundData = state.backgroundColor === "transparent" ? ""
    : `<rect width="${dimension}" height="${dimension}" fill="${state.backgroundColor}"/>`;
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
    return ["outer", "inner"].map((part) => {
      if (getFinderSettings(markerIndex)[`${part}AsModules`]) return "";
      const { tag, attributes } = getMarkerShape(x, y, markerIndex, part);
      const data = Object.entries(attributes).map(([name, value]) => `${name}="${value}"`).join(" ");
      return `<${tag} ${data}/>`;
    }).join("");
  }).join("");
  const clipData = getMarkerClips(code).map(({ id, d, clip }) => (
    `<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${d}"${clip ? ` clip-path="url(#${clip})"` : ""}/></clipPath>`
  )).join("");
  const definitions = clipData ? `<defs>${clipData}</defs>` : "";
  let alignmentData = "";
  if (!state.alignmentAsModules) {
    const alignmentSvg = document.createElementNS(SVG_NAMESPACE, "svg");
    appendSvgAlignmentPatterns(alignmentSvg, code);
    alignmentData = alignmentSvg.innerHTML;
  }
  const rendering = getShapeRendering();
  let logoData = "";
  if (state.logoDataUrl) {
    const box = getLogoBox(code);
    logoData = `<image x="${formatNumber(box.x, 6)}" y="${formatNumber(box.y, 6)}" width="${formatNumber(box.width, 6)}" height="${formatNumber(box.height, 6)}" href="${state.logoDataUrl}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${dimension} ${dimension}" shape-rendering="${rendering}">${definitions}${backgroundData}${moduleData}${markerData}${alignmentData}${logoData}</svg>\n`;
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
    const x = offset + moduleX * moduleSize;
    const y = offset + moduleY * moduleSize;

    ["outer", "inner"].forEach((part) => {
      if (getFinderSettings(markerIndex)[`${part}AsModules`]) return;
      const { tag, attributes } = getMarkerShape(x, y, markerIndex, part, moduleSize);
      const draw = attributes.stroke ? "stroke" : "fill";
      context.save();
      if (attributes.stroke) {
        context.strokeStyle = attributes.stroke;
        context.lineWidth = attributes["stroke-width"];
        context.lineJoin = attributes["stroke-linejoin"];
        context.miterLimit = attributes["stroke-miterlimit"];
        context.clip(new Path2D(attributes.d));
      }
      else context.fillStyle = attributes.fill;
      if (part === "outer" && hasOuterMarkerClip(markerIndex)) {
        context.clip(new Path2D(outerMarkerClipCommand(x, y, moduleSize, markerIndex)));
      }
      if (tag === "path") {
        const path = new Path2D(attributes.d);
        if (attributes["fill-rule"]) context.fill(path, attributes["fill-rule"]);
        else context[draw](path);
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

function drawCanvasAlignmentPatterns(context, code, moduleSize, offset, quietZone) {
  const artwork = getAlignmentArtwork(code, quietZone);
  if (!artwork.shapes.length) return;
  context.save();
  context.translate(offset, offset);
  context.scale(moduleSize, moduleSize);
  if (artwork.clearClip) {
    context.clip(new Path2D(artwork.clips.find((clip) => clip.id === artwork.clearClip).d), "evenodd");
  }
  artwork.shapes.forEach((attributes) => {
    context.save();
    const path = new Path2D(attributes.d);
    if (attributes.stroke) {
      context.clip(path);
      context.strokeStyle = attributes.stroke;
      context.lineWidth = attributes["stroke-width"];
      context.lineJoin = attributes["stroke-linejoin"];
      context.miterLimit = attributes["stroke-miterlimit"];
      context.stroke(path);
    } else {
      context.fillStyle = attributes.fill;
      context.fill(path);
    }
    context.restore();
  });
  context.restore();
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
  // At small export sizes the QR can have no quiet zone to absorb the Gooey outline.
  const outset = quietZone === 0 ? Math.max(...[0, 1, 2].map((index) => getOuterMarkerOutset(getFinderSettings(index)))) : 0;
  const drawingDimension = dimension + 2 * outset;
  const integerModuleSize = Math.floor(size / drawingDimension);
  const moduleSize = integerModuleSize || size / drawingDimension;
  const margin = (size - moduleSize * dimension) / 2;
  const offset = outset > 0 ? margin : integerModuleSize ? Math.floor(margin) : 0;
  const exclusionBox = state.clearLogoArea ? getLogoBox(code, quietZone) : null;

  context.clearRect(0, 0, size, size);
  context.fillStyle = state.moduleColor;

  const palette = getModulePalettePaint(code, quietZone);
  if (palette) {
    drawCanvasModulePalette(context, palette, moduleSize, offset, quietZone);
  } else if (isCircuitStyle()) {
    drawCanvasCircuit(context, getCircuitGeometry(code, quietZone), moduleSize, offset);
  } else if (supportsModuleMerge(state.moduleStyle) || state.moduleStyle === "figure") {
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
  drawCanvasAlignmentPatterns(context, code, moduleSize, offset, quietZone);

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
  if (state.backgroundColor !== "transparent") {
    // Add the background after palette compositing so the palette only colors QR artwork.
    context.save();
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = state.backgroundColor;
    context.fillRect(0, 0, size, size);
    context.restore();
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
