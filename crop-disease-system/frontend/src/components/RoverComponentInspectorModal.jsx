import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Layers,
  Activity,
  Zap,
  Shield,
  Radio,
  ChevronRight,
  RotateCcw,
  Sliders,
  CheckCircle2,
  X,
  Gauge,
  Info,
  Wrench,
  Compass,
  FileText,
  Droplets,
} from 'lucide-react';
import { ROVER_COMPONENTS } from '../data/roverComponents.js';

export default function RoverComponentInspectorModal({
  isOpen,
  selectedPartId,
  onSelectPart,
  onAssembleAndResume,
}) {
  if (!isOpen) return null;

  const currentPart =
    ROVER_COMPONENTS.find((p) => p.id === selectedPartId) || ROVER_COMPONENTS[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 120 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 120 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="absolute bottom-0 left-0 right-0 z-50 max-h-[38%] bg-slate-950/95 backdrop-blur-2xl border-t-2 border-cyan-500/50 rounded-t-3xl shadow-[0_-15px_50px_rgba(0,0,0,0.85)] flex flex-col text-white overflow-hidden pointer-events-auto select-none"
        style={{ zIndex: 50 }}
      >
        {/* Subtle Ambient Accent Glow */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: currentPart.color }}
        />

        {/* ── Compact Top Strip ── */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm border shadow-inner"
              style={{
                backgroundColor: `${currentPart.color}25`,
                borderColor: `${currentPart.color}80`,
              }}
            >
              {currentPart.icon}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                {currentPart.partNumber}
              </span>
              <span className="text-slate-600 font-mono">·</span>
              <h3 className="text-xs sm:text-sm font-black text-white font-['Plus_Jakarta_Sans'] truncate max-w-[280px] sm:max-w-md">
                {currentPart.name}
              </h3>
              <span className="hidden sm:inline-block text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                {currentPart.keySpec}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAssembleAndResume}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer transition-all shrink-0"
              title="Assemble Rover and Resume Autonomous Field Patrol"
            >
              <RotateCcw size={12} className="fill-current" />
              <span>Assemble & Resume</span>
            </button>
            <button
              onClick={onAssembleAndResume}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-800"
              title="Close Inspector"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── 3-Column Docked Layout (Selector Grid | Mission Proof & Mechanics | Engineering Specs) ── */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 p-3 overflow-hidden text-xs">
          {/* Col 1: 4×2 Assembly Selector Grid + Telemetry (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <span>8-Part Sub-Assembly Selector:</span>
              <span className="text-cyan-400 font-bold">
                {ROVER_COMPONENTS.findIndex((p) => p.id === currentPart.id) + 1} / 8
              </span>
            </div>

            {/* Clean 4×2 Grid without text truncation */}
            <div className="grid grid-cols-4 gap-1.5">
              {ROVER_COMPONENTS.map((part) => {
                const isSelected = part.id === currentPart.id;
                return (
                  <button
                    key={part.id}
                    onClick={() => onSelectPart(part.id)}
                    className={`py-1.5 px-1 rounded-xl text-center transition-all border flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-cyan-950/95 border-cyan-400 text-white ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)] scale-[1.02]'
                        : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    title={part.name}
                  >
                    <span className="text-xs leading-none">{part.icon}</span>
                    <span className="block text-[8px] font-mono font-bold leading-tight truncate max-w-full">
                      {part.shortName}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live Telemetry Mini-Strip */}
            <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800/80 flex-1 flex flex-col justify-between">
              <div className="text-[9px] font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Activity size={11} className="text-amber-400" />
                Live Sensor Telemetry
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                {Object.entries(currentPart.liveTelemetry).slice(0, 4).map(([k, v], idx) => (
                  <div key={idx} className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800/80 truncate">
                    <span className="text-slate-500 uppercase block text-[8px] truncate">{k}</span>
                    <span className="text-amber-300 font-bold truncate block">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Col 2: Liquid Reduction Proof & Signal Flow (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
            {/* Highlighted Proof: How It Reduces Liquid */}
            <div className="bg-gradient-to-r from-emerald-950/85 to-cyan-950/85 rounded-xl p-2.5 border border-emerald-500/40 shadow-inner space-y-1">
              <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Droplets size={12} className="text-emerald-400 animate-pulse" />
                Selective Spraying Proof (How It Saves 78–84% Chemicals)
              </h4>
              <p className="text-[10px] text-emerald-100/90 leading-relaxed font-sans font-medium">
                {currentPart.howItReducesLiquid}
              </p>
            </div>

            {/* Working Mechanism & Signal Flow */}
            <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80 space-y-1 flex-1">
              <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Zap size={12} className="text-amber-400" />
                Working Mechanism &amp; Signal Flow
              </h4>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                {currentPart.howItWorks}
              </p>
            </div>
          </div>

          {/* Col 3: Hardware Configuration & Engineering Specs (3 cols) */}
          <div className="md:col-span-3 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
            <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80 space-y-1.5 flex-1">
              <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Sliders size={12} className="text-cyan-400" />
                Hardware Configuration &amp; Specs
              </h4>
              <div className="space-y-1">
                {currentPart.hardwareSpecs.map((spec, spIdx) => (
                  <div
                    key={spIdx}
                    className="p-1 rounded bg-slate-950/70 border border-slate-800/80 text-[9px] font-mono flex items-start justify-between gap-1"
                  >
                    <span className="text-slate-400 shrink-0">{spec.label}:</span>
                    <span className="text-slate-200 font-bold text-right truncate">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
