import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';

export default function CalendarView() {
  const exportToCSV = () => {
    const posts = [
      { date: '2025-11-23', time: '12:00 PM', platform: 'Twitter', content: 'Hello World!' },
      { date: '2025-11-24', time: '03:00 PM', platform: 'LinkedIn', content: 'Check our new promo!' },
      { date: '2025-11-25', time: '08:30 PM', platform: 'Instagram', content: 'Behind the scenes at...' },
    ];

    const csv = [
      ['Date', 'Time', 'Platform', 'Content'],
      ...posts.map(p => [p.date, p.time, p.platform, `"${p.content.replace(/"/g, '""')}"`])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scheduled-posts.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
          <Button variant="outline">
            <Upload className="h-5 w-5 mr-2" />
            Upload local video
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-5 w-5 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-96 flex items-center justify-center text-gray-500">
        Calendar grid coming soon...
      </div>
    </div>
  );
}