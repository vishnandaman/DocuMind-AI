import os
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
from transformers import pipeline
import torch

class SummarizationService:
    """
    Document Summarization Service using local AI models
    """
    
    def __init__(self):
        print("Initializing Document Summarization Service...")
        
        # Initialize summarization pipeline
        self.summarizer = None
        self.use_text_generation = False
        
        try:
            print("Loading summarization model...")
            # Try to load a summarization model
            self.summarizer = pipeline(
                "summarization",
                model="facebook/bart-large-cnn",
                device=0 if torch.cuda.is_available() else -1
            )
            print("Summarization model loaded successfully!")
            
        except Exception as e:
            print(f"Error loading summarization model: {e}")
            print("Falling back to text generation model...")
            try:
                # Fallback to text generation for summarization
                self.summarizer = pipeline(
                    "text2text-generation",
                    model="google/flan-t5-base",
                    device=0 if torch.cuda.is_available() else -1
                )
                self.use_text_generation = True
                print("Text generation model loaded successfully!")
                
            except Exception as e2:
                print(f"Error loading fallback model: {e2}")
                self.summarizer = None
                self.use_text_generation = False
        
        print(f"Using device: {'GPU' if torch.cuda.is_available() else 'CPU'}")
        print("Document Summarization Service initialized!")
    
    async def summarize_document(self, document_content: str, document_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a comprehensive summary of a document
        """
        try:
            print(f"Summarizing document: {document_metadata.get('filename', 'Unknown')}")
            
            # Extract key information from metadata
            filename = document_metadata.get('filename', 'Unknown')
            file_type = document_metadata.get('file_type', 'Unknown')
            file_size = document_metadata.get('file_size', 0)
            upload_date = document_metadata.get('upload_date', 'Unknown')
            
            # Generate different types of summaries
            summary_data = {
                "document_id": document_metadata.get('document_id', ''),
                "filename": filename,
                "file_type": file_type,
                "file_size": file_size,
                "upload_date": upload_date,
                "summary_generated_at": datetime.utcnow().isoformat(),
                "summary_id": str(uuid.uuid4())
            }
            
            # 1. Executive Summary (AI-generated)
            executive_summary = await self._generate_executive_summary(document_content)
            summary_data["executive_summary"] = executive_summary
            
            # 2. Key Points Extraction
            key_points = await self._extract_key_points(document_content, file_type)
            summary_data["key_points"] = key_points
            
            # 3. Document Statistics
            stats = await self._generate_document_stats(document_content, document_metadata)
            summary_data["statistics"] = stats
            
            # 4. Content Analysis
            content_analysis = await self._analyze_content(document_content, file_type)
            summary_data["content_analysis"] = content_analysis
            
            # 5. Quick Overview
            quick_overview = await self._generate_quick_overview(document_content, file_type)
            summary_data["quick_overview"] = quick_overview
            
            print("Document summary generated successfully!")
            return summary_data
            
        except Exception as e:
            print(f"Error generating summary: {e}")
            return {
                "error": f"Failed to generate summary: {str(e)}",
                "summary_id": str(uuid.uuid4()),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _generate_executive_summary(self, content: str) -> str:
        """Generate AI-powered executive summary"""
        try:
            if not self.summarizer:
                return self._fallback_summary(content)
            
            # Clean and prepare content
            clean_content = self._clean_content(content)
            
            if len(clean_content) < 100:
                return "Document is too short for a meaningful summary."
            
            # Split content into chunks if too long
            max_length = 1000
            if len(clean_content) > max_length:
                chunks = [clean_content[i:i+max_length] for i in range(0, len(clean_content), max_length-100)]
            else:
                chunks = [clean_content]
            
            summaries = []
            for chunk in chunks[:3]:  # Process max 3 chunks
                try:
                    if self.use_text_generation:
                        # Use text generation for summarization
                        prompt = f"Summarize the following text in 2-3 sentences:\n\n{chunk}\n\nSummary:"
                        result = self.summarizer(prompt, max_length=150, temperature=0.3)
                        summary = result[0]["generated_text"]
                    else:
                        # Use dedicated summarization model
                        result = self.summarizer(chunk, max_length=150, min_length=50, do_sample=False)
                        summary = result[0]["summary_text"]
                    
                    summaries.append(summary.strip())
                except Exception as e:
                    print(f"⚠️ Chunk summarization error: {e}")
                    continue
            
            if summaries:
                return " ".join(summaries)
            else:
                return self._fallback_summary(content)
                
        except Exception as e:
            print(f"Executive summary error: {e}")
            return self._fallback_summary(content)
    
    async def _extract_key_points(self, content: str, file_type: str) -> List[str]:
        """Extract key points based on document type"""
        try:
            lines = content.split('\n')
            key_points = []
            
            if file_type.lower() in ['.xlsx', '.csv']:
                # For spreadsheet data, extract structured information
                key_points = self._extract_spreadsheet_key_points(content)
            elif file_type.lower() == '.pdf':
                # For PDF documents, extract important sentences
                key_points = self._extract_pdf_key_points(content)
            else:
                # General key point extraction
                key_points = self._extract_general_key_points(content)
            
            return key_points[:10]  # Limit to 10 key points
            
        except Exception as e:
            print(f"Key points extraction error: {e}")
            return ["Unable to extract key points from this document."]
    
    def _extract_spreadsheet_key_points(self, content: str) -> List[str]:
        """Extract key points from spreadsheet data"""
        key_points = []
        lines = content.split('\n')
        
        # Look for patterns in spreadsheet data
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Extract contact information
            if re.search(r'\d{10}', line) and '@' in line:  # Phone and email
                key_points.append(f"Contact information found: {line[:100]}...")
            
            # Extract numerical data
            if re.search(r'\d+\.?\d*', line) and any(keyword in line.lower() for keyword in ['score', 'grade', 'percent', 'cpi', 'gpa']):
                key_points.append(f"Academic data: {line[:100]}...")
            
            # Extract names
            if re.search(r'[A-Z][a-z]+\s+[A-Z][a-z]+', line):
                key_points.append(f"Name entry: {line[:100]}...")
        
        return key_points if key_points else ["Spreadsheet contains structured data with multiple entries."]
    
    def _extract_pdf_key_points(self, content: str) -> List[str]:
        """Extract key points from PDF documents"""
        sentences = content.split('.')
        key_points = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 20:
                continue
                
            # Look for important keywords
            important_keywords = ['important', 'key', 'summary', 'conclusion', 'result', 'finding', 'recommendation']
            if any(keyword in sentence.lower() for keyword in important_keywords):
                key_points.append(sentence[:150] + "..." if len(sentence) > 150 else sentence)
        
        return key_points if key_points else ["PDF document contains detailed information."]
    
    def _extract_general_key_points(self, content: str) -> List[str]:
        """Extract key points from general documents"""
        sentences = content.split('.')
        key_points = []
        
        # Take sentences that are substantial and contain important words
        for sentence in sentences:
            sentence = sentence.strip()
            if 30 <= len(sentence) <= 200:
                key_points.append(sentence)
        
        return key_points[:8]  # Limit to 8 key points
    
    async def _generate_document_stats(self, content: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Generate document statistics"""
        try:
            stats = {
                "word_count": len(content.split()),
                "character_count": len(content),
                "line_count": len(content.split('\n')),
                "file_size_bytes": metadata.get('file_size', 0),
                "file_type": metadata.get('file_type', 'Unknown'),
                "upload_date": metadata.get('upload_date', 'Unknown')
            }
            
            # Calculate readability metrics
            sentences = content.split('.')
            avg_sentence_length = stats["word_count"] / len(sentences) if sentences else 0
            stats["average_sentence_length"] = round(avg_sentence_length, 2)
            
            # Count special elements
            stats["email_count"] = len(re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', content))
            stats["phone_count"] = len(re.findall(r'\b\d{10}\b', content))
            stats["number_count"] = len(re.findall(r'\b\d+\.?\d*\b', content))
            
            return stats
            
        except Exception as e:
            print(f"Stats generation error: {e}")
            return {"error": "Unable to generate statistics"}
    
    async def _analyze_content(self, content: str, file_type: str) -> Dict[str, Any]:
        """Analyze document content"""
        try:
            analysis = {
                "document_type": self._classify_document_type(content, file_type),
                "language": "English",  # Assuming English for now
                "content_categories": self._categorize_content(content),
                "data_types": self._identify_data_types(content)
            }
            
            return analysis
            
        except Exception as e:
            print(f"Content analysis error: {e}")
            return {"error": "Unable to analyze content"}
    
    def _classify_document_type(self, content: str, file_type: str) -> str:
        """Classify the type of document"""
        content_lower = content.lower()
        
        if file_type.lower() in ['.xlsx', '.csv']:
            if any(keyword in content_lower for keyword in ['contact', 'phone', 'email', 'student', 'candidate']):
                return "Contact/Student Database"
            elif any(keyword in content_lower for keyword in ['financial', 'revenue', 'cost', 'budget']):
                return "Financial Data"
            else:
                return "Structured Data"
        elif file_type.lower() == '.pdf':
            if any(keyword in content_lower for keyword in ['report', 'analysis', 'study']):
                return "Report/Analysis"
            elif any(keyword in content_lower for keyword in ['manual', 'guide', 'instruction']):
                return "Manual/Guide"
            else:
                return "Document"
        else:
            return "Text Document"
    
    def _categorize_content(self, content: str) -> List[str]:
        """Categorize content based on keywords"""
        content_lower = content.lower()
        categories = []
        
        if any(keyword in content_lower for keyword in ['contact', 'phone', 'email', 'address']):
            categories.append("Contact Information")
        if any(keyword in content_lower for keyword in ['academic', 'student', 'grade', 'score', 'cpi', 'gpa']):
            categories.append("Academic Data")
        if any(keyword in content_lower for keyword in ['financial', 'revenue', 'cost', 'budget', 'money']):
            categories.append("Financial Information")
        if any(keyword in content_lower for keyword in ['technical', 'code', 'programming', 'software']):
            categories.append("Technical Content")
        if any(keyword in content_lower for keyword in ['legal', 'agreement', 'contract', 'terms']):
            categories.append("Legal Content")
        
        return categories if categories else ["General Content"]
    
    def _identify_data_types(self, content: str) -> List[str]:
        """Identify types of data in the document"""
        data_types = []
        
        if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', content):
            data_types.append("Email Addresses")
        if re.search(r'\b\d{10}\b', content):
            data_types.append("Phone Numbers")
        if re.search(r'\b\d{4}\b', content):
            data_types.append("Years/Dates")
        if re.search(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+', content):
            data_types.append("Names")
        if re.search(r'\b\d+\.?\d*\b', content):
            data_types.append("Numerical Data")
        
        return data_types if data_types else ["Text Content"]
    
    async def _generate_quick_overview(self, content: str, file_type: str) -> str:
        """Generate a quick overview of the document"""
        try:
            if file_type.lower() in ['.xlsx', '.csv']:
                lines = content.split('\n')
                entry_count = len([line for line in lines if line.strip()])
                return f"This spreadsheet contains approximately {entry_count} data entries with structured information."
            
            elif file_type.lower() == '.pdf':
                word_count = len(content.split())
                return f"This PDF document contains approximately {word_count} words of detailed information."
            
            else:
                word_count = len(content.split())
                return f"This document contains approximately {word_count} words of text content."
                
        except Exception as e:
            print(f"Quick overview error: {e}")
            return "Document overview unavailable."
    
    def _clean_content(self, content: str) -> str:
        """Clean content for better processing"""
        # Remove excessive whitespace
        content = re.sub(r'\s+', ' ', content)
        # Remove special characters that might interfere
        content = re.sub(r'[^\w\s.,!?;:()-]', '', content)
        return content.strip()
    
    def _fallback_summary(self, content: str) -> str:
        """Fallback summary when AI models fail"""
        try:
            sentences = content.split('.')
            # Take first few substantial sentences
            summary_sentences = []
            for sentence in sentences:
                sentence = sentence.strip()
                if 20 <= len(sentence) <= 150:
                    summary_sentences.append(sentence)
                if len(summary_sentences) >= 3:
                    break
            
            if summary_sentences:
                return ". ".join(summary_sentences) + "."
            else:
                return "This document contains structured information that requires detailed review."
                
        except Exception as e:
            print(f"Fallback summary error: {e}")
            return "Unable to generate summary for this document."
