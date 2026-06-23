import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Without `test.globals` enabled (kept off so app code doesn't see test
// globals), Testing Library's auto-cleanup never registers on its own —
// register it explicitly so each test's render() doesn't leak into the next.
afterEach(() => {
  cleanup();
});
