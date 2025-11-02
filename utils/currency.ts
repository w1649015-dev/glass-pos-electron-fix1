import { Settings } from "../types";

/**
 * Formats an amount stored in minor units (e.g., cents) into a currency string.
 * @param amountMinor The amount in the smallest currency unit.
 * @param settings The application settings containing currency info.
 * @returns A formatted currency string, e.g., "$12.34".
 */
export const formatCurrency = (amountMinor: number, settings: Settings): string => {
    const amountMajor = amountMinor / 100;
    // This can be expanded later with Intl.NumberFormat for more complex localization
    return `${settings.currency}${amountMajor.toFixed(2)}`;
};
