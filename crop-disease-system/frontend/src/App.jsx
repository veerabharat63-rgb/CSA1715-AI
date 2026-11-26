import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Leaf,
  Cpu,
  Microscope,
  ClipboardList,
  Wifi,
  WifiOff,
  BrainCircuit,
  ChevronRight,
  Database,
  Award,
} from 'lucide-react';

/* ── Lazy-loaded tab panels ──────────────────────────────────────── */
const FieldSimTab = lazy(() => import('./tabs/FieldSimTab.jsx'));
const LeafDoctorTab = lazy(() => import('./tabs/LeafDoctorTab.jsx'));
const HistoryTab = lazy(() => import('./tabs/HistoryTab.jsx'));
const DatasetProofTab = lazy(() => import('./tabs/DatasetProofTab.jsx'));
const WokwiHardwareLinkModal = lazy(() => import('./components/WokwiHardwareLinkModal.jsx'));

/* ── Tab definitions ─────────────────────────────────────────────── */
const TABS = [
  {
    id: 'field-sim',
    label: 'Engine 1: Autonomous Field Sim',
    shortLabel: 'Field Sim',
    icon: Cpu,
    color: 'emerald-agri',
    accent: '#059669',
  },
  {
    id: 'leaf-doctor',
    label: 'Engine 2: Farmer Leaf Doctor',
    shortLabel: 'Leaf Doctor',
    icon: Microscope,
    color: 'cyan-vision',
    accent: '#0891B2',
  },
  {
    id: 'history',
    label: 'Mission & Diagnosis History',
    shortLabel: 'History',
    icon: ClipboardList,
    color: 'amber-spray',
    accent: '#D97706',
  },
  {
    id: 'dataset-proof',
    label: 'Dataset & Training Proof (3,500+ Images)',
    shortLabel: '3,500+ Dataset',
    icon: Database,
    color: 'indigo',
    accent: '#6366F1',
  },
];

/* ── Motion variants ─────────────────────────────────────────────── */
const tabContentVariants = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -8, scale: 0.99, transition: { duration: 0.2, ease: 'easeIn' } },
};

/* ── Skeleton Loader ─────────────────────────────────────────────── */
function TabSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-agri-200 border-t-emerald-agri-600 animate-spin" />
        <p className="text-sm text-slate-400 font-plus-jakarta">Loading module…</p>
      </div>
    </div>
  );
}

/* ── Fallback placeholder for lazy tabs not yet created ──────────── */
function PlaceholderTab({ title, icon: Icon, color }) {
  return (
    <div className="glass-panel p-8 text-center">
      <Icon className="w-16 h-16 mx-auto mb-4 text-slate-300" strokeWidth={1.2} />
      <h2 className="text-xl font-semibold text-slate-700 font-plus-jakarta mb-2">{title}</h2>
      <p className="text-sm text-slate-400 max-w-md mx-auto">
        This module is under development. Connect additional components to activate this engine.
      </p>
    </div>
  );
}

