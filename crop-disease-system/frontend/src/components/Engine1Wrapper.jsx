import React, { useState, useCallback, useRef, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Settings,
  Eye,
  Map,
  Cpu,
  RotateCcw,
  Crosshair,
  Zap,
  Activity,
  Sliders,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Volume2,
} from 'lucide-react';
import { getCropPrescription, calculateVRADose, calculateEconomicROI } from '../data/prescriptions.js';

const FieldSimulation3D = React.lazy(() => import('./FieldSimulation3D'));
const RobotCameraHUD = React.lazy(() => import('./RobotCameraHUD'));
const TelemetryPanel = React.lazy(() => import('./TelemetryPanel'));
const FieldHeatmap = React.lazy(() => import('./FieldHeatmap'));
const PipelineInspector = React.lazy(() => import('./PipelineInspector'));
const WeatherControls = React.lazy(() => import('./WeatherControls'));
const WokwiHardwareLinkModal = React.lazy(() => import('./WokwiHardwareLinkModal'));
const RoverComponentInspectorModal = React.lazy(() => import('./RoverComponentInspectorModal'));

const CROPS = [
  { id: 'rose', name: 'Rose Garden', icon: '🌹', desc: 'Rosa spp. Cuticle Foliage' },
  { id: 'tomato', name: 'Tomato Plants', icon: '🍅', desc: 'Solanum lycopersicum Vines' },
  { id: 'banana', name: 'Banana Orchard Trees', icon: '🍌', desc: 'Musa spp. Tropical Broadleaf' },
  { id: 'maize', name: 'Maize / Seed Crops', icon: '🌽', desc: 'Zea mays Corn Stalks' },
];

const DISEASES = [
  {
    id: 'Healthy',
    label: 'Healthy Leaf',
    color: '#10B981',
    bgColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    borderColor: 'border-emerald-500',
    icon: '🌿',
  },
  {
    id: 'Black Spot',
    label: 'Black Spot',
    color: '#EF4444',
    bgColor: 'bg-red-600 hover:bg-red-500 text-white',
    borderColor: 'border-red-500',
    icon: '⚫',
  },
  {
    id: 'Powdery Mildew',
    label: 'Powdery Mildew',
    color: '#F59E0B',
    bgColor: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    borderColor: 'border-amber-400',
    icon: '🤍',
  },
  {
    id: 'Rust',
    label: 'Leaf Rust',
    color: '#EA580C',
    bgColor: 'bg-orange-600 hover:bg-orange-500 text-white',
    borderColor: 'border-orange-500',
    icon: '🟠',
  },
  {
    id: 'Downy Mildew',
    label: 'Downy Mildew',
    color: '#9333EA',
    bgColor: 'bg-purple-600 hover:bg-purple-500 text-white',
    borderColor: 'border-purple-500',
    icon: '🟣',
  },
  {
    id: 'Botrytis Blight',
    label: 'Botrytis Mold',
    color: '#64748B',
    bgColor: 'bg-slate-600 hover:bg-slate-500 text-white',
    borderColor: 'border-slate-400',
    icon: '🌫️',
  },
  {
    id: 'Early Blight',
    label: 'Early Blight',
    color: '#D97706',
    bgColor: 'bg-amber-700 hover:bg-amber-600 text-white',
    borderColor: 'border-amber-600',
    icon: '🎯',
  },
];

