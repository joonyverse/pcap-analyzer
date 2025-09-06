import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationFirst,
  PaginationLast,
} from "@/components/ui/pagination"
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'sonner';
import { useTableSort } from '@/hooks/useTableSort';
import { ArrowUpIcon, ArrowDownIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';

interface PacketListProps {
  packets: PacketInfo[];
  selectedPacket: PacketInfo | null;
  onPacketSelect: (packet: PacketInfo) => void;
  onFilterAdd: (key: keyof FilterCriteria, value: any) => void;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number];

const TableHeaderCell: React.FC<{
  children: React.ReactNode;
  sortKey?: string;
  onSort?: (key: string) => void;
  sortDirection?: 'asc' | 'desc' | null;
  className?: string;
}> = ({ children, sortKey, onSort, sortDirection, className }) => {
  const handleSort = useCallback(() => {
    if (sortKey && onSort) {
      onSort(sortKey);
    }
  }, [sortKey, onSort]);

  return (
    <TableHead 
      className={cn(
        "transition-colors",
        sortKey && onSort && "cursor-pointer select-none hover:bg-muted/50",
        sortDirection && "bg-primary/5 font-medium text-foreground",
        className
      )}
      onClick={handleSort}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortKey && onSort && (
          <div className="flex flex-col ml-1">
            <ArrowUpIcon className={cn(
              "h-3 w-3 transition-colors", 
              sortDirection === 'asc' ? "text-primary" : "text-muted-foreground/20"
            )} />
            <ArrowDownIcon className={cn(
              "h-3 w-3 -mt-1 transition-colors", 
              sortDirection === 'desc' ? "text-primary" : "text-muted-foreground/20"
            )} />
          </div>
        )}
      </div>
    </TableHead>
  );
};

