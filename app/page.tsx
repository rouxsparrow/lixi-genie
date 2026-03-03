"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type PublicEventItem = {
  id: string;
  slug: string;
  name: string;
  state: string;
  phase: "office" | "remote";
};

export default function HomePage() {
  const router = useRouter();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [events, setEvents] = useState<PublicEventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const openEventPicker = async () => {
    setIsPickerOpen(true);
    if (events.length > 0 || isLoadingEvents) {
      return;
    }

    setIsLoadingEvents(true);
    setEventsError(null);

    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      const json = (await res.json()) as {
        events?: PublicEventItem[];
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load events");
      }
      setEvents(json.events ?? []);
    } catch (error) {
      setEventsError(error instanceof Error ? error.message : "Failed to load events");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  return (
    <div className="min-h-dvh bg-lixi-cream flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.1)] text-center">
          <div className="text-6xl mb-4">🧧</div>

          <h1 className="text-2xl font-black text-lixi-red mb-2">Lucky Draw</h1>
          <p className="text-gray-600 mb-8">Fair, transparent, and verifiable lucky draw</p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={openEventPicker}
              className="block w-full py-4 bg-gradient-to-b from-lixi-red to-lixi-red-dark text-white font-bold rounded-2xl shadow-[0_6px_0_#B71C1C,0_8px_16px_rgba(229,57,53,0.3)] hover:translate-y-0.5 transition-all"
            >
              🎉 Join Event
            </button>

            <Link
              href="/verify"
              className="block w-full py-3 bg-white border-2 border-lixi-gold text-lixi-gold font-bold rounded-2xl hover:bg-lixi-gold/5 transition-colors"
            >
              🔐 Verify Audit
            </Link>

            <Link
              href="/admin"
              className="block w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-2xl hover:bg-gray-200 transition-colors"
            >
              ⚙️ Admin Panel
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">Production MVP</p>
      </div>

      {isPickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setIsPickerOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl border border-lixi-gold/20 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Choose Event</h2>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {isLoadingEvents && <p className="text-sm text-gray-600">Loading events...</p>}
            {eventsError && <p className="text-sm text-red-600">{eventsError}</p>}

            {!isLoadingEvents && !eventsError && events.length === 0 && (
              <p className="text-sm text-gray-600">No events available right now.</p>
            )}

            {!isLoadingEvents && !eventsError && events.length > 0 && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {events.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => router.push(`/event/${event.slug}`)}
                    className="w-full text-left rounded-xl border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-semibold text-gray-800">{event.name}</p>
                    <p className="text-xs text-gray-500">
                      /event/{event.slug} • {event.state} • {event.phase}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
