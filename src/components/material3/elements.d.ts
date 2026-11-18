/**
 * Type surface for the Material web components used by the Material 3
 * design-system slice. The library ships Lit element classes; Solid only
 * needs the JSX intrinsics declared here (attributes pass as strings, so no
 * property bindings are needed for these uses).
 */
declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'md-outlined-icon-button': {
        class?: string,
        'aria-label'?: string,
        disabled?: boolean,
        onClick?: (event: MouseEvent) => void
      };
      'md-filled-tonal-icon-button': {
        class?: string,
        'aria-label'?: string,
        disabled?: boolean,
        onClick?: (event: MouseEvent) => void
      };
      'md-divider': {
        role?: string,
        class?: string
      };
    }
  }
}
