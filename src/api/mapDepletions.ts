import type {
  Account,
  AccountDTO,
  Cells,
  Channel,
  DepletionsResponse,
  PeriodDef,
  SaveDepletionsRequest,
} from '../types';

export const cellId = (accountId: string, periodIso: string) => `${accountId}:${periodIso}`;

export const parseCellId = (id: string): { accountId: string; period: string } => {
  const [accountId, period] = id.split(':');
  return { accountId, period };
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const monthLabel = (iso: string): string => MONTHS[Number(iso.slice(5, 7)) - 1] ?? iso;

export const channelLabel = (channel: AccountDTO['channel']): Channel =>
  channel === 'ON_PREMISE' ? 'On-Premise' : 'Off-Premise';

export function toGridState(res: DepletionsResponse): {
  accounts: Account[];
  periods: PeriodDef[];
  cells: Cells;
} {
  const accounts = res.accounts.map((a) => ({
    id: a.id,
    name: a.name,
    channel: channelLabel(a.channel),
  }));

  const periods: PeriodDef[] = [...new Set(res.depletions.map((d) => d.period))]
    .sort()
    .map((iso) => ({ iso, label: monthLabel(iso) }));

  const cells: Cells = {};
  for (const record of res.depletions) {
    cells[cellId(record.accountId, record.period)] = {
      value: record.units,
      savedValue: record.units,
      status: 'clean',
    };
  }

  return { accounts, periods, cells };
}

export function toSaveRequest(cells: Cells): SaveDepletionsRequest {
  const changes = Object.entries(cells)
    .filter(([, cell]) => cell.value !== cell.savedValue)
    .map(([id, cell]) => {
      const { accountId, period } = parseCellId(id);
      return { accountId, period, units: cell.value };
    });

  return { idempotencyKey: crypto.randomUUID(), changes };
}
