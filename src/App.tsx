import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/store';
import { dismissError, loadDepletions } from './store/depletionsSlice';
import { DepletionsGrid } from './components/DepletionsGrid';
import { CodePanel } from './components/CodePanel';

export default function App() {
  const dispatch = useAppDispatch();
  const lastError = useAppSelector((s) => s.depletions.lastError);

  // Fetch the grid once on mount — GET → mapper → populated state.
  useEffect(() => {
    dispatch(loadDepletions());
  }, [dispatch]);

  return (
    <div className="app">
      <header className="hero">
        <div className="hero__eyebrow">Frontend state-management showcase</div>
        <h1 className="hero__title">Depletions Grid</h1>
        <p className="hero__sub">
          An editable distribution grid on Redux Toolkit. It fetches a payload, maps it
          into the grid, and saves edits optimistically. The right panel shows the{' '}
          <em>actual</em> API response and the code that turns it into what you see.
        </p>
      </header>

      <main className="split">
        <section className="split__demo">
          <div className="panel-title">Live grid</div>
          <DepletionsGrid />
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
