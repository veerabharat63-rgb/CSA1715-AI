import { useState, useEffect, useRef, useCallback } from 'react';
import { visionPipeline } from '../vision/visionPipeline.js';

export function useVisionPipeline() {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const pipelineRef = useRef(visionPipeline);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await pipelineRef.current.initialize();
        if (mounted) setIsReady(true);
      } catch (err) {
        if (mounted) setError(err.message);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const analyzeImage = useCallback(async (imageElement) => {
    if (!imageElement) return null;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await pipelineRef.current.processFrame(imageElement);
      setLastResult(res);
      return res;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isReady,
    isProcessing,
    lastResult,
    error,
    analyzeImage,
    pipeline: pipelineRef.current,
  };
}

export default useVisionPipeline;
