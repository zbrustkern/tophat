import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest';

// Global mocks
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn()
  })
}));

import React from 'react';

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    ResponsiveContainer: ({ children }: any) => React.createElement('div', null, children)
  };
});
