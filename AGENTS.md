# AGENTS.md - CalTrack

Guidelines for AI coding agents working in this React Native/Expo calorie tracking app.

## Project Overview

CalTrack is an Indian food calorie tracking app powered by AI. Users can scan food images, describe meals via text, or manually log calories. Built with React Native, Expo, TypeScript, and SQLite.

## Build & Run Commands

```bash
# Install dependencies
npm install
# or
yarn install

# Start development server
npx expo start

# Platform-specific
npx expo start --android    # Android
npx expo start --ios        # iOS
npx expo start --web        # Web browser

# Build APK (EAS)
eas build --platform android --profile production

# Local Android build (requires Android SDK)
npx expo run:android --variant release
```

## Testing

No test framework is currently configured. When adding tests:
- Use Jest with `@testing-library/react-native`
- Place tests in `__tests__/` directories or as `*.test.tsx` files
- Run with `npm test` or `yarn test`

## Linting & Formatting

No ESLint/Prettier config exists. The codebase follows these conventions implicitly:
- 4-space indentation
- Semicolons required
- Single quotes for strings (mostly)
- Trailing commas in multi-line structures

## Project Structure

```
CalTrack/
├── App.tsx                 # Entry point, navigation setup, theme provider
├── src/
│   ├── config/
│   │   ├── config.ts       # App constants, API endpoints, color palette
│   │   └── prompts.ts      # AI prompt templates, food heuristics
│   ├── screens/            # UI screens (React components)
│   ├── services/
│   │   ├── databaseService.ts  # SQLite CRUD operations
│   │   └── geminiService.ts    # AI API integration (Portkey)
│   ├── store/
│   │   └── appStore.ts     # Zustand global state
│   ├── styles/
│   │   └── styles.ts       # Legacy shared styles (prefer theme.ts)
│   ├── types/
│   │   └── env.d.ts        # Environment variable types
│   └── theme.ts            # Material Design 3 theme config
├── .env                    # Environment variables (not committed)
└── assets/                 # App icons and splash screens
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** via `tsconfig.json`
- Use explicit types for function parameters and return values
- Define interfaces for data structures in the file where they're used
- Use `type` for unions/aliases, `interface` for object shapes
- Never use `any`, `@ts-ignore`, or `@ts-expect-error`

```typescript
// Good
interface FoodItem {
    name: string;
    calories: number;
    confidence: 'high' | 'medium' | 'low';
}

// Bad
const item: any = { name: 'rice' };
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `HomeScreen`, `CircularProgress` |
| Functions | camelCase | `handleCamera`, `getTodayCalories` |
| Variables | camelCase | `isLoading`, `foodLog` |
| Constants | UPPER_SNAKE_CASE | `DATABASE_NAME`, `CONFIG` |
| Files (components) | PascalCase.tsx | `HomeScreen.tsx` |
| Files (utilities) | camelCase.ts | `databaseService.ts` |

### Import Order

1. React and React Native core
2. Expo packages
3. Third-party libraries (navigation, UI components)
4. Local imports (screens, services, store, types)

```typescript
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text, Button, useTheme } from 'react-native-paper';

import { useAppStore } from '../store/appStore';
import { analyzeFood } from '../services/geminiService';
```

### Component Structure

```typescript
// 1. File header comment
// Screen Name
// Brief description

// 2. Imports

// 3. Types (if component-specific)
type ScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

// 4. Sub-components (if small and specific to this file)
const HelperComponent = ({ prop }: Props) => { ... };

// 5. Main component (named export)
export const MyScreen: React.FC = () => {
    // Hooks first
    const navigation = useNavigation<ScreenNavigationProp>();
    const theme = useTheme();
    const { storeValue } = useAppStore();
    
    // State
    const [isLoading, setIsLoading] = useState(false);
    
    // Effects
    useEffect(() => { ... }, []);
    
    // Handlers
    const handleAction = async () => { ... };
    
    // Render
    return ( ... );
};

// 6. Default export (optional, prefer named)
export default MyScreen;
```

### Styling

- Use `react-native-paper` components with `useTheme()` for colors
- Inline styles for one-off styling, extract to variables for reuse
- Reference `theme.colors.*` for all colors (primary, surface, error, etc.)
- Avoid hardcoded colors; use theme values

```typescript
const theme = useTheme();

// Good
<View style={{ backgroundColor: theme.colors.background }}>

// Bad
<View style={{ backgroundColor: '#F8F9FA' }}>
```

## State Management (Zustand)

- Single store in `src/store/appStore.ts`
- Optimistic updates: update UI immediately, persist to DB, rollback on failure
- Computed values via getter functions (`getTodayCalories`, `getTodayEntries`)

```typescript
// Accessing store
const { foodLog, addFoodEntry, getTodayCalories } = useAppStore();

// Adding entries (optimistic update pattern)
await addFoodEntry({ items, totalCalories, mode });
```

## Error Handling

- Wrap async operations in try/catch
- Log errors with `console.error()` for debugging
- Show user-friendly messages via `Alert.alert()`
- Database operations include rollback on failure

```typescript
try {
    await someAsyncOperation();
} catch (error) {
    console.error('Operation failed:', error);
    Alert.alert('Error', 'Something went wrong. Please try again.');
}
```

## Database (SQLite via expo-sqlite)

- All DB operations in `src/services/databaseService.ts`
- Web platform uses mock in-memory storage
- Tables: `food_log`, `user_settings`
- Always handle Platform.OS === 'web' case

## AI Integration (Portkey)

- API calls in `src/services/geminiService.ts`
- Uses structured JSON output with schema validation
- Three modes: `light`, `homemade`, `restaurant` (affect calorie estimates)
- API key via environment variable: `EXPO_PUBLIC_PORTKEY_API_KEY`

## Environment Variables

Create `.env` file (never commit):
```
EXPO_PUBLIC_PORTKEY_API_KEY=your_key_here
```

Access via `@env` module (configured in babel.config.js):
```typescript
import { EXPO_PUBLIC_PORTKEY_API_KEY } from '@env';
```

## Navigation

- React Navigation with native stack
- Type-safe navigation via `RootStackParamList` in App.tsx
- Screens: Onboarding, Home, Result, History, TextInput, ManualEntry, Settings

## Common Patterns

### Image Picker
```typescript
const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
    base64: true,
});
```

### Navigation with Types
```typescript
type Props = NativeStackNavigationProp<RootStackParamList, 'ScreenName'>;
const navigation = useNavigation<Props>();
navigation.navigate('Home');
```

## Do NOT

- Add new dependencies without necessity
- Use `any` type or type assertions (`as`)
- Commit `.env` files or API keys
- Use inline styles with hardcoded colors
- Skip error handling on async operations
- Modify database schema without migration strategy
