import { useAuthStore } from "@/store/auth-store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://oracle69-ai-digital-office.onrender.com/api";

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout();
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.statusText}`);
  }

  return response.json();
}
