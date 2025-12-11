// app/admin/hooks/useComplaintNotifications.ts
import { useState, useEffect, useCallback } from 'react';

interface ComplaintStats {
  pendingCount: number;
  criticalCount: number;
  needsResponseCount: number;
  unreadCount: number;
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

  // 1. Bungkus helper dengan useCallback agar identitas fungsinya stabil
  const getReadComplaintIds = useCallback((): Set<number> => {
    try {
      if (typeof window === 'undefined') return new Set();
      const stored = localStorage.getItem('read_complaint_ids');
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error reading localStorage:', error);
    }
    return new Set();
  }, []);

  const saveReadComplaintIds = useCallback((ids: Set<number>) => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem('read_complaint_ids', JSON.stringify([...ids]));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, []);

  // 2. Fungsi utama loadStats dibungkus useCallback
  const loadStats = useCallback(async () => {
    if (!hasPermission) {
      return;
    }

    try {
      // Catatan: Saya menghapus setIsLoading(true) di awal fungsi ini 
      // agar UI tidak 'flicker' (loading spinner muncul) setiap 30 detik saat auto-refresh.
      // Kita hanya set false saat selesai.
      
      const response = await fetch('/api/complaints?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }

      const result = await response.json();
      const complaints: Complaint[] = result.data || [];
      
      const readIds = getReadComplaintIds();
      
      const pending = complaints.filter(c => 
        ['submitted', 'acknowledged', 'investigating'].includes(c.status)
      );
      
      const critical = complaints.filter(c => 
        c.priority === 'critical' && !['resolved', 'closed'].includes(c.status)
      );
      
      const needsResponse = complaints.filter(c => 
        c.status === 'pending_response'
      );
      
      const needsAttention = [...pending, ...critical];
      const unread = needsAttention.filter(c => !readIds.has(c.id));
      
      // Update state
      setStats({
        pendingCount: pending.length,
        criticalCount: critical.length,
        needsResponseCount: needsResponse.length,
        unreadCount: unread.length
      });

    } catch (error) {
      console.error('Failed to load complaint stats:', error);
      // Opsional: Reset stats jika error, atau biarkan nilai terakhir
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, getReadComplaintIds]); 

  // 3. Bungkus markAsRead dengan useCallback
  const markAsRead = useCallback((complaintId: number) => {
    const readIds = getReadComplaintIds();
    readIds.add(complaintId);
    saveReadComplaintIds(readIds);
    
    loadStats();
  }, [getReadComplaintIds, saveReadComplaintIds, loadStats]);

  // 4. Bungkus markAllAsRead dengan useCallback
  const markAllAsRead = useCallback(async () => {
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
  }, [getReadComplaintIds, saveReadComplaintIds, loadStats]);

  // 5. useEffect sekarang aman dijalankan
  useEffect(() => {
    if (hasPermission) {
      loadStats(); // Panggil segera saat mount
      
      const interval = setInterval(() => {
        loadStats();
      }, 30000); // Refresh setiap 30 detik
      
      return () => clearInterval(interval);
    } else {
      setIsLoading(false);
    }
  }, [hasPermission, loadStats]); // Dependency aman karena loadStats sudah di-memoize

  return {
    stats,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshStats: loadStats
  };
}