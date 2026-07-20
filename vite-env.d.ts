/// <reference types="vite/client" />

// Lets us `import source from './file.ts?raw'` to show real source in the UI.
declare module '*?raw' {
  const content: string;
  export default content;
}
