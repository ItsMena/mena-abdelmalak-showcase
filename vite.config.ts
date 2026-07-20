import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Nothing exotic here — but note the `?raw` imports used in the app.
// The code shown in the right-hand panel is imported directly from the
// source files at build time, so the "documentation" can never drift
// out of sync with the code that is actually running.
export default defineConfig({
  plugins: [react()],
});
