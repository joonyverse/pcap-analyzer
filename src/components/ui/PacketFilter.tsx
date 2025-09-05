import React from 'react';
import type { PacketInfo, FilterCriteria } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  const uniqueRtcIds = Array.from(new Set(packets.map(p => p.ecpriHeader.rtcId))).sort((a, b) => a - b);
  const uniqueFrameIds = Array.from(
    new Set(packets.map(p => p.oranHeader?.frameId).filter(id => id !== undefined))
  ).sort((a, b) => a - b);
  const uniqueMessageTypes = Array.from(new Set(packets.map(p => p.ecpriHeader.messageType))).sort((a, b) => a - b);

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <Accordion type="single" collapsible defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Filters</h3>
            {hasActiveFilters && <div className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Active</div>}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            <div className="grid gap-2">
              <label htmlFor="search">Search</label>
              <Input
                id="search"
                placeholder="Search MAC, RTC ID, etc..."
                value={filters.searchText || ''}
                onChange={(e) => onFilterChange('searchText', e.target.value)}
              />
            </div>
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
          {hasActiveFilters && (
            <div className="mt-4">
              <Button variant="destructive" onClick={clearFilters}>Clear All Filters</Button>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};