import { useState, useEffect } from 'react';
import { TrendingUp, Users, Eye, Heart, MessageCircle, Share2, Calendar, Filter, Download, BarChart } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { api, AggregatedAnalyticsResponse } from '../lib/api';
import { toast } from 'sonner';

interface DateRange {
  start: string;
  end: string;
}

interface FilterOptions {
  platforms: string[];
  metrics: string[];
  dateRange: DateRange;
  comparisonPeriod?: 'previous_period' | 'same_period_last_year';
}

export function EnhancedAnalyticsView() {
  const { integrations, loading: integrationsLoading } = useApp();
  const [analytics, setAnalytics] = useState<AggregatedAnalyticsResponse | null>(null);
  const [comparisonAnalytics, setComparisonAnalytics] = useState<AggregatedAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    platforms: [],
    metrics: [],
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    comparisonPeriod: 'previous_period'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Fetch analytics when filters change
  useEffect(() => {
    fetchAggregatedAnalytics();
    if (showComparison) {
      fetchComparisonAnalytics();
    }
  }, [filters, showComparison]);

  const fetchAggregatedAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.getAggregatedAnalytics({
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        platforms: filters.platforms.length > 0 ? filters.platforms : undefined,
        metrics: filters.metrics.length > 0 ? filters.metrics : undefined,
      });
      setAnalytics(data);
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      toast.error(error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisonAnalytics = async () => {
    if (!filters.comparisonPeriod) return;
    
    setLoading(true);
    try {
      let comparisonStartDate, comparisonEndDate;
      
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      
      if (filters.comparisonPeriod === 'previous_period') {
        // Calculate previous period
        const periodLength = endDate.getTime() - startDate.getTime();
        comparisonEndDate = new Date(startDate.getTime() - 1);
        comparisonStartDate = new Date(comparisonEndDate.getTime() - periodLength);
      } else {
        // Same period last year
        comparisonStartDate = new Date(startDate);
        comparisonStartDate.setFullYear(startDate.getFullYear() - 1);
        comparisonEndDate = new Date(endDate);
        comparisonEndDate.setFullYear(endDate.getFullYear() - 1);
      }
      
      const data = await api.getAggregatedAnalytics({
        startDate: comparisonStartDate.toISOString().split('T')[0],
        endDate: comparisonEndDate.toISOString().split('T')[0],
        platforms: filters.platforms.length > 0 ? filters.platforms : undefined,
        metrics: filters.metrics.length > 0 ? filters.metrics : undefined,
      });
      setComparisonAnalytics(data);
    } catch (error: any) {
      console.error('Failed to fetch comparison analytics:', error);
      toast.error(error.message || 'Failed to load comparison analytics');
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

  const calculateComparisonChange = (currentTotal: number, previousTotal: number) => {
    if (previousTotal === 0) return 0;
    return ((currentTotal - previousTotal) / previousTotal) * 100;
  };

  const togglePlatformFilter = (platformId: string) => {
    setFilters(prev => {
      const newPlatforms = prev.platforms.includes(platformId)
        ? prev.platforms.filter(id => id !== platformId)
        : [...prev.platforms, platformId];
      
      return {
        ...prev,
        platforms: newPlatforms
      };
    });
  };

  const toggleMetricFilter = (metric: string) => {
    setFilters(prev => {
      const newMetrics = prev.metrics.includes(metric)
        ? prev.metrics.filter(m => m !== metric)
        : [...prev.metrics, metric];
      
      return {
        ...prev,
        metrics: newMetrics
      };
    });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const handleComparisonPeriodChange = (period: 'previous_period' | 'same_period_last_year') => {
    setFilters(prev => ({
      ...prev,
      comparisonPeriod: period
    }));
  };

  const exportToCSV = () => {
    if (!analytics || !analytics.data || analytics.data.length === 0) {
      toast.error('No analytics data to export');
      return;
    }

    // Create CSV content
    let csvContent = 'Platform,Metric,Date,Value\n';
    
    analytics.data.forEach(analytic => {
      const platformName = analytic.integration.name;
      
      analytic.analytics.forEach(metric => {
        metric.data.forEach(point => {
          csvContent += `"${platformName}","${metric.label}","${point.date}",${point.total}\n`;
        });
      });
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Analytics exported successfully');
  };

  if (integrationsLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-white text-3xl font-semibold mb-8">Enhanced Analytics</h1>
        <div className="space-y-6">
          {/* Shimmer for metrics grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#0a0a0a] rounded-xl border border-gray-800/50 p-6">
                <div className="animate-pulse bg-gray-800 rounded-lg h-24" />
              </div>
            ))}
          </div>
          
          {/* Shimmer for charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-[#0a0a0a] rounded-xl border border-gray-800/50 p-6">
                <div className="animate-pulse bg-gray-800 rounded-lg h-48" />
              </div>
            ))}
          </div>
        </div>
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
        <h1 className="text-white text-3xl font-semibold">Enhanced Analytics</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg border border-gray-800/50 hover:border-gray-700 transition-colors"
          >
            <Filter size={16} />
            Filters
          </button>
          <button 
            onClick={() => setShowComparison(!showComparison)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showComparison 
                ? 'bg-white text-black border-white' 
                : 'bg-[#1a1a1a] text-white border-gray-800/50 hover:border-gray-700'
            }`}
          >
            <BarChart size={16} />
            Compare
          </button>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg border border-gray-800/50 hover:border-gray-700 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-[#0a0a0a] rounded-xl border border-gray-800/50 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Platform Filter */}
            <div>
              <h3 className="text-white font-medium mb-3">Platforms</h3>
              <div className="space-y-2">
                {integrations.map(integration => (
                  <label key={integration.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.platforms.includes(integration.id)}
                      onChange={() => togglePlatformFilter(integration.id)}
                      className="rounded bg-[#1a1a1a] border-gray-800/50 text-white focus:ring-white"
                    />
                    <img
                      src={integration.picture}
                      alt={integration.name}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-gray-300 text-sm">{integration.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <h3 className="text-white font-medium mb-3">Date Range</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white rounded-lg px-3 py-2 border border-gray-800/50 focus:border-gray-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white rounded-lg px-3 py-2 border border-gray-800/50 focus:border-gray-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Metrics Filter */}
            <div>
              <h3 className="text-white font-medium mb-3">Metrics</h3>
              <div className="space-y-2">
                {['Views', 'Likes', 'Comments', 'Shares', 'Followers'].map(metric => (
                  <label key={metric} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.metrics.includes(metric)}
                      onChange={() => toggleMetricFilter(metric)}
                      className="rounded bg-[#1a1a1a] border-gray-800/50 text-white focus:ring-white"
                    />
                    <span className="text-gray-300 text-sm">{metric}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Comparison Period */}
            {showComparison && (
              <div>
                <h3 className="text-white font-medium mb-3">Comparison</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="comparison"
                      checked={filters.comparisonPeriod === 'previous_period'}
                      onChange={() => handleComparisonPeriodChange('previous_period')}
                      className="rounded bg-[#1a1a1a] border-gray-800/50 text-white focus:ring-white"
                    />
                    <span className="text-gray-300 text-sm">Previous period</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="comparison"
                      checked={filters.comparisonPeriod === 'same_period_last_year'}
                      onChange={() => handleComparisonPeriodChange('same_period_last_year')}
                      className="rounded bg-[#1a1a1a] border-gray-800/50 text-white focus:ring-white"
                    />
                    <span className="text-gray-300 text-sm">Same period last year</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics content */}
      {loading ? (
        <div className="space-y-6">
          {/* Loading skeleton for metrics grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#0a0a0a] rounded-xl border border-gray-800/50 p-6">
                <div className="animate-pulse bg-gray-800 rounded-lg h-24" />
              </div>
            ))}
          </div>
          
          {/* Loading skeleton for charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-[#0a0a0a] rounded-xl border border-gray-800/50 p-6">
                <div className="animate-pulse bg-gray-800 rounded-lg h-48" />
              </div>
            ))}
          </div>
        </div>
      ) : analytics && analytics.data.length > 0 ? (
        <div className="space-y-6">
          {/* Metrics grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.data.flatMap(analytic => 
              analytic.analytics.map((metric, index) => {
                const Icon = getMetricIcon(metric.label);
                const total = calculateTotal(metric.data);
                const change = calculateChange(metric.data);
                const isPositive = change >= 0;
                
                // Find comparison data if available
                let comparisonChange = 0;
                if (showComparison && comparisonAnalytics) {
                  const comparisonAnalytic = comparisonAnalytics.data.find(
                    a => a.integration.id === analytic.integration.id
                  );
                  if (comparisonAnalytic) {
                    const comparisonMetric = comparisonAnalytic.analytics.find(
                      m => m.label === metric.label
                    );
                    if (comparisonMetric) {
                      const comparisonTotal = calculateTotal(comparisonMetric.data);
                      comparisonChange = calculateComparisonChange(total, comparisonTotal);
                    }
                  }
                }

                return (
                  <div
                    key={`${analytic.integration.id}-${index}`}
                    className="bg-[#0a0a0a] rounded-xl border border-gray-800/50 p-6 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                        <Icon className="text-white" size={20} />
                      </div>
                      <div className="flex flex-col items-end">
                        {change !== 0 && (
                          <div className={`flex items-center gap-1 text-xs font-medium ${
                            isPositive ? 'text-green-500' : 'text-red-500'
                          }`}>
                            <TrendingUp size={14} className={!isPositive ? 'rotate-180' : ''} />
                            {Math.abs(change).toFixed(1)}%
                          </div>
                        )}
                        {showComparison && comparisonChange !== 0 && (
                          <div className={`flex items-center gap-1 text-xs font-medium ${
                            comparisonChange >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            <span>vs prev:</span>
                            <TrendingUp size={14} className={comparisonChange < 0 ? 'rotate-180' : ''} />
                            {Math.abs(comparisonChange).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                      {total.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400 flex items-center gap-2">
                      <img 
                        src={analytic.integration.picture} 
                        alt={analytic.integration.name} 
                        className="w-4 h-4 rounded-full"
                      />
                      {metric.label}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics.data.flatMap(analytic => 
              analytic.analytics.map((metric, index) => (
                <div
                  key={`${analytic.integration.id}-${index}-chart`}
                  className="bg-[#0a0a0a] rounded-xl border border-gray-800/50 p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <img 
                      src={analytic.integration.picture} 
                      alt={analytic.integration.name} 
                      className="w-5 h-5 rounded-full"
                    />
                    <h3 className="text-white font-medium">{metric.label}</h3>
                  </div>
                  <div className="h-48 flex items-end gap-1">
                    {metric.data.slice(-30).map((point, i) => {
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
              ))
            )}
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
              {showComparison && comparisonAnalytics && (
                <span>
                  {' '}compared to{' '}
                  <span className="text-white font-medium">
                    {new Date(comparisonAnalytics.period.from).toLocaleDateString()}
                  </span>
                  {' '}to{' '}
                  <span className="text-white font-medium">
                    {new Date(comparisonAnalytics.period.to).toLocaleDateString()}
                  </span>
                </span>
              )}
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