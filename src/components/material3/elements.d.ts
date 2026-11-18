/**
 * Type surface for the Material web components used by the Material 3
 * design-system slice. The library ships Lit element classes; Solid only
 * needs the JSX intrinsics declared here (attributes pass as strings, so no
 * property bindings are needed for these uses).
 *
 * This must stay a MODULE file (hence `export {}` at the bottom): a
 * script-scope ambient `declare module 'solid-js'` makes TypeScript 7 (the
 * repo's pinned @typescript/native compiler) replace the vendored solid-js
 * types with this declaration, which erases every solid-js export in the
 * program. The same applies to any other augmentation — see ripple.ts and
 * helpers/useSwipe.ts, which augment from module files.
 */
declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'md-outlined-icon-button': {
        class?: string,
        'aria-label'?: string,
        disabled?: boolean,
        onClick?: (event: MouseEvent) => void,
        children?: JSX.Element
      };
    }
  }
}

export {};
