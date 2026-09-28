const defaults = {
  url: "https://example.com",
  color: "#202020",
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
  const code = qrcode(0, "M");
  code.addData(value, "Byte");
  code.make();
  return code;
}

function modulesToPath(code, quietZone = QUIET_ZONE) {
  const count = code.getModuleCount();
  const commands = [];

  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (code.isDark(row, column)) commands.push(`M${column + quietZone} ${row + quietZone}h1v1h-1z`);
    }
  }

  return commands.join("");
}

function clearPreview() {
  elements.preview.replaceChildren();
  elements.preview.removeAttribute("viewBox");
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
  elements.preview.setAttribute("viewBox", `0 0 ${dimension} ${dimension}`);
  elements.download.disabled = false;
}

function setColor(value) {
  state.color = value.toLowerCase();
  elements.color.value = state.color;
  render();
}

elements.url.addEventListener("input", render);

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
  elements.url.value = defaults.url;
  elements.color.value = defaults.color;
  render();
});

function buildSvg(code, size) {
  const dimension = code.getModuleCount() + QUIET_ZONE * 2;
  const pathData = modulesToPath(code);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${dimension} ${dimension}" shape-rendering="crispEdges"><path d="${pathData}" fill="${state.color}"/></svg>\n`;
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

  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (!code.isDark(row, column)) continue;
      const left = offset + Math.round((column + quietZone) * moduleSize);
      const top = offset + Math.round((row + quietZone) * moduleSize);
      const right = offset + Math.round((column + quietZone + 1) * moduleSize);
      const bottom = offset + Math.round((row + quietZone + 1) * moduleSize);
      context.fillRect(left, top, right - left, bottom - top);
    }
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

render();
