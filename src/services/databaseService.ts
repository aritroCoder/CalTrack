// Database Service for SQLite persistence
// Stores food log entries locally on device

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { FoodItem } from './geminiService';

// Define the database name
const DATABASE_NAME = 'caltrack.db';

// Food log entry type for database
export interface FoodLogEntry {
    id: string;
    timestamp: number;
    date: string; // YYYY-MM-DD format
    imageUri?: string;
    items: FoodItem[];
    totalCalories: number;
    mode: string;
    mealType?: string;
}

// User settings type
export interface UserSettings {
    userName: string;
    dailyCalorieTarget: number;
}

// Database instance
let db: SQLite.SQLiteDatabase | null = null;

// Mock data for web
let webMockData: FoodLogEntry[] = [];
let webMockSettings: UserSettings | null = null;

/**
 * Initialize the database and create tables if they don't exist
 */
export const initDatabase = async (): Promise<void> => {
    if (Platform.OS === 'web') {
        console.log('Web environment detected - using mock database');
        return;
    }

    try {
        db = await SQLite.openDatabaseAsync(DATABASE_NAME);

        // Create food_log table if it doesn't exist
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS food_log (
                id TEXT PRIMARY KEY NOT NULL,
                timestamp INTEGER NOT NULL,
                date TEXT NOT NULL,
                imageUri TEXT,
                items TEXT NOT NULL,
                totalCalories INTEGER NOT NULL,
                mode TEXT NOT NULL,
                mealType TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_food_log_date ON food_log(date);
            CREATE INDEX IF NOT EXISTS idx_food_log_timestamp ON food_log(timestamp);
        `);

        // Create user_settings table if it doesn't exist
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS user_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                userName TEXT NOT NULL,
                dailyCalorieTarget INTEGER NOT NULL DEFAULT 2000,
                createdAt INTEGER NOT NULL,
                updatedAt INTEGER NOT NULL
            );
        `);

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
};

/**
 * Get the database instance, initializing if needed
 */
const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
    if (Platform.OS === 'web') {
        throw new Error('Cannot get SQLite DB on web');
    }
    if (!db) {
        await initDatabase();
    }
    return db!;
};

/**
 * Add a new food entry to the database
 */
