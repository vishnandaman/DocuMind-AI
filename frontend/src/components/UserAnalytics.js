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

const UserAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getVisualizationData();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-600">Loading your analytics...</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center p-4 text-gray-600">
        Start using DocuMind to see your analytics!
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Your Activity</h2>
        <button
          onClick={loadAnalyticsData}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      {analyticsData.userEngagement && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-gray-600">Queries</p>
            <p className="text-lg font-bold text-blue-600">
              {analyticsData.userEngagement.totalQueries || 0}
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <p className="text-sm text-gray-600">Documents</p>
            <p className="text-lg font-bold text-green-600">
              {analyticsData.userEngagement.totalAccesses || 0}
            </p>
          </div>
          <div className="bg-orange-50 p-3 rounded">
            <p className="text-sm text-gray-600">Avg Time</p>
            <p className="text-lg font-bold text-orange-600">
              {analyticsData.userEngagement.avgResponseTime || 0}s
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-lg font-bold text-purple-600">
              {analyticsData.userEngagement.engagementScore || 0}%
            </p>
          </div>
        </div>
      )}

      {/* Query Trends */}
      {analyticsData.queryTrends && analyticsData.queryTrends.length > 0 && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-3">Your Query Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analyticsData.queryTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="queries" stroke="#0088FE" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Document Usage */}
      {analyticsData.documentUsage && analyticsData.documentUsage.length > 0 && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-3">Your Document Usage</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData.documentUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="document" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="accesses" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Query Types */}
      {analyticsData.queryTypes && analyticsData.queryTypes.length > 0 && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-3">Query Types</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={analyticsData.queryTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, count }) => `${type}: ${count}`}
                outerRadius={60}
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
    </div>
  );
};

export default UserAnalytics;
