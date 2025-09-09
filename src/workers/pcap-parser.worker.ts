import type { 
  PacketInfo, 
  AnalysisResult, 
  WorkerParseMessage, 
  WorkerProgressMessage, 
  WorkerCompleteMessage, 
  WorkerErrorMessage 
} from '../types';
import { PcapParser } from '../parsers/pcap';
import { OranParser } from '../parsers/oran';
import { BFPCProcessor } from '../processors/bfpc';
import { RMSProcessor } from '../processors/rms';

// Web Worker context
declare const self: DedicatedWorkerGlobalScope;
const ctx: DedicatedWorkerGlobalScope = self;

// Helper function to send progress updates
const sendProgress = (
  progress: number, 
  stage: 'parsing' | 'enriching' | 'processing' | 'analyzing',
  processedCount: number = 0,
  totalCount: number = 0
) => {
  const message: WorkerProgressMessage = {
    type: 'progress',
    payload: {
      progress,
      stage,
      processedCount,
      totalCount
    }
  };
  ctx.postMessage(message);
};

// Helper function to send error
const sendError = (error: Error) => {
  const message: WorkerErrorMessage = {
    type: 'error',
    payload: {
      message: error.message,
      stack: error.stack
    }
  };
  ctx.postMessage(message);
};

// Helper function to yield control back to event loop
const yieldToEventLoop = () => {
  return new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });
};

// Main processing function
const processPcapFile = async (
  buffer: ArrayBuffer,
  options: {
    chunkSize?: number;
    enableBFPC?: boolean;
    enableRMS?: boolean;
  } = {}
) => {
  const { 
    chunkSize = 50, 
    enableBFPC = true, 
    enableRMS = true 
  } = options;

  try {
    sendProgress(0, 'parsing', 0, 0);

    // Step 1: Parse PCAP file
    const parser = new PcapParser(buffer);
    parser.parseGlobalHeader();
    sendProgress(10, 'parsing');

    const parsedPackets = parser.parsePackets();
    const totalPackets = parsedPackets.length;
    sendProgress(30, 'parsing', parsedPackets.length, totalPackets);

    // Step 2: Enrich with O-RAN data in chunks
    sendProgress(35, 'enriching', 0, totalPackets);
    const enrichedPackets: PacketInfo[] = [];

    for (let i = 0; i < parsedPackets.length; i += chunkSize) {
      const chunk = parsedPackets.slice(i, i + chunkSize);
      
      const processedChunk = chunk.map(packet => {
        if (OranParser.isOranPacket(packet)) {
          return OranParser.enrichPacketWithOran(packet);
        }
        return packet;
      });

      enrichedPackets.push(...processedChunk);
      
      // Yield control to prevent blocking
      await yieldToEventLoop();
      
      // Progress update (35% ~ 60%)
      const progress = 35 + ((i + chunkSize) / totalPackets) * 25;
      sendProgress(
        Math.min(progress, 60), 
        'enriching', 
        i + chunkSize, 
        totalPackets
      );
    }

    // Step 3: Process BFPC data if enabled
    if (enableBFPC) {
      sendProgress(65, 'processing', 0, totalPackets);
      
      for (let i = 0; i < enrichedPackets.length; i += chunkSize) {
        const chunk = enrichedPackets.slice(i, i + chunkSize);
        
        chunk.forEach(packet => {
          if (packet.iqData) {
            try {
              // BFPC 압축 해제 처리
              const rawIQData = packet.rawData.slice(30); // 헤더 제외
              const processedIQ = BFPCProcessor.processBFPCData(rawIQData);
              packet.iqData = processedIQ;
            } catch (error) {
              console.warn(`BFPC processing failed for packet ${packet.index}:`, error);
            }
          }
        });

        // Yield control to prevent blocking
        await yieldToEventLoop();
        
        // Progress update (65% ~ 80%)
        const progress = 65 + ((i + chunkSize) / totalPackets) * 15;
        sendProgress(
          Math.min(progress, 80), 
          'processing', 
          i + chunkSize, 
          totalPackets
        );
      }
    } else {
      sendProgress(80, 'processing', totalPackets, totalPackets);
    }

    // Step 4: Generate analysis result
    sendProgress(85, 'analyzing', 0, totalPackets);
    const analysisResult = await generateAnalysisResult(enrichedPackets, enableRMS, chunkSize);
    sendProgress(100, 'analyzing', totalPackets, totalPackets);

    // Send completion message
    const message: WorkerCompleteMessage = {
      type: 'complete',
      payload: {
        packets: enrichedPackets,
        analysisResult
      }
    };
    ctx.postMessage(message);

  } catch (error) {
    console.error('Worker processing error:', error);
    sendError(error instanceof Error ? error : new Error('Unknown error'));
  }
};

// Generate analysis result with chunked processing
const generateAnalysisResult = async (
  packets: PacketInfo[], 
  enableRMS: boolean,
  chunkSize: number = 100
): Promise<AnalysisResult> => {
  const uniqueRtcIds = new Set<number>();
  const frameStats = new Map<number, number>();
  const rtcDistribution = new Map<number, number>();
  const rmsValues: number[] = [];

  for (let i = 0; i < packets.length; i += chunkSize) {
    const chunk = packets.slice(i, i + chunkSize);
    
    chunk.forEach(packet => {
      const rtcId = packet.ecpriHeader.rtcId;
      uniqueRtcIds.add(rtcId);
      rtcDistribution.set(rtcId, (rtcDistribution.get(rtcId) || 0) + 1);

      if (packet.oranHeader) {
        const frameId = packet.oranHeader.frameId;
        frameStats.set(frameId, (frameStats.get(frameId) || 0) + 1);
      }

      if (enableRMS && packet.iqData) {
        try {
          const rms = RMSProcessor.calculateRMS(packet.iqData);
          if (rms > 0) {
            rmsValues.push(rms);
          }
        } catch (error) {
          console.warn(`RMS calculation failed for packet ${packet.index}:`, error);
        }
      }
    });

    // Yield control every 5 chunks to prevent blocking
    if (i % (chunkSize * 5) === 0) {
      await yieldToEventLoop();
      
      // Send progress for analysis stage
      const progress = 85 + ((i + chunkSize) / packets.length) * 15;
      sendProgress(
        Math.min(progress, 100), 
        'analyzing', 
        i + chunkSize, 
        packets.length
      );
    }
  }

  const averageRms = rmsValues.length > 0 
    ? rmsValues.reduce((sum, rms) => sum + rms, 0) / rmsValues.length 
    : 0;

  return {
    totalPackets: packets.length,
    uniqueRtcIds,
    frameStats,
    rtcDistribution,
    rmsValues,
    averageRms,
  };
};

// Listen for messages from main thread
ctx.addEventListener('message', async (event: MessageEvent) => {
  const message = event.data as WorkerParseMessage;
  
  if (message.type === 'parse') {
    const { buffer, options } = message.payload;
    await processPcapFile(buffer, options);
  }
});

// Export for TypeScript
export {};