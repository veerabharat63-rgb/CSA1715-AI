import React from 'react';
import { Play, Pause, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Compass } from 'lucide-react';

export default function RoverControls({
  isAutonomous,
  speed = 0.5,
  nozzleOffset = 0.8,
  onToggleAutonomous,
  onManualMove,
  onSpeedChange,
  onOffsetChange,
}) {
  return (
    <div className="w-full glass-panel p-3.5 rounded-2xl border border-white/60 shadow-xl select-none font-['Plus_Jakarta_Sans']">
      {/* Autonomous Row Patrol Toggle */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-['JetBrains_Mono']">
          Rover Navigation
        </span>
        <button
          onClick={onToggleAutonomous}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-md
            ${
              isAutonomous
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
            }
          `}
        >
          {isAutonomous ? (
            <>
              <Pause size={13} /> Pause Patrol
            </>
          ) : (
            <>
              <Play size={13} /> Auto Patrol
            </>
          )}
        </button>
      </div>

      {/* Speed & Nozzle Offset Sliders */}
      <div className="space-y-2.5 text-xs text-slate-600 font-medium border-t border-slate-200/60 pt-2.5">
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span>Patrol Speed:</span>
            <span className="font-['JetBrains_Mono'] font-bold text-slate-800 tabular-nums">
              {speed.toFixed(1)} m/s
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.5"
            step="0.1"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span>Camera-to-Nozzle Offset:</span>
            <span className="font-['JetBrains_Mono'] font-bold text-slate-800 tabular-nums">
              {nozzleOffset.toFixed(2)} m
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={nozzleOffset}
            onChange={(e) => onOffsetChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Manual D-Pad Controls */}
      {!isAutonomous && (
        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-['JetBrains_Mono'] uppercase tracking-wider mb-2">
            Manual Controls (WASD / Arrows)
          </span>
          <div className="grid grid-cols-3 gap-1.5 w-32">
            <div />
            <button
              onMouseDown={() => onManualMove('up')}
              className="p-2 bg-white/80 hover:bg-white text-slate-700 rounded-lg shadow-sm flex items-center justify-center active:scale-95 transition-all"
              title="Forward (W / Up)"
            >
              <ArrowUp size={16} />
            </button>
            <div />
            <button
              onMouseDown={() => onManualMove('left')}
              className="p-2 bg-white/80 hover:bg-white text-slate-700 rounded-lg shadow-sm flex items-center justify-center active:scale-95 transition-all"
              title="Left (A / Left)"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center justify-center">
              <Compass size={16} className="text-slate-400" />
            </div>
            <button
              onMouseDown={() => onManualMove('right')}
              className="p-2 bg-white/80 hover:bg-white text-slate-700 rounded-lg shadow-sm flex items-center justify-center active:scale-95 transition-all"
              title="Right (D / Right)"
            >
              <ArrowRight size={16} />
            </button>
            <div />
            <button
              onMouseDown={() => onManualMove('down')}
              className="p-2 bg-white/80 hover:bg-white text-slate-700 rounded-lg shadow-sm flex items-center justify-center active:scale-95 transition-all"
              title="Reverse (S / Down)"
            >
              <ArrowDown size={16} />
            </button>
            <div />
          </div>
        </div>
      )}
    </div>
  );
}
