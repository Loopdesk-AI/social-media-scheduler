import { useState } from 'react';
import { X, ChevronLeft, Play, Upload } from 'lucide-react';
import { SchedulingForm } from './SchedulingForm';
import { toast } from 'sonner';
import { clips } from '../data/clips';
import { videos } from '../data/videos';
import { useApp } from '../contexts/AppContext';
import { Clip } from '../types';
import { formatForAPI } from '../lib/dateUtils';
import { api } from '../lib/api';

type SchedulePostModalProps = {
  onClose: () => void;
};

export function SchedulePostModal({
  onClose
}: SchedulePostModalProps) {
  const { integrations, createPost } = useApp();
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('AM');
  const [activeTab, setActiveTab] = useState<'projects' | 'clips'>('projects');
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [platformSpecificContent, setPlatformSpecificContent] = useState<Record<string, string>>({});
  const [uploadedVideo, setUploadedVideo] = useState<{ path: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [instagramMediaUrl, setInstagramMediaUrl] = useState(''); // New state for Instagram media URL
  
  const handleVideoClick = (videoId: string) => {
    setSelectedVideo(videoId);
  };
  
  const handleBackToProjects = () => {
    setSelectedVideo(null);
    setSelectedClip(null);
  };
  
  const handleBackToClips = () => {
    setSelectedClip(null);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error('Video file must be less than 500MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'video');

      const response: any = await api.uploadMedia(formData);
      
      setUploadedVideo({
        path: response.url || response.path, // Use URL if available, fallback to path
        name: file.name,
      });
      
      toast.success('Video uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };
  
  const handleClipClick = (clip: Clip) => {
    setSelectedClip(clip);
  };
  
  const handleSelectClip = () => {
    setIsScheduling(true);
  };
  
  const handleBackFromScheduling = () => {
    setIsScheduling(false);
  };
  
  const handlePlatformSelectionChange = (platformIds: string[]) => {
    setSelectedPlatforms(platformIds);
  };

  const handlePlatformContentChange = (platformId: string, content: string) => {
    setPlatformSpecificContent(prev => ({
      ...prev,
      [platformId]: content
    }));
  };
  
  const handleSchedule = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one social account');
      return;
    }

    if (!postContent.trim()) {
      toast.error('Please enter post content');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select a date and time');
      return;
    }

    // Check if YouTube is selected and video is uploaded
    const hasYouTube = selectedPlatforms.some(platformId => {
      const integration = integrations.find(i => i.id === platformId);
      return integration?.providerIdentifier === 'youtube';
    });

    if (hasYouTube && !uploadedVideo) {
      toast.error('YouTube requires a video file. Please upload a video.');
      return;
    }

    // Check if Instagram is selected and media URL is provided
    const hasInstagram = selectedPlatforms.some(platformId => {
      const integration = integrations.find(i => i.id === platformId);
      return integration?.providerIdentifier === 'instagram';
    });

    if (hasInstagram && !instagramMediaUrl.trim()) {
      toast.error('Instagram requires a media URL. Please provide a publicly accessible media URL.');
      return;
    }

    try {
      // Format the date for the API
      const formattedDate = formatForAPI(scheduledDate, scheduledTime, timePeriod);
      
      // For now, we'll create separate posts for each platform
      // In the future, we'll implement the multi-platform API
      for (const platformId of selectedPlatforms) {
        const content = platformSpecificContent[platformId] || postContent;
        
        // Get the integration to check the provider
        const integration = integrations.find(i => i.id === platformId);
        const isYouTube = integration?.providerIdentifier === 'youtube';
        const isInstagram = integration?.providerIdentifier === 'instagram';
        
        // Prepare media array based on platform
        let mediaArray = undefined;
        if (isYouTube && uploadedVideo) {
          // YouTube uses uploaded video file
          mediaArray = [{
            path: uploadedVideo.path,
            type: 'video',
          }];
        } else if (isInstagram && instagramMediaUrl) {
          // Instagram uses public URL
          mediaArray = [{
            path: instagramMediaUrl,
            type: instagramMediaUrl.match(/\.(mp4|mov|avi|wmv|flv|webm)$/i) ? 'video' : 'image',
          }];
        }
        
        await createPost({
          integrationId: platformId,
          content: content,
          publishDate: formattedDate,
          settings: isYouTube ? {
            // YouTube requires a title
            title: selectedClip?.title || content.substring(0, 100) || 'Untitled Video',
            description: content,
            clipTitle: selectedClip?.title,
            clipNumber: selectedClip?.number,
          } : {
            clipTitle: selectedClip?.title,
            clipNumber: selectedClip?.number,
          },
          media: mediaArray,
        });
      }
      
      toast.success(`Post scheduled successfully on ${selectedPlatforms.length} platform(s)`);
      onClose();
    } catch (error) {
      // Error already handled in context
      console.error('Error scheduling post:', error);
    }
  };
  
  const handleScheduledTimeChange = (date: Date, time: string, period: 'AM' | 'PM') => {
    setScheduledDate(date);
    setScheduledTime(time);
    setTimePeriod(period);
  };
  
  const clearScheduledTime = () => {
    setScheduledDate(null);
    setScheduledTime(null);
  };
  
  // Format the display date and time
  const formatDisplayDateTime = () => {
    if (!scheduledDate || !scheduledTime) return '';
    
    const formattedDate = scheduledDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `${formattedDate} at ${scheduledTime} ${timePeriod}`;
  };
  
  return <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] rounded-xl border border-gray-800/50 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
          <h2 className="text-xl font-semibold text-white">
            {isScheduling ? 'Schedule Post' : selectedClip ? selectedClip.title : selectedVideo ? 'Select Clip' : 'Select Project'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:text-white hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isScheduling ? (
            <div className="p-6">
              <SchedulingForm
                onPlatformSelectionChange={handlePlatformSelectionChange}
                onPlatformContentChange={handlePlatformContentChange}
                onScheduledTimeChange={handleScheduledTimeChange}
                initialPostContent={postContent}
                onPostContentChange={setPostContent}
                onVideoUpload={handleVideoUpload}
                uploadedVideo={uploadedVideo}
                uploading={uploading}
                selectedPlatforms={selectedPlatforms}
                integrations={integrations}
                onInstagramMediaUrlChange={setInstagramMediaUrl} // Pass the handler
              />
            </div>
          ) : selectedClip ? (
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={handleBackToProjects}
                  className="p-2 text-gray-400 transition-colors rounded-lg hover:text-white hover:bg-gray-800"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="text-lg font-medium text-white">{selectedClip.title}</h3>
              </div>
              
              <div className="bg-[#1a1a1a] rounded-lg border border-gray-800/50 overflow-hidden">
                <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <Play size={48} className="text-white/80" />
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">Clip #{selectedClip.number}</span>
                    <span className="text-sm text-gray-400">{selectedClip.duration}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-xs font-medium text-white">YT</span>
                      </div>
                      <span className="text-sm text-gray-300">YouTube</span>
                    </div>
                    
                    <button 
                      onClick={handleSelectClip}
                      className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      Select Clip
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedVideo ? (
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={handleBackToProjects}
                  className="p-2 text-gray-400 transition-colors rounded-lg hover:text-white hover:bg-gray-800"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="text-lg font-medium text-white">
                  {videos.find(v => v.id === selectedVideo)?.title || 'Unknown Project'}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {clips
                  .map(clip => (
                    <div 
                      key={clip.id}
                      onClick={() => handleClipClick(clip)}
                      className="bg-[#1a1a1a] rounded-lg border border-gray-800/50 overflow-hidden cursor-pointer hover:border-gray-700 transition-colors"
                    >
                      <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                          <Play size={32} className="text-white/80" />
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white truncate">{clip.title}</h4>
                          <span className="text-xs text-gray-400">#{clip.number}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{clip.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'projects'
                      ? 'bg-white text-black'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Projects
                </button>
                <button
                  onClick={() => setActiveTab('clips')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'clips'
                      ? 'bg-white text-black'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Clips
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(activeTab === 'projects' ? videos : clips).map(item => (
                  <div 
                    key={item.id}
                    onClick={() => 
                      activeTab === 'projects' 
                        ? handleVideoClick(item.id) 
                        : handleClipClick(item as Clip)
                    }
                    className="bg-[#1a1a1a] rounded-lg border border-gray-800/50 overflow-hidden cursor-pointer hover:border-gray-700 transition-colors"
                  >
                    <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <Play size={32} className="text-white/80" />
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-medium text-white truncate">
                        {item.title}
                      </h3>
                      {'duration' in item && (
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">{item.duration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        {isScheduling && (
          <div className="p-6 border-t border-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {scheduledDate && scheduledTime && (
                  <span>
                    Scheduled for {formatDisplayDateTime()}
                    <button 
                      onClick={clearScheduledTime}
                      className="ml-2 text-red-400 hover:text-red-300"
                    >
                      (Clear)
                    </button>
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleBackFromScheduling}
                  className="px-4 py-2 text-sm font-medium text-gray-300 transition-colors rounded-lg hover:text-white hover:bg-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={handleSchedule}
                  disabled={selectedPlatforms.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Schedule Post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>;
}