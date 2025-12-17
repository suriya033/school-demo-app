import { useWindowDimensions } from 'react-native';

export const useResponsive = () => {
    const { width, height } = useWindowDimensions();

    // Breakpoints
    const isSmallMobile = width < 375;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    const isLargeDesktop = width >= 1440;

    const orientation = width > height ? 'landscape' : 'portrait';

    // Grid calculations
    const getGridItemWidth = (columns, gap = 0, containerPadding = 0) => {
        const availableWidth = width - (containerPadding * 2) - ((columns - 1) * gap);
        return availableWidth / columns;
    };

    // Helper to get value based on breakpoint
    const getValue = ({ mobile, tablet, desktop, largeDesktop }) => {
        if (isLargeDesktop && largeDesktop !== undefined) return largeDesktop;
        if (isDesktop && desktop !== undefined) return desktop;
        if (isTablet && tablet !== undefined) return tablet;
        return mobile;
    };

    // Responsive grid columns
    const getGridColumns = (maxColumns = 4) => {
        if (isSmallMobile) return Math.min(2, maxColumns);
        if (isMobile) return Math.min(2, maxColumns);
        if (isTablet) return Math.min(3, maxColumns);
        if (isDesktop) return Math.min(4, maxColumns);
        return maxColumns;
    };

    // Responsive card width percentage
    const getCardWidth = (columns) => {
        const gap = 12;
        const padding = isMobile ? 16 : 24;
        const totalGap = (columns - 1) * gap;
        const availableWidth = width - (padding * 2) - totalGap;
        const cardWidth = availableWidth / columns;
        return `${(cardWidth / width) * 100}%`;
    };

    return {
        width,
        height,
        isSmallMobile,
        isMobile,
        isTablet,
        isDesktop,
        isLargeDesktop,
        orientation,
        getGridItemWidth,
        getValue,
        getGridColumns,
        getCardWidth,
        // Common responsive sizes
        containerPadding: isSmallMobile ? 12 : isMobile ? 16 : 24,
        headerHeight: isMobile ? 60 : 80,
        fontSize: {
            xs: isSmallMobile ? 10 : 11,
            sm: isSmallMobile ? 12 : 13,
            base: isSmallMobile ? 14 : 16,
            lg: isSmallMobile ? 16 : 18,
            xl: isSmallMobile ? 18 : 20,
            '2xl': isSmallMobile ? 22 : 24,
            '3xl': isSmallMobile ? 26 : 32,
            '4xl': isSmallMobile ? 30 : 36,
        },
        spacing: {
            xs: isSmallMobile ? 4 : 6,
            sm: isSmallMobile ? 8 : 12,
            md: isSmallMobile ? 12 : 16,
            lg: isSmallMobile ? 16 : 24,
            xl: isSmallMobile ? 24 : 32,
        },
    };
};
