'use client';

import { useState, useCallback } from 'react';
import { User } from '@/types/models'; // Make sure this path is correct
import UserList from '@/components/admin/UserList';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FaDownload, FaSpinner } from 'react-icons/fa';

interface UserListWrapperProps {
  initialUsers: User[];
  currentUserId: string;
}

export default function UserListWrapper({ initialUsers, currentUserId }: UserListWrapperProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- New State for ZIP Download ---
  const [isZipping, setIsZipping] = useState(false);

  // --- New QR Generation Logic ---
  const generateQRCodeDataUrl = useCallback(async (url: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#DF5739',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      return dataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  }, []); // Empty dependency array, this function is stable

  // --- New ZIP Download Logic ---
  const downloadAllQRs = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      const qrPromises = users.map(async (user) => {
        // Use the full URL for the QR code
        const url = `${window.location.origin}/qr/${user.clerkId}`;
        const dataUrl = await generateQRCodeDataUrl(url);

        if (dataUrl) {
          const base64Data = dataUrl.split(',')[1];
          const safeName = (user.firstName || user.lastName)
            ? `${user.firstName || ''}_${user.lastName || ''}`.replace(/\s+/g, '_')
            : user._id;
          const filename = `MIMESISS_QR_${safeName}.png`;

          zip.file(filename, base64Data, { base64: true });
        }
      });

      await Promise.all(qrPromises);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'MIMESISS_QR_Utilizatori.zip');

    } catch (error) {
      console.error('Error creating ZIP file:', error);
      alert('A apărut o eroare la generarea arhivei ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  // --- Existing Refresh Logic ---
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const updatedUsers = await response.json();
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error refreshing users:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // --- Return new layout (merged from server page) ---
  return (
    <div className="space-y-6">
      <div className=" flex flex-col lg:flex-row justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">
          Gestionare utilizatori
          
        </h1>
        <p className="text-muted-foreground">
          Vizualizați și gestionați utilizatorii înregistrați
        </p>

        <button
          type='button'
          className='mimesiss-btn-primary text-sm'
          onClick={downloadAllQRs}
          disabled={isZipping}
        >
          {isZipping ? (
            <FaSpinner className="inline mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FaDownload className="inline mr-2 h-4 w-4" />
          )}
          {isZipping ? 'Se generează...' : 'Descarcă toate QR-urile'}
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Toți utilizatorii ({users.length})
          </h2>
        </div>

        {/* This is the original content of your component */}
        <div className="relative">
          {isRefreshing && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center space-x-2 bg-card px-4 py-2 rounded-lg border border-border shadow-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                <span className="text-sm text-muted-foreground">Se actualizează...</span>
              </div>
            </div>
          )}
          <UserList
            users={users}
            currentUserId={currentUserId}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </div>
  );
}