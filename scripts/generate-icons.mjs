/**
 * Generate placeholder extension icons
 * Run with: node scripts/generate-icons.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');

// Create icons directory if it doesn't exist
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

/**
 * Generate a simple SVG icon
 */
function generateSVG(size) {
  const fontSize = Math.floor(size * 0.4);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#0ea5e9"/>
  <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">H1</text>
</svg>`;
}

// Generate icons
const sizes = [16, 48, 128];

for (const size of sizes) {
  const svg = generateSVG(size);
  const path = join(iconsDir, `icon-${size}.svg`);
  writeFileSync(path, svg);
  console.log(`Created: ${path}`);
}

console.log('\nPlaceholder icons created!');
console.log('Note: For production, replace these SVGs with proper PNG icons.');
console.log('You can convert SVGs to PNGs using tools like Inkscape or online converters.');
