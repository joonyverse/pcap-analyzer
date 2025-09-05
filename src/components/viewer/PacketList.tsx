import React, { useState, useMemo } from 'react';
import type { PacketInfo, FilterCriteria } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface PacketListProps {
  packets: PacketInfo[];
  selectedPacket: PacketInfo | null;
  onPacketSelect: (packet: PacketInfo) => void;
  onFilterAdd: (key: keyof FilterCriteria, value: any) => void;
}

const ITEMS_PER_PAGE = 50;

export const PacketList: React.FC<PacketListProps> = ({
  packets,
  selectedPacket,
  onPacketSelect,
  onFilterAdd,
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toISOString();
  };

  const totalPages = Math.ceil(packets.length / ITEMS_PER_PAGE);

  const visiblePackets = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return packets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [packets, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Packets</CardTitle>
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-0">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>Index</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Source MAC</TableHead>
              <TableHead>Dest MAC</TableHead>
              <TableHead>Length</TableHead>
              <TableHead>Msg Type</TableHead>
              <TableHead>RTC ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiblePackets.map((packet) => (
              <ContextMenu key={packet.index}>
                <ContextMenuTrigger asChild>
                  <TableRow
                    className={cn(
                      'cursor-pointer',
                      selectedPacket?.index === packet.index && 'bg-muted'
                    )}
                    onClick={() => onPacketSelect(packet)}
                  >
                    <TableCell>{packet.index}</TableCell>
                    <TableCell>{formatTimestamp(packet.timestamp)}</TableCell>
                    <TableCell>{packet.ethernetHeader.source}</TableCell>
                    <TableCell>{packet.ethernetHeader.destination}</TableCell>
                    <TableCell>{packet.length}</TableCell>
                    <TableCell>{packet.ecpriHeader.messageType}</TableCell>
                    <TableCell>0x{packet.ecpriHeader.rtcId.toString(16).toUpperCase()}</TableCell>
                  </TableRow>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => navigator.clipboard.writeText(JSON.stringify(packet, null, 2))}>
                    Copy Packet Details
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => onFilterAdd('searchText', packet.ethernetHeader.source)}>
                    Filter by Source MAC
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onFilterAdd('searchText', packet.ethernetHeader.destination)}>
                    Filter by Destination MAC
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onFilterAdd('rtcId', packet.ecpriHeader.rtcId)}>
                    Filter by RTC ID
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onFilterAdd('messageType', packet.ecpriHeader.messageType)}>
                    Filter by Message Type
                  </ContextMenuItem>
                  {packet.oranHeader?.frameId !== undefined && (
                    <ContextMenuItem onClick={() => onFilterAdd('frameId', packet.oranHeader?.frameId)}>
                      Filter by Frame ID
                    </ContextMenuItem>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};