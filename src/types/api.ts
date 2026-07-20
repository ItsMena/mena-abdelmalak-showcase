export interface DepletionsResponse {
  meta: {
    generatedAt: string;
    periodStart: string;
    periodEnd: string;
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
  period: string;
  units: number;
}

export interface DepletionChangeDTO {
  accountId: string;
  period: string;
  units: number;
}

export interface SaveDepletionsRequest {
  idempotencyKey: string;
  changes: DepletionChangeDTO[];
}

export interface SaveDepletionsResponse {
  savedAt: string;
  accepted: DepletionChangeDTO[];
  rejected: { accountId: string; period: string; reason: string }[];
}
