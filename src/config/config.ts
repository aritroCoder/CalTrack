// App Configuration
// Separating config from code for easy management

export const CONFIG = {
  // Portkey AI Gateway settings
  PORTKEY: {
    BASE_URL: 'https://api.portkey.ai/v1',
    CONFIG_ID: 'pc-caltra-fe98bb',
    API_KEY_ENV: 'PORTKEY_API_KEY',
  },

  // Heuristic modes for calorie estimation
  MODES: {
    LIGHT: 'light',
    HOMEMADE: 'homemade',
    RESTAURANT: 'restaurant',
  },

  // Mode multipliers (applied to base calorie values)
  MODE_MULTIPLIERS: {
    light: 0.7,      // Lower bound, no oil
    homemade: 1.0,   // Standard mid-range
    restaurant: 1.8, // Upper bound, high oil/butter
  },

  // App theme colors (Indian themed)
  COLORS: {
    primary: '#FF9933',      // Saffron
    secondary: '#138808',    // Indian green
    accent: '#000080',       // Navy blue
    background: '#1a1a2e',   // Dark background
    surface: '#16213e',      // Surface color
    surfaceLight: '#1e2a4a', // Lighter surface for cards
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#f44336',
  },

  // AsyncStorage keys
  STORAGE_KEYS: {
    MODE: '@caltrack_mode',
    FOOD_LOG: '@caltrack_food_log',
  },
};

export default CONFIG;
