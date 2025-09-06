import { useMemo, useCallback } from 'react';
import type { PacketInfo, FilterCriteria, FilterRule, SearchSuggestion } from '@/types';

// Field definitions for advanced filtering
export const FILTERABLE_FIELDS = {
  // Basic packet info
  'packet.index': { label: 'Packet Index', type: 'number' },
  'packet.timestamp': { label: 'Timestamp', type: 'timestamp' },
  'packet.length': { label: 'Packet Length', type: 'number' },
  
  // Ethernet header
  'ethernet.source': { label: 'Source MAC', type: 'string' },
  'ethernet.destination': { label: 'Destination MAC', type: 'string' },
  'ethernet.ethertype': { label: 'EtherType', type: 'number' },
  
  // eCPRI header
  'ecpri.version': { label: 'eCPRI Version', type: 'number' },
  'ecpri.messageType': { label: 'Message Type', type: 'number' },
  'ecpri.payloadSize': { label: 'Payload Size', type: 'number' },
  'ecpri.rtcId': { label: 'RTC ID', type: 'number' },
  'ecpri.seqId': { label: 'Sequence ID', type: 'number' },
  
  // O-RAN header (optional)
  'oran.dataDirection': { label: 'Data Direction', type: 'number' },
  'oran.frameId': { label: 'Frame ID', type: 'number' },
  'oran.subframeId': { label: 'Subframe ID', type: 'number' },
  'oran.slotId': { label: 'Slot ID', type: 'number' },
  'oran.symbolId': { label: 'Symbol ID', type: 'number' },
  'oran.sectionId': { label: 'Section ID', type: 'number' },
  'oran.startPrbu': { label: 'Start PRB', type: 'number' },
  'oran.numPrbu': { label: 'Number of PRBs', type: 'number' },
  
  // IQ Data
  'iq.exists': { label: 'Has IQ Data', type: 'boolean' },
  'iq.sampleCount': { label: 'IQ Sample Count', type: 'number' },
  'iq.rms': { label: 'RMS Value', type: 'number' },
} as const;

export const OPERATORS = {
  equals: { label: 'equals', symbol: '=' },
  not_equals: { label: 'not equals', symbol: '≠' },
  greater_than: { label: 'greater than', symbol: '>' },
  less_than: { label: 'less than', symbol: '<' },
  contains: { label: 'contains', symbol: '∋' },
  regex: { label: 'regex', symbol: '//' },
  between: { label: 'between', symbol: '↔' },
} as const;

function getFieldValue(packet: PacketInfo, field: string): unknown {
  const path = field.split('.');
  let value: unknown = packet;
  
  for (const key of path) {
    if (value === null || value === undefined) return undefined;
    
    switch (key) {
      case 'packet':
        continue;
      case 'ethernet':
        value = value && typeof value === 'object' && 'ethernetHeader' in value 
          ? (value as { ethernetHeader: unknown }).ethernetHeader 
          : undefined;
        continue;
      case 'ecpri':
        value = value && typeof value === 'object' && 'ecpriHeader' in value 
          ? (value as { ecpriHeader: unknown }).ecpriHeader 
          : undefined;
        continue;
      case 'oran':
        value = value && typeof value === 'object' && 'oranHeader' in value 
          ? (value as { oranHeader: unknown }).oranHeader 
          : undefined;
        continue;
      case 'iq':
        value = value && typeof value === 'object' && 'iqData' in value 
          ? (value as { iqData: unknown }).iqData 
          : undefined;
        continue;
      case 'exists':
        return value !== undefined && value !== null;
      case 'sampleCount': {
        if (!value || typeof value !== 'object') return 0;
        const typedValue = value as { i?: number[]; q?: number[] };
        return Math.min(typedValue.i?.length || 0, typedValue.q?.length || 0);
      }
      case 'rms': {
        if (!value || typeof value !== 'object' || !('i' in value) || !('q' in value)) return 0;
        const { i, q } = value as { i: number[]; q: number[] };
        const length = Math.min(i.length, q.length);
        if (length === 0) return 0;
        let sumSquares = 0;
        for (let idx = 0; idx < length; idx++) {
          const magnitude = Math.sqrt(i[idx] * i[idx] + q[idx] * q[idx]);
          sumSquares += magnitude * magnitude;
        }
        return Math.sqrt(sumSquares / length);
      }
      default: {
        if (value && typeof value === 'object' && key in value) {
          value = (value as Record<string, unknown>)[key];
        } else {
          value = undefined;
        }
      }
    }
  }
  
  return value;
}

