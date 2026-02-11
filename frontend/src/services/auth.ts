import api from "./api";

const TOKEN_KEY = "dialoghero_token";

export interface AuthUser {
  id: number;
  email: string;
  display_name: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
  localStorage.setItem(TOKEN_KEY, data.access_token);
  return data;
}

export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", {
    email,
    password,
    display_name: displayName || null,
  });
  localStorage.setItem(TOKEN_KEY, data.access_token);
  return data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/me");
  return data;
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
