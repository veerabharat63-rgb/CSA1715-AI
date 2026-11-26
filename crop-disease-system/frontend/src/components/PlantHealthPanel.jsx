import React, { useState } from 'react';
import { X, Sparkles, Syringe, HeartHandshake, RefreshCw, AlertTriangle } from 'lucide-react';
import { DISEASE_CLASSES, getDiseaseInfo } from '../data/diseaseKnowledgeBase.js';

export default function PlantHealthPanel({
  plant,
  onUpdatePlant,
  onRandomOutbreak,
  onInfectRow,
  onResetField,
  onClose,
}) {
  const [selectedDisease, setSelectedDisease] = useState(
    plant?.diseaseStatus === 'Healthy' ? 'Black Spot' : plant?.diseaseStatus || 'Black Spot'
  );
  const [severity, setSeverity] = useState(plant?.severity || 45);

  if (!plant) return null;

  const info = getDiseaseInfo(plant.diseaseStatus);

  const handleInject = () => {
    onUpdatePlant(plant.id, {
      diseaseStatus: selectedDisease,
      severity: Number(severity),
      treated: false,
    });
  };

  const handleCure = () => {
    onUpdatePlant(plant.id, {
      diseaseStatus: 'Healthy',
      severity: 0,
      treated: true,
    });
  };

  return (
    <div className="fixed top-20 right-4 w-84 sm:w-96 glass-panel-elevated rounded-2xl shadow-2xl border border-white/60 p-5 z-40 font-['Plus_Jakarta_Sans'] select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-slate-900 text-white">
              {plant.id}
            </span>
            <h2 className="text-sm font-bold text-slate-800">
              Row {plant.row + 1} · Bush {plant.col + 1}
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Plant Health & Infection Injector</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          title="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Current Status Pill */}
      <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Status</span>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: info.badgeColor }}
          >
            {info.icon} {plant.diseaseStatus}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
          <span>Observed Severity:</span>
          <span className="font-['JetBrains_Mono'] font-bold tabular-nums">
            {plant.severity}%
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
          <span>Treatment State:</span>
          <span
            className={`font-semibold ${
              plant.treated ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            {plant.treated ? '✓ Treated by Rover' : 'Untreated / Target Active'}
          </span>
        </div>
      </div>

      {/* Infection Injector Controls */}
      <div className="space-y-3 border-t border-slate-200/60 pt-3">
        <label className="block text-xs font-semibold text-slate-700">
          Select Pathology to Inject
        </label>
        <select
          value={selectedDisease}
          onChange={(e) => setSelectedDisease(e.target.value)}
          className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {DISEASE_CLASSES.filter((c) => c !== 'Healthy').map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>

        <div>
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>Infection Severity</span>
            <span className="font-['JetBrains_Mono'] font-bold text-slate-800">
              {severity}%
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="95"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full accent-cyan-600"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleInject}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-red-600/20"
          >
            <Syringe size={14} /> Inject Pathology
          </button>
          <button
            onClick={handleCure}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-600/20"
          >
            <HeartHandshake size={14} /> Cure
          </button>
        </div>
      </div>

      {/* Fast Global Demonstration Outbreak Tools */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-2">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-['JetBrains_Mono']">
          Batch Field Injectors
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={onRandomOutbreak}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            <Sparkles size={13} className="text-amber-600" /> Randomize (4)
          </button>
          <button
            onClick={onInfectRow}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            <AlertTriangle size={13} className="text-red-500" /> Infect Row
          </button>
        </div>
        <button
          onClick={onResetField}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-200/70 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
        >
          <RefreshCw size={13} /> Reset All 18 Bushes to Healthy
        </button>
      </div>
    </div>
  );
}
