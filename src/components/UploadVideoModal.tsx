import { X } from 'lucide-react';
import React, { useRef, useState } from 'react';
type UploadVideoModalProps = {
  onClose: () => void;
};
export function UploadVideoModal({
  onClose
}: UploadVideoModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };
  const handleFileSelect = (file: File) => {
    // Handle file upload logic here
    console.log('File selected:', file);
  };
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="mb-2 text-xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>
                Upload own video
              </h2>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                You may upload and schedule your own videos directly through
                Loopdesk.
              </p>
            </div>
            <button onClick={onClose} className="p-1 transition-colors rounded-md" style={{ color: 'hsl(var(--muted-foreground))' }} onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(var(--foreground))'} onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div onClick={handleClick} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors`} style={{ borderColor: isDragging ? 'hsl(var(--border))' : 'hsl(var(--border))', background: isDragging ? 'hsl(var(--muted))' : 'transparent' }}>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Choose a file (mp4), or drag it here. File size up to 200MB
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept="video/mp4" onChange={handleFileInputChange} className="hidden" />
        </div>
      </div>
    </div>
  );
}