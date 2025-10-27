import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  MessageSquare, 
  Upload, 
  Brain, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { documentService } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    recentUploads: 0,
    totalQueries: 0,
    avgResponseTime: 0
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getDocuments();
      setDocuments(response.documents || []);
      
      // Calculate stats
      setStats({
        totalDocuments: response.documents?.length || 0,
        recentUploads: response.documents?.filter(doc => 
          new Date(doc.upload_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length || 0,
        totalQueries: Math.floor(Math.random() * 100) + 50, // Mock data
        avgResponseTime: Math.floor(Math.random() * 2) + 1 // Mock data
      });
    } catch (error) {
      toast.error('Failed to fetch documents');
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case '.pdf':
        return '📄';
      case '.docx':
        return '📝';
      case '.xlsx':
        return '📊';
      case '.txt':
        return '📃';
      default:
        return '📄';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to DocuMind
          </h1>
          <p className="text-gray-600">
            Your intelligent document assistant is ready to help you find information quickly and accurately.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent Uploads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentUploads}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-50 rounded-lg">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Queries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalQueries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-50 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}s</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/documents"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700">Upload Documents</span>
              </Link>
              <Link
                to="/chat"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="h-5 w-5 text-green-600" />
                <span className="text-gray-700">Start Chatting</span>
              </Link>
              <Link
                to="/documents"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="h-5 w-5 text-purple-600" />
                <span className="text-gray-700">Manage Documents</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner"></div>
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-3">
                {documents.slice(0, 3).map((doc) => (
                  <div key={doc.document_id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                    <span className="text-2xl">{getFileIcon(doc.file_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(doc.upload_date)}
                      </p>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No documents uploaded yet</p>
                <Link
                  to="/documents"
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  Upload your first document
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Documents</h3>
              <Link
                to="/documents"
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner"></div>
              </div>
            ) : documents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Upload Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.slice(0, 5).map((doc) => (
                      <tr key={doc.document_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{getFileIcon(doc.file_type)}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {doc.filename}
                              </div>
                              <div className="text-sm text-gray-500">
                                {doc.chunk_count} chunks
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {doc.file_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(doc.upload_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Indexed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                <p className="text-gray-500 mb-6">
                  Upload your first document to start using DocuMind's intelligent search capabilities.
                </p>
                <Link
                  to="/documents"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
