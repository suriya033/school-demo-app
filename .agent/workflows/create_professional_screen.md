---
description: Guide for creating a new screen with professional UI styling
---

# Creating a Professional UI Screen

Follow these steps to create a new screen that aligns with the application's professional design system.

## 1. Import Dependencies

Ensure you have the necessary imports, including the color palette and safe area context.

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../constants/colors';
```

## 2. Structure the Screen

Use `SafeAreaView` as the root container.

```javascript
const NewScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                {/* Header Content */}
            </View>
            <View style={styles.content}>
                {/* Main Content */}
            </View>
        </SafeAreaView>
    );
};
```

## 3. Apply Standard Styles

Use the following standard styles in your `StyleSheet`.

```javascript
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textLight,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
    },
    button: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
```

## 4. Key Design Principles

- **Spacing:** Use generous padding (e.g., `24` for containers, `16` or `20` for cards).
- **Typography:** Use `800` weight for main titles, `700` for section headers and buttons, and `600` for labels.
- **Colors:** Always use the `colors` constant. Avoid hardcoded hex values.
- **Shadows:** Use soft, diffused shadows (`shadowRadius: 12` or `24`, `shadowOpacity: 0.08` or `0.1`) combined with a subtle border (`colors.border`).
- **Borders:** Use `borderRadius: 16` for cards and `12` for inputs/buttons.

## 5. Components

- **Cards:** Should have a white background, rounded corners, and a subtle shadow.
- **Inputs:** Should have a white background, border, and comfortable padding.
- **Buttons:** Should have a primary color background, white text, and a shadow that matches the button color.
