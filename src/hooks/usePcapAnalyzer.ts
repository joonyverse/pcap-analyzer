import { useState, useCallback, useRef } from 'react';
import type { 
  PacketInfo, 
  AnalysisResult, 
  WorkerParseMessage, 
  WorkerMessage,
  WorkerProgressMessage,
  WorkerCompleteMessage,
  WorkerErrorMessage
} from '../types';

export const usePcapAnalyzer = () => {
  const [packets, setPackets] = useState<PacketInfo[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [canCancelAnalysis, setCanCancelAnalysis] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);

  // Cancel analysis function
  const cancelAnalysis = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsLoading(false);
      setCanCancelAnalysis(false);
      setLoadingProgress(0);
      setLoadingStage('');
      setError('Analysis was cancelled by user');
    }
  }, []);

  const analyzePcapFile = useCallback(async (file: File, options?: {
    chunkSize?: number;
    enableBFPC?: boolean;
    enableRMS?: boolean;
  }) => {
    // Cancel any existing analysis
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    setIsLoading(true);
    setCanCancelAnalysis(true);
    setLoadingProgress(0);
    setLoadingStage('Initializing...');
    setError(null);

    try {
      // Read file as ArrayBuffer
      const buffer = await file.arrayBuffer();
      
      // Create new worker
      workerRef.current = new Worker(
        new URL('../workers/pcap-parser.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Set up promise to handle worker completion
      const workerPromise = new Promise<{ packets: PacketInfo[], analysisResult: AnalysisResult }>((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
          const message = event.data;

          switch (message.type) {
            case 'progress': {
              const progressData = (message as WorkerProgressMessage).payload;
              setLoadingProgress(progressData.progress);
              setLoadingStage(getStageDisplayName(progressData.stage, progressData.processedCount, progressData.totalCount));
              break;
            }

            case 'complete': {
              const completeData = (message as WorkerCompleteMessage).payload;
              resolve(completeData);
              break;
            }

            case 'error': {
              const errorData = (message as WorkerErrorMessage).payload;
              reject(new Error(errorData.message));
              break;
            }
          }
        };

        workerRef.current.onerror = (error) => {
          reject(new Error(`Worker error: ${error.message}`));
        };
      });

      // Send parse message to worker
      const parseMessage: WorkerParseMessage = {
        type: 'parse',
        payload: {
          buffer,
          options: {
            chunkSize: 50,
            enableBFPC: true,
            enableRMS: true,
            ...options
          }
        }
      };

      workerRef.current.postMessage(parseMessage);

      // Wait for completion
      const { packets: processedPackets, analysisResult: analysis } = await workerPromise;

      // Update state with results
      setPackets(processedPackets);
      setAnalysisResult(analysis);
      setLoadingStage('Complete');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('PCAP analysis error:', err);
    } finally {
      // Clean up worker
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      
      setIsLoading(false);
      setCanCancelAnalysis(false);
      setLoadingProgress(0);
      setLoadingStage('');
    }
  }, []);

  // Helper function to convert stage names to display names
  const getStageDisplayName = (
    stage: 'parsing' | 'enriching' | 'processing' | 'analyzing',
    processedCount: number = 0,
    totalCount: number = 0
  ): string => {
    const countText = totalCount > 0 ? ` (${processedCount}/${totalCount})` : '';
    
    switch (stage) {
      case 'parsing':
        return `Parsing PCAP file${countText}`;
      case 'enriching':
        return `Processing O-RAN headers${countText}`;
      case 'processing':
        return `Processing BFPC compression${countText}`;
      case 'analyzing':
        return `Generating analysis${countText}`;
      default:
        return 'Processing...';
    }
  };

  const filterPackets = useCallback((filter: {
    rtcId?: number;
    frameId?: number;
    messageType?: number;
  }) => {
    return packets.filter(packet => {
      if (filter.rtcId !== undefined && packet.ecpriHeader.rtcId !== filter.rtcId) {
        return false;
      }
      if (filter.frameId !== undefined && packet.oranHeader?.frameId !== filter.frameId) {
        return false;
      }
      if (filter.messageType !== undefined && packet.ecpriHeader.messageType !== filter.messageType) {
        return false;
      }
      return true;
    });
  }, [packets]);

  return {
    packets,
    analysisResult,
    isLoading,
    loadingProgress,
    loadingStage,
    canCancelAnalysis,
    error,
    analyzePcapFile,
    cancelAnalysis,
    filterPackets,
  };
};