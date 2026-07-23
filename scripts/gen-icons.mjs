/** Generates the PWA / home-screen icons from the brand mark (green
 *  rounded square + white bolt). Run: node scripts/gen-icons.mjs */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const BOLT = "M13.2 5.5 8 13h3.4l-.8 5.5L16 11h-3.5l.7-5.5Z";

function svg(size, { radiusRatio = 0.23, pad = 0 } = {}) {
  const r = Math.round(size * radiusRatio);
  const inner = size - pad * 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${pad > 0 ? 0 : r}" fill="#1B7A4B"/>
  <g transform="translate(${pad},${pad}) scale(${inner / 24})">
    <path d="${BOLT}" fill="#ffffff"/>
  </g>
</svg>`);
}

mkdirSync("public/icons", { recursive: true });

// standard icons: rounded square (iOS rounds it again itself, harmless)
await sharp(svg(192)).png().toFile("public/icons/icon-192.png");
await sharp(svg(512)).png().toFile("public/icons/icon-512.png");
await sharp(svg(180)).png().toFile("public/icons/apple-touch-icon.png");
// maskable: full-bleed square with safe padding for Android launchers
await sharp(svg(512, { pad: 80 })).png().toFile("public/icons/maskable-512.png");

console.log("icons generated: 192, 512, apple-180, maskable-512");
