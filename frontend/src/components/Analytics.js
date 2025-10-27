import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, FileText, Activity, Users, Calendar } from 'lucide-react';
import { analyticsService } from '../services/api';
import UserAnalytics from './UserAnalytics';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsResponse, summaryResponse] = await Promise.all([
        analyticsService.getAnalytics(),
        analyticsService.getAnalyticsSummary()
      ]);
      
      setAnalytics(analyticsResponse.analytics);
      setSummary(summaryResponse.summary);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    return `${seconds.toFixed(2)}s`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Insights into your document usage and query patterns</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Queries</p>
                <p className="text-2xl font-bold text-gray-900">{summary?.total_queries || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Documents</p>
                <p className="text-2xl font-bold text-gray-900">{summary?.total_documents || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{summary?.avg_response_time || '0.00s'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Most Active Hour</p>
                <p className="text-2xl font-bold text-gray-900">{summary?.most_active_hour || 0}:00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'visualization', label: 'Charts', icon: TrendingUp },
                { id: 'queries', label: 'Query Analysis', icon: FileText },
                { id: 'activity', label: 'Activity Patterns', icon: Activity },
                { id: 'documents', label: 'Document Usage', icon: Users }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Usage Overview</h3>
                
                {/* Query Trends */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Query Trends (Last 7 Days)</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {analytics?.query_trends?.length > 0 ? (
                      <div className="space-y-2">
                        {analytics.query_trends.map((trend, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{formatDate(trend.date)}</span>
                            <div className="flex items-center">
                              <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${(trend.count / Math.max(...analytics.query_trends.map(t => t.count))) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{trend.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No query data available</p>
                    )}
                  </div>
                </div>

                {/* Top Query Words */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Most Common Query Words</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {summary?.top_query_words?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {summary.top_query_words.map((word, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {word.word} ({word.count})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No query words data available</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Queries Tab */}
            {activeTab === 'queries' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Query Analysis</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Query Statistics</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Queries:</span>
                        <span className="font-medium">{analytics?.total_queries || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average Response Time:</span>
                        <span className="font-medium">{formatTime(analytics?.average_response_time || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Document Accesses:</span>
                        <span className="font-medium">{analytics?.total_document_accesses || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Recent Queries</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {analytics?.recent_activity?.length > 0 ? (
                        <div className="space-y-2">
                          {analytics.recent_activity.slice(0, 5).map((activity, index) => (
                            <div key={index} className="text-sm">
                              <span className="text-gray-600">{formatDate(activity.timestamp)}</span>
                              <span className="ml-2 text-gray-900">{activity.query || activity.action}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No recent activity</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Activity Patterns</h3>
                
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Activity by Hour</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {analytics?.activity_by_hour?.length > 0 ? (
                      <div className="grid grid-cols-6 gap-2">
                        {analytics.activity_by_hour.map((hour, index) => (
                          <div key={index} className="text-center">
                            <div className="text-xs text-gray-600 mb-1">{hour.hour}:00</div>
                            <div className="bg-blue-200 rounded h-16 flex items-end justify-center">
                              <div 
                                className="bg-blue-600 rounded-t w-full"
                                style={{ height: `${(hour.count / Math.max(...analytics.activity_by_hour.map(h => h.count))) * 100}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{hour.count}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No activity data available</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Document Usage</h3>
                
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Most Accessed Documents</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {analytics?.document_usage?.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.document_usage.map((doc, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{doc.document_id}</span>
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${(doc.access_count / Math.max(...analytics.document_usage.map(d => d.access_count))) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{doc.access_count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No document usage data available</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Visualization Tab */}
            {activeTab === 'visualization' && (
              <div className="space-y-6">
                <UserAnalytics />
              </div>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={loadAnalytics}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
