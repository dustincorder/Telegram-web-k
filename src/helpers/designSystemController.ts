import {normalizeDesignSystemId, type DesignSystemId} from '@config/designSystem';
import rootScope from '@lib/rootScope';
import {hotListen} from '@helpers/hotModule';
import {joinDeepPath} from '@helpers/object/setDeepProperty';
import {loadMaterial3Components} from '@lib/designSystems/material3';

export const applyDesignSystem = (value: unknown): DesignSystemId => {
  const designSystem = normalizeDesignSystemId(value);
  const root = typeof document === 'undefined' ? undefined : document.documentElement;
  if(root && root.dataset.designSystem !== designSystem) {
    root.dataset.designSystem = designSystem;
    rootScope.dispatchEventSingle('design_system_changed', designSystem);
    // The Material 3 slice uses official @material/web components; they load
    // lazily, only while the design system is selected (fire-and-forget: the
    // components upgrade their elements whenever they arrive).
    void loadMaterial3Components(designSystem);
  }

  return designSystem;
};

const onSettingsUpdated = ({key, value}: {key: string, value: unknown}) => {
  if(key === joinDeepPath('settings', 'designSystem')) {
    applyDesignSystem(value);
  }
};

hotListen(import.meta.hot, rootScope, 'settings_updated', onSettingsUpdated);

export const initializeDesignSystemController = (value?: unknown) => {
  applyDesignSystem(value);
};
