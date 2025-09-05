import type { PcapHeader, PacketHeader, PacketInfo } from '../types';

export class PcapParser {
  private dataView: DataView;
  private offset: number = 0;
  private isLittleEndian: boolean = false;

  constructor(buffer: ArrayBuffer) {
    this.dataView = new DataView(buffer);
    this.detectEndianness();
  }

  private detectEndianness(): void {
    const magic = this.dataView.getUint32(0, false);
    if (magic === 0xa1b2c3d4) {
      this.isLittleEndian = false;
    } else if (magic === 0xd4c3b2a1) {
      this.isLittleEndian = true;
    } else {
      throw new Error('Invalid PCAP magic number');
    }
  }

  public parseGlobalHeader(): PcapHeader {
    const header: PcapHeader = {
      magic: this.dataView.getUint32(0, this.isLittleEndian),
      versionMajor: this.dataView.getUint16(4, this.isLittleEndian),
      versionMinor: this.dataView.getUint16(6, this.isLittleEndian),
      timezone: this.dataView.getInt32(8, this.isLittleEndian),
      sigfigs: this.dataView.getUint32(12, this.isLittleEndian),
      snaplen: this.dataView.getUint32(16, this.isLittleEndian),
      network: this.dataView.getUint32(20, this.isLittleEndian),
    };

    this.offset = 24;
    return header;
  }

  public parsePackets(): PacketInfo[] {
    const packets: PacketInfo[] = [];
    let packetIndex = 0;

    while (this.offset < this.dataView.byteLength - 16) {
      try {
        const packetHeader = this.parsePacketHeader();
        
        // Check if we have enough data for this packet
        if (this.offset + packetHeader.capturedLength > this.dataView.byteLength) {
          console.warn(`Incomplete packet ${packetIndex}: expected ${packetHeader.capturedLength} bytes, only ${this.dataView.byteLength - this.offset} available`);
          break;
        }

        const packetData = new Uint8Array(
          this.dataView.buffer,
          this.offset,
          packetHeader.capturedLength
        );

        // Save current offset before parsing headers
        const dataStartOffset = this.offset;

        packets.push({
          index: packetIndex++,
          timestamp: packetHeader.timestampSeconds + packetHeader.timestampMicroseconds / 1000000,
          length: packetHeader.capturedLength,
          ethernetHeader: this.parseEthernetHeader(),
          ecpriHeader: this.parseEcpriHeader(),
          rawData: packetData,
        });

        // Move to next packet: skip the entire packet data
        this.offset = dataStartOffset + packetHeader.capturedLength;
        
      } catch (error) {
        console.warn(`Error parsing packet ${packetIndex}:`, error);
        break;
      }
    }

    return packets;
  }

  private parsePacketHeader(): PacketHeader {
    const header: PacketHeader = {
      timestampSeconds: this.dataView.getUint32(this.offset, this.isLittleEndian),
      timestampMicroseconds: this.dataView.getUint32(this.offset + 4, this.isLittleEndian),
      capturedLength: this.dataView.getUint32(this.offset + 8, this.isLittleEndian),
      originalLength: this.dataView.getUint32(this.offset + 12, this.isLittleEndian),
    };

    this.offset += 16;
    return header;
  }

  private parseEthernetHeader() {
    const destination = Array.from(
      new Uint8Array(this.dataView.buffer, this.offset, 6)
    ).map(b => b.toString(16).padStart(2, '0')).join(':');
    
    const source = Array.from(
      new Uint8Array(this.dataView.buffer, this.offset + 6, 6)
    ).map(b => b.toString(16).padStart(2, '0')).join(':');
    
    const ethertype = this.dataView.getUint16(this.offset + 12, false);

    this.offset += 14;

    return {
      destination,
      source,
      ethertype,
    };
  }

  private parseEcpriHeader() {
    const byte0 = this.dataView.getUint8(this.offset);
    const version = (byte0 >> 4) & 0x0f;
    const reserved = (byte0 >> 3) & 0x01;
    const concatenation = (byte0 >> 2) & 0x01;
    const messageType = byte0 & 0x03;

    const payloadSize = this.dataView.getUint16(this.offset + 1, false);
    const rtcId = this.dataView.getUint16(this.offset + 3, false);
    const seqId = this.dataView.getUint16(this.offset + 5, false);

    this.offset += 8;

    return {
      version,
      reserved,
      concatenation,
      messageType,
      payloadSize,
      rtcId,
      seqId,
    };
  }
}