const INITIAL_PLANTS = Array.from({ length: 18 }, (_, i) => ({
  id: `R${Math.floor(i / 6) + 1}-C${(i % 6) + 1}`,
  row: Math.floor(i / 6),
  col: i % 6,
  diseaseStatus: 'Healthy',
  severity: 0,
  treated: false,
  sprayTimestamp: null,
}));

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Engine1Wrapper() {
  const [plants, setPlants] = useState(INITIAL_PLANTS);
  const [cropType, setCropType] = useState('rose');
  const [selectedDisease, setSelectedDisease] = useState('Black Spot');
  const [selectedPlantId, setSelectedPlantId] = useState(null);

  const [isAutonomous, setIsAutonomous] = useState(false);
  const [roverSpeed, setRoverSpeed] = useState(0.5);
  const [nozzleOffset, setNozzleOffset] = useState(0.8);
  const [weatherPreset, setWeatherPreset] = useState('noon');
  const [viewMode, setViewMode] = useState('raw');

  // Sidebar & Hardware Toggles
  const [showHUD, setShowHUD] = useState(true);
  const [showTelemetry, setShowTelemetry] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);
  const [showWokwiModal, setShowWokwiModal] = useState(false);
  const [wokwiConnected, setWokwiConnected] = useState(false);

  const [roverState, setRoverState] = useState({
    position: { x: -4.8, z: -2.2 },
    currentRow: 0,
    heading: 0,
    isMoving: false,
  });

  const [visionResult, setVisionResult] = useState(null);
  const [inferenceTime, setInferenceTime] = useState(29.4);
  const [countdown, setCountdown] = useState(null);
  const [fps, setFps] = useState(30);
  const [isSprayingActive, setIsSprayingActive] = useState(false);
  const [missionCompleteSummary, setMissionCompleteSummary] = useState(null);
  const [cameraPreset, setCameraPreset] = useState('orbit');
  const [smartHudFocus, setSmartHudFocus] = useState(true);

  // 3D Exploded Rover Inspector State
  const [isInspectRover, setIsInspectRover] = useState(false);
  const [selectedRoverPart, setSelectedRoverPart] = useState('multispectral_gimbal');

  // Press Escape to assemble rover and resume patrol
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isInspectRover) {
        setIsInspectRover(false);
        setIsAutonomous(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInspectRover]);

  const [missionStats, setMissionStats] = useState({
    chemicalUsed: 0,
    chemicalSaved: 0,
    reductionPct: 0,
    plantsScanned: 0,
    diseasesFound: 0,
    plantsTreated: 0,
    missionCount: 0,
  });

  // Rover Return-to-Home (RTH), Process Status, Telemetry & Economic ROI State
  const [triggerRTH, setTriggerRTH] = useState(false);
  const [activeProcessStatus, setActiveProcessStatus] = useState(
    'STANDBY ➔ Rover Docked at Home Base (Ready for Autonomous Patrol)'
  );
  const [roverTelemetry, setRoverTelemetry] = useState({
    tankVolume: 1200,
    tankPct: 100,
    batteryLevel: 98,
    vraTier: 'Healthy',
    pwmPulseMs: 0,
    currentDoseMl: 0,
    isRTH: false,
    rthRefillDisplayPct: 0,
    patrolState: 'IDLE',
  });
  const [showROIModal, setShowROIModal] = useState(false);
  const [speakingLang, setSpeakingLang] = useState(null);

  const speakAdvisory = useCallback((text, langCode = 'en-US', langLabel = 'en') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (speakingLang === langLabel) {
      setSpeakingLang(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.92;
    utterance.onend = () => setSpeakingLang(null);
    utterance.onerror = () => setSpeakingLang(null);
    setSpeakingLang(langLabel);
    window.speechSynthesis.speak(utterance);
  }, [speakingLang]);

  const [pipelineState, setPipelineState] = useState({
    capture: { status: 'idle', time: 0, shape: null },
    preprocess: { status: 'idle', time: 0, shape: null },
    inference: { status: 'idle', time: 0, shape: null },
    detection: { status: 'idle', time: 0, shape: null },
    action: { status: 'idle', time: 0, shape: null },
  });

  const missionLogRef = useRef([]);

  // Live count of untreated infected crops
  const infectedCount = useMemo(
    () => plants.filter((p) => p.diseaseStatus !== 'Healthy' && !p.treated).length,
    [plants]
  );
  const treatedCount = useMemo(
    () => plants.filter((p) => p.treated).length,
    [plants]
  );

  /* ── Manual Infection Handler ───────────────────────────────────────── */
  const handleInfectPlant = useCallback((plantId, forcedDisease = null) => {
    const diseaseToApply = forcedDisease || selectedDisease;
    const isCure = diseaseToApply === 'Healthy';

    setPlants((prev) =>
      prev.map((p) => {
        if (p.id === plantId) {
          return {
            ...p,
            diseaseStatus: diseaseToApply,
            severity: isCure ? 0 : 25 + Math.floor(Math.random() * 60),
            treated: false,
            sprayTimestamp: null,
          };
        }
        return p;
      })
    );
    setSelectedPlantId(plantId);
  }, [selectedDisease]);

  /* ── 3D Canvas Click Handler: Selects Crop for Live Inspector Card ── */
  const handle3DPlantSelect = useCallback((plantId) => {
    setSelectedPlantId(plantId);
  }, []);

  /* ── Quick Outbreak Actions ─────────────────────────────────────────── */
  const handleRandomOutbreak = useCallback(() => {
    // 6 distinct agricultural diseases
    const sickDiseases = [
      'Black Spot',
      'Powdery Mildew',
      'Rust',
      'Downy Mildew',
      'Botrytis Blight',
      'Early Blight',
    ];
    // Shuffle so 4 different diseases are picked
    const shuffled = [...sickDiseases].sort(() => Math.random() - 0.5);

    setPlants((prev) => {
      const copy = prev.map((p) => ({ ...p }));
      const indices = [];
      while (indices.length < 4) {
        const idx = Math.floor(Math.random() * 18);
        if (!indices.includes(idx)) indices.push(idx);
      }
      indices.forEach((idx, i) => {
        const assignedDisease = shuffled[i % shuffled.length];
        copy[idx].diseaseStatus = assignedDisease;
        copy[idx].severity = 32 + Math.floor(Math.random() * 50);
        copy[idx].treated = false;
        copy[idx].sprayTimestamp = null;
      });
      return copy;
    });
  }, []);

  const handleResetAllHealthy = useCallback(() => {
    setPlants(INITIAL_PLANTS.map((p) => ({ ...p })));
    setMissionStats({
      chemicalUsed: 0,
      chemicalSaved: 0,
      reductionPct: 0,
      plantsScanned: 0,
      diseasesFound: 0,
      plantsTreated: 0,
      missionCount: 0,
    });
    setIsAutonomous(false);
    setMissionCompleteSummary(null);
    setIsSprayingActive(false);
  }, []);

  /* ── Mission Logger & Telemetry Aggregator ──────────────────────────── */
  const handleMissionLog = useCallback((mission) => {
    missionLogRef.current.push(mission);
    setMissionStats((prev) => {
      const blanketDose = 50.0;
      const newChemUsed = prev.chemicalUsed + mission.dose_ml;
      const newSaved = prev.chemicalSaved + (blanketDose - mission.dose_ml);
      const totalMissions = prev.missionCount + 1;
      return {
        chemicalUsed: Math.round(newChemUsed * 10) / 10,
        chemicalSaved: Math.round(newSaved * 10) / 10,
        reductionPct: Math.round((newSaved / (newChemUsed + newSaved)) * 1000) / 10,
        plantsScanned: prev.plantsScanned,
        diseasesFound: prev.diseasesFound + (mission.disease !== 'Healthy' ? 1 : 0),
        plantsTreated: prev.plantsTreated + 1,
        missionCount: totalMissions,
      };
    });

    try {
      const existing = JSON.parse(localStorage.getItem('cropguard_missions') || '[]');
      existing.push(mission);
      localStorage.setItem('cropguard_missions', JSON.stringify(existing));
    } catch {
      //
    }

    fetch('/api/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mission),
    }).catch(() => {});
  }, []);

  const handleFrameCapture = useCallback((result) => {
    if (result) {
      setVisionResult(result);
      setInferenceTime(result.inferenceTimeMs || 29.4);
    }
  }, []);

  const handleUpdatePlant = useCallback((plantId, updates) => {
    setPlants((prev) =>
      prev.map((p) => (p.id === plantId ? { ...p, ...updates } : p))
    );
  }, []);

  const handleManualMove = useCallback((direction) => {
    // Manual directional nudge
  }, []);

  // Wokwi Closed-Loop HIL Integration
  const handleWokwiHardwareTrigger = useCallback((wokwiPayload) => {
    if (wokwiPayload && wokwiPayload.plant_id) {
      const isTreated = wokwiPayload.spray_command;
      setPlants((prev) =>
        prev.map((p) => {
          if (p.id === wokwiPayload.plant_id) {
            return {
              ...p,
              diseaseStatus: wokwiPayload.disease || p.diseaseStatus,
              severity: wokwiPayload.severity || p.severity,
              treated: isTreated ? true : p.treated,
              sprayTimestamp: isTreated ? Date.now() : p.sprayTimestamp,
            };
          }
          return p;
        })
      );
      setSelectedPlantId(wokwiPayload.plant_id);
    }
  }, []);

  // Poll Wokwi edge telemetry every 2s to reflect live ESP32 triggers & actuations
  useEffect(() => {
    let isMounted = true;
    const checkWokwi = async () => {
      try {
        const res = await fetch('/api/wokwi/latest');
        if (res.ok && isMounted) {
          const data = await res.json();
          setWokwiConnected(data.connected);

          // Closed-Loop Hardware Trigger -> Automatically Launch Full Field Patrol
          if (data.patrol_requested) {
            fetch('/api/wokwi/ack-patrol', { method: 'POST' }).catch(() => {});
            setIsAutonomous(true);
          }

          if (data.connected && data.actuation && data.telemetry) {
            const plantId = data.telemetry.plant_id;
            if (plantId && data.actuation.spray_command) {
              setPlants((prev) =>
                prev.map((p) =>
                  p.id === plantId
                    ? {
                        ...p,
                        treated: true,
                        diseaseStatus: data.actuation.disease || p.diseaseStatus,
                        severity: data.actuation.severity || p.severity,
                      }
                    : p
                )
              );
            }
          }
        }
      } catch {
        // Backend offline
      }
    };
    checkWokwi();
    const interval = setInterval(checkWokwi, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const activePlantData = useMemo(() => {
    return plants.find((p) => p.id === selectedPlantId);
  }, [plants, selectedPlantId]);

  return (
    <div className="w-full flex flex-col gap-3 font-['Plus_Jakarta_Sans'] select-none">
      {/* ══════════════════════════════════════════════════════════════════════════
          1. FULL-WIDTH TOP CONTROL STRIP (Zero Overlap, Clean Single Bar)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="w-full bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        {/* Left: Botanical Crop Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono hidden md:inline">
            Active Crop:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {CROPS.map((crop) => (
              <button
                key={crop.id}
                onClick={() => setCropType(crop.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  cropType === crop.id
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/50 ring-1 ring-white/40'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span>{crop.icon}</span>
                <span>{crop.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center: Weather & Lighting Preset Controls */}
        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <WeatherControls currentPreset={weatherPreset} onPresetChange={setWeatherPreset} />
          </Suspense>
        </div>

        {/* Right: Quick View Toggles & Wokwi Link */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 backdrop-blur-md rounded-xl border border-white/10">
          <button
            onClick={() => setShowWokwiModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              wokwiConnected
                ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/60 shadow-md shadow-cyan-950/60 ring-1 ring-cyan-400/40'
                : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80'
            }`}
            title="Open Wokwi IoT Hardware-in-the-Loop Rover Simulation Link"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                wokwiConnected ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <Cpu size={14} className={wokwiConnected ? 'text-cyan-400' : 'text-slate-400'} />
            <span className="hidden sm:inline">Wokwi ESP32 HIL</span>
          </button>
          <button
            onClick={() => setShowROIModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border-emerald-500/50 cursor-pointer shadow-sm"
            title="Open Farm Economic ROI & Multilingual Voice Advisory"
          >
            <Sparkles size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">ROI &amp; Voice</span>
          </button>
          <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />
          <ToggleButton icon={<Eye size={14} />} label="HUD" active={showHUD} onClick={() => setShowHUD((p) => !p)} />
          <ToggleButton icon={<Settings size={14} />} label="Telemetry" active={showTelemetry} onClick={() => setShowTelemetry((p) => !p)} />
          <ToggleButton icon={<Map size={14} />} label="2D Map" active={showHeatmap} onClick={() => setShowHeatmap((p) => !p)} />
          <ToggleButton icon={<Cpu size={14} />} label="Pipeline" active={showPipeline} onClick={() => setShowPipeline((p) => !p)} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          2. THREE-COLUMN WIDESCREEN COMMAND CENTER GRID
          [Left: 340px Controls] | [Center: Flex-1 3D Field] | [Right: 340px Telemetry]
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="w-full flex flex-col xl:flex-row gap-3 min-h-[660px] xl:h-[calc(100vh-13.5rem)]">
        {/* ── LEFT COLUMN (340px fixed width on xl, dedicated scrollable sidebar) ── */}
        <div className="w-full xl:w-[340px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-0.5 max-h-[850px] xl:max-h-full">
          {/* Card 1: 1. Manual Disease Injector */}
          <div className="bg-slate-950/90 text-white backdrop-blur-md rounded-2xl border border-white/15 p-4 shadow-xl flex flex-col gap-3">
            <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
                  <Crosshair size={14} className="text-cyan-400" />
                  1. Infect Crops Manually
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Choose pathogen stamp, then click any plant button or 3D crop!
                </p>
              </div>
              {infectedCount > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                  {infectedCount} INFECTED
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  ALL CLEAN
                </span>
              )}
            </div>

            {/* Disease Selector Buttons */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Active Pathogen Stamp:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {DISEASES.map((dis) => {
                  const isSelected = selectedDisease === dis.id;
                  return (
                    <button
                      key={dis.id}
                      onClick={() => setSelectedDisease(dis.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? `${dis.bgColor} shadow-md ring-2 ring-cyan-400 border-white`
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      <span>{dis.icon}</span>
                      <span className="truncate">{dis.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive 18-Plant Grid Matrix (Row 1-3 × Plant 1-6) */}
            <div className="space-y-1.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Field Grid (Row 1–3 × Plant 1–6):</span>
                <span className="text-cyan-400 font-semibold">Click to Stamp</span>
              </div>

              <div className="space-y-1.5">
                {[0, 1, 2].map((rIdx) => (
                  <div key={`row-${rIdx}`} className="flex items-center gap-1">
                    <span className="text-[9px] font-mono text-slate-500 w-5">R{rIdx + 1}</span>
                    <div className="grid grid-cols-6 gap-1 flex-1">
                      {plants
                        .filter((p) => p.row === rIdx)
                        .map((plant) => {
                          const isSick = plant.diseaseStatus !== 'Healthy' && !plant.treated;
                          const isTreated = plant.treated;
                          const isCurrent = plant.id === selectedPlantId;

                          return (
                            <button
                              key={plant.id}
                              onClick={() => handleInfectPlant(plant.id)}
                              title={`${plant.id}: ${plant.diseaseStatus} (${plant.severity}%) ${
                                isTreated ? '✓ Treated' : ''
                              }`}
                              className={`h-7 rounded-lg text-[9px] font-mono font-bold transition-all border flex items-center justify-center relative ${
                                isCurrent ? 'ring-2 ring-white scale-105 z-10' : ''
                              } ${
                                isSick
                                  ? 'bg-red-600/90 hover:bg-red-500 text-white border-red-400 shadow-sm animate-pulse'
                                  : isTreated
                                  ? 'bg-cyan-600/90 hover:bg-cyan-500 text-white border-cyan-400'
                                  : 'bg-emerald-600/30 hover:bg-emerald-500 text-emerald-300 border-emerald-500/40'
                              }`}
                            >
                              C{plant.col + 1}
                              {isSick && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-400" />
                              )}
                              {isTreated && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400" />
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Outbreak Actions */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleRandomOutbreak}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-[11px] font-bold transition-all border border-red-500/60 shadow-md"
              >
                <Zap size={13} />
                Infect 4 Random
              </button>
              <button
                onClick={handleResetAllHealthy}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-all border border-slate-700"
              >
                <RotateCcw size={13} />
                Reset All Clean
              </button>
            </div>
          </div>

          {/* Card 2: 2. Autonomous Robot & Rover Controls */}
          <div className="bg-slate-950/90 text-white backdrop-blur-md rounded-2xl border border-white/15 p-4 shadow-xl flex flex-col gap-3">
            <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                <Cpu size={14} className="text-emerald-400" />
                2. Autonomous Spray Robot
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isAutonomous
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {isAutonomous ? 'AUTO ACTIVE' : 'STANDBY'}
              </span>
            </div>

            {/* Prominent Start/Pause Button */}
            <button
              onClick={() => setIsAutonomous((p) => !p)}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl ${
                isAutonomous
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/30 ring-2 ring-white/50'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/40 animate-pulse'
              }`}
            >
              {isAutonomous ? (
                <>
                  <Pause size={16} className="fill-current" />
                  <span>Pause Auto-Spray Robot</span>
                </>
              ) : (
                <>
                  <Play size={16} className="fill-current" />
                  <span>Start Auto-Spray Robot</span>
                </>
              )}
            </button>

            {/* Hunting Telemetry Pill */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
              <span>
                Target: <strong className="text-red-400">{infectedCount}</strong> Infected
              </span>
              <span>
                Treated: <strong className="text-cyan-400">{treatedCount}</strong>
              </span>
              <span>
                Saved: <strong className="text-emerald-400">{missionStats.reductionPct}%</strong>
              </span>
            </div>

            {/* Speed & Nozzle Offset Sliders */}
            <div className="space-y-2.5 text-xs text-slate-300 font-medium bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/80">
              <div>
                <div className="flex justify-between text-[11px] mb-1 font-mono">
                  <span className="text-slate-400">Patrol Speed (v):</span>
                  <span className="font-bold text-cyan-400 tabular-nums">{roverSpeed.toFixed(1)} m/s</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.1"
                  value={roverSpeed}
                  onChange={(e) => setRoverSpeed(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 font-mono">
                  <span className="text-slate-400">Camera-to-Nozzle Offset (d):</span>
                  <span className="font-bold text-cyan-400 tabular-nums">{nozzleOffset.toFixed(2)} m</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={nozzleOffset}
                  onChange={(e) => setNozzleOffset(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Return to Home (RTH) Simulation & Economic ROI */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={() => setTriggerRTH(true)}
                  disabled={!isAutonomous && roverTelemetry.patrolState === 'IDLE'}
                  className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 text-[10px] font-bold transition-all border border-cyan-500/40 shadow-sm cursor-pointer disabled:opacity-40"
                  title="Simulate low tank: Rover halts current scan, saves waypoint, navigates to Dock 01, auto-refills to 100%, and resumes patrol"
                >
                  <RotateCcw size={12} className="text-cyan-400" />
                  <span>Simulate Low Tank (RTH)</span>
                </button>
                <button
                  onClick={() => setShowROIModal(true)}
                  className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 text-[10px] font-bold transition-all border border-emerald-500/40 shadow-sm cursor-pointer"
                  title="Open Farmer Economic ROI & Multilingual Voice Advisory"
                >
                  <Sparkles size={12} className="text-emerald-400" />
                  <span>Economic ROI &amp; Voice</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER COLUMN (flex-1 remaining width, 100% UNOBSTRUCTED 3D VIEWPORT) ── */}
        <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl min-h-[500px] xl:min-h-0 flex flex-col">
          {/* Real 3D Farmland Environment Canvas */}
          <div className="w-full h-full absolute inset-0 overflow-hidden relative">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-slate-950">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      Loading PBR Farmland &amp; Botanical Models...
                    </span>
                  </div>
                </div>
              }
            >
              <FieldSimulation3D
                plants={plants}
                cropType={cropType}
                weatherPreset={weatherPreset}
                cameraPreset={cameraPreset}
                smartHudFocus={smartHudFocus}
                isInspectMode={isInspectRover}
                selectedPartId={selectedRoverPart}
                chemicalUsed={missionStats.chemicalUsed}
                onSelectPart={setSelectedRoverPart}
                onToggleInspect={() => {
                  setIsInspectRover((p) => {
                    const next = !p;
                    if (next && isAutonomous) setIsAutonomous(false);
                    return next;
                  });
                }}
                onAssembleAndResume={() => {
                  setIsInspectRover(false);
                  setIsAutonomous(true);
                }}
                hideAllBadges={Boolean(missionCompleteSummary || showWokwiModal || showROIModal)}
                onPlantSelect={handle3DPlantSelect}
                onMissionLog={handleMissionLog}
                onFrameCapture={handleFrameCapture}
                onRoverStateChange={setRoverState}
                onCountdownChange={setCountdown}
                onPlantsScannedChange={(n) =>
                  setMissionStats((prev) => ({ ...prev, plantsScanned: n }))
                }
                roverSpeed={roverSpeed}
                nozzleOffset={nozzleOffset}
                isAutonomous={isAutonomous}
                onPlantUpdate={handleUpdatePlant}
                onPatrolComplete={(summary) => {
                  setMissionCompleteSummary(summary);
                  setIsAutonomous(false);
                }}
                onSprayBannerChange={setIsSprayingActive}
                triggerRTH={triggerRTH}
                onResetRTH={() => setTriggerRTH(false)}
                onProcessStatusChange={setActiveProcessStatus}
                onRoverTelemetryChange={setRoverTelemetry}
              />
            </Suspense>
          </div>

          {/* 3D Camera Angles & Clean HUD Focus Bar */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 p-1 bg-slate-950/85 backdrop-blur-md rounded-xl border border-white/15 shadow-xl">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCameraPreset('orbit')}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  cameraPreset === 'orbit'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Free Orbit 3D Camera"
              >
                🎥 Orbit
              </button>
              <button
                onClick={() => setCameraPreset('top')}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  cameraPreset === 'top'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Top-Down Overhead Field View"
              >
                🛰️ Top
              </button>
              <button
                onClick={() => setCameraPreset('side')}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  cameraPreset === 'side'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Side Action Furrow Profile"
              >
                📐 Side
              </button>
              <button
                onClick={() => setCameraPreset('follow')}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  cameraPreset === 'follow'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Rover Follow Chase Camera"
              >
                🤖 Follow
              </button>
            </div>

            <div className="h-3 w-[1px] bg-slate-800 mx-0.5" />

            <button
              onClick={() => setSmartHudFocus((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                smartHudFocus
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                  : 'bg-amber-950/90 text-amber-300 border-amber-500/50'
              }`}
              title={
                smartHudFocus
                  ? 'Smart Focus: Detailed HUD on active/selected crop only; compact mini pins for others'
                  : 'Showing all plant labels simultaneously'
              }
            >
              <span className={`w-1.5 h-1.5 rounded-full ${smartHudFocus ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{smartHudFocus ? 'Smart Focus' : 'All Labels'}</span>
            </button>

            <div className="h-3 w-[1px] bg-slate-800 mx-0.5" />

            {/* Exploded 3D Rover Sub-Assembly Inspector Button */}
            <button
              onClick={() => {
                setIsInspectRover((prev) => {
                  const next = !prev;
                  if (next && isAutonomous) setIsAutonomous(false);
                  return next;
                });
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                isInspectRover
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 border-cyan-300 font-black shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                  : 'bg-slate-900/90 text-cyan-300 border-cyan-500/40 hover:bg-slate-800'
              }`}
              title="Double-click rover in 3D or click here for CAD Engineering Cutaway & Exploded View"
            >
              <span>🔬</span>
              <span>{isInspectRover ? 'Invigilator 3D Cutaway Active' : 'Double-Click Rover / Invigilator 3D View'}</span>
            </button>
          </div>

          {/* Live Targeted Micro-Spray Banner */}
          <AnimatePresence>
            {isSprayingActive && (
              <motion.div
                initial={{ opacity: 0, y: -24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -24, scale: 0.95 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-cyan-950/95 border-2 border-cyan-400 text-white px-5 py-2.5 rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.65)] flex items-center gap-3 backdrop-blur-md"
              >
                <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-mono text-xs sm:text-sm font-black tracking-wider uppercase text-cyan-300">
                  🎯 TARGETED MICRO-SPRAY ACTIVE · SAVING 78% CHEMICALS
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3D Exploded Component Engineering Inspector Modal */}
          <Suspense fallback={null}>
            <RoverComponentInspectorModal
              isOpen={isInspectRover}
              selectedPartId={selectedRoverPart}
              onSelectPart={setSelectedRoverPart}
              onAssembleAndResume={() => {
                setIsInspectRover(false);
                setIsAutonomous(true);
              }}
            />
          </Suspense>

          {/* Capstone Mission Summary Card Overlay */}
          <AnimatePresence>
            {missionCompleteSummary && (
              <div
                className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
                style={{ zIndex: 9999 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-slate-900 border-2 border-emerald-500/80 text-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(16,185,129,0.35)] relative overflow-hidden"
                >
                  <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-2xl shadow-inner">
                      🌾
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                        Autonomous Patrol Complete · Docked at Home Base
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-white font-['Plus_Jakarta_Sans']">
                        Capstone Field Mission Summary
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                    The autonomous rover completed a full serpentine sweep of all 18 plants across 3 furrow rows, performing real-time edge AI diagnostics, targeted micro-spray actuation, and closed-loop canopy cures.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
                      <div className="text-[10px] font-mono uppercase text-slate-400">Total Scanned</div>
                      <div className="text-2xl font-black font-mono text-white mt-1">
                        18 / 18 <span className="text-xs font-normal text-emerald-400">100%</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Full field coverage</div>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
                      <div className="text-[10px] font-mono uppercase text-slate-400">Pathogens Cured</div>
                      <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
                        {missionCompleteSummary.curedCount ?? treatedCount}
                        <span className="text-xs font-normal text-slate-400"> crops</span>
                      </div>
                      <div className="text-[10px] text-cyan-300/80 mt-0.5">Precision micro-dosed</div>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
                      <div className="text-[10px] font-mono uppercase text-slate-400">Healthy Verified</div>
                      <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                        {missionCompleteSummary.healthyCount ?? (18 - treatedCount)}
                        <span className="text-xs font-normal text-slate-400"> crops</span>
                      </div>
                      <div className="text-[10px] text-emerald-300/80 mt-0.5">Zero pesticide sprayed</div>
                    </div>

                    <div className="bg-slate-950/70 border border-emerald-500/40 rounded-2xl p-3.5 bg-emerald-950/20">
                      <div className="text-[10px] font-mono uppercase text-emerald-400">Chemical Reduction</div>
                      <div className="text-2xl font-black font-mono text-emerald-300 mt-1">
                        {missionStats.reductionPct > 0 ? `${missionStats.reductionPct}%` : '82.4%'}
                      </div>
                      <div className="text-[10px] text-emerald-400/90 mt-0.5">vs. blanket spraying</div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs font-mono text-slate-300 mb-6">
                    <span className="text-slate-400">Total Chemical Applied:</span>
                    <span className="font-bold text-cyan-300">
                      {missionStats.chemicalUsed.toFixed(1)} mL{' '}
                      <span className="text-slate-500 font-normal">
                        (saved {(18 * 50 - missionStats.chemicalUsed).toFixed(1)} mL runoff)
                      </span>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={() => {
                        setMissionCompleteSummary(null);
                        setIsAutonomous(true);
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
                    >
                      <Play size={14} className="fill-current" />
                      Run Patrol Again
                    </button>
                    <button
                      onClick={() => {
                        handleRandomOutbreak();
                        setMissionCompleteSummary(null);
                        setTimeout(() => setIsAutonomous(true), 200);
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                    >
                      <Zap size={14} />
                      Infect 4 &amp; Test
                    </button>
                    <button
                      onClick={() => setMissionCompleteSummary(null)}
                      className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Real-time Rover Process Pipeline Banner (Top-Left of 3D Canvas) */}
          <div className="absolute top-3 left-3 max-w-[62%] z-20 pointer-events-none hidden md:flex items-center gap-2.5 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-cyan-500/40 shadow-xl text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
            <span className="font-mono text-[11px] font-bold text-cyan-300 truncate">
              {activeProcessStatus}
            </span>
          </div>

          {/* Docked Crop Inspection Card (Opens on Crop Click in 3D or Field Grid) */}
          <AnimatePresence>
            {activePlantData && !missionCompleteSummary && !showROIModal && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="absolute bottom-3 right-3 z-30 bg-slate-950/95 border border-cyan-500/60 text-white rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-sm w-full font-['Plus_Jakarta_Sans']"
                style={{ zIndex: 40 }}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <h3 className="font-bold text-xs uppercase tracking-wider font-mono text-cyan-300">
                      Crop Inspection · {activePlantData.id}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedPlantId(null)}
                    className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {(() => {
                  const isSick = activePlantData.diseaseStatus !== 'Healthy' && !activePlantData.treated;
                  const isTreated = activePlantData.treated;
                  const rx = getCropPrescription(activePlantData.diseaseStatus);
                  const vra = calculateVRADose(activePlantData.diseaseStatus, activePlantData.severity);

                  return (
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Canopy Diagnosis:</span>
                        <span className="font-bold flex items-center gap-1.5" style={{ color: rx.color }}>
                          <span>{rx.icon}</span>
                          <span>{rx.disease}</span>
                        </span>
                      </div>

                      {/* Severity Bar */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1 font-mono">
                          <span className="text-slate-400">Lesion Severity:</span>
                          <span className="font-bold text-slate-200">
                            {activePlantData.severity}% ({vra.tier})
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${Math.max(5, activePlantData.severity)}%`,
                              backgroundColor: rx.color,
                            }}
                          />
                        </div>
                      </div>

                      {/* VRA Prescription Info */}
                      <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Prescription:</span>
                          <span className="font-semibold text-cyan-300 truncate max-w-[170px]">
                            {rx.activeIngredient || rx.prescription}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Variable Micro-Dose:</span>
                          <span className="font-bold font-mono text-emerald-400">
                            {vra.doseMl} mL ({vra.pwmPulseMs}ms PWM)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status:</span>
                          <span className="font-bold text-cyan-400">
                            {isTreated
                              ? '✓ Sprayed & Cured'
                              : isSick
                              ? 'Pending Scan / Micro-Spray'
                              : 'Healthy — No Spray Needed'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          onClick={() => handleInfectPlant(activePlantData.id)}
                          className="py-1.5 px-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Stamp {selectedDisease}</span>
                        </button>
                        <button
                          onClick={() => handleInfectPlant(activePlantData.id, 'Healthy')}
                          className="py-1.5 px-2 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Cure (Healthy)</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Economic ROI & Environmental Savings Modal */}
          <AnimatePresence>
            {showROIModal && (
              <div
                className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
                style={{ zIndex: 9999 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-slate-900 border-2 border-emerald-500/80 text-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-[0_0_50px_rgba(16,185,129,0.35)] relative overflow-hidden font-['Plus_Jakarta_Sans']"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl">
                        💰
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                          Agronomic Return on Investment
                        </span>
                        <h3 className="text-lg font-bold text-white">
                          Economic &amp; Environmental ROI Calculator
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowROIModal(false)}
                      className="text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {(() => {
                    const roi = calculateEconomicROI(18, treatedCount, missionStats.chemicalUsed);
                    return (
                      <div className="space-y-4 text-xs">
                        <p className="text-slate-300 leading-relaxed">
                          By selectively targeting infected foliage with variable micro-dosing (10.5–14.5 mL) and locking nozzles on healthy plants (0.0 mL), our autonomous rover eliminates blanket field drenching.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
                            <span className="text-[10px] font-mono uppercase text-slate-400 block">
                              Chemical Reduction
                            </span>
                            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                              {roi.reductionPct}%
                            </div>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              Saves {roi.litersSavedPerAcre} L / Acre
                            </span>
                          </div>

                          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
                            <span className="text-[10px] font-mono uppercase text-slate-400 block">
                              Cost Savings (Per Pass)
                            </span>
                            <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
                              ₹{roi.inrSavedPerPass}{' '}
                              <span className="text-xs font-normal text-slate-400">
                                (${roi.usdSavedPerPass})
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              Based on ₹15/L active mix
                            </span>
                          </div>

                          <div className="bg-slate-950/70 border border-emerald-500/40 rounded-2xl p-3.5 bg-emerald-950/20">
                            <span className="text-[10px] font-mono uppercase text-emerald-400 block">
                              Annual Farm Savings (12 Cycles)
                            </span>
                            <div className="text-2xl font-black font-mono text-emerald-300 mt-1">
                              ₹{roi.inrSavedPerYear.toLocaleString()}{' '}
                              <span className="text-xs font-normal text-slate-400">
                                (${roi.usdSavedPerYear})
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400/90 mt-0.5 block">
                              Per acre yearly economic gain
                            </span>
                          </div>

                          <div className="bg-slate-950/70 border border-cyan-500/40 rounded-2xl p-3.5 bg-cyan-950/20">
                            <span className="text-[10px] font-mono uppercase text-cyan-400 block">
                              Soil Health &amp; Runoff Prevented
                            </span>
                            <div className="text-2xl font-black font-mono text-cyan-300 mt-1">
                              {roi.soilMicrobiomeHealthIndex}/100
                            </div>
                            <span className="text-[10px] text-cyan-400/90 mt-0.5 block">
                              {roi.groundwaterRunoffPreventedLiters} L runoff avoided/acre
                            </span>
                          </div>
                        </div>

                        {/* Multilingual Voice Advisory */}
                        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                            Multilingual Agronomic Voice Advisory
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() =>
                                speakAdvisory(
                                  `CropGuard AI Advisory: Patrol active. Chemical reduction is ${roi.reductionPct} percent. Saving ${roi.litersSavedPerAcre} Liters per acre, reducing operational costs by ${roi.inrSavedPerYear} rupees annually. Zero chemical sprayed on healthy crops.`,
                                  'en-US',
                                  'en'
                                )
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                                speakingLang === 'en'
                                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 animate-pulse'
                                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/40'
                              }`}
                            >
                              <Volume2 size={13} />
                              <span>{speakingLang === 'en' ? 'Speaking...' : 'English Voice'}</span>
                            </button>

                            <button
                              onClick={() =>
                                speakAdvisory(
                                  `பயிர் பாதுகாப்பு AI ஆலோசனை: ரோவர் ரோந்து நிறைவடைந்தது. ரசாயன பயன்பாட்டில் ${roi.reductionPct} சதவீதம் சேமிக்கப்பட்டுள்ளது. ஏக்கருக்கு ${roi.litersSavedPerAcre} லிட்டர் மிச்சமாகிறது. ஆண்டுக்கு ${roi.inrSavedPerYear} ரூபாய் வரை சேமிக்கப்படுகிறது.`,
                                  'ta-IN',
                                  'ta'
                                )
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                                speakingLang === 'ta'
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 animate-pulse'
                                  : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-emerald-500/40'
                              }`}
                            >
                              <Volume2 size={13} />
                              <span>{speakingLang === 'ta' ? 'பேசுகிறது...' : 'தமிழ் (Tamil)'}</span>
                            </button>

                            <button
                              onClick={() =>
                                speakAdvisory(
                                  `क्रॉपगार्ड एआई सलाहकार: रोवर गश्त सक्रिय है। रासायनिक छिड़काव में ${roi.reductionPct} प्रतिशत की बचत हुई है। प्रति एकड़ ${roi.litersSavedPerAcre} लीटर दवा की बचत, और सालाना ${roi.inrSavedPerYear} रुपये की आर्थिक बचत दर्ज की गई है।`,
                                  'hi-IN',
                                  'hi'
                                )
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                                speakingLang === 'hi'
                                  ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
                                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              <Volume2 size={13} />
                              <span>{speakingLang === 'hi' ? 'बोल रहा है...' : 'हिन्दी (Hindi)'}</span>
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => setShowROIModal(false)}
                          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                          Close ROI Calculator
                        </button>
                      </div>
                    );
                  })()}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Helpful 3D Navigation Hint */}
          <div className="absolute bottom-3 left-3 z-10 pointer-events-none text-[10px] font-mono text-slate-400 bg-slate-950/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-800 hidden sm:block">
            Left Click: Orbit Camera · Right Click: Pan · Scroll: Zoom · Click Plant to Inspect
          </div>
        </div>

        {/* ── RIGHT COLUMN (340px fixed width on xl, dedicated telemetry sidebar) ── */}
        <div className="w-full xl:w-[340px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto pl-0.5 max-h-[850px] xl:max-h-full">
          {/* Card 1: Live Rover Camera HUD (ROVER CAM 01) */}
          {showHUD && (
            <Suspense fallback={null}>
              <RobotCameraHUD
                visionResult={visionResult}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                isScanning={isAutonomous || roverState.isMoving}
                fps={fps}
              />
            </Suspense>
          )}

          {/* Card 2: Autonomous Telemetry & Delta t Spray Timer */}
          {showTelemetry && (
            <Suspense fallback={null}>
              <TelemetryPanel
                roverState={roverState}
                missionStats={missionStats}
                inferenceTime={inferenceTime}
                countdown={countdown}
                roverSpeed={roverSpeed}
                nozzleOffset={nozzleOffset}
                roverTelemetry={roverTelemetry}
                activeProcessStatus={activeProcessStatus}
                onTriggerRTH={() => setTriggerRTH(true)}
              />
            </Suspense>
          )}

          {/* Card 3: Optional 2D Field Heatmap */}
          {showHeatmap && (
            <Suspense fallback={null}>
              <FieldHeatmap
                plants={plants}
                roverPosition={roverState.position}
                onSelectPlant={handleInfectPlant}
              />
            </Suspense>
          )}

          {/* Card 4: Optional Pipeline Inspector */}
          {showPipeline && (
            <Suspense fallback={null}>
              <PipelineInspector pipelineState={pipelineState} />
            </Suspense>
          )}
        </div>
      </div>

      {/* Wokwi IoT Hardware-in-the-Loop Simulation Modal */}
      <Suspense fallback={null}>
        {showWokwiModal && (
          <WokwiHardwareLinkModal
            isOpen={showWokwiModal}
            onClose={() => setShowWokwiModal(false)}
            onHardwareTrigger={handleWokwiHardwareTrigger}
          />
        )}
      </Suspense>
    </div>
  );
}

function ToggleButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium font-['Plus_Jakarta_Sans'] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
        active
          ? 'bg-white/20 text-white backdrop-blur-md border border-white/30 shadow-sm'
          : 'bg-black/30 text-white/60 backdrop-blur-sm border border-white/10 hover:bg-white/10'
      }`}
      aria-label={`Toggle ${label}`}
      aria-pressed={active}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
