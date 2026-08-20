import Card from '@/components/ui/Card';

export default function ProfileHeader() {
  return (
    <Card className="px-4 py-5 sm:p-6">
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Profilul meu
      </h1>
      <p className="text-muted-foreground">
        Actualizați informațiile contului dumneavoastră.
      </p>
    </Card>
  );
}
