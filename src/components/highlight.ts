const KEYWORDS =
  'import|export|from|default|const|let|var|function|return|if|else|for|of|in|' +
  'type|interface|extends|implements|async|await|new|class|this|void|null|' +
  'undefined|true|false|as|typeof';

const TOKEN = new RegExp(
  [
    '(\\/\\/[^\\n]*)',
    "('(?:[^'\\\\]|\\\\.)*'|\"(?:[^\"\\\\]|\\\\.)*\"|`(?:[^`\\\\]|\\\\.)*`)",
    `\\b(${KEYWORDS})\\b`,
    '\\b([A-Z][A-Za-z0-9_]*)\\b',
    '\\b(\\d+(?:\\.\\d+)?)\\b',
  ].join('|'),
  'g',
);

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function highlightLine(line: string): string {
  return escapeHtml(line).replace(
    TOKEN,
    (match, comment, str, keyword, type, num) => {
      if (comment) return `<span class="tok-c">${comment}</span>`;
      if (str) return `<span class="tok-s">${str}</span>`;
      if (keyword) return `<span class="tok-k">${keyword}</span>`;
      if (type) return `<span class="tok-t">${type}</span>`;
      if (num) return `<span class="tok-n">${num}</span>`;
      return match;
    },
  );
}
