import React from 'react';
import { CheckCircle2, ArrowRight, Cpu, Layers, Eye, Crosshair, Zap } from 'lucide-react';

export default function PipelineInspector({ pipelineState }) {
  const stages = [
    {
      key: 'capture',
      label: '1. Frame Capture',
      icon: Eye,
      shape: pipelineState?.capture?.shape || '[1, 3, 224, 224] RGB',
      time: pipelineState?.capture?.time || 1.2,
      desc: '30 FPS · 1/1000s Shutter',
    },
    {
      key: 'preprocess',
      label: '2. OpenCV LAB CLAHE',
      icon: Layers,
      shape: pipelineState?.preprocess?.shape || '[1, 3, 224, 224] Float32',
      time: pipelineState?.preprocess?.time || 5.8,
      desc: 'LAB Equalize + HSV Mask',
    },
    {
      key: 'inference',
      label: '3. ONNX / PyTorch',
      icon: Cpu,
      shape: pipelineState?.inference?.shape || '[1, 5] Logits',
      time: pipelineState?.inference?.time || 28.4,
      desc: 'MobileNetV3 5-Class Head',
    },
    {
      key: 'detection',
      label: '4. Lesion Grad-CAM',
      icon: Crosshair,
      shape: pipelineState?.detection?.shape || 'BBox [x, y, w, h]',
      time: pipelineState?.detection?.time || 2.1,
      desc: 'Saliency & Area Severity',
    },
    {
      key: 'action',
      label: '5. Rover Kinematics',
      icon: Zap,
      shape: pipelineState?.action?.shape || 'Δt = d/v - t_inf',
      time: pipelineState?.action?.time || 0.4,
      desc: 'Precision Solenoid Burst',
    },
  ];

  return (
    <div className="glass-panel-elevated p-3 rounded-2xl border border-white/70 shadow-2xl backdrop-blur-md font-['Plus_Jakarta_Sans'] select-none max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Cpu size={15} className="text-cyan-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-['JetBrains_Mono']">
            AI Vision & Kinematics Pipeline Inspector
          </h2>
        </div>
        <span className="text-[11px] font-['JetBrains_Mono'] text-emerald-600 font-semibold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
          Live 30 FPS Stream
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-1.5 overflow-x-auto py-1">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          return (
            <React.Fragment key={st.key}>
              <div className="flex-1 min-w-[135px] bg-white/70 rounded-xl p-2.5 border border-slate-200/60 shadow-sm text-left">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Icon size={12} className="text-cyan-600" />
                    {st.label}
                  </span>
                  <CheckCircle2 size={12} className="text-emerald-500" />
                </div>
                <div className="text-[10px] font-['JetBrains_Mono'] text-slate-600 font-medium truncate">
                  {st.shape}
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                  <span>{st.desc}</span>
                  <span className="font-['JetBrains_Mono'] text-cyan-700 font-semibold tabular-nums">
                    {st.time}ms
                  </span>
                </div>
              </div>
              {idx < stages.length - 1 && (
                <ArrowRight size={13} className="text-slate-400 hidden sm:block flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
