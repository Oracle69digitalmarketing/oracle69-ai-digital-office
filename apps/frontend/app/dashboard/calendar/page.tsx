"use client";

import { useEffect, useState } from "react";
import { fetchAuthenticated } from "@/lib/api-client";
import { Card, LoadingSkeleton, EmptyState, Button } from "@oracle69/ui";
import { Calendar as CalendarIcon, Plus } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await fetchAuthenticated("/calendar");
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch calendar events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Add Event
        </Button>
      </div>

      {loading ? (
        <LoadingSkeleton className="h-64" />
      ) : events.length === 0 ? (
        <EmptyState
          title="No calendar events"
          description="Create your first calendar event to begin tracking your schedule."
          action={<Button>Create Event</Button>}
        />
      ) : (
        <Card>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="text-indigo-600" />
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.start).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
