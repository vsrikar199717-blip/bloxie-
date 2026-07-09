const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const objects = [
  { name: 'toilet-roll', color: '#D4A574', label: '🧻' },
  { name: 'milk-bottle', color: '#E8E8E8', label: '🥛' },
  { name: 'cardboard-box', color: '#C4A35A', label: '📦' },
  { name: 'straw', color: '#FF6B6B', label: '🥤' },
  { name: 'tin-can', color: '#A8A8A8', label: '🥫' },
  { name: 'egg-carton', color: '#E8DCC8', label: '🥚' },
  { name: 'bottle-lid', color: '#4ECDC4', label: '⭕' },
  { name: 'paper-tube', color: '#D4B896', label: '📜' },
  { name: 'plastic-cup', color: '#FFE66D', label: '🥤' },
  { name: 'yoghurt-pot', color: '#FFB6C1', label: '🥛' },
  { name: 'cereal-box', color: '#FF8C42', label: '🥣' },
  { name: 'bubble-wrap', color: '#87CEEB', label: '💨' },
  { name: 'cotton-reel', color: '#DDA0DD', label: '🧵' },
  { name: 'juice-carton', color: '#98D8AA', label: '🧃' },
  { name: 'newspaper', color: '#F5F5DC', label: '📰' },
];

const outputDir = path.join(__dirname, '../public/assets/objects');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

objects.forEach(({ name, color, label }) => {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');

  // Background with rounded corners effect
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(10, 10, 180, 180, 20);
  ctx.fill();

  // Add slight shadow/depth
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath();
  ctx.roundRect(15, 15, 180, 180, 20);
  ctx.fill();

  // Emoji label
  ctx.font = '80px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 100, 100);

  // Save
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(outputDir, `${name}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`Created: ${name}.png`);
});

console.log('\\nAll placeholder images created!');
