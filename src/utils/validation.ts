/**
 * Pakistan Mobile Number Validation Utility
 * Validates and formats Pakistan mobile numbers.
 * Example of valid number: 0323-3456789
 */

/**
 * Validates if a string is a valid Pakistan mobile number (11 digits, starts with 03)
 * @param phone - The phone number string to validate
 * @returns boolean
 */
export const validatePakistanMobile = (phone: string): boolean => {
    if (!phone) return false;
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Must be exactly 11 digits and start with 03
    return digits.length === 11 && digits.startsWith('03');
};

/**
 * Formats a phone number string into 03XX-XXXXXXX format
 * @param phone - The raw phone number string
 * @returns Formatted string
 */
export const formatPakistanMobile = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4, 11)}`;
};
