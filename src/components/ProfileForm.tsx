'use client'

import { useState, useTransition, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { FaSave, FaEnvelope, FaUser, FaPhone, FaUniversity, FaMapMarkerAlt } from 'react-icons/fa';
import { updateProfile } from '../app/dashboard/profile/actions';
import { UserType } from '@/types/models';
import { useMongoUser } from '@/hooks/useMongoUser';
import { studyYears } from '@/lib/registration-profile';
import Card from '@/components/ui/Card';
import FormMessage from '@/components/FormMessage';

const inputClass = 'block min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm';
const labelClass = 'mb-2 block text-sm font-medium text-foreground';
const required = <span className="text-destructive" aria-hidden="true"> *</span>;

/** Labels of the study fields change with the participant's category. */
const STUDY_LABELS: Record<UserType, { institution: string; institutionHint: string; unit: string; unitHint: string; year: string }> = {
  student: { institution: 'Universitate', institutionHint: 'Ex.: UMF „Carol Davila” București', unit: 'Facultate', unitHint: 'Ex.: Medicină', year: 'An de studiu' },
  elev: { institution: 'Liceu', institutionHint: 'Numele liceului', unit: 'Profil', unitHint: 'Ex.: Real · Științe ale naturii', year: 'Clasa' },
  rezident: { institution: 'Spital / unitate', institutionHint: 'Unde îți desfășori rezidențiatul', unit: 'Specialitate', unitHint: 'Ex.: Chirurgie generală', year: 'An de rezidențiat' },
};
const CATEGORIES: { value: UserType; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'elev', label: 'Elev' },
  { value: 'rezident', label: 'Rezident' },
];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const yearLabel = (userType: UserType, year: number) => userType === 'elev' ? `a ${ROMAN[year]}-a` : `Anul ${ROMAN[year]}`;

export default function ProfileForm() {
  const { isLoaded, user } = useUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userType, setUserType] = useState<UserType>('student');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [studyUnit, setStudyUnit] = useState('');
  const [studyYear, setStudyYear] = useState('');
  const [city, setCity] = useState('');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { user: mongoUser } = useMongoUser();

  useEffect(() => {
    if (user && mongoUser) {
      setFirstName(mongoUser.firstName ?? '');
      setLastName(mongoUser.lastName ?? '');
      setUserType((mongoUser.userType as UserType | undefined) ?? 'student');
      setPhone(mongoUser.phone ?? '');
      setInstitution(mongoUser.institution ?? '');
      setStudyUnit(mongoUser.studyUnit ?? '');
      setStudyYear(mongoUser.studyYear ? String(mongoUser.studyYear) : '');
      setCity(mongoUser.city ?? '');
    }
  }, [user, mongoUser]);

  const changeCategory = (next: UserType) => {
    setUserType(next);
    // A school class is not a year of study: keep the year only if it still applies.
    if (!studyYears(next).includes(Number(studyYear))) setStudyYear('');
  };

  // Submitted by hand rather than through the form's `action`: React resets a
  // form after an action, which blanks the controlled year <select>.
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      setError('');
      setMessage('');
      try {
        const result = await updateProfile(formData);
        if (!result.success) {
          setError(result.message);
          return;
        }
        setMessage(result.message);
        await user?.reload();
      } catch (err) {
        console.error('Error updating profile:', err);
        setError('A apărut o eroare la actualizarea profilului.');
      }
    });
  };

  if (!isLoaded) {
    return null;
  }

  const labels = STUDY_LABELS[userType];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div aria-live="polite">
        {message && <FormMessage message={message} type="success" />}
        {error && <FormMessage message={error} type="error" />}
      </div>

      <Card className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Date personale</h2>
        <p className="mt-1 text-sm text-muted-foreground">Numele apare pe bilet și pe diploma de participare.</p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className={labelClass}>Prenume{required}</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FaUser className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <input id="firstName" name="firstName" type="text" autoComplete="given-name" required maxLength={100} value={firstName} onChange={(e) => setFirstName(e.target.value)} className={`${inputClass} pl-10`} placeholder="Introduceți prenumele" />
            </div>
          </div>

          <div>
            <label htmlFor="lastName" className={labelClass}>Nume{required}</label>
            <input id="lastName" name="lastName" type="text" autoComplete="family-name" required maxLength={100} value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Introduceți numele" />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>Adresa de email</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FaEnvelope className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <input id="email" name="email" type="email" value={user?.emailAddresses[0]?.emailAddress || ''} disabled aria-describedby="email-hint" className={`${inputClass} cursor-not-allowed bg-muted pl-10 text-muted-foreground`} />
            </div>
            <p id="email-hint" className="mt-1 text-xs text-muted-foreground">Adresa de email nu poate fi modificată din această pagină.</p>
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>Telefon{required}</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FaPhone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={25} value={phone} onChange={(e) => setPhone(e.target.value)} aria-describedby="phone-hint" className={`${inputClass} pl-10`} placeholder="07xx xxx xxx" />
            </div>
            <p id="phone-hint" className="mt-1 text-xs text-muted-foreground">Îl folosim doar pentru anunțuri urgente legate de eveniment.</p>
          </div>
        </div>
      </Card>

      <Card className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Studii</h2>
        <p className="mt-1 text-sm text-muted-foreground">Câmpurile de mai jos se schimbă după categoria aleasă.</p>

        <fieldset className="mt-5">
          <legend className={labelClass}>Categorie{required}</legend>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(({ value, label }) => (
              <label
                key={value}
                className={`flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring ${userType === value ? 'border-accent/60 bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:bg-muted'}`}
              >
                <input type="radio" name="userType" value={value} checked={userType === value} onChange={() => changeCategory(value)} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="institution" className={labelClass}>{labels.institution}{required}</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FaUniversity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <input id="institution" name="institution" type="text" autoComplete="organization" required minLength={2} maxLength={150} value={institution} onChange={(e) => setInstitution(e.target.value)} className={`${inputClass} pl-10`} placeholder={labels.institutionHint} />
            </div>
          </div>

          <div>
            <label htmlFor="studyUnit" className={labelClass}>{labels.unit}</label>
            <input id="studyUnit" name="studyUnit" type="text" maxLength={150} value={studyUnit} onChange={(e) => setStudyUnit(e.target.value)} className={inputClass} placeholder={labels.unitHint} />
          </div>

          <div>
            <label htmlFor="studyYear" className={labelClass}>{labels.year}</label>
            <select id="studyYear" name="studyYear" value={studyYear} onChange={(e) => setStudyYear(e.target.value)} className={inputClass}>
              <option value="">Alege…</option>
              {studyYears(userType).map(year => <option key={year} value={year}>{yearLabel(userType, year)}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="city" className={labelClass}>Oraș</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FaMapMarkerAlt className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <input id="city" name="city" type="text" autoComplete="address-level2" maxLength={100} value={city} onChange={(e) => setCity(e.target.value)} className={`${inputClass} pl-10`} placeholder="Ex.: București" />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Câmpurile marcate cu <span className="text-destructive">*</span> sunt obligatorii pentru a cumpăra bilet.
        </p>
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-accent/50 bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
              Se salvează...
            </>
          ) : (
            <>
              <FaSave className="h-4 w-4" aria-hidden="true" />
              Salvează modificările
            </>
          )}
        </button>
      </div>
    </form>
  );
}
