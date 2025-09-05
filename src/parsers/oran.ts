import type { OranHeader, IQData, PacketInfo } from '../types';

export class OranParser {
  public static parseOranHeader(data: Uint8Array, offset: number = 0): OranHeader {
    const dataView = new DataView(data.buffer, offset);

    const byte0 = dataView.getUint8(0);
    const dataDirection = (byte0 >> 7) & 0x01;
    const payloadVersion = (byte0 >> 4) & 0x07;
    const filterIndex = byte0 & 0x0f;

    const frameId = dataView.getUint8(1);
    const byte2 = dataView.getUint8(2);
    const subframeId = (byte2 >> 4) & 0x0f;
    const slotId = byte2 & 0x0f;

    const byte3 = dataView.getUint8(3);
    const symbolId = (byte3 >> 2) & 0x3f;

    const sectionFields = dataView.getUint32(4, false);
    const sectionId = (sectionFields >> 20) & 0xfff;
    const rb = (sectionFields >> 19) & 0x01;
    const symInc = (sectionFields >> 18) & 0x01;
    const startPrbu = (sectionFields >> 8) & 0x3ff;
    const numPrbu = sectionFields & 0xff;

    return {
      dataDirection,
      payloadVersion,
      filterIndex,
      frameId,
      subframeId,
      slotId,
      symbolId,
      sectionId,
      rb,
      symInc,
      startPrbu,
      numPrbu,
    };
  }

  public static extractIQData(packet: PacketInfo): IQData | null {
    if (!packet.oranHeader) {
      return null;
    }

    const oranHeaderSize = 8;
    const iqDataOffset = 14 + 8 + oranHeaderSize; // Ethernet + eCPRI + O-RAN headers
    
    if (packet.rawData.length <= iqDataOffset) {
      return null;
    }

    const iqData = packet.rawData.slice(iqDataOffset);
    return this.parseIQSamples(iqData);
  }

  private static parseIQSamples(data: Uint8Array): IQData {
    const iSamples: number[] = [];
    const qSamples: number[] = [];

    // 16-bit IQ samples (I and Q interleaved)
    for (let i = 0; i < data.length - 3; i += 4) {
      const iSample = new DataView(data.buffer, data.byteOffset + i, 2).getInt16(0, false);
      const qSample = new DataView(data.buffer, data.byteOffset + i + 2, 2).getInt16(0, false);
      
      iSamples.push(iSample);
      qSamples.push(qSample);
    }

    return {
      i: iSamples,
      q: qSamples,
    };
  }

  public static isOranPacket(packet: PacketInfo): boolean {
    return packet.ecpriHeader.messageType === 0; // IQ data message type
  }

  public static enrichPacketWithOran(packet: PacketInfo): PacketInfo {
    if (this.isOranPacket(packet)) {
      const oranHeaderOffset = 14 + 8; // After Ethernet and eCPRI headers
      packet.oranHeader = this.parseOranHeader(packet.rawData, oranHeaderOffset);
      const iqData = this.extractIQData(packet);
      packet.iqData = iqData || undefined;
    }
    return packet;
  }
}