export type Channel = 'On-Premise' | 'Off-Premise';

export interface Account {
  id: string;
  name: string;
  channel: Channel;
}

export interface PeriodDef {
  iso: string;
  label: string;
}

export type CellStatus = 'clean' | 'dirty' | 'saving' | 'error';

export interface CellState {
  value: number;
  savedValue: number;
  status: CellStatus;
}

export type Cells = Record<string, CellState>;
