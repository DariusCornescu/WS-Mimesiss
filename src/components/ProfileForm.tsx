'use client'

import { useState, useTransition, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { FaSave, FaEnvelope, FaUser } from 'react-icons/fa';
import { updateProfile } from '../app/dashboard/profile/actions';
import { UserType } from '@/types/models';
import { useMongoUser } from '@/hooks/useMongoUser';
import Card from '@/components/ui/Card';
import FormMessage from '@/components/FormMessage';

export default function ProfileForm() {
  const { isLoaded, user } = useUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userType, setUserType] = useState<UserType>('student');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { user: mongoUser } = useMongoUser();

  useEffect(() => {
    if (user && mongoUser) {
      setFirstName(mongoUser.firstName ?? '');
      setLastName(mongoUser.lastName ?? '');
      setUserType((mongoUser.userType as UserType | undefined) ?? 'student');
    }
  }, [user, mongoUser]);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        setError('');
        setMessage('');

        const result = await updateProfile(formData);
        setMessage(result.message);

        await user?.reload();
      } catch (err) {
        console.error('Error updating profile:', err);
        setError(err instanceof Error ? err.message : 'A apărut o eroare la actualizarea profilului.');
      }
    });
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <Card className="px-4 py-5 sm:p-6">
      <form action={handleSubmit} className="space-y-6">
        {message && <FormMessage message={message} type="success" />}
        {error && <FormMessage message={error} type="error" />}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
            Adresa de email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEnvelope className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              name="email"
              type="email"
              value={user?.emailAddresses[0]?.emailAddress || ''}
              disabled
              className="block w-full pl-10 pr-3 py-2 border border-input bg-muted rounded-md shadow-sm text-muted-foreground cursor-not-allowed"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Adresa de email nu poate fi modificată din această pagină.
          </p>
        </div>

        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
            Prenume
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaUser className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              name="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Introduceți prenumele"
            />
          </div>
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
            Nume
          </label>
          <input
            name="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Introduceți numele"
          />
        </div>

        <div>
          <label htmlFor="userType" className="block text-sm font-medium text-foreground mb-2">
            Schimba tip utilizator in (Curent: {userType})
          </label>
          <select
            name="userType"
            value={userType}
            onChange={(e) => setUserType(e.target.value as UserType)}
            className="block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="student">Student</option>
            <option value="elev">Elev</option>
            <option value="rezident">Rezident</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Se salvează...
              </>
            ) : (
              <>
                <FaSave className="mr-2 h-4 w-4" />
                Salvează modificările
              </>
            )}
          </button>
        </div>
      </form>
    </Card>
  );
}
