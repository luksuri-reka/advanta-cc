// app/admin/hooks/useComplaintNotifications.ts
import { useState, useEffect } from 'react';

interface ComplaintStats {
  pendingCount: number;
  criticalCount: number;
  needsResponseCount: number;
  unreadCount: number; // New: count yang belum dibaca
}

interface Complaint {
  id: number;
  created_at: string;
  priority: string;
  status: string;
}

export function useComplaintNotifications(hasPermission: boolean) {
  const [stats, setStats] = useState<ComplaintStats>({
    pendingCount: 0,
    criticalCount: 0,
    needsResponseCount: 0,
    unreadCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Get list of read complaint IDs from localStorage
  const getReadComplaintIds = (): Set<number> => {
    try {
      const stored = localStorage.getItem('read_complaint_ids');
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error reading localStorage:', error);
    }
    return new Set();
  };

  // Save read complaint IDs to localStorage
  const saveReadComplaintIds = (ids: Set<number>) => {
    try {
      localStorage.setItem('read_complaint_ids', JSON.stringify([...ids]));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Mark complaint as read
  const markAsRead = (complaintId: number) => {
    const readIds = getReadComplaintIds();
    readIds.add(complaintId);
    saveReadComplaintIds(readIds);
    
    // Refresh stats
    loadStats();
  };

  // Mark all current complaints as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/complaints?limit=100');
      if (response.ok) {
        const result = await response.json();
        const readIds = getReadComplaintIds();
        
        result.data?.forEach((complaint: Complaint) => {
          readIds.add(complaint.id);
        });
        
        saveReadComplaintIds(readIds);
        loadStats();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Load complaint statistics
  const loadStats = async () => {
    if (!hasPermission) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Get all pending/critical complaints
      const response = await fetch('/api/complaints?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }

      const result = await response.json();
      const complaints: Complaint[] = result.data || [];
      
      // Get read IDs from localStorage
      const readIds = getReadComplaintIds();
      
      // Calculate stats
      const pending = complaints.filter(c => 
        ['submitted', 'acknowledged', 'investigating'].includes(c.status)
      );
      
      const critical = complaints.filter(c => 
        c.priority === 'critical' && !['resolved', 'closed'].includes(c.status)
      );
      
      const needsResponse = complaints.filter(c => 
        c.status === 'pending_response'
      );
      
      // Calculate unread (complaints that need attention and haven't been read)
      const needsAttention = [...pending, ...critical];
      const unread = needsAttention.filter(c => !readIds.has(c.id));
      
      setStats({
        pendingCount: pending.length,
        criticalCount: critical.length,
        needsResponseCount: needsResponse.length,
        unreadCount: unread.length
      });

    } catch (error) {
      console.error('Failed to load complaint stats:', error);
      setStats({
        pendingCount: 0,
        criticalCount: 0,
        needsResponseCount: 0,
        unreadCount: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (hasPermission) {
      loadStats();
      const interval = setInterval(loadStats, 30000);
      return () => clearInterval(interval);
    }
  }, [hasPermission]);

  return {
    stats,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshStats: loadStats
  };
}