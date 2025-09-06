import React, { useState, useMemo } from 'react';
import type { PacketInfo, FilterCriteria } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  CopyIcon, 
  InfoCircledIcon, 
  CodeIcon,
  BarChartIcon,
  ActivityLogIcon,
  CheckIcon
} from '@radix-ui/react-icons';

interface PacketDetailsProps {
  packet: PacketInfo | null;
  onFilterAdd: (key: keyof FilterCriteria, value: any) => void;
}

// Enhanced detailed field component with copy functionality and better styling
const DetailField: React.FC<{ 
  label: string; 
  value: React.ReactNode; 
  filterKey?: keyof FilterCriteria; 
  onFilterAdd: Function; 
  isFilterable?: boolean; 
  isBadge?: boolean;
  description?: string;
  copyable?: boolean;
}> = ({ label, value, filterKey, onFilterAdd, isFilterable = false, isBadge = false, description, copyable = false }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="group grid grid-cols-3 gap-3 items-center py-1.5 hover:bg-accent/10 rounded px-2 transition-colors">
      <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        {label}
        {description && (
          <Tooltip>
            <TooltipTrigger>
              <InfoCircledIcon className="h-3 w-3 text-muted-foreground/60" />
            </TooltipTrigger>
            <TooltipContent>
              <ScrollArea className="max-h-32 max-w-xs">
                <p className="text-xs p-2">{description}</p>
              </ScrollArea>
            </TooltipContent>
          </Tooltip>
        )}
      </dt>
      <dd className="col-span-2 flex items-center gap-1.5">
        <span 
          className={cn(
            "text-xs flex-1 min-w-0",
            isFilterable && "cursor-pointer hover:text-primary transition-colors"
          )}
          onClick={() => isFilterable && filterKey && onFilterAdd(filterKey, value)}
          title={String(value)}
        >
          {isBadge ? (
            <Badge variant="outline" className="font-mono text-xs truncate max-w-full">
              {value}
            </Badge>
          ) : (
            <span className="font-mono text-xs truncate block">{value}</span>
          )}
        </span>
        {copyable && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(String(value))}
              >
                {copied ? (
                  <CheckIcon className="h-3 w-3 text-green-600" />
                ) : (
                  <CopyIcon className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{copied ? 'Copied!' : 'Copy to clipboard'}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </dd>
    </div>
  );
};

export const PacketDetails: React.FC<PacketDetailsProps> = ({ packet, onFilterAdd }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [hexViewMode, setHexViewMode] = useState<'hex' | 'ascii' | 'both'>('both');

  // Enhanced packet analysis
  const packetAnalysis = useMemo(() => {
    if (!packet) return null;

    const calculateRMS = () => {
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
    };

    const rms = calculateRMS();
    const hasIqData = !!packet.iqData;
    const isORan = !!packet.oranHeader;
    const dataQuality = rms > 10 ? 'High' : rms > 1 ? 'Medium' : 'Low';

    return {
      rms,
      hasIqData,
      isORan,
      dataQuality,
      headerSize: 14 + 8 + (isORan ? 16 : 0), // Ethernet + eCPRI + O-RAN
      payloadRatio: ((packet.ecpriHeader.payloadSize / packet.length) * 100).toFixed(1)
    };
  }, [packet]);

  if (!packet) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <InfoCircledIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Select a packet to view detailed analysis</p>
          <p className="text-xs text-muted-foreground/60">
            Click on any packet in the list to explore headers, data, and analytics
          </p>
        </div>
      </Card>
    );
  }

  const formatHexDump = (data: Uint8Array, mode: 'hex' | 'ascii' | 'both' = 'both') => {
    const bytes = Array.from(data.slice(0, 512)); // Show more data
    let result = '';
    
    for (let i = 0; i < bytes.length; i += 16) {
      const slice = bytes.slice(i, i + 16);
      const offset = i.toString(16).padStart(8, '0').toUpperCase();
      
      if (mode === 'hex' || mode === 'both') {
        const hex = slice.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        const ascii = slice.map(byte => (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.').join('');
        
        if (mode === 'both') {
          result += `${offset}  ${hex.padEnd(48)}  |${ascii}|\n`;
        } else {
          result += `${offset}  ${hex}\n`;
        }
      } else {
        const ascii = slice.map(byte => (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.').join('');
        result += `${offset}  ${ascii}\n`;
      }
    }
    return result;
  };

  const getPacketStatusBadge = () => {
    if (packet.ecpriHeader.messageType === 0) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">IQ Data</Badge>;
    }
    return <Badge variant="secondary">Control</Badge>;
  };

  const getRMSBadge = (rms: number) => {
    if (rms > 10) return <Badge className="bg-red-100 text-red-800">High RMS</Badge>;
    if (rms > 1) return <Badge className="bg-yellow-100 text-yellow-800">Medium RMS</Badge>;
    return <Badge className="bg-green-100 text-green-800">Low RMS</Badge>;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ActivityLogIcon className="h-5 w-5 text-primary" />
              Packet #{packet.index.toLocaleString()}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{new Date(packet.timestamp * 1000).toLocaleTimeString()}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{packet.length} bytes</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getPacketStatusBadge()}
            {packetAnalysis?.hasIqData && getRMSBadge(packetAnalysis.rms)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid grid-cols-4 w-full rounded-none border-b">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <InfoCircledIcon className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="headers" className="flex items-center gap-1">
              <CodeIcon className="h-4 w-4" />
              Headers
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1">
              <BarChartIcon className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="raw" className="flex items-center gap-1">
              <CodeIcon className="h-4 w-4" />
              Hex Data
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-grow">
            <TabsContent value="overview" className="p-6 space-y-6">
              {/* Quick Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-2xl font-bold text-primary">
                    {packet.ecpriHeader.payloadSize}
                  </div>
                  <p className="text-xs text-muted-foreground">Payload Bytes</p>
                  <Progress 
                    value={parseFloat(packetAnalysis?.payloadRatio || '0')} 
                    className="mt-2 h-1" 
                  />
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-primary">
                    {packetAnalysis?.rms.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">RMS Value</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Quality: {packetAnalysis?.dataQuality}
                  </div>
                </Card>
              </div>

              {/* Quick Access Info */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Key Fields</h4>
                <div className="space-y-0.5">
                  <DetailField 
                    label="Timestamp" 
                    value={new Date(packet.timestamp * 1000).toISOString()} 
                    onFilterAdd={onFilterAdd}
                    copyable
                    description="Packet capture timestamp in ISO format"
                  />
                  <DetailField 
                    label="Source MAC" 
                    value={packet.ethernetHeader.source} 
                    filterKey="searchText" 
                    onFilterAdd={onFilterAdd} 
                    isFilterable 
                    copyable
                    description="Source MAC address"
                  />
                  <DetailField 
                    label="Dest MAC" 
                    value={packet.ethernetHeader.destination} 
                    filterKey="searchText" 
                    onFilterAdd={onFilterAdd} 
                    isFilterable 
                    copyable
                    description="Destination MAC address"
                  />
                  <DetailField 
                    label="RTC ID" 
                    value={`0x${packet.ecpriHeader.rtcId.toString(16).toUpperCase()}`} 
                    filterKey="rtcId" 
                    onFilterAdd={onFilterAdd} 
                    isFilterable
                    copyable
                    description="Real-Time Control Identifier"
                  />
                  {packet.oranHeader && (
                    <DetailField 
                      label="Frame ID" 
                      value={packet.oranHeader.frameId} 
                      filterKey="frameId" 
                      onFilterAdd={onFilterAdd} 
                      isFilterable
                      description="System Frame Number"
                    />
                  )}
                </div>
              </div>

              {/* Alerts/Warnings */}
              {packetAnalysis && packetAnalysis.rms > 15 && (
                <Alert>
                  <InfoCircledIcon className="h-4 w-4" />
                  <AlertDescription>
                    High RMS value detected ({packetAnalysis.rms.toFixed(2)}). This may indicate signal saturation.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="headers" className="p-4">
              <Accordion type="multiple" defaultValue={['ethernet', 'ecpri']} className="w-full space-y-2">
                <AccordionItem value="ethernet">
                  <AccordionTrigger className="text-left py-3">
                    <span className="font-medium">Ethernet Header (14 bytes)</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-1">
                      <DetailField 
                        label="Source MAC" 
                        value={packet.ethernetHeader.source} 
                        filterKey="searchText" 
                        onFilterAdd={onFilterAdd} 
                        isFilterable 
                        copyable
                        description="48-bit source hardware address"
                      />
                      <DetailField 
                        label="Destination MAC" 
                        value={packet.ethernetHeader.destination} 
                        filterKey="searchText" 
                        onFilterAdd={onFilterAdd} 
                        isFilterable 
                        copyable
                        description="48-bit destination hardware address"
                      />
                      <DetailField 
                        label="EtherType" 
                        value={`0x${packet.ethernetHeader.ethertype.toString(16).toUpperCase()}`} 
                        onFilterAdd={onFilterAdd} 
                        copyable
                        description="Protocol identifier for the next layer"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ecpri">
                  <AccordionTrigger className="text-left py-3">
                    <span className="font-medium">eCPRI Header (8 bytes)</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-1">
                      <DetailField 
                        label="Version" 
                        value={packet.ecpriHeader.version} 
                        onFilterAdd={onFilterAdd}
                        description="eCPRI protocol version"
                      />
                      <DetailField 
                        label="Message Type" 
                        value={packet.ecpriHeader.messageType} 
                        filterKey="messageType" 
                        onFilterAdd={onFilterAdd} 
                        isFilterable
                        description="0: IQ Data, 2: Bit Sequence, etc."
                      />
                      <DetailField 
                        label="Payload Size" 
                        value={`${packet.ecpriHeader.payloadSize} bytes`} 
                        onFilterAdd={onFilterAdd}
                        description="Size of eCPRI payload in bytes"
                      />
                      <DetailField 
                        label="RTC ID" 
                        value={`0x${packet.ecpriHeader.rtcId.toString(16).toUpperCase()}`} 
                        filterKey="rtcId" 
                        onFilterAdd={onFilterAdd} 
                        isFilterable 
                        copyable
                        description="Real-Time Control Identifier"
                      />
                      <DetailField 
                        label="Sequence ID" 
                        value={packet.ecpriHeader.seqId} 
                        onFilterAdd={onFilterAdd}
                        description="Sequence number for message ordering"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {packet.oranHeader && (
                  <AccordionItem value="oran">
                    <AccordionTrigger className="text-left py-3">
                      <span className="font-medium">Application Header (16+ bytes)</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-1">
                        <DetailField 
                          label="Data Direction" 
                          value={packet.oranHeader.dataDirection === 0 ? 'Uplink' : 'Downlink'} 
                          onFilterAdd={onFilterAdd}
                          description="0: Uplink, 1: Downlink"
                        />
                        <DetailField 
                          label="Frame ID" 
                          value={packet.oranHeader.frameId} 
                          filterKey="frameId" 
                          onFilterAdd={onFilterAdd} 
                          isFilterable
                          description="System Frame Number (0-1023)"
                        />
                        <DetailField 
                          label="Subframe ID" 
                          value={packet.oranHeader.subframeId} 
                          onFilterAdd={onFilterAdd}
                          description="Subframe within the frame (0-9)"
                        />
                        <DetailField 
                          label="Slot ID" 
                          value={packet.oranHeader.slotId} 
                          onFilterAdd={onFilterAdd}
                          description="Slot within subframe"
                        />
                        <DetailField 
                          label="Symbol ID" 
                          value={packet.oranHeader.symbolId} 
                          onFilterAdd={onFilterAdd}
                          description="OFDM symbol within slot"
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </TabsContent>

            <TabsContent value="analytics" className="p-6 space-y-6">
              {packet.iqData ? (
                <>
                  {/* IQ Data Statistics */}
                  <Card className="p-4">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <BarChartIcon className="h-4 w-4" />
                      IQ Data Analysis
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {packet.iqData.i.length.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">I Samples</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {packet.iqData.q.length.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Q Samples</p>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">
                        {packetAnalysis?.rms.toFixed(3)}
                      </div>
                      <p className="text-xs text-muted-foreground">RMS Power</p>
                    </div>
                  </Card>

                  {/* Sample Range */}
                  <Card className="p-4">
                    <h4 className="font-medium text-sm mb-3">Sample Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>I Min/Max:</span>
                        <span className="font-mono">
                          {Math.min(...packet.iqData.i).toFixed(2)} / {Math.max(...packet.iqData.i).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Q Min/Max:</span>
                        <span className="font-mono">
                          {Math.min(...packet.iqData.q).toFixed(2)} / {Math.max(...packet.iqData.q).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Data Quality:</span>
                        <Badge variant="outline">{packetAnalysis?.dataQuality}</Badge>
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <Alert>
                  <InfoCircledIcon className="h-4 w-4" />
                  <AlertDescription>
                    No IQ data available for this packet. This packet may contain control information or other non-IQ data.
                  </AlertDescription>
                </Alert>
              )}

              {/* Packet Structure */}
              <Card className="p-4">
                <h4 className="font-medium text-sm mb-3">Packet Structure</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Length:</span>
                    <span className="font-mono">{packet.length} bytes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Header Size:</span>
                    <span className="font-mono">{packetAnalysis?.headerSize} bytes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payload Size:</span>
                    <span className="font-mono">{packet.ecpriHeader.payloadSize} bytes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payload Ratio:</span>
                    <span className="font-mono">{packetAnalysis?.payloadRatio}%</span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="raw" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Raw Packet Data</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={hexViewMode === 'hex' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setHexViewMode('hex')}
                    >
                      Hex
                    </Button>
                    <Button
                      variant={hexViewMode === 'ascii' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setHexViewMode('ascii')}
                    >
                      ASCII
                    </Button>
                    <Button
                      variant={hexViewMode === 'both' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setHexViewMode('both')}
                    >
                      Both
                    </Button>
                  </div>
                </div>
                
                <Card className="p-4 bg-muted/30">
                  <pre className="text-xs font-mono overflow-x-auto leading-relaxed">
                    {formatHexDump(packet.rawData, hexViewMode)}
                  </pre>
                </Card>
                
                <div className="text-xs text-muted-foreground">
                  Showing first 512 bytes of {packet.rawData.length} total bytes
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};