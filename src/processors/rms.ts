import type { IQData } from '../types';

export class RMSProcessor {
  public static calculateRMS(iqData: IQData): number {
    if (iqData.i.length === 0 || iqData.q.length === 0) {
      return 0;
    }

    const length = Math.min(iqData.i.length, iqData.q.length);
    let sumSquares = 0;

    for (let i = 0; i < length; i++) {
      const magnitude = Math.sqrt(iqData.i[i] * iqData.i[i] + iqData.q[i] * iqData.q[i]);
      sumSquares += magnitude * magnitude;
    }

    return Math.sqrt(sumSquares / length);
  }

  public static calculateRMSForISamples(iSamples: number[]): number {
    if (iSamples.length === 0) {
      return 0;
    }

    const sumSquares = iSamples.reduce((sum, sample) => sum + sample * sample, 0);
    return Math.sqrt(sumSquares / iSamples.length);
  }

  public static calculateRMSForQSamples(qSamples: number[]): number {
    if (qSamples.length === 0) {
      return 0;
    }

    const sumSquares = qSamples.reduce((sum, sample) => sum + sample * sample, 0);
    return Math.sqrt(sumSquares / qSamples.length);
  }

  public static calculatePowerSpectralDensity(iqData: IQData): number[] {
    const length = Math.min(iqData.i.length, iqData.q.length);
    const psd: number[] = [];

    // 간단한 PSD 계산 (FFT 없이)
    for (let i = 0; i < length; i++) {
      const power = iqData.i[i] * iqData.i[i] + iqData.q[i] * iqData.q[i];
      psd.push(power);
    }

    return psd;
  }

  public static calculateSignalQuality(iqData: IQData): {
    rms: number;
    peakToPeak: number;
    dynamicRange: number;
    snr: number;
  } {
    const rms = this.calculateRMS(iqData);
    const length = Math.min(iqData.i.length, iqData.q.length);
    
    let maxMagnitude = 0;
    let minMagnitude = Infinity;
    let powerSum = 0;

    for (let i = 0; i < length; i++) {
      const magnitude = Math.sqrt(iqData.i[i] * iqData.i[i] + iqData.q[i] * iqData.q[i]);
      maxMagnitude = Math.max(maxMagnitude, magnitude);
      minMagnitude = Math.min(minMagnitude, magnitude);
      powerSum += magnitude * magnitude;
    }

    const peakToPeak = maxMagnitude - minMagnitude;
    const averagePower = powerSum / length;
    const dynamicRange = maxMagnitude / (minMagnitude || 1);
    
    // 간단한 SNR 추정 (실제로는 더 복잡한 계산 필요)
    const snr = 10 * Math.log10(averagePower / (rms * rms * 0.01));

    return {
      rms,
      peakToPeak,
      dynamicRange,
      snr,
    };
  }
}