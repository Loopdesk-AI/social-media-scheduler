import { Search, X, Filter } from 'lucide-react';
import { usePosts } from '../contexts/PostsContext';
import { PostStatus } from '../types';

export function PostsFilterBar() {
  const {
    searchQuery,
    setSearchQuery,
    platformFilter,
    setPlatformFilter,
    statusFilter,
    setStatusFilter,
    filteredPosts,
    posts,
  } = usePosts();

  const hasActiveFilters = searchQuery || platformFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setPlatformFilter('all');
    setStatusFilter('all');
  };

  const platforms = [
    { value: 'all', label: 'All Platforms', emoji: '' },
    { value: 'x', label: 'X (Twitter)', emoji: '' },
    { value: 'linkedin', label: 'LinkedIn', emoji: '' },
    { value: 'facebook', label: 'Facebook', emoji: '' },
    { value: 'instagram', label: 'Instagram', emoji: '' },
    { value: 'tiktok', label: 'TikTok', emoji: '' },
    { value: 'youtube', label: 'YouTube', emoji: '' },
  ];

  const statuses: { value: PostStatus | 'all'; label: string; color: string }[] = [
    { value: 'all', label: 'All Status', color: 'text-gray-600 dark:text-gray-400' },
    { value: 'draft', label: 'Draft', color: 'text-gray-500 dark:text-gray-400' },
    { value: 'scheduled', label: 'Scheduled', color: 'text-blue-600 dark:text-blue-400' },
    { value: 'published', label: 'Published', color: 'text-green-600 dark:text-green-400' },
    { value: 'failed', label: 'Failed', color: 'text-red-600 dark:text-red-400' },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search Input */}
        <div className="flex-1 min-w-[300px] relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts by content..."
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-800/50 focus:outline-none focus:border-gray-400 dark:focus:border-gray-700 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Platform Filter */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500 dark:text-gray-400" />
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-800/50 focus:outline-none focus:border-gray-400 dark:focus:border-gray-700 transition-colors cursor-pointer"
          >
            {platforms.map((platform) => (
              <option key={platform.value} value={platform.value}>
                {platform.emoji} {platform.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PostStatus | 'all')}
          className="px-4 py-2.5 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-800/50 focus:outline-none focus:border-gray-400 dark:focus:border-gray-700 transition-colors cursor-pointer"
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          {filteredPosts.length === posts.length ? (
            <>
              Showing <span className="font-semibold text-gray-900 dark:text-white">{posts.length}</span> post{posts.length !== 1 ? 's' : ''}
            </>
          ) : (
            <>
              Found <span className="font-semibold text-gray-900 dark:text-white">{filteredPosts.length}</span> of{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{posts.length}</span> post{posts.length !== 1 ? 's' : ''}
            </>
          )}
        </span>

        {/* Active Filters Tags */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            {searchQuery && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                Search: "{searchQuery}"
              </span>
            )}
            {platformFilter !== 'all' && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                Platform: {platforms.find((p) => p.value === platformFilter)?.label}
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                Status: {statusFilter}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg border border-gray-200 dark:border-gray-800/50">
          <div className="text-gray-400 dark:text-gray-500 mb-2">
            <Search size={48} className="mx-auto mb-3 opacity-50" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No posts found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {hasActiveFilters
              ? 'Try adjusting your search or filters'
              : 'No posts have been created yet'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

