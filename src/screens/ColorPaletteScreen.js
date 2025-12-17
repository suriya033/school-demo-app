import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../constants/colors';

/**
 * Color Palette Preview Screen
 * Visual reference for all available colors in the theme
 */
const ColorPaletteScreen = ({ navigation }) => {
    const colorGroups = [
        {
            title: 'Primary Colors',
            colors: [
                { name: 'primary', value: colors.primary },
                { name: 'primaryDark', value: colors.primaryDark },
                { name: 'primaryLight', value: colors.primaryLight },
                { name: 'secondary', value: colors.secondary },
                { name: 'accent', value: colors.accent },
            ],
        },
        {
            title: 'Base Colors',
            colors: [
                { name: 'white', value: colors.white },
                { name: 'black', value: colors.black },
            ],
        },
        {
            title: 'Text Colors',
            colors: [
                { name: 'textPrimary', value: colors.textPrimary },
                { name: 'textSecondary', value: colors.textSecondary },
                { name: 'textLight', value: colors.textLight },
                { name: 'textDark', value: colors.textDark },
            ],
        },
        {
            title: 'Background Colors',
            colors: [
                { name: 'background', value: colors.background },
                { name: 'backgroundDark', value: colors.backgroundDark },
                { name: 'surface', value: colors.surface },
            ],
        },
        {
            title: 'Status Colors',
            colors: [
                { name: 'success', value: colors.success },
                { name: 'successLight', value: colors.successLight },
                { name: 'danger', value: colors.danger },
                { name: 'dangerLight', value: colors.dangerLight },
                { name: 'warning', value: colors.warning },
                { name: 'warningLight', value: colors.warningLight },
                { name: 'info', value: colors.info },
                { name: 'infoLight', value: colors.infoLight },
            ],
        },
        {
            title: 'Gray Scale',
            colors: [
                { name: 'gray', value: colors.gray },
                { name: 'grayLight', value: colors.grayLight },
                { name: 'grayDark', value: colors.grayDark },
            ],
        },
        {
            title: 'Border & Shadow',
            colors: [
                { name: 'border', value: colors.border },
                { name: 'borderLight', value: colors.borderLight },
                { name: 'borderDark', value: colors.borderDark },
                { name: 'shadow', value: colors.shadow },
            ],
        },
        {
            title: 'Additional UI',
            colors: [
                { name: 'disabled', value: colors.disabled },
                { name: 'placeholder', value: colors.placeholder },
            ],
        },
    ];

    const ColorSwatch = ({ name, value }) => (
        <View style={styles.swatchContainer}>
            <View style={[styles.swatch, { backgroundColor: value }]}>
                {(name === 'white' || name.includes('Light')) && (
                    <View style={styles.swatchBorder} />
                )}
            </View>
            <View style={styles.swatchInfo}>
                <Text style={styles.swatchName}>{name}</Text>
                <Text style={styles.swatchValue}>{value}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>Color Palette</Text>
                        <Text style={styles.subtitle}>School App Theme Colors</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {colorGroups.map((group, index) => (
                    <View key={index} style={styles.group}>
                        <Text style={styles.groupTitle}>{group.title}</Text>
                        <View style={styles.swatchGrid}>
                            {group.colors.map((color, colorIndex) => (
                                <ColorSwatch
                                    key={colorIndex}
                                    name={color.name}
                                    value={color.value}
                                />
                            ))}
                        </View>
                    </View>
                ))}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Total: {colorGroups.reduce((sum, g) => sum + g.colors.length, 0)} colors
                    </Text>
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
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButtonText: {
        fontSize: 24,
        color: colors.primary,
        fontWeight: '600',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    group: {
        marginBottom: 32,
    },
    groupTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 16,
    },
    swatchGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    swatchContainer: {
        width: '48%',
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    swatch: {
        height: 80,
        borderRadius: 8,
        marginBottom: 8,
        position: 'relative',
    },
    swatchBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    swatchInfo: {
        gap: 4,
    },
    swatchName: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    swatchValue: {
        fontSize: 11,
        color: colors.textSecondary,
        fontFamily: 'monospace',
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
});

export default ColorPaletteScreen;
