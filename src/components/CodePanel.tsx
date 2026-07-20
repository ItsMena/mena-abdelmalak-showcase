import { useState } from 'react';
// `?raw` imports each file's text at build time, so the source shown here is
// exactly what runs — the two can't drift apart.
import sliceSrc from '../store/depletionsSlice.ts?raw';
import mappersSrc from '../api/mappers.ts?raw';
import apiTypesSrc from '../types/api.ts?raw';
import { highlightLine } from './highlight';
import { useAppSelector } from '../store/store';
import { selectSaveRequestPreview } from '../store/selectors';

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

// The live tab: the exact JSON going over the wire. The request is a live
// preview derived from the dirty cells; the response is whatever the backend
// last returned (GET on load, POST after a save).
function LiveApi() {
  const request = useAppSelector(selectSaveRequestPreview);
  const exchange = useAppSelector((s) => s.depletions.exchange);

  return (
    <div className="live">
      <div className="live__section">
        <div className="live__label">
          <span className="live__verb live__verb--post">POST</span>
          /api/v1/depletions:save
          <span className="live__note">request body — live preview from dirty cells</span>
        </div>
        <CodeBlock code={JSON.stringify(request, null, 2)} />
      </div>

      <div className="live__section">
        <div className="live__label">
          <span className="live__verb live__verb--res">{exchange?.endpoint.split(' ')[0]}</span>
          {exchange ? exchange.endpoint.split(' ')[1] : '—'}
          <span className="live__note">last response</span>
        </div>
        {exchange ? (
          <CodeBlock code={JSON.stringify(exchange.response, null, 2)} />
        ) : (
          <p className="live__empty">No response yet.</p>
        )}
      </div>
    </div>
  );
}

const SOURCE_TABS = [
  {
    id: 'slice',
    label: 'depletionsSlice.ts',
    blurb: 'Optimistic edits, undo/redo history, and the race-safe load & save thunks.',
    code: sliceSrc,
  },
  {
    id: 'mappers',
    label: 'mappers.ts',
    blurb: 'The pure transform layer: wire payload → grid, and dirty cells → POST body.',
    code: mappersSrc,
  },
  {
    id: 'api',
    label: 'types/api.ts',
    blurb: 'The request/response contract — the exact shapes the backend speaks.',
    code: apiTypesSrc,
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
            The actual JSON on the wire. Edit a cell to watch the request body update.
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
