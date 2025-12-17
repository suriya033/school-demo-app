/**
 * Quick Responsive Design Template
 * Copy this template when creating or updating screens for mobile responsiveness
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../constants/colors';

const ResponsiveScreenTemplate = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            {/* Header - Compact for mobile */}
            <View style={styles.header}>
                <Text style={styles.title}>Screen Title</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Stats Cards - Flexible layout */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>📊</Text>
                        <Text style={styles.statValue}>10</Text>
                        <Text style={styles.statLabel}>Label</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>📈</Text>
                        <Text style={styles.statValue}>20</Text>
                        <Text style={styles.statLabel}>Label</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>✅</Text>
                        <Text style={styles.statValue}>30</Text>
                        <Text style={styles.statLabel}>Label</Text>
                    </View>
                </View>

                {/* Grid Layout - 2 columns on mobile */}
                <View style={styles.menuGrid}>
                    <TouchableOpacity style={styles.menuCard}>
                        <Text style={styles.menuIcon}>🎯</Text>
                        <Text style={styles.menuTitle}>Menu Item</Text>
                        <Text style={styles.menuDescription}>Description</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuCard}>
                        <Text style={styles.menuIcon}>🎯</Text>
                        <Text style={styles.menuTitle}>Menu Item</Text>
                        <Text style={styles.menuDescription}>Description</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    // HEADER STYLES - Mobile Optimized
    header: {
        paddingHorizontal: 16,        // Mobile: 16, Tablet: 20, Desktop: 24
        paddingTop: 4,
        paddingBottom: 16,
        backgroundColor: colors.primary,
    },
    title: {
        fontSize: 28,                  // Mobile: 28, Tablet: 32, Desktop: 36
        fontWeight: '900',
        color: colors.white,
        marginBottom: 4,
        letterSpacing: -1,
    },

    // SCROLL VIEW
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,                   // Mobile: 16, Tablet: 20, Desktop: 24
        paddingTop: 16,
    },

    // STATS CONTAINER - Flexible Layout
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 8,                        // Consistent spacing
    },
    statCard: {
        backgroundColor: colors.white,
        borderRadius: 14,              // Mobile: 14, Desktop: 16
        padding: 12,                   // Mobile: 12, Desktop: 16
        flex: 1,                       // Flexible width instead of fixed
        alignItems: 'center',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    statIcon: {
        fontSize: 26,                  // Mobile: 26, Desktop: 32
        marginBottom: 6,
    },
    statValue: {
        fontSize: 20,                  // Mobile: 20, Desktop: 24
        fontWeight: '900',
        color: colors.primary,
        marginBottom: 3,
    },
    statLabel: {
        fontSize: 10,                  // Mobile: 10, Desktop: 11
        color: colors.textSecondary,
        textAlign: 'center',
        fontWeight: '600',
        textTransform: 'uppercase',
    },

    // GRID LAYOUT - 2 Columns on Mobile
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,                       // Use gap instead of margins
    },
    menuCard: {
        backgroundColor: colors.white,
        borderRadius: 20,              // Mobile: 20, Desktop: 24
        padding: 16,                   // Mobile: 16, Desktop: 20
        width: '48%',                  // 2 columns with gap
        alignItems: 'center',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 5,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 130,                // Mobile: 130, Desktop: 140
        justifyContent: 'center',
    },
    menuIcon: {
        fontSize: 36,                  // Mobile: 36, Desktop: 42
        marginBottom: 10,
    },
    menuTitle: {
        fontSize: 14,                  // Mobile: 14, Desktop: 16
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 4,
        textAlign: 'center',
    },
    menuDescription: {
        fontSize: 11,                  // Mobile: 11, Desktop: 12
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 14,
    },
});

export default ResponsiveScreenTemplate;

/**
 * RESPONSIVE DESIGN CHECKLIST
 * 
 * ✅ Padding: Mobile 16, Tablet 20, Desktop 24
 * ✅ Font Sizes: Reduce by 10-20% on mobile
 * ✅ Use flex: 1 instead of fixed widths for cards
 * ✅ Use gap property for consistent spacing
 * ✅ Card width: 48% for 2-column layout on mobile
 * ✅ Minimum touch target: 44x44
 * ✅ Border radius: Slightly smaller on mobile
 * ✅ Icon sizes: Scale down 15-20% on mobile
 * ✅ Use flexWrap for responsive grids
 * ✅ Test on various screen sizes
 * 
 * COMMON MOBILE SIZES:
 * - Title: 28px (desktop: 32-36px)
 * - Subtitle: 18px (desktop: 20-24px)
 * - Body: 14px (desktop: 16px)
 * - Small: 12px (desktop: 13-14px)
 * - Tiny: 10px (desktop: 11px)
 * 
 * SPACING SCALE:
 * - xs: 4-6px
 * - sm: 8-12px
 * - md: 12-16px
 * - lg: 16-24px
 * - xl: 24-32px
 */