function evaluateRule(packet: PacketInfo, rule: FilterRule): boolean {
  if (!rule.enabled) return true;
  
  const fieldValue = getFieldValue(packet, rule.field);
  const { operator, value } = rule;
  
  if (fieldValue === undefined || fieldValue === null) {
    return operator === 'not_equals';
  }
  
  switch (operator) {
    case 'equals':
      return fieldValue === value;
    case 'not_equals':
      return fieldValue !== value;
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    case 'less_than':
      return Number(fieldValue) < Number(value);
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
    case 'regex':
      try {
        const regex = new RegExp(String(value), 'i');
        return regex.test(String(fieldValue));
      } catch {
        return false;
      }
    case 'between':
      if (Array.isArray(value) && value.length === 2) {
        const numValue = Number(fieldValue);
        return numValue >= Number(value[0]) && numValue <= Number(value[1]);
      }
      return false;
    default:
      return false;
  }
}

function matchesLegacyFilters(packet: PacketInfo, filters: FilterCriteria): boolean {
  // Legacy basic filters
  if (filters.rtcId !== undefined && packet.ecpriHeader.rtcId !== filters.rtcId) return false;
  if (filters.frameId !== undefined && packet.oranHeader?.frameId !== filters.frameId) return false;
  if (filters.messageType !== undefined && packet.ecpriHeader.messageType !== filters.messageType) return false;
  
  // RMS filtering
  if (filters.minRms !== undefined || filters.maxRms !== undefined) {
    if (!packet.iqData) return false;
    const rms = getFieldValue(packet, 'iq.rms');
    if (filters.minRms !== undefined && Number(rms) < filters.minRms) return false;
    if (filters.maxRms !== undefined && Number(rms) > filters.maxRms) return false;
  }
  
  // Enhanced smart search
  if (filters.searchText && filters.searchText.trim()) {
    const searchText = filters.searchText.trim();
    
    // Check for smart search patterns (rtc:1001, frame:0, etc.)
    const smartPatterns = [
      { pattern: /^rtc:(\d+)$/i, field: 'ecpriHeader.rtcId', type: 'number' },
      { pattern: /^frame:(\d+)$/i, field: 'oranHeader.frameId', type: 'number' },
      { pattern: /^type:(\d+)$/i, field: 'ecpriHeader.messageType', type: 'number' },
      { pattern: /^rms:([><]?)(\d+\.?\d*)$/i, field: 'rms', type: 'rms_comparison' },
      { pattern: /^index:([><]?)(\d+)$/i, field: 'index', type: 'number_comparison' },
      { pattern: /^len:([><]?)(\d+)$/i, field: 'length', type: 'number_comparison' },
      { pattern: /^mac:([a-fA-F0-9:]+)$/i, field: 'mac', type: 'mac_search' },
    ];
    
    let matchFound = false;
    
    for (const { pattern, field, type } of smartPatterns) {
      const match = searchText.match(pattern);
      if (match) {
        matchFound = true;
        
        if (type === 'number') {
          const value = parseInt(match[1]);
          if (field === 'ecpriHeader.rtcId' && packet.ecpriHeader.rtcId !== value) return false;
          if (field === 'oranHeader.frameId' && packet.oranHeader?.frameId !== value) return false;
          if (field === 'ecpriHeader.messageType' && packet.ecpriHeader.messageType !== value) return false;
        } else if (type === 'rms_comparison') {
          const operator = match[1] || '=';
          const value = parseFloat(match[2]);
          if (packet.iqData) {
            const rmsValue = getFieldValue(packet, 'iq.rms');
            const rms = typeof rmsValue === 'number' ? rmsValue : 0;
            if (operator === '>' && rms <= value) return false;
            if (operator === '<' && rms >= value) return false;
            if (operator === '' && Math.abs(rms - value) > 0.1) return false;
          }
        } else if (type === 'number_comparison') {
          const operator = match[1] || '=';
          const value = parseInt(match[2]);
          const fieldValue = field === 'index' ? packet.index : packet.length;
          if (operator === '>' && fieldValue <= value) return false;
          if (operator === '<' && fieldValue >= value) return false;
          if (operator === '' && fieldValue !== value) return false;
        } else if (type === 'mac_search') {
          const mac = match[1].toLowerCase();
          const matchesMac = 
            packet.ethernetHeader.source.toLowerCase().includes(mac) ||
            packet.ethernetHeader.destination.toLowerCase().includes(mac);
          if (!matchesMac) return false;
        }
        break;
      }
    }
    
    // If no smart pattern matched, fall back to general search
    if (!matchFound) {
      const searchLower = searchText.toLowerCase();
      const matchesSearch = 
        packet.ethernetHeader.source.toLowerCase().includes(searchLower) ||
        packet.ethernetHeader.destination.toLowerCase().includes(searchLower) ||
        packet.ecpriHeader.rtcId.toString().includes(searchLower) ||
        (packet.oranHeader?.frameId?.toString().includes(searchLower) || false) ||
        packet.index.toString().includes(searchLower);
      if (!matchesSearch) return false;
    }
  }
  
  return true;
}

