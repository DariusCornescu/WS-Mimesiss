'use client';

import { useEffect, useState } from 'react';
import { FaCheckCircle, FaSpinner, FaTimesCircle } from 'react-icons/fa';

interface AttendanceToggleProps {
  registrationId: string;
  userId: string;
  initialStatus: boolean;
  confirmedAt?: string;
}

export default function AttendanceToggle({ 
  registrationId,
  userId,
  initialStatus,
  confirmedAt
}: AttendanceToggleProps) {
  const [confirmed, setConfirmed] = useState(initialStatus);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const toggleAttendance = async () => {
    setUpdating(true);
    
    try {
      const response = await fetch(`/api/admin/attendance/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, confirmed: !confirmed }),
      });

      if (!response.ok) throw new Error('Failed to update attendance');

      const result = await response.json();
      setConfirmed(!confirmed);
      showToast(result.message, 'success');
      
    } catch (error) {
      showToast('Eroare la actualizarea prezenței', 'error');
	  console.error('Error updating attendance:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg ${
          toast.type === 'success' ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {confirmed ? (
            <FaCheckCircle className="text-primary" />
          ) : (
            <FaTimesCircle className="text-muted-foreground" />
          )}
          <span className="font-medium text-foreground">
            Prezență: {confirmed ? 'Confirmată' : 'Neconfirmată'}
          </span>
        </div>
        
        <button
          type='button'
          onClick={toggleAttendance}
          disabled={updating}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            confirmed
              ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
        >
          {updating ? (
            <div className="flex items-center gap-2">
              <FaSpinner className="animate-spin" />
              Se actualizează...
            </div>
          ) : confirmed ? (
            'Anulează Prezența'
          ) : (
            'Confirmă Prezența'
          )}
        </button>
      </div>
      
      {confirmed && confirmedAt && (
        <div className="mt-3 text-sm text-muted-foreground bg-muted p-2 rounded">
          Confirmată la: {new Date(confirmedAt).toLocaleString('ro-RO')}
        </div>
      )}
    </>
  );
}