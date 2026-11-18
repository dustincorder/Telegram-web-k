/**
 * jsdom has no matchMedia, and code that reads it at import time (the
 * Material web components' ripple module reads it when its chunk loads) ends
 * up as an unhandled rejection under Vitest. A minimal always-false stub is
 * all such callers need.
 */
export const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn().mockReturnValue(false)
}));
