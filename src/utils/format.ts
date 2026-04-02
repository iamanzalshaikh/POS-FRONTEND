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

    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value).replace('PKR', '₨');
};

export const formatPKR = (amount: number | string): string => {
    const value = typeof amount === 'string'
        ? parseFloat(amount.toString().replace(/[^0-9.-]+/g, ''))
        : amount;

    if (isNaN(value)) return '₨ 0';

    const shouldShowDecimals = Math.abs(value - Math.round(value)) > 0;
    const formattedValue = value.toLocaleString('en-PK', {
        minimumFractionDigits: shouldShowDecimals ? 2 : 0,
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