# Depletions Grid — a frontend state-management showcase

A small, self-contained demo of how I approach **async state management** on the
frontend. It's an editable distribution grid (accounts × months of depletion
figures) — the kind of data-entry surface where the interesting engineering isn't
the UI, it's everything holding the state together while a user types fast on a
flaky network.

The page is a split view: the **live grid** on the left, and the **actual source
code + API traffic** on the right (imported via Vite's `?raw`, so the code shown can
never drift from the code running). It follows one linear story — *fetch the data,
map it, display it* — so every piece is small and easy to reason about.

> Clean-room demo. Synthetic accounts, synthetic numbers, neutral branding — built
> from scratch to show technique, not to represent any real product.

## Run it

```bash
npm install
npm run dev
```

Then open the printed localhost URL.

## What it demonstrates

| Concern | Where | The decision |
|---|---|---|
| **Fetch → map → render** | `loadDepletions` thunk + `mapDepletions.ts` | The server payload is mapped into grid state in one pure function. The API's dialect (`ON_PREMISE`, `"2026-01"`) meets the UI's in exactly one place. |
| **Optimistic edits** | `editCell` reducer | UI updates synchronously on keystroke; `status` is derived from `value` vs `savedValue`, so editing a cell back to its saved number makes it clean again. |
| **Batch save** | `saveChanges` thunk | Every changed cell is collected and sent in one request, not one per keystroke. "Changed" is defined by the data (`value !== savedValue`), not the visual label. |
| **Failure handling + retry** | `saveChanges.rejected` | Failed cells are flagged red and **kept**, not rolled back — losing a rep's typed numbers on a transient blip is worse than a retryable error. Hitting Save again clears them. |
| **Derived state, memoized** | `selectors.ts` (reselect) | Row/column totals and run-rate are **computed, never stored** — storing a total means keeping it in sync forever, and that desync is where dashboards start lying. |

The mock API (`depletionsApi.ts`) is deliberately slow and fails ~25% of the time,
so the save path is genuinely exercised rather than assumed.

## Stack

React 18 · Redux Toolkit · reselect · TypeScript · Vite

## Layout

```
src/
  types/
    domain.ts          # UI-facing shapes (Account, PeriodDef, CellState, Cells)
    api.ts             # the wire contract: request/response DTOs
    index.ts           # barrel re-export
  api/
    depletionsApi.ts   # the HTTP calls — slow, occasionally-failing fake backend
    mapDepletions.ts   # pure transforms between wire DTOs and grid state
  store/
    depletionsSlice.ts # state + reducers + load/save thunks
    selectors.ts       # memoized derived state (totals, run-rate)
    store.ts           # configured store + typed hooks
  components/
    DepletionsGrid.tsx # the display component
    CodePanel.tsx      # the live API + source panel
    highlight.ts       # tiny syntax highlighter
  data/seed.ts         # synthetic fixtures the mock backend serves
```

## How it works — the data flow

Data flows in **one direction** through layers that each do exactly one job.
Two journeys explain the whole app.

### 1. Loading the grid (a GET)

```
App mounts
  → dispatch(loadDepletions())            // a thunk: async action
  → depletionsApi.fetchDepletions()       // returns a raw DepletionsResponse DTO
  → loadDepletions.fulfilled reducer
      → toGridState(response)             // DTO → { accounts, periods, cells }
      → stored in the slice
  → selectors compute totals from cells
  → <DepletionsGrid> renders
```

The server speaks one dialect (`ON_PREMISE`, `"2026-01"`, ISO dates); the UI
speaks another (`On-Premise`, `Jan`). **`mapDepletions.ts` is the only place the
two meet** — so if the API changes, one file changes.

### 2. Editing and saving (a POST)

```
User types in a cell
  → onChange → dispatch(editCell({ id, value }))
  → editCell reducer: update value immediately (optimistic),
                      mark dirty (status = value === savedValue ? 'clean' : 'dirty')
  → selectors recompute the totals

User clicks Save
  → dispatch(saveChanges())               // createAsyncThunk fires 3 actions:
  → saveChanges.pending    → flip changed cells to 'saving'
  → the thunk builds the POST body via toSaveRequest(cells)
                            and calls depletionsApi.saveDepletions(body)
  → saveChanges.fulfilled  → mark saved cells 'clean', bump savedValue
  → (or saveChanges.rejected → flag cells red, keep the numbers for retry)
```

### The vocabulary (what each Redux term means here)

- **slice** — one feature's state + the reducers that change it + the action
  creators, all in one file (`depletionsSlice.ts`).
- **reducer** — a pure function: *(current state, action) → next state*. RTK uses
  Immer, so you write "mutating" code on a draft and it produces the new
  immutable state for you.
- **thunk** — an action that can do async work (an API call) and dispatch other
  actions. `createAsyncThunk` auto-generates `pending` / `fulfilled` / `rejected`.
- **selector** — a function that reads or derives a value from state;
  `reselect`'s `createSelector` memoizes it so it only recomputes when its inputs
  change.

### The three fields on every cell

The one idea the rest hangs on:

```ts
{ value: 250,        // what's on screen right now (updated optimistically)
  savedValue: 21,    // what the server last confirmed
  status: 'dirty' }  // presentational label, derived from the two
```

"Needs saving" is defined by the **data** (`value !== savedValue`), not the
label — which is why a save stays correct even while a cell is mid-flight.
