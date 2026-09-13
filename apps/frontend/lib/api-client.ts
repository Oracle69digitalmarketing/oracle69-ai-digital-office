import { useAuthStore } from "@/store/auth-store";

export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "") + "/api";

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  organizationId: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

/**
 * Auth endpoints must never trigger the refresh flow.
 * Login/register are public; refresh/logout use direct raw fetch helpers below.
 */
function isAuthEndpoint(endpoint: string): boolean {
  return endpoint.startsWith("/auth/");
}

/**
 * Shared single-flight refresh promise.
 * Concurrent 401s await the SAME promise so only one /auth/refresh is sent.
 * Cleared in `finally` so later 401s start a fresh rotation.
 */
let refreshPromise: Promise<AuthResponse> | null = null;

async function requestRefresh(): Promise<AuthResponse> {
  const currentRefreshToken = useAuthStore.getState().refreshToken;
  if (!currentRefreshToken) {
    useAuthStore.getState().logout();
    throw new Error("API error: 401 Unauthorized");
  }

  // Direct raw fetch: no Authorization header, no fetchAuthenticated, no recursion.
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: currentRefreshToken }),
  });

  if (!response.ok) {
    // Terminal failure: clear the local session, do not retry.
    useAuthStore.getState().logout();
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as AuthResponse;

  // Atomically replace the token pair and the authoritative user object.
  // The old refresh token must never be retained after successful rotation.
  useAuthStore.getState().setToken(data.access_token);
  useAuthStore.getState().setRefreshToken(data.refresh_token);
  useAuthStore.getState().setUser(data.user);

  return data;
}

export function refreshSession(): Promise<AuthResponse> {
  if (!refreshPromise) {
    refreshPromise = requestRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * Best-effort server logout.
 * Captures the refresh token BEFORE clearing the store, revokes it server-side,
 * and always clears the local session — even if the backend is unreachable.
 * Never triggers refresh.
 */
export async function logoutSession(): Promise<void> {
  const currentRefreshToken = useAuthStore.getState().refreshToken;
  try {
    if (currentRefreshToken) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: currentRefreshToken }),
      });
    }
  } catch {
    // Best-effort: local logout completes regardless of backend availability.
  }
  useAuthStore.getState().logout();
}

function buildHeaders(token: string | null, callerHeaders?: HeadersInit) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...callerHeaders,
  };
}

export async function fetchAuthenticated(endpoint: string, options: RequestInit = {}) {
  const { headers: callerHeaders, ...rest } = options;

  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: buildHeaders(token, callerHeaders as HeadersInit),
  });

  if (response.status !== 401 || isAuthEndpoint(endpoint)) {
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  // Exactly one refresh attempt for this request via the single-flight mechanism.
  let refreshed: AuthResponse;
  try {
    refreshed = await refreshSession();
  } catch {
    // Refresh failure already cleared the local session; terminal error.
    throw new Error("API error: 401 Unauthorized");
  }

  // Retry the ORIGINAL request once with the NEW access token.
  const retry = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: buildHeaders(refreshed.access_token, callerHeaders as HeadersInit),
  });

  if (!retry.ok) {
    if (retry.status === 401) {
      // Retry also unauthorized: clear the local session, no further refresh.
      useAuthStore.getState().logout();
    }
    throw new Error(`API error: ${retry.status} ${retry.statusText}`);
  }

  return retry.json();
}

export const apiClient = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  return fetchAuthenticated(endpoint, options);
};

apiClient.get = <T>(endpoint: string) =>
  fetchAuthenticated(endpoint, { method: "GET" }) as Promise<T>;
apiClient.post = <T>(endpoint: string, data: unknown) =>
  fetchAuthenticated(endpoint, { method: "POST", body: JSON.stringify(data) }) as Promise<T>;
apiClient.patch = <T>(endpoint: string, data: unknown) =>
  fetchAuthenticated(endpoint, { method: "PATCH", body: JSON.stringify(data) }) as Promise<T>;
