import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Breakpoints
export const BREAKPOINTS = {
    SMALL_MOBILE: 375,
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1440,
};

// Check device type
export const isSmallMobile = width < BREAKPOINTS.SMALL_MOBILE;
export const isMobile = width < BREAKPOINTS.MOBILE;
export const isTablet = width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.TABLET;
export const isDesktop = width >= BREAKPOINTS.TABLET;

// Responsive sizing functions
export const responsiveWidth = (percentage) => {
    return (width * percentage) / 100;
};

export const responsiveHeight = (percentage) => {
    return (height * percentage) / 100;
};

export const responsiveFontSize = (size) => {
    const scale = width / 375; // Base width for scaling
    const newSize = size * scale;
    if (Platform.OS === 'ios') {
        return Math.round(newSize);
    }
    return Math.round(newSize) - 1;
};

// Responsive spacing
export const spacing = {
    xs: isSmallMobile ? 4 : 6,
    sm: isSmallMobile ? 8 : 12,
    md: isSmallMobile ? 12 : 16,
    lg: isSmallMobile ? 16 : 24,
    xl: isSmallMobile ? 24 : 32,
    xxl: isSmallMobile ? 32 : 48,
};

// Responsive font sizes
export const fontSize = {
    xs: isSmallMobile ? 10 : 11,
    sm: isSmallMobile ? 12 : 13,
    base: isSmallMobile ? 14 : 16,
    lg: isSmallMobile ? 16 : 18,
    xl: isSmallMobile ? 18 : 20,
    '2xl': isSmallMobile ? 22 : 24,
    '3xl': isSmallMobile ? 26 : 32,
    '4xl': isSmallMobile ? 30 : 36,
};

// Responsive border radius
export const borderRadius = {
    sm: 8,
    md: isSmallMobile ? 10 : 12,
    lg: isSmallMobile ? 14 : 16,
    xl: isSmallMobile ? 18 : 20,
    xxl: isSmallMobile ? 20 : 24,
    full: 9999,
};

// Responsive padding/margin
export const containerPadding = isSmallMobile ? 12 : isMobile ? 16 : 24;

// Grid helpers
export const getGridColumns = (maxColumns = 4) => {
    if (isSmallMobile) return Math.min(2, maxColumns);
    if (isMobile) return Math.min(2, maxColumns);
    if (isTablet) return Math.min(3, maxColumns);
    return maxColumns;
};

export const getCardWidth = (columns = 2, gap = 12) => {
    const padding = containerPadding;
    const totalGap = (columns - 1) * gap;
    const availableWidth = width - (padding * 2) - totalGap;
    return availableWidth / columns;
};

// Responsive card dimensions
export const cardDimensions = {
    minHeight: isSmallMobile ? 120 : 140,
    padding: isSmallMobile ? 12 : isMobile ? 16 : 20,
    iconSize: isSmallMobile ? 28 : isMobile ? 32 : 40,
};

export default {
    width,
    height,
    isSmallMobile,
    isMobile,
    isTablet,
    isDesktop,
    responsiveWidth,
    responsiveHeight,
    responsiveFontSize,
    spacing,
    fontSize,
    borderRadius,
    containerPadding,
    getGridColumns,
    getCardWidth,
    cardDimensions,
};
