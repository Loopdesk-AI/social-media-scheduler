import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import PostFilters from './PostFilters';
import { useState } from 'react';
import { usePosts } from '@/context/PostsContext';
import { Post } from '@/types';

type CalendarViewProps = {
  onOpenSchedule?: () => void;
};

export default function CalendarView({ onOpenSchedule }: CalendarViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const exportToCSV = (posts: Array<any>) => {
    const csv = [
      ['Date', 'Time', 'Platform', 'Status', 'Content'],
      ...posts.map((p) => [p.date, p.time, p.platform, p.status || 'scheduled', `"${String(p.content).replace(/"/g, '""')}"`]),
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

  const { posts: scheduledPosts } = usePosts();

  const filteredPosts = scheduledPosts.filter((post: Post) => {
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlatform =
      platformFilter === 'All' || post.platform.toLowerCase() === platformFilter.toLowerCase();

    const matchesStatus =
      statusFilter === 'All' || post.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onOpenSchedule) onOpenSchedule();
            }}
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

      <PostFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        platformFilter={platformFilter}
        setPlatformFilter={setPlatformFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Calendar or list area */}
      <div className="bg-gray-200 dark:bg-card border-2 border-dashed rounded-xl w-full min-h-[240px] p-4">
        {filteredPosts.length === 0 ? (
          <div className="flex items-center justify-center text-gray-500">No posts found</div>
        ) : (
          <ul className="space-y-3">
            {filteredPosts.map((p, idx) => (
              <li key={idx} className="p-3 rounded-md bg-white/60 dark:bg-popover border border-border">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{p.date} • {p.time}</div>
                  <div className="text-xs px-2 py-1 rounded bg-black/10 dark:bg-white/10">{p.platform}</div>
                </div>
                <div className="mt-2 text-sm text-foreground">{p.content}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}