import type { NewsItem, TopPick } from "@dbp/shared";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: { accept: "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function fetchTopPicks(params: { limit?: number; category?: string; sport?: string } = {}): Promise<{
  picks: TopPick[];
  refreshedAt: string;
}> {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  if (params.category) search.set("category", params.category);
  if (params.sport) search.set("sport", params.sport);
  const qs = search.toString();
  return get<{ picks: TopPick[]; refreshedAt: string }>(`/v1/top-picks${qs ? `?${qs}` : ""}`);
}

export async function fetchRecommendation(id: string): Promise<unknown> {
  return get(`/v1/recommendations/${id}`);
}

export async function fetchNews(params: { eventId?: string; limit?: number } = {}): Promise<{ news: NewsItem[] }> {
  const search = new URLSearchParams();
  if (params.eventId) search.set("eventId", params.eventId);
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return get<{ news: NewsItem[] }>(`/v1/news${qs ? `?${qs}` : ""}`);
}

export async function fetchPerformance(): Promise<{
  summary: { totalRecommendations: number; hitRate: number; roi: number; avgEdge: number; avgClosingLineValue: number; modelVersion: string; sampleSize: number };
  byDay: Array<{ date: string; recommendations: number; hitRate: number; roi: number }>;
  bySport: Array<{ sport: string; hitRate: number; roi: number }>;
  warning: string;
}> {
  return get(`/v1/performance`);
}

export async function fetchSports(): Promise<{ sports: Array<{ id: string; key: string; displayName: string; active: boolean }> }> {
  return get(`/v1/sports`);
}

export async function fetchComplianceMode(): Promise<{ productMode: string; globalKillSwitch: boolean; notice: string }> {
  return get(`/v1/compliance/mode`);
}

export interface IntegrationCatalogEntry {
  key: string;
  displayName: string;
  description: string;
  supportsRealMoney: boolean;
  setupUrl?: string;
  fields: Array<{ name: string; label: string; type: "text" | "password" | "textarea"; placeholder?: string; required?: boolean; help?: string }>;
}

export interface IntegrationRecord {
  key: string;
  enabled: boolean;
  credentials: Record<string, string>;
  updatedAt: string;
  lastTestAt?: string;
  lastTestOk?: boolean;
  lastTestError?: string;
}

export async function fetchIntegrationCatalog(): Promise<{ catalog: IntegrationCatalogEntry[] }> {
  return get(`/v1/admin/integrations/catalog`);
}

export async function fetchIntegrations(): Promise<{ integrations: Array<IntegrationRecord | null> }> {
  return get(`/v1/admin/integrations`);
}
