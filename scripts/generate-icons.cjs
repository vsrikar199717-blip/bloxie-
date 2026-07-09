const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const outputDir = path.join(__dirname, '../public');

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Yellow background
  ctx.fillStyle = '#FFFFCC';
  ctx.fillRect(0, 0, size, size);

  // Blue circle
  ctx.fillStyle = '#3B82F6';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // "H" letter
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', size / 2, size / 2);

  // Save
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(outputDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`Created: icon-${size}.png`);
});

console.log('PWA icons created!');
