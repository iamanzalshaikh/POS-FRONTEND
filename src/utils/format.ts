/**
 * Global Formatting Utilities
 * Standardizes currency and date display across the POS application.
 */

/**
 * Formats a number as Pakistani Rupees (PKR)
 * @param amount - The numeric value to format
 * @returns Formatted string (e.g., "₨ 1,234.56")
 */
export const formatCurrency = (amount: number | string): string => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(value)) return '₨ 0.00';

    return `₨ ${value.toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

export const formatPKR = (amount: number | string): string => {
    const value = typeof amount === 'string'
        ? parseFloat(amount.toString().replace(/[^0-9.-]+/g, ''))
        : amount;

    if (isNaN(value)) return '₨ 0.00';

    const formattedValue = value.toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return `₨ ${formattedValue}`;
};

/**
 * Formats a date string into a readable format for Pakistan locale
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string | Date): string => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    return date.toLocaleString('en-PK', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
};

/**
 * Formats a number into a short string (K, M, B)
 * @param num - The number to format
 * @returns Formatted string (e.g., 1.5K, 2M)
 */
export const formatNumberShort = (num: number | string): string => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value)) return "0";
    if (value < 1000) return value.toString();
    
    if (value >= 1e9) {
        return (value / 1e9).toFixed(1).replace(/\.0$/, '') + "B";
    }
    if (value >= 1e6) {
        return (value / 1e6).toFixed(1).replace(/\.0$/, '') + "M";
    }
    if (value >= 1e3) {
        return (value / 1e3).toFixed(1).replace(/\.0$/, '') + "K";
    }
    return value.toString();
};

/**
 * Formats a currency value with short-form suffixes
 * @param amount - The numeric value
 * @returns Formatted string (e.g., "₨ 1.5K")
 */
export const formatCurrencyShort = (amount: number | string): string => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(value)) return "₨ 0";
    if (value < 1000) return formatCurrency(value);
    return `₨ ${formatNumberShort(value)}`;
};
