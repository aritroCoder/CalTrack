import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
    fontFamily: 'System', // Use system font (San Francisco on iOS, Roboto on Android)
};

export const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#2563EB', // Royal Blue
        onPrimary: '#FFFFFF',
        primaryContainer: '#DBEAFE', // Light Blue
        onPrimaryContainer: '#1E3A8A', // Dark Blue

        secondary: '#0D9488', // Teal/Mint accent
        onSecondary: '#FFFFFF',
        secondaryContainer: '#CCFBF1',
        onSecondaryContainer: '#115E59',

        tertiary: '#F59E0B', // Amber/Orange for Manual entry
        onTertiary: '#FFFFFF',
        tertiaryContainer: '#FEF3C7',
        onTertiaryContainer: '#78350F',

        background: '#F8F9FA', // Soft Gray/White background
        surface: '#FFFFFF', // Pure White surface
        surfaceVariant: '#F1F5F9', // Slightly darker surface for inputs
        onSurface: '#1E293B', // Dark Slate Text
        onSurfaceVariant: '#64748B', // Muted Text

        error: '#EF4444',
        onError: '#FFFFFF',

        outline: '#E2E8F0',
        elevation: {
            level0: 'transparent',
            level1: '#FFFFFF',
            level2: '#FFFFFF',
            level3: '#FFFFFF',
            level4: '#FFFFFF',
            level5: '#FFFFFF',
        },
    },
    // roundness: 2, // Optional: adjust corner radius
};
