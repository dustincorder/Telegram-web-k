export const DESIGN_SYSTEM_IDS = ['classic', 'cupertino', 'material3'] as const;

export type DesignSystemId = typeof DESIGN_SYSTEM_IDS[number];

export const DEFAULT_DESIGN_SYSTEM: DesignSystemId = 'classic';

export const isDesignSystemId = (value: unknown): value is DesignSystemId => {
  return typeof value === 'string' && (DESIGN_SYSTEM_IDS as readonly string[]).includes(value);
};

export const normalizeDesignSystemId = (value: unknown): DesignSystemId => {
  return isDesignSystemId(value) ? value : DEFAULT_DESIGN_SYSTEM;
};

/** Geometry shared by the width owner and the design-system components. */
export const getDesignSystemLayout = (value: unknown, isMobile: boolean) => {
  const cupertino = normalizeDesignSystemId(value) === 'cupertino';
  return {
    columnGutter: cupertino ? 0 : 16,
    chatInset: cupertino ? 0 : isMobile ? 8 : 16,
    foldersGap: cupertino ? 0 : 8,
    topbarPlateGap: cupertino ? 0 : 8,
    historyTop: cupertino ? 48 : isMobile ? 56 : 72,
    historyBottom: cupertino || isMobile ? 56 : 64
  };
};
