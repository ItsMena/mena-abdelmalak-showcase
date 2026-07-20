// Domain types — the shapes the UI and store reason about, after the raw API
// payload has been mapped into something convenient to render.

export type Channel = 'On-Premise' | 'Off-Premise';

export interface Account {
  id: string;
  name: string;
  channel: Channel;
}

// A reporting month, carrying both the key the API speaks ('2026-01') and the
// label we show in the column header ('Jan').
export interface PeriodDef {
  iso: string; // 'YYYY-MM'
  label: string; // 'Jan'
}

export type CellStatus = 'clean' | 'dirty' | 'saving' | 'error';

// A grid cell tracks its on-screen `value` and the server-confirmed
// `savedValue` separately; `status` is derived from the two.
export interface CellState {
  value: number;
  savedValue: number;
  status: CellStatus;
}

// The grid is stored flat, keyed by `${accountId}:${periodIso}`, so any cell
// is an O(1) lookup rather than a scan through nested rows.
export type Cells = Record<string, CellState>;
