/**
 * MicCapture context: provides shared mic capture state across components.
 * Both EditorToolbar (dictation) and PlaybackControls (speech-sync) share the same capture.
 */

import React, { createContext, useContext } from 'react';
import { useMicCapture, type MicDevice } from '../hooks/useMicCapture';

interface MicCaptureContextValue {
  devices: MicDevice[];
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  isCapturing: boolean;
  startCapture: (deviceId?: string) => Promise<void>;
  stopCapture: () => void;
  refreshDevices: () => Promise<MicDevice[]>;
}

const MicCaptureCtx = createContext<MicCaptureContextValue | null>(null);

export function MicCaptureProvider({ children }: { children: React.ReactNode }) {
  const mic = useMicCapture();
  return <MicCaptureCtx.Provider value={mic}>{children}</MicCaptureCtx.Provider>;
}

export function useMicCaptureContext() {
  return useContext(MicCaptureCtx);
}
