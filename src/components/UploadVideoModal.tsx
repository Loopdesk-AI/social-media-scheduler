import React, { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
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
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80">
      <div className="bg-white dark:bg-[#0f0f0f] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800/50 transition-colors duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Upload own video
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You may upload and schedule your own videos directly through
                Loopdesk.
              </p>
            </div>
            <button onClick={onClose} className="p-1 text-gray-600 dark:text-gray-400 transition-colors rounded-md hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50" aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div onClick={handleClick} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragging ? 'border-gray-400 dark:border-white/40 bg-gray-100 dark:bg-gray-800/20' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'}`}>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose a file (mp4), or drag it here. File size up to 200MB
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept="video/mp4" onChange={handleFileInputChange} className="hidden" />
        </div>
      </div>
    </div>;
}