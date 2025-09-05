import React from 'react';
import type { PacketInfo, FilterCriteria } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface PacketDetailsProps {
  packet: PacketInfo | null;
  onFilterAdd: (key: keyof FilterCriteria, value: any) => void;
}

const DetailField: React.FC<{ label: string; value: React.ReactNode; filterKey?: keyof FilterCriteria; onFilterAdd: Function; isFilterable?: boolean }> = 
({ label, value, filterKey, onFilterAdd, isFilterable = false }) => (
  <div className="grid grid-cols-3 gap-4">
    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
    <dd 
      className={cn(
        "col-span-2 text-sm",
        isFilterable && "cursor-pointer hover:underline"
      )}
      onClick={() => isFilterable && filterKey && onFilterAdd(filterKey, value)}
    >
      {value}
    </dd>
  </div>
);

export const PacketDetails: React.FC<PacketDetailsProps> = ({ packet, onFilterAdd }) => {
  if (!packet) {
    return (
      <Card className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Select a packet to view details</p>
      </Card>
    );
  }

  const formatHex = (data: Uint8Array, maxBytes: number = 256) => {
    const bytes = Array.from(data.slice(0, maxBytes));
    let result = '';
    for (let i = 0; i < bytes.length; i += 16) {
      const slice = bytes.slice(i, i + 16);
      const hex = slice.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
      result += `${i.toString(16).padStart(4, '0')}  ${hex}\n`;
    }
    return result;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Packet #{packet.index} Details</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        <Accordion type="multiple" defaultValue={['general', 'ethernet', 'ecpri']} className="w-full">
          <AccordionItem value="general">
            <AccordionTrigger>General Information</AccordionTrigger>
            <AccordionContent>
              <dl className="space-y-2">
                <DetailField label="Timestamp" value={new Date(packet.timestamp * 1000).toISOString()} onFilterAdd={onFilterAdd} />
                <DetailField label="Length" value={`${packet.length} bytes`} onFilterAdd={onFilterAdd} />
              </dl>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="ethernet">
            <AccordionTrigger>Ethernet Header</AccordionTrigger>
            <AccordionContent>
              <dl className="space-y-2">
                <DetailField label="Source" value={packet.ethernetHeader.source} filterKey="searchText" onFilterAdd={onFilterAdd} isFilterable />
                <DetailField label="Destination" value={packet.ethernetHeader.destination} filterKey="searchText" onFilterAdd={onFilterAdd} isFilterable />
                <DetailField label="EtherType" value={`0x${packet.ethernetHeader.ethertype.toString(16).toUpperCase()}`} onFilterAdd={onFilterAdd} />
              </dl>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="ecpri">
            <AccordionTrigger>eCPRI Header</AccordionTrigger>
            <AccordionContent>
              <dl className="space-y-2">
                <DetailField label="Version" value={packet.ecpriHeader.version} onFilterAdd={onFilterAdd} />
                <DetailField label="Message Type" value={packet.ecpriHeader.messageType} filterKey="messageType" onFilterAdd={onFilterAdd} isFilterable />
                <DetailField label="Payload Size" value={packet.ecpriHeader.payloadSize} onFilterAdd={onFilterAdd} />
                <DetailField label="RTC ID" value={packet.ecpriHeader.rtcId} filterKey="rtcId" onFilterAdd={onFilterAdd} isFilterable />
                <DetailField label="Sequence ID" value={packet.ecpriHeader.seqId} onFilterAdd={onFilterAdd} />
              </dl>
            </AccordionContent>
          </AccordionItem>
          {packet.oranHeader && (
            <AccordionItem value="oran">
              <AccordionTrigger>O-RAN Header</AccordionTrigger>
              <AccordionContent>
                <dl className="space-y-2">
                  <DetailField label="Data Direction" value={packet.oranHeader.dataDirection} onFilterAdd={onFilterAdd} />
                  <DetailField label="Frame ID" value={packet.oranHeader.frameId} filterKey="frameId" onFilterAdd={onFilterAdd} isFilterable />
                  <DetailField label="Subframe ID" value={packet.oranHeader.subframeId} onFilterAdd={onFilterAdd} />
                  <DetailField label="Slot ID" value={packet.oranHeader.slotId} onFilterAdd={onFilterAdd} />
                  <DetailField label="Symbol ID" value={packet.oranHeader.symbolId} onFilterAdd={onFilterAdd} />
                </dl>
              </AccordionContent>
            </AccordionItem>
          )}
          {packet.iqData && (
            <AccordionItem value="iq">
              <AccordionTrigger>IQ Data</AccordionTrigger>
              <AccordionContent>
                <dl className="space-y-2">
                  <DetailField label="I Samples" value={packet.iqData.i.length} onFilterAdd={onFilterAdd} />
                  <DetailField label="Q Samples" value={packet.iqData.q.length} onFilterAdd={onFilterAdd} />
                </dl>
              </AccordionContent>
            </AccordionItem>
          )}
          <AccordionItem value="raw">
            <AccordionTrigger>Raw Data (Hex)</AccordionTrigger>
            <AccordionContent>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">{formatHex(packet.rawData)}</pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};