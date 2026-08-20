import { useUser } from '@clerk/nextjs';
import Card from '@/components/ui/Card';
import { UserType } from '@/types/models';

interface AccountInfoProps {
  userType: UserType;
}

export default function AccountInfo({ userType }: AccountInfoProps) {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  return (
    <Card className="px-4 py-5 sm:p-6">
      <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
        Informații cont
      </h3>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Data înregistrării
          </dt>
          <dd className="mt-1 text-sm text-foreground">
            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ro-RO') : 'N/A'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Ultima actualizare
          </dt>
          <dd className="mt-1 text-sm text-foreground">
            {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('ro-RO') : 'N/A'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Tip utilizator
          </dt>
          <dd className="mt-1 text-sm text-foreground">
            {userType === 'student' && 'Student'}
            {userType === 'elev' && 'Elev'}
            {userType === 'rezident' && 'Rezident'}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
