const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

function buildHeaders(init?: HeadersInit, body?: BodyInit | null) {
  const headers = new Headers(init);
  const token = getToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export function getApiUrl(endpoint: string) {
  return `${API_URL}${endpoint}`;
}

export async function apiFetch(endpoint: string, init: RequestInit = {}) {
  return fetch(getApiUrl(endpoint), {
    ...init,
    headers: buildHeaders(init.headers, init.body),
  });
}

export async function apiJson<T>(endpoint: string, init: RequestInit = {}) {
  const response = await apiFetch(endpoint, init);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && "message" in data && data.message) ||
      (data && typeof data === "object" && "error" in data && data.error) ||
      "Request failed";
    throw new Error(String(message));
  }

  return data as T;
}

export const api = {
  login: async (email: string, password: string) =>
    apiJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: async (name: string, email: string, password: string, isAdmin: boolean) =>
    apiJson("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, isAdmin }),
    }),

  getMe: async () => apiJson("/api/auth/me"),

  getUsers: async () => apiJson("/api/admin/users"),

  createUser: async (name: string, email: string, password: string, isAdmin: boolean) =>
    apiJson("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ name, email, password, isAdmin }),
    }),

  updateUser: async (userId: string, name: string, email: string, isAdmin: boolean) =>
    apiJson(`/api/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ name, email, isAdmin }),
    }),

  deleteUser: async (userId: string) =>
    apiJson(`/api/admin/users/${userId}`, {
      method: "DELETE",
    }),
};
