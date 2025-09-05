import React from 'react';
import type { AnalysisResult } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

interface AnalysisSummaryProps {
  analysis: AnalysisResult | null;
}

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({ analysis }) => {
  if (!analysis) {
    return (
      <Card className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">No analysis data available</p>
      </Card>
    );
  }

  const formatNumber = (num: number) => num.toLocaleString();
  const formatRMS = (rms: number) => rms.toFixed(4);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Summary</CardTitle>
        <CardDescription>Overview of the captured PCAP data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Packets" value={formatNumber(analysis.totalPackets)} />
          <StatCard title="Unique RTC IDs" value={analysis.uniqueRtcIds.size} />
          <StatCard title="Packets with IQ Data" value={formatNumber(analysis.rmsValues.length)} />
          <StatCard title="Average RMS" value={formatRMS(analysis.averageRms)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">RTC ID Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Array.from(analysis.uniqueRtcIds).sort((a, b) => a - b).map(rtcId => (
                <div key={rtcId} className="rounded-md bg-muted px-2 py-1 text-xs font-mono">
                  {rtcId}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">RMS Statistics</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum RMS:</span>
                <span>{formatRMS(Math.min(...analysis.rmsValues))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maximum RMS:</span>
                <span>{formatRMS(Math.max(...analysis.rmsValues))}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};