const MemoizedTableRow = React.memo<{
  packet: PacketInfo;
  isSelected: boolean;
  onSelect: (packet: PacketInfo) => void;
  onFilterAdd: (key: keyof FilterCriteria, value: any) => void;
  searchText: string;
}>(({ packet, isSelected, onSelect, onFilterAdd, searchText }) => {
  const formatTimestamp = useCallback((timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  }, []);

  const getPacketTypeBadge = useCallback(() => {
    if (packet.ecpriHeader.messageType === 0) {
      return <Badge variant="default" className="text-xs">IQ Data</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Control</Badge>;
  }, [packet]);

  const highlightText = useCallback((text: string, search: string) => {
    if (!search.trim()) return text;
    const regex = new RegExp(`(${search})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark> : part
    );
  }, []);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TableRow
          className={cn(
            'cursor-pointer hover:bg-muted/50 transition-colors',
            isSelected && 'bg-muted'
          )}
          onClick={() => onSelect(packet)}
        >
          <TableCell>
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="flex items-center gap-2">
                  <span className="cursor-help font-mono text-sm">
                    {highlightText(packet.index.toString(), searchText)}
                  </span>
                  {getPacketTypeBadge()}
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Packet #{packet.index}</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Length:</span>
                      <span>{packet.length} bytes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>RTC ID:</span>
                      <span>0x{packet.ecpriHeader.rtcId.toString(16).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Message Type:</span>
                      <span>{packet.ecpriHeader.messageType}</span>
                    </div>
                    {packet.oranHeader && (
                      <>
                        <div className="flex justify-between">
                          <span>Frame ID:</span>
                          <span>{packet.oranHeader.frameId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Symbol ID:</span>
                          <span>{packet.oranHeader.symbolId}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </TableCell>
          <TableCell className="font-mono text-xs">
            {highlightText(formatTimestamp(packet.timestamp), searchText)}
          </TableCell>
          <TableCell className="font-mono text-xs">
            {highlightText(packet.ethernetHeader.source, searchText)}
          </TableCell>
          <TableCell className="font-mono text-xs">
            {highlightText(packet.ethernetHeader.destination, searchText)}
          </TableCell>
          <TableCell>{packet.length}</TableCell>
          <TableCell>
            <Badge variant="outline" className="font-mono text-xs">
              {packet.ecpriHeader.messageType}
            </Badge>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className="font-mono text-xs">
              0x{packet.ecpriHeader.rtcId.toString(16).toUpperCase()}
            </Badge>
          </TableCell>
        </TableRow>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(packet, null, 2));
          toast.success("Packet details copied to clipboard.");
        }}>
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
  );
});

MemoizedTableRow.displayName = 'MemoizedTableRow';

export const PacketList: React.FC<PacketListProps> = ({
  packets,
  selectedPacket,
  onPacketSelect,
  onFilterAdd,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [searchText, setSearchText] = useState('');

  // Load page size from localStorage
  useEffect(() => {
    const savedPageSize = localStorage.getItem('packetList_pageSize');
    if (savedPageSize && PAGE_SIZE_OPTIONS.includes(parseInt(savedPageSize) as PageSize)) {
      setPageSize(parseInt(savedPageSize) as PageSize);
    }
  }, []);

  // Save page size to localStorage
  const handlePageSizeChange = useCallback((newPageSize: string) => {
    const size = parseInt(newPageSize) as PageSize;
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
    localStorage.setItem('packetList_pageSize', size.toString());
  }, []);

  // Filter packets by search text
  const filteredPackets = useMemo(() => {
    if (!searchText.trim()) return packets;
    const searchLower = searchText.toLowerCase();
    return packets.filter(packet => 
      packet.index.toString().includes(searchLower) ||
      packet.ethernetHeader.source.toLowerCase().includes(searchLower) ||
      packet.ethernetHeader.destination.toLowerCase().includes(searchLower) ||
      packet.ecpriHeader.rtcId.toString(16).toLowerCase().includes(searchLower) ||
      packet.ecpriHeader.messageType.toString().includes(searchLower) ||
      (packet.oranHeader?.frameId?.toString().includes(searchLower) || false)
    );
  }, [packets, searchText]);

  // Sort functionality
  const { sortedData, requestSort, getSortDirection } = useTableSort(filteredPackets, 'index');

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const totalItems = sortedData.length;

  const visiblePackets = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // Reset page when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, sortedData.length]);

  const generatePageNumbers = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, 'ellipsis');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('ellipsis', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="space-y-4">
        <div className="flex flex-row items-center justify-between">
          <CardTitle>Packets ({totalItems.toLocaleString()})</CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              per page
            </span>
          </div>
        </div>
        
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search packets by index, MAC address, RTC ID..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-hidden p-0 flex flex-col">
        <ScrollArea className="flex-grow">
          <div className="min-w-max">
            <Table>
            <TableHeader className="sticky top-0 bg-background/95 backdrop-blur">
              <TableRow>
                <TableHeaderCell sortKey="index" onSort={requestSort} sortDirection={getSortDirection('index')} className="min-w-[100px]">
                  Index
                </TableHeaderCell>
                <TableHeaderCell sortKey="timestamp" onSort={requestSort} sortDirection={getSortDirection('timestamp')} className="min-w-[180px]">
                  Timestamp
                </TableHeaderCell>
                <TableHeaderCell sortKey="ethernetHeader.source" onSort={requestSort} sortDirection={getSortDirection('ethernetHeader.source')} className="min-w-[140px]">
                  Source MAC
                </TableHeaderCell>
                <TableHeaderCell sortKey="ethernetHeader.destination" onSort={requestSort} sortDirection={getSortDirection('ethernetHeader.destination')} className="min-w-[140px]">
                  Dest MAC
                </TableHeaderCell>
                <TableHeaderCell sortKey="length" onSort={requestSort} sortDirection={getSortDirection('length')} className="min-w-[80px]">
                  Length
                </TableHeaderCell>
                <TableHeaderCell sortKey="ecpriHeader.messageType" onSort={requestSort} sortDirection={getSortDirection('ecpriHeader.messageType')} className="min-w-[100px]">
                  Msg Type
                </TableHeaderCell>
                <TableHeaderCell sortKey="ecpriHeader.rtcId" onSort={requestSort} sortDirection={getSortDirection('ecpriHeader.rtcId')} className="min-w-[100px]">
                  RTC ID
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiblePackets.map((packet) => (
                <MemoizedTableRow
                  key={packet.index}
                  packet={packet}
                  isSelected={selectedPacket?.index === packet.index}
                  onSelect={onPacketSelect}
                  onFilterAdd={onFilterAdd}
                  searchText={searchText}
                />
              ))}
            </TableBody>
          </Table>
          </div>
        </ScrollArea>
        
        {totalPages > 1 && (
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems.toLocaleString()} packets
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationFirst 
                      onClick={() => handlePageChange(1)}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {generatePageNumbers.map((page, index) => (
                    <PaginationItem key={index}>
                      {page === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => handlePageChange(page as number)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLast 
                      onClick={() => handlePageChange(totalPages)}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};