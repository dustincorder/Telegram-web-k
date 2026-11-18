import {normalizeDesignSystemId} from '@config/designSystem';

let loaded: Promise<unknown> | undefined;

/**
 * Loads the Material web components (`@material/web`, official M3 web
 * components) the Material 3 design system uses. Per-component ESM modules,
 * so the bundler ships only what is imported and nothing loads for Classic.
 * Called on every design-system apply; the first call while Material 3 is
 * selected wins, later calls return the same promise.
 */
export const loadMaterial3Components = (value: unknown): Promise<unknown> | undefined => {
  if(normalizeDesignSystemId(value) !== 'material3') return undefined;
  loaded ??= Promise.all([
    import('@material/web/iconbutton/outlined-icon-button.js'),
    import('@material/web/iconbutton/filled-tonal-icon-button.js'),
    import('@material/web/divider/divider.js')
  ]).then(() => undefined);
  return loaded;
};
