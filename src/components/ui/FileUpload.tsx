import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  loadingProgress?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading, loadingProgress = 0 }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <Card 
      className={`transition-colors ${!isLoading && 'hover:border-primary'}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => !isLoading && fileInputRef.current?.click()}
    >
      <CardContent className="p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pcap,.pcapng"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={isLoading}
        />
        <div className={`flex flex-col items-center justify-center space-y-2 rounded-md border-2 border-dashed border-muted-foreground/50 p-12 text-center ${!isLoading && 'cursor-pointer'}`}>
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-lg font-medium">Analyzing PCAP file...</p>
              <Progress value={loadingProgress} className="w-64" />
              <p className="text-sm text-muted-foreground">{Math.round(loadingProgress)}%</p>
            </div>
          ) : (
            <>
              <div className="text-5xl">📁</div>
              <h3 className="text-lg font-medium">Upload PCAP File</h3>
              <p className="text-sm text-muted-foreground">Click to select or drag and drop a .pcap file</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};