import type {
    BatchFile,
    BatchResponse,
    Language,
    RemoveResponse,
  } from '../types';
  
  const BASE = import.meta.env.VITE_API_BASE ?? '';
  
  class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
      this.name = 'ApiError';
    }
  }
  
  async function request<T>(
    path: string,
    init?: RequestInit,
    timeout = 30_000
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
  
    try {
      const res = await fetch(`${BASE}${path}`, {
        ...init,
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      });
  
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
  
      if (!res.ok) {
        const msg = data?.error ?? `HTTP ${res.status}`;
        throw new ApiError(res.status, msg);
      }
  
      return data as T;
    } finally {
      clearTimeout(timer);
    }
  }
  
  export const api = {
    languages(): Promise<{ languages: Language[] }> {
      return request('/.netlify/functions/remove?action=languages', { method: 'GET' });
    },
  
    remove(code: string, language: string, minify = false): Promise<RemoveResponse> {
      return request('/.netlify/functions/remove', {
        method: 'POST',
        body: JSON.stringify({ code, language, minify }),
      });
    },
  
    batch(files: BatchFile[]): Promise<BatchResponse> {
      return request('/.netlify/functions/batch', {
        method: 'POST',
        body: JSON.stringify({ files }),
      }, 60_000);
    },
  
    health(): Promise<{ status: string; storage: string }> {
      return request('/.netlify/functions/health', { method: 'GET' }, 5_000);
    },
  };
  
  export { ApiError };