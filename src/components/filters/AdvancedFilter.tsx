import React, { useState, useCallback, useMemo } from 'react';
import type { PacketInfo, FilterCriteria, FilterRule, FilterOperator } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusIcon,
  Cross2Icon
} from '@radix-ui/react-icons';

interface AdvancedFilterProps {
  packets: PacketInfo[];
  filters: FilterCriteria;
  onFilterChange: (key: keyof FilterCriteria, value: unknown) => void;
  onClearFilters: () => void;
}

const FILTERABLE_FIELDS = {
  'packet.index': { label: 'Packet Index', type: 'number' },
  'packet.timestamp': { label: 'Timestamp', type: 'timestamp' },
  'packet.length': { label: 'Packet Length', type: 'number' },
  'ethernet.source': { label: 'Source MAC', type: 'string' },
  'ethernet.destination': { label: 'Destination MAC', type: 'string' },
  'ecpri.rtcId': { label: 'RTC ID', type: 'number' },
  'ecpri.messageType': { label: 'Message Type', type: 'number' },
  'oran.frameId': { label: 'Frame ID', type: 'number' },
  'oran.subframeId': { label: 'Subframe ID', type: 'number' },
  'oran.slotId': { label: 'Slot ID', type: 'number' },
  'oran.symbolId': { label: 'Symbol ID', type: 'number' },
} as const;

