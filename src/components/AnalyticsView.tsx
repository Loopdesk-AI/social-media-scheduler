import { Calendar, Filter, Info } from 'lucide-react';
import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { audienceMetrics, chartData } from '../data/analytics';

export function AnalyticsView() {
  const [postedThroughLoopdesk, setPostedThroughLoopdesk] = useState(false);
  return <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Analytics</h1>
          <span className="px-2 py-1 text-xs font-medium rounded" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
            Beta
          </span>
          <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Currently only available for TikTok and YouTube accounts
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border rounded-lg text-sm flex items-center gap-2 transition-colors" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--card-foreground))' }}>
            <Calendar size={16} />
            Last 7 days
          </button>
          <button className="px-4 py-2 border rounded-lg text-sm flex items-center gap-2 transition-colors" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--card-foreground))' }}>
            <Filter size={16} />
            Filtering by
          </button>
        </div>
      </div>
      {/* Account Views Chart */}
      <div className="border rounded-xl p-6 mb-6" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>Account views</h2>
              <Info size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
            </div>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>4 Nov 2025 - 10 Nov 2025</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={postedThroughLoopdesk} onChange={e => setPostedThroughLoopdesk(e.target.checked)} className="w-4 h-4 rounded border bg-transparent" style={{ borderColor: 'hsl(var(--border))' }} />
            <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Posted through Loopdesk
            </span>
          </label>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey="date" stroke="#666" tick={{
              fill: '#666',
              fontSize: 12
            }} />
              <YAxis stroke="#666" tick={{
              fill: '#666',
              fontSize: 12
            }} />
              <Tooltip contentStyle={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #333',
              borderRadius: '8px'
            }} labelStyle={{
              color: '#fff'
            }} />
              <Line type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Audience Insights */}
      <div>
        <h2 className="text-xl font-medium mb-4" style={{ color: 'hsl(var(--foreground))' }}>
          Audience insights
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {audienceMetrics.map((metric, index) => <div key={index} className="border rounded-xl p-6" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{metric.label}</span>
                <Info size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
              </div>
              <p className="text-3xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>
                {metric.value}
              </p>
            </div>)}
        </div>
      </div>
    </div>;
}