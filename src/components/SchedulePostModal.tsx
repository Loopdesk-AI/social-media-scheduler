import { ChevronLeft, Play, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { clips } from '../data/clips';
import { videos } from '../data/videos';
import { Clip } from '../types';
import { SchedulingForm } from './SchedulingForm';

type SchedulePostModalProps = {
  onClose: () => void;
};

export function SchedulePostModal({
  onClose
}: SchedulePostModalProps) {
  console.log('SchedulePostModal rendering');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'projects'>('projects');
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
  const handleClipClick = (clip: Clip) => {
    setSelectedClip(clip);
  };
  const handleSelectClip = () => {
    setIsScheduling(true);
  };
  const handleBackFromScheduling = () => {
    setIsScheduling(false);
  };
  const handleSchedule = () => {
    toast.success('Post successfully scheduled');
    onClose();
  };
  const clearScheduledTime = () => {
    setScheduledTime(null);
  };
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                {(selectedVideo || selectedClip || isScheduling) && <button onClick={isScheduling ? handleBackFromScheduling : selectedClip ? handleBackToClips : handleBackToProjects} className="transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }} onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(var(--foreground))'} onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'} aria-label="Back">
                    <ChevronLeft size={20} />
                  </button>}
                <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>
                  {isScheduling ? 'Schedule post' : selectedClip ? 'Confirm clip to schedule' : selectedVideo ? 'Select clip' : 'Select project'}
                </h2>
              </div>
              {!selectedClip && !isScheduling && <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {selectedVideo ? 'Select a clip to preview and confirm.' : 'Select the project that contains the clip you would like to schedule.'}
                </p>}
            </div>
            <button onClick={onClose} className="transition-colors p-1 rounded-md" style={{ color: 'hsl(var(--muted-foreground))' }} onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(var(--foreground))'} onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          {isScheduling && selectedClip ? <>
              <SchedulingForm clipTitle={selectedClip.title} clipNumber={selectedClip.number} />
              {/* Bottom bar with scheduled time and schedule button */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderTopColor: 'hsl(var(--border))' }}>
                <div className="flex-1">
                  {scheduledTime && <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', borderColor: 'hsl(var(--border))' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="text-sm">{scheduledTime}</span>
                      <button onClick={clearScheduledTime} className="transition-colors ml-2" style={{ color: 'hsl(var(--muted-foreground))' }} onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(var(--foreground))'} onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}>
                        <X size={16} />
                      </button>
                    </div>}
                </div>
                <button onClick={handleSchedule} className="font-medium px-8 py-2 rounded-lg transition-colors" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                  Schedule
                </button>
              </div>
            </> : selectedClip ? <div className="flex gap-6">
              <div className="w-[280px] flex-shrink-0">
                <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                  <div className="flex flex-col">
                    <div className="relative">
                      <img src={selectedClip.thumbnail1} alt="" className="w-full aspect-video object-cover" />
                    </div>
                    <div className="relative">
                      <img src={selectedClip.thumbnail2} alt="" className="w-full aspect-video object-cover" />
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors">
                      <Play size={24} className="text-black ml-1" fill="black" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded">
                    00:00 / {selectedClip.duration}
                  </div>
                </div>
              </div>
              <div className="flex-1 max-h-[500px] overflow-y-auto pr-2">
                <h3 className="text-lg font-medium mb-4" style={{ color: 'hsl(var(--card-foreground))' }}>
                  #{selectedClip.number} {selectedClip.title}
                </h3>
                <div className="mb-6">
                  <div className="text-green-500 text-4xl font-bold mb-4">
                    96<span className="text-2xl text-gray-400">/100</span>
                  </div>
                  <div className="flex gap-2 mb-6">
                    <div className="rounded-lg px-3 py-2 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                      <div className="text-green-400 text-sm font-semibold mb-0.5">
                        A-
                      </div>
                      <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Hook</div>
                    </div>
                    <div className="rounded-lg px-3 py-2 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                      <div className="text-green-400 text-sm font-semibold mb-0.5">
                        A
                      </div>
                      <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Flow</div>
                    </div>
                    <div className="rounded-lg px-3 py-2 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                      <div className="text-green-400 text-sm font-semibold mb-0.5">
                        A-
                      </div>
                      <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Engagement</div>
                    </div>
                    <div className="rounded-lg px-3 py-2 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                      <div className="text-green-400 text-sm font-semibold mb-0.5">
                        A-
                      </div>
                      <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Trend</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      The beginning of the video could be more
                      attention-grabbing. One suggestion could be starting with
                      a surprising fact about the impact of continuous change on
                      memberships.
                    </p>
                    <div>
                      <div className="font-medium text-sm mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>
                        Summary
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        It's like that the continuous change in whatever that
                        topic is or industry is like it gives a valid reason for
                        why you should be in a membership right Like you know
                        for example like if it's a YouTube membership like it's
                        how to be a successful YouTuber youtube is always
                        changing so i'm gonna keep paying for my membership
                        because i wanna you know stay up with the changes and
                        all the things with this thought leader um you know we
                        have some We've had some clients that...
                      </p>
                    </div>
                  </div>
                </div>
                <button onClick={handleSelectClip} className="w-full font-medium py-3 rounded-lg transition-colors" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                  Select Clip
                </button>
              </div>
            </div> : !selectedVideo ? <>
              <div className="flex items-center justify-between mb-6">
                <button className="px-4 py-2 rounded-lg font-medium transition-colors" style={{ background: activeTab === 'projects' ? 'hsl(var(--muted))' : 'transparent', color: activeTab === 'projects' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }} onClick={() => setActiveTab('projects')}>
                  Projects
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border" style={{ color: 'hsl(var(--card-foreground))', borderColor: 'hsl(var(--border))' }}>
                  <Upload size={16} />
                  Upload own video
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2">
                {videos.map(video => <button key={video.id} onClick={() => handleVideoClick(video.id)} className="group relative rounded-lg overflow-hidden hover:ring-2 transition-all" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                    <div className="relative aspect-video bg-gray-900">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded">
                        {video.duration}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <div className="text-white text-5xl font-light">
                          Video
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-medium mb-1 text-left truncate" style={{ color: 'hsl(var(--card-foreground))' }}>
                        {video.title}
                      </div>
                      <div className="text-xs text-left" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {video.status}
                      </div>
                    </div>
                  </button>)}
              </div>
            </> : <div className="grid grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {clips.map(clip => <button key={clip.id} onClick={() => handleClipClick(clip)} className="group relative rounded-lg overflow-hidden hover:ring-2 transition-all" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                  <div className="relative aspect-video bg-gray-900">
                    <div className="flex flex-col h-full">
                      <div className="flex-1 relative">
                        <img src={clip.thumbnail1} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 relative">
                        <img src={clip.thumbnail2} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded">
                      {clip.duration}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-medium text-left truncate" style={{ color: 'hsl(var(--card-foreground))' }}>
                      #{clip.number} {clip.title}
                    </div>
                  </div>
                </button>)}
            </div>}
        </div>
      </div>
    </div>
  );
}