const OPERATORS = {
  equals: { label: 'equals', symbol: '=' },
  not_equals: { label: 'not equals', symbol: '≠' },
  greater_than: { label: 'greater than', symbol: '>' },
  less_than: { label: 'less than', symbol: '<' },
  contains: { label: 'contains', symbol: '∋' },
  regex: { label: 'regex match', symbol: '/.*/' },
  between: { label: 'between', symbol: '↔' },
} as const;

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  filters,
  onFilterChange,
  onClearFilters
}) => {
  const [customRules, setCustomRules] = useState<FilterRule[]>(filters.customRules || []);
  
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'customRules' || key === 'logicalOperator') return false;
      return value !== undefined && value !== '' && 
        (Array.isArray(value) ? value.length > 0 : true);
    }) || customRules.some(rule => rule.enabled);
  }, [filters, customRules]);
  
  const updateFilters = useCallback((rules: FilterRule[]) => {
    onFilterChange('customRules', rules);
  }, [onFilterChange]);
  
  const addRule = useCallback(() => {
    const newRule: FilterRule = {
      field: 'packet.index',
      operator: 'equals',
      value: '',
      enabled: true
    };
    const newRules = [...customRules, newRule];
    setCustomRules(newRules);
    updateFilters(newRules);
  }, [customRules, updateFilters]);
  
  const updateRule = useCallback((index: number, rule: FilterRule) => {
    const newRules = [...customRules];
    newRules[index] = rule;
    setCustomRules(newRules);
    updateFilters(newRules);
  }, [customRules, updateFilters]);
  
  const removeRule = useCallback((index: number) => {
    const newRules = customRules.filter((_, i) => i !== index);
    setCustomRules(newRules);
    updateFilters(newRules);
  }, [customRules, updateFilters]);
  
  const handleClearAll = useCallback(() => {
    setCustomRules([]);
    onClearFilters();
  }, [onClearFilters]);

  const handleAdvancedFilterChange = useCallback((key: keyof FilterCriteria, value: unknown) => {
    onFilterChange(key, value);
  }, [onFilterChange]);
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="quick" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick">Quick Filters</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="quick" className="space-y-6">
          {/* Key Value Filters */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* RTC ID Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">RTC ID</label>
              <Input
                type="number"
                placeholder="e.g. 1001"
                value={filters.rtcId || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : undefined;
                  handleAdvancedFilterChange('rtcId', value);
                }}
              />
            </div>
            
            {/* Frame ID Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Frame ID</label>
              <Input
                type="number"
                placeholder="e.g. 0-1023"
                value={filters.frameId || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : undefined;
                  handleAdvancedFilterChange('frameId', value);
                }}
              />
            </div>
            
            {/* Message Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Message Type</label>
              <Input
                type="number"
                placeholder="e.g. 0, 2"
                value={filters.messageType || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : undefined;
                  handleAdvancedFilterChange('messageType', value);
                }}
              />
            </div>
            
            {/* IQ Data Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">IQ Data</label>
              <Select 
                value={filters.hasIqData === undefined ? 'all' : filters.hasIqData.toString()}
                onValueChange={(value) => {
                  const hasIq = value === 'all' ? undefined : value === 'true';
                  handleAdvancedFilterChange('hasIqData', hasIq);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All packets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All packets</SelectItem>
                  <SelectItem value="true">With IQ data</SelectItem>
                  <SelectItem value="false">Without IQ data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Range Filters */}
          <div className="space-y-4">
            <h5 className="text-sm font-medium">Range Filters</h5>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Timestamp Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Timestamp Range</label>
                <div className="flex gap-2">
                  <Input
                    type="datetime-local"
                    placeholder="Start time"
                    className="text-xs"
                    onChange={(e) => {
                      const start = e.target.value ? new Date(e.target.value).getTime() / 1000 : undefined;
                      handleAdvancedFilterChange('timestampRange', {
                        ...filters.timestampRange,
                        start
                      });
                    }}
                  />
                  <Input
                    type="datetime-local"
                    placeholder="End time"
                    className="text-xs"
                    onChange={(e) => {
                      const end = e.target.value ? new Date(e.target.value).getTime() / 1000 : undefined;
                      handleAdvancedFilterChange('timestampRange', {
                        ...filters.timestampRange,
                        end
                      });
                    }}
                  />
                </div>
              </div>
              
              {/* Packet Length Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Packet Length (bytes)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.packetLength?.min || ''}
                    onChange={(e) => {
                      const min = e.target.value ? parseInt(e.target.value) : undefined;
                      handleAdvancedFilterChange('packetLength', {
                        ...filters.packetLength,
                        min
                      });
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.packetLength?.max || ''}
                    onChange={(e) => {
                      const max = e.target.value ? parseInt(e.target.value) : undefined;
                      handleAdvancedFilterChange('packetLength', {
                        ...filters.packetLength,
                        max
                      });
                    }}
                  />
                </div>
              </div>
              
              {/* RMS Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">RMS Range</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Min RMS"
                    value={filters.minRms || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      handleAdvancedFilterChange('minRms', value);
                    }}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Max RMS"
                    value={filters.maxRms || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      handleAdvancedFilterChange('maxRms', value);
                    }}
                  />
                </div>
              </div>
              
              {/* Payload Size Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Payload Size (bytes)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.payloadSizeRange?.min || ''}
                    onChange={(e) => {
                      const min = e.target.value ? parseInt(e.target.value) : undefined;
                      handleAdvancedFilterChange('payloadSizeRange', {
                        ...filters.payloadSizeRange,
                        min
                      });
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.payloadSizeRange?.max || ''}
                    onChange={(e) => {
                      const max = e.target.value ? parseInt(e.target.value) : undefined;
                      handleAdvancedFilterChange('payloadSizeRange', {
                        ...filters.payloadSizeRange,
                        max
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Custom Filter Rules</h4>
              <p className="text-sm text-muted-foreground">Create complex filtering conditions with multiple rules</p>
            </div>
            <Button onClick={addRule} size="sm" variant="outline">
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </div>
          
          {customRules.length > 1 && (
            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
              <span className="text-sm font-medium">Logical Operator:</span>
              <Select 
                value={filters.logicalOperator || 'AND'} 
                onValueChange={(value) => handleAdvancedFilterChange('logicalOperator', value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                {filters.logicalOperator === 'OR' ? 'Match any rule' : 'Match all rules'}
              </span>
            </div>
          )}
          
          <div className="space-y-2">
            {customRules.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No custom rules defined</p>
                <Button onClick={addRule} variant="outline">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Your First Rule
                </Button>
              </div>
            ) : (
              customRules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                  <Checkbox 
                    checked={rule.enabled}
                    onCheckedChange={(enabled) => updateRule(index, { ...rule, enabled: !!enabled })}
                  />
                  
                  <Select value={rule.field} onValueChange={(field) => updateRule(index, { ...rule, field })}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FILTERABLE_FIELDS).map(([field, config]) => (
                        <SelectItem key={field} value={field}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={rule.operator} onValueChange={(operator) => updateRule(index, { ...rule, operator: operator as FilterOperator })}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(OPERATORS).map(([op, config]) => (
                        <SelectItem key={op} value={op}>
                          {config.label} {config.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {rule.operator === 'regex' ? (
                    <div className="flex-1">
                      <Input
                        placeholder="Enter regex pattern..."
                        className="font-mono text-xs"
                        value={rule.value}
                        onChange={(e) => updateRule(index, { ...rule, value: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Examples: .*1001.*, ^[0-9]+$, frame_[0-9]{'{2,4}'}
                      </p>
                    </div>
                  ) : rule.operator === 'between' ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Min"
                        className="w-20"
                        value={Array.isArray(rule.value) ? rule.value[0] : ''}
                        onChange={(e) => {
                          const min = e.target.value;
                          const max = Array.isArray(rule.value) ? rule.value[1] : '';
                          updateRule(index, { ...rule, value: [min, max] });
                        }}
                      />
                      <Input
                        placeholder="Max"
                        className="w-20"
                        value={Array.isArray(rule.value) ? rule.value[1] : ''}
                        onChange={(e) => {
                          const max = e.target.value;
                          const min = Array.isArray(rule.value) ? rule.value[0] : '';
                          updateRule(index, { ...rule, value: [min, max] });
                        }}
                      />
                    </div>
                  ) : (
                    <Input
                      placeholder={`Enter ${FILTERABLE_FIELDS[rule.field as keyof typeof FILTERABLE_FIELDS]?.type || 'value'}...`}
                      className="flex-1"
                      value={rule.value}
                      onChange={(e) => updateRule(index, { ...rule, value: e.target.value })}
                    />
                  )}
                  
                  <Button variant="ghost" size="sm" onClick={() => removeRule(index)}>
                    <Cross2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="presets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filter Presets</h4>
            <Button size="sm" variant="outline">
              <PlusIcon className="h-4 w-4 mr-1" />
              Save Current
            </Button>
          </div>
          
          <div className="grid gap-3">
            <div className="p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-sm">High RMS Packets</h5>
                  <p className="text-xs text-muted-foreground">RMS {'>'}10.0</p>
                </div>
                <Button size="sm" variant="ghost">Apply</Button>
              </div>
            </div>
            
            <div className="p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-sm">Frame 0 Analysis</h5>
                  <p className="text-xs text-muted-foreground">Frame ID = 0, with IQ data</p>
                </div>
                <Button size="sm" variant="ghost">Apply</Button>
              </div>
            </div>
            
            <div className="p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-sm">Recent Packets</h5>
                  <p className="text-xs text-muted-foreground">Last 1000 packets</p>
                </div>
                <Button size="sm" variant="ghost">Apply</Button>
              </div>
            </div>
          </div>
          
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">Create custom presets to save frequently used filter combinations</p>
          </div>
        </TabsContent>
      </Tabs>
      
      {hasActiveFilters && (
        <div className="flex justify-center">
          <Button variant="destructive" onClick={handleClearAll}>
            <Cross2Icon className="h-4 w-4 mr-1" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};