const defaults = {
  url: "https://example.com",
  color: "#202020",
  errorCorrection: "M",
  moduleStyle: "square",
  markerStyle: "square",
  moduleScale: 100,
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
  url: document.querySelector("#urlInput"),
  urlHelp: document.querySelector("#urlHelp"),
  errorCorrection: document.querySelector("#errorCorrection"),
  moduleStyle: document.querySelector("#moduleStyle"),
  markerStyle: document.querySelector("#markerStyle"),
  moduleScale: document.querySelector("#moduleScale"),
  moduleScaleValue: document.querySelector("#moduleScaleValue"),
  color: document.querySelector("#qrColor"),
  colorValue: document.querySelector("#qrColorValue"),
  logoInput: document.querySelector("#logoInput"),
  logoDropZone: document.querySelector("#logoDropZone"),
  logoFileName: document.querySelector("#logoFileName"),
  logoError: document.querySelector("#logoError"),
  logoSize: document.querySelector("#logoSize"),
  logoSizeValue: document.querySelector("#logoSizeValue"),
  removeLogo: document.querySelector("#removeLogo"),
  showLogoArea: document.querySelector("#showLogoArea"),
  clearLogoArea: document.querySelector("#clearLogoArea"),
  reset: document.querySelector("#resetButton"),
  download: document.querySelector("#downloadButton"),
  exportFormat: document.querySelector("#exportFormat"),
  exportSize: document.querySelector("#exportSize"),
  toast: document.querySelector("#toast"),
};

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const QUIET_ZONE = 4;
let toastTimer;
let logoDragDepth = 0;

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
  const size = state.moduleScale / 100;
  const inset = (1 - size) / 2;
  const left = x + inset;
  const top = y + inset;

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

function moduleIntersectsBox(row, column, quietZone, box) {
  if (!box) return false;
  const size = state.moduleScale / 100;
  const inset = (1 - size) / 2;
  const left = column + quietZone + inset;
  const top = row + quietZone + inset;
  const right = left + size;
  const bottom = top + size;
  return right > box.x && left < box.x + box.width && bottom > box.y && top < box.y + box.height;
}

function modulesToPath(code, quietZone = QUIET_ZONE, style = state.moduleStyle) {
  const count = code.getModuleCount();
  const commands = [];
  const exclusionBox = state.clearLogoArea ? getLogoBox(code, quietZone) : null;

  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (
        code.isDark(row, column)
        && !isMarkerModule(row, column, count)
        && !moduleIntersectsBox(row, column, quietZone, exclusionBox)
      ) {
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
  elements.urlHelp.textContent = message;
  elements.urlHelp.hidden = !hasError;
  elements.urlHelp.classList.toggle("error", hasError);
}

function render() {
  const result = parseLink(elements.url.value);
  elements.colorValue.value = state.color.toUpperCase();
  elements.moduleScaleValue.textContent = `${state.moduleScale}%`;
  elements.logoSizeValue.textContent = `${state.logoSize}%`;

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
  appendSvgLogo(elements.preview, state.qr);
  appendSvgLogoGuide(elements.preview, state.qr);
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

elements.moduleScale.addEventListener("input", () => {
  state.moduleScale = Number(elements.moduleScale.value);
  render();
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
  state.moduleScale = defaults.moduleScale;
  state.logoSize = defaults.logoSize;
  state.showLogoArea = defaults.showLogoArea;
  state.clearLogoArea = defaults.clearLogoArea;
  elements.url.value = defaults.url;
  elements.color.value = defaults.color;
  elements.errorCorrection.value = defaults.errorCorrection;
  elements.moduleStyle.value = defaults.moduleStyle;
  elements.markerStyle.value = defaults.markerStyle;
  elements.moduleScale.value = defaults.moduleScale;
  elements.logoSize.value = defaults.logoSize;
  elements.showLogoArea.checked = defaults.showLogoArea;
  elements.clearLogoArea.checked = defaults.clearLogoArea;
  clearLogo(false);
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
  let logoData = "";
  if (state.logoDataUrl) {
    const box = getLogoBox(code);
    logoData = `<image x="${formatNumber(box.x)}" y="${formatNumber(box.y)}" width="${formatNumber(box.width)}" height="${formatNumber(box.height)}" href="${state.logoDataUrl}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${dimension} ${dimension}" shape-rendering="${rendering}"><path d="${pathData}" fill="${state.color}"/>${markerData}${logoData}</svg>\n`;
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
  const scale = state.moduleScale / 100;
  const renderedSize = moduleSize * scale;
  const inset = (moduleSize - renderedSize) / 2;

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
  const exclusionBox = state.clearLogoArea ? getLogoBox(code, quietZone) : null;

  context.clearRect(0, 0, size, size);
  context.fillStyle = state.color;

  if (state.moduleStyle !== "square") context.beginPath();

  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (
        !code.isDark(row, column)
        || isMarkerModule(row, column, count)
        || moduleIntersectsBox(row, column, quietZone, exclusionBox)
      ) continue;
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

render();
