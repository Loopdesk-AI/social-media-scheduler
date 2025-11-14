import { useState } from "react";
import { X, ChevronLeft, Play, Upload } from "lucide-react";
import { SchedulingForm } from "./SchedulingForm";
import { toast } from "sonner";
import { Clip } from "../types";
import { videos } from "../data/videos";
import { clips } from "../data/clips";

type SchedulePostModalProps = {
  onClose: () => void;
};

export function SchedulePostModal({ onClose }: SchedulePostModalProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [postLimitState, setPostLimitState] = useState<
    "ok" | "warning" | "error"
  >("ok");
  const [activeTab, setActiveTab] = useState<"projects" | "upload">("projects");
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
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
    toast.success("Post successfully scheduled");
    onClose();
  };
  const clearScheduledTime = () => {
    setScheduledTime(null);
  };
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f0f0f] w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden border border-gray-800/50 max-h-[90vh]">
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                {(selectedVideo || selectedClip || isScheduling) && (
                  <button
                    onClick={
                      isScheduling
                        ? handleBackFromScheduling
                        : selectedClip
                        ? handleBackToClips
                        : handleBackToProjects
                    }
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Back"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <h2 className="text-white text-xl font-semibold">
                  {isScheduling
                    ? "Schedule post"
                    : selectedClip
                    ? "Confirm clip to schedule"
                    : selectedVideo
                    ? "Select clip"
                    : "Select project"}
                </h2>
              </div>
              {!selectedClip && !isScheduling && (
                <p className="text-gray-400 text-sm">
                  {selectedVideo
                    ? "Select a clip to preview and confirm."
                    : "Select the project that contains the clip you would like to schedule."}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800/50 rounded-md"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          {isScheduling && selectedClip ? (
            <>
              <SchedulingForm
                clipTitle={selectedClip.title}
                clipNumber={selectedClip.number}
                onLimitChange={setPostLimitState}
              />
              {/* Bottom bar with scheduled time and schedule button */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-800/50">
                <div className="flex-1">
                  {scheduledTime && (
                    <div className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg border border-gray-800/50 inline-flex">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="text-sm">{scheduledTime}</span>
                      <button
                        onClick={clearScheduledTime}
                        className="text-gray-400 hover:text-white transition-colors ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {postLimitState === "error" && (
                    <div className="text-red-400 text-sm">
                      Post exceeds platform character limit
                    </div>
                  )}
                  <button
                    disabled={postLimitState === "error"}
                    onClick={handleSchedule}
                    className={`bg-white text-black font-medium px-8 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                      postLimitState === "error"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    Schedule
                  </button>
                </div>
              </div>
            </>
          ) : selectedClip ? (
            <div className="flex gap-6">
              <div className="w-[280px] flex-shrink-0">
                <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                  <div className="flex flex-col">
                    <div className="relative">
                      <img
                        src={selectedClip.thumbnail1}
                        alt=""
                        className="w-full aspect-video object-cover"
                      />
                    </div>
                    <div className="relative">
                      <img
                        src={selectedClip.thumbnail2}
                        alt=""
                        className="w-full aspect-video object-cover"
                      />
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors">
                      <Play
                        size={24}
                        className="text-black ml-1"
                        fill="black"
                      />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded">
                    00:00 / {selectedClip.duration}
                  </div>
                </div>
              </div>
              <div className="flex-1 max-h-[500px] overflow-y-auto pr-2">
                <h3 className="text-white text-lg font-medium mb-4">
                  #{selectedClip.number} {selectedClip.title}
                </h3>
                <div className="mb-6">
                  <div className="text-green-500 text-4xl font-bold mb-4">
                    96<span className="text-2xl text-gray-400">/100</span>
                  </div>
                  <div className="flex gap-2 mb-6">
                    <div className="bg-[#1a1a1a] rounded-lg px-3 py-2 border border-gray-800">
                      <div className="text-green-400 text-sm font-semibold mb-0.5">
                        A-
                      </div>
                      <div className="text-gray-400 text-xs">Hook</div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg px-3 py-2 border border-gray-800">
                      <div className="text-green-400 text-sm font-semibold mb-0.5">
                        A
                      </div>
                      <div className="text-gray-400 text-xs">Flow</div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg px-3 py-2 border border-gray-800">
                      <div className="text-green-400 text-sm font-semibold mb-0.5">
                        A-
                      </div>
                      <div className="text-gray-400 text-xs">Engagement</div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg px-3 py-2 border border-gray-800">
                      <div className="text-green-400 text-sm font-semibold mb-0.5">
                        A-
                      </div>
                      <div className="text-gray-400 text-xs">Trend</div>
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
                      <div className="text-white font-medium text-sm mb-2">
                        Summary
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed">
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
                <button
                  onClick={handleSelectClip}
                  className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Select Clip
                </button>
              </div>
            </div>
          ) : !selectedVideo ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "projects"
                      ? "bg-[#1a1a1a] text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                  onClick={() => setActiveTab("projects")}
                >
                  Projects
                </button>
                <button className="flex items-center gap-2 text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors border border-gray-800/50 hover:border-gray-700">
                  <Upload size={16} />
                  Upload own video
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2">
                {videos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => handleVideoClick(video.id)}
                    className="group relative bg-[#1a1a1a] rounded-lg overflow-hidden hover:ring-2 hover:ring-white/20 transition-all"
                  >
                    <div className="relative aspect-video bg-gray-900">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
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
                      <div className="text-white text-sm font-medium mb-1 text-left truncate">
                        {video.title}
                      </div>
                      <div className="text-gray-500 text-xs text-left">
                        {video.status}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {clips.map((clip) => (
                <button
                  key={clip.id}
                  onClick={() => handleClipClick(clip)}
                  className="group relative bg-[#1a1a1a] rounded-lg overflow-hidden hover:ring-2 hover:ring-white/20 transition-all"
                >
                  <div className="relative aspect-video bg-gray-900">
                    <div className="flex flex-col h-full">
                      <div className="flex-1 relative">
                        <img
                          src={clip.thumbnail1}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 relative">
                        <img
                          src={clip.thumbnail2}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded">
                      {clip.duration}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-white text-sm font-medium text-left truncate">
                      #{clip.number} {clip.title}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
