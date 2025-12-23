// Manual Entry Screen
// Modern Form Design (Material 3)

import React, { useState } from 'react';
import { View, ScrollView, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
    Text,
    TextInput,
    Button,
    SegmentedButtons,
    useTheme,
    Card,
    IconButton,
    List,
    HelperText,
    Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore, FoodLogEntry } from '../store/appStore';
import { FoodItem } from '../services/geminiService';

export const ManualEntryScreen: React.FC = () => {
    const navigation = useNavigation();
    const theme = useTheme();
    const { addFoodEntry } = useAppStore();

    const [name, setName] = useState('');
    const [calories, setCalories] = useState('');
    const [portion, setPortion] = useState('');
    const [mealType, setMealType] = useState('lunch');
    const [imageUri, setImageUri] = useState<string | null>(null);

    // List of items added to this entry (temporarily stored before saving to DB)
    const [items, setItems] = useState<FoodItem[]>([]);

    const handleAddItem = () => {
        if (!name.trim() || !calories.trim()) {
            Alert.alert('Missing Fields', 'Please enter at least a name and calories.');
            return;
        }

        const newItem: FoodItem = {
            name: name.trim(),
            calories: parseInt(calories) || 0,
            portion: portion.trim() || '1 serving',
            confidence: 'high'
        };

        setItems([...items, newItem]);

        // Reset fields for next item
        setName('');
        setCalories('');
        setPortion('');
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleSaveLog = async () => {
        // If there's pending text in fields, verify if user meant to add it
        let finalItems = [...items];
        if (name.trim() && calories.trim()) {
            // Auto-add the current field content if valid
            finalItems.push({
                name: name.trim(),
                calories: parseInt(calories) || 0,
                portion: portion.trim() || '1 serving',
                confidence: 'high'
            });
        }

        if (finalItems.length === 0) {
            Alert.alert('Empty Log', 'Please add at least one food item.');
            return;
        }

        const totalCalories = finalItems.reduce((sum, item) => sum + item.calories, 0);

        const newEntry: FoodLogEntry = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0],
            items: finalItems,
            totalCalories,
            mode: 'manual',
            mealType,
            imageUri: imageUri || undefined
        };

        await addFoodEntry(newEntry);
        Alert.alert('Success', 'Food logged successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom', 'left', 'right']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

                    {/* Meal Type Selector */}
                    <Text variant="titleMedium" style={{ marginBottom: 10, fontWeight: 'bold' }}>Meal Type</Text>
                    <SegmentedButtons
                        value={mealType}
                        onValueChange={setMealType}
                        buttons={[
                            { value: 'breakfast', label: 'Breakfast', icon: 'coffee' },
                            { value: 'lunch', label: 'Lunch', icon: 'food' },
                            { value: 'dinner', label: 'Dinner', icon: 'food-variant' },
                        ]}
                        style={{ marginBottom: 20 }}
                    />

                    {/* Add Item Form */}
                    <Card style={{ marginBottom: 20 }} mode="elevated">
                        <Card.Content>
                            <Text variant="titleMedium" style={{ marginBottom: 15, fontWeight: 'bold' }}>Add Food Item</Text>

                            <TextInput
                                label="Food Name *"
                                value={name}
                                onChangeText={setName}
                                mode="outlined"
                                style={{ marginBottom: 10, backgroundColor: theme.colors.surface }}
                                placeholder="e.g., Grilled Chicken"
                            />

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <TextInput
                                        label="Calories *"
                                        value={calories}
                                        onChangeText={setCalories}
                                        mode="outlined"
                                        keyboardType="numeric"
                                        style={{ marginBottom: 10, backgroundColor: theme.colors.surface }}
                                        placeholder="e.g., 250"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <TextInput
                                        label="Portion"
                                        value={portion}
                                        onChangeText={setPortion}
                                        mode="outlined"
                                        style={{ marginBottom: 10, backgroundColor: theme.colors.surface }}
                                        placeholder="e.g., 100g"
                                    />
                                </View>
                            </View>

                            <Button
                                mode="outlined"
                                icon="plus"
                                onPress={handleAddItem}
                                style={{ marginTop: 5, borderColor: theme.colors.primary }}
                            >
                                Add Item
                            </Button>
                        </Card.Content>
                    </Card>

                    {/* Added Items List */}
                    {items.length > 0 && (
                        <View style={{ marginBottom: 20 }}>
                            <Text variant="titleMedium" style={{ marginBottom: 10, fontWeight: 'bold' }}>Items in this Meal</Text>
                            <Card mode="outlined">
                                {items.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <List.Item
                                            title={item.name}
                                            description={`${item.portion} • ${item.calories} kcal`}
                                            left={props => <List.Icon {...props} icon="food-apple" />}
                                            right={props => (
                                                <IconButton
                                                    icon="delete"
                                                    iconColor={theme.colors.error}
                                                    onPress={() => removeItem(index)}
                                                />
                                            )}
                                        />
                                        {index < items.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                                <Card.Content style={{ paddingTop: 10 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text variant="titleMedium">Total:</Text>
                                        <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                                            {items.reduce((sum, i) => sum + i.calories, 0) + (parseInt(calories) || 0)} kcal
                                        </Text>
                                    </View>
                                </Card.Content>
                            </Card>
                        </View>
                    )}

                    {/* Photo Attachment */}
                    <View style={{ marginBottom: 30 }}>
                        <Text variant="titleMedium" style={{ marginBottom: 10, fontWeight: 'bold' }}>Photo (Optional)</Text>
                        {imageUri ? (
                            <Card mode="contained" onPress={pickImage}>
                                <Card.Cover source={{ uri: imageUri }} style={{ height: 200 }} />
                                <Card.Actions>
                                    <Button onPress={() => setImageUri(null)} textColor={theme.colors.error}>Remove</Button>
                                    <Button onPress={pickImage}>Change</Button>
                                </Card.Actions>
                            </Card>
                        ) : (
                            <Button
                                mode="outlined"
                                icon="camera"
                                onPress={pickImage}
                                style={{ borderStyle: 'dashed', borderColor: theme.colors.outline }}
                                contentStyle={{ height: 60 }}
                            >
                                Attach Photo
                            </Button>
                        )}
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Floating Save Button */}
            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: theme.colors.outline, backgroundColor: theme.colors.surface }}>
                <Button
                    mode="contained"
                    onPress={handleSaveLog}
                    style={{ borderRadius: 30, paddingVertical: 4 }}
                    labelStyle={{ fontSize: 18, fontWeight: '600' }}
                >
                    Save Log
                </Button>
            </View>
        </SafeAreaView>
    );
};
