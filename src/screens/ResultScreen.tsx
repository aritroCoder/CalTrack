// Result Screen
// Analysis Result with Hero Image (Material 3)

import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Image, Dimensions, Alert } from 'react-native';
import {
    Text,
    Button,
    Card,
    useTheme,
    List,
    Chip,
    ActivityIndicator,
    Surface,
    IconButton,
    Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppStore } from '../store/appStore';
import { RootStackParamList } from '../../App';

type ResultScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Result'>;
import { analyzeFood } from '../services/geminiService';
import { getCurrentNetworkState } from '../services/networkStatus';
import { ResilientFetchError } from '../services/networkClient';

const { width, height } = Dimensions.get('window');

const ConfidenceChip = ({ confidence }: { confidence: string }) => {
    const theme = useTheme();
    let color = theme.colors.primary;
    let icon = 'check-circle';

    if (confidence === 'low') {
        color = theme.colors.error;
        icon = 'alert-circle';
    } else if (confidence === 'medium') {
        color = theme.colors.tertiary || '#F59E0B';
        icon = 'help-circle';
    }

    return (
        <Chip
            icon={icon}
            style={{ backgroundColor: theme.colors.surfaceVariant, height: 32 }}
            textStyle={{ color: color, fontSize: 12 }}
        >
            {confidence}
        </Chip>
    );
};

