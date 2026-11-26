import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Cpu,
  Wifi,
  WifiOff,
  Radio,
  Sliders,
  Check,
  Copy,
  ExternalLink,
  Zap,
  Activity,
  AlertTriangle,
  Droplets,
  Thermometer,
  ShieldAlert,
  Play,
  RotateCw,
  Terminal,
  Code2,
} from 'lucide-react';
import {
  WOKWI_DIAGRAM_JSON,
  WOKWI_SKETCH_INO,
  WOKWI_LIBRARIES_TXT,
} from '../data/wokwiSource';

export default function WokwiHardwareLinkModal({ isOpen, onClose, onHardwareTrigger }) {
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'diagram' | 'code' | 'guide'
  const [copiedKey, setCopiedKey] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const [hardwareState, setHardwareState] = useState({
    connected: false,
    last_heartbeat: 0,
    total_packets: 0,
    seconds_since_heartbeat: null,
    telemetry: {
      plant_id: 'R1-C2',
      distance_cm: 24.5,
      temp_c: 26.5,
      humidity: 82.0,
      crop_type: 'rose',
      scan_trigger: 'ultrasonic',
      rover_speed: 0.5,
      nozzle_offset: 0.8,
    },
    actuation: {
      disease: 'Black Spot',
      confidence: 94.6,
      severity: 46.2,
      spray_command: true,
      spray_duration_ms: 1720,
      delta_t_ms: 1600,
      dose_ml: 8.4,
      chemical_saved_pct: 83.2,
      microclimate_risk: 'HIGH (High Fungal Spore Viability)',
      servo_angle: 90,
      lcd_line1: 'Black Spot 95%',
      lcd_line2: 'Dt:1600ms ALERT',
    },
    history: [],
  });

  // Poll latest Wokwi state every 2 seconds when modal is open
  const fetchWokwiStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/wokwi/latest');
      if (res.ok) {
        const data = await res.json();
        setHardwareState((prev) => ({
          ...prev,
          ...data,
        }));
      }
    } catch {
      // Backend not yet reachable
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchWokwiStatus();
    const interval = setInterval(fetchWokwiStatus, 2000);
    return () => clearInterval(interval);
  }, [isOpen, fetchWokwiStatus]);

  // Copy helper
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Trigger hardware simulation from browser
  const handleSimulateClick = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/wokwi/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const result = await res.json();
        await fetchWokwiStatus();
        if (onHardwareTrigger) {
          onHardwareTrigger(result);
        }
      }
    } catch (err) {
      console.warn('Simulation trigger error:', err);
    } finally {
      setTimeout(() => setIsSimulating(false), 600);
    }
  };

  if (!isOpen) return null;

  const telemetry = hardwareState.telemetry || {};
  const actuation = hardwareState.actuation || {};
  const isSpraying = actuation.spray_command && (actuation.servo_angle || 0) > 0;
  const isAlert = actuation.spray_command && actuation.disease !== 'Healthy';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md font-['Plus_Jakarta_Sans'] select-none"
      style={{ zIndex: 9999 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* ── Modal Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-600 to-emerald-600 text-white shadow-lg shadow-cyan-900/40">
              <Cpu size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Wokwi IoT Hardware-in-the-Loop (HIL) Rover
                </h2>
                <span
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    hardwareState.connected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hardwareState.connected ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  {hardwareState.connected ? 'ESP32 Connected' : 'Waiting for Wokwi Heartbeat'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ESP32 DevKit V1 Edge Ultrasonic &amp; Microclimate Ingestion · Real-Time ONNX Inference · Precision Nozzle Actuation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateClick}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md transition-all active:scale-95 disabled:opacity-50"
              title="Send a simulated sensor scan from the browser"
            >
              <Zap size={14} className={isSimulating ? 'animate-spin' : ''} />
              <span>{isSimulating ? 'Triggering...' : 'Simulate Hardware Trigger'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Subnav Tabs ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 bg-slate-950/50 border-b border-slate-800 text-xs">
          <div className="flex gap-2">
            {[
              { id: 'live', label: 'Live Virtual Hardware Dashboard', icon: Radio },
              { id: 'diagram', label: 'Circuit Wiring (diagram.json)', icon: Sliders },
              { id: 'code', label: 'ESP32 Firmware (sketch.ino)', icon: Code2 },
              { id: 'guide', label: 'Wokwi Setup Instructions', icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 py-3 px-3 font-semibold border-b-2 transition-colors ${
                    isActive
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span>Packets: <strong className="text-cyan-400">{hardwareState.total_packets}</strong></span>
            {hardwareState.seconds_since_heartbeat !== null && (
              <span>Last Heartbeat: <strong className="text-emerald-400">{hardwareState.seconds_since_heartbeat}s</strong> ago</span>
            )}
          </div>
        </div>

        {/* ── Tab Content ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'live' && (
            <div className="space-y-6">
              {/* Top Row: LCD 1602 Display Simulator & Actuators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Simulated 1602 LCD Screen */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                    <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <Terminal size={14} />
                      I2C LCD 1602 SCREEN (0x27)
                    </span>
                    <span>HD44780 Matrix</span>
                  </div>

                  {/* LCD Display Glass */}
                  <div className="p-4 rounded-xl bg-[#0F2E1B] border-2 border-[#164E2A] shadow-inner font-mono tracking-widest text-[#4ADE80] font-bold text-sm sm:text-base leading-relaxed selection:bg-emerald-900">
                    <div className="flex justify-between items-center h-6">
                      <span>{actuation.lcd_line1 || 'CROP GUARD AI'}</span>
                      <span className="text-[10px] text-emerald-500 font-sans uppercase">Line 1</span>
                    </div>
                    <div className="flex justify-between items-center h-6 border-t border-[#164E2A]/60 pt-1">
                      <span>{actuation.lcd_line2 || 'STANDBY - READY'}</span>
                      <span className="text-[10px] text-emerald-500 font-sans uppercase">Line 2</span>
                    </div>
                  </div>

                  <p className="text-[10px] font-mono text-slate-500 mt-2">
                    Updated automatically via I2C bus (SDA: D21, SCL: D22) upon receiving AI inference payload.
                  </p>
                </div>

                {/* Actuator & Valve Status */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Activity size={14} />
                      PRECISION SPRAY ACTUATOR (GPIO 13)
                    </span>
                    <span className="text-cyan-400">{actuation.dose_ml || 0} mL micro-dose</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Servo Motor Status */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-mono text-slate-400 mb-1">SERVO VALVE</span>
                      <div className="text-xl font-bold font-mono text-white mb-0.5">
                        {actuation.servo_angle || 0}°
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isSpraying
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isSpraying ? 'VALVE OPEN' : 'VALVE CLOSED'}
                      </span>
                    </div>

                    {/* Blue Spray LED */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-mono text-slate-400 mb-1">SPRAY LED (D2)</span>
                      <div
                        className={`w-6 h-6 rounded-full border-2 mb-1 transition-all ${
                          isSpraying
                            ? 'bg-cyan-400 border-white shadow-[0_0_15px_#06B6D4] animate-pulse'
                            : 'bg-slate-800 border-slate-700'
                        }`}
                      />
                      <span className="text-[9px] font-mono text-slate-300">
                        {isSpraying ? 'ACTUATED' : 'OFF'}
                      </span>
                    </div>

                    {/* Red Alert LED */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-mono text-slate-400 mb-1">ALERT LED (D15)</span>
                      <div
                        className={`w-6 h-6 rounded-full border-2 mb-1 transition-all ${
                          isAlert
                            ? 'bg-red-500 border-white shadow-[0_0_15px_#EF4444] animate-ping'
                            : 'bg-slate-800 border-slate-700'
                        }`}
                      />
                      <span className="text-[9px] font-mono text-slate-300">
                        {isAlert ? 'DISEASE ALERT' : 'SAFE'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 px-1">
                    <span>Look-Ahead: <strong className="text-cyan-400">Δt {actuation.delta_t_ms || 1600}ms</strong></span>
                    <span>Spray Duration: <strong className="text-cyan-400">{actuation.spray_duration_ms || 0}ms</strong></span>
                    <span>Saved: <strong className="text-emerald-400">{actuation.chemical_saved_pct || 0}%</strong></span>
                  </div>
                </div>
              </div>

              {/* Middle Row: Microclimate & Sensor Telemetry Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. HC-SR04 Ultrasonic Distance Sensor */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                      <Radio size={14} className="text-cyan-400" />
                      HC-SR04 ULTRASONIC
                    </span>
                    <span className="text-cyan-400 font-bold tabular-nums">
                      {telemetry.distance_cm || 24.5} cm
                    </span>
                  </div>

                  {/* Distance Bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          (telemetry.distance_cm || 24.5) < 30
                            ? 'bg-emerald-500'
                            : 'bg-cyan-500'
                        }`}
                        style={{
                          width: `${Math.min(100, ((telemetry.distance_cm || 24.5) / 60) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>0 cm</span>
                      <span className="text-emerald-400 font-semibold">&lt;30cm (Scan Zone)</span>
                      <span>60 cm</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Proximity below 30 cm triggers an automated high-shutter canopy camera scan.
                  </p>
                </div>

                {/* 2. DHT22 Microclimate Temperature & Humidity */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                      <Thermometer size={14} className="text-amber-400" />
                      DHT22 MICROCLIMATE
                    </span>
                    <span className="text-amber-400 font-bold tabular-nums">
                      {telemetry.temp_c || 26.5}°C · {telemetry.humidity || 82.0}% RH
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block">TEMP (D4)</span>
                      <span className="text-base font-bold font-mono text-white">
                        {telemetry.temp_c || 26.5}°C
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block">HUMIDITY</span>
                      <span className="text-base font-bold font-mono text-white">
                        {telemetry.humidity || 82.0}%
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Real-time field canopy vapor &amp; ambient heat logging.
                  </p>
                </div>

                {/* 3. Microclimate Fungal Spore Risk */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                      <ShieldAlert size={14} className="text-red-400" />
                      PATHOLOGY RISK
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        (actuation.microclimate_risk || '').includes('HIGH')
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {(actuation.microclimate_risk || '').split(' ')[0] || 'HIGH'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                    <p className="font-semibold text-white">
                      {actuation.microclimate_risk || 'High Fungal Spore Viability'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Relative humidity &gt;75% with temperatures between 18–28°C promotes rapid germination of <em>Diplocarpon rosae</em> (Black Spot) conidia.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Recent Live HIL Packets */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Radio size={14} className="text-emerald-400" />
                    LIVE HARDWARE-IN-THE-LOOP TELEMETRY STREAM
                  </span>
                  <span>Target: {telemetry.plant_id || 'R1-C2'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  {/* Telemetry Packet IN */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-cyan-400 font-bold uppercase mb-1.5 flex items-center justify-between">
                      <span>POST /api/wokwi/predict (ESP32 Inbound)</span>
                      <span>JSON Payload</span>
                    </div>
                    <pre className="text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{JSON.stringify(telemetry, null, 2)}
                    </pre>
                  </div>

                  {/* Actuation Response OUT */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase mb-1.5 flex items-center justify-between">
                      <span>Response (Model Inference &amp; Kinematics)</span>
                      <span>JSON Response</span>
                    </div>
                    <pre className="text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{JSON.stringify(actuation, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'diagram' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Wokwi Circuit Schema (diagram.json)</h3>
                  <p className="text-xs text-slate-400">
                    Complete wiring for ESP32 DevKit V1, HC-SR04, DHT22, I2C LCD1602, Servo valve &amp; indicator LEDs.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(WOKWI_DIAGRAM_JSON, 'diagram')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                >
                  {copiedKey === 'diagram' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedKey === 'diagram' ? 'Copied to Clipboard!' : 'Copy diagram.json'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-[500px] leading-relaxed">
{WOKWI_DIAGRAM_JSON}
              </pre>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">ESP32 Arduino Firmware (sketch.ino)</h3>
                  <p className="text-xs text-slate-400">
                    C++ firmware handling Wi-Fi telemetry transmission, JSON parsing, kinematic delays &amp; PWM servo actuation.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(WOKWI_SKETCH_INO, 'sketch')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                >
                  {copiedKey === 'sketch' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedKey === 'sketch' ? 'Copied to Clipboard!' : 'Copy sketch.ino'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[500px] leading-relaxed">
{WOKWI_SKETCH_INO}
              </pre>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ExternalLink size={16} className="text-cyan-400" />
                  Option 1: Run in Browser at Wokwi.com (Zero Installation Required)
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-2">
                  <li>
                    Open{' '}
                    <a
                      href="https://wokwi.com/projects/new/esp32"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 underline font-semibold"
                    >
                      https://wokwi.com/projects/new/esp32
                    </a>{' '}
                    in your web browser.
                  </li>
                  <li>
                    Click the <strong>Copy sketch.ino</strong> button in the tab above and paste it into the Wokwi code editor.
                  </li>
                  <li>
                    Switch to the <strong>diagram.json</strong> tab in Wokwi, click <strong>Copy diagram.json</strong> above, and replace the contents.
                  </li>
                  <li>
                    In Wokwi's <strong>libraries.txt</strong> tab, paste the required libraries:
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-cyan-300 my-1 text-[11px]">
                      ArduinoJson<br />
                      ESP32Servo<br />
                      LiquidCrystal I2C<br />
                      DHT sensor library<br />
                      Adafruit Unified Sensor
                    </div>
                  </li>
                  <li>
                    Start your FastAPI backend locally:
                    <code className="text-emerald-400 bg-slate-900 px-2 py-0.5 rounded font-mono block my-1">
                      python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
                    </code>
                  </li>
                  <li>
                    Click the green <strong>Play</strong> button in Wokwi!
                    In simulated Wi-Fi, <code className="text-cyan-400 font-mono">host.wokwi.internal:8000</code> connects directly to your machine's FastAPI backend!
                  </li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu size={16} className="text-emerald-400" />
                  Option 2: Run in VS Code / Antigravity with Wokwi Extension
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-2">
                  <li>
                    Install the official <strong>Wokwi Simulator</strong> extension from the Extensions Marketplace.
                  </li>
                  <li>
                    Open this project workspace and navigate to the <code className="text-cyan-400 font-mono">wokwi/</code> folder.
                  </li>
                  <li>
                    Open <code className="text-cyan-400 font-mono">wokwi/diagram.json</code>.
                  </li>
                  <li>
                    Press <code className="text-emerald-400 font-mono">F1</code>, type <strong>Wokwi: Start Simulator</strong>, and press Enter.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleCopy(WOKWI_DIAGRAM_JSON, 'diagram_quick')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors flex items-center gap-1.5"
            >
              <Copy size={13} />
              <span>{copiedKey === 'diagram_quick' ? 'Copied diagram.json!' : 'Copy diagram.json'}</span>
            </button>
            <button
              onClick={() => handleCopy(WOKWI_SKETCH_INO, 'sketch_quick')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors flex items-center gap-1.5"
            >
              <Copy size={13} />
              <span>{copiedKey === 'sketch_quick' ? 'Copied sketch.ino!' : 'Copy sketch.ino'}</span>
            </button>
            <button
              onClick={() => handleCopy(WOKWI_LIBRARIES_TXT, 'libs_quick')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors flex items-center gap-1.5"
            >
              <Copy size={13} />
              <span>{copiedKey === 'libs_quick' ? 'Copied libraries.txt!' : 'Copy libraries.txt'}</span>
            </button>
          </div>

          <a
            href="https://wokwi.com/projects/new/esp32"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
          >
            <span>Open Wokwi Web Simulator</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
