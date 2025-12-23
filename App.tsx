import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme as NavDefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { HomeScreen } from './src/screens/HomeScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { TextInputScreen } from './src/screens/TextInputScreen';
import { ManualEntryScreen } from './src/screens/ManualEntryScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { useAppStore } from './src/store/appStore';
import { theme } from './src/theme';

// Navigation types
export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Result: undefined;
  History: undefined;
  TextInput: undefined;
  ManualEntry: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Custom navigation theme
const CalTrackTheme = {
  ...NavDefaultTheme,
  colors: {
    ...NavDefaultTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.onSurface,
    primary: theme.colors.primary,
    border: theme.colors.outline,
  },
};

// Loading screen while database initializes
const LoadingScreen = () => (
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background
  }}>
    <Text style={{
      fontSize: 48,
      marginBottom: 20
    }}>🍛</Text>
    <Text style={{
      color: theme.colors.primary,
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16
    }}>CalTrack</Text>
    <ActivityIndicator size="large" color={theme.colors.primary} />
    <Text style={{
      color: theme.colors.onSurfaceVariant,
      marginTop: 16
    }}>Loading your food log...</Text>
  </View>
);

export default function App() {
  const { isDbInitialized, isOnboardingComplete, initializeDatabase } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      setIsLoading(false);
    };
    init();
  }, []);

  if (isLoading || !isDbInitialized) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme} settings={{ icon: props => <MaterialCommunityIcons {...props} /> }}>
        <NavigationContainer theme={CalTrackTheme}>
          <StatusBar style="dark" />
          <Stack.Navigator
            initialRouteName={isOnboardingComplete ? "Home" : "Onboarding"}
            screenOptions={{
              headerStyle: {
                backgroundColor: theme.colors.surface,
              },
              headerTintColor: theme.colors.primary,
              headerTitleStyle: {
                fontWeight: '600',
              },
              headerShadowVisible: false,
              contentStyle: {
                backgroundColor: theme.colors.background,
              },
            }}
          >
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Result"
              component={ResultScreen}
              options={{
                title: 'Analysis',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{
                title: 'Food History',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="TextInput"
              component={TextInputScreen}
              options={{
                title: 'Describe Food',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="ManualEntry"
              component={ManualEntryScreen}
              options={{
                title: 'Manual Entry',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                title: 'Settings',
                headerBackTitle: 'Back',
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

