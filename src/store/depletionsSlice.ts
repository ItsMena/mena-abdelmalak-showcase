import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Account, Cells, PeriodDef } from '../types';
import type { SaveDepletionsResponse } from '../types';
import { fetchDepletions, saveDepletions } from '../api/depletionsApi';
import { cellId, toGridState, toSaveRequest } from '../api/mappers';

interface Snapshot {
  cells: Cells;
}

// The last completed API call, kept so the UI can show the real response that
// came back over the wire (endpoint + JSON body).
interface Exchange {
  endpoint: string;
  response: unknown;
}

export interface DepletionsState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  accounts: Account[];
  periods: PeriodDef[];

  // Undo/redo as three stacks; the reducers that mutate cells stay unaware
  // history exists.
  past: Snapshot[];
  present: Snapshot;
  future: Snapshot[];

  // Only the latest dispatched save may write back; older in-flight saves that
  // resolve afterwards are ignored.
  activeSaveId: string | null;
  lastSavedAt: string | null;
  lastError: string | null;
  exchange: Exchange | null;
}

const initialState: DepletionsState = {
  status: 'idle',
  accounts: [],
  periods: [],
  past: [],
  present: { cells: {} },
  future: [],
  activeSaveId: null,
  lastSavedAt: null,
  lastError: null,
  exchange: null,
};

// Serializing reads cleanly through the Immer draft proxy (cells are plain
// numbers/strings); `structuredClone` would choke on the proxy itself.
const clone = (snap: Snapshot): Snapshot => ({
  cells: JSON.parse(JSON.stringify(snap.cells)) as Cells,
});

const HISTORY_LIMIT = 50;

function commitToHistory(state: DepletionsState) {
  state.past.push(clone(state.present));
  if (state.past.length > HISTORY_LIMIT) state.past.shift();
  state.future = []; // a new edit invalidates the redo branch
}

// GET the grid: fetch the payload, hand it to the mapper, done.
export const loadDepletions = createAsyncThunk('depletions/load', () => fetchDepletions());

// Save: build the POST body from the dirty cells and send it. The mapper owns
// the request shape, so the thunk stays a thin orchestration step.
export const saveDirty = createAsyncThunk('depletions/save', async (_, { getState }) => {
  const { present } = (getState() as { depletions: DepletionsState }).depletions;
  return saveDepletions(toSaveRequest(present.cells));
});

const depletionsSlice = createSlice({
  name: 'depletions',
  initialState,
  reducers: {
    // Optimistic: the UI reflects this synchronously, before any server ack.
    editCell(state, action: PayloadAction<{ id: string; value: number }>) {
      const cell = state.present.cells[action.payload.id];
      if (!cell || cell.value === action.payload.value) return;
      commitToHistory(state);
      cell.value = action.payload.value;
      cell.status = cell.value === cell.savedValue ? 'clean' : 'dirty';
    },

    undo(state) {
      const previous = state.past.pop();
      if (!previous) return;
      state.future.unshift(clone(state.present));
      state.present = previous;
    },

    redo(state) {
      const next = state.future.shift();
      if (!next) return;
      state.past.push(clone(state.present));
      state.present = next;
    },

    dismissError(state) {
      state.lastError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── initial load ────────────────────────────────────────────────
      .addCase(loadDepletions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadDepletions.fulfilled, (state, action) => {
        const { accounts, periods, cells } = toGridState(action.payload);
        state.accounts = accounts;
        state.periods = periods;
        state.present = { cells };
        state.past = [];
        state.future = [];
        state.status = 'ready';
        state.exchange = { endpoint: 'GET /api/v1/depletions', response: action.payload };
      })
      .addCase(loadDepletions.rejected, (state, action) => {
        state.status = 'error';
        state.lastError = action.error.message ?? 'Failed to load';
      })
      // ── batch save ──────────────────────────────────────────────────
      .addCase(saveDirty.pending, (state, action) => {
        state.activeSaveId = action.meta.requestId;
        state.lastError = null;
        for (const cell of Object.values(state.present.cells)) {
          if (cell.status === 'dirty') cell.status = 'saving';
        }
      })
      .addCase(saveDirty.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.activeSaveId) return; // stale save
        const response = action.payload as SaveDepletionsResponse;
        state.activeSaveId = null;
        state.lastSavedAt = response.savedAt;
        state.exchange = { endpoint: 'POST /api/v1/depletions:save', response };

        for (const change of response.accepted) {
          const cell = state.present.cells[cellId(change.accountId, change.period)];
          // Skip cells re-edited mid-flight — the fresher input wins, a stale
          // ack never overwrites it.
          if (cell && cell.value === change.units) {
            cell.savedValue = change.units;
            cell.status = 'clean';
          }
        }
      })
      .addCase(saveDirty.rejected, (state, action) => {
        if (action.meta.requestId !== state.activeSaveId) return;
        state.activeSaveId = null;
        state.lastError = action.error.message ?? 'Save failed';
        // Keep the typed values and flag them — a retryable red cell beats
        // silently reverting a rep's work on a transient blip.
        for (const cell of Object.values(state.present.cells)) {
          if (cell.status === 'saving') cell.status = 'error';
        }
      });
  },
});

export const { editCell, undo, redo, dismissError } = depletionsSlice.actions;
export default depletionsSlice.reducer;
