import React, { useState, useMemo } from 'react';
import type { PacketInfo, FilterCriteria } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedFilter } from '@/components/filters/AdvancedFilter';
import { 
  MagnifyingGlassIcon, 
  GearIcon,
  Cross2Icon,
  FileIcon
} from '@radix-ui/react-icons';

interface PacketFilterProps {
  packets: PacketInfo[];
  filters: FilterCriteria;
  onFilterChange: (key: keyof FilterCriteria, value: any) => void;
  clearFilters: () => void;
}

export const PacketFilter: React.FC<PacketFilterProps> = ({ 
  packets, 
  filters, 
  onFilterChange, 
  clearFilters 
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const uniqueRtcIds = Array.from(new Set(packets.map(p => p.ecpriHeader.rtcId))).sort((a, b) => a - b);
  const uniqueFrameIds = Array.from(
    new Set(packets.map(p => p.oranHeader?.frameId).filter(id => id !== undefined))
  ).sort((a, b) => a - b);
  const uniqueMessageTypes = Array.from(new Set(packets.map(p => p.ecpriHeader.messageType))).sort((a, b) => a - b);

  // Calculate RMS range for slider
  const rmsValues = packets
    .filter(p => p.iqData)
    .map(p => {
      const { i, q } = p.iqData!;
      const length = Math.min(i.length, q.length);
      if (length === 0) return 0;
      let sumSquares = 0;
      for (let idx = 0; idx < length; idx++) {
        const magnitude = Math.sqrt(i[idx] * i[idx] + q[idx] * q[idx]);
        sumSquares += magnitude * magnitude;
      }
      return Math.sqrt(sumSquares / length);
    });

  const minRmsValue = rmsValues.length > 0 ? Math.min(...rmsValues) : 0;
  const maxRmsValue = rmsValues.length > 0 ? Math.max(...rmsValues) : 100;

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && 
    (Array.isArray(value) ? value.length > 0 : true)
  );
  
  const hasAdvancedFilters = useMemo(() => {
    const advancedFields = [
      'timestampRange', 'packetLength', 'ethernetSource', 'ethernetDestination',
      'ecpriVersion', 'seqIdRange', 'oranDirection', 'subframeId', 'slotId',
      'symbolId', 'sectionId', 'payloadSizeRange', 'hasIqData', 'iqSampleCount',
      'customRules', 'logicalOperator'
    ];
    return advancedFields.some(field => {
      const value = filters[field as keyof FilterCriteria];
      return value !== undefined && 
        (Array.isArray(value) ? value.length > 0 : true);
    });
  }, [filters]);
  
  // Calculate quick stats
  const stats = useMemo(() => {
    if (packets.length === 0) return null;
    
    const rtcIds = new Set(packets.map(p => p.ecpriHeader.rtcId));
    const frameIds = new Set(packets.map(p => p.oranHeader?.frameId).filter(Boolean));
    const withIqData = packets.filter(p => p.iqData).length;
    const timespan = packets.length > 1 ? 
      packets[packets.length - 1].timestamp - packets[0].timestamp : 0;
    
    return {
      totalPackets: packets.length,
      uniqueRtcIds: rtcIds.size,
      uniqueFrameIds: frameIds.size,
      withIqData,
      timespan: timespan.toFixed(3)
    };
  }, [packets]);

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      {stats && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">{stats.totalPackets.toLocaleString()}</span>
                  <span>packets</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">{stats.uniqueRtcIds}</span>
                  <span>RTC IDs</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">{stats.uniqueFrameIds}</span>
                  <span>Frame IDs</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">{stats.withIqData}</span>
                  <span>with IQ data</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">{stats.timespan}s</span>
                  <span>timespan</span>
                </div>
              </div>
              {hasActiveFilters && (
                <Badge variant="default" className="flex items-center gap-1">
                  <FileIcon className="h-3 w-3" />
                  Filtered
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileIcon className="h-5 w-5" />
              Packet Filters
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={showAdvanced ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <GearIcon className="h-4 w-4 mr-1" />
                Advanced
                {hasAdvancedFilters && <Badge variant="secondary" className="ml-1 text-xs">On</Badge>}
              </Button>
              {hasActiveFilters && (
                <Button variant="destructive" size="sm" onClick={clearFilters}>
                  <Cross2Icon className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showAdvanced ? (
            <AdvancedFilter
              packets={packets}
              filters={filters}
              onFilterChange={onFilterChange}
              onClearFilters={clearFilters}
            />
          ) : (
            <div className="space-y-6">
              {/* Enhanced Quick Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Smart Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search: rtc:1001, frame:0, mac:aa:bb:cc, index:>100, rms:<5.0..."
                    className="pl-10"
                    value={filters.searchText || ''}
                    onChange={(e) => onFilterChange('searchText', e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => onFilterChange('searchText', 'rtc:1001')}>rtc:1001</Badge>
                  <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => onFilterChange('searchText', 'frame:0')}>frame:0</Badge>
                  <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => onFilterChange('searchText', 'rms:>10')}>rms:{'>'}10</Badge>
                  <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => onFilterChange('searchText', 'type:0')}>type:0</Badge>
                </div>
              </div>
              
              {/* Basic Filter Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div className="grid gap-2">
                  <label htmlFor="rtcId">RTC ID</label>
                  <Select value={filters.rtcId?.toString() || 'all'} onValueChange={(value) => onFilterChange('rtcId', value === 'all' ? undefined : parseInt(value))}>
                    <SelectTrigger id="rtcId"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {uniqueRtcIds.map(id => (
                        <SelectItem key={id} value={id.toString()}>{id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="frameId">Frame ID</label>
                  <Select value={filters.frameId?.toString() || 'all'} onValueChange={(value) => onFilterChange('frameId', value === 'all' ? undefined : parseInt(value))}>
                    <SelectTrigger id="frameId"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {uniqueFrameIds.map(id => (
                        <SelectItem key={id} value={id.toString()}>{id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="messageType">Message Type</label>
                  <Select value={filters.messageType?.toString() || 'all'} onValueChange={(value) => onFilterChange('messageType', value === 'all' ? undefined : parseInt(value))}>
                    <SelectTrigger id="messageType"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {uniqueMessageTypes.map(type => (
                        <SelectItem key={type} value={type.toString()}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="minRms">Min RMS</label>
                  <Input
                    id="minRms"
                    type="number"
                    step="0.01"
                    placeholder="0.0"
                    value={filters.minRms || ''}
                    onChange={(e) => onFilterChange('minRms', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="maxRms">Max RMS</label>
                  <Input
                    id="maxRms"
                    type="number"
                    step="0.01"
                    placeholder="999.0"
                    value={filters.maxRms || ''}
                    onChange={(e) => onFilterChange('maxRms', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              </div>
              
              {/* RMS Range Slider */}
              {rmsValues.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">RMS Value Range</label>
                      <span className="text-xs text-muted-foreground">
                        {minRmsValue.toFixed(2)} - {maxRmsValue.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      min={minRmsValue}
                      max={maxRmsValue}
                      step={0.01}
                      value={[filters.minRms || minRmsValue, filters.maxRms || maxRmsValue]}
                      onValueChange={([min, max]) => {
                        onFilterChange('minRms', min);
                        onFilterChange('maxRms', max);
                      }}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{(filters.minRms || minRmsValue).toFixed(2)}</span>
                      <span>{(filters.maxRms || maxRmsValue).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};