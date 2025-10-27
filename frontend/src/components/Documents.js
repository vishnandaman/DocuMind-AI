import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  X,
  Plus,
  Search,
  Filter,
  FileSearch
} from 'lucide-react';
import { documentService } from '../services/api';
import toast from 'react-hot-toast';
import DocumentSummaryModal from './DocumentSummaryModal';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedDocumentForSummary, setSelectedDocumentForSummary] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getDocuments();
      setDocuments(response.documents || []);
    } catch (error) {
      toast.error('Failed to fetch documents');
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const uploadPromises = acceptedFiles.map(async (file) => {
      try {
        const response = await documentService.uploadDocument(file);
        return { success: true, file: file.name, response };
      } catch (error) {
        return { success: false, file: file.name, error: error.message };
      }
    });

    const results = await Promise.all(uploadPromises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length > 0) {
      toast.success(`${successful.length} document(s) uploaded successfully`);
      await fetchDocuments();
    }

    if (failed.length > 0) {
      toast.error(`${failed.length} document(s) failed to upload`);
    }

    setUploading(false);
    setShowUploadModal(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    multiple: true
  });

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentService.deleteDocument(documentId);
      toast.success('Document deleted successfully');
      await fetchDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
      console.error('Error deleting document:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedDocuments.length} document(s)?`)) return;

    try {
      const deletePromises = selectedDocuments.map(id => documentService.deleteDocument(id));
      await Promise.all(deletePromises);
      toast.success(`${selectedDocuments.length} document(s) deleted successfully`);
      setSelectedDocuments([]);
      await fetchDocuments();
    } catch (error) {
      toast.error('Failed to delete documents');
      console.error('Error deleting documents:', error);
    }
  };

  const handleSelectDocument = (documentId) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.document_id));
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
      case '.csv':
        return '📈';
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

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.file_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const fileTypes = [...new Set(documents.map(doc => doc.file_type))];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Document Management
              </h1>
              <p className="text-gray-600">
                Upload, organize, and manage your documents for intelligent search.
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Upload Documents
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  {fileTypes.map(type => (
                    <option key={type} value={type}>
                      {type.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              {selectedDocuments.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedDocuments.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Documents ({filteredDocuments.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">Select All</span>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <div key={doc.document_id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(doc.document_id)}
                      onChange={() => handleSelectDocument(doc.document_id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 flex items-center space-x-4">
                      <span className="text-3xl">{getFileIcon(doc.file_type)}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-medium text-gray-900 truncate">
                          {doc.filename}
                        </h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {doc.file_type.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {doc.chunk_count} chunks
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(doc.upload_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Indexed
                      </span>
                      <button
                        onClick={() => {
                          setSelectedDocumentForSummary(doc);
                          setShowSummaryModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Generate AI Summary"
                      >
                        <FileSearch className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.document_id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' ? 'No documents found' : 'No documents yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Upload your first document to start using DocuMind.'
              }
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload Documents
            </button>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="p-6">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  {isDragActive ? (
                    <p className="text-lg font-medium text-blue-600">
                      Drop the files here...
                    </p>
                  ) : (
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Drag & drop files here, or click to select
                      </p>
                      <p className="text-gray-500 mb-4">
                        Supports PDF, DOCX, TXT, XLSX, and CSV files
                      </p>
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Choose Files
                      </button>
                    </div>
                  )}
                </div>
                {uploading && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    <span className="text-gray-600">Uploading documents...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Document Summary Modal */}
      <DocumentSummaryModal
        document={selectedDocumentForSummary}
        isOpen={showSummaryModal}
        onClose={() => {
          setShowSummaryModal(false);
          setSelectedDocumentForSummary(null);
        }}
      />
    </div>
  );
};

export default Documents;
