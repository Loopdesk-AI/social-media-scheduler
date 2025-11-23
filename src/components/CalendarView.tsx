import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import PostFilters from './PostFilters';
import { useState } from 'react';
import { usePosts } from '@/context/PostsContext';
import { Post } from '@/types';

type CalendarViewProps = {
  onOpenSchedule?: () => void;
};

// Helper to group posts by date for calendar grid
const groupByDate = (posts: Post[]) => {
  const map: Record<string, Post[]> = {};
  posts.forEach((p) => {
    if (!map[p.date]) map[p.date] = [];
    map[p.date] = [...map[p.date], p];
  });
  return map;
};

export default function CalendarView({ onOpenSchedule }: CalendarViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const { posts: scheduledPosts } = usePosts();

  // E3 – Export CSV
  const exportToCSV = (posts: Array<any>) => {
    const csv = [
      ['Date', 'Time', 'Platform', 'Status', 'Content'],
      ...posts.map((p) => [
        p.date,
        p.time,
        p.platform,
        p.status || 'scheduled',
        `"${String(p.content).replace(/"/g, '""')}"`,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scheduled-posts.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // E4 – Filters
  const filteredPosts = scheduledPosts.filter((post: Post) => {
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform =
      platformFilter === 'All' ||
      post.platform.toLowerCase() === platformFilter.toLowerCase();
    const matchesStatus =
      statusFilter === 'All' ||
      post.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const postsByDate = groupByDate(filteredPosts);

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">Calendar</h1>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenSchedule && onOpenSchedule()}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>

          <Button variant="outline">
            <Upload className="h-5 w-5 mr-2" />
            Upload local video
          </Button>

          <Button variant="outline" onClick={() => exportToCSV(filteredPosts)}>
            <Download className="h-5 w-5 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* E4 Filters */}
      <PostFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        platformFilter={platformFilter}
        setPlatformFilter={setPlatformFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* FIXED: Calendar Grid Restored */}
      <div className="grid grid-cols-7 gap-3 mt-6">
        {Array.from({ length: 30 }).map((_, i) => {
          const day = `2025-11-${String(i + 1).padStart(2, '0')}`;
          const dayPosts = postsByDate[day] || [];

          return (
            <div
              key={day}
              className="border rounded-lg p-2 min-h-[120px] dark:bg-card bg-gray-100"
            >
              <div className="text-xs font-bold mb-1">{day}</div>

              {dayPosts.length === 0 ? (
                <div className="text-[10px] text-gray-400">No posts</div>
              ) : (
                <ul className="space-y-1">
                  {dayPosts.map((p, idx) => (
                    <li
                      key={idx}
                      className="text-xs p-1 rounded bg-white dark:bg-popover border"
                    >
                      <span className="font-semibold">{p.platform}</span> –{' '}
                      {p.content.slice(0, 24)}...
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
