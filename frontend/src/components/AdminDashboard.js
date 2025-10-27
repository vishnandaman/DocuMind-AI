import React, { useState, useEffect } from 'react';
import { Users, FileText, BarChart3, Settings, Shield, Trash2, Eye, Edit, Database, Server, Activity, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { documentService, analyticsService } from '../services/api';
import AnalyticsDashboard from './AnalyticsDashboard';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalDocuments: 0,
    totalQueries: 0,
    avgResponseTime: 0,
    systemHealth: 'healthy',
    lastBackup: null,
    storageUsed: '0 MB'
  });

  useEffect(() => {
    loadAdminData();
    loadSystemStats();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      const usersResponse = await documentService.getAllUsers();
      setUsers(usersResponse.users || []);
      
      const docsResponse = await documentService.getAllDocuments();
      setDocuments(docsResponse.documents || []);
      
      const analyticsResponse = await analyticsService.getAnalytics();
      setAnalytics(analyticsResponse.analytics);
      
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      const stats = await analyticsService.getAnalytics();
      if (stats.analytics) {
        setSystemStats({
          totalUsers: stats.analytics.total_users || 0,
          totalDocuments: stats.analytics.total_documents || 0,
          totalQueries: stats.analytics.total_queries || 0,
          avgResponseTime: stats.analytics.average_response_time || 0,
          systemHealth: 'healthy',
          lastBackup: new Date().toISOString(),
          storageUsed: calculateStorageUsed(documents)
        });
      }
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const calculateStorageUsed = (docs) => {
    const totalBytes = docs.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
    const mb = totalBytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user and all their data?')) {
      try {
        await documentService.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
        loadSystemStats();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentService.deleteDocument(documentId);
        setDocuments(documents.filter(doc => doc.document_id !== documentId));
        loadSystemStats();
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getHealthStatusColor = (health) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
                <p className="text-gray-600">Manage users, documents, and system settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(systemStats.systemHealth)}`}>
                <Activity className="h-4 w-4 inline mr-1" />
                System {systemStats.systemHealth}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalDocuments}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Queries</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalQueries}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.avgResponseTime.toFixed(2)}s</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">System Information</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Database className="h-4 w-4 mr-1" />
                  Storage: {systemStats.storageUsed}
                </div>
                <div className="flex items-center">
                  <Server className="h-4 w-4 mr-1" />
                  Last Backup: {formatDate(systemStats.lastBackup)}
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
                <div className="text-sm text-gray-600">Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">256</div>
                <div className="text-sm text-gray-600">Max Users</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'analytics', name: 'Analytics', icon: TrendingUp },
                { id: 'users', name: 'User Management', icon: Users },
                { id: 'documents', name: 'Document Management', icon: FileText },
                { id: 'settings', name: 'System Settings', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {users.slice(0, 5).map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <Users className="h-5 w-5 text-blue-600 mr-3" />
                            <div>
                              <p className="font-medium text-gray-900">{user.username}</p>
                              <p className="text-sm text-gray-600">Joined {formatDate(user.created_at)}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Usage</h3>
                    <div className="space-y-3">
                      {documents.slice(0, 5).map((doc) => (
                        <div key={doc.document_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-green-600 mr-3" />
                            <div>
                              <p className="font-medium text-gray-900">{doc.filename}</p>
                              <p className="text-sm text-gray-600">by {doc.user_id}</p>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600">{formatFileSize(doc.file_size)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.username}</div>
                              <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {documents.filter(doc => doc.user_id === user.username).length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Edit className="h-4 w-4" />
                            </button>
                            {user.role !== 'admin' && (
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((doc) => (
                      <tr key={doc.document_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{doc.filename}</div>
                              <div className="text-sm text-gray-500">{doc.file_type.toUpperCase()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {doc.user_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {doc.file_type.toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatFileSize(doc.file_size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(doc.upload_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteDocument(doc.document_id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                    <h3 className="text-lg font-medium text-yellow-800">System Maintenance</h3>
                  </div>
                  <p className="text-yellow-700 mt-2">Perform system maintenance tasks and configuration changes.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Database Management</h3>
                    <div className="space-y-3">
                      <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Backup Database
                      </button>
                      <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                        Optimize Database
                      </button>
                      <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700">
                        Clear Cache
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">System Configuration</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Auto-backup</span>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Email notifications</span>
                        <input type="checkbox" className="rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Maintenance mode</span>
                        <input type="checkbox" className="rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <AnalyticsDashboard />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;