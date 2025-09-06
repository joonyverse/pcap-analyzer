export interface PcapHeader {
  magic: number;
  versionMajor: number;
  versionMinor: number;
  timezone: number;
  sigfigs: number;
  snaplen: number;
  network: number;
}

export interface PacketHeader {
  timestampSeconds: number;
  timestampMicroseconds: number;
  capturedLength: number;
  originalLength: number;
}

export interface EthernetHeader {
  destination: string;
  source: string;
  ethertype: number;
}

export interface EcpriHeader {
  version: number;
  reserved: number;
  concatenation: number;
  messageType: number;
  payloadSize: number;
  rtcId: number;
  seqId: number;
}

export interface OranHeader {
  dataDirection: number;
  payloadVersion: number;
  filterIndex: number;
  frameId: number;
  subframeId: number;
  slotId: number;
  symbolId: number;
  sectionId: number;
  rb: number;
  symInc: number;
  startPrbu: number;
  numPrbu: number;
}

export interface IQData {
  i: number[];
  q: number[];
}

export interface PacketInfo {
  index: number;
  timestamp: number;
  length: number;
  ethernetHeader: EthernetHeader;
  ecpriHeader: EcpriHeader;
  oranHeader?: OranHeader;
  iqData?: IQData;
  rawData: Uint8Array;
}

export interface AnalysisResult {
  totalPackets: number;
  uniqueRtcIds: Set<number>;
  frameStats: Map<number, number>;
  rtcDistribution: Map<number, number>;
  rmsValues: number[];
  averageRms: number;
}

export type FilterOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex' | 'between';

export interface FilterRule {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[] | number[] | [number, number];
  enabled: boolean;
}

export interface AdvancedFilterCriteria {
  // Basic filters (legacy compatibility)
  rtcId?: number;
  frameId?: number;  
  messageType?: number;
  minRms?: number;
  maxRms?: number;
  searchText?: string;
  
  // Advanced filters
  timestampRange?: {
    start?: number;
    end?: number;
  };
  packetLength?: {
    min?: number;
    max?: number;
  };
  ethernetSource?: string[];
  ethernetDestination?: string[];
  ecpriVersion?: number[];
  seqIdRange?: {
    min?: number;
    max?: number;
  };
  oranDirection?: number[];
  subframeId?: number[];
  slotId?: number[];
  symbolId?: number[];
  sectionId?: number[];
  payloadSizeRange?: {
    min?: number;
    max?: number;
  };
  hasIqData?: boolean;
  iqSampleCount?: {
    min?: number;
    max?: number;
  };
  
  // Filter rules system
  customRules?: FilterRule[];
  logicalOperator?: 'AND' | 'OR';
}

export type FilterCriteria = AdvancedFilterCriteria;

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: FilterCriteria;
  createdAt: number;
  tags?: string[];
}

export interface SearchSuggestion {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean;
  display: string;
  description?: string;
}