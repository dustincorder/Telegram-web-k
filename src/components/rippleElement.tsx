import {createRenderEffect, createSignal, onCleanup, JSX, Ref, splitProps, ValidComponent} from 'solid-js';
import {DynamicProps} from 'solid-js/web';
import ripple from '@components/ripple';
import Passthrough from '@helpers/solid/passthrough';
ripple; // keep

export default function RippleElement<T extends ValidComponent>(props: DynamicProps<T> & {
  noRipple?: boolean,
  rippleSquare?: boolean
}) {
  // * The result tuple is typed by hand: `SplitProps` resolves its keys
  // * through `Extract` over the deferred `keyof T` union, which TypeScript 7
  // * leaves unresolved for a generic `T` — every `local.*` access below
  // * would fail to type. No runtime change.
  const [local, rest] = splitProps(props, [
    'noRipple',
    'rippleSquare',
    'component',
    'children',
    'class',
    'classList',
    'ref'
  ]) as unknown as [{
    noRipple?: boolean,
    rippleSquare?: boolean,
    component?: string,
    children?: JSX.Element,
    class?: string,
    classList?: Record<string, boolean | undefined>,
    ref?: Ref<any>
  }, DynamicProps<T> & {
    noRipple?: boolean,
    rippleSquare?: boolean
  }];
  const [rippleElement, setRippleElement] = createSignal<HTMLElement>();
  const el = document.createElement(local.component as string || 'div');

  createRenderEffect(() => {
    if(!local.noRipple) {
      const ret = ripple(el, undefined, 'no');
      setRippleElement(ret.element);
      onCleanup(() => {
        ret.dispose();
        setRippleElement();
      });
    }
  });

  (local.ref as Ref<any>)?.(el);

  // every class goes through `classList`, which toggles key by key. Handing `class` a joined string
  // instead would make Solid assign `className`, wiping whatever the element picked up from outside
  // — `audio-48` / `search-super-item` on a playlist row, say.
  return (
    <Passthrough
      element={el}
      {...rest as any}
      classList={{
        [local.class]: !!local.class,
        'rp': !local.noRipple,
        'rp-square': !local.noRipple && !!local.rippleSquare,
        ...(local.classList || {})
      }}
    >
      {rippleElement()}
      {local.children}
    </Passthrough>
  );
}
