import { useState, useCallback } from 'react';
import type { PacketInfo, AnalysisResult } from '../types';
import { PcapParser } from '../parsers/pcap';
import { OranParser } from '../parsers/oran';
import { BFPCProcessor } from '../processors/bfpc';
import { RMSProcessor } from '../processors/rms';

// Helper function to yield control back to browser
const yieldToMain = () => {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
};

export const usePcapAnalyzer = () => {
  const [packets, setPackets] = useState<PacketInfo[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const analyzePcapFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setLoadingProgress(0);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      setLoadingProgress(10);

      const parser = new PcapParser(buffer);
      
      // PCAP 헤더 파싱
      parser.parseGlobalHeader();
      setLoadingProgress(20);

      // 패킷 파싱
      const parsedPackets = parser.parsePackets();
      setLoadingProgress(50);

      // 청크 단위로 O-RAN 패킷 처리
      const enrichedPackets: PacketInfo[] = [];
      const chunkSize = 50; // 50개씩 처리

      for (let i = 0; i < parsedPackets.length; i += chunkSize) {
        const chunk = parsedPackets.slice(i, i + chunkSize);
        
        const processedChunk = chunk.map(packet => {
          if (OranParser.isOranPacket(packet)) {
            return OranParser.enrichPacketWithOran(packet);
          }
          return packet;
        });

        enrichedPackets.push(...processedChunk);
        
        // UI 업데이트를 위해 잠시 양보
        await yieldToMain();
        
        // 진행률 업데이트 (50% ~ 80%)
        const progress = 50 + ((i + chunkSize) / parsedPackets.length) * 30;
        setLoadingProgress(Math.min(progress, 80));
      }

      // BFPC 처리 및 RMS 계산도 청크 단위로 처리
      const processedPackets: PacketInfo[] = [];
      
      for (let i = 0; i < enrichedPackets.length; i += chunkSize) {
        const chunk = enrichedPackets.slice(i, i + chunkSize);
        
        const processedChunk = chunk.map(packet => {
          if (packet.iqData) {
            // BFPC 압축 해제 처리
            const rawIQData = packet.rawData.slice(30); // 헤더 제외
            const processedIQ = BFPCProcessor.processBFPCData(rawIQData);
            packet.iqData = processedIQ;
          }
          return packet;
        });

        processedPackets.push(...processedChunk);
        
        // UI 업데이트를 위해 잠시 양보
        await yieldToMain();
        
        // 진행률 업데이트 (80% ~ 90%)
        const progress = 80 + ((i + chunkSize) / enrichedPackets.length) * 10;
        setLoadingProgress(Math.min(progress, 90));
      }

      setPackets(processedPackets);
      setLoadingProgress(95);

      // 분석 결과 생성
      const analysis = await generateAnalysisResultAsync(processedPackets);
      setAnalysisResult(analysis);
      setLoadingProgress(100);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
    }
  }, []);

  const generateAnalysisResultAsync = async (packets: PacketInfo[]): Promise<AnalysisResult> => {
    const uniqueRtcIds = new Set<number>();
    const frameStats = new Map<number, number>();
    const rtcDistribution = new Map<number, number>();
    const rmsValues: number[] = [];

    const chunkSize = 100; // 100개씩 처리

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

        if (packet.iqData) {
          const rms = RMSProcessor.calculateRMS(packet.iqData);
          if (rms > 0) {
            rmsValues.push(rms);
          }
        }
      });

      // UI 블로킹 방지를 위해 주기적으로 양보
      if (i % (chunkSize * 5) === 0) {
        await yieldToMain();
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
    error,
    analyzePcapFile,
    filterPackets,
  };
};