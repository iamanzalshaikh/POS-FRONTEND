/**
 * Global Formatting Utilities
 * Standardizes currency and date display across the POS application.
 */

/**
 * Formats a number as Pakistani Rupees (PKR)
 * @param amount - The numeric value to format
 * @returns Formatted string (e.g., "₨ 1,234.56")
 */
export const formatAmount = (amount: number | string): string => {
    const value = typeof amount === 'string' ? parseFloat(amount.toString().replace(/[^0-9.-]+/g, '')) : amount;
    if (isNaN(value)) return '0.00';

    return value.toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export const formatCurrency = (amount: number | string): string => {
    return `Rs ${formatAmount(amount)}`;
};

export const formatPKR = (amount: number | string): string => {
    const value = typeof amount === 'string'
        ? parseFloat(amount.toString().replace(/[^0-9.-]+/g, ''))
        : amount;

    if (isNaN(value)) return 'Rs 0.00';

    const formattedValue = value.toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return `Rs ${formattedValue}`;
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
    if (value < 100000) return value.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    
    const format = (v: number, suffix: string) => {
        // Show 1 decimal place only if it's not .0
        const formatted = v.toFixed(1).replace(/\.0$/, '');
        return formatted + suffix;
    };

    if (value >= 1e9) return format(value / 1e9, "B");
    if (value >= 1e6) return format(value / 1e6, "M");
    if (value >= 1e3) return format(value / 1e3, "K");
    
    return value.toLocaleString('en-PK');
};

export const formatAmountShort = (amount: number | string): string => {
    const value = typeof amount === 'string' ? parseFloat(amount.toString().replace(/[^0-9.-]+/g, '')) : amount;
    if (isNaN(value)) return "0";
    if (value < 1000) return formatAmount(value).replace('.00', '');
    return formatNumberShort(value);
};

/**
 * Formats a currency value with short-form suffixes
 * @param amount - The numeric value
 * @returns Formatted string (e.g., "₨ 1.5K")
 */
export const formatCurrencyShort = (amount: number | string): string => {
    return `Rs ${formatAmountShort(amount)}`;
};

/**
 * Returns a YYYY-MM-DD string in the user's local timezone.
 * Avoids the "one day off" bug common with .toISOString().
 * @param date - The date object
 * @returns Formatted string (e.g., "2024-04-14")
 */
export const toLocalYMD = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/**
 * Formats an invoice number by removing the date prefix or store code.
 * E.g., 20260421000006 -> 000006 or STORE-20240421-00001 -> 00001
 * @param invoice - Raw invoice number string
 * @returns Shortened invoice number
 */
export const formatInvoiceNumber = (invoice: string | null | undefined): string => {
    if (!invoice) return 'N/A';
    const str = String(invoice).trim();
    
    // If it has a dash, typically the last part is the sequence
    if (str.includes('-')) {
        const parts = str.split('-');
        return parts[parts.length - 1];
    }
    
    // If it's a long numeric string starting with a date (YYYYMMDD), strip the first 8 digits
    // We check for at least 10 digits as some might be shorter sequence parts
    if (/^\d{10,20}$/.test(str)) {
        return str.slice(-6);
    }
    
    return str;
};
