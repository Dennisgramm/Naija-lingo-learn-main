import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Video, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
}

interface LessonUploaderProps {
  onFileUploaded: (url: string, type: 'video' | 'document') => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
}

export const LessonUploader = ({ 
  onFileUploaded, 
  acceptedTypes = ['.mp4', '.webm', '.ogg', '.pdf', '.doc', '.docx'],
  maxFileSize = 100 
}: LessonUploaderProps) => {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault(); // Prevent any form submission
    e.stopPropagation(); // Stop event bubbling
    
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB`);
        return;
      }

      // Validate file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.includes(fileExtension)) {
        toast.error(`File type ${fileExtension} is not supported`);
        return;
      }

      const uploadId = crypto.randomUUID();
      const newUpload: FileUpload = {
        id: uploadId,
        file,
        progress: 0,
        status: 'uploading'
      };

      setUploads(prev => [...prev, newUpload]);
      simulateUpload(uploadId, file);
    });

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const simulateUpload = async (uploadId: string, file: File) => {
    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploads(prev => 
          prev.map(upload => 
            upload.id === uploadId 
              ? { ...upload, progress }
              : upload
          )
        );
      }

      // Create object URL for demo purposes
      const url = URL.createObjectURL(file);
      const fileType = file.type.startsWith('video/') ? 'video' : 'document';
      
      setUploads(prev => 
        prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, status: 'completed', url }
            : upload
        )
      );

      onFileUploaded(url, fileType);
      toast.success(`${file.name} uploaded successfully`);
    } catch (error) {
      setUploads(prev => 
        prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, status: 'error' }
            : upload
        )
      );
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const removeUpload = (uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (upload?.url) {
      URL.revokeObjectURL(upload.url);
    }
    setUploads(prev => prev.filter(u => u.id !== uploadId));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) {
      return <Video className="w-6 h-6 text-blue-500" />;
    }
    return <FileText className="w-6 h-6 text-green-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Lesson Files</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop your files here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supported: {acceptedTypes.join(', ')} • Max size: {maxFileSize}MB
            </p>
            <Button 
              className="mt-4" 
              variant="outline"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Choose Files
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-4">Uploads ({uploads.length})</h4>
            <div className="space-y-3">
              {uploads.map(upload => (
                <div key={upload.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  {getFileIcon(upload.file)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{upload.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(upload.file.size)}
                    </p>
                    
                    {upload.status === 'uploading' && (
                      <Progress value={upload.progress} className="mt-2 h-1" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {upload.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-success" />
                    )}
                    {upload.status === 'error' && (
                      <X className="w-5 h-5 text-destructive" />
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeUpload(upload.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};