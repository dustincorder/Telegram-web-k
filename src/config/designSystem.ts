export const DESIGN_SYSTEM_IDS = ['classic', 'material3'] as const;

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
  // Both Classic and Material 3 keep the standard Web K geometry: the M3
  // design system restyles surfaces and controls, it does not relayout the
  // columns. A future geometry policy for Material 3 branches here.
  return {
    columnGutter: 16,
    chatInset: isMobile ? 8 : 16,
    foldersGap: 8,
    topbarPlateGap: 8,
    historyTop: isMobile ? 56 : 72,
    historyBottom: isMobile ? 56 : 64
  };
};
