import { useAppDispatch, useAppSelector } from '../store/store';
import { editCell, saveChanges } from '../store/depletionsSlice';
import { cellId } from '../api/mapDepletions';
import {
  selectColumnTotals,
  selectDirtyCount,
  selectGrandTotal,
  selectRowTotals,
  selectRunRate,
} from '../store/selectors';

// One cell subscribes to just its own slice of state, so a keystroke re-renders
// that input alone — not the whole grid.
function Cell({ id }: { id: string }) {
  const dispatch = useAppDispatch();
  const cell = useAppSelector((s) => s.depletions.cells[id]);
  if (!cell) return <td className="grid__cell" />;

  return (
    <td className={`grid__cell grid__cell--${cell.status}`}>
      <input
        className="grid__input"
        type="number"
        value={cell.value}
        onChange={(e) => dispatch(editCell({ id, value: Number(e.target.value) || 0 }))}
      />
    </td>
  );
}

export function DepletionsGrid() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.depletions.status);
  const accounts = useAppSelector((s) => s.depletions.accounts);
  const periods = useAppSelector((s) => s.depletions.periods);
  const saving = useAppSelector((s) => s.depletions.saving);
  const dirty = useAppSelector(selectDirtyCount);
  const columnTotals = useAppSelector(selectColumnTotals);
  const rowTotals = useAppSelector(selectRowTotals);
  const grandTotal = useAppSelector(selectGrandTotal);
  const runRate = useAppSelector(selectRunRate);

  if (status === 'idle' || status === 'loading') {
    return <div className="grid__loading">Loading depletions…</div>;
  }

  return (
    <div className="grid">
      <div className="grid__bar">
        <span className={`pill ${dirty ? 'pill--dirty' : 'pill--clean'}`}>
          {dirty ? `${dirty} unsaved` : 'all saved'}
        </span>
        <button
          className="btn btn--primary"
          disabled={saving || dirty === 0}
          onClick={() => dispatch(saveChanges())}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <table className="grid__table">
        <thead>
          <tr>
            <th className="grid__corner">Account</th>
            {periods.map((p) => (
              <th key={p.iso} className="grid__period">
                {p.label}
              </th>
            ))}
            <th className="grid__total-head">Total</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <th className="grid__account" scope="row">
                <span className="grid__account-name">{account.name}</span>
                <span className="grid__account-channel">{account.channel}</span>
              </th>
              {periods.map((period) => (
                <Cell key={period.iso} id={cellId(account.id, period.iso)} />
              ))}
              <td className="grid__total">{rowTotals[account.id]}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th className="grid__account grid__account--foot" scope="row">
              Total
            </th>
            {periods.map((p) => (
              <td key={p.iso} className="grid__total">
                {columnTotals[p.iso]}
              </td>
            ))}
            <td className="grid__total grid__total--grand">{grandTotal}</td>
          </tr>
        </tfoot>
      </table>

      <div className="grid__stats">
        <div className="stat">
          <span className="stat__label">Total depletions</span>
          <span className="stat__value">{grandTotal.toLocaleString()}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Avg / month (run-rate)</span>
          <span className="stat__value">{runRate.toLocaleString()}</span>
        </div>
      </div>

      <p className="grid__legend">
        <span className="dot dot--dirty" /> unsaved
        <span className="dot dot--saving" /> saving
        <span className="dot dot--error" /> failed
        <span className="grid__hint">— edit any cell, then Save changes</span>
      </p>
    </div>
  );
}
