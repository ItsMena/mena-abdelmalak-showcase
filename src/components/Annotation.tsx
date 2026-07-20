import { useState, type ReactNode } from 'react';

// A small (i) hotspot. Hover (or tap) to reveal the reasoning behind a
// decision. Used to narrate the "why" without cluttering the UI.
export function Annotation({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="annotation"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}
    >
      <span className="annotation__dot" aria-label={title}>
        i
      </span>
      {open && (
        <span className="annotation__pop" role="tooltip">
          <strong className="annotation__title">{title}</strong>
          <span className="annotation__body">{children}</span>
        </span>
      )}
    </span>
  );
}
