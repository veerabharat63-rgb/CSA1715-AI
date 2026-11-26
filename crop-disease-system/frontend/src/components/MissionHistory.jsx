import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClipboardList,
  Microscope,
  Download,
  Trash2,
  Filter,
  RefreshCw,
  Droplets,
  TrendingDown,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

import {
  getMissions,
  getDiagnoses,
  getMissionsFromLocal,
  getDiagnosesFromLocal,
  clearLocalHistory,
  exportToCSV,
  exportToJSON,
} from '../services/api.js';

import { DISEASE_CLASSES, getDiseaseInfo } from '../data/diseaseKnowledgeBase.js';

export default function MissionHistory() {
  const [activeSubTab, setActiveSubTab] = useState('missions'); // 'missions' | 'diagnoses'
  const [missions, setMissions] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiseaseFilter, setSelectedDiseaseFilter] = useState('all');

  // Load history from backend API with localStorage fallback
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Missions
      let missionList = [];
      try {
        missionList = await getMissions(100);
      } catch {
        missionList = [];
      }
      if (!missionList || missionList.length === 0) {
        missionList = getMissionsFromLocal();
      }

      // 2. Diagnoses
      let diagList = [];
      try {
        diagList = await getDiagnoses(50);
      } catch {
        diagList = [];
      }
      if (!diagList || diagList.length === 0) {
        diagList = getDiagnosesFromLocal();
      }

      setMissions(missionList || []);
      setDiagnoses(diagList || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Filtered lists
  const filteredMissions = useMemo(() => {
    if (selectedDiseaseFilter === 'all') return missions;
    return missions.filter((m) => m.disease === selectedDiseaseFilter);
  }, [missions, selectedDiseaseFilter]);

  const filteredDiagnoses = useMemo(() => {
    if (selectedDiseaseFilter === 'all') return diagnoses;
    return diagnoses.filter((d) => d.prediction === selectedDiseaseFilter);
  }, [diagnoses, selectedDiseaseFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalMissions = missions.length;
    let totalChem = 0;
    let totalSaved = 0;
    missions.forEach((m) => {
      totalChem += m.dose_ml || 0;
      totalSaved += (50.0 - (m.dose_ml || 0));
    });
    const avgReduction =
      totalChem + totalSaved > 0
        ? Math.round((totalSaved / (totalChem + totalSaved)) * 1000) / 10
        : 74.5;

    return {
      totalMissions,
      totalChem: Math.round(totalChem * 10) / 10,
      totalSaved: Math.round(totalSaved * 10) / 10,
      avgReduction,
      totalDiagnoses: diagnoses.length,
    };
  }, [missions, diagnoses]);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all mission and diagnosis logs?')) {
      clearLocalHistory();
      setMissions([]);
      setDiagnoses([]);
    }
  };

  const handleExportCSV = () => {
    if (activeSubTab === 'missions') {
      exportToCSV(missions, 'cropguard_missions.csv');
    } else {
      exportToCSV(diagnoses, 'cropguard_diagnoses.csv');
    }
  };

  const handleExportJSON = () => {
    if (activeSubTab === 'missions') {
      exportToJSON(missions, 'cropguard_missions.json');
    } else {
      exportToJSON(diagnoses, 'cropguard_diagnoses.json');
    }
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans'] select-none">
      {/* ── Title & Actions Header ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              Mission &amp; Diagnosis History
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Persistent field operations log and leaf diagnostic records backed by SQLite database with localStorage fallback.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 shadow-sm transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 shadow-sm transition-all"
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 shadow-sm transition-all"
          >
            <Download size={13} /> Export JSON
          </button>
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold border border-red-200 transition-all"
          >
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      {/* ── Summary Statistics Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-white/60 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-['JetBrains_Mono']">
            Autonomous Missions
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-['JetBrains_Mono'] text-slate-800 tabular-nums">
              {stats.totalMissions}
            </span>
            <span className="text-xs text-slate-500">Events Logged</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/60 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-['JetBrains_Mono']">
            Chemical Applied
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-['JetBrains_Mono'] text-emerald-700 tabular-nums">
              {stats.totalChem} <span className="text-xs font-normal">mL</span>
            </span>
            <span className="text-xs text-emerald-600">Precision Dosed</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/60 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-['JetBrains_Mono']">
            Pesticide Reduction
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-['JetBrains_Mono'] text-indigo-700 tabular-nums">
              {stats.avgReduction}%
            </span>
            <span className="text-xs text-indigo-600">vs Blanket Spray</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/60 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-['JetBrains_Mono']">
            Farmer Leaf Diagnoses
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-['JetBrains_Mono'] text-slate-800 tabular-nums">
              {stats.totalDiagnoses}
            </span>
            <span className="text-xs text-slate-500">Images Evaluated</span>
          </div>
        </div>
      </div>

      {/* ── Sub-Tab Switcher & Filter ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('missions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'missions'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
            }`}
          >
            <ClipboardList size={14} /> Engine 1: Rover Spray Missions ({missions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('diagnoses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'diagnoses'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
            }`}
          >
            <Microscope size={14} /> Engine 2: Leaf Doctor Logs ({diagnoses.length})
          </button>
        </div>

        {/* Disease Filter */}
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-slate-400" />
          <select
            value={selectedDiseaseFilter}
            onChange={(e) => setSelectedDiseaseFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Conditions</option>
            {DISEASE_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Sub-Tab 1: Mission Log Table ─────────────────────────── */}
      {activeSubTab === 'missions' && (
        <div className="glass-panel rounded-2xl border border-white/60 shadow-xl overflow-hidden">
          {filteredMissions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold text-slate-700">No Mission Logs Recorded Yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Activate autonomous patrol in Engine 1 to detect infected bushes and log precision spraying missions.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-['Plus_Jakarta_Sans']">
                <thead className="bg-slate-100/80 text-slate-500 font-['JetBrains_Mono'] uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Bush ID</th>
                    <th className="py-3 px-4">Pathology</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Precision Dose</th>
                    <th className="py-3 px-4">Chemical Saved</th>
                    <th className="py-3 px-4">Inference Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 font-['JetBrains_Mono']">
                  {filteredMissions.map((m, idx) => {
                    const info = getDiseaseInfo(m.disease);
                    return (
                      <tr key={m.id || idx} className="hover:bg-white/60 transition-colors">
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {new Date(m.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {m.plant_id || `R${m.row}-C${m.col}`}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white"
                            style={{ backgroundColor: info.badgeColor }}
                          >
                            {info.icon} {m.disease}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700 tabular-nums">
                          {m.severity}%
                        </td>
                        <td className="py-3 px-4 font-bold text-cyan-800 tabular-nums">
                          {m.dose_ml} mL
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-700 tabular-nums">
                          {m.chemical_saved_pct}%
                        </td>
                        <td className="py-3 px-4 text-slate-500 tabular-nums">
                          {m.inference_ms || 31.4} ms
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Sub-Tab 2: Diagnosis History Grid ────────────────────── */}
      {activeSubTab === 'diagnoses' && (
        <div>
          {filteredDiagnoses.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl text-center text-slate-400">
              <Microscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold text-slate-700">No Leaf Diagnoses Saved Yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Upload or capture rose leaf imagery in Engine 2 to run the vision pipeline and save diagnostic advisories.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDiagnoses.map((d, idx) => {
                const info = getDiseaseInfo(d.prediction);
                return (
                  <div
                    key={d.id || idx}
                    className="glass-panel rounded-2xl border border-white/60 shadow-md p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{d.prediction}</h4>
                          <span className="text-[10px] text-slate-400 font-['JetBrains_Mono']">
                            {new Date(d.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: info.badgeColor }}
                      >
                        {d.confidence}%
                      </span>
                    </div>

                    {d.gradcam_data_url && (
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                        <img
                          src={d.gradcam_data_url}
                          alt="Grad-CAM"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                      {d.advice || info.summary}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-slate-500 pt-1">
                      <span>Affected: {d.severity}%</span>
                      <span>BBox: [{d.bbox ? d.bbox.join(',') : '0,0,0,0'}]</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
