// API contract — the exact wire shapes the (mock) backend sends and receives.
// These are kept deliberately separate from the domain types: the server
// speaks snake-ish enums and ISO strings, the UI speaks something friendlier,
// and the mapper layer is the single place that translates between them.

// ── GET /api/v1/depletions ──────────────────────────────────────────────────
export interface DepletionsResponse {
  meta: {
    generatedAt: string; // ISO-8601, e.g. '2026-07-16T14:32:05.118Z'
    periodStart: string; // 'YYYY-MM-DD'
    periodEnd: string; // 'YYYY-MM-DD'
    unit: 'cases';
  };
  accounts: AccountDTO[];
  depletions: DepletionRecordDTO[];
}

export interface AccountDTO {
  id: string;
  name: string;
  channel: 'ON_PREMISE' | 'OFF_PREMISE';
}

export interface DepletionRecordDTO {
  accountId: string;
  period: string; // 'YYYY-MM'
  units: number;
}

// ── POST /api/v1/depletions:save ────────────────────────────────────────────
export interface DepletionChangeDTO {
  accountId: string;
  period: string; // 'YYYY-MM'
  units: number;
}

export interface SaveDepletionsRequest {
  idempotencyKey: string; // lets the server dedupe a retried save safely
  changes: DepletionChangeDTO[];
}

export interface SaveDepletionsResponse {
  savedAt: string; // ISO-8601 server timestamp
  accepted: DepletionChangeDTO[];
  rejected: { accountId: string; period: string; reason: string }[];
}
