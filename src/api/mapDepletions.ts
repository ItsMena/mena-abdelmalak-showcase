import type {
  Account,
  AccountDTO,
  Cells,
  Channel,
  DepletionsResponse,
  PeriodDef,
  SaveDepletionsRequest,
} from '../types';

// The single translation layer between the API's wire format and the shapes
// the UI renders. Pure functions — no state, no side effects, trivial to test.

// Grid cells are stored flat, keyed by account + period. Composing and parsing
// that key lives here so the format is defined in exactly one place.
export const cellId = (accountId: string, periodIso: string) => `${accountId}:${periodIso}`;
export const parseCellId = (id: string): { accountId: string; period: string } => {
  const [accountId, period] = id.split(':');
  return { accountId, period };
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// '2026-01' -> 'Jan'
export const monthLabel = (iso: string): string => MONTHS[Number(iso.slice(5, 7)) - 1] ?? iso;

// Server enum -> display label.
export const channelLabel = (channel: AccountDTO['channel']): Channel =>
  channel === 'ON_PREMISE' ? 'On-Premise' : 'Off-Premise';

/**
 * The heart of it: turn the raw GET payload into everything the grid renders —
 * display-ready accounts, the ordered period columns, and the flat, keyed cell
 * map that makes any cell an O(1) lookup.
 */
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

/**
 * The reverse trip: collect the cells whose on-screen value differs from the
 * server-confirmed one, and shape them into the POST body. Defining "changed"
 * by the data (not the visual status) keeps it correct regardless of labels.
 */
export function toSaveRequest(cells: Cells): SaveDepletionsRequest {
  const changes = Object.entries(cells)
    .filter(([, cell]) => cell.value !== cell.savedValue)
    .map(([id, cell]) => {
      const { accountId, period } = parseCellId(id);
      return { accountId, period, units: cell.value };
    });

  return { idempotencyKey: crypto.randomUUID(), changes };
}
