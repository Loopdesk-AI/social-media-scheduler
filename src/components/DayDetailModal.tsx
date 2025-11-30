import { X, Plus, Clock } from 'lucide-react';
import { PostCard } from './PostCard';

interface DayDetailModalProps {
    date: Date;
    posts: any[];
    onClose: () => void;
    onAddPost?: () => void;
    onEditPost?: (post: any) => void;
    onDeletePost?: (postId: string) => void;
    onDuplicatePost?: (post: any) => void;
}

export function DayDetailModal({
    date,
    posts,
    onClose,
    onAddPost,
    onEditPost,
    onDeletePost,
    onDuplicatePost
}: DayDetailModalProps) {
    const sortedPosts = [...posts].sort((a, b) =>
        new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
    );

    const postsByHour = sortedPosts.reduce((acc, post) => {
        const hour = new Date(post.publishDate).getHours();
        if (!acc[hour]) acc[hour] = [];
        acc[hour].push(post);
        return acc;
    }, {} as Record<number, any[]>);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatHour = (hour: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:00 ${period}`;
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/50
                      w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatDate(date)}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {posts.length} {posts.length === 1 ? 'post' : 'posts'} scheduled
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {onAddPost && (
                            <button
                                onClick={onAddPost}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg
                           bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700
                           text-white font-medium transition-colors"
                            >
                                <Plus size={18} />
                                Add Post
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800/50
                         hover:bg-gray-300 dark:hover:bg-gray-700/50
                         text-gray-600 dark:text-gray-400
                         transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Timeline View */}
                <div className="flex-1 overflow-y-auto p-6">
                    {sortedPosts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <Clock size={48} className="text-gray-400 dark:text-gray-600 mb-4" />
                            <p className="text-gray-600 dark:text-gray-400 text-lg">
                                No posts scheduled for this day
                            </p>
                            {onAddPost && (
                                <button
                                    onClick={onAddPost}
                                    className="mt-4 px-6 py-3 rounded-lg
                             bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700
                             text-white font-medium transition-colors"
                                >
                                    Schedule a Post
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(postsByHour)
                                .sort(([a], [b]) => Number(a) - Number(b))
                                .map(([hour, hourPosts]) => (
                                    <div key={hour} className="relative">
                                        {/* Hour Label */}
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full
                                      bg-gray-200 dark:bg-gray-800/50
                                      border border-gray-300 dark:border-gray-700/50">
                                                <Clock size={14} className="text-blue-600 dark:text-blue-400" />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {formatHour(Number(hour))}
                                                </span>
                                            </div>
                                            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700/50" />
                                        </div>

                                        {/* Posts for this hour */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-8">
                                            {hourPosts.map((post: any) => (
                                                <PostCard
                                                    key={post.id}
                                                    post={post}
                                                    onEdit={onEditPost}
                                                    onDelete={onDeletePost}
                                                    onDuplicate={onDuplicatePost}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800/50 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex gap-6 text-sm">
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Total Posts:</span>
                            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                {posts.length}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Platforms:</span>
                            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                {new Set(posts.map(p => p.integration.providerIdentifier)).size}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Published:</span>
                            <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                                {posts.filter(p => p.state === 'PUBLISHED').length}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">Queued:</span>
                            <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">
                                {posts.filter(p => p.state === 'QUEUE').length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
