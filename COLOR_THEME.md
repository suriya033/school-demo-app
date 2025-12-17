# Color Theme Documentation

## Overview
This document describes the complete color theme system for the School App.

## Color Palette

### Primary Colors
- **primary** (`#2E86DE`) - Main brand color (Strong Blue)
- **primaryDark** (`#1B62B3`) - Darker variant for hover/active states
- **primaryLight** (`#5BA3F5`) - Lighter variant for backgrounds
- **secondary** (`#54A0FF`) - Secondary brand color (Lighter Blue)
- **accent** (`#FF9F43`) - Accent color for highlights (Orange)

### Base Colors
- **white** (`#FFFFFF`) - Pure white
- **black** (`#000000`) - Pure black

### Text Colors
- **textPrimary** (`#222F3E`) - Primary text (Dark Blue-Gray)
- **textSecondary** (`#576574`) - Secondary text (Muted Blue-Gray)
- **textLight** (`#8395A7`) - Light text
- **textDark** (`#1A1A1A`) - Very dark text

### Background Colors
- **background** (`#F5F7FA`) - Main background (Very Light Blue-Gray)
- **backgroundDark** (`#E8EDF2`) - Darker background variant
- **surface** (`#FFFFFF`) - Surface/card background

### Status Colors
- **success** (`#10AC84`) - Success state (Green)
- **successLight** (`#55EFC4`) - Light success variant
- **danger** (`#EE5253`) - Error/danger state (Red)
- **dangerLight** (`#FF6B6B`) - Light danger variant
- **warning** (`#FECA57`) - Warning state (Yellow)
- **warningLight** (`#FFE66D`) - Light warning variant
- **info** (`#48DBFB`) - Info state (Cyan)
- **infoLight** (`#74B9FF`) - Light info variant

### Gray Scale
- **gray** (`#C8D6E5`) - Medium gray
- **grayLight** (`#DFE6E9`) - Light gray
- **grayDark** (`#95A5A6`) - Dark gray
- **lightGray** (`#DFE6E9`) - Light gray (alias)

### Border & Shadow
- **border** (`#E1E8ED`) - Default border color
- **borderLight** (`#F0F3F5`) - Lighter border
- **borderDark** (`#D1D8DD`) - Darker border
- **shadow** (`#000000`) - Shadow color

### Additional UI Colors
- **overlay** (`rgba(0, 0, 0, 0.5)`) - Modal overlay
- **disabled** (`#BDC3C7`) - Disabled state
- **placeholder** (`#95A5A6`) - Placeholder text
- **transparent** - Transparent color

### Gradient Colors
- **gradientStart** (`#2E86DE`) - Gradient start
- **gradientEnd** (`#54A0FF`) - Gradient end

## Usage

### Basic Import
```javascript
import colors from '../constants/colors';

// Use in styles
const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background,
    },
    text: {
        color: colors.textPrimary,
    },
});
```

### With Color Helpers
```javascript
import { getColor, getColorWithOpacity } from '../utils/colorHelpers';

// Get color with fallback
const primaryColor = getColor('primary', '#000000');

// Get color with opacity
const overlayColor = getColorWithOpacity('black', 0.5);
```

### Theme Presets
```javascript
import { themePresets } from '../utils/colorHelpers';

const styles = StyleSheet.create({
    button: {
        ...themePresets.primaryButton,
    },
    card: {
        ...themePresets.card,
    },
});
```

## Common Patterns

### Cards
```javascript
{
    backgroundColor: colors.white,
    borderColor: colors.border,
    shadowColor: colors.shadow,
}
```

### Buttons
```javascript
// Primary Button
{
    backgroundColor: colors.primary,
    color: colors.white,
}

// Danger Button
{
    backgroundColor: colors.danger,
    color: colors.white,
}
```

### Inputs
```javascript
{
    backgroundColor: colors.white,
    borderColor: colors.border,
    color: colors.textPrimary,
}
```

### Status Indicators
```javascript
// Success
{
    backgroundColor: colors.success,
    color: colors.white,
}

// Error
{
    backgroundColor: colors.danger,
    color: colors.white,
}
```

## Transparency Effects

For semi-transparent backgrounds, use rgba:
```javascript
// Modal overlay
backgroundColor: 'rgba(0, 0, 0, 0.5)'

// Semi-transparent white
backgroundColor: 'rgba(255, 255, 255, 0.9)'
```

Or use the helper:
```javascript
import { getColorWithOpacity } from '../utils/colorHelpers';

backgroundColor: getColorWithOpacity('black', 0.5)
```

## Accessibility

- Ensure text has sufficient contrast (WCAG AA: 4.5:1 for normal text)
- Primary text on white background: ✅ Pass
- Secondary text on white background: ✅ Pass
- White text on primary background: ✅ Pass

## Migration Guide

If you encounter color theme errors:

1. **Check import**: Ensure `import colors from '../constants/colors';` is present
2. **Verify color key**: Make sure the color key exists in colors.js
3. **Use fallbacks**: Use `getColor()` helper for safe color access
4. **Check spelling**: Common typos: `textPrimary` vs `primaryText`

## Available Colors Checklist

✅ All screens have colors imported
✅ All color keys are defined
✅ No hardcoded hex colors in styles
✅ Consistent naming convention
✅ Comprehensive palette coverage
