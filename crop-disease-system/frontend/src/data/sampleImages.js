/**
 * Procedural Rose & Crop Leaf Image Generator
 * Generates realistic 448x448 rose leaflet canvases exported as PNG data URLs:
 * 1. Healthy Rose Leaf
 * 2. Black Spot Infection (Diplocarpon rosae)
 * 3. Powdery Mildew (Podosphaera pannosa)
 * 4. Rose Rust (Phragmidium mucronatum)
 * 5. Downy Mildew (Peronospora sparsa)
 * 6. Botrytis Blight / Gray Mold (Botrytis cinerea)
 * 7. Early Leaf Blight / Cercospora (Cercospora / Alternaria spp.)
 *
 * Generated locally without external network dependencies.
 */

function createBaseLeafCanvas(width = 448, height = 448) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background: clean studio neutral backdrop
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(0, 0, width, height);

  // Soft drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.25)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 12;

  // Draw ovate rose leaflet path
  ctx.beginPath();
  const cx = width / 2;
  const topY = height * 0.1;
  const bottomY = height * 0.85;

  ctx.moveTo(cx, topY);
  ctx.bezierCurveTo(cx + width * 0.38, height * 0.28, cx + width * 0.36, height * 0.62, cx + 4, bottomY);
  ctx.lineTo(cx, bottomY + 28);
  ctx.lineTo(cx - 4, bottomY);
  ctx.bezierCurveTo(cx - width * 0.36, height * 0.62, cx - width * 0.38, height * 0.28, cx, topY);
  ctx.closePath();

  // Vibrant chlorophyll base gradient
  const grad = ctx.createLinearGradient(cx - width * 0.2, topY, cx + width * 0.2, bottomY);
  grad.addColorStop(0, '#3FA836');
  grad.addColorStop(0.35, '#2D8028');
  grad.addColorStop(0.7, '#246620');
  grad.addColorStop(1, '#1C521A');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // Leaf margin serrations (teeth)
  ctx.save();
  ctx.strokeStyle = '#1D5A19';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 40; i++) {
    const t = i / 40;
    const y = topY + t * (bottomY - topY);
    const spread = Math.sin(t * Math.PI) * (width * 0.34);
    ctx.beginPath();
    ctx.moveTo(cx + spread, y);
    ctx.lineTo(cx + spread + 4, y - 3);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - spread, y);
    ctx.lineTo(cx - spread - 4, y - 3);
    ctx.stroke();
  }
  ctx.restore();

  // Central midrib vein
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, topY + 4);
  ctx.quadraticCurveTo(cx + 2, height * 0.5, cx, bottomY + 25);
  ctx.strokeStyle = '#7BC86E';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Lateral secondary veins
  ctx.strokeStyle = '#68B85A';
  ctx.lineWidth = 1.8;
  for (let i = 1; i <= 9; i++) {
    const vy = topY + (i / 11) * (bottomY - topY);
    const span = Math.sin((i / 11) * Math.PI) * (width * 0.3);

    ctx.beginPath();
    ctx.moveTo(cx, vy);
    ctx.quadraticCurveTo(cx + span * 0.5, vy - 14, cx + span, vy - 24);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, vy);
    ctx.quadraticCurveTo(cx - span * 0.5, vy - 14, cx - span, vy - 24);
    ctx.stroke();
  }
  ctx.restore();

  return { canvas, ctx, cx, topY, bottomY, width, height };
}

/**
 * 1. Healthy Rose Leaf
 */
