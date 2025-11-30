import { useState } from 'react';
import { Edit2, Trash2, Copy, ExternalLink } from 'lucide-react';

interface PostCardProps {
    post: any;
    onEdit?: (post: any) => void;
    onDelete?: (postId: string) => void;
    onDuplicate?: (post: any) => void;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent, post: any) => void;
    onDragEnd?: (e: React.DragEvent) => void;
}

export function PostCard({
    post,
    onEdit,
    onDelete,
    onDuplicate,
    draggable = false,
    onDragStart,
    onDragEnd
}: PostCardProps) {
    const [showActions, setShowActions] = useState(false);

    const getStatusColor = (state: string) => {
        switch (state) {
            case 'PUBLISHED':
                return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
            case 'QUEUE':
                return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
            case 'ERROR':
                return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
            default:
                return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30';
        }
    };

    const getStatusIcon = (state: string) => {
        switch (state) {
            case 'PUBLISHED': return '✓';
            case 'QUEUE': return '⏱';
            case 'ERROR': return '⚠';
            default: return '•';
        }
    };

    return (
        <div
            draggable={draggable}
            onDragStart={(e) => onDragStart?.(e, post)}
            onDragEnd={onDragEnd}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            className="group relative text-xs p-3 rounded-lg 
                 bg-white dark:bg-gray-800/80
                 border border-gray-200 dark:border-gray-700/50
                 hover:border-blue-400 dark:hover:border-blue-500/50
                 transition-all duration-200 cursor-pointer
                 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
            {/* Platform Icon & Time */}
            <div className="flex items-center gap-2 mb-2">
                <img
                    src={post.integration.picture}
                    alt={post.integration.name}
                    className="w-5 h-5 rounded-full ring-2 ring-gray-300 dark:ring-gray-600"
                />
                <span className="text-gray-600 dark:text-gray-400 text-[11px] font-medium">
                    {new Date(post.publishDate).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                    })}
                </span>

                {/* Status Badge */}
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(post.state)}`}>
                    {getStatusIcon(post.state)} {post.state}
                </span>
            </div>

            {/* Content Preview */}
            <div className="text-gray-900 dark:text-white font-medium line-clamp-2 mb-2 text-sm">
                {post.content}
            </div>

            {/* Quick Actions */}
            {showActions && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {post.releaseURL && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(post.releaseURL, '_blank');
                            }}
                            className="p-1.5 rounded-md bg-white dark:bg-gray-900/90 
                         border border-gray-300 dark:border-gray-700
                         hover:bg-blue-500 hover:text-white
                         transition-colors"
                            title="View post"
                        >
                            <ExternalLink size={12} />
                        </button>
                    )}
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(post);
                            }}
                            className="p-1.5 rounded-md bg-white dark:bg-gray-900/90
                         border border-gray-300 dark:border-gray-700
                         hover:bg-blue-500 hover:text-white
                         transition-colors"
                            title="Edit"
                        >
                            <Edit2 size={12} />
                        </button>
                    )}
                    {onDuplicate && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDuplicate(post);
                            }}
                            className="p-1.5 rounded-md bg-white dark:bg-gray-900/90
                         border border-gray-300 dark:border-gray-700
                         hover:bg-green-500 hover:text-white
                         transition-colors"
                            title="Duplicate"
                        >
                            <Copy size={12} />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this post?')) {
                                    onDelete(post.id);
                                }
                            }}
                            className="p-1.5 rounded-md bg-white dark:bg-gray-900/90
                         border border-gray-300 dark:border-gray-700
                         hover:bg-red-500 hover:text-white
                         transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                </div>
            )}

            {/* Error Message */}
            {post.state === 'ERROR' && post.error && (
                <div className="text-red-600 dark:text-red-400 text-[10px] mt-2 font-medium truncate">
                    {post.error}
                </div>
            )}
        </div>
    );
}
