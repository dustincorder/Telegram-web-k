import {createRoot, createSignal} from 'solid-js';
import rootScope from '@lib/rootScope';
import {normalizeDesignSystemId, type DesignSystemId} from '@config/designSystem';
import {hotListen} from '@helpers/hotModule';

// Reactive view of the interface style the root element carries
// (`html[data-design-system]`). The single source of truth stays
// `designSystemController` (which applies the attribute and dispatches the
// event); components read this signal to branch structurally without each
// mounting their own listener.
const signal = createRoot(() => {
  const [designSystem, setDesignSystem] = createSignal<DesignSystemId>(
    normalizeDesignSystemId(typeof document === 'undefined' ? undefined : document.documentElement.dataset.designSystem)
  );
  return [designSystem, setDesignSystem] as const;
});

const onDesignSystemChanged = (value: DesignSystemId) => {
  signal[1](normalizeDesignSystemId(value));
};

rootScope.addEventListener('design_system_changed', onDesignSystemChanged);
hotListen(import.meta.hot, rootScope, 'design_system_changed', onDesignSystemChanged);

export default function useDesignSystem() {
  return signal;
}
