// Text Input Screen
// Natural language food description (AI)

import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    Text,
    TextInput,
    Button,
    useTheme,
    Chip,
    ActivityIndicator,
    Surface
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '../store/appStore';
import { analyzeFoodFromText } from '../services/geminiService';
import { getCurrentNetworkState } from '../services/networkStatus';
import { RootStackParamList } from '../../App';

const EXAMPLE_PROMPTS = [
    "2 chapati with dal and curd",
    "Chicken biryani with raita",
    "1 masala dosa and filter coffee",
    "Oatmeal with banana and almonds"
];

type TextInputNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TextInput'>;

export const TextInputScreen: React.FC = () => {
    const navigation = useNavigation<TextInputNavigationProp>();
    const theme = useTheme();
    const {
        setIsAnalyzing,
        setCurrentResult,
        setCurrentImageUri,
        mode
    } = useAppStore();

    const [text, setText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    // Abort controller for cancellation
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
            }
        );

        // Cleanup - abort request if component unmounts
        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, []);

    const handleAnalyze = async () => {
        if (!text.trim()) {
            Alert.alert('Empty Description', 'Please describe your food first.');
            return;
        }

        setIsProcessing(true);
        Keyboard.dismiss();

        // Pre-flight network check
        try {
            const network = await getCurrentNetworkState();
            if (!network.isConnected || !network.isInternetReachable) {
                Alert.alert('No Connection', 'You appear to be offline. Please check your connection and try again.');
                setIsProcessing(false);
                return;
            }
        } catch (checkError) {
            console.warn('Network check failed:', checkError);
            // Continue anyway
        }

        // Create abort controller for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            // Use dummy image URI for text-based entries placeholder
            setCurrentImageUri(null);

            // Set global loading state
            setIsAnalyzing(true);

            // Allow navigation to happen immediately 
            navigation.navigate('Result');

            // Perform analysis with mode and abort signal
            const result = await analyzeFoodFromText(text, mode, controller.signal);

            // Only set result if not aborted
            if (!controller.signal.aborted) {
                setCurrentResult(result);
            }

        } catch (error) {
            // Don't show error if aborted
            if (controller.signal.aborted) {
                return;
            }
            console.error(error);
            Alert.alert('Error', 'Failed to analyze text. Please try again.');
            navigation.goBack();
        } finally {
            setIsProcessing(false);
            setIsAnalyzing(false);
            abortControllerRef.current = null;
        }
    };

    const handlePromptClick = (prompt: string) => {
        setText(prompt);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom', 'left', 'right']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 10 }}>
                        Describe your meal
                    </Text>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 20 }}>
                        Tell AI what you ate, and let it estimate calories.
                    </Text>

                    <Surface style={{ borderRadius: 16, elevation: 2, marginBottom: 20 }}>
                        <TextInput
                            mode="flat"
                            placeholder="e.g., I had 2 idlis with sambar for breakfast..."
                            value={text}
                            onChangeText={setText}
                            multiline
                            numberOfLines={6}
                            style={{
                                backgroundColor: theme.colors.surface,
                                borderRadius: 16,
                                fontSize: 18,
                                minHeight: 150,
                                maxHeight: 200,
                            }}
                            underlineColor="transparent"
                            activeUnderlineColor="transparent"
                            contentStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
                        />
                    </Surface>

                    {!isKeyboardVisible && (
                        <View style={{ marginBottom: 20 }}>
                            <Text variant="titleSmall" style={{ marginBottom: 10, fontWeight: 'bold' }}>Examples</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {EXAMPLE_PROMPTS.map((prompt, index) => (
                                    <Chip
                                        key={index}
                                        onPress={() => handlePromptClick(prompt)}
                                        mode="outlined"
                                        style={{ borderColor: theme.colors.primary }}
                                    >
                                        {prompt}
                                    </Chip>
                                ))}
                            </View>
                        </View>
                    )}

                    <Button
                        mode="contained"
                        onPress={handleAnalyze}
                        loading={isProcessing}
                        disabled={isProcessing || !text.trim()}
                        style={{ borderRadius: 30, paddingVertical: 6, marginTop: 10 }}
                        labelStyle={{ fontSize: 18 }}
                        icon="creation"
                    >
                        Analyze
                    </Button>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};
