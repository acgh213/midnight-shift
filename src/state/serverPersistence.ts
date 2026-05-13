import type { GameState } from '../types/game';

const API_BASE = '/api';

async function apiPut(path: string, body: unknown): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function apiGet(path: string): Promise<Response> {
  return fetch(`${API_BASE}${path}`);
}

async function apiDelete(path: string): Promise<Response> {
  return fetch(`${API_BASE}${path}`, { method: 'DELETE' });
}

export async function serverSave(state: GameState, id = 'default', crewName = ''): Promise<boolean> {
  try {
    const res = await apiPut(`/save?id=${encodeURIComponent(id)}&crew=${encodeURIComponent(crewName)}`, state);
    return res.ok;
  } catch {
    return false;
  }
}

export async function serverLoad(id = 'default'): Promise<GameState | null> {
  try {
    const res = await apiGet(`/save?id=${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function serverDelete(id = 'default'): Promise<boolean> {
  try {
    const res = await apiDelete(`/save?id=${encodeURIComponent(id)}`);
    return res.ok;
  } catch {
    return false;
  }
}
