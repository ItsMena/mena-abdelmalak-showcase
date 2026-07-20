import { useAppDispatch, useAppSelector } from '../store/store';
import { redo, saveDirty, undo } from '../store/depletionsSlice';
import {
  selectCanRedo,
  selectCanUndo,
  selectDirtyCount,
  selectIsSaving,
} from '../store/selectors';
import { Annotation } from './Annotation';

export function Toolbar() {
  const dispatch = useAppDispatch();
  const dirty = useAppSelector(selectDirtyCount);
  const saving = useAppSelector(selectIsSaving);
  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);

  return (
    <div className="toolbar">
      <div className="toolbar__group">
        <button className="btn" disabled={!canUndo} onClick={() => dispatch(undo())}>
          Undo
        </button>
        <button className="btn" disabled={!canRedo} onClick={() => dispatch(redo())}>
          Redo
        </button>
        <Annotation title="Undo / redo via a history stack">
          Edits push a snapshot onto a <code>past</code> stack; undo moves it to{' '}
          <code>future</code>. The reducer that changes cell data has no idea history
          exists — the two concerns stay fully decoupled.
        </Annotation>
      </div>

      <div className="toolbar__group toolbar__group--right">
        <span className={`pill ${dirty ? 'pill--dirty' : 'pill--clean'}`}>
          {dirty ? `${dirty} unsaved` : 'all saved'}
        </span>
        <button
          className="btn btn--primary"
          disabled={saving || dirty === 0}
          onClick={() => dispatch(saveDirty())}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <Annotation title="Batch save, not save-per-keystroke">
          Only dirty cells are collected and sent in a single atomic request. The
          button is derived from state — disabled when there's nothing to save or a
          save is already in flight.
        </Annotation>
      </div>
    </div>
  );
}
