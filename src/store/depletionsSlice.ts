import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Account, Cells, DepletionsResponse, PeriodDef } from '../types';
import { fetchDepletions, saveDepletions } from '../api/depletionsApi';
import { toGridState, toSaveRequest } from '../api/mapDepletions';

export interface DepletionsState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  accounts: Account[];
  periods: PeriodDef[];
  cells: Cells;
  saving: boolean;
  lastError: string | null;
  response: DepletionsResponse | null;
}

const initialState: DepletionsState = {
  status: 'idle',
  accounts: [],
  periods: [],
  cells: {},
  saving: false,
  lastError: null,
  response: null,
};

export const loadDepletions = createAsyncThunk('depletions/load', () => fetchDepletions());

export const saveChanges = createAsyncThunk('depletions/save', (_, { getState }) => {
  const { cells } = (getState() as { depletions: DepletionsState }).depletions;
  return saveDepletions(toSaveRequest(cells));
});

const depletionsSlice = createSlice({
  name: 'depletions',
  initialState,
  reducers: {
    editCell(state, action: PayloadAction<{ id: string; value: number }>) {
      const cell = state.cells[action.payload.id];
      if (!cell) return;
      cell.value = action.payload.value;
      cell.status = cell.value === cell.savedValue ? 'clean' : 'dirty';
    },
    dismissError(state) {
      state.lastError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDepletions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadDepletions.fulfilled, (state, action) => {
        const { accounts, periods, cells } = toGridState(action.payload);
        state.accounts = accounts;
        state.periods = periods;
        state.cells = cells;
        state.response = action.payload;
        state.status = 'ready';
      })
      .addCase(loadDepletions.rejected, (state, action) => {
        state.status = 'error';
        state.lastError = action.error.message ?? 'Failed to load';
      })
      .addCase(saveChanges.pending, (state) => {
        state.saving = true;
        state.lastError = null;
        for (const cell of Object.values(state.cells)) {
          if (cell.value !== cell.savedValue) cell.status = 'saving';
        }
      })
      .addCase(saveChanges.fulfilled, (state) => {
        state.saving = false;
        for (const cell of Object.values(state.cells)) {
          if (cell.status === 'saving') {
            cell.savedValue = cell.value;
            cell.status = 'clean';
          }
        }
      })
      .addCase(saveChanges.rejected, (state, action) => {
        state.saving = false;
        state.lastError = action.error.message ?? 'Save failed';
        for (const cell of Object.values(state.cells)) {
          if (cell.status === 'saving') cell.status = 'error';
        }
      });
  },
});

export const { editCell, dismissError } = depletionsSlice.actions;
export default depletionsSlice.reducer;
