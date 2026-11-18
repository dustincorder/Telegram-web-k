export const DESIGN_SYSTEM_IDS = ['classic', 'cupertino', 'material3'] as const;

export type DesignSystemId = typeof DESIGN_SYSTEM_IDS[number];

export const DEFAULT_DESIGN_SYSTEM: DesignSystemId = 'classic';

export const isDesignSystemId = (value: unknown): value is DesignSystemId => {
  return typeof value === 'string' && (DESIGN_SYSTEM_IDS as readonly string[]).includes(value);
};

export const normalizeDesignSystemId = (value: unknown): DesignSystemId => {
  return isDesignSystemId(value) ? value : DEFAULT_DESIGN_SYSTEM;
};
