// Onboarding Screen
// First-run setup for user name and calorie target

import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    Text,
    TextInput,
    Button,
    useTheme,
    Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '../store/appStore';
import { RootStackParamList } from '../../App';

type OnboardingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export const OnboardingScreen: React.FC = () => {
    const navigation = useNavigation<OnboardingNavigationProp>();
    const theme = useTheme();
    const { saveUserSettings } = useAppStore();

    const [name, setName] = useState('');
    const [calorieTarget, setCalorieTarget] = useState('2000');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGetStarted = async () => {
        // Validation
        if (!name.trim()) {
            setError('Please enter your name');
            return;
        }

        const targetNum = parseInt(calorieTarget, 10);
        if (isNaN(targetNum) || targetNum < 500 || targetNum > 10000) {
            setError('Please enter a valid calorie target (500-10000)');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await saveUserSettings({
                userName: name.trim(),
                dailyCalorieTarget: targetNum,
            });
            // Navigate to Home - the navigation will handle the reset
            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
            });
        } catch (err) {
            setError('Failed to save settings. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, padding: 24 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Welcome Header */}
                    <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 40 }}>
                        <Text style={{ fontSize: 60, marginBottom: 16 }}>🍛</Text>
                        <Text variant="headlineLarge" style={{ fontWeight: 'bold', textAlign: 'center' }}>
                            Welcome to CalTrack
                        </Text>
                        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
                            Your personal Indian food calorie tracker
                        </Text>
                    </View>

                    {/* Form */}
                    <Surface style={{ padding: 20, borderRadius: 16, elevation: 2 }}>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 20 }}>
                            Let's set up your profile
                        </Text>

                        <TextInput
                            label="Your Name"
                            value={name}
                            onChangeText={setName}
                            mode="outlined"
                            placeholder="e.g., Rahul"
                            style={{ marginBottom: 16 }}
                            left={<TextInput.Icon icon="account" />}
                        />

                        <TextInput
                            label="Daily Calorie Target"
                            value={calorieTarget}
                            onChangeText={setCalorieTarget}
                            mode="outlined"
                            keyboardType="numeric"
                            placeholder="2000"
                            style={{ marginBottom: 8 }}
                            left={<TextInput.Icon icon="fire" />}
                            right={<TextInput.Affix text="kcal" />}
                        />

                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
                            This is your daily goal. You can change it later in settings.
                        </Text>

                        {error ? (
                            <Text variant="bodySmall" style={{ color: theme.colors.error, marginBottom: 16 }}>
                                {error}
                            </Text>
                        ) : null}
                    </Surface>

                    {/* Get Started Button */}
                    <View style={{ marginTop: 'auto', paddingTop: 24 }}>
                        <Button
                            mode="contained"
                            onPress={handleGetStarted}
                            loading={isLoading}
                            disabled={isLoading}
                            style={{ borderRadius: 30, paddingVertical: 6 }}
                            labelStyle={{ fontSize: 18 }}
                            icon="arrow-right"
                            contentStyle={{ flexDirection: 'row-reverse' }}
                        >
                            Get Started
                        </Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default OnboardingScreen;
