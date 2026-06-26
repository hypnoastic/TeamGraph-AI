import axios from 'axios';

import { API_BASE_URL } from './config';

const cache = new Map<string, any>();

export function getCachedData<T>(key: string): T | null {
  return cache.get(key) || null;
}

export function setCachedData(key: string, data: any): void {
  cache.set(key, data);
}

export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('teamgraph_token');
}

export function createApiClient(authenticated = true) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (authenticated && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return axios.create({
    baseURL: API_BASE_URL,
    headers,
  });
}

export async function apiGet<T>(path: string, authenticated = true): Promise<T> {
  const client = createApiClient(authenticated);
  const response = await client.get<T>(path);
  return response.data;
}

export async function apiPost<T>(path: string, data?: unknown, authenticated = true): Promise<T> {
  const client = createApiClient(authenticated);
  const response = await client.post<T>(path, data);
  return response.data;
}

export async function apiPatch<T>(path: string, data?: unknown, authenticated = true): Promise<T> {
  const client = createApiClient(authenticated);
  const response = await client.patch<T>(path, data);
  return response.data;
}

export async function apiDelete<T>(path: string, authenticated = true): Promise<T> {
  const client = createApiClient(authenticated);
  const response = await client.delete<T>(path);
  return response.data;
}
