import { getAllWorkshops, getIsRegisteredForWorkshop } from '@/app/workshops/actions';
import type { Workshop } from '@/types/models';
import WorkshopListClient from './WorkshopListClient';

interface WorkshopListProps {
  workshopVisibleToPublic: boolean;
}

type ExtendedWorkshop = {
  isRegistered: boolean;
} & Workshop;

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export default async function WorkshopList({ workshopVisibleToPublic }: WorkshopListProps) {
  // If workshops are not visible to public, show coming soon message
  if (!workshopVisibleToPublic) {
    return null;
  }

  const workshops = await getAllWorkshops();

  // Resolve registration status for each workshop in parallel
  const extendedWorkshops: ExtendedWorkshop[] = await Promise.all(
    workshops.map(async (w) => {
      const workshopId = w._id?.toString();
      if (!isString(workshopId)) {
        // Handle the case where workshopId is not a string, for example by skipping the workshop
        return null;
      }
      const isRegistered = await getIsRegisteredForWorkshop(workshopId);
      return { ...w, isRegistered };
    })
  ).then(results => results.filter(Boolean) as ExtendedWorkshop[]);

  if (extendedWorkshops.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          Nu sunt workshop-uri disponibile momentan.
        </p>
      </div>
    );
  }

  const plainWorkshops = extendedWorkshops.map(w => {
    const workshopId = w._id ? w._id.toString() : (w.id || '');
    return {
      _id: workshopId,
      id: workshopId,
      title: w.title,
      description: w.description,
      date: w.date ? new Date(w.date).toISOString() : '',
      time: w.time,
      location: w.location,
      maxParticipants: w.maxParticipants,
      currentParticipants: w.currentParticipants,
      instructor: w.instructor,
      status: w.status,
      wsType: w.wsType,
      url: w.url,
      isRegistered: w.isRegistered,
      createdAt: w.createdAt ? new Date(w.createdAt).toISOString() : '',
      updatedAt: w.updatedAt ? new Date(w.updatedAt).toISOString() : '',
    };
  });

  return <WorkshopListClient initialWorkshops={plainWorkshops} />;
}