export const addFoodEntry = async (entry: FoodLogEntry): Promise<void> => {
    if (Platform.OS === 'web') {
        webMockData.unshift(entry);
        return;
    }

    const database = await getDb();

    await database.runAsync(
        `INSERT INTO food_log (id, timestamp, date, imageUri, items, totalCalories, mode, mealType)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            entry.id,
            entry.timestamp,
            entry.date,
            entry.imageUri || null,
            JSON.stringify(entry.items), // Store items as JSON string
            entry.totalCalories,
            entry.mode,
            entry.mealType || null,
        ]
    );
};

/**
 * Get all food entries, ordered by timestamp descending
 */
export const getAllFoodEntries = async (): Promise<FoodLogEntry[]> => {
    if (Platform.OS === 'web') {
        return [...webMockData];
    }

    const database = await getDb();

    const rows = await database.getAllAsync<{
        id: string;
        timestamp: number;
        date: string;
        imageUri: string | null;
        items: string;
        totalCalories: number;
        mode: string;
        mealType: string | null;
    }>('SELECT * FROM food_log ORDER BY timestamp DESC');

    return rows.map((row) => ({
        id: row.id,
        timestamp: row.timestamp,
        date: row.date,
        imageUri: row.imageUri || undefined,
        items: JSON.parse(row.items) as FoodItem[],
        totalCalories: row.totalCalories,
        mode: row.mode,
        mealType: row.mealType || undefined,
    }));
};

/**
 * Get food entries for a specific date
 */
export const getFoodEntriesByDate = async (date: string): Promise<FoodLogEntry[]> => {
    if (Platform.OS === 'web') {
        return webMockData.filter(e => e.date === date);
    }

    const database = await getDb();

    const rows = await database.getAllAsync<{
        id: string;
        timestamp: number;
        date: string;
        imageUri: string | null;
        items: string;
        totalCalories: number;
        mode: string;
        mealType: string | null;
    }>('SELECT * FROM food_log WHERE date = ? ORDER BY timestamp DESC', [date]);

    return rows.map((row) => ({
        id: row.id,
        timestamp: row.timestamp,
        date: row.date,
        imageUri: row.imageUri || undefined,
        items: JSON.parse(row.items) as FoodItem[],
        totalCalories: row.totalCalories,
        mode: row.mode,
        mealType: row.mealType || undefined,
    }));
};

/**
 * Remove a food entry by ID
 */
export const removeFoodEntry = async (id: string): Promise<void> => {
    if (Platform.OS === 'web') {
        webMockData = webMockData.filter(e => e.id !== id);
        return;
    }

    const database = await getDb();
    await database.runAsync('DELETE FROM food_log WHERE id = ?', [id]);
};

/**
 * Clear all entries for a specific date
 */
export const clearEntriesByDate = async (date: string): Promise<void> => {
    if (Platform.OS === 'web') {
        webMockData = webMockData.filter(e => e.date !== date);
        return;
    }

    const database = await getDb();
    await database.runAsync('DELETE FROM food_log WHERE date = ?', [date]);
};

/**
 * Get total calories for a specific date
 */
export const getTotalCaloriesByDate = async (date: string): Promise<number> => {
    if (Platform.OS === 'web') {
        return webMockData
            .filter(e => e.date === date)
            .reduce((sum, e) => sum + e.totalCalories, 0);
    }

    const database = await getDb();

    const result = await database.getFirstAsync<{ total: number | null }>(
        'SELECT SUM(totalCalories) as total FROM food_log WHERE date = ?',
        [date]
    );

    return result?.total || 0;
};

/**
 * Get count of entries for a specific date
 */
export const getEntryCountByDate = async (date: string): Promise<number> => {
    if (Platform.OS === 'web') {
        return webMockData.filter(e => e.date === date).length;
    }

    const database = await getDb();

    const result = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM food_log WHERE date = ?',
        [date]
    );

    return result?.count || 0;
};

/**
 * Get user settings
 */
export const getUserSettings = async (): Promise<UserSettings | null> => {
    if (Platform.OS === 'web') {
        return webMockSettings;
    }

    const database = await getDb();

    const row = await database.getFirstAsync<{
        userName: string;
        dailyCalorieTarget: number;
    }>('SELECT userName, dailyCalorieTarget FROM user_settings WHERE id = 1');

    if (!row) {
        return null;
    }

    return {
        userName: row.userName,
        dailyCalorieTarget: row.dailyCalorieTarget,
    };
};

/**
 * Save user settings (insert or update)
 */
export const saveUserSettings = async (settings: UserSettings): Promise<void> => {
    if (Platform.OS === 'web') {
        webMockSettings = settings;
        return;
    }

    const database = await getDb();
    const now = Date.now();

    // Use INSERT OR REPLACE to handle both insert and update
    await database.runAsync(
        `INSERT OR REPLACE INTO user_settings (id, userName, dailyCalorieTarget, createdAt, updatedAt)
         VALUES (1, ?, ?, COALESCE((SELECT createdAt FROM user_settings WHERE id = 1), ?), ?)`,
        [settings.userName, settings.dailyCalorieTarget, now, now]
    );
};

/**
 * Check if user has completed onboarding
 */
export const hasCompletedOnboarding = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
        return webMockSettings !== null;
    }

    const database = await getDb();

    const result = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM user_settings WHERE id = 1'
    );

    return (result?.count || 0) > 0;
};

export default {
    initDatabase,
    addFoodEntry,
    getAllFoodEntries,
    getFoodEntriesByDate,
    removeFoodEntry,
    clearEntriesByDate,
    getTotalCaloriesByDate,
    getEntryCountByDate,
    getUserSettings,
    saveUserSettings,
    hasCompletedOnboarding,
};
