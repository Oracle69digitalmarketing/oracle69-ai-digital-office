"use client";

import { useEffect, useState } from "react";
import { fetchAuthenticated } from "@/lib/api-client";
import { Card, LoadingSkeleton, EmptyState } from "@oracle69/ui";

interface Setting {
  id: string;
  key: string;
  value: unknown;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await fetchAuthenticated("/settings/me");
        setSettings(data);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading)
    return (
      <div className="p-8">
        <LoadingSkeleton className="h-64" />
      </div>
    );

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      {settings.length === 0 ? (
        <EmptyState
          title="No settings configured"
          description="Your user or organization settings are not yet configured."
        />
      ) : (
        <Card>
          <div className="divide-y">
            {settings.map((setting) => (
              <div key={setting.id} className="flex justify-between py-4">
                <span className="font-medium text-gray-700">{setting.key}</span>
                <span className="text-gray-900">{JSON.stringify(setting.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
