'use client'

import { useMongoUser } from '@/hooks/useMongoUser';
import ProfileHeader from '@/components/ProfileHeader';
import ProfileForm from '@/components/ProfileForm';
import AccountInfo from '@/components/dashboard/AccountInfo';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProfilePage() {
  const { user: mongoUser, isLoading: isMongoUserLoading, error: mongoUserError, refetch } = useMongoUser();

  if (isMongoUserLoading) {
    return <LoadingSpinner text="Se încarcă profilul..." />;
  }

  if (!mongoUser && mongoUserError) {
    console.error('Error loading MongoDB user data:', mongoUserError);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-2">Eroare la încărcarea datelor</div>
          <button
            type='button'
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Încearcă din nou
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProfileHeader />
      <ProfileForm />
      {mongoUser && <AccountInfo userType={mongoUser.userType} />}
    </div>
  );
}
