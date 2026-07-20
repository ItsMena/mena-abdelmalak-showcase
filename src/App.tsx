import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/store';
import { dismissError, loadDepletions, redo, undo } from './store/depletionsSlice';
import { Toolbar } from './components/Toolbar';
import { Grid } from './components/Grid';
import { CodePanel } from './components/CodePanel';
import { Annotation } from './components/Annotation';

export default function App() {
  const dispatch = useAppDispatch();
  const lastError = useAppSelector((s) => s.depletions.lastError);
  const lastSavedAt = useAppSelector((s) => s.depletions.lastSavedAt);

  // Fetch the grid once on mount — GET → mapper → populated state.
  useEffect(() => {
    dispatch(loadDepletions());
  }, [dispatch]);

  // Keyboard-driven undo/redo — the same actions the buttons dispatch.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== 'z') return;
      e.preventDefault();
      dispatch(e.shiftKey ? redo() : undo());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  return (
    <div className="app">
      <header className="hero">
        <div className="hero__eyebrow">Frontend state-management showcase</div>
        <h1 className="hero__title">Depletions Grid</h1>
        <p className="hero__sub">
          An editable distribution grid built on Redux Toolkit — it fetches a payload,
          maps it into the grid, and saves edits with optimistic updates, undo/redo, and
          race-safe batch writes. The right panel shows the <em>actual</em> API traffic and
          the source that runs it. Hover any <span className="hero__i">i</span> for the
          reasoning.
        </p>
      </header>

      <main className="split">
        <section className="split__demo">
          <div className="panel-title">
            Live grid
            <Annotation title="This is real, not a mock">
              Every keystroke dispatches a Redux action through the same store, reducers,
              and selectors shown on the right. Nothing here is faked for the demo.
            </Annotation>
          </div>
          <Toolbar />
          <Grid />
          {lastSavedAt && !lastError && (
            <p className="save-note">
              Last saved {new Date(lastSavedAt).toLocaleTimeString()}
            </p>
          )}
        </section>

        <section className="split__code">
          <div className="panel-title">API &amp; source</div>
          <CodePanel />
        </section>
      </main>

      {lastError && (
        <div className="toast" role="alert">
          <span>
            <strong>Save failed.</strong> {lastError} — your numbers are kept and flagged
            red. Just hit Save again.
          </span>
          <button className="toast__close" onClick={() => dispatch(dismissError())}>
            Dismiss
          </button>
        </div>
      )}

      <footer className="foot">
        Clean-room demo · synthetic data · React + Redux Toolkit + reselect + TypeScript
      </footer>
    </div>
  );
}
