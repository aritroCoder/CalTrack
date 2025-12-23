// History Screen
// Timeline Design (Material 3)

import React, { useState, useMemo } from 'react';
import { View, ScrollView, Image, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
    Text,
    useTheme,
    List,
    IconButton,
    Surface,
    Chip,
    Button
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore, FoodLogEntry } from '../store/appStore';

export const HistoryScreen: React.FC = () => {
    const navigation = useNavigation();
    const theme = useTheme();
    const { foodLog, removeFoodEntry, clearTodayLog, getTodayCalories } = useAppStore();

    // Get today's date string
    const todayString = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayString = yesterdayDate.toISOString().split('T')[0];

    // Get unique dates from food log
    const availableDates = useMemo(() => {
        const dates = [...new Set(foodLog.map(entry => entry.date))].sort((a, b) => b.localeCompare(a));
        return dates;
    }, [foodLog]);

    // Selected date filter - default to today if exists, otherwise most recent
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        if (availableDates.includes(todayString)) {
            return todayString;
        }
        return availableDates[0] || todayString;
    });

    // Filter entries by selected date
    const filteredEntries = useMemo(() => {
        return foodLog.filter(entry => entry.date === selectedDate);
    }, [foodLog, selectedDate]);

    const getDateTotal = (dateStr: string): number => {
        return foodLog.filter(e => e.date === dateStr).reduce((t, e) => t + e.totalCalories, 0);
    };

    const selectedDayTotal = getDateTotal(selectedDate);

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        if (dateString === todayString) return 'Today';
        if (dateString === yesterdayString) return 'Yesterday';
        return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const formatShortDate = (dateString: string): string => {
        const date = new Date(dateString);
        if (dateString === todayString) return 'Today';
        if (dateString === yesterdayString) return 'Yest.';
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const handleDelete = (entry: FoodLogEntry) => {
        Alert.alert(
            'Delete Entry',
            `Delete this ${entry.totalCalories} kcal entry?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => removeFoodEntry(entry.id) },
            ]
        );
    };

    const handleClearDay = () => {
        const dayLabel = selectedDate === todayString ? "Today's" : formatDate(selectedDate) + "'s";
        Alert.alert(
            `Clear ${dayLabel} Log`,
            `Delete all entries from ${formatDate(selectedDate)}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => {
                        if (selectedDate === todayString) clearTodayLog();
                        else filteredEntries.forEach(entry => removeFoodEntry(entry.id));
                    },
                },
            ]
        );
    };

    if (foodLog.length === 0) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 60, marginBottom: 20 }}>🍽️</Text>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 10 }}>No Food Logged</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 30 }}>
                    Start by scanning your first meal!
                </Text>
                <Button mode="contained" onPress={() => navigation.goBack()}>
                    Scan Food
                </Button>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['left', 'right']}>
            {/* Header */}
            <Surface style={{ padding: 20, backgroundColor: theme.colors.surface, elevation: 2 }} elevation={2}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>Total Calories</Text>
                        <Text variant="displaySmall" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                            {selectedDayTotal} <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>kcal</Text>
                        </Text>
                    </View>
                    {filteredEntries.length > 0 && (
                        <IconButton
                            icon="delete-sweep"
                            iconColor={theme.colors.error}
                            onPress={handleClearDay}
                            mode="contained-tonal"
                        />
                    )}
                </View>

                {/* Date Selector */}
                <View style={{ marginTop: 20 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {availableDates.map((date) => {
                            const isSelected = selectedDate === date;
                            return (
                                <Chip
                                    key={date}
                                    selected={isSelected}
                                    onPress={() => setSelectedDate(date)}
                                    showSelectedOverlay
                                    mode={isSelected ? 'flat' : 'outlined'}
                                    style={{ borderColor: isSelected ? 'transparent' : theme.colors.outline }}
                                >
                                    {formatShortDate(date)}
                                </Chip>
                            );
                        })}
                    </ScrollView>
                </View>
            </Surface>

            {/* Timeline List */}
            <FlatList
                data={filteredEntries}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                renderItem={({ item, index }) => (
                    <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                        {/* Timeline Logic */}
                        <View style={{ alignItems: 'center', marginRight: 15, width: 40 }}>
                            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <View style={{
                                flex: 1,
                                width: 2,
                                backgroundColor: theme.colors.surfaceVariant,
                                marginVertical: 5,
                                display: index === filteredEntries.length - 1 ? 'none' : 'flex'
                            }} />
                        </View>

                        {/* Content Card */}
                        <Surface style={{ flex: 1, borderRadius: 16, backgroundColor: theme.colors.surface }} elevation={1}>
                            <List.Item
                                title={item.items.map(i => i.name).join(', ')}
                                titleNumberOfLines={2}
                                titleStyle={{ fontWeight: '600' }}
                                description={`${item.mode} • ${item.totalCalories} kcal`}
                                descriptionStyle={{ color: theme.colors.primary }}
                                left={() => item.imageUri ? (
                                    <Image
                                        source={{ uri: item.imageUri }}
                                        style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: theme.colors.surfaceVariant }}
                                    />
                                ) : (
                                    <View style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 12,
                                        backgroundColor: theme.colors.secondaryContainer,
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <List.Icon icon="food" color={theme.colors.onSecondaryContainer} />
                                    </View>
                                )}
                                right={props => (
                                    <IconButton
                                        {...props}
                                        icon="delete-outline"
                                        size={20}
                                        onPress={() => handleDelete(item)}
                                        style={{ margin: 0 }}
                                    />
                                )}
                            />
                        </Surface>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 50 }}>
                        <Text>No entries for this date.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};
