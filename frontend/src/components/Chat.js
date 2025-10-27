import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, FileText, Copy, Check, ChevronDown, FileSearch } from 'lucide-react';
import { queryService, documentService } from '../services/api';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import DocumentSummaryModal from './DocumentSummaryModal';

const Chat = () => {
  // State management for chat functionality
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  
  // Document selection for targeted queries
  const [selectedDocument, setSelectedDocument] = useState('');
  const [documents, setDocuments] = useState([]);
  const [showDocumentDropdown, setShowDocumentDropdown] = useState(false);
  
  // Document summary modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedDocumentForSummary, setSelectedDocumentForSummary] = useState(null);
  
  // Ref for auto-scrolling to latest message
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load available documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await documentService.getDocuments();
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await queryService.queryDocuments(
        input.trim(), 
        conversationHistory, 
        selectedDocument || undefined
      );
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.answer,
        sources: response.sources || [],
        confidence: response.confidence,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error querying documents:', error);
      toast.error('Failed to get response. Please try again.');
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        sources: [],
        confidence: 0,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chat with DocuMind
          </h1>
          <p className="text-gray-600">
            Ask questions about your documents and get intelligent answers with source references.
          </p>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-500 mb-6">
                  Ask me anything about your uploaded documents. I'll provide accurate answers with source references.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Example:</strong> "What was our revenue growth last quarter?"
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Example:</strong> "Summarize the key points from the marketing report"
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    } rounded-lg p-4`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'bot' && (
                        <Bot className="h-5 w-5 mt-0.5 text-gray-500" />
                      )}
                      {message.type === 'user' && (
                        <User className="h-5 w-5 mt-0.5 text-blue-200" />
                      )}
                      <div className="flex-1">
                        {message.type === 'bot' ? (
                          <ReactMarkdown className="prose prose-sm max-w-none">
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                        
                        {/* Sources for bot messages */}
                        {message.type === 'bot' && message.sources && message.sources.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-500 mb-2">Sources:</p>
                            <div className="space-y-2">
                              {message.sources.map((source, index) => (
                                <div key={index} className="flex items-center space-x-2 text-xs">
                                  <FileText className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-600">
                                    {source.filename} (similarity: {(source.similarity_score * 100).toFixed(1)}%)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Confidence score for bot messages */}
                        {message.type === 'bot' && message.confidence !== undefined && (
                          <div className="mt-2 flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(message.confidence)}`}>
                              Confidence: {getConfidenceText(message.confidence)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Copy button */}
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    
                    <div className="mt-2 text-xs opacity-70">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4 max-w-xs">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-gray-500" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Document Selection */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Search in:</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDocumentDropdown(!showDocumentDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                >
                  <span className="text-sm">
                    {selectedDocument ? 
                      documents.find(doc => doc.document_id === selectedDocument)?.filename || 'Select document' :
                      'All documents'
                    }
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                
                {showDocumentDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDocument('');
                        setShowDocumentDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                        selectedDocument === '' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      All documents
                    </button>
                    {documents.map((doc) => (
                      <button
                        key={doc.document_id}
                        type="button"
                        onClick={() => {
                          setSelectedDocument(doc.document_id);
                          setShowDocumentDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                          selectedDocument === doc.document_id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {doc.filename}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Summary Button */}
              {selectedDocument && (
                <button
                  type="button"
                  onClick={() => {
                    const doc = documents.find(d => d.document_id === selectedDocument);
                    if (doc) {
                      setSelectedDocumentForSummary(doc);
                      setShowSummaryModal(true);
                    }
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                  title="Generate AI Summary"
                >
                  <FileSearch className="h-4 w-4" />
                  <span className="text-sm">Summary</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Quick actions:</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setInput('Summarize this document')}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                >
                  Summarize
                </button>
                <button
                  type="button"
                  onClick={() => setInput('What are the key points in this document?')}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                >
                  Key Points
                </button>
                <button
                  type="button"
                  onClick={() => setInput('Extract important data and statistics')}
                  className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                >
                  Extract Data
                </button>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about your documents..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
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

export default Chat;
