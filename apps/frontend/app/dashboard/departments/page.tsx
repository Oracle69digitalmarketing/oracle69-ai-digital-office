"use client";

import { useEffect, useState } from "react";
import { Building, Users } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Card, EmptyState, LoadingSkeleton, Button } from "@oracle69/ui";

interface Department {
  id: string;
  name: string;
  head: string;
  memberCount: number;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const data = await apiClient<Department[]>("/departments");
        setDepartments(data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        setError("Failed to load departments.");
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold text-gray-900">Departments</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <LoadingSkeleton key={i} className="h-40" />
            ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Failed to load departments"
          description={error}
          action={<Button onClick={() => window.location.reload()}>Retry</Button>}
        />
      ) : departments.length === 0 ? (
        <EmptyState
          title="No departments found"
          description="Organizational structure data is not yet available."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Card key={dept.id} className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
                  <Building className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{dept.name}</h2>
                  <p className="text-sm text-gray-500">Head: {dept.head}</p>
                </div>
              </div>
              <div className="flex items-center text-gray-500">
                <Users className="h-4 w-4 mr-2" />
                <span className="text-sm">{dept.memberCount} members</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
