import React, { useState, useEffect } from 'react';
import { FileSearch, X, Loader, CheckCircle, BarChart3, FileText, Calendar, HardDrive } from 'lucide-react';
import { documentService } from '../services/api';
import toast from 'react-hot-toast';

const DocumentSummaryModal = ({ document, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [error, setError] = useState(null);

  const generateSummary = async () => {
    if (!document) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await documentService.summarizeDocument(document.document_id);
      setSummaryData(response.summary);
      toast.success('Document summary generated successfully!');
    } catch (error) {
      setError('Failed to generate document summary. Please try again.');
      toast.error('Failed to generate document summary');
      console.error('Error generating summary:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate summary when modal opens
  useEffect(() => {
    if (isOpen && document && !summaryData && !loading) {
      generateSummary();
    }
  }, [isOpen, document]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSummaryData(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

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

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileSearch className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Document Summary</h2>
              <p className="text-sm text-gray-600">{document.filename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="text-center py-12">
              <Loader className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Generating AI Summary
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Our advanced AI is analyzing your document and creating a comprehensive summary. This may take a few moments...
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Summary Generation Failed
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {error}
              </p>
              <button
                onClick={generateSummary}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <FileSearch className="h-5 w-5 mr-2" />
                Try Again
              </button>
            </div>
          ) : !summaryData ? (
            <div className="text-center py-12">
              <FileSearch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Generate AI Summary
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get an intelligent summary of your document including key points, statistics, and content analysis.
              </p>
              <button
                onClick={generateSummary}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 mr-2 animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <FileSearch className="h-5 w-5 mr-2" />
                    Generate Summary
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Document Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Document Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Uploaded: {formatDate(document.upload_date)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HardDrive className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Size: {formatFileSize(document.file_size)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Type: {document.file_type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              {summaryData.executive_summary && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Executive Summary
                  </h3>
                  <p className="text-blue-800 leading-relaxed">
                    {summaryData.executive_summary}
                  </p>
                </div>
              )}

              {/* Key Points */}
              {summaryData.key_points && summaryData.key_points.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                    <FileSearch className="h-5 w-5 mr-2" />
                    Key Points
                  </h3>
                  <ul className="space-y-2">
                    {summaryData.key_points.map((point, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-green-600 font-semibold mt-1">•</span>
                        <span className="text-green-800">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Statistics */}
              {summaryData.statistics && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Document Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {summaryData.statistics.word_count || 0}
                      </div>
                      <div className="text-sm text-purple-800">Words</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {summaryData.statistics.line_count || 0}
                      </div>
                      <div className="text-sm text-purple-800">Lines</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {summaryData.statistics.email_count || 0}
                      </div>
                      <div className="text-sm text-purple-800">Emails</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {summaryData.statistics.phone_count || 0}
                      </div>
                      <div className="text-sm text-purple-800">Phone Numbers</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Analysis */}
              {summaryData.content_analysis && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Content Analysis
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-orange-800">Document Type:</span>
                      <span className="ml-2 text-orange-700">
                        {summaryData.content_analysis.document_type || 'Unknown'}
                      </span>
                    </div>
                    {summaryData.content_analysis.content_categories && (
                      <div>
                        <span className="font-medium text-orange-800">Categories:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {summaryData.content_analysis.content_categories.map((category, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-orange-200 text-orange-800 rounded-full text-sm"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {summaryData.content_analysis.data_types && (
                      <div>
                        <span className="font-medium text-orange-800">Data Types:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {summaryData.content_analysis.data_types.map((type, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-orange-200 text-orange-800 rounded-full text-sm"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Overview */}
              {summaryData.quick_overview && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FileSearch className="h-5 w-5 mr-2" />
                    Quick Overview
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {summaryData.quick_overview}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            {summaryData && (
              <button
                onClick={generateSummary}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin inline" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <FileSearch className="h-4 w-4 mr-2 inline" />
                    Regenerate
                  </>
                )}
              </button>
            )}
          </div>
          {summaryData && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(summaryData, null, 2));
                toast.success('Summary copied to clipboard!');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Copy Summary
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentSummaryModal;
