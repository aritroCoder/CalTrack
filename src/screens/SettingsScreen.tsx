// Settings Screen
// Edit user preferences (name, calorie target)

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Linking, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
    Text,
    TextInput,
    Button,
    useTheme,
    Surface,
    Divider,
    List,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '../store/appStore';

export const SettingsScreen: React.FC = () => {
    const navigation = useNavigation();
    const theme = useTheme();
    const { userSettings, saveUserSettings } = useAppStore();

    const [name, setName] = useState(userSettings?.userName || '');
    const [calorieTarget, setCalorieTarget] = useState(
        userSettings?.dailyCalorieTarget?.toString() || '2000'
    );
    const [isLoading, setIsLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        // Check if there are changes
        const nameChanged = name !== (userSettings?.userName || '');
        const targetChanged = calorieTarget !== (userSettings?.dailyCalorieTarget?.toString() || '2000');
        setHasChanges(nameChanged || targetChanged);
    }, [name, calorieTarget, userSettings]);

    const handleSave = async () => {
        // Validation
        if (!name.trim()) {
            Alert.alert('Invalid Name', 'Please enter your name');
            return;
        }

        const targetNum = parseInt(calorieTarget, 10);
        if (isNaN(targetNum) || targetNum < 500 || targetNum > 10000) {
            Alert.alert('Invalid Target', 'Please enter a valid calorie target (500-10000)');
            return;
        }

        setIsLoading(true);

        try {
            await saveUserSettings({
                userName: name.trim(),
                dailyCalorieTarget: targetNum,
            });
            Alert.alert('Saved!', 'Your settings have been updated.');
            setHasChanges(false);
        } catch (err) {
            Alert.alert('Error', 'Failed to save settings. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom', 'left', 'right']}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Profile Section */}
                <Surface style={{ borderRadius: 16, elevation: 2, marginBottom: 20 }}>
                    <List.Section>
                        <List.Subheader>Profile</List.Subheader>
                        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                            <TextInput
                                label="Your Name"
                                value={name}
                                onChangeText={setName}
                                mode="outlined"
                                style={{ marginBottom: 16 }}
                                left={<TextInput.Icon icon="account" />}
                            />

                            <TextInput
                                label="Daily Calorie Target"
                                value={calorieTarget}
                                onChangeText={setCalorieTarget}
                                mode="outlined"
                                keyboardType="numeric"
                                left={<TextInput.Icon icon="fire" />}
                                right={<TextInput.Affix text="kcal" />}
                            />
                        </View>
                    </List.Section>
                </Surface>

                {/* Save Button */}
                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={isLoading}
                    disabled={isLoading || !hasChanges}
                    style={{ borderRadius: 30, paddingVertical: 6, marginBottom: 20 }}
                    labelStyle={{ fontSize: 16 }}
                    icon="content-save"
                >
                    Save Changes
                </Button>

                {/* App Info Section */}
                <Surface style={{ borderRadius: 16, elevation: 2 }}>
                    <List.Section>
                        <List.Subheader>About</List.Subheader>
                        <List.Item
                            title="CalTrack"
                            description="Indian Food Calorie Tracker"
                            left={props => <List.Icon {...props} icon="food-apple" />}
                        />
                        <Divider />
                        <List.Item
                            title="Version"
                            description="1.0.0"
                            left={props => <List.Icon {...props} icon="information" />}
                        />
                        <Divider />
                        <TouchableOpacity onPress={() => Linking.openURL('https://github.com/aritroCoder')}>
                            <List.Item
                                title="Developer"
                                description="Aritra Bhaduri ↗"
                                left={props => <List.Icon {...props} icon="github" />}
                            />
                        </TouchableOpacity>
                    </List.Section>
                </Surface>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SettingsScreen;
