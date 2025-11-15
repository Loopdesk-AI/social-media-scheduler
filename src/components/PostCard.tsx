import { Clock, Trash2 } from 'lucide-react';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
}

const PLATFORM_ICONS: Record<string, string> = {
  x: '𝕏',
  linkedin: '💼',
  facebook: '📘',
  instagram: '📸',
  tiktok: '🎵',
  youtube: '📹',
};

const STATUS_STYLES: Record<Post['status'], { bg: string; text: string; label: string }> = {
  draft: {
    bg: 'bg-gray-100 dark:bg-gray-800/50',
    text: 'text-gray-600 dark:text-gray-400',
    label: 'Draft',
  },
  scheduled: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    label: 'Scheduled',
  },
  published: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    label: 'Published',
  },
  failed: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    label: 'Failed',
  },
};

export function PostCard({ post, onDelete }: PostCardProps) {
  const statusStyle = STATUS_STYLES[post.status];
  const time = post.scheduledDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="group p-2 bg-white dark:bg-[#1a1a1a] rounded-md border border-gray-200 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-colors mb-1">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1">
          <Clock size={12} className="text-gray-400 dark:text-gray-600 flex-shrink-0" />
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {time}
          </span>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(post.id)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-opacity"
            title="Delete post"
          >
            <Trash2 size={12} className="text-red-500" />
          </button>
        )}
      </div>

      <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 mb-2 leading-relaxed">
        {post.content}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {post.platforms.slice(0, 3).map((platform) => (
            <span
              key={platform}
              className="text-xs"
              title={platform}
            >
              {PLATFORM_ICONS[platform] || '📱'}
            </span>
          ))}
          {post.platforms.length > 3 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{post.platforms.length - 3}
            </span>
          )}
        </div>

        <span
          className={`px-2 py-0.5 ${statusStyle.bg} ${statusStyle.text} text-xs rounded-full font-medium`}
        >
          {statusStyle.label}
        </span>
      </div>
    </div>
  );
}

