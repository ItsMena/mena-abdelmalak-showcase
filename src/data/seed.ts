import type { AccountDTO, DepletionRecordDTO } from '../types';

export const PERIOD_ISOS = [
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
] as const;

export const RAW_ACCOUNTS: AccountDTO[] = [
  { id: 'acc-01', name: 'Harbor & Vine', channel: 'ON_PREMISE' },
  { id: 'acc-02', name: 'Copper Still Co.', channel: 'OFF_PREMISE' },
  { id: 'acc-03', name: 'The Tasting Room', channel: 'ON_PREMISE' },
  { id: 'acc-04', name: 'Meridian Market', channel: 'OFF_PREMISE' },
  { id: 'acc-05', name: 'Lantern Public House', channel: 'ON_PREMISE' },
  { id: 'acc-06', name: 'Grove Fine Wines', channel: 'OFF_PREMISE' },
  { id: 'acc-07', name: 'Dockside Cellars', channel: 'OFF_PREMISE' },
  { id: 'acc-08', name: 'The Alder Room', channel: 'ON_PREMISE' },
];

function seedUnits(accountId: string, periodIndex: number): number {
  const base = accountId.charCodeAt(4) + accountId.charCodeAt(5);
  return ((base * 13 + periodIndex * 21 + 3) % 140) + 20;
}

export function seedDepletions(): DepletionRecordDTO[] {
  const records: DepletionRecordDTO[] = [];
  for (const account of RAW_ACCOUNTS) {
    PERIOD_ISOS.forEach((period, i) => {
      records.push({ accountId: account.id, period, units: seedUnits(account.id, i) });
    });
  }
  return records;
}
