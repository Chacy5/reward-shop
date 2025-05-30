// Цвета паттерна (бирюзовый, розовый, желтый, прозрачность)
const PAW_COLORS = [
  'rgba(111,237,209,0.19)', // бирюзовый
  'rgba(255,191,206,0.22)', // розовый
  'rgba(255,238,172,0.17)'  // желтый
];

const PAW_PATH = [
  { type: "ellipse", x: 0, y: 0, rx: 16, ry: 14, rotation: 0 },
  { type: "ellipse", x: -13, y: -15, rx: 6.5, ry: 5.5, rotation: -20 },
  { type: "ellipse", x: 13, y: -15, rx: 6.5, ry: 5.5, rotation: 20 },
  { type: "ellipse", x: -7, y: -25, rx: 4.5, ry: 3.8, rotation: -15 },
  { type: "ellipse", x: 7, y: -25, rx: 4.5, ry: 3.8, rotation: 15 }
];

function drawPaw(ctx, x, y, size, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * Math.PI / 180);
  ctx.scale(size / 40, size / 40); // base paw size ≈ 40px
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

function pawsNotOverlap(paws, x, y, r) {
  for (let i = 0; i < paws.length; ++i) {
    let dx = x - paws[i].x;
    let dy = y - paws[i].y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < (paws[i].r + r + 10)) return false;
  }
  return true;
}

function drawPawPattern() {
  const canvas = document.getElementById('paw-bg-pattern');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const pawCount = Math.floor(canvas.width * canvas.height / 18500);
  const minPaw = 32, maxPaw = 62;
  let paws = [];
  let fails = 0, i = 0, maxTries = pawCount * 20;

  while (paws.length < pawCount && fails < maxTries) {
    const size = minPaw + Math.random() * (maxPaw - minPaw);
    const r = size * 0.6;
    const x = r + Math.random() * (canvas.width - 2*r);
    const y = r + Math.random() * (canvas.height - 2*r);
    if (pawsNotOverlap(paws, x, y, r)) {
      paws.push({ x, y, r, size, angle: Math.random() * 360, color: PAW_COLORS[Math.floor(Math.random() * PAW_COLORS.length)] });
      i++;
      fails = 0;
    } else {
      fails++;
    }
  }
  paws.forEach(paw => drawPaw(ctx, paw.x, paw.y, paw.size, paw.angle, paw.color));

  for (let i = 0; i < pawCount * 1.5; ++i) {
    const r = 1 + Math.random() * 3;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.globalAlpha = 0.14 + Math.random() * 0.13;
    ctx.beginPath();
    ctx.fillStyle = PAW_COLORS[Math.floor(Math.random() * PAW_COLORS.length)];
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

window.addEventListener('resize', drawPawPattern);
window.addEventListener('DOMContentLoaded', drawPawPattern);
