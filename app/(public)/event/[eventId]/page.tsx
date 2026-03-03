import { EventPageClient } from "./EventPageClient";

// Required for static export with dynamic routes
export function generateStaticParams() {
  return [
    { eventId: "demo" },
    { eventId: "test" },
  ];
}

interface EventPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { eventId } = await params;
  return <EventPageClient eventId={eventId} />;
}
