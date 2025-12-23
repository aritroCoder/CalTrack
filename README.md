# CalTrack 🍛

An Indian food calorie tracking app powered by AI. Scan food images, describe meals, or manually log your calorie intake.

## Features

- 📷 **Scan Food** - Take a photo of your meal for instant calorie analysis
- ✍️ **Describe Food** - Type a description and get calorie estimates
- ➕ **Manual Entry** - Add custom food items manually
- 📊 **Daily Tracking** - View your daily calorie progress
- 📜 **History** - Browse your food log by date
- 🎯 **Personalized Goals** - Set your own daily calorie target

## Tech Stack

- **React Native** with Expo
- **TypeScript**
- **React Native Paper** (Material Design 3)
- **SQLite** for local storage
- **Portkey AI Gateway** for LLM routing

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (for testing)

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/aritroCoder/caltrack.git
   cd caltrack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the project root:
   ```env
   PORTKEY_API_KEY=your_portkey_api_key_here
   ```
   
   Get your Portkey API key from [portkey.ai](https://portkey.ai)

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on your device**
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Or press `a` to open on Android emulator
   - Or press `w` to open in web browser

## Building APK

```bash
# Using EAS Build (recommended)
npx eas build --platform android --profile preview

# Or run locally (requires Android SDK)
npx expo run:android --variant release
```

## Project Structure

```
caltrack/
├── App.tsx                 # Main app entry point
├── src/
│   ├── config/
│   │   ├── config.ts       # App configuration
│   │   └── prompts.ts      # AI prompt templates
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Dashboard
│   │   ├── ResultScreen.tsx    # Analysis results
│   │   ├── HistoryScreen.tsx   # Food history
│   │   ├── TextInputScreen.tsx # Text-based input
│   │   ├── ManualEntryScreen.tsx # Manual food entry
│   │   ├── OnboardingScreen.tsx  # First-run setup
│   │   └── SettingsScreen.tsx    # User settings
│   ├── services/
│   │   ├── geminiService.ts    # AI API integration
│   │   └── databaseService.ts  # SQLite operations
│   ├── store/
│   │   └── appStore.ts     # Zustand state management
│   └── theme/
│       └── index.ts        # App theme configuration
└── .env                    # Environment variables
```

## License

MIT

## Developer

[Aritra Bhaduri](https://github.com/aritroCoder)
