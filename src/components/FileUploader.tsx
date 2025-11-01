import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileUploaderProps {
  bucket: 'course-videos' | 'course-materials';
  folder?: string;
  accept?: string;
  maxSize?: number; // in MB
  onUploadComplete?: (url: string, fileName: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

export const FileUploader = ({
  bucket,
  folder = '',
  accept = '*/*',
  maxSize = 100, // 100MB default
  onUploadComplete,
  onUploadError,
  className
}: FileUploaderProps) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    if (accept !== '*/*') {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      const mimeType = file.type;
      
      const isAccepted = acceptedTypes.some(type => 
        type === mimeType || type === fileExtension || type === '*/*'
      );
      
      if (!isAccepted) {
        return `File type not supported. Accepted types: ${accept}`;
      }
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const validation = validateFile(file);
    if (validation) {
      toast.error(validation);
      onUploadError?.(validation);
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Add file to uploading state
    const newFile: UploadingFile = {
      file,
      progress: 0,
      status: 'uploading',
    };

    setUploadingFiles(prev => [...prev, newFile]);

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Update file status
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, status: 'completed', url: urlData.publicUrl, progress: 100 }
            : f
        )
      );

      toast.success(`${file.name} uploaded successfully`);
      onUploadComplete?.(urlData.publicUrl, file.name);

    } catch (error: any) {
      const errorMessage = error.message || 'Upload failed';
      
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, status: 'error', error: errorMessage, progress: 0 }
            : f
        )
      );

      toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
      onUploadError?.(errorMessage);
    }
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(uploadFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removeFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(f => f.file !== file));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) return '🎥';
    if (file.type.startsWith('audio/')) return '🎵';
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.includes('pdf')) return '📄';
    return '📎';
  };

  return (
    <div className={className}>
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <CardContent className="p-6 text-center">
          <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            Drag and drop files here, or click to select
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Maximum file size: {maxSize}MB
          </p>
          <Button 
            type="button"
            variant="outline"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = accept;
              input.multiple = true;
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                handleFileSelect(target.files);
              };
              input.click();
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Files
          </Button>
        </CardContent>
      </Card>

      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-3">
          {uploadingFiles.map((uploadFile, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center space-x-3">
                <div className="text-xl">
                  {getFileIcon(uploadFile.file)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadFile.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  {uploadFile.status === 'uploading' && (
                    <Progress value={uploadFile.progress} className="mt-2 h-2" />
                  )}
                  {uploadFile.status === 'error' && (
                    <p className="text-xs text-destructive mt-1">
                      {uploadFile.error}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {uploadFile.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}
                  {uploadFile.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadFile.file)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};