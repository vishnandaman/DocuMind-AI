import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  async login(username, password) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async register(username, password) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async verifyToken(token) {
    const response = await api.get('/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

// Document service
export const documentService = {
  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getDocuments() {
    const response = await api.get('/documents');
    return response.data;
  },

  async deleteDocument(documentId) {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  },

  async getDocumentContent(documentId) {
    const response = await api.get(`/documents/${documentId}/content`);
    return response.data;
  },

  async summarizeDocument(documentId) {
    const response = await api.post(`/documents/${documentId}/summarize`);
    return response.data;
  },

  // Analytics endpoints
  async getAnalytics() {
    const response = await api.get('/analytics');
    return response.data;
  },

  async getAnalyticsSummary() {
    const response = await api.get('/analytics/summary');
    return response.data;
  },

  // Conversation endpoints
  async getConversationHistory(sessionId) {
    const response = await api.get(`/conversation/${sessionId}`);
    return response.data;
  },

  async clearConversationHistory(sessionId) {
    const response = await api.delete(`/conversation/${sessionId}`);
    return response.data;
  },

  // Admin endpoints
  async getAllUsers() {
    const response = await api.get('/admin/users');
    return response.data;
  },

  async getAllDocuments() {
    const response = await api.get('/admin/documents');
    return response.data;
  },

  async deleteUser(userId) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  }
};

// Analytics service
export const analyticsService = {
  async getAnalytics() {
    const response = await api.get('/analytics');
    return response.data;
  },

  async getAnalyticsSummary() {
    const response = await api.get('/analytics/summary');
    return response.data;
  },

  async getVisualizationData() {
    const response = await api.get('/analytics/visualization');
    return response.data;
  },

  async getAdminAnalytics() {
    const response = await api.get('/analytics/admin');
    return response.data;
  }
};

// Query service
export const queryService = {
  async queryDocuments(query, conversationHistory = [], documentId = null) {
    const requestData = {
      query,
      conversation_history: conversationHistory,
    };
    
    if (documentId) {
      requestData.document_id = documentId;
    }
    
    const response = await api.post('/query', requestData);
    return response.data;
  },
};

export default api;
