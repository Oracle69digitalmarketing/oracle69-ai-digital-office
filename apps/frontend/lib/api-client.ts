import { useAuthStore } from "@/store/auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchAuthenticated(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const apiClient = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  return fetchAuthenticated(endpoint, options);
};

apiClient.get = <T>(endpoint: string) => fetchAuthenticated(endpoint, { method: 'GET' }) as Promise<T>;
apiClient.post = <T>(endpoint: string, data: unknown) => fetchAuthenticated(endpoint, { method: 'POST', body: JSON.stringify(data) }) as Promise<T>;
apiClient.patch = <T>(endpoint: string, data: unknown) => fetchAuthenticated(endpoint, { method: 'PATCH', body: JSON.stringify(data) }) as Promise<T>;
