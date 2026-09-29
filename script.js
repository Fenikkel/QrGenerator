const defaults = {
  url: "https://example.com",
  color: "#202020",
  errorCorrection: "M",
  moduleStyle: "square",
  markerStyle: "square",
};

const state = {
  ...defaults,
  encodedUrl: defaults.url,
  qr: null,
};

const elements = {
  preview: document.querySelector("#qrPreview"),
  url: document.querySelector("#urlInput"),
  urlHelp: document.querySelector("#urlHelp"),
  errorCorrection: document.querySelector("#errorCorrection"),
  moduleStyle: document.querySelector("#moduleStyle"),
  markerStyle: document.querySelector("#markerStyle"),
  color: document.querySelector("#qrColor"),
  colorValue: document.querySelector("#qrColorValue"),
  reset: document.querySelector("#resetButton"),
  download: document.querySelector("#downloadButton"),
  exportFormat: document.querySelector("#exportFormat"),
  exportSize: document.querySelector("#exportSize"),
  toast: document.querySelector("#toast"),
};

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const QUIET_ZONE = 4;
let toastTimer;

function parseLink(value) {
  const trimmed = value.trim();
  if (!trimmed) return { empty: true };

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) throw new Error("Invalid link");
    return { value: parsed.href };
  } catch {
    return { error: "Enter a valid link." };
  }
}

function createQr(value) {
  const code = qrcode(0, state.errorCorrection);
  code.addData(value, "Byte");
  code.make();
  return code;
}

function formatNumber(value) {
  return Number(value.toFixed(2)).toString();
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
  const left = formatNumber(centerX - radius);
  const right = formatNumber(centerX + radius);
  const center = formatNumber(centerY);
  const r = formatNumber(radius);
  return `M${right} ${center}A${r} ${r} 0 1 1 ${left} ${center}A${r} ${r} 0 1 1 ${right} ${center}Z`;
}

function moduleCommand(x, y, style) {
  if (style === "dots") return circleCommand(x + .5, y + .5, .42);
  if (style === "rounded") return roundedRectCommand(x + .07, y + .07, .86, .86, .3);
  if (style === "soft") return roundedRectCommand(x + .03, y + .03, .94, .94, .16);
  return `M${x} ${y}h1v1h-1z`;
}

function isMarkerModule(row, column, count) {
  const inTop = row < 7;
  const inLeft = column < 7;
  const inRight = column >= count - 7;
  const inBottom = row >= count - 7;
  return (inTop && (inLeft || inRight)) || (inBottom && inLeft);
}

