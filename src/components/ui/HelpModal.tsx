import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[600px]">
        <AlertDialogHeader>
          <AlertDialogTitle>🚀 PCAP Analyzer</AlertDialogTitle>
          <AlertDialogDescription>
            A powerful web-based tool for analyzing protocol packet captures with advanced features and intuitive interface.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="grid gap-6 py-4 text-sm max-h-[60vh] overflow-y-auto">
          <div>
            <h4 className="font-semibold text-base mb-3">🎯 Key Features</h4>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Dashboard:</strong> Real-time analysis summary with interactive charts</li>
              <li><strong>Resizable Panels:</strong> Drag to resize packet list and details view</li>
              <li><strong>Command Menu:</strong> Press <kbd className="bg-muted px-1 py-0.5 rounded text-xs">Ctrl+K</kbd> for quick search</li>
              <li><strong>Interactive Filtering:</strong> Click fields to filter, use slider for RMS range</li>
              <li><strong>Data Export:</strong> Export analysis results to JSON/CSV formats</li>
              <li><strong>Hover Previews:</strong> Hover over packet indices for quick info</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-base mb-3">⚡ Pro Tips</h4>
            <ul className="list-disc list-inside space-y-2">
              <li>All processing happens in your browser - no data leaves your device</li>
              <li>Use the RMS slider for precise filtering of signal quality</li>
              <li>Right-click packets for context menu with filter options</li>
              <li>Toggle between light/dark themes using the theme button</li>
              <li>Charts are interactive - data updates in real-time with filters</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-base mb-3">🔧 Supported Formats</h4>
            <ul className="list-disc list-inside space-y-2">
              <li>PCAP (.pcap) and PCAPNG formats</li>
              <li>eCPRI protocol analysis</li>
              <li>U-plane packet processing</li>
              <li>BFPC compression/decompression</li>
              <li>IQ data extraction and RMS calculation</li>
            </ul>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Got it!</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};