/* ── Status Badge ────────────────────────────────────────────────── */
function StatusBadge({ online, label }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs font-medium font-plus-jakarta select-none">
      <span className={`status-dot ${online ? 'status-dot--online' : 'status-dot--offline'}`} />
      <span className={online ? 'text-emerald-agri-700' : 'text-crimson-disease-600'}>{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   App Component
   ═══════════════════════════════════════════════════════════════════ */
export default function App() {
  const [activeTab, setActiveTab] = useState('field-sim');
  const [backendOnline, setBackendOnline] = useState(false);
  const [onnxReady, setOnnxReady] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showWokwiModal, setShowWokwiModal] = useState(false);

  /* ── Health check ──────────────────────────────────────────────── */
  const checkBackend = useCallback(async () => {
    try {
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(4000) });
      setBackendOnline(res.ok);
    } catch {
      setBackendOnline(false);
    } finally {
      setCheckingStatus(false);
    }
  }, []);

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 30_000);
    return () => clearInterval(interval);
  }, [checkBackend]);

  /* ── ONNX readiness probe ──────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const ort = await import('onnxruntime-web');
        if (ort?.InferenceSession) setOnnxReady(true);
      } catch {
        setOnnxReady(false);
      }
    })();
  }, []);

  /* ── Render tab content with lazy + fallback ───────────────────── */
  function renderTabContent() {
    const current = TABS.find((t) => t.id === activeTab);

    const TabComponent = {
      'field-sim': FieldSimTab,
      'leaf-doctor': LeafDoctorTab,
      'history': HistoryTab,
      'dataset-proof': DatasetProofTab,
    }[activeTab];

    return (
      <Suspense fallback={<TabSkeleton />}>
        <ErrorBoundary fallback={<PlaceholderTab title={current.label} icon={current.icon} color={current.color} />}>
          <TabComponent />
        </ErrorBoundary>
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-plus-jakarta">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass-panel-elevated border-b border-white/30">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-agri-500 to-emerald-agri-700 shadow-lg shadow-emerald-agri-500/25">
                <Leaf className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="leading-tight">
                <h1 className="text-lg font-bold tracking-tight text-slate-800">
                  CropGuard <span className="text-emerald-agri-600">AI</span>
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium hidden sm:block">
                  Precision Rose Farming
                </p>
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowWokwiModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 transition-all shadow-sm active:scale-95"
                title="Open Wokwi IoT Hardware-in-the-Loop Rover Simulation Link"
              >
                <Cpu size={14} className="text-cyan-400" />
                <span className="hidden sm:inline">Wokwi ESP32 HIL</span>
                <span className="sm:hidden">Wokwi</span>
              </button>
              <button
                onClick={() => setActiveTab('dataset-proof')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors shadow-sm"
                title="View 3,520 Image Dataset & Training Telemetry"
              >
                <Award size={14} className="text-emerald-600" />
                <span>3,520 Images · 99.0% Val Acc</span>
              </button>
              <StatusBadge
                online={backendOnline}
                label={checkingStatus ? 'Checking…' : backendOnline ? 'Backend Online' : 'Backend Offline'}
              />
              <StatusBadge
                online={onnxReady}
                label={onnxReady ? 'ONNX Ready' : 'ONNX Unavailable'}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation ───────────────────────────────────────── */}
      <nav className="no-print sticky top-16 z-40 bg-white/50 backdrop-blur-md border-b border-slate-200/60">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none" role="tablist">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                    whitespace-nowrap transition-all duration-200 select-none
                    focus-visible:outline-2 focus-visible:outline-offset-2
                    ${isActive
                      ? 'text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/60'
                    }
                  `}
                  style={isActive ? { backgroundColor: tab.accent, boxShadow: `0 4px 14px ${tab.accent}33` } : {}}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                  {/* Full label on sm+, short on mobile */}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>

                  {/* Active underline indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      style={{ backgroundColor: tab.accent }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-xl -z-10"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── Tab Content ──────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="no-print border-t border-slate-200/60 bg-white/40 backdrop-blur-sm">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <p className="flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5" />
              CropGuard AI · Precision Disease Detection &amp; Advisory
            </p>
            <p className="tabular-nums">
              v1.0.0 · ONNX Runtime Web · Three.js r159 · Wokwi ESP32 HIL
            </p>
          </div>
        </div>
      </footer>

      {/* ── Wokwi IoT Hardware-in-the-Loop Modal ───────────────────── */}
      <Suspense fallback={null}>
        {showWokwiModal && (
          <WokwiHardwareLinkModal
            isOpen={showWokwiModal}
            onClose={() => setShowWokwiModal(false)}
          />
        )}
      </Suspense>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Error Boundary (class component – React requirement)
   ═══════════════════════════════════════════════════════════════════ */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[CropGuard] Tab load error:', error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
