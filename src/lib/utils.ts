import axios from "axios"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Axios instance for client-side API calls.
 *
 * IMPORTANT: Never read localStorage at module scope (breaks SSR/build).
 * We inject the token at request time.
 */
export const api = axios.create();

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("token");
    if (token) {
      config.headers = config.headers ?? {};
      // Prefer Bearer, but keep backwards compatibility server-side.
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});