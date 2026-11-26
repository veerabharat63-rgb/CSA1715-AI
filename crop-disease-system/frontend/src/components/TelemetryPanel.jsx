import React, { useState } from 'react';
import {
  Gauge,
  Timer,
  Droplets,
  ShieldCheck,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  BatteryCharging,
  Zap,
  RotateCcw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export default function TelemetryPanel({
  roverState,
  missionStats,
  inferenceTime = 31.4,
  countdown = null,
  roverSpeed = 0.5,
  nozzleOffset = 0.8,
  roverTelemetry = {},
  activeProcessStatus = '',
  onTriggerRTH,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Extracted telemetry metrics with defaults
  const tankVolume = roverTelemetry.tankVolume ?? 1200;
  const tankPct = roverTelemetry.tankPct ?? 100;
  const batteryLevel = roverTelemetry.batteryLevel ?? 98;
  const vraTier = roverTelemetry.vraTier ?? 'Healthy';
  const pwmPulseMs = roverTelemetry.pwmPulseMs ?? 0;
  const currentDoseMl = roverTelemetry.currentDoseMl ?? 0;
  const isRTH = roverTelemetry.isRTH ?? false;
  const rthRefillDisplayPct = roverTelemetry.rthRefillDisplayPct ?? 0;
  const patrolState = roverTelemetry.patrolState ?? 'IDLE';

  // Countdown color alert
  const countdownColor =
    countdown === null
      ? 'text-slate-400'
      : countdown < 0.3
      ? 'text-red-500 animate-pulse font-bold'
      : countdown < 1.0
      ? 'text-amber-500 font-bold'
      : 'text-cyan-400';

  // VRA tier styling badge
  const getVraBadge = (tier) => {
    switch (tier) {
      case 'Mild':
        return { label: 'MILD (5.5 mL · 14ms PWM)', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' };
      case 'Moderate':
        return { label: 'MODERATE (10.5 mL · 26ms PWM)', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' };
      case 'Severe':
        return { label: 'SEVERE (14.5 mL · 36ms PWM)', color: 'bg-red-500/20 text-red-400 border-red-500/50' };
      case 'Healthy':
      default:
        return { label: 'HEALTHY (0.0 mL · 0ms PWM)', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' };
    }
  };

  const vraBadge = getVraBadge(vraTier);

  return (
    <div className="w-full glass-panel rounded-2xl shadow-xl border border-white/60 p-4 font-['Plus_Jakarta_Sans'] select-none">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-xs uppercase font-bold tracking-wider text-slate-700 font-['JetBrains_Mono']">
            Autonomous Telemetry &amp; VRA
          </h2>
        </div>
        <button
          onClick={() => setIsCollapsed((c) => !c)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-3 font-['JetBrains_Mono'] text-xs">
          {/* Real-Time Rover Process Pipeline Strip */}
          {activeProcessStatus && (
            <div className="bg-slate-950/90 text-white rounded-xl p-2.5 border border-cyan-500/40 shadow-sm">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  Active Rover Action
                </span>
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                  {patrolState}
                </span>
              </div>
              <div className="text-[11px] font-bold text-slate-200 leading-snug line-clamp-2">
                {activeProcessStatus}
              </div>
            </div>
          )}

          {/* Kinematic Look-Ahead Countdown Block */}
          <div className="bg-slate-900/90 text-white rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Timer size={13} className="text-cyan-400" />
                Look-Ahead Δt
              </span>
              <span className="text-[10px] text-slate-500">d/v - t_inf</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-bold tabular-nums ${countdownColor}`}>
                {countdown !== null ? `${countdown.toFixed(2)}s` : '--'}
              </span>
              <span className="text-[11px] text-slate-400">
                {countdown !== null && countdown <= 0.2 ? 'TARGET IN NOZZLE' : 'STANDBY'}
              </span>
            </div>
          </div>

          {/* Hardware Status: 48V LiFePO4 & Chemical Tank */}
          <div className="bg-slate-900/90 text-white rounded-xl p-3 border border-slate-800 space-y-2.5">
            {/* Battery */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <BatteryCharging size={13} className="text-emerald-400" />
                  48V LiFePO4 Power
                </span>
                <span className="font-bold text-emerald-400 tabular-nums">
                  {batteryLevel}% · 51.2V
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    batteryLevel > 30 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                  }`}
                  style={{ width: `${batteryLevel}%` }}
                />
              </div>
            </div>

            {/* Chemical Tank Level */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Droplets size={13} className="text-cyan-400" />
                  Bio-Fungicide Tank
                </span>
                <span className="font-bold text-cyan-300 tabular-nums">
                  {tankVolume} mL ({tankPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    tankPct > 20
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-400'
                      : 'bg-red-500 animate-pulse'
                  }`}
                  style={{ width: `${tankPct}%` }}
                />
              </div>
            </div>

            {/* Return to Home (RTH) Auto-Refill Trigger / Status */}
            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between gap-2">
              {isRTH ? (
                <div className="w-full bg-cyan-950/80 border border-cyan-500/60 p-2 rounded-lg text-center">
                  <div className="text-[10px] font-bold text-cyan-300 flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    Dock Refill Active ({rthRefillDisplayPct}%)
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-200"
                      style={{ width: `${rthRefillDisplayPct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={onTriggerRTH}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-cyan-500/30 text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  title="Simulate low chemical tank and test autonomous Return-to-Home auto-refill sequence"
                >
                  <RotateCcw size={12} className="text-cyan-400" />
                  <span>Simulate Low Tank (RTH Dock)</span>
                </button>
              )}
            </div>
          </div>

          {/* Variable-Rate Micro-Dosing (VRA) Metrics */}
          <div className="bg-white/70 rounded-xl p-2.5 border border-slate-200/60 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500">
              <span className="flex items-center gap-1 text-slate-700">
                <Sparkles size={12} className="text-amber-500" />
                VRA Micro-Dosing Mode
              </span>
              <span className="text-[9px] font-normal text-slate-400">PWM Solenoid</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${vraBadge.color}`}>
                {vraBadge.label}
              </span>
              <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                {pwmPulseMs > 0 ? `${pwmPulseMs}ms` : '0ms Locked'}
              </span>
            </div>
          </div>

          {/* Grid of Key Kinematic Metrics */}
          <div className="grid grid-cols-2 gap-2">
            {/* Speed */}
            <div className="bg-white/60 rounded-xl p-2.5 border border-slate-200/50">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-semibold mb-1">
                <Gauge size={12} className="text-emerald-600" />
                Velocity
              </div>
              <div className="text-base font-bold text-slate-800 tabular-nums">
                {roverSpeed.toFixed(1)} <span className="text-xs font-normal text-slate-400">m/s</span>
              </div>
            </div>

            {/* Nozzle Offset */}
            <div className="bg-white/60 rounded-xl p-2.5 border border-slate-200/50">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-semibold mb-1">
                <Layers size={12} className="text-cyan-600" />
                Nozzle Offset
              </div>
              <div className="text-base font-bold text-slate-800 tabular-nums">
                {nozzleOffset.toFixed(2)} <span className="text-xs font-normal text-slate-400">m</span>
              </div>
            </div>

            {/* Inference Latency */}
            <div className="bg-white/60 rounded-xl p-2.5 border border-slate-200/50">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-semibold mb-1">
                <Activity size={12} className="text-indigo-600" />
                Inference
              </div>
              <div className="text-base font-bold text-slate-800 tabular-nums">
                {inferenceTime.toFixed(1)} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
            </div>

            {/* Plants Scanned */}
            <div className="bg-white/60 rounded-xl p-2.5 border border-slate-200/50">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-semibold mb-1">
                <ShieldCheck size={12} className="text-emerald-600" />
                Canopy Scanned
              </div>
              <div className="text-base font-bold text-slate-800 tabular-nums">
                {missionStats.plantsScanned} <span className="text-xs font-normal text-slate-400">/ 18</span>
              </div>
            </div>
          </div>

          {/* Chemical Conservation Bar */}
          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-3">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-emerald-900 font-semibold flex items-center gap-1.5">
                <Droplets size={13} className="text-emerald-600" />
                Chemical Savings
              </span>
              <span className="text-emerald-700 font-bold tabular-nums">
                {missionStats.reductionPct || 82.4}% saved
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-emerald-200/60 rounded-full h-2 mb-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(10, missionStats.reductionPct || 82.4))}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-emerald-800">
              <span>Applied: {missionStats.chemicalUsed || 0} mL</span>
              <span>Saved: {missionStats.chemicalSaved || 0} mL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
