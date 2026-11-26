import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, Video, Sparkles, Filter, Layers } from 'lucide-react';
import { getCropPrescription } from '../data/prescriptions.js';

export default function RobotCameraHUD({
  visionResult,
  viewMode = 'raw',
  onViewModeChange,
  isScanning = true,
  fps = 30,
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const canvasRef = useRef(null);

  const predictedClass = visionResult?.predictedClass || 'Scanning...';
  const confidence = visionResult?.confidence || 0;
  const severity = visionResult?.severityPercentage || 0;
  const inferenceMs = visionResult?.inferenceTimeMs || 31.4;
  const bbox = visionResult?.bbox || [0, 0, 0, 0];
  const prescription = getCropPrescription(predictedClass);

  // Draw HUD frame onto internal canvas for high-fps overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // If we have an active image stage from visionResult
    const currentImgUrl =
      viewMode === 'clahe'
        ? visionResult?.stages?.clahe
        : viewMode === 'mask'
        ? visionResult?.stages?.mask
        : visionResult?.stages?.raw;

    if (currentImgUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, w, h);

        // Draw detection box if infected
        if (predictedClass !== 'Healthy' && predictedClass !== 'Scanning...' && bbox[2] > 0) {
          const [bx, by, bw, bh] = bbox;
          const scaleX = w / 224;
          const scaleY = h / 224;

          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(bx * scaleX, by * scaleY, bw * scaleX, bh * scaleY);

          ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.fillRect(bx * scaleX, Math.max(0, by * scaleY - 18), 100, 18);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`${predictedClass} ${confidence}%`, bx * scaleX + 4, Math.max(12, by * scaleY - 5));
        }
      };
      img.src = currentImgUrl;
    } else {
      // Procedural fallback feed
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, w, h);

      // Central crosshair reticle
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 20, h / 2);
      ctx.lineTo(w / 2 + 20, h / 2);
      ctx.moveTo(w / 2, h / 2 - 20);
      ctx.lineTo(w / 2, h / 2 + 20);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 28, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [visionResult, viewMode, predictedClass, confidence, bbox]);

  return (
    <div
      className={`
        w-full bg-slate-950/90 text-slate-100 rounded-2xl border border-cyan-500/30
        shadow-2xl shadow-cyan-950/40 backdrop-blur-md overflow-hidden transition-all duration-200
        ${isMinimized ? 'h-12' : ''}
      `}
    >
      {/* HUD Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isScanning ? 'bg-cyan-400' : 'bg-slate-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isScanning ? 'bg-cyan-500' : 'bg-slate-500'
              }`}
            />
          </span>
          <span className="font-['JetBrains_Mono'] uppercase tracking-wider text-[11px] font-semibold text-cyan-400">
            Rover Cam 01 · 1/1000s
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-['JetBrains_Mono'] text-slate-400">
          <span className="tabular-nums text-emerald-400">{fps} FPS</span>
          <button
            onClick={() => setIsMinimized((m) => !m)}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 transition-colors"
            title={isMinimized ? 'Expand HUD' : 'Minimize HUD'}
          >
            {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Main Camera Feed Screen */}
          <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={320}
              height={240}
              className="w-full h-full object-cover"
            />

            {/* Corner Bracket Reticles */}
            <div className="absolute inset-2 pointer-events-none">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400/80" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400/80" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400/80" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400/80" />
            </div>

            {/* Optical Scanline Grid Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40" />

            {/* Live Diagnosis Pill Overlay */}
            <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/10 text-xs font-['JetBrains_Mono']">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Condition
                  </span>
                  <span
                    className={`font-semibold ${
                      predictedClass === 'Healthy'
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {prescription.icon} {prescription.disease || predictedClass}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Confidence / Latency
                  </span>
                  <span className="tabular-nums font-semibold text-cyan-300">
                    {confidence}% · {inferenceMs}ms
                  </span>
                </div>
              </div>

              {predictedClass !== 'Scanning...' && (
                <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                  <span className="italic text-slate-400 truncate max-w-[150px]">{prescription.scientificName}</span>
                  <span className={predictedClass === 'Healthy' ? 'text-emerald-300' : 'text-amber-300 font-semibold'}>
                    {predictedClass === 'Healthy' ? '0.0 mL Runoff' : `${prescription.doseMl} mL Rx`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mode Switching Tabs (Raw RGB / CLAHE / HSV Mask) */}
          <div className="flex border-t border-slate-800 bg-slate-950 p-1.5 gap-1 text-[11px] font-['JetBrains_Mono']">
            <button
              onClick={() => onViewModeChange('raw')}
              className={`flex-1 py-1 px-2 rounded text-center transition-all ${
                viewMode === 'raw'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw RGB
            </button>
            <button
              onClick={() => onViewModeChange('clahe')}
              className={`flex-1 py-1 px-2 rounded text-center transition-all ${
                viewMode === 'clahe'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CLAHE Fix
            </button>
            <button
              onClick={() => onViewModeChange('mask')}
              className={`flex-1 py-1 px-2 rounded text-center transition-all ${
                viewMode === 'mask'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              HSV Mask
            </button>
          </div>
        </>
      )}
    </div>
  );
}