export function generateHealthyLeaf() {
  const { canvas, ctx, cx, topY, bottomY } = createBaseLeafCanvas();

  // Glossy cuticle specular highlights
  ctx.save();
  const spec1 = ctx.createRadialGradient(cx - 30, topY + 90, 8, cx - 30, topY + 90, 60);
  spec1.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  spec1.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
  spec1.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = spec1;
  ctx.fillRect(0, 0, 448, 448);

  const spec2 = ctx.createRadialGradient(cx + 40, bottomY - 110, 10, cx + 40, bottomY - 110, 75);
  spec2.addColorStop(0, 'rgba(255, 255, 255, 0.38)');
  spec2.addColorStop(0.6, 'rgba(255, 255, 255, 0.08)');
  spec2.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = spec2;
  ctx.fillRect(0, 0, 448, 448);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

/**
 * 2. Black Spot Infection (Diplocarpon rosae)
 */
export function generateBlackSpotLeaf() {
  const { canvas, ctx, cx } = createBaseLeafCanvas();

  const lesions = [
    { cx: cx - 40, cy: 170, r: 26 },
    { cx: cx + 45, cy: 210, r: 32 },
    { cx: cx - 20, cy: 270, r: 24 },
    { cx: cx + 30, cy: 130, r: 18 },
    { cx: cx - 55, cy: 230, r: 16 },
    { cx: cx + 15, cy: 300, r: 20 },
  ];

  lesions.forEach((l) => {
    // 1. Chlorotic yellow halo
    const halo = ctx.createRadialGradient(l.cx, l.cy, l.r * 0.7, l.cx, l.cy, l.r * 1.8);
    halo.addColorStop(0, 'rgba(234, 179, 8, 0.85)');
    halo.addColorStop(0.6, 'rgba(234, 179, 8, 0.45)');
    halo.addColorStop(1, 'rgba(234, 179, 8, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(l.cx, l.cy, l.r * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 2. Black necrotic core
    const core = ctx.createRadialGradient(l.cx, l.cy, 0, l.cx, l.cy, l.r);
    core.addColorStop(0, '#09090B');
    core.addColorStop(0.8, '#18181B');
    core.addColorStop(1, '#27272A');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(l.cx, l.cy, l.r, 0, Math.PI * 2);
    ctx.fill();

    // 3. Fibrillose feathery margins
    ctx.save();
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 1.2;
    for (let a = 0; a < 24; a++) {
      const theta = (a / 24) * Math.PI * 2;
      const len = l.r + (Math.sin(a * 5) + 1.2) * 4;
      ctx.beginPath();
      ctx.moveTo(l.cx + Math.cos(theta) * l.r * 0.85, l.cy + Math.sin(theta) * l.r * 0.85);
      ctx.lineTo(l.cx + Math.cos(theta) * len, l.cy + Math.sin(theta) * len);
      ctx.stroke();
    }
    ctx.restore();
  });

  return canvas.toDataURL('image/png');
}

/**
 * 3. Powdery Mildew (Podosphaera pannosa)
 */
export function generatePowderyMildewLeaf() {
  const { canvas, ctx, cx } = createBaseLeafCanvas();

  const patches = [
    { cx: cx - 25, cy: 150, rx: 65, ry: 45, rot: 0.2 },
    { cx: cx + 30, cy: 210, rx: 80, ry: 55, rot: -0.3 },
    { cx: cx - 15, cy: 280, rx: 70, ry: 40, rot: 0.15 },
  ];

  patches.forEach((p) => {
    ctx.save();
    ctx.translate(p.cx, p.cy);
    ctx.rotate(p.rot);

    const felt = ctx.createRadialGradient(0, 0, 5, 0, 0, Math.max(p.rx, p.ry));
    felt.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
    felt.addColorStop(0.4, 'rgba(243, 244, 246, 0.72)');
    felt.addColorStop(0.75, 'rgba(229, 231, 235, 0.42)');
    felt.addColorStop(1, 'rgba(229, 231, 235, 0)');

    ctx.fillStyle = felt;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let i = 0; i < 90; i++) {
      const sx = (Math.random() - 0.5) * p.rx * 1.6;
      const sy = (Math.random() - 0.5) * p.ry * 1.6;
      const sr = Math.random() * 1.8 + 0.6;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  return canvas.toDataURL('image/png');
}

/**
 * 4. Rose Rust (Phragmidium mucronatum)
 */
export function generateRustLeaf() {
  const { canvas, ctx, cx } = createBaseLeafCanvas();

  const clusters = [
    { cx: cx - 45, cy: 180, count: 28, radius: 45 },
    { cx: cx + 45, cy: 230, count: 32, radius: 50 },
    { cx: cx - 10, cy: 280, count: 22, radius: 38 },
    { cx: cx + 25, cy: 140, count: 18, radius: 30 },
  ];

  clusters.forEach((cl) => {
    const bg = ctx.createRadialGradient(cl.cx, cl.cy, 5, cl.cx, cl.cy, cl.radius);
    bg.addColorStop(0, 'rgba(202, 138, 4, 0.4)');
    bg.addColorStop(1, 'rgba(202, 138, 4, 0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(cl.cx, cl.cy, cl.radius, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < cl.count; i++) {
      const dist = Math.random() * cl.radius;
      const ang = Math.random() * Math.PI * 2;
      const px = cl.cx + Math.cos(ang) * dist;
      const py = cl.cy + Math.sin(ang) * dist;
      const pr = Math.random() * 3.5 + 2.0;

      const rustGrad = ctx.createRadialGradient(px - 1, py - 1, 0.5, px, py, pr);
      rustGrad.addColorStop(0, '#FB923C');
      rustGrad.addColorStop(0.6, '#EA580C');
      rustGrad.addColorStop(1, '#9A3412');
      ctx.fillStyle = rustGrad;

      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  return canvas.toDataURL('image/png');
}

/**
 * 5. Downy Mildew (Peronospora sparsa)
 */
export function generateDownyMildewLeaf() {
  const { canvas, ctx, cx } = createBaseLeafCanvas();

  const blotches = [
    { cx: cx - 35, cy: 160, rw: 36, rh: 28 },
    { cx: cx + 40, cy: 220, rw: 42, rh: 32 },
    { cx: cx - 20, cy: 280, rw: 30, rh: 24 },
    { cx: cx + 20, cy: 140, rw: 26, rh: 20 },
  ];

  blotches.forEach((b) => {
    // Chlorotic halo
    const halo = ctx.createRadialGradient(b.cx, b.cy, b.rw * 0.5, b.cx, b.cy, b.rw * 1.5);
    halo.addColorStop(0, 'rgba(217, 180, 20, 0.6)');
    halo.addColorStop(1, 'rgba(217, 180, 20, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(b.cx, b.cy, b.rw * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Angular purple-red blotch
    ctx.save();
    ctx.fillStyle = 'rgba(147, 51, 234, 0.85)';
    ctx.beginPath();
    ctx.moveTo(b.cx - b.rw * 0.8, b.cy - b.rh * 0.4);
    ctx.lineTo(b.cx + b.rw * 0.3, b.cy - b.rh * 0.8);
    ctx.lineTo(b.cx + b.rw * 0.8, b.cy - b.rh * 0.1);
    ctx.lineTo(b.cx + b.rw * 0.5, b.cy + b.rh * 0.7);
    ctx.lineTo(b.cx - b.rw * 0.4, b.cy + b.rh * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  return canvas.toDataURL('image/png');
}

/**
 * 6. Botrytis Blight / Gray Mold (Botrytis cinerea)
 */
export function generateBotrytisBlightLeaf() {
  const { canvas, ctx, cx } = createBaseLeafCanvas();

  const lesions = [
    { cx: cx - 30, cy: 180, rx: 55, ry: 40 },
    { cx: cx + 35, cy: 240, rx: 65, ry: 45 },
  ];

  lesions.forEach((l) => {
    // Water-soaked decayed brown
    const rot = ctx.createRadialGradient(l.cx, l.cy, 5, l.cx, l.cy, l.rx);
    rot.addColorStop(0, '#451A03');
    rot.addColorStop(0.7, '#78350F');
    rot.addColorStop(1, 'rgba(120, 53, 15, 0)');
    ctx.fillStyle = rot;
    ctx.beginPath();
    ctx.arc(l.cx, l.cy, l.rx, 0, Math.PI * 2);
    ctx.fill();

    // Fuzzy gray mold layer
    const mold = ctx.createRadialGradient(l.cx, l.cy, 2, l.cx, l.cy, l.rx * 0.7);
    mold.addColorStop(0, 'rgba(203, 213, 225, 0.85)');
    mold.addColorStop(0.6, 'rgba(148, 163, 184, 0.65)');
    mold.addColorStop(1, 'rgba(148, 163, 184, 0)');
    ctx.fillStyle = mold;
    ctx.beginPath();
    ctx.arc(l.cx, l.cy, l.rx * 0.7, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas.toDataURL('image/png');
}

/**
 * 7. Early Leaf Blight / Cercospora (Cercospora / Alternaria spp.)
 */
export function generateEarlyBlightLeaf() {
  const { canvas, ctx, cx } = createBaseLeafCanvas();

  const targets = [
    { cx: cx - 40, cy: 160, r: 28 },
    { cx: cx + 35, cy: 220, r: 34 },
    { cx: cx - 15, cy: 290, r: 22 },
  ];

  targets.forEach((t) => {
    // Yellow halo
    const halo = ctx.createRadialGradient(t.cx, t.cy, t.r * 0.8, t.cx, t.cy, t.r * 1.6);
    halo.addColorStop(0, 'rgba(234, 179, 8, 0.75)');
    halo.addColorStop(1, 'rgba(234, 179, 8, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(t.cx, t.cy, t.r * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Outer dark ring
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.arc(t.cx, t.cy, t.r, 0, Math.PI * 2);
    ctx.fill();

    // Intermediate tan ring
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.arc(t.cx, t.cy, t.r * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Inner dark ring
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.arc(t.cx, t.cy, t.r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Papery tan center
    ctx.fillStyle = '#D6B487';
    ctx.beginPath();
    ctx.arc(t.cx, t.cy, t.r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas.toDataURL('image/png');
}

/**
 * Generates all 7 sample images as key-value map
 */
export function getSampleImages() {
  return {
    'Healthy': {
      title: 'Healthy Rose Leaf',
      condition: 'Healthy',
      pathogen: 'Rosa spp. (Optimal Health)',
      dataUrl: generateHealthyLeaf(),
      badge: '🌿 Optimal Health',
    },
    'Black Spot': {
      title: 'Black Spot Infection',
      condition: 'Black Spot',
      pathogen: 'Diplocarpon rosae',
      dataUrl: generateBlackSpotLeaf(),
      badge: '⚫ Diplocarpon rosae',
    },
    'Powdery Mildew': {
      title: 'Powdery Mildew Felt',
      condition: 'Powdery Mildew',
      pathogen: 'Podosphaera pannosa',
      dataUrl: generatePowderyMildewLeaf(),
      badge: '🤍 Podosphaera pannosa',
    },
    'Rust': {
      title: 'Rose Leaf Rust',
      condition: 'Rust',
      pathogen: 'Phragmidium mucronatum',
      dataUrl: generateRustLeaf(),
      badge: '🟠 Phragmidium mucronatum',
    },
    'Downy Mildew': {
      title: 'Downy Mildew Blotches',
      condition: 'Downy Mildew',
      pathogen: 'Peronospora sparsa',
      dataUrl: generateDownyMildewLeaf(),
      badge: '🟣 Peronospora sparsa',
    },
    'Botrytis Blight': {
      title: 'Botrytis Gray Mold',
      condition: 'Botrytis Blight',
      pathogen: 'Botrytis cinerea',
      dataUrl: generateBotrytisBlightLeaf(),
      badge: '🌫️ Botrytis cinerea',
    },
    'Early Blight': {
      title: 'Early Leaf Blight',
      condition: 'Early Blight',
      pathogen: 'Cercospora / Alternaria spp.',
      dataUrl: generateEarlyBlightLeaf(),
      badge: '🎯 Cercospora / Alternaria',
    },
  };
}
