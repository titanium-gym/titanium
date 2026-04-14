export const PAGE_SIZE = 20;

export const FEE_TIERS = [30, 35] as const;
export type FeeTier = (typeof FEE_TIERS)[number];

export const EXPIRY_WARNING_DAYS = 3;
