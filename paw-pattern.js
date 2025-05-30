// Paw SVG as path for drawing (simple paw)
const PAW_PATH = [
  // Main pad (ellipse)
  { type: "ellipse", x: 0, y: 0, rx: 16, ry: 14, rotation: 0 },
  // Toes (ellipses)
  { type: "ellipse", x: -13, y: -15, rx: 6.5, ry: 5.5, rotation: -20 },
  { type: "ellipse", x: 13, y: -15, rx: 6.5, ry: 5.5, rotation: 20 },
  { type: "ellipse", x: -7, y: -25, rx: 4.5, ry: 3.8, rotation: -15 },
  { type: "ellipse", x: 7, y: -25, rx: 4.5, ry: 3.8, rotation: 15 }
];

// Main colors: soft black/grey, beige, sand
const PAW_COLORS = ['#2d303a', '#e3d7c2', '#d4ab7c'];

function drawPaw(ctx, x, y, size, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * Math.PI / 180);
  ctx.scale(size / 40, size / 40); // base paw size ≈ 40px
  ctx.globalAlpha = 0.93;
  ctx.fillStyle = color;
  PAW_PATH.forEach(part => {
    ctx.save();
    ctx.translate(part.x, part.y);
    ctx.rotate((part.rotation||0)*Math.PI/180);
    ctx.beginPath();
    ctx.ellipse(0, 0, part.rx, part.ry, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function drawPawPattern() {
  const canvas = document.getElementById('paw-bg-pattern');
  if (!canvas) return;
  // Fit to window
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pattern settings
  const pawCount = Math.floor(canvas.width * canvas.height / 12000); // density
  const minPaw = 28, maxPaw = 56;
  for (let i = 0; i < pawCount; ++i) {
    // Random position, avoid too close to edge
    const x = Math.random() * (canvas.width - maxPaw*2) + maxPaw;
    const y = Math.random() * (canvas.height - maxPaw*2) + maxPaw;
    // Size and angle
    const size = minPaw + Math.random() * (maxPaw - minPaw);
    const angle = Math.random() * 360;
    // Color: mostly light, иногда темнее
    const color = PAW_COLORS[Math.floor(Math.random() * PAW_COLORS.length)];
    drawPaw(ctx, x, y, size, angle, color);
  }
  // Draw small dots for extra "fun"
  for (let i = 0; i < pawCount * 2; ++i) {
    const r = 1 + Math.random() * 3;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.globalAlpha = 0.16 + Math.random() * 0.15;
    ctx.beginPath();
    ctx.fillStyle = PAW_COLORS[Math.floor(Math.random() * PAW_COLORS.length)];
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Redraw on resize
window.addEventListener('resize', drawPawPattern);
window.addEventListener('DOMContentLoaded', drawPawPattern);