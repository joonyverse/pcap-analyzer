import React, { useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { 
  FileIcon, 
  UploadIcon, 
  ExclamationTriangleIcon, 
  CheckCircledIcon,
  Cross2Icon,
  ReloadIcon
} from '@radix-ui/react-icons';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  loadingProgress?: number;
}

interface FileValidation {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

interface FileMetadata {
  name: string;
  size: number;
  lastModified: number;
  type: string;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_EXTENSIONS = ['.pcap', '.pcapng', '.cap'];

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileExtension = (filename: string): string => {
  return '.' + filename.split('.').pop()?.toLowerCase();
};

const validateFile = (file: File): FileValidation => {
  const extension = getFileExtension(file.name);
  const warnings: string[] = [];
  
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(', ')} files are supported.`
    };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit.`
    };
  }
  
  if (file.size > 100 * 1024 * 1024) {
    warnings.push('Large file detected. Processing may take longer.');
  }
  
  if (extension === '.pcapng') {
    warnings.push('PCAPNG format support is experimental.');
  }
  
  return { isValid: true, warnings };
};


export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading, loadingProgress = 0 }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [validation, setValidation] = useState<FileValidation | null>(null);


  const processFile = useCallback((file: File) => {
    const fileMetadata: FileMetadata = {
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      type: file.type || 'application/octet-stream'
    };
    
    const fileValidation = validateFile(file);
    
    setSelectedFile(fileMetadata);
    setValidation(fileValidation);
    
    if (fileValidation.isValid) {
      onFileSelect(file);
      
      if (fileValidation.warnings?.length) {
        fileValidation.warnings.forEach(warning => {
          toast.warning(warning);
        });
      }
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input to allow same file selection
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFile]);

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 1) {
      toast.error('Please select only one file at a time.');
      return;
    }
    
    const file = files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setValidation(null);
  }, []);


  const getFileIcon = (filename: string) => {
    const ext = getFileExtension(filename);
    return ext === '.pcap' || ext === '.pcapng' ? (
      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
        <FileIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      </div>
    ) : (
      <div className="p-3 bg-gray-100 dark:bg-gray-900/30 rounded-full">
        <FileIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className={cn(
        'transition-all duration-200',
        isDragging && 'border-primary bg-primary/5 scale-105',
        !isLoading && 'hover:border-primary/50'
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadIcon className="h-5 w-5" />
            Upload PCAP File
          </CardTitle>
          <CardDescription>
            Upload your packet capture file for analysis. Supports .pcap and .pcapng formats up to 500MB.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pcap,.pcapng,.cap"
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
          />
          
          {/* Main Upload Area */}
          <div
            className={cn(
              'relative rounded-lg border-2 border-dashed transition-all duration-200 p-8',
              isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
              !isLoading && 'hover:border-primary/50 hover:bg-accent/50',
              !isLoading && 'cursor-pointer'
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !isLoading && fileInputRef.current?.click()}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin">
                  <ReloadIcon className="h-12 w-12 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">Analyzing PCAP file...</p>
                  <p className="text-sm text-muted-foreground">Please wait while we process your file</p>
                </div>
                <div className="w-full max-w-sm space-y-2">
                  <Progress value={loadingProgress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round(loadingProgress)}% complete</span>
                    <span>{selectedFile?.name || 'Processing...'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-4 bg-muted/30 rounded-full">
                  <UploadIcon className={cn(
                    'h-12 w-12 transition-colors',
                    isDragging ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">
                    {isDragging ? 'Drop file here' : 'Upload PCAP File'}
                  </h3>
                  <p className="text-muted-foreground">
                    {isDragging 
                      ? 'Release to upload your file' 
                      : 'Click to browse or drag and drop your .pcap file here'
                    }
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="secondary">.pcap</Badge>
                  <Badge variant="secondary">.pcapng</Badge>
                  <Badge variant="secondary">.cap</Badge>
                  <Badge variant="outline">Max 500MB</Badge>
                </div>
              </div>
            )}
          </div>
          
          {/* File Validation Messages */}
          {validation && !validation.isValid && (
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertDescription>{validation.error}</AlertDescription>
            </Alert>
          )}
          
          {/* Selected File Info */}
          {selectedFile && validation?.isValid && !isLoading && (
            <div className="p-4 border rounded-lg bg-accent/30">
              <div className="flex items-center gap-3">
                {getFileIcon(selectedFile.name)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{selectedFile.name}</h4>
                    <CheckCircledIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>{formatFileSize(selectedFile.size)}</span>
                    <span>•</span>
                    <span>{new Date(selectedFile.lastModified).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                >
                  <Cross2Icon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};