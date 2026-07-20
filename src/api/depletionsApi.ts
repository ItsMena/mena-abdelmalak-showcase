import type {
  DepletionsResponse,
  SaveDepletionsRequest,
  SaveDepletionsResponse,
} from '../types';
import { RAW_ACCOUNTS, seedDepletions } from '../data/seed';

// A stand-in for a real HTTP client. It's deliberately slow and fails ~25% of
// the time on writes — a save path that only works on a fast, reliable network
// is a save path that hasn't been tested. Swapping these two functions for
// `fetch(...)` calls would leave everything downstream untouched.

export const network = {
  failureRate: 0.25,
  minLatencyMs: 500,
  maxLatencyMs: 1400,
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const latency = () =>
  network.minLatencyMs + Math.random() * (network.maxLatencyMs - network.minLatencyMs);

// GET /api/v1/depletions
export async function fetchDepletions(): Promise<DepletionsResponse> {
  await wait(latency());
  return {
    meta: {
      generatedAt: new Date().toISOString(),
      periodStart: '2026-01-01',
      periodEnd: '2026-06-30',
      unit: 'cases',
    },
    accounts: RAW_ACCOUNTS,
    depletions: seedDepletions(),
  };
}

// POST /api/v1/depletions:save
export async function saveDepletions(
  request: SaveDepletionsRequest,
): Promise<SaveDepletionsResponse> {
  await wait(latency());
  if (Math.random() < network.failureRate) {
    throw new Error('Upstream save failed (simulated network error)');
  }
  // The real server would validate per-change and could partially reject;
  // here everything is accepted, and `savedAt` is its authoritative timestamp.
  return { savedAt: new Date().toISOString(), accepted: request.changes, rejected: [] };
}
