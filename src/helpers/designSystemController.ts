import {normalizeDesignSystemId, DesignSystemId} from '@config/designSystem';
import rootScope from '@lib/rootScope';
import {hotListen} from '@helpers/hotModule';

export const applyDesignSystem = (value: unknown): DesignSystemId => {
  const designSystem = normalizeDesignSystemId(value);
  const root = typeof document === 'undefined' ? undefined : document.documentElement;
  if(root) {
    root.dataset.designSystem = designSystem;
  }

  return designSystem;
};

const onSettingsUpdated = ({key, value}: {key: string, value: unknown}) => {
  if(key === 'settings.designSystem') {
    applyDesignSystem(value);
  }
};

hotListen(import.meta.hot, rootScope, 'settings_updated', onSettingsUpdated);

export const initializeDesignSystemController = (value?: unknown) => {
  applyDesignSystem(value);
};
