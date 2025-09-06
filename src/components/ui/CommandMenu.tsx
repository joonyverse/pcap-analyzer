import React, { useState, useEffect } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import type { PacketInfo, FilterCriteria } from '@/types';

interface CommandMenuProps {
  packets: PacketInfo[];
  onFilterChange: (key: keyof FilterCriteria, value: unknown) => void;
  onPacketSelect: (packet: PacketInfo) => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ 
  packets, 
  onFilterChange, 
  onPacketSelect 
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const uniqueRtcIds = Array.from(new Set(packets.map(p => p.ecpriHeader.rtcId))).sort((a, b) => a - b);
  const uniqueFrameIds = Array.from(
    new Set(packets.map(p => p.oranHeader?.frameId).filter(id => id !== undefined))
  ).sort((a, b) => a - b);

  const recentPackets = packets.slice(-10);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Quick Filters">
          <CommandItem
            onSelect={() => {
              onFilterChange('messageType', 0);
              setOpen(false);
            }}
          >
            <span>Show IQ Data Packets</span>
            <CommandShortcut>Type 0</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onFilterChange('searchText', '');
              setOpen(false);
            }}
          >
            <span>Clear All Filters</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="RTC IDs">
          {uniqueRtcIds.slice(0, 8).map((rtcId) => (
            <CommandItem
              key={rtcId}
              onSelect={() => {
                onFilterChange('rtcId', rtcId);
                setOpen(false);
              }}
            >
              <span>Filter by RTC ID {rtcId}</span>
              <CommandShortcut>0x{rtcId.toString(16).toUpperCase()}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        {uniqueFrameIds.length > 0 && (
          <CommandGroup heading="Frame IDs">
            {uniqueFrameIds.slice(0, 6).map((frameId) => (
              <CommandItem
                key={frameId}
                onSelect={() => {
                  onFilterChange('frameId', frameId);
                  setOpen(false);
                }}
              >
                <span>Filter by Frame ID {frameId}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Recent Packets">
          {recentPackets.map((packet) => (
            <CommandItem
              key={packet.index}
              onSelect={() => {
                onPacketSelect(packet);
                setOpen(false);
              }}
            >
              <span>Packet #{packet.index}</span>
              <CommandShortcut>RTC {packet.ecpriHeader.rtcId}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};