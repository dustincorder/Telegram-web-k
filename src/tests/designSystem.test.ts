import {beforeEach, describe, expect, it} from 'vitest';
import {
  DEFAULT_DESIGN_SYSTEM,
  DESIGN_SYSTEM_IDS,
  normalizeDesignSystemId
} from '@config/designSystem';
import {applyDesignSystem} from '@helpers/designSystemController';
import {SETTINGS_INIT} from '@config/state';

describe('design system foundation', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-design-system');
  });

  it('exposes stable identifiers in order', () => {
    expect(DESIGN_SYSTEM_IDS).toEqual(['classic', 'cupertino', 'material3']);
  });

  it('uses Classic as the default and fallback', () => {
    expect(DEFAULT_DESIGN_SYSTEM).toBe('classic');
    expect(SETTINGS_INIT.designSystem).toBe('classic');
    expect(normalizeDesignSystemId(undefined)).toBe('classic');
    expect(normalizeDesignSystemId('legacy')).toBe('classic');
    expect(normalizeDesignSystemId('material3')).toBe('material3');
  });

  it('applies a root marker without changing color theme state', () => {
    const theme = SETTINGS_INIT.theme;

    expect(applyDesignSystem('cupertino')).toBe('cupertino');
    expect(document.documentElement.dataset.designSystem).toBe('cupertino');
    expect(SETTINGS_INIT.theme).toBe(theme);
  });

  it('is idempotent', () => {
    applyDesignSystem('classic');
    const first = document.documentElement.dataset.designSystem;
    applyDesignSystem('classic');
    expect(document.documentElement.dataset.designSystem).toBe(first);
  });
});
