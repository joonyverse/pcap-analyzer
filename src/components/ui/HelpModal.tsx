import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>About PCAP Analyzer</DialogTitle>
          <DialogDescription>
            This tool is a web-based PCAP analyzer for O-RAN protocols.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
          <h4 className="font-semibold">Features</h4>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Dashboard:</strong> A summary of the analyzed file.</li>
            <li><strong>Packets View:</strong> Browse and inspect individual packets.</li>
            <li><strong>Interactive Filtering:</strong> Click fields in the details view to filter.</li>
            <li><strong>Collapsible Sections:</strong> Easily navigate packet details.</li>
          </ul>
          <h4 className="font-semibold">Tips</h4>
          <ul className="list-disc list-inside space-y-2">
            <li>Your files are processed in the browser and are not uploaded to any server.</li>
            <li>The packet list is paginated for better performance.</li>
          </ul>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};