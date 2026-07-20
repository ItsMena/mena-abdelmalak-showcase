import { createSelector } from 'reselect';
import type { RootState } from './store';
import { cellId } from '../api/mapDepletions';

// Totals and run-rate are derived state — computed, never stored. Storing a
// total means keeping it in sync with every edit, and that desync is where
// dashboards start lying. reselect memoizes each one so it recomputes only
// when its inputs change, not on every render.

const selectCells = (state: RootState) => state.depletions.cells;
const selectAccounts = (state: RootState) => state.depletions.accounts;
const selectPeriods = (state: RootState) => state.depletions.periods;

export const selectColumnTotals = createSelector(
  [selectCells, selectAccounts, selectPeriods],
  (cells, accounts, periods) => {
    const totals: Record<string, number> = {};
    for (const period of periods) {
      let sum = 0;
      for (const account of accounts) sum += cells[cellId(account.id, period.iso)]?.value ?? 0;
      totals[period.iso] = sum;
    }
    return totals;
  },
);

export const selectRowTotals = createSelector(
  [selectCells, selectAccounts, selectPeriods],
  (cells, accounts, periods) => {
    const totals: Record<string, number> = {};
    for (const account of accounts) {
      let sum = 0;
      for (const period of periods) sum += cells[cellId(account.id, period.iso)]?.value ?? 0;
      totals[account.id] = sum;
    }
    return totals;
  },
);

export const selectGrandTotal = createSelector([selectColumnTotals], (cols) =>
  Object.values(cols).reduce((a, b) => a + b, 0),
);

// Average monthly depletion across the loaded periods.
export const selectRunRate = createSelector(
  [selectGrandTotal, selectPeriods],
  (grand, periods) => (periods.length ? Math.round(grand / periods.length) : 0),
);

export const selectDirtyCount = createSelector([selectCells], (cells) =>
  Object.values(cells).filter((c) => c.value !== c.savedValue).length,
);
