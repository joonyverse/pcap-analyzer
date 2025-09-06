import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/ui/FileUpload';
import { PacketFilter } from '@/components/ui/PacketFilter';
import { PacketList } from '@/components/viewer/PacketList';
import { PacketDetails } from '@/components/viewer/PacketDetails';
import { RMSChart } from '@/components/charts/RMSChart';
import { FrameDistributionChart } from '@/components/charts/FrameDistributionChart';
import { RtcDistributionChart } from '@/components/charts/RtcDistributionChart';
import { AnalysisSummary } from '@/components/analyzer/AnalysisSummary';
import { usePcapAnalyzer } from '@/hooks/usePcapAnalyzer';
import { useAdvancedFilter } from '@/hooks/useAdvancedFilter';
import { HelpModal } from '@/components/ui/HelpModal';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ThemeProvider } from '@/components/theme-provider';
import { AnalysisSkeleton } from '@/components/ui/AnalysisSkeleton';
import { CommandMenu } from '@/components/ui/CommandMenu';
import type { PacketInfo, FilterCriteria } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Toaster, toast } from 'sonner';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { QuestionMarkCircledIcon, DashboardIcon, ArchiveIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';


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
      toast.success(`Successfully analyzed ${packets.length} packets.`);
    }
  }, [packets]);

  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`);
    }
  }, [error]);

  const handleFilterChange = (key: keyof FilterCriteria, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const { filteredPackets } = useAdvancedFilter(packets, filters);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} />}
          <CommandMenu 
            packets={packets}
            onFilterChange={handleFilterChange}
            onPacketSelect={setSelectedPacket}
          />
          <Toaster />

          {/* Professional Header */}
          <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                {/* Logo and Title */}
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                    <DashboardIcon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-xl font-bold tracking-tight">PCAP Analyzer</h1>
                    <p className="text-xs text-muted-foreground font-medium">Professional Protocol Analysis</p>
                  </div>
                </div>
                
                {/* Status Indicators */}
                <div className="hidden lg:flex items-center space-x-6">
                  {packets.length > 0 && (
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-muted/50">
                        <ArchiveIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{packets.length.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">packets</span>
                      </div>
                      {filteredPackets.length !== packets.length && (
                        <Badge variant="default" className="text-xs font-medium">
                          {filteredPackets.length.toLocaleString()} filtered
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-3">
                  <ThemeToggle />
                  <Separator orientation="vertical" className="h-6" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setIsHelpModalOpen(true)}>
                        <QuestionMarkCircledIcon className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Help</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Show help information (Ctrl+K for quick search)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Upload Section */}
            <section>
              <Card className="border-0 shadow-sm bg-gradient-to-r from-background to-muted/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl font-bold tracking-tight">Upload Analysis</CardTitle>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Upload your PCAP file to begin comprehensive protocol analysis with advanced filtering and visualization
                      </p>
                    </div>
                    {packets.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedPacket(null);
                          setFilters({});
                          setActiveTab('dashboard');
                        }}
                      >
                        Upload New File
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} loadingProgress={loadingProgress} />
                </CardContent>
              </Card>
            </section>

            {/* Error Section */}
            {error && (
              <section>
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-destructive flex items-center gap-3">
                      <div className="rounded-full bg-destructive/10 p-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      Analysis Error
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-destructive/80 leading-relaxed">{error}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Please check your file format and try again. Supported formats: .pcap, .pcapng
                    </p>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Loading Section */}
            {isLoading && (
              <section>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl font-semibold flex items-center gap-3">
                          <div className="rounded-full bg-primary/10 p-2">
                            <DashboardIcon className="h-5 w-5 text-primary animate-pulse" />
                          </div>
                          Analyzing PCAP File
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Processing your file and extracting comprehensive packet data...
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {Math.round(loadingProgress)}%
                        </div>
                        <p className="text-xs text-muted-foreground">complete</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <AnalysisSkeleton />
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Analysis Results Section */}
            {!isLoading && packets.length > 0 && (
              <section className="space-y-8">
                {/* Results Header */}
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Analysis Results</h2>
                    <p className="text-base text-muted-foreground max-w-2xl">
                      Explore comprehensive PCAP data analysis with interactive visualizations, advanced filtering, and detailed packet inspection
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {packets.length.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">total packets</p>
                    </div>
                    {analysisResult && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-secondary-foreground">
                          {Object.keys(analysisResult.rtcDistribution).length}
                        </div>
                        <p className="text-xs text-muted-foreground">RTC IDs</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Modern Navigation Tabs */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-1 bg-muted/50 p-1.5 rounded-xl border">
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={cn(
                        "flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
                        activeTab === 'dashboard'
                          ? "bg-background text-foreground shadow-sm border border-border/50"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      )}
                    >
                      <DashboardIcon className="h-4 w-4" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => setActiveTab('packets')}
                      className={cn(
                        "flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
                        activeTab === 'packets'
                          ? "bg-background text-foreground shadow-sm border border-border/50"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      )}
                    >
                      <ArchiveIcon className="h-4 w-4" />
                      Packet Analysis
                      <Badge variant="secondary" className="ml-1 text-xs font-semibold bg-primary/10 text-primary border-0">
                        {filteredPackets.length.toLocaleString()}
                      </Badge>
                    </button>
                  </div>
                  
                  {/* Tab Action Area */}
                  <div className="flex items-center space-x-3">
                    {activeTab === 'packets' && filteredPackets.length !== packets.length && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                        <span>{packets.length - filteredPackets.length} filtered out</span>
                      </div>
                    )}
                    {selectedPacket && activeTab === 'packets' && (
                      <Badge variant="outline" className="text-xs">
                        Packet #{selectedPacket.index} selected
                      </Badge>
                    )}
                  </div>
                </div>

                <Card className="border-0 shadow-lg">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    
                    <CardContent className="p-0">
                      <TabsContent value="dashboard" className="m-0">
                        <div className="p-8 space-y-8">
                          <AnalysisSummary analysis={analysisResult} />
                          {analysisResult && (
                            <div className="grid gap-8 lg:grid-cols-3">
                              <RMSChart
                                rmsValues={analysisResult.rmsValues}
                                title="RMS Values Over Time"
                              />
                              <FrameDistributionChart
                                frameStats={analysisResult.frameStats}
                                title="Frame ID Distribution"
                              />
                              <RtcDistributionChart
                                rtcDistribution={analysisResult.rtcDistribution}
                                title="RTC ID Distribution"
                              />
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="packets" className="m-0">
                        <div className="p-8 space-y-8">
                          <PacketFilter 
                            packets={packets} 
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            clearFilters={clearFilters}
                          />
                          <Card className="border-0 shadow-sm">
                            <div className="h-[70vh] rounded-lg overflow-hidden">
                              <PanelGroup direction="horizontal">
                                <Panel defaultSize={70} minSize={30}>
                                  <PacketList
                                    packets={filteredPackets}
                                    selectedPacket={selectedPacket}
                                    onPacketSelect={setSelectedPacket}
                                    onFilterAdd={handleFilterChange}
                                  />
                                </Panel>
                                <PanelResizeHandle className="w-0.5 bg-border/60 hover:w-1 hover:bg-border transition-all duration-200" />
                                <Panel defaultSize={30} minSize={25}>
                                  <PacketDetails 
                                    packet={selectedPacket} 
                                    onFilterAdd={handleFilterChange} 
                                  />
                                </Panel>
                              </PanelGroup>
                            </div>
                          </Card>
                        </div>
                      </TabsContent>
                    </CardContent>
                  </Tabs>
                </Card>
              </section>
            )}
          </main>

          {/* Professional Footer */}
          {packets.length === 0 && !isLoading && !error && (
            <footer className="border-t bg-muted/30 mt-16">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid gap-8 lg:grid-cols-3">
                  {/* Brand Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                        <DashboardIcon className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">PCAP Analyzer</h3>
                        <p className="text-xs text-muted-foreground">Professional Protocol Analysis</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Advanced packet capture analysis tool designed for protocol development and testing.
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Key Features</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        Real-time packet analysis & filtering
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        IQ data visualization & RMS calculation
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        eCPRI protocol support
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        Professional hex dump viewer
                      </li>
                    </ul>
                  </div>

                  {/* Support */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Supported Formats</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">.pcap</Badge>
                      <Badge variant="secondary">.pcapng</Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsHelpModalOpen(true)}
                      className="w-fit"
                    >
                      <QuestionMarkCircledIcon className="h-4 w-4 mr-2" />
                      Help & Documentation
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-8" />
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground">
                    © 2024 PCAP Analyzer - Professional network protocol analysis tool
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Built for protocol development</span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>Enterprise-grade analysis</span>
                  </div>
                </div>
              </div>
            </footer>
          )}
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;