import React from 'react';
import type { AnalysisResult } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { saveAs } from 'file-saver';

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

  const exportToJSON = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPackets: analysis.totalPackets,
        uniqueRtcIds: Array.from(analysis.uniqueRtcIds),
        packetsWithIqData: analysis.rmsValues.length,
        averageRms: analysis.averageRms,
        minRms: Math.min(...analysis.rmsValues),
        maxRms: Math.max(...analysis.rmsValues),
      },
      frameStats: Object.fromEntries(analysis.frameStats),
      rmsValues: analysis.rmsValues,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    saveAs(blob, `pcap-analysis-${Date.now()}.json`);
  };

  const exportToCSV = () => {
    const headers = ['Packet_Index', 'RMS_Value'];
    const rows = analysis.rmsValues.map((rms, index) => `${index},${rms}`);
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, `rms-data-${Date.now()}.csv`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Analysis Summary</CardTitle>
          <CardDescription>Overview of the captured PCAP data.</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" x2="12" y1="15" y2="3"/>
              </svg>
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={exportToJSON}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToCSV}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14,2 14,8 20,8"/>
                <path d="m8 13 2 2-2 2"/>
                <path d="M12 17h4"/>
              </svg>
              Export RMS as CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                <Badge key={rtcId} variant="secondary" className="font-mono">
                  {rtcId}
                </Badge>
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