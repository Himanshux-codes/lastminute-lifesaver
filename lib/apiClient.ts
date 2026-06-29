"use client";

import { auth } from "@/lib/firebase";

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error ?? `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
