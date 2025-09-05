import { useState, useEffect, useMemo } from 'react';
import { FileUpload } from '@/components/ui/FileUpload';
import { PacketFilter } from '@/components/ui/PacketFilter';
import { PacketList } from '@/components/viewer/PacketList';
import { PacketDetails } from '@/components/viewer/PacketDetails';
import { RMSChart } from '@/components/charts/RMSChart';
import { AnalysisSummary } from '@/components/analyzer/AnalysisSummary';
import { usePcapAnalyzer } from '@/hooks/usePcapAnalyzer';
import { HelpModal } from '@/components/ui/HelpModal';
import type { PacketInfo, FilterCriteria } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// This function is needed for filtering, so it's defined here
function calculatePacketRMS(packet: PacketInfo): number {
  if (!packet.iqData) return 0;
  const { i, q } = packet.iqData;
  const length = Math.min(i.length, q.length);
  if (length === 0) return 0;
  let sumSquares = 0;
  for (let idx = 0; idx < length; idx++) {
    const magnitude = Math.sqrt(i[idx] * i[idx] + q[idx] * q[idx]);
    sumSquares += magnitude * magnitude;
  }
  return Math.sqrt(sumSquares / length);
}

function App() {
  const { packets, analysisResult, isLoading, loadingProgress, error, analyzePcapFile } = usePcapAnalyzer();
  const [selectedPacket, setSelectedPacket] = useState<PacketInfo | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState<FilterCriteria>({});
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedPacket(null);
    setFilters({});
    analyzePcapFile(file);
  };

  useEffect(() => {
    if (packets.length > 0) {
      setActiveTab('dashboard');
    }
  }, [packets]);

  const handleFilterChange = (key: keyof FilterCriteria, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const filteredPackets = useMemo(() => {
    if (Object.keys(filters).length === 0) {
      return packets;
    }
    return packets.filter(packet => {
      if (filters.rtcId !== undefined && packet.ecpriHeader.rtcId !== filters.rtcId) return false;
      if (filters.frameId !== undefined && packet.oranHeader?.frameId !== filters.frameId) return false;
      if (filters.messageType !== undefined && packet.ecpriHeader.messageType !== filters.messageType) return false;
      if (packet.iqData && (filters.minRms !== undefined || filters.maxRms !== undefined)) {
        const rms = calculatePacketRMS(packet);
        if (filters.minRms !== undefined && rms < filters.minRms) return false;
        if (filters.maxRms !== undefined && rms > filters.maxRms) return false;
      }
      if (filters.searchText && filters.searchText.trim()) {
        const searchLower = filters.searchText.toLowerCase();
        const matchesSearch = 
          packet.ethernetHeader.source.toLowerCase().includes(searchLower) ||
          packet.ethernetHeader.destination.toLowerCase().includes(searchLower) ||
          packet.ecpriHeader.rtcId.toString().includes(searchLower) ||
          (packet.oranHeader?.frameId?.toString().includes(searchLower) || false) ||
          packet.index.toString().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [packets, filters]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} />}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <h1 className="text-2xl font-bold">PCAP Analyzer for O-RAN</h1>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <Button variant="ghost" size="icon" onClick={() => setIsHelpModalOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload PCAP File</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} loadingProgress={loadingProgress} />
          </CardContent>
        </Card>

        {error && 
          <Card className="mb-8 bg-destructive text-destructive-foreground">
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        }

        {packets.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="packets">Packets ({filteredPackets.length}/{packets.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <AnalysisSummary analysis={analysisResult} />
                {analysisResult && (
                  <RMSChart
                    rmsValues={analysisResult.rmsValues}
                    title="RMS Values Distribution"
                  />
                )}
              </div>
            </TabsContent>
            <TabsContent value="packets" className="mt-4">
              <div className="grid gap-4">
                <PacketFilter 
                  packets={packets} 
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  clearFilters={clearFilters}
                />
                <div className="grid md:grid-cols-2 gap-4 h-[60vh]">
                  <PacketList
                    packets={filteredPackets}
                    selectedPacket={selectedPacket}
                    onPacketSelect={setSelectedPacket}
                    onFilterAdd={handleFilterChange}
                  />
                  <PacketDetails 
                    packet={selectedPacket} 
                    onFilterAdd={handleFilterChange} 
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

export default App;