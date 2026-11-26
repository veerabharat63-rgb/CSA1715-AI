import React from 'react';
import { Sun, Cloud, Sunset } from 'lucide-react';

export default function WeatherControls({ currentPreset = 'noon', onPresetChange }) {
  const presets = [
    { id: 'noon', label: 'Bright Noon', icon: Sun, desc: 'High lux sunlight' },
    { id: 'overcast', label: 'Overcast', icon: Cloud, desc: 'Diffuse low contrast' },
    { id: 'dusk', label: 'Dusk Sunset', icon: Sunset, desc: 'Golden long shadows' },
  ];

  return (
    <div className="glass-panel p-2 rounded-xl border border-white/60 shadow-lg select-none">
      <div className="flex items-center gap-1.5 mb-1.5 px-1">
        <span className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider text-slate-500 font-bold">
          Lighting Simulation (CLAHE Test)
        </span>
      </div>
      <div className="flex gap-1.5">
        {presets.map((p) => {
          const Icon = p.icon;
          const isActive = currentPreset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onPresetChange(p.id)}
              className={`
                flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                font-['Plus_Jakarta_Sans'] transition-all
                ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white/60 hover:bg-white text-slate-700 border border-slate-200/50'
                }
              `}
              title={p.desc}
            >
              <Icon size={13} className={isActive ? 'text-amber-400' : 'text-slate-500'} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