function modulesToPath(code, quietZone = QUIET_ZONE, style = state.moduleStyle) {
  const count = code.getModuleCount();
  const commands = [];

  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (code.isDark(row, column) && !isMarkerModule(row, column, count)) {
        commands.push(moduleCommand(column + quietZone, row + quietZone, style));
      }
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

function setAttributes(node, attributes) {
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
  return node;
}

function appendSvgMarkers(svg, code) {
  markerPositions(code).forEach(([x, y]) => {
    let outer;
    let center;

    if (state.markerStyle === "circle") {
      outer = setAttributes(document.createElementNS(SVG_NAMESPACE, "circle"), {
        cx: x + 3.5, cy: y + 3.5, r: 3, fill: "none", stroke: state.color, "stroke-width": 1,
      });
      center = setAttributes(document.createElementNS(SVG_NAMESPACE, "circle"), {
        cx: x + 3.5, cy: y + 3.5, r: 1.5, fill: state.color,
      });
    } else {
      const rounded = state.markerStyle === "rounded";
      outer = setAttributes(document.createElementNS(SVG_NAMESPACE, "rect"), {
        x: x + .5, y: y + .5, width: 6, height: 6, rx: rounded ? 1.25 : 0,
        fill: "none", stroke: state.color, "stroke-width": 1,
      });
      center = setAttributes(document.createElementNS(SVG_NAMESPACE, "rect"), {
        x: x + 2, y: y + 2, width: 3, height: 3, rx: rounded ? .8 : 0, fill: state.color,
      });
    }

    svg.append(outer, center);
  });
}

function clearPreview() {
  elements.preview.replaceChildren();
  elements.preview.removeAttribute("viewBox");
  elements.preview.removeAttribute("shape-rendering");
}

function setValidation(message = "") {
  const hasError = Boolean(message);
  elements.url.setAttribute("aria-invalid", String(hasError));
  elements.urlHelp.textContent = message;
  elements.urlHelp.hidden = !hasError;
  elements.urlHelp.classList.toggle("error", hasError);
}

function render() {
  const result = parseLink(elements.url.value);
  elements.colorValue.value = state.color.toUpperCase();

  if (result.empty) {
    state.qr = null;
    state.encodedUrl = "";
    setValidation();
    clearPreview();
    elements.download.disabled = true;
    return;
  }

  if (result.error) {
    state.qr = null;
    state.encodedUrl = "";
    setValidation(result.error);
    clearPreview();
    elements.download.disabled = true;
    return;
  }

  try {
    state.qr = createQr(result.value);
    state.encodedUrl = result.value;
  } catch {
    state.qr = null;
    state.encodedUrl = "";
    setValidation("The link is too long to generate a QR code.");
    clearPreview();
    elements.download.disabled = true;
    return;
  }

  setValidation();
  const dimension = state.qr.getModuleCount() + QUIET_ZONE * 2;
  const path = document.createElementNS(SVG_NAMESPACE, "path");
  path.setAttribute("d", modulesToPath(state.qr));
  path.setAttribute("fill", state.color);

  elements.preview.replaceChildren(path);
  appendSvgMarkers(elements.preview, state.qr);
  elements.preview.setAttribute("viewBox", `0 0 ${dimension} ${dimension}`);
  elements.preview.setAttribute(
    "shape-rendering",
    state.moduleStyle === "square" && state.markerStyle === "square" ? "crispEdges" : "geometricPrecision",
  );
  elements.download.disabled = false;
}

function setColor(value) {
  state.color = value.toLowerCase();
  elements.color.value = state.color;
  render();
}

elements.url.addEventListener("input", render);
elements.errorCorrection.addEventListener("change", () => {
  state.errorCorrection = elements.errorCorrection.value;
  render();
});

["moduleStyle", "markerStyle"].forEach((key) => {
  elements[key].addEventListener("change", () => {
    state[key] = elements[key].value;
    render();
  });
});

elements.color.addEventListener("input", () => setColor(elements.color.value));

elements.colorValue.addEventListener("input", () => {
  const value = elements.colorValue.value.trim();
  if (!/^#?[\da-f]{6}$/i.test(value)) return;
  setColor(`#${value.replace("#", "")}`);
});

elements.colorValue.addEventListener("blur", () => {
  const value = elements.colorValue.value.trim().replace("#", "");
  if (/^[\da-f]{3}$/i.test(value)) {
    setColor(`#${[...value].map((character) => character.repeat(2)).join("")}`);
  } else {
    render();
  }
});

elements.colorValue.addEventListener("keydown", (event) => {
  if (event.key === "Enter") elements.colorValue.blur();
  if (event.key === "Escape") {
    elements.colorValue.value = state.color.toUpperCase();
    elements.colorValue.blur();
  }
});

elements.reset.addEventListener("click", () => {
  state.color = defaults.color;
  state.errorCorrection = defaults.errorCorrection;
  state.moduleStyle = defaults.moduleStyle;
  state.markerStyle = defaults.markerStyle;
  elements.url.value = defaults.url;
  elements.color.value = defaults.color;
  elements.errorCorrection.value = defaults.errorCorrection;
  elements.moduleStyle.value = defaults.moduleStyle;
  elements.markerStyle.value = defaults.markerStyle;
  render();
});

function buildSvg(code, size) {
  const dimension = code.getModuleCount() + QUIET_ZONE * 2;
  const pathData = modulesToPath(code);
  const markerData = markerPositions(code).map(([x, y]) => {
    if (state.markerStyle === "circle") {
      return `<circle cx="${x + 3.5}" cy="${y + 3.5}" r="3" fill="none" stroke="${state.color}" stroke-width="1"/><circle cx="${x + 3.5}" cy="${y + 3.5}" r="1.5" fill="${state.color}"/>`;
    }

    const outerRadius = state.markerStyle === "rounded" ? 1.25 : 0;
    const centerRadius = state.markerStyle === "rounded" ? .8 : 0;
    return `<rect x="${x + .5}" y="${y + .5}" width="6" height="6" rx="${outerRadius}" fill="none" stroke="${state.color}" stroke-width="1"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="${centerRadius}" fill="${state.color}"/>`;
  }).join("");
  const rendering = state.moduleStyle === "square" && state.markerStyle === "square"
    ? "crispEdges"
    : "geometricPrecision";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${dimension} ${dimension}" shape-rendering="${rendering}"><path d="${pathData}" fill="${state.color}"/>${markerData}</svg>\n`;
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
  if (state.moduleStyle === "dots") {
    context.moveTo(left + moduleSize * .92, top + moduleSize * .5);
    context.arc(left + moduleSize * .5, top + moduleSize * .5, moduleSize * .42, 0, Math.PI * 2);
    return;
  }

  const inset = state.moduleStyle === "rounded" ? .07 : .03;
  const radius = state.moduleStyle === "rounded" ? .3 : .16;
  addRoundedRectPath(
    context,
    left + moduleSize * inset,
    top + moduleSize * inset,
    moduleSize * (1 - inset * 2),
    moduleSize * (1 - inset * 2),
    moduleSize * radius,
  );
}

function drawCanvasMarkers(context, code, moduleSize, offset, quietZone) {
  context.fillStyle = state.color;
  context.strokeStyle = state.color;
  context.lineWidth = moduleSize;

  markerPositions(code, quietZone).forEach(([moduleX, moduleY]) => {
    const x = offset + moduleX * moduleSize;
    const y = offset + moduleY * moduleSize;

    if (state.markerStyle === "circle") {
      context.beginPath();
      context.arc(x + moduleSize * 3.5, y + moduleSize * 3.5, moduleSize * 3, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.arc(x + moduleSize * 3.5, y + moduleSize * 3.5, moduleSize * 1.5, 0, Math.PI * 2);
      context.fill();
      return;
    }

    context.beginPath();
    if (state.markerStyle === "rounded") {
      addRoundedRectPath(
        context,
        x + moduleSize * .5,
        y + moduleSize * .5,
        moduleSize * 6,
        moduleSize * 6,
        moduleSize * 1.25,
      );
    } else {
      context.rect(x + moduleSize * .5, y + moduleSize * .5, moduleSize * 6, moduleSize * 6);
    }
    context.stroke();

    context.beginPath();
    if (state.markerStyle === "rounded") {
      addRoundedRectPath(
        context,
        x + moduleSize * 2,
        y + moduleSize * 2,
        moduleSize * 3,
        moduleSize * 3,
        moduleSize * .8,
      );
      context.fill();
    } else {
      context.fillRect(x + moduleSize * 2, y + moduleSize * 2, moduleSize * 3, moduleSize * 3);
    }
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

  context.clearRect(0, 0, size, size);
  context.fillStyle = state.color;

  if (state.moduleStyle !== "square") context.beginPath();

  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (!code.isDark(row, column) || isMarkerModule(row, column, count)) continue;
      const left = offset + (column + quietZone) * moduleSize;
      const top = offset + (row + quietZone) * moduleSize;

      if (state.moduleStyle === "square") {
        const right = offset + Math.round((column + quietZone + 1) * moduleSize);
        const bottom = offset + Math.round((row + quietZone + 1) * moduleSize);
        context.fillRect(Math.round(left), Math.round(top), right - Math.round(left), bottom - Math.round(top));
      } else {
        addCanvasModule(context, left, top, moduleSize);
      }
    }
  }

  if (state.moduleStyle !== "square") context.fill();
  drawCanvasMarkers(context, code, moduleSize, offset, quietZone);
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

render();
