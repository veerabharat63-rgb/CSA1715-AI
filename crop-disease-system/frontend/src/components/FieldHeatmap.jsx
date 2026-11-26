import React, { useRef, useEffect } from 'react';

/**
 * 2D Overhead Field Heatmap
 * Visualizes 3 rows x 6 columns grid with real-time rover marker
 */
export default function FieldHeatmap({ plants = [], roverPosition = { x: 0, z: 0 }, onSelectPlant }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Bed background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    // Grid dimensions: 3 rows, 6 cols
    const cols = 6;
    const rows = 3;
    const paddingX = 14;
    const paddingY = 12;
    const cellW = (w - paddingX * 2) / cols;
    const cellH = (h - paddingY * 2) / rows;

    // Draw rose bushes
    plants.forEach((p) => {
      const cx = paddingX + p.col * cellW + cellW / 2;
      const cy = paddingY + p.row * cellH + cellH / 2;
      const r = Math.min(cellW, cellH) * 0.36;

      let color = '#10B981'; // Green healthy
      if (p.treated) {
        color = '#3B82F6'; // Blue treated
      } else {
        switch (p.diseaseStatus) {
          case 'Black Spot':
            color = '#DC2626';
            break;
          case 'Powdery Mildew':
            color = '#94A3B8';
            break;
          case 'Rust':
            color = '#EA580C';
            break;
          case 'Chemical Burn':
            color = '#B45309';
            break;
          default:
            color = '#10B981';
        }
      }

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Bush ID
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${p.row + 1}-${p.col + 1}`, cx, cy);
    });

    // Rover Marker Position Map
    // 3D X range [-4.5, 4.5] -> 2D X [paddingX, w - paddingX]
    // 3D Z range [-2.5, 2.5] -> 2D Y [paddingY, h - paddingY]
    const roverMapX = ((roverPosition.x + 4.5) / 9.0) * (w - paddingX * 2) + paddingX;
    const roverMapY = ((roverPosition.z + 2.5) / 5.0) * (h - paddingY * 2) + paddingY;

    // Pulse beacon
    ctx.beginPath();
    ctx.arc(roverMapX, roverMapY, 9, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.fill();

    // Rover dot
    ctx.beginPath();
    ctx.arc(roverMapX, roverMapY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#06B6D4';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
  }, [plants, roverPosition]);

  return (
    <div className="glass-panel p-2.5 rounded-xl border border-white/60 shadow-lg select-none">
      <div className="flex items-center justify-between text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-slate-500 mb-1.5 px-1">
        <span>2D Field Grid Map</span>
        <span className="text-cyan-600 font-bold">● Rover Active</span>
      </div>
      <canvas
        ref={canvasRef}
        width={220}
        height={110}
        className="rounded-lg shadow-inner cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          const col = Math.min(5, Math.max(0, Math.floor((clickX - 14) / (192 / 6))));
          const row = Math.min(2, Math.max(0, Math.floor((clickY - 12) / (86 / 3))));
          const found = plants.find((p) => p.row === row && p.col === col);
          if (found && onSelectPlant) onSelectPlant(found.id);
        }}
      />
    </div>
  );
}
