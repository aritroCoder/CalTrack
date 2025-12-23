// Global State Store using Zustand
// Manages app state including mode selection and food log
// Uses SQLite for persistent storage

import { create } from 'zustand';
import { CONFIG } from '../config/config';
import { FoodItem, AnalysisResult } from '../services/geminiService';
import * as db from '../services/databaseService';

// Food log entry type
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

// Store state type
interface AppState {
    // Database initialized flag
    isDbInitialized: boolean;
    initializeDatabase: () => Promise<void>;

    // User settings
    userSettings: db.UserSettings | null;
    isOnboardingComplete: boolean;
    loadUserSettings: () => Promise<void>;
    saveUserSettings: (settings: db.UserSettings) => Promise<void>;

    // Current cooking mode
    mode: string;
    setMode: (mode: string) => void;

    // Food log
    foodLog: FoodLogEntry[];
    loadFoodLog: () => Promise<void>;
    addFoodEntry: (entry: Omit<FoodLogEntry, 'id' | 'timestamp' | 'date'>) => Promise<void>;
    removeFoodEntry: (id: string) => Promise<void>;
    clearTodayLog: () => Promise<void>;

    // Current analysis result (temporary)
    currentResult: AnalysisResult | null;
    setCurrentResult: (result: AnalysisResult | null) => void;
    currentImageUri: string | null;
    setCurrentImageUri: (uri: string | null) => void;
    currentImageBase64: string | null;
    setCurrentImageBase64: (base64: string | null) => void;

    // Loading state
    isAnalyzing: boolean;
    setIsAnalyzing: (loading: boolean) => void;

    // Computed values
    getTodayCalories: () => number;
    getTodayEntries: () => FoodLogEntry[];
}

// Helper to get today's date string
const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0];
};

// Generate unique ID
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Create the store
export const useAppStore = create<AppState>((set, get) => ({
    // Database initialization
    isDbInitialized: false,
    initializeDatabase: async () => {
        try {
            await db.initDatabase();
            const entries = await db.getAllFoodEntries();
            const userSettings = await db.getUserSettings();
            const onboardingComplete = await db.hasCompletedOnboarding();
            set({
                isDbInitialized: true,
                foodLog: entries,
                userSettings: userSettings,
                isOnboardingComplete: onboardingComplete
            });
            console.log(`Database initialized. Loaded ${entries.length} entries. Onboarding: ${onboardingComplete}`);
        } catch (error) {
            console.error('Failed to initialize database:', error);
            set({ isDbInitialized: true }); // Set to true anyway to prevent infinite retries
        }
    },

    // User settings
    userSettings: null,
    isOnboardingComplete: false,
    loadUserSettings: async () => {
        try {
            const settings = await db.getUserSettings();
            const onboardingComplete = await db.hasCompletedOnboarding();
            set({ userSettings: settings, isOnboardingComplete: onboardingComplete });
        } catch (error) {
            console.error('Failed to load user settings:', error);
        }
    },
    saveUserSettings: async (settings: db.UserSettings) => {
        try {
            await db.saveUserSettings(settings);
            set({ userSettings: settings, isOnboardingComplete: true });
        } catch (error) {
            console.error('Failed to save user settings:', error);
            throw error;
        }
    },

    // Default mode is homemade
    mode: CONFIG.MODES.HOMEMADE,
    setMode: (mode: string) => set({ mode }),

    // Food log
    foodLog: [],
    loadFoodLog: async () => {
        try {
            const entries = await db.getAllFoodEntries();
            set({ foodLog: entries });
        } catch (error) {
            console.error('Failed to load food log:', error);
        }
    },
    addFoodEntry: async (entry) => {
        const newEntry: FoodLogEntry = {
            ...entry,
            id: generateId(),
            timestamp: Date.now(),
            date: getTodayDate(),
        };

        // Update local state immediately for responsiveness
        set((state) => ({
            foodLog: [newEntry, ...state.foodLog],
        }));

        // Persist to database
        try {
            await db.addFoodEntry(newEntry);
        } catch (error) {
            console.error('Failed to save entry to database:', error);
            // Rollback on failure
            set((state) => ({
                foodLog: state.foodLog.filter((e) => e.id !== newEntry.id),
            }));
        }
    },
    removeFoodEntry: async (id: string) => {
        // Store the entry in case we need to rollback
        const entry = get().foodLog.find((e) => e.id === id);

        // Update local state immediately
        set((state) => ({
            foodLog: state.foodLog.filter((e) => e.id !== id),
        }));

        // Persist to database
        try {
            await db.removeFoodEntry(id);
        } catch (error) {
            console.error('Failed to remove entry from database:', error);
            // Rollback on failure
            if (entry) {
                set((state) => ({
                    foodLog: [entry, ...state.foodLog].sort((a, b) => b.timestamp - a.timestamp),
                }));
            }
        }
    },
    clearTodayLog: async () => {
        const today = getTodayDate();
        const todayEntries = get().foodLog.filter((e) => e.date === today);

        // Update local state immediately
        set((state) => ({
            foodLog: state.foodLog.filter((e) => e.date !== today),
        }));

        // Persist to database
        try {
            await db.clearEntriesByDate(today);
        } catch (error) {
            console.error('Failed to clear today entries from database:', error);
            // Rollback on failure
            set((state) => ({
                foodLog: [...todayEntries, ...state.foodLog].sort((a, b) => b.timestamp - a.timestamp),
            }));
        }
    },

    // Current analysis
    currentResult: null,
    setCurrentResult: (result) => set({ currentResult: result }),
    currentImageUri: null,
    setCurrentImageUri: (uri) => set({ currentImageUri: uri }),
    currentImageBase64: null,
    setCurrentImageBase64: (base64) => set({ currentImageBase64: base64 }),

    // Loading
    isAnalyzing: false,
    setIsAnalyzing: (loading) => set({ isAnalyzing: loading }),

    // Computed: Get today's total calories
    getTodayCalories: () => {
        const today = getTodayDate();
        const todayEntries = get().foodLog.filter((entry) => entry.date === today);
        return todayEntries.reduce((total, entry) => total + entry.totalCalories, 0);
    },

    // Computed: Get today's entries
    getTodayEntries: () => {
        const today = getTodayDate();
        return get().foodLog.filter((entry) => entry.date === today);
    },
}));

export default useAppStore;
