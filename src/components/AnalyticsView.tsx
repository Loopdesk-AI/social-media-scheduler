import React, { useState } from 'react';
import { Calendar, Filter, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartData, audienceMetrics } from '../data/analytics';

export function AnalyticsView() {
  const [postedThroughLoopdesk, setPostedThroughLoopdesk] = useState(false);
  return <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-gray-900 dark:text-white text-3xl font-semibold">Analytics</h1>
          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-xs font-medium rounded">
            Beta
          </span>
          <span className="text-gray-600 dark:text-gray-500 text-sm">
            Currently only available for TikTok and YouTube accounts
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-800/50 rounded-lg text-gray-900 dark:text-white text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors">
            <Calendar size={16} />
            Last 7 days
          </button>
          <button className="px-4 py-2 bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-800/50 rounded-lg text-gray-900 dark:text-white text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors">
            <Filter size={16} />
            Filtering by
          </button>
        </div>
      </div>
      {/* Account Views Chart */}
      <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800/50 rounded-xl p-6 mb-6 transition-colors duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-gray-900 dark:text-white text-lg font-medium">Account views</h2>
              <Info size={16} className="text-gray-600 dark:text-gray-500" />
            </div>
            <p className="text-gray-600 dark:text-gray-500 text-sm">4 Nov 2025 - 10 Nov 2025</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={postedThroughLoopdesk} onChange={e => setPostedThroughLoopdesk(e.target.checked)} className="w-4 h-4 rounded border-gray-400 dark:border-gray-700 bg-transparent" />
            <span className="text-gray-600 dark:text-gray-400 text-sm">
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
        <h2 className="text-gray-900 dark:text-white text-xl font-medium mb-4">
          Audience insights
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {audienceMetrics.map((metric, index) => <div key={index} className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800/50 rounded-xl p-6 transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400 text-sm">{metric.label}</span>
                <Info size={16} className="text-gray-500 dark:text-gray-600" />
              </div>
              <p className="text-gray-900 dark:text-white text-3xl font-semibold">
                {metric.value}
              </p>
            </div>)}
        </div>
      </div>
    </div>;
}