export const ResultScreen: React.FC = () => {
    const navigation = useNavigation<ResultScreenNavigationProp>();
    const theme = useTheme();
    const {
        currentResult,
        currentImageUri,
        currentImageBase64,
        setCurrentResult,
        setCurrentImageUri,
        setCurrentImageBase64,
        addFoodEntry,
        mode,
        isAnalyzing,
        setIsAnalyzing
    } = useAppStore();

    // Abort controller for cancellation
    const abortControllerRef = useRef<AbortController | null>(null);

    // Status message for progress feedback
    const [statusMessage, setStatusMessage] = useState<string>('Preparing analysis...');
    
    // Retry counter to trigger re-analysis when retry is clicked
    const [retryCount, setRetryCount] = useState<number>(0);

    useEffect(() => {
        const analyze = async () => {
            // If we have image base64 data but no result and are marked as analyzing, trigger image analysis
            if (currentImageBase64 && !currentResult && isAnalyzing) {
                // Create new abort controller for this request
                const controller = new AbortController();
                abortControllerRef.current = controller;

                // Pre-flight network check
                setStatusMessage('Checking connection...');
                try {
                    const network = await getCurrentNetworkState();
                    if (!network.isConnected || !network.isInternetReachable) {
                        setCurrentResult({
                            items: [],
                            totalCalories: 0,
                            success: false,
                            error: 'You appear to be offline. Please check your connection and try again.',
                        });
                        setIsAnalyzing(false);
                        return;
                    }
                } catch (checkError) {
                    console.warn('Network check failed:', checkError);
                    // Continue anyway - let the request fail naturally if needed
                }

                // Update status for upload phase
                setStatusMessage('Uploading image...');

                try {
                    // Pass abort signal to analyzeFood
                    const result = await analyzeFood(
                        currentImageBase64,
                        'image/jpeg',
                        mode,
                        controller.signal
                    );

                    // Check if we were aborted while waiting
                    if (controller.signal.aborted) {
                        return;
                    }

                    setCurrentResult(result);
                } catch (error) {
                    // Handle user cancellation silently
                    if (error instanceof ResilientFetchError && error.code === 'aborted') {
                        return;
                    }

                    console.error('Analysis failed:', error);
                    setCurrentResult({
                        items: [],
                        totalCalories: 0,
                        success: false,
                        error: error instanceof Error
                            ? error.message
                            : 'Analysis failed. Please try again.',
                    });
                } finally {
                    setIsAnalyzing(false);
                    abortControllerRef.current = null;
                }
            }
            // For text mode: TextInputScreen handles the analysis and sets currentResult directly
            // We just keep isAnalyzing true until currentResult arrives (don't prematurely set it to false)
        };
        analyze();

        // Cleanup - abort request if component unmounts
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, [currentImageBase64, mode, retryCount]);

    // Retry handler
    const handleRetry = () => {
        setCurrentResult(null);
        setStatusMessage('Preparing analysis...');
        setIsAnalyzing(true);
        setRetryCount(prev => prev + 1); // Trigger useEffect re-run
    };

    const handleAddToLog = async () => {
        if (currentResult && currentResult.success) {
            await addFoodEntry({
                imageUri: currentImageUri || undefined,
                items: currentResult.items,
                totalCalories: currentResult.totalCalories,
                mode: mode,
                mealType: currentResult.mealType,
            });

            Alert.alert(
                'Added! 🎉',
                `${currentResult.totalCalories} kcal added to your food log.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setCurrentResult(null);
                            setCurrentImageUri(null);
                            navigation.navigate('Home');
                        },
                    },
                ]
            );
        }
    };

    const handleDiscard = () => {
        setCurrentResult(null);
        setCurrentImageUri(null);
        setCurrentImageBase64(null);
        navigation.goBack();
    };

    const handleCancel = () => {
        // Abort the in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsAnalyzing(false);
        setCurrentResult(null);
        setCurrentImageUri(null);
        setCurrentImageBase64(null);
        navigation.goBack();
    };

    // Loading State - show if actively analyzing OR waiting for result
    if (isAnalyzing && !currentResult) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                {/* Dynamic status message */}
                <Text style={{ marginTop: 20, color: theme.colors.onSurfaceVariant }}>
                    {statusMessage}
                </Text>
                {/* Show thumbnail if available */}
                {currentImageUri && (
                    <Image source={{ uri: currentImageUri }} style={{ width: 100, height: 100, borderRadius: 12, marginTop: 20 }} />
                )}
                <Button
                    mode="outlined"
                    onPress={handleCancel}
                    style={{ marginTop: 30, borderRadius: 30 }}
                    textColor={theme.colors.error}
                >
                    Cancel
                </Button>
            </SafeAreaView>
        );
    }

    // Error State - with Retry button
    if (currentResult && !currentResult.success) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
                <IconButton icon="alert-circle-outline" size={60} iconColor={theme.colors.error} />
                <Text variant="headlineSmall" style={{ marginTop: 10, textAlign: 'center' }}>Analysis Failed</Text>
                <Text variant="bodyMedium" style={{ marginTop: 10, textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
                    {currentResult.error || "We couldn't identify the food. Please try again."}
                </Text>
                {/* Retry button */}
                <Button mode="contained" onPress={handleRetry} style={{ marginTop: 30, borderRadius: 30 }}>
                    Retry
                </Button>
                <Button mode="text" onPress={handleDiscard} style={{ marginTop: 10 }}>
                    Discard
                </Button>
            </SafeAreaView>
        );
    }

    // Success State
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            {/* Hero Image */}
            {currentImageUri ? (
                <Image
                    source={{ uri: currentImageUri }}
                    style={{ width: '100%', height: height * 0.4 }}
                />
            ) : (
                <View style={{ width: '100%', height: height * 0.3, backgroundColor: theme.colors.primaryContainer, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 60 }}>🍛</Text>
                </View>
            )}

            {/* Overlay Surface */}
            <Surface
                style={{
                    flex: 1,
                    marginTop: -30,
                    borderTopLeftRadius: 30,
                    borderTopRightRadius: 30,
                    backgroundColor: theme.colors.background,
                    elevation: 4
                }}
            >
                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <View>
                            <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>Analysis Result</Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
                            </Text>
                        </View>
                        <Surface style={{ padding: 8, borderRadius: 12, backgroundColor: theme.colors.primaryContainer }} elevation={0}>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onPrimaryContainer }}>
                                {currentResult?.totalCalories} kcal
                            </Text>
                        </Surface>
                    </View>

                    <Divider style={{ marginBottom: 20 }} />

                    {/* Detected Items */}
                    <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: 'bold' }}>Detected Items</Text>

                    {currentResult?.items.map((item, index) => (
                        <View key={index} style={{ marginBottom: 16 }}>
                            <Card mode="outlined" style={{ backgroundColor: theme.colors.surface }}>
                                <Card.Content>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flex: 1 }}>
                                            <Text variant="titleMedium" style={{ fontWeight: '600' }}>{item.name}</Text>
                                            {item.hindiName && <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{item.hindiName}</Text>}
                                            <Text variant="bodySmall" style={{ marginTop: 4 }}>{item.portion}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>{item.calories}</Text>
                                            <ConfidenceChip confidence={item.confidence} />
                                        </View>
                                    </View>
                                    {item.notes && (
                                        <Text variant="bodySmall" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant, fontStyle: 'italic' }}>
                                            {item.notes}
                                        </Text>
                                    )}
                                </Card.Content>
                            </Card>
                        </View>
                    ))}

                    {/* Meal Details */}
                    {(currentResult?.mealType || currentResult?.cookingStyle) && (
                        <View style={{ marginTop: 10 }}>
                            <Text variant="titleMedium" style={{ marginBottom: 10, fontWeight: 'bold' }}>Details</Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                {currentResult.mealType && (
                                    <Chip icon="food-variant">{currentResult.mealType}</Chip>
                                )}
                                {currentResult.cookingStyle && (
                                    <Chip icon="chef-hat">{currentResult.cookingStyle}</Chip>
                                )}
                            </View>
                        </View>
                    )}

                </ScrollView>
            </Surface>

            {/* Bottom Actions */}
            <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 20,
                backgroundColor: theme.colors.surface,
                borderTopWidth: 1,
                borderTopColor: theme.colors.outline,
                flexDirection: 'row',
                gap: 16
            }}>
                <Button
                    mode="outlined"
                    onPress={handleDiscard}
                    style={{ flex: 1, borderRadius: 30 }}
                    textColor={theme.colors.error}
                >
                    Discard
                </Button>
                <Button
                    mode="contained"
                    onPress={handleAddToLog}
                    style={{ flex: 2, borderRadius: 30 }}
                    icon="check"
                >
                    Add to Log
                </Button>
            </View>
        </View>
    );
};

export default ResultScreen;
