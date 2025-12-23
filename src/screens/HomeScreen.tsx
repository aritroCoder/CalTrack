// Home Screen
// New Dashboard Design (Material 3 Light)

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Animated, Dimensions, Alert } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Svg, Circle, G, Text as SvgText } from 'react-native-svg';
import {
    Text,
    Surface,
    IconButton,
    TouchableRipple,
    useTheme,
    List,
    Divider,
    Button,
    Chip
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore, FoodLogEntry } from '../store/appStore';
import { RootStackParamList } from '../../App';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');

// Circular Progress Component
const CircularProgress = ({
    size = 200,
    strokeWidth = 15,
    progress = 0,
    total = 2000,
    color = '#2563EB'
}) => {
    const theme = useTheme();
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const alpha = Math.min(progress / total, 1) * 2 * Math.PI;
    const strokeDashoffset = circumference - (Math.min(progress / total, 1)) * circumference;

    return (
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Svg height={size} width={size}>
                <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                    {/* Background Circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={theme.colors.surfaceVariant}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Progress Circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                    />
                </G>
            </Svg>
            <View style={{ position: 'absolute', alignItems: 'center' }}>
                <Text variant="displayMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                    {progress}
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    / {total} kcal
                </Text>
            </View>
        </View>
    );
};

// Quick Action Button Component
const ActionButton = ({ icon, label, onPress, color }: { icon: string, label: string, onPress: () => void, color: string }) => {
    const theme = useTheme();

    return (
        <Surface
            style={{
                width: (width - 60) / 3,
                height: 100,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surface,
                elevation: 2,
            }}
            elevation={2}
        >
            <TouchableRipple
                onPress={onPress}
                style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}
                borderless
            >
                <>
                    <View style={{
                        backgroundColor: theme.colors.secondaryContainer,
                        padding: 10,
                        borderRadius: 12,
                        marginBottom: 8
                    }}>
                        <IconButton icon={icon} size={24} iconColor={theme.colors.onSecondaryContainer} style={{ margin: 0 }} />
                    </View>
                    <Text variant="labelMedium" style={{ fontWeight: '600' }}>{label}</Text>
                </>
            </TouchableRipple>
        </Surface>
    );
};

export const HomeScreen: React.FC = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const isFocused = useIsFocused();
    const theme = useTheme();
    const {
        getTodayCalories,
        getTodayEntries,
        setIsAnalyzing,
        setCurrentImageUri,
        setCurrentImageBase64,
        setCurrentResult,
        userSettings,
        mode,
        setMode
    } = useAppStore();

    const [todayCalories, setTodayCalories] = useState(0);
    const [todayEntries, setTodayEntries] = useState<FoodLogEntry[]>([]);

    useEffect(() => {
        if (isFocused) {
            setTodayCalories(getTodayCalories());
            setTodayEntries(getTodayEntries());
        }
    }, [isFocused]);

    const handleCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need camera permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            processImage(result.assets[0].uri, result.assets[0].base64);
        }
    };

    const handleGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            processImage(result.assets[0].uri, result.assets[0].base64);
        }
    };

    const handleScanPress = () => {
        Alert.alert(
            'Scan Food',
            'Choose a photo source',
            [
                {
                    text: 'Camera',
                    onPress: handleCamera
                },
                {
                    text: 'Gallery',
                    onPress: handleGallery
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ]
        );
    };

    const processImage = async (uri: string, base64: string) => {
        setCurrentImageUri(uri);
        setCurrentImageBase64(base64);
        setIsAnalyzing(true);
        navigation.navigate('Result');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
                {/* Header Section */}
                <View style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                        <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Text>
                        <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
                            Hello, {userSettings?.userName || 'Friend'} 👋
                        </Text>
                    </View>
                    <IconButton
                        icon="cog"
                        size={24}
                        onPress={() => navigation.navigate('Settings')}
                        style={{ marginTop: -4 }}
                    />
                </View>

                {/* Progress Section */}
                <View style={{ alignItems: 'center', marginVertical: 10 }}>
                    <CircularProgress
                        progress={todayCalories}
                        total={userSettings?.dailyCalorieTarget || 2000}
                        color={theme.colors.primary}
                    />
                </View>

                {/* Mode Selector */}
                <View style={{ paddingHorizontal: 20, marginVertical: 10 }}>
                    <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8, textAlign: 'center' }}>
                        Cooking Style
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                        <Chip
                            selected={mode === 'light'}
                            onPress={() => setMode('light')}
                            mode="outlined"
                            style={{ borderColor: mode === 'light' ? theme.colors.primary : theme.colors.outline }}
                        >
                            🥗 Light
                        </Chip>
                        <Chip
                            selected={mode === 'homemade'}
                            onPress={() => setMode('homemade')}
                            mode="outlined"
                            style={{ borderColor: mode === 'homemade' ? theme.colors.primary : theme.colors.outline }}
                        >
                            🏠 Homemade
                        </Chip>
                        <Chip
                            selected={mode === 'restaurant'}
                            onPress={() => setMode('restaurant')}
                            mode="outlined"
                            style={{ borderColor: mode === 'restaurant' ? theme.colors.primary : theme.colors.outline }}
                        >
                            🍽️ Restaurant
                        </Chip>
                    </View>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6, textAlign: 'center' }}>
                        {mode === 'light' ? 'Lower calories (no oil/butter)' :
                            mode === 'restaurant' ? 'Higher calories (rich preparation)' :
                                'Standard home cooking'}
                    </Text>
                </View>

                {/* Action Grid */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 20 }}>
                    <ActionButton
                        icon="camera"
                        label="Scan"
                        color={theme.colors.primary}
                        onPress={handleScanPress}
                    />
                    <ActionButton
                        icon="pencil"
                        label="Text"
                        color={theme.colors.secondary}
                        onPress={() => navigation.navigate('TextInput')}
                    />
                    <ActionButton
                        icon="plus"
                        label="Manual"
                        color={theme.colors.tertiary || '#F59E0B'}
                        onPress={() => navigation.navigate('ManualEntry')}
                    />
                </View>

                {/* Recent Logs Section */}
                <View style={{ paddingHorizontal: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Recent Meals</Text>
                        <Button mode="text" onPress={() => navigation.navigate('History')}>
                            View All
                        </Button>
                    </View>

                    <Surface style={{ borderRadius: 12, backgroundColor: theme.colors.surface, elevation: 1 }} elevation={1}>
                        {todayEntries.length === 0 ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: theme.colors.onSurfaceVariant }}>No meals logged today</Text>
                            </View>
                        ) : (
                            todayEntries.slice(0, 3).map((entry, index) => (
                                <View key={entry.id}>
                                    <List.Item
                                        title={entry.items[0]?.name || 'Meal'}
                                        description={`${new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${entry.mode}`}
                                        left={props => <List.Icon {...props} icon="food" color={theme.colors.primary} />}
                                        right={props => (
                                            <Text {...props} style={{ alignSelf: 'center', fontWeight: 'bold', marginRight: 10 }}>
                                                {entry.totalCalories} kcal
                                            </Text>
                                        )}
                                    />
                                    {index < Math.min(todayEntries.length, 3) - 1 && <Divider />}
                                </View>
                            ))
                        )}
                    </Surface>
                </View>

                {/* Optional: Gallery hidden or integrated? 
                    Mockup showed "Scan", "Text", "Manual".
                    Gallery access can be inside "Scan" sheet or a separate button.
                    For now I'll stick to 3 main actions. If user wants Gallery, maybe inside Scan?
                    Or just add a small "Gallery" link below scan?
                    Actually, "Scan" usually asks Camera or Gallery. 
                    I'll keep it simple: ActionButton "Scan" -> Camera, maybe long press for gallery? 
                    Or just add a 4th button? 
                    Wait, mockup had 3. 
                    I'll add "Gallery" as a smaller option or make "Scan" open an Alert/Modal to choose. 
                    For S24 screen size, 3 buttons fit perfectly. 
                    I'll change "Scan" to trigger an action sheet-like choice if possible, 
                    OR just add a FAB for gallery?
                    Let's just adding a small text link "Import from Gallery" below or similar.
                    OR, for now, just make the "Scan" button trigger handleCamera, 
                    and maybe add a smaller "Gallery" button?
                    The original app had both. 
                    Let's update ActionButton to "Scan" (Camera) and maybe add Gallery accessibility. 
                    I'll change the Layout to 2x2 grid? Start with 3 row.
                    I'll add a helper text to use Gallery? 
                    I'll stick to the "Action Grid" design. 
                    I'll modify `handleCamera` to perform the choice (Camera/Gallery) via Alert for now to keep UI clean!
                */}
            </ScrollView>
        </SafeAreaView>
    );
};
