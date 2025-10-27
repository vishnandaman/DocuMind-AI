import os
from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import json

class AnalyticsService:
    def __init__(self):
        self.analytics_data = defaultdict(list)
    
    async def track_query(self, user_id: str, query: str, document_id: str = None, response_time: float = 0):
        try:
            query_data = {
                "timestamp": datetime.utcnow(),
                "query": query,
                "document_id": document_id,
                "response_time": response_time,
                "query_length": len(query.split())
            }
            self.analytics_data[f"queries_{user_id}"].append(query_data)
        except Exception as e:
            print(f"Error tracking query: {e}")
    
    async def track_document_access(self, user_id: str, document_id: str, action: str):
        """Track document access patterns"""
        try:
            access_data = {
                "timestamp": datetime.utcnow(),
                "document_id": document_id,
                "action": action  # 'upload', 'query', 'view', 'delete'
            }
            self.analytics_data[f"access_{user_id}"].append(access_data)
        except Exception as e:
            print(f"Error tracking document access: {e}")
    
    async def get_visualization_data(self, user_id: str = None) -> Dict[str, Any]:
        """Get data formatted for visualization charts"""
        try:
            if user_id:
                queries = self.analytics_data.get(f"queries_{user_id}", [])
                access = self.analytics_data.get(f"access_{user_id}", [])
            else:
                queries = []
                access = []
                for key, data in self.analytics_data.items():
                    if key.startswith("queries_"):
                        queries.extend(data)
                    elif key.startswith("access_"):
                        access.extend(data)
            
            return {
                "queryTrends": self._get_query_trends_chart(queries),
                "responseTimeDistribution": self._get_response_time_chart(queries),
                "documentUsage": self._get_document_usage_chart(access),
                "activityByHour": self._get_hourly_activity_chart(queries + access),
                "queryTypes": self._get_query_types_chart(queries),
                "userEngagement": self._get_engagement_metrics(queries, access),
                "topDocuments": self._get_top_documents_chart(access),
                "querySuccessRate": self._get_success_rate_chart(queries)
            }
        except Exception as e:
            print(f"Error getting visualization data: {e}")
            return {}
    
    async def get_user_analytics(self, user_id: str) -> Dict[str, Any]:
        try:
            queries = self.analytics_data.get(f"queries_{user_id}", [])
            access = self.analytics_data.get(f"access_{user_id}", [])
            
            # Calculate analytics
            analytics = {
                "total_queries": len(queries),
                "total_document_accesses": len(access),
                "average_response_time": self._calculate_avg_response_time(queries),
                "most_common_queries": self._get_common_queries(queries),
                "query_trends": self._get_query_trends(queries),
                "document_usage": self._get_document_usage(access),
                "activity_by_hour": self._get_activity_by_hour(queries + access),
                "recent_activity": self._get_recent_activity(queries + access)
            }
            
            return analytics
        except Exception as e:
            print(f"Error getting user analytics: {e}")
            return {}
    
    def _calculate_avg_response_time(self, queries: List[Dict]) -> float:
        """Calculate average response time"""
        if not queries:
            return 0.0
        response_times = [q.get('response_time', 0) for q in queries if q.get('response_time', 0) > 0]
        return sum(response_times) / len(response_times) if response_times else 0.0
    
    def _get_common_queries(self, queries: List[Dict], limit: int = 5) -> List[Dict[str, Any]]:
        """Get most common query patterns"""
        if not queries:
            return []
        
        # Extract key words from queries
        all_words = []
        for query in queries:
            words = query.get('query', '').lower().split()
            # Filter out common words
            filtered_words = [w for w in words if len(w) > 3 and w not in ['what', 'how', 'where', 'when', 'why', 'the', 'and', 'or', 'but']]
            all_words.extend(filtered_words)
        
        # Count word frequency
        word_counts = Counter(all_words)
        return [{"word": word, "count": count} for word, count in word_counts.most_common(limit)]
    
    def _get_query_trends(self, queries: List[Dict]) -> List[Dict[str, Any]]:
        """Get query trends over time"""
        if not queries:
            return []
        
        # Group queries by date
        daily_counts = defaultdict(int)
        for query in queries:
            date = query.get('timestamp', datetime.utcnow()).date()
            daily_counts[date] += 1
        
        # Convert to list format
        trends = []
        for date in sorted(daily_counts.keys()):
            trends.append({
                "date": date.isoformat(),
                "count": daily_counts[date]
            })
        
        return trends[-7:]  # Last 7 days
    
    def _get_document_usage(self, access: List[Dict]) -> List[Dict[str, Any]]:
        """Get document usage statistics"""
        if not access:
            return []
        
        # Count accesses per document
        doc_counts = defaultdict(int)
        for access_item in access:
            doc_id = access_item.get('document_id', 'unknown')
            doc_counts[doc_id] += 1
        
        # Convert to list format
        usage = []
        for doc_id, count in doc_counts.items():
            usage.append({
                "document_id": doc_id,
                "access_count": count
            })
        
        return sorted(usage, key=lambda x: x['access_count'], reverse=True)
    
    def _get_activity_by_hour(self, activities: List[Dict]) -> List[Dict[str, Any]]:
        """Get activity distribution by hour"""
        if not activities:
            return []
        
        hourly_counts = defaultdict(int)
        for activity in activities:
            hour = activity.get('timestamp', datetime.utcnow()).hour
            hourly_counts[hour] += 1
        
        # Convert to list format
        hourly_activity = []
        for hour in range(24):
            hourly_activity.append({
                "hour": hour,
                "count": hourly_counts[hour]
            })
        
        return hourly_activity
    
    def _get_query_trends_chart(self, queries: List[Dict]) -> List[Dict[str, Any]]:
        """Get query trends data for line chart"""
        if not queries:
            return []
        
        daily_counts = defaultdict(int)
        for query in queries:
            date = query.get('timestamp', datetime.utcnow()).date()
            daily_counts[date] += 1
        
        trends = []
        for date, count in sorted(daily_counts.items()):
            trends.append({
                "date": date.isoformat(),
                "queries": count
            })
        
        return trends
    
    def _get_response_time_chart(self, queries: List[Dict]) -> List[Dict[str, Any]]:
        """Get response time distribution for histogram"""
        if not queries:
            return []
        
        response_times = [q.get('response_time', 0) for q in queries if q.get('response_time', 0) > 0]
        if not response_times:
            return []
        
        bins = [0, 0.5, 1.0, 2.0, 5.0, 10.0, float('inf')]
        bin_labels = ['<0.5s', '0.5-1s', '1-2s', '2-5s', '5-10s', '>10s']
        
        distribution = []
        for i in range(len(bins) - 1):
            count = sum(1 for rt in response_times if bins[i] <= rt < bins[i + 1])
            distribution.append({
                "range": bin_labels[i],
                "count": count
            })
        
        return distribution
    
    def _get_document_usage_chart(self, access: List[Dict]) -> List[Dict[str, Any]]:
        """Get document usage data for bar chart"""
        if not access:
            return []
        
        doc_counts = Counter()
        for access_item in access:
            doc_id = access_item.get('document_id', 'Unknown')
            doc_counts[doc_id] += 1
        
        usage_data = []
        for doc_id, count in doc_counts.most_common(10):
            usage_data.append({
                "document": f"Doc_{doc_id[:8]}",
                "accesses": count
            })
        
        return usage_data
    
    def _get_hourly_activity_chart(self, activities: List[Dict]) -> List[Dict[str, Any]]:
        """Get hourly activity data for area chart"""
        if not activities:
            return []
        
        hourly_counts = defaultdict(int)
        for activity in activities:
            hour = activity.get('timestamp', datetime.utcnow()).hour
            hourly_counts[hour] += 1
        
        hourly_data = []
        for hour in range(24):
            hourly_data.append({
                "hour": f"{hour:02d}:00",
                "activity": hourly_counts[hour]
            })
        
        return hourly_data
    
    def _get_query_types_chart(self, queries: List[Dict]) -> List[Dict[str, Any]]:
        """Get query types distribution for pie chart"""
        if not queries:
            return []
        
        query_types = defaultdict(int)
        for query in queries:
            query_text = query.get('query', '').lower()
            if any(word in query_text for word in ['what', 'how', 'why', 'when', 'where']):
                query_types['Questions'] += 1
            elif any(word in query_text for word in ['find', 'search', 'locate']):
                query_types['Search'] += 1
            elif any(word in query_text for word in ['summary', 'summarize', 'overview']):
                query_types['Summary'] += 1
            elif any(word in query_text for word in ['compare', 'difference', 'versus']):
                query_types['Comparison'] += 1
            else:
                query_types['General'] += 1
        
        return [{"type": k, "count": v} for k, v in query_types.items()]
    
    def _get_engagement_metrics(self, queries: List[Dict], access: List[Dict]) -> Dict[str, Any]:
        """Get user engagement metrics"""
        if not queries and not access:
            return {"sessions": 0, "avgSessionDuration": 0, "retentionRate": 0}
        
        total_queries = len(queries)
        total_accesses = len(access)
        avg_response_time = self._calculate_avg_response_time(queries)
        
        return {
            "totalQueries": total_queries,
            "totalAccesses": total_accesses,
            "avgResponseTime": round(avg_response_time, 2),
            "engagementScore": min(100, (total_queries + total_accesses) * 2)
        }
    
    def _get_top_documents_chart(self, access: List[Dict]) -> List[Dict[str, Any]]:
        """Get top documents by access count"""
        if not access:
            return []
        
        doc_counts = Counter()
        for access_item in access:
            doc_id = access_item.get('document_id', 'Unknown')
            doc_counts[doc_id] += 1
        
        top_docs = []
        for doc_id, count in doc_counts.most_common(5):
            top_docs.append({
                "document": f"Document_{doc_id[:8]}",
                "accesses": count,
                "percentage": round((count / sum(doc_counts.values())) * 100, 1)
            })
        
        return top_docs
    
    def _get_success_rate_chart(self, queries: List[Dict]) -> List[Dict[str, Any]]:
        """Get query success rate over time"""
        if not queries:
            return []
        
        daily_success = defaultdict(lambda: {"total": 0, "successful": 0})
        for query in queries:
            date = query.get('timestamp', datetime.utcnow()).date()
            daily_success[date]["total"] += 1
            if query.get('response_time', 0) < 5.0:
                daily_success[date]["successful"] += 1
        
        success_data = []
        for date, data in sorted(daily_success.items()):
            success_rate = (data["successful"] / data["total"]) * 100 if data["total"] > 0 else 0
            success_data.append({
                "date": date.isoformat(),
                "successRate": round(success_rate, 1)
            })
        
        return success_data
    
    def _get_recent_activity(self, activities: List[Dict], limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent activity"""
        if not activities:
            return []
        
        # Sort by timestamp and get recent ones
        sorted_activities = sorted(activities, key=lambda x: x.get('timestamp', datetime.min), reverse=True)
        
        recent = []
        for activity in sorted_activities[:limit]:
            recent.append({
                "timestamp": activity.get('timestamp', datetime.utcnow()).isoformat(),
                "action": activity.get('action', 'unknown'),
                "query": activity.get('query', '')[:50] + '...' if activity.get('query') else None,
                "document_id": activity.get('document_id')
            })
        
        return recent