function matchesAdvancedFilters(packet: PacketInfo, filters: FilterCriteria): boolean {
  // Timestamp range
  if (filters.timestampRange) {
    const { start, end } = filters.timestampRange;
    if (start !== undefined && packet.timestamp < start) return false;
    if (end !== undefined && packet.timestamp > end) return false;
  }
  
  // Packet length range
  if (filters.packetLength) {
    const { min, max } = filters.packetLength;
    if (min !== undefined && packet.length < min) return false;
    if (max !== undefined && packet.length > max) return false;
  }
  
  // Ethernet filters
  if (filters.ethernetSource?.length && !filters.ethernetSource.includes(packet.ethernetHeader.source)) return false;
  if (filters.ethernetDestination?.length && !filters.ethernetDestination.includes(packet.ethernetHeader.destination)) return false;
  
  // eCPRI filters
  if (filters.ecpriVersion?.length && !filters.ecpriVersion.includes(packet.ecpriHeader.version)) return false;
  if (filters.seqIdRange) {
    const { min, max } = filters.seqIdRange;
    if (min !== undefined && packet.ecpriHeader.seqId < min) return false;
    if (max !== undefined && packet.ecpriHeader.seqId > max) return false;
  }
  
  // O-RAN filters
  if (packet.oranHeader) {
    if (filters.oranDirection?.length && !filters.oranDirection.includes(packet.oranHeader.dataDirection)) return false;
    if (filters.subframeId?.length && !filters.subframeId.includes(packet.oranHeader.subframeId)) return false;
    if (filters.slotId?.length && !filters.slotId.includes(packet.oranHeader.slotId)) return false;
    if (filters.symbolId?.length && !filters.symbolId.includes(packet.oranHeader.symbolId)) return false;
    if (filters.sectionId?.length && !filters.sectionId.includes(packet.oranHeader.sectionId)) return false;
  }
  
  // Payload size range
  if (filters.payloadSizeRange) {
    const { min, max } = filters.payloadSizeRange;
    if (min !== undefined && packet.ecpriHeader.payloadSize < min) return false;
    if (max !== undefined && packet.ecpriHeader.payloadSize > max) return false;
  }
  
  // IQ data filters
  if (filters.hasIqData !== undefined) {
    const hasIq = packet.iqData !== undefined;
    if (filters.hasIqData !== hasIq) return false;
  }
  
  if (filters.iqSampleCount && packet.iqData) {
    const count = Math.min(packet.iqData.i.length, packet.iqData.q.length);
    const { min, max } = filters.iqSampleCount;
    if (min !== undefined && count < min) return false;
    if (max !== undefined && count > max) return false;
  }
  
  return true;
}

export function useAdvancedFilter(packets: PacketInfo[], filters: FilterCriteria) {
  const filteredPackets = useMemo(() => {
    if (!filters || Object.keys(filters).length === 0) return packets;
    
    return packets.filter(packet => {
      // Apply legacy filters for backward compatibility
      if (!matchesLegacyFilters(packet, filters)) return false;
      
      // Apply advanced filters
      if (!matchesAdvancedFilters(packet, filters)) return false;
      
      // Apply custom rules
      if (filters.customRules?.length) {
        const results = filters.customRules.map(rule => evaluateRule(packet, rule));
        const operator = filters.logicalOperator || 'AND';
        
        if (operator === 'AND') {
          return results.every(result => result);
        } else {
          return results.some(result => result);
        }
      }
      
      return true;
    });
  }, [packets, filters]);
  
  const generateSuggestions = useCallback((query: string): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();
    
    // Field suggestions
    for (const [field, config] of Object.entries(FILTERABLE_FIELDS)) {
      if (field.includes(queryLower) || config.label.toLowerCase().includes(queryLower)) {
        suggestions.push({
          field,
          operator: 'equals',
          value: '',
          display: `${config.label} (${field})`,
          description: `Filter by ${config.label}`
        });
      }
    }
    
    // Value suggestions based on data
    if (packets.length > 0) {
      const uniqueValues = new Map<string, Set<unknown>>();
      
      packets.slice(0, 100).forEach(packet => {
        Object.keys(FILTERABLE_FIELDS).forEach(field => {
          const value = getFieldValue(packet, field);
          if (value !== undefined && value !== null) {
            if (!uniqueValues.has(field)) {
              uniqueValues.set(field, new Set());
            }
            uniqueValues.get(field)!.add(value);
          }
        });
      });
      
      uniqueValues.forEach((values, field) => {
        const config = FILTERABLE_FIELDS[field as keyof typeof FILTERABLE_FIELDS];
        Array.from(values).slice(0, 5).forEach(value => {
          const valueStr = String(value);
          if (valueStr.toLowerCase().includes(queryLower)) {
            const suggestionValue = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' 
              ? value : String(value);
            suggestions.push({
              field,
              operator: 'equals',
              value: suggestionValue,
              display: `${config.label}: ${valueStr}`,
              description: `Filter ${config.label} equals ${valueStr}`
            });
          }
        });
      });
    }
    
    return suggestions.slice(0, 20);
  }, [packets]);
  
  return {
    filteredPackets,
    generateSuggestions,
    totalFiltered: filteredPackets.length,
    totalOriginal: packets.length,
    isFiltered: filteredPackets.length !== packets.length
  };
}