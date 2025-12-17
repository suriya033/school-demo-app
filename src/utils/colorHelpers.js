/**
 * Color Validation and Helper Utilities
 * Ensures all color references are valid and provides fallbacks
 */

import colors from '../constants/colors';

/**
 * Get a color with fallback
 * @param {string} colorKey - The key from colors object
 * @param {string} fallback - Fallback color if key doesn't exist
 * @returns {string} The color value
 */
export const getColor = (colorKey, fallback = '#000000') => {
    return colors[colorKey] || fallback;
};

/**
 * Validate if a color key exists
 * @param {string} colorKey - The key to validate
 * @returns {boolean} True if color exists
 */
export const isValidColor = (colorKey) => {
    return colors.hasOwnProperty(colorKey);
};

/**
 * Get all available colors
 * @returns {object} All colors
 */
export const getAllColors = () => {
    return { ...colors };
};

/**
 * Get color with opacity
 * @param {string} colorKey - The key from colors object
 * @param {number} opacity - Opacity value (0-1)
 * @returns {string} RGBA color string
 */
export const getColorWithOpacity = (colorKey, opacity = 1) => {
    const color = colors[colorKey];
    if (!color) return `rgba(0, 0, 0, ${opacity})`;

    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Theme presets for common UI patterns
 */
export const themePresets = {
    // Card styles
    card: {
        backgroundColor: colors.white,
        borderColor: colors.border,
        shadowColor: colors.shadow,
    },

    // Button styles
    primaryButton: {
        backgroundColor: colors.primary,
        color: colors.white,
    },
    secondaryButton: {
        backgroundColor: colors.secondary,
        color: colors.white,
    },
    dangerButton: {
        backgroundColor: colors.danger,
        color: colors.white,
    },

    // Input styles
    input: {
        backgroundColor: colors.white,
        borderColor: colors.border,
        color: colors.textPrimary,
        placeholderColor: colors.textSecondary,
    },

    // Text styles
    heading: {
        color: colors.textPrimary,
    },
    body: {
        color: colors.textSecondary,
    },

    // Status styles
    success: {
        backgroundColor: colors.success,
        color: colors.white,
    },
    error: {
        backgroundColor: colors.danger,
        color: colors.white,
    },
    warning: {
        backgroundColor: colors.warning,
        color: colors.textDark,
    },
    info: {
        backgroundColor: colors.info,
        color: colors.white,
    },
};

export default {
    getColor,
    isValidColor,
    getAllColors,
    getColorWithOpacity,
    themePresets,
};
