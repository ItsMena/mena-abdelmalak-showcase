import type {
  Account,
  AccountDTO,
  Cells,
  Channel,
  DepletionsResponse,
  PeriodDef,
  SaveDepletionsRequest,
} from '../types';

// The single translation layer between the API's wire format and the domain
// shapes the UI works with. Pure functions, no side effects — trivial to read,
// trivial to unit test.

// Grid cells are keyed flat. Composing and parsing that key lives here so the
// format is defined in exactly one place.
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
 * The core "generate the grid from the response" step. Takes the raw GET
 * payload and produces everything the grid renders: display-ready accounts,
 * the ordered list of period columns, and the flat, keyed cell map.
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
 * The reverse trip: collect the cells that need saving and shape them into the
 * POST body. "Needs saving" is defined by data, not by the presentational
 * `status` — a cell is unsaved whenever its on-screen value differs from the
 * server-confirmed one. That keeps this correct no matter what label the cell
 * is wearing (`dirty` while editing, `saving` once a write is in flight).
 * An idempotency key lets the server safely dedupe a retried save.
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
