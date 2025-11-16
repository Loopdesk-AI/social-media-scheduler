import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Eye, Heart, MessageCircle, Share2, Calendar } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { api, AnalyticsResponse } from '../lib/api';
import { toast } from 'sonner';

export function AnalyticsView() {
  const { integrations, loading: integrationsLoading } = useApp();
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(30);

  // Auto-select first integration
  useEffect(() => {
    if (integrations.length > 0 && !selectedIntegration) {
      setSelectedIntegration(integrations[0].id);
    }
  }, [integrations]);

  // Fetch analytics when integration or period changes
  useEffect(() => {
    if (selectedIntegration) {
      fetchAnalytics();
    }
  }, [selectedIntegration, period]);

  const fetchAnalytics = async () => {
    if (!selectedIntegration) return;

    setLoading(true);
    try {
      const data = await api.getAnalytics(selectedIntegration, period);
      setAnalytics(data);
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      toast.error(error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getMetricIcon = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('follower') || lower.includes('subscriber')) return Users;
    if (lower.includes('reach') || lower.includes('view') || lower.includes('impression')) return Eye;
    if (lower.includes('like') || lower.includes('favorite')) return Heart;
    if (lower.includes('comment') || lower.includes('repl')) return MessageCircle;
    if (lower.includes('share') || lower.includes('retweet')) return Share2;
    return TrendingUp;
  };

  const calculateTotal = (data: Array<{ total: number; date: string }>) => {
    return data.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateChange = (data: Array<{ total: number; date: string }>) => {
    if (data.length < 2) return 0;
    const recent = data.slice(-7).reduce((sum, item) => sum + item.total, 0);
    const previous = data.slice(-14, -7).reduce((sum, item) => sum + item.total, 0);
    if (previous === 0) return 0;
    return ((recent - previous) / previous) * 100;
  };

  if (integrationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (integrations.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-white text-3xl font-semibold mb-8">Analytics</h1>
        <div className="bg-[#0a0a0a] rounded-xl border border-gray-800/50 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/30 flex items-center justify-center">
            <TrendingUp className="text-gray-600" size={32} />
          </div>
          <h3 className="text-white text-lg font-medium mb-2">No Connected Accounts</h3>
          <p className="text-gray-400 text-sm">
            Connect a social media account to view analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-white text-3xl font-semibold">Analytics</h1>
        <div className="flex gap-3">
          {/* Period selector */}
          <div className="flex gap-2 bg-[#1a1a1a] rounded-lg p-1 border border-gray-800/50">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === days
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Integration selector */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {integrations.map((integration) => (
          <button
            key={integration.id}
            onClick={() => setSelectedIntegration(integration.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all flex-shrink-0 ${
              selectedIntegration === integration.id
                ? 'bg-white text-black border-white'
                : 'bg-[#1a1a1a] text-white border-gray-800/50 hover:border-gray-700'
            }`}
          >
            <img
              src={integration.picture}
              alt={integration.name}
              className="w-8 h-8 rounded-full"
            />
            <div className="text-left">
              <div className="font-medium text-sm">{integration.name}</div>
              <div className={`text-xs capitalize ${
                selectedIntegration === integration.id ? 'text-gray-700' : 'text-gray-400'
              }`}>
                {integration.providerIdentifier}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Analytics content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Metrics grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.analytics.map((metric, index) => {
              const Icon = getMetricIcon(metric.label);
              const total = calculateTotal(metric.data);
              const change = calculateChange(metric.data);
              const isPositive = change >= 0;

              return (
                <div
                  key={index}
                  className="bg-[#0a0a0a] rounded-xl border border-gray-800/50 p-6 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                      <Icon className="text-white" size={20} />
                    </div>
                    {change !== 0 && (
                      <div className={`flex items-center gap-1 text-xs font-medium ${
                        isPositive ? 'text-green-500' : 'text-red-500'
                      }`}>
                        <TrendingUp size={14} className={!isPositive ? 'rotate-180' : ''} />
                        {Math.abs(change).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {total.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">{metric.label}</div>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics.analytics.map((metric, index) => (
              <div
                key={index}
                className="bg-[#0a0a0a] rounded-xl border border-gray-800/50 p-6"
              >
                <h3 className="text-white font-medium mb-4">{metric.label} Over Time</h3>
                <div className="h-48 flex items-end gap-1">
                  {metric.data.slice(-period).map((point, i) => {
                    const maxValue = Math.max(...metric.data.map(d => d.total));
                    const height = maxValue > 0 ? (point.total / maxValue) * 100 : 0;
                    
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-white/10 hover:bg-white/20 rounded-t transition-all cursor-pointer group relative"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                        title={`${new Date(point.date).toLocaleDateString()}: ${point.total}`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {point.total.toLocaleString()}
                          <div className="text-gray-400 text-[10px]">
                            {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-4 text-xs text-gray-500">
                  <span>{new Date(analytics.period.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span>{new Date(analytics.period.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Period info */}
          <div className="bg-[#0a0a0a] rounded-xl border border-gray-800/50 p-4 flex items-center gap-3">
            <Calendar className="text-gray-400" size={20} />
            <div className="text-sm text-gray-400">
              Showing data from{' '}
              <span className="text-white font-medium">
                {new Date(analytics.period.from).toLocaleDateString()}
              </span>
              {' '}to{' '}
              <span className="text-white font-medium">
                {new Date(analytics.period.to).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0a0a0a] rounded-xl border border-gray-800/50 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/30 flex items-center justify-center">
            <TrendingUp className="text-gray-600" size={32} />
          </div>
          <h3 className="text-white text-lg font-medium mb-2">No Analytics Available</h3>
          <p className="text-gray-400 text-sm">
            Analytics data will appear here once available
          </p>
        </div>
      )}
    </div>
  );
}
