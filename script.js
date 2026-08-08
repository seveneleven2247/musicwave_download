const canvas = document.querySelector("#wave-canvas");
const context = canvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let width = 0;
let height = 0;
let pixelRatio = 1;
let pointerEnergy = 0;
let targetEnergy = 0;
let running = true;
let startTime = performance.now();

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = Math.max(1, Math.round(rect.width));
  height = Math.max(1, Math.round(rect.height));
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function waveValue(normalizedX, time, layer) {
  const envelope = Math.pow(Math.sin(Math.PI * normalizedX), 0.72);
  const primary = Math.sin(normalizedX * Math.PI * (5.4 + layer * 0.35) - time * (1.55 + layer * 0.16));
  const detail = Math.sin(normalizedX * Math.PI * 18 + time * 2.2 + layer) * 0.28;
  const rhythm = Math.sin(time * 1.25 + normalizedX * Math.PI * 2.2) * 0.2;
  return (primary + detail + rhythm) * envelope;
}

function drawWave(time) {
  const centerY = height * 0.58;
  const baseAmplitude = Math.min(height * 0.12, 82) * (1 + pointerEnergy * 0.42);
  const layers = [
    { color: "rgba(51, 214, 230, 0.24)", width: 7, amplitude: 1.08 },
    { color: "rgba(255, 93, 143, 0.26)", width: 3.5, amplitude: 0.8 },
    { color: "rgba(236, 253, 255, 0.88)", width: 1.5, amplitude: 0.62 }
  ];

  context.clearRect(0, 0, width, height);

  layers.forEach((layer, index) => {
    context.beginPath();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = layer.width;
    context.strokeStyle = layer.color;

    const step = width < 700 ? 4 : 3;
    for (let x = -step; x <= width + step; x += step) {
      const normalizedX = Math.max(0, Math.min(1, x / width));
      const y = centerY + waveValue(normalizedX, time, index) * baseAmplitude * layer.amplitude;
      if (x === -step) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  });

  const barCount = Math.max(36, Math.floor(width / 24));
  const barGap = width / barCount;
  for (let index = 0; index < barCount; index += 1) {
    const normalizedX = index / (barCount - 1);
    const envelope = Math.pow(Math.sin(Math.PI * normalizedX), 0.8);
    const pulse = Math.abs(Math.sin(time * 1.8 + index * 0.56));
    const barHeight = (8 + pulse * 22 + pointerEnergy * 13) * envelope;
    context.fillStyle = index % 6 === 0 ? "rgba(255, 93, 143, 0.42)" : "rgba(51, 214, 230, 0.3)";
    context.fillRect(index * barGap, centerY - barHeight / 2, 1, barHeight);
  }
}

function animate(timestamp) {
  if (!running) return;
  const elapsed = reduceMotion.matches ? 1.6 : (timestamp - startTime) / 1000;
  pointerEnergy += (targetEnergy - pointerEnergy) * 0.055;
  targetEnergy *= 0.985;
  drawWave(elapsed);

  if (!reduceMotion.matches) requestAnimationFrame(animate);
}

window.addEventListener("pointermove", (event) => {
  targetEnergy = Math.min(1, Math.abs(event.movementX) / 28 + Math.abs(event.movementY) / 28);
});

window.addEventListener("pointerdown", () => {
  targetEnergy = 1;
});

new ResizeObserver(() => {
  resizeCanvas();
  if (reduceMotion.matches) drawWave(1.6);
}).observe(canvas);

new IntersectionObserver(([entry]) => {
  running = entry.isIntersecting;
  if (running && !reduceMotion.matches) {
    startTime = performance.now();
    requestAnimationFrame(animate);
  }
}).observe(canvas);

reduceMotion.addEventListener("change", () => {
  startTime = performance.now();
  if (reduceMotion.matches) drawWave(1.6);
  else requestAnimationFrame(animate);
});

const platformNames = {
  macos: "macOS",
  windows: "Windows",
  connector: "Web Connector"
};

function updatePlatformLinks(platform, release) {
  document.querySelectorAll(`[data-platform-download="${platform}"]`).forEach((link) => {
    const label = link.querySelector("span:last-child");
    const versionLabel = label?.matches("[data-platform-version]");

    if (release.available && release.url) {
      link.href = new URL(release.url, window.location.href).href;
      link.classList.remove("unavailable");
      link.removeAttribute("aria-disabled");
      if (release.fileName) link.setAttribute("download", release.fileName);
      if (label) {
        label.textContent = versionLabel
          ? `${platformNames[platform]} ${release.version}`
          : `Download for ${platformNames[platform]}`;
      }
      return;
    }

    link.href = `#release-${platform}`;
    link.classList.add("unavailable");
    link.setAttribute("aria-disabled", "true");
    link.removeAttribute("download");
    if (label) {
      label.textContent = versionLabel
        ? `${platformNames[platform]} ${release.version} Coming Soon`
        : `${platformNames[platform]} Coming Soon`;
    }
  });
}

function updateReleaseCard(platform, release) {
  const card = document.querySelector(`[data-release-card="${platform}"]`);
  if (!card) return;

  const version = card.querySelector("[data-release-version]");
  const status = card.querySelector("[data-release-status]");
  const system = card.querySelector("[data-release-system]");
  const notes = card.querySelector("[data-release-notes]");

  if (version) version.textContent = release.version;
  if (system) system.textContent = [release.minimumSystem, release.size].filter(Boolean).join(" · ");
  if (status) {
    status.textContent = release.available ? "Available" : "Coming Soon";
    status.classList.toggle("available", release.available);
    status.classList.toggle("pending", !release.available);
  }
  if (notes) {
    notes.replaceChildren();
    (release.notes || []).forEach((note) => {
      const item = document.createElement("li");
      item.textContent = note;
      notes.append(item);
    });
  }
}

async function loadReleaseManifest() {
  try {
    const response = await fetch(`version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Version manifest returned ${response.status}`);
    const manifest = await response.json();

    ["macos", "windows", "connector"].forEach((platform) => {
      const release = manifest[platform];
      if (!release) return;
      updatePlatformLinks(platform, release);
      if (platform !== "connector") updateReleaseCard(platform, release);
    });

    const summary = document.querySelector("[data-release-summary]");
    if (summary) {
      const windowsState = manifest.windows?.available ? "" : " coming soon";
      summary.textContent = `macOS ${manifest.macos.version} · Windows ${manifest.windows.version}${windowsState} · Seven supported sources`;
    }

    const updated = document.querySelector("[data-release-updated]");
    if (updated && manifest.updatedAt) {
      const updatedDate = new Date(manifest.updatedAt);
      updated.textContent = `Version information updated ${updatedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })}`;
    }
  } catch (error) {
    console.warn("MusicWave version information could not be loaded.", error);
  }
}

document.querySelectorAll("[data-download]").forEach((link) => {
  link.addEventListener("click", () => {
    if (link.getAttribute("aria-disabled") === "true") return;
    const label = link.querySelector("span:last-child");
    if (!label) return;
    const original = label.textContent;
    label.textContent = "Downloading...";
    window.setTimeout(() => {
      label.textContent = original;
    }, 1800);
  });
});

resizeCanvas();
requestAnimationFrame(animate);
loadReleaseManifest();
