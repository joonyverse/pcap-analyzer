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
  rmsValues: number[];
  averageRms: number;
}

export interface FilterCriteria {
  rtcId?: number;
  frameId?: number;
  messageType?: number;
  minRms?: number;
  maxRms?: number;
  searchText?: string;
}