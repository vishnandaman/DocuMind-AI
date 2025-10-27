# DocuMind - AI-Powered Document Analysis System

A comprehensive document management and analysis platform built for the Better Hackathon Challenge. This system allows users to upload various document types and get intelligent answers through natural language queries.

## Project Overview

DocuMind is designed to solve the problem of efficiently searching and extracting information from large collections of documents. Whether you're dealing with PDFs, Word documents, Excel sheets, or CSV files, DocuMind can understand, organize, and answer questions about your content.

## Features Implemented

### Core Features
- **Document Upload & Processing**: Support for PDF, DOCX, XLSX, CSV files
- **Natural Language Querying**: Ask questions in plain English and get relevant answers
- **Vector-based Search**: Uses semantic search to find the most relevant document sections
- **User Authentication**: Secure user registration and login system
- **Document Management**: View, organize, and manage uploaded documents

### Advanced Features
- **Document Summarization**: Get AI-generated summaries of your documents
- **Conversational Memory**: Chat history is maintained for context-aware responses
- **Multilingual Support**: Query in multiple languages (English, Spanish, French, German, etc.)
- **Role-based Access Control**: Different user roles (viewer, user, admin) with appropriate permissions
- **Analytics Dashboard**: Track usage patterns and system performance with interactive charts
- **User Analytics Visualization**: Interactive charts showing query trends, document usage, response times, and activity patterns
- **File-specific Querying**: Select specific documents to query from

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework for building APIs
- **MongoDB**: NoSQL database for storing document metadata and user information
- **ChromaDB**: Vector database for semantic search and document embeddings
- **Ollama**: Local LLM integration for AI-powered responses
- **Sentence Transformers**: For generating document embeddings
- **JWT**: Secure authentication tokens

### Frontend
- **React**: Modern JavaScript library for building user interfaces
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Recharts**: Interactive data visualization library for React

## Development Journey

### Initial Approach
Started with OpenAI API integration, but quickly realized it required paid credits which wasn't feasible for a student project.

### API Exploration Phase
Tried several free alternatives:
- **Gemini API**: While free, the responses weren't accurate enough for document analysis
- **Groq API**: Initially promising but models kept getting decommissioned
- **Together AI**: Similar issues with model availability and accuracy

### Final Solution - Ollama
After multiple failed attempts with external APIs, decided to implement a local solution using Ollama. This approach offers:
- No API costs or rate limits
- Complete control over the AI model
- Reliable responses for document analysis
- Works offline without internet dependency

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local installation or MongoDB Atlas)
- Ollama (for AI functionality)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
```

### Environment Configuration
Create a `.env` file in the backend directory:
```
MONGODB_URL=mongodb://localhost:27017/DocuMind
JWT_SECRET_KEY=your-secret-key-here
```

### Ollama Setup
1. Install Ollama from https://ollama.ai
2. Pull a model: `ollama pull llama3.2`
3. Start Ollama service

## Running the Application

### Start Backend
```bash
cd backend
uvicorn main:app --reload
```

### Start Frontend
```bash
cd frontend
npm start
```

The application will be available at http://localhost:3000

## Project Structure

```
DocuMind/
├── backend/
│   ├── services/
│   │   ├── ai_processor.py          # AI response generation
│   │   ├── document_processor.py     # Document text extraction
│   │   ├── vector_store.py          # Vector database operations
│   │   ├── mongodb_service.py       # MongoDB operations
│   │   ├── auth_service.py          # User authentication
│   │   ├── analytics_service.py     # Usage analytics
│   │   └── summarization_service.py # Document summarization
│   ├── models/                      # Pydantic models
│   └── main.py                      # FastAPI application
├── frontend/
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── services/               # API services
│   │   └── App.js                   # Main application
└── README.md
```

## Key Challenges & Solutions

### 1. AI Service Reliability
**Problem**: External APIs were either paid, unreliable, or had model availability issues.

**Solution**: Implemented local Ollama integration for consistent, reliable AI responses.

### 2. Document Processing
**Problem**: Extracting meaningful text from various document formats.

**Solution**: Built a comprehensive document processor supporting multiple formats with intelligent chunking.

### 3. Vector Search Accuracy
**Problem**: Ensuring search results are relevant to user queries.

**Solution**: Implemented semantic search with ChromaDB and fine-tuned similarity thresholds.

### 4. Analytics Visualization
**Problem**: Users needed better insights into their document usage patterns.

**Solution**: Implemented comprehensive analytics dashboard with interactive charts using Recharts, showing query trends, response times, document usage, and activity patterns.

## Usage Examples

### Document Upload
1. Register/Login to the system
2. Navigate to Documents page
3. Upload PDF, DOCX, XLSX, or CSV files
4. Documents are automatically processed and indexed

### Querying Documents
1. Go to Chat page
2. Select a specific document (optional)
3. Ask questions in natural language
4. Get AI-powered responses with source citations

### Analytics Dashboard
1. Navigate to Analytics page
2. View interactive charts showing your usage patterns
3. Monitor query trends, response times, and document usage
4. Admin users can access system-wide analytics

## Admin Features

Admin users have access to:
- System analytics dashboard with interactive charts
- User management
- Database statistics
- System health monitoring

To create an admin user, run:
```bash
python setup_admin.py
```

## Future Enhancements

- Real-time collaboration features
- Advanced document comparison
- Custom AI model training
- Mobile application
- Integration with cloud storage services

## Contributing

This project was developed as part of the Better Hackathon Challenge. The codebase is structured to be easily extensible and maintainable.

## License

This project is developed for educational purposes as part of the Better Hackathon Challenge.

## Contact

For questions or feedback about this project, please reach out through the hackathon platform.

---

*Built with dedication and countless hours of debugging API integrations* 😅