// scripts/build-icons.mjs
// Generates PNG icons from SVG using built-in Canvas API
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Simple SVG → PNG using Image + Canvas (works in Node 18+ with fetch)
async function svgToPng(svgContent, size, outputPath) {
  // Write SVG to temp file
  const tempSvg = join(__dirname, `temp-${size}.svg`);
  writeFileSync(tempSvg, svgContent, "utf8");

  // Use Node's native canvas if available, else skip
  try {
    const { createCanvas } = await import("canvas");
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    const img = await loadImage(`file://${tempSvg}`);
    ctx.drawImage(img, 0, 0, size, size);
    const buf = canvas.toBuffer("image/png");
    writeFileSync(outputPath, buf);
    console.log(`✅ Generated: ${outputPath}`);
  } catch {
    console.log(`⚠️  canvas not available — skipping PNG generation`);
    console.log(`   To generate icons, install: npm i canvas`);
    console.log(`   Or manually convert public/icons/icon-192.svg to 192x192 and 512x512 PNG`);
  }
}

// Minimal image loader using fetch + Blob URL
async function loadImage(src) {
  const res = await fetch(src);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const SVG_192 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ef4444"/>
      <stop offset="100%" style="stop-color:#dc2626"/>
    </linearGradient>
  </defs>
  <rect width="192" height="192" rx="40" fill="url(#bg)"/>
  <rect x="48" y="42" width="96" height="108" rx="8" fill="rgba(0,0,0,0.15)"/>
  <rect x="44" y="38" width="96" height="108" rx="8" fill="white"/>
  <rect x="44" y="38" width="12" height="108" rx="4" fill="#e5e5e5"/>
  <text x="92" y="112" font-family="serif" font-size="60" font-weight="700" fill="#dc2626" text-anchor="middle" dominant-baseline="middle">汉</text>
  <rect x="56" y="130" width="80" height="3" rx="1.5" fill="#ef4444" opacity="0.5"/>
</svg>`;

mkdirSync(join(__dirname, "../public/icons"), { recursive: true });
svgToPng(SVG_192, 192, join(__dirname, "../public/icons/icon-192.png"));
svgToPng(SVG_192, 512, join(__dirname, "../public/icons/icon-512.png"));
