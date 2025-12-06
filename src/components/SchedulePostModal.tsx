import { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  Play,
  Upload,
  HardDrive,
  Film,
  Clock,
  ArrowRight,
  LayoutGrid,
  Cloud,
  FileVideo,
} from "lucide-react";
import { SchedulingForm } from "./SchedulingForm";
import { StorageFileBrowser } from "./StorageFileBrowser";
import { toast } from "sonner";
import { clips } from "../data/clips";
import { videos } from "../data/videos";
import { useApp } from "../contexts/AppContext";
import { Clip } from "../types";
import { formatForAPI } from "../lib/dateUtils";
import { api, StorageFile } from "../lib/api";

type SchedulePostModalProps = {
  onClose: () => void;
  initialPost?: any;
  mode?: "create" | "edit" | "duplicate";
};

export function SchedulePostModal({
  onClose,
  initialPost,
  mode = "create",
}: SchedulePostModalProps) {
  const { integrations, createPost, updatePost } = useApp();
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [isScheduling, setIsScheduling] = useState(mode === "edit");

  // Initialize state from initialPost if available
  const [scheduledDate, setScheduledDate] = useState<Date | null>(
    initialPost ? new Date(initialPost.publishDate) : null,
  );

  const getInitialTime = () => {
    if (!initialPost) return null;
    const date = new Date(initialPost.publishDate);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    hours = hours % 12 || 12;
    return `${hours}:${minutes}`;
  };

  const [scheduledTime, setScheduledTime] = useState<string | null>(
    getInitialTime(),
  );
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">(
    initialPost
      ? new Date(initialPost.publishDate).getHours() >= 12
        ? "PM"
        : "AM"
      : "AM",
  );

  // Default to 'projects' tab instead of 'source-picker'
  const [activeTab, setActiveTab] = useState<
    "projects" | "clips" | "cloud-storage" | "upload"
  >("projects");

  const [postContent, setPostContent] = useState(initialPost?.content || "");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    initialPost ? [initialPost.integration.id] : [],
  );
  const [platformSpecificContent, setPlatformSpecificContent] = useState<
    Record<string, string>
  >({});
  const [uploadedVideo, setUploadedVideo] = useState<{
    path: string;
    name: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [instagramMediaUrl, setInstagramMediaUrl] = useState("");
  const [selectedStorageIntegration, setSelectedStorageIntegration] = useState<
    string | null
  >(null);
  const [storageIntegrations, setStorageIntegrations] = useState<any[]>([]);
  const [loadingStorageIntegrations, setLoadingStorageIntegrations] =
    useState(false);
  const [integrationsLoaded, setIntegrationsLoaded] = useState(false);

  const handleVideoClick = (videoId: string) => {
    setSelectedVideo(videoId);
  };

  const handleBackToClips = () => {
    setSelectedClip(null);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect if it's actually a video or image
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      toast.error("Please select a video or image file");
      return;
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error("File must be less than 500MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", isVideo ? "video" : "image");

      const response: any = await api.uploadMedia(formData);

      setUploadedVideo({
        path: response.url || response.path,
        name: file.name,
        type: isVideo ? "video" : "image",
        mimeType: file.type,
        size: file.size,
      } as any);

      toast.success(`${isVideo ? "Video" : "Image"} uploaded successfully!`);
      setIsScheduling(true);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload ${isVideo ? "video" : "image"}`);
    } finally {
      setUploading(false);
    }
  };

  // Fetch storage integrations when Cloud Storage tab is active
  useEffect(() => {
    if (
      activeTab === "cloud-storage" &&
      !integrationsLoaded &&
      !loadingStorageIntegrations
    ) {
      setLoadingStorageIntegrations(true);
      api
        .getStorageIntegrations()
        .then((integrations) => {
          setStorageIntegrations(integrations);
          setIntegrationsLoaded(true);
        })
        .catch((error) => {
          console.error("Failed to fetch storage integrations:", error);
          toast.error("Failed to load storage providers");
        })
        .finally(() => {
          setLoadingStorageIntegrations(false);
        });
    }
  }, [activeTab, integrationsLoaded, loadingStorageIntegrations]);

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
    setPlatformSpecificContent((prev) => ({
      ...prev,
      [platformId]: content,
    }));
  };

  const handleSchedule = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one social account");
      return;
    }

    if (!postContent.trim()) {
      toast.error("Please enter post content");
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast.error("Please select a date and time");
      return;
    }

    // Get platform identifiers for validation
    const platformIdentifiers = selectedPlatforms.map((platformId) => {
      const integration = integrations.find((i) => i.id === platformId);
      return { id: platformId, provider: integration?.providerIdentifier };
    });

    const hasYouTube = platformIdentifiers.some(
      (p) => p.provider === "youtube",
    );
    const hasInstagram = platformIdentifiers.some(
      (p) => p.provider === "instagram",
    );

    // Detect media type from uploaded video
    const uploadedMediaType = uploadedVideo
      ? (uploadedVideo as any).type ||
        (uploadedVideo.name.match(/\.(mp4|mov|avi|webm|mkv)$/i)
          ? "video"
          : "image")
      : null;

    console.log("🎬 Media validation:", {
      uploadedVideo: uploadedVideo?.name,
      uploadedMediaType,
      selectedClip: selectedClip?.title,
      instagramMediaUrl,
      platforms: platformIdentifiers.map((p) => p.provider),
    });

    // YouTube validation - requires video
    if (
      hasYouTube &&
      !uploadedVideo &&
      !selectedClip &&
      !selectedVideo &&
      mode !== "edit"
    ) {
      toast.error(
        "YouTube requires a video file. Please upload a video or select from your library.",
      );
      return;
    }

    // YouTube with image validation
    if (hasYouTube && uploadedVideo && uploadedMediaType === "image") {
      toast.error(
        "YouTube requires video files, not images. Your selected image works great for Instagram or LinkedIn!",
      );
      return;
    }

    // Instagram validation - requires media
    if (
      hasInstagram &&
      !instagramMediaUrl.trim() &&
      !uploadedVideo &&
      !selectedClip &&
      mode !== "edit"
    ) {
      toast.error(
        "Instagram requires media (image or video). Please select or upload media first.",
      );
      return;
    }

    // Cloud storage file notification
    if (uploadedVideo && uploadedVideo.path.startsWith("/storage/")) {
      console.log("☁️ Using cloud storage file:", uploadedVideo.name);
      toast.success(`Using ${uploadedVideo.name} from cloud storage`);
    }

    try {
      const formattedDate = formatForAPI(
        scheduledDate,
        scheduledTime,
        timePeriod,
      );

      // If editing, we only update the single post
      if (mode === "edit" && initialPost) {
        await updatePost(initialPost.id, {
          content: postContent,
          publishDate: formattedDate,
          // Only update media if new media is selected
          ...(uploadedVideo || instagramMediaUrl
            ? {
                media: uploadedVideo
                  ? [
                      {
                        path: uploadedVideo.path,
                        type: uploadedMediaType || "video",
                      },
                    ]
                  : instagramMediaUrl
                    ? [{ path: instagramMediaUrl, type: "image" }]
                    : undefined,
              }
            : {}),
        });
        toast.success("Post updated successfully");
        onClose();
        return;
      }

      // Create new posts (for create or duplicate mode)
      for (const { id: platformId, provider } of platformIdentifiers) {
        const content = platformSpecificContent[platformId] || postContent;
        const isYouTube = provider === "youtube";
        const isInstagram = provider === "instagram";

        console.log(
          `🔍 Processing platform: ${provider}, platformId: ${platformId}`,
        );
        console.log(`   uploadedVideo:`, uploadedVideo);
        console.log(`   uploadedMediaType:`, uploadedMediaType);
        console.log(`   instagramMediaUrl:`, instagramMediaUrl);

        let mediaArray = undefined;

        // Handle media attachment based on platform
        if (isYouTube && uploadedVideo) {
          mediaArray = [
            {
              path: uploadedVideo.path,
              type: "video",
            },
          ];
          console.log(`   ✅ YouTube: mediaArray set to:`, mediaArray);
        } else if (isInstagram) {
          if (instagramMediaUrl) {
            mediaArray = [
              {
                path: instagramMediaUrl,
                type: instagramMediaUrl.match(/\.(mp4|mov|avi|wmv|flv|webm)$/i)
                  ? "video"
                  : "image",
              },
            ];
            console.log(
              `   ✅ Instagram (mediaUrl): mediaArray set to:`,
              mediaArray,
            );
          } else if (uploadedVideo) {
            mediaArray = [
              {
                path: uploadedVideo.path,
                type: uploadedMediaType || "video",
              },
            ];
            console.log(
              `   ✅ Instagram (uploadedVideo): mediaArray set to:`,
              mediaArray,
            );
          }
        } else if (uploadedVideo) {
          // For other platforms (LinkedIn, etc.)
          mediaArray = [
            {
              path: uploadedVideo.path,
              type: uploadedMediaType || "video",
            },
          ];
          console.log(`   ✅ Other platform: mediaArray set to:`, mediaArray);
        }

        console.log(`   📦 Final mediaArray for ${provider}:`, mediaArray);

        // Construct settings with media INSIDE for backend
        const postSettings = isYouTube
          ? {
              title:
                selectedClip?.title ||
                content.substring(0, 100) ||
                "Untitled Video",
              description: content,
              clipTitle: selectedClip?.title,
              clipNumber: selectedClip?.number,
              media: mediaArray || [], // ← Media INSIDE settings
            }
          : {
              clipTitle: selectedClip?.title,
              clipNumber: selectedClip?.number,
              media: mediaArray || [], // ← Media INSIDE settings for all platforms
            };

        console.log(`   ⚙️ postSettings for ${provider}:`, postSettings);

        await createPost({
          integrationId: platformId,
          content: content,
          publishDate: formattedDate,
          settings: postSettings,
          media: mediaArray, // ← CRITICAL: Also send as top-level field for controller
        });
      }

      toast.success(
        `Post ${mode === "duplicate" ? "duplicated" : "scheduled"} successfully`,
      );
      onClose();
    } catch (error) {
      console.error("Error scheduling post:", error);
      toast.error("Failed to schedule post. Please check all required fields.");
    }
  };

  const handleScheduledTimeChange = (
    date: Date,
    time: string,
    period: "AM" | "PM",
  ) => {
    setScheduledDate(date);
    setScheduledTime(time);
    setTimePeriod(period);
  };

  const clearScheduledTime = () => {
    setScheduledDate(null);
    setScheduledTime(null);
  };

  const formatDisplayDateTime = () => {
    if (!scheduledDate || !scheduledTime) return "";
    const formattedDate = scheduledDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return `${formattedDate} at ${scheduledTime} ${timePeriod}`;
  };

  const TabButton = ({
    id,
    icon: Icon,
    label,
  }: {
    id: typeof activeTab;
    icon: any;
    label: string;
  }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        // Reset selections when switching tabs
        if (!isScheduling) {
          setSelectedVideo(null);
          setSelectedClip(null);
          setUploadedVideo(null);
        }
      }}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${
          activeTab === id
            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
            : "text-gray-400 hover:text-white hover:bg-gray-800"
        }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[#0a0a0a] rounded-2xl border border-gray-800 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex flex-col border-b border-gray-800 bg-[#0a0a0a] z-10">
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-4">
              {isScheduling && (
                <button
                  onClick={handleBackFromScheduling}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isScheduling
                    ? mode === "edit"
                      ? "Edit Post"
                      : mode === "duplicate"
                        ? "Duplicate Post"
                        : "Schedule Post"
                    : "Select Media"}
                </h2>
                <p className="text-sm text-gray-500">
                  {isScheduling
                    ? "Configure your post details"
                    : "Choose where to import your media from"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Bar - Only show when not scheduling */}
          {!isScheduling && (
            <div className="flex items-center gap-2 px-6 pb-4 overflow-x-auto no-scrollbar">
              <TabButton id="projects" icon={LayoutGrid} label="Projects" />
              <TabButton id="clips" icon={Film} label="Clips" />
              <TabButton
                id="cloud-storage"
                icon={Cloud}
                label="Cloud Storage"
              />
              <TabButton id="upload" icon={Upload} label="Upload" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
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
                onInstagramMediaUrlChange={setInstagramMediaUrl}
              />
            </div>
          ) : (
            <div className="h-full">
              {activeTab === "projects" && (
                <div className="p-6">
                  {selectedVideo ? (
                    <div>
                      <div className="flex items-center gap-4 mb-6">
                        <button
                          onClick={() => setSelectedVideo(null)}
                          className="p-2 text-gray-400 transition-colors rounded-lg hover:text-white hover:bg-gray-800"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <h3 className="text-lg font-medium text-white">
                          {videos.find((v) => v.id === selectedVideo)?.title ||
                            "Unknown Project"}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clips.map((clip) => (
                          <div
                            key={clip.id}
                            onClick={() => handleClipClick(clip)}
                            className="group bg-[#111] rounded-xl border border-gray-800 overflow-hidden cursor-pointer hover:border-gray-600 hover:shadow-xl transition-all duration-200"
                          >
                            <div className="relative pt-[56.25%] bg-gray-900">
                              <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                <Play
                                  size={32}
                                  className="text-white/80 group-hover:text-white"
                                />
                              </div>
                            </div>
                            <div className="p-4">
                              <h4 className="font-medium text-white truncate mb-1">
                                {clip.title}
                              </h4>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>#{clip.number}</span>
                                <span>{clip.duration}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {videos.map((video) => (
                        <div
                          key={video.id}
                          onClick={() => handleVideoClick(video.id)}
                          className="group bg-[#111] rounded-xl border border-gray-800 overflow-hidden cursor-pointer hover:border-gray-600 hover:shadow-xl transition-all duration-200"
                        >
                          <div className="relative pt-[56.25%] bg-gray-900">
                            <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                              <Play
                                size={32}
                                className="text-white/80 group-hover:text-white"
                              />
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-medium text-white truncate mb-1">
                              {video.title}
                            </h3>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{video.duration}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "clips" && (
                <div className="p-6">
                  {selectedClip ? (
                    <div className="max-w-4xl mx-auto">
                      <div className="flex items-center gap-4 mb-6">
                        <button
                          onClick={handleBackToClips}
                          className="p-2 text-gray-400 transition-colors rounded-lg hover:text-white hover:bg-gray-800"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <h3 className="text-lg font-medium text-white">
                          {selectedClip.title}
                        </h3>
                      </div>

                      <div className="bg-[#111] rounded-xl border border-gray-800 overflow-hidden">
                        <div className="relative pt-[56.25%] bg-black">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play
                              size={64}
                              className="text-white/80 hover:text-white transition-colors cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-white font-medium text-lg">
                                {selectedClip.title}
                              </h4>
                              <p className="text-gray-500 text-sm">
                                Clip #{selectedClip.number} •{" "}
                                {selectedClip.duration}
                              </p>
                            </div>
                            <button
                              onClick={handleSelectClip}
                              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                              Select Clip
                              <ArrowRight size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {clips.map((clip) => (
                        <div
                          key={clip.id}
                          onClick={() => handleClipClick(clip)}
                          className="group bg-[#111] rounded-xl border border-gray-800 overflow-hidden cursor-pointer hover:border-gray-600 hover:shadow-xl transition-all duration-200"
                        >
                          <div className="relative pt-[56.25%] bg-gray-900">
                            <div className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                              <Play
                                size={32}
                                className="text-white/80 group-hover:text-white"
                              />
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-medium text-white truncate mb-1">
                              {clip.title}
                            </h3>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{clip.duration}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "cloud-storage" && (
                <div className="p-6 h-full flex flex-col">
                  {selectedStorageIntegration ? (
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <button
                          onClick={() => setSelectedStorageIntegration(null)}
                          className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                        >
                          <ChevronLeft size={16} />
                          Back to Providers
                        </button>
                      </div>
                      <StorageFileBrowser
                        integrationId={selectedStorageIntegration}
                        onFileSelect={(file: StorageFile) => {
                          // Detect media type from MIME type or extension
                          const isVideo =
                            file.mimeType.startsWith("video/") ||
                            [
                              "mp4",
                              "mov",
                              "avi",
                              "webm",
                              "mkv",
                              "flv",
                              "wmv",
                            ].some((ext) =>
                              file.name.toLowerCase().endsWith(`.${ext}`),
                            );

                          const isImage =
                            file.mimeType.startsWith("image/") ||
                            [
                              "jpg",
                              "jpeg",
                              "png",
                              "gif",
                              "webp",
                              "bmp",
                              "svg",
                            ].some((ext) =>
                              file.name.toLowerCase().endsWith(`.${ext}`),
                            );

                          console.log("📁 Selected file from cloud storage:", {
                            name: file.name,
                            detectedType: isVideo
                              ? "video"
                              : isImage
                                ? "image"
                                : "unknown",
                            mimeType: file.mimeType,
                            size: file.sizeFormatted,
                            path: `/storage/${selectedStorageIntegration}/files/${file.id}`,
                          });

                          // Store with complete metadata
                          setUploadedVideo({
                            path: `/storage/${selectedStorageIntegration}/files/${file.id}`,
                            name: file.name,
                            type: isVideo
                              ? "video"
                              : isImage
                                ? "image"
                                : "unknown",
                            mimeType: file.mimeType,
                            size: file.size,
                            sizeFormatted: file.sizeFormatted,
                          } as any);

                          setIsScheduling(true);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <HardDrive size={48} className="mb-6 text-gray-600" />
                      <h3 className="text-xl font-medium text-white mb-2">
                        Select Storage Provider
                      </h3>
                      <p className="text-gray-400 mb-8">
                        Choose a connected storage provider to browse your files
                      </p>

                      {loadingStorageIntegrations ? (
                        <div className="flex items-center gap-2 text-gray-400">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Loading providers...
                        </div>
                      ) : storageIntegrations.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                          {storageIntegrations.map((integration) => (
                            <button
                              key={integration.id}
                              onClick={() =>
                                setSelectedStorageIntegration(integration.id)
                              }
                              className="flex items-center gap-4 p-6 bg-[#111] border border-gray-800 rounded-xl hover:border-gray-600 hover:bg-gray-800/50 transition-all duration-200 group text-left"
                            >
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform
                                ${
                                  integration.provider === "google-drive" ||
                                  integration.provider === "google" ||
                                  integration.providerIdentifier ===
                                    "google-drive"
                                    ? "bg-blue-600/10 text-blue-500"
                                    : integration.provider === "dropbox" ||
                                        integration.providerIdentifier ===
                                          "dropbox"
                                      ? "bg-indigo-600/10 text-indigo-500"
                                      : "bg-gray-800 text-gray-400"
                                }`}
                              >
                                <HardDrive size={24} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-white text-lg truncate">
                                  {integration.providerName ||
                                    (integration.provider === "google-drive" ||
                                    integration.provider === "google" ||
                                    integration.providerIdentifier ===
                                      "google-drive"
                                      ? "Google Drive"
                                      : "Dropbox")}
                                </h4>
                                <p className="text-sm text-gray-500 truncate">
                                  {integration.accountEmail ||
                                    "Connected Account"}
                                </p>
                              </div>
                              <ArrowRight
                                size={20}
                                className="ml-auto text-gray-600 group-hover:text-white transition-colors flex-shrink-0"
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center bg-[#111] p-8 rounded-xl border border-gray-800 max-w-md">
                          <p className="text-gray-300 mb-2">
                            No storage providers connected.
                          </p>
                          <p className="text-sm text-gray-500">
                            Please connect Google Drive or Dropbox in Settings.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "upload" && (
                <div className="p-6 h-full flex items-center justify-center">
                  <div className="text-center max-w-md w-full">
                    <div className="relative group cursor-pointer">
                      <input
                        type="file"
                        accept="video/*,image/*"
                        onChange={handleVideoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="border-2 border-dashed border-gray-700 rounded-2xl p-12 bg-[#111] group-hover:border-blue-500 group-hover:bg-blue-500/5 transition-all duration-300">
                        <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-500/20 transition-colors">
                          <Upload
                            size={40}
                            className="text-gray-400 group-hover:text-blue-500 transition-colors"
                          />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Upload Media
                        </h3>
                        <p className="text-gray-500 mb-6">
                          Drag and drop or click to browse
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-sm font-medium text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <FileVideo size={16} />
                          Select File
                        </div>
                        <p className="mt-4 text-xs text-gray-600">
                          Supports images (JPG, PNG, GIF) and videos (MP4, MOV,
                          AVI) up to 500MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isScheduling && (
          <div className="p-6 border-t border-gray-800 bg-[#0a0a0a]">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {scheduledDate && scheduledTime ? (
                  <span className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-500" />
                    Scheduled for{" "}
                    <span className="text-white font-medium">
                      {formatDisplayDateTime()}
                    </span>
                    <button
                      onClick={clearScheduledTime}
                      className="ml-2 text-red-400 hover:text-red-300 text-xs"
                    >
                      (Clear)
                    </button>
                  </span>
                ) : (
                  /* Show validation hints when button would be disabled */
                  <span className="flex items-center gap-2 text-amber-500">
                    {selectedPlatforms.length === 0 && (
                      <>
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
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>
                          Select at least one social account to schedule
                        </span>
                      </>
                    )}
                    {selectedPlatforms.length > 0 && !postContent.trim() && (
                      <>
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
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>Add a caption to your post</span>
                      </>
                    )}
                    {selectedPlatforms.length > 0 &&
                      postContent.trim() &&
                      (!scheduledDate || !scheduledTime) && (
                        <>
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
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span>Select a date and time</span>
                        </>
                      )}
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
                  disabled={
                    selectedPlatforms.length === 0 ||
                    !postContent.trim() ||
                    !scheduledDate ||
                    !scheduledTime
                  }
                  className="px-6 py-2 text-sm font-medium text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40"
                >
                  {mode === "edit"
                    ? "Update Post"
                    : mode === "duplicate"
                      ? "Duplicate Post"
                      : "Schedule Post"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
