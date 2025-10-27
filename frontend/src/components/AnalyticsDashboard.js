import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { analyticsService } from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getVisualizationData();
      setAnalyticsData(data);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center p-4">
        {error}
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center p-4">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
        <button
          onClick={loadAnalyticsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Engagement Metrics */}
      {analyticsData.userEngagement && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Queries</h3>
            <p className="text-3xl font-bold text-blue-600">
              {analyticsData.userEngagement.totalQueries || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Document Accesses</h3>
            <p className="text-3xl font-bold text-green-600">
              {analyticsData.userEngagement.totalAccesses || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Avg Response Time</h3>
            <p className="text-3xl font-bold text-orange-600">
              {analyticsData.userEngagement.avgResponseTime || 0}s
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Engagement Score</h3>
            <p className="text-3xl font-bold text-purple-600">
              {analyticsData.userEngagement.engagementScore || 0}%
            </p>
          </div>
        </div>
      )}

      {/* Query Trends Chart */}
      {analyticsData.queryTrends && analyticsData.queryTrends.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Query Trends Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.queryTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="queries" stroke="#0088FE" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Response Time Distribution */}
      {analyticsData.responseTimeDistribution && analyticsData.responseTimeDistribution.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Response Time Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.responseTimeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Document Usage */}
      {analyticsData.documentUsage && analyticsData.documentUsage.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Document Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.documentUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="document" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="accesses" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Hourly Activity */}
      {analyticsData.activityByHour && analyticsData.activityByHour.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Activity by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.activityByHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="activity" stroke="#8884D8" fill="#8884D8" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Query Types */}
      {analyticsData.queryTypes && analyticsData.queryTypes.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Query Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.queryTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, count }) => `${type}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analyticsData.queryTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Documents */}
      {analyticsData.topDocuments && analyticsData.topDocuments.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Top Documents by Access</h3>
          <div className="space-y-3">
            {analyticsData.topDocuments.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-medium">{doc.document}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{doc.accesses} accesses</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${doc.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{doc.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Rate */}
      {analyticsData.querySuccessRate && analyticsData.querySuccessRate.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Query Success Rate Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.querySuccessRate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
              <Legend />
              <Line type="monotone" dataKey="successRate" stroke="#00C49F" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
