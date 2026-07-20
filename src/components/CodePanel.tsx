import { useState } from 'react';
import mapSrc from '../api/mapDepletions.ts?raw';
import gridSrc from './DepletionsGrid.tsx?raw';
import sliceSrc from '../store/depletionsSlice.ts?raw';
import { highlightLine } from './highlight';
import { useAppSelector } from '../store/store';

function CodeBlock({ code }: { code: string }) {
  const lines = code.replace(/\n$/, '').split('\n');
  return (
    <pre className="code__pre">
      <code>
        {lines.map((line, i) => (
          <span className="code__line" key={i}>
            <span className="code__ln">{i + 1}</span>
            <span
              className="code__text"
              dangerouslySetInnerHTML={{ __html: highlightLine(line) || '​' }}
            />
          </span>
        ))}
      </code>
    </pre>
  );
}

function LiveApi() {
  const response = useAppSelector((s) => s.depletions.response);

  return (
    <div className="live">
      <div className="live__section">
        <div className="live__label">
          <span className="live__verb live__verb--get">GET</span>
          /api/v1/depletions
          <span className="live__note">the request</span>
        </div>
        <CodeBlock code={'GET /api/v1/depletions HTTP/1.1\nAccept: application/json'} />
      </div>

      <div className="live__section">
        <div className="live__label">
          <span className="live__verb live__verb--res">200</span>
          response
          <span className="live__note">mapped into the grid by mapDepletions.ts</span>
        </div>
        {response ? (
          <CodeBlock code={JSON.stringify(response, null, 2)} />
        ) : (
          <p className="live__empty">Loading…</p>
        )}
      </div>
    </div>
  );
}

const SOURCE_TABS = [
  {
    id: 'map',
    label: 'mapDepletions.ts',
    blurb: 'How we manipulate it: the pure transform from wire payload into grid state.',
    code: mapSrc,
  },
  {
    id: 'grid',
    label: 'DepletionsGrid.tsx',
    blurb: 'How we display it: the component that renders the mapped data.',
    code: gridSrc,
  },
  {
    id: 'slice',
    label: 'depletionsSlice.ts',
    blurb: 'The store: the load & save thunks and the reducers that hold it together.',
    code: sliceSrc,
  },
] as const;

type TabId = 'live' | (typeof SOURCE_TABS)[number]['id'];

export function CodePanel() {
  const [active, setActive] = useState<TabId>('live');
  const source = SOURCE_TABS.find((t) => t.id === active);

  return (
    <div className="code">
      <div className="code__tabs">
        <button
          className={`code__tab ${active === 'live' ? 'code__tab--active' : ''}`}
          onClick={() => setActive('live')}
        >
          ● Live API
        </button>
        {SOURCE_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`code__tab ${tab.id === active ? 'code__tab--active' : ''}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === 'live' ? (
        <>
          <p className="code__blurb">
            How we get the data: the real GET request and the JSON response behind the grid.
          </p>
          <LiveApi />
        </>
      ) : (
        source && (
          <>
            <p className="code__blurb">{source.blurb}</p>
            <CodeBlock code={source.code} />
          </>
        )
      )}
    </div>
  );
}
