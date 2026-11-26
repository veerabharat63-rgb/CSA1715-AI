import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // Backend connection
  backendAvailable: false,
  onnxMode: 'detecting', // 'detecting' | 'backend' | 'client'
  setBackendAvailable: (available) => set({ backendAvailable: available }),
  setOnnxMode: (mode) => set({ onnxMode: mode }),

  // Active tab
  activeTab: 0,
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Model status
  modelLoaded: false,
  modelLoading: false,
  setModelLoaded: (loaded) => set({ modelLoaded: loaded }),
  setModelLoading: (loading) => set({ modelLoading: loading }),

  // Notifications
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: Date.now(), timestamp: new Date().toISOString(), ...notification },
      ].slice(-50),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));

// Check backend availability
export async function checkBackend() {
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      useAppStore.getState().setBackendAvailable(true);
      useAppStore.getState().setOnnxMode('backend');
      return true;
    }
  } catch {
    // Also try common dev ports
    try {
      const res = await fetch('http://localhost:8000/api/health', {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        useAppStore.getState().setBackendAvailable(true);
        useAppStore.getState().setOnnxMode('backend');
        return true;
      }
    } catch {
      // Backend not available
    }
  }
  useAppStore.getState().setBackendAvailable(false);
  useAppStore.getState().setOnnxMode('client');
  return false;
}

// API base URL
export function getApiBase() {
  if (useAppStore.getState().backendAvailable) {
    // Try relative path first, then localhost
    return '';
  }
  return 'http://localhost:8000';
}

export default useAppStore;
