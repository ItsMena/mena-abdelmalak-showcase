import type {
  DepletionsResponse,
  SaveDepletionsRequest,
  SaveDepletionsResponse,
} from '../types';
import { RAW_ACCOUNTS, seedDepletions } from '../data/seed';

export const network = {
  failureRate: 0.25,
  minLatencyMs: 500,
  maxLatencyMs: 1400,
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const latency = () =>
  network.minLatencyMs + Math.random() * (network.maxLatencyMs - network.minLatencyMs);

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

export async function saveDepletions(
  request: SaveDepletionsRequest,
): Promise<SaveDepletionsResponse> {
  await wait(latency());
  if (Math.random() < network.failureRate) {
    throw new Error('Upstream save failed (simulated network error)');
  }
  return { savedAt: new Date().toISOString(), accepted: request.changes, rejected: [] };
}
