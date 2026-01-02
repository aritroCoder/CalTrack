# Network Resilience Implementation Plan

> **Problem**: Photo uploads get stuck and never recover when network conditions are poor (3G, band switching, coverage gaps).

## Executive Summary

The CalTrack app currently uses raw `fetch()` with zero network resilience. When users are on slow/unstable mobile networks, the "Analyzing your food..." spinner hangs indefinitely with no way to recover except force-closing the app.

**Solution**: Add a resilient fetch wrapper with timeout, retry logic, abort support, and network awareness—all using Expo-compatible packages.

**Effort**: 1-2 days | **Files Changed**: 4 | **New Dependencies**: 1 (`expo-network`)

---

## Table of Contents

1. [Current Problems](#1-current-problems)
2. [Architecture Overview](#2-architecture-overview)
3. [Implementation Details](#3-implementation-details)
   - [3.1 Network Client (New)](#31-network-client-new)
   - [3.2 Network Status Helper (New)](#32-network-status-helper-new)
   - [3.3 Gemini Service (Modify)](#33-gemini-service-modify)
   - [3.4 Result Screen (Modify)](#34-result-screen-modify)
4. [Configuration Values](#4-configuration-values)
5. [User Experience Changes](#5-user-experience-changes)
6. [Testing Plan](#6-testing-plan)
7. [Future Enhancements](#7-future-enhancements)

---

## 1. Current Problems

### Code Analysis

**`geminiService.ts`** - Uses raw `fetch()` with no resilience:

```typescript
// Current implementation - NO timeout, NO retry, NO abort
const response = await fetch(`${PORTKEY_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { ... },
    body: JSON.stringify(requestBody), // Contains base64 image (~500KB-2MB)
});
```

**`ResultScreen.tsx`** - No network awareness or cancellation:

```typescript
// Current implementation - hangs forever on network issues
useEffect(() => {
    if (currentImageBase64 && !currentResult && isAnalyzing) {
        try {
            const result = await analyzeFood(currentImageBase64, 'image/jpeg', mode);
            setCurrentResult(result);
        } catch (error) {
            // Only catches thrown errors, not network timeouts
        }
    }
}, [currentImageBase64, mode]);
```

### Failure Scenarios

| Scenario | Current Behavior | Impact |
|----------|------------------|--------|
| Offline | Spinner forever | User must force-close app |
| Slow 3G (1 Mbps) | Spinner forever | 2MB upload takes 16s+, often fails silently |
| Band switch (3G↔4G↔5G) | Request dies silently | No retry, no error shown |
| User taps Cancel | UI changes, request continues | Wastes bandwidth, confusing state |
| WiFi → Cellular handoff | Connection drops mid-upload | No recovery mechanism |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ResultScreen.tsx                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────┐ │
│  │  AbortController │  │  Network Check   │  │  Status Messages  │ │
│  │  (user cancel +  │  │  (pre-flight)    │  │  (progress UX)    │ │
│  │   cleanup)       │  │                  │  │                   │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────────────────┘ │
└───────────┼──────────────────────┼──────────────────────────────────┘
            │                      │
            ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        geminiService.ts                             │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ analyzeFood(base64, mimeType, mode, signal?)                   ││
│  │   └─► makePortkeyRequest(..., { signal })                      ││
│  │         └─► resilientFetch() ◄── timeout/retry/abort           ││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   src/services/networkClient.ts                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ resilientFetch(url, options)                                   ││
│  │   • Timeout: 30s per attempt                                   ││
│  │   • Retries: 2 with exponential backoff (1.5s → 3s)            ││
│  │   • AbortSignal: user cancel + component cleanup               ││
│  │   • Typed errors: timeout | aborted | offline | network        ││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   src/services/networkStatus.ts                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ getCurrentNetworkState()                                       ││
│  │   • Uses expo-network (Expo-managed, no native config)         ││
│  │   • Returns: { isConnected, isInternetReachable, type }        ││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Implementation Details

### 3.1 Network Client (New)

**File**: `src/services/networkClient.ts`

**Purpose**: Resilient fetch wrapper with timeout, retry, and abort support.

```typescript
// src/services/networkClient.ts

/**
 * Error codes for network failures
 */
export type ResilientFetchErrorCode =
    | 'timeout'    // Request took too long
    | 'aborted'    // User cancelled or component unmounted
    | 'offline'    // Device has no network connection
    | 'network'    // Network request failed (DNS, connection reset, etc.)
    | 'server';    // Server returned error status

/**
 * Typed error class for network failures
 */
export class ResilientFetchError extends Error {
    public readonly code: ResilientFetchErrorCode;
    public readonly status?: number;

    constructor(message: string, code: ResilientFetchErrorCode, status?: number) {
        super(message);
        this.name = 'ResilientFetchError';
        this.code = code;
        this.status = status;
    }
}

/**
 * Options for resilientFetch
 */
export interface ResilientFetchOptions extends RequestInit {
    /** Timeout per attempt in milliseconds (default: 30000) */
    timeoutMs?: number;
    /** Number of retry attempts (default: 2) */
    retries?: number;
    /** Initial delay between retries in milliseconds (default: 1500) */
    retryDelayMs?: number;
    /** Multiplier for exponential backoff (default: 2) */
    backoffFactor?: number;
    /** External abort signal for cancellation */
    abortSignal?: AbortSignal;
    /** HTTP status codes that trigger retry (default: [408, 429, 500, 502, 503, 504]) */
    retryOnStatuses?: number[];
}

/**
 * Helper to create a delay promise
 */
const delay = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch wrapper with timeout, retry, and abort support
 * 
 * @example
 * const controller = new AbortController();
 * try {
 *     const response = await resilientFetch('https://api.example.com/data', {
 *         method: 'POST',
 *         body: JSON.stringify(data),
 *         timeoutMs: 30000,
 *         retries: 2,
 *         abortSignal: controller.signal,
 *     });
 *     const result = await response.json();
 * } catch (error) {
 *     if (error instanceof ResilientFetchError) {
 *         switch (error.code) {
 *             case 'timeout': // Handle timeout
 *             case 'aborted': // Handle user cancel
 *             case 'network': // Handle network failure
 *         }
 *     }
 * }
 */
export const resilientFetch = async (
    url: string,
    options: ResilientFetchOptions = {}
): Promise<Response> => {
    const {
        timeoutMs = 30000,
        retries = 2,
        retryDelayMs = 1500,
        backoffFactor = 2,
        abortSignal,
        retryOnStatuses = [408, 429, 500, 502, 503, 504],
        ...fetchOptions
    } = options;

    let lastError: Error | null = null;
    let currentDelay = retryDelayMs;
    const maxAttempts = retries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        // Create abort controller for this attempt (combines timeout + external signal)
        const controller = new AbortController();
        let timeoutId: NodeJS.Timeout | null = null;

        // Link external abort signal
        if (abortSignal) {
            if (abortSignal.aborted) {
                throw new ResilientFetchError('Request was aborted', 'aborted');
            }
            abortSignal.addEventListener('abort', () => controller.abort(), { once: true });
        }

        // Set timeout
        timeoutId = setTimeout(() => {
            controller.abort();
        }, timeoutMs);

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Success - return response
            if (response.ok) {
                return response;
            }

            // Retryable server error
            if (retryOnStatuses.includes(response.status)) {
                lastError = new ResilientFetchError(
                    `HTTP error ${response.status}`,
                    'server',
                    response.status
                );
                
                if (attempt < maxAttempts) {
                    console.log(`[NetworkClient] Retry ${attempt}/${retries} after ${response.status}`);
                    await delay(currentDelay);
                    currentDelay *= backoffFactor;
                    continue;
                }
            }

            // Non-retryable server error
            throw new ResilientFetchError(
                `HTTP error ${response.status}`,
                'server',
                response.status
            );

        } catch (error) {
            if (timeoutId) clearTimeout(timeoutId);

            // Check if aborted by external signal (user cancel)
            if (abortSignal?.aborted) {
                throw new ResilientFetchError('Request was aborted', 'aborted');
            }

            // Check if aborted by timeout
            if (controller.signal.aborted) {
                lastError = new ResilientFetchError('Request timed out', 'timeout');
                
                if (attempt < maxAttempts) {
                    console.log(`[NetworkClient] Retry ${attempt}/${retries} after timeout`);
                    await delay(currentDelay);
                    currentDelay *= backoffFactor;
                    continue;
                }
                throw lastError;
            }

            // Network error (TypeError in fetch = network failure)
            if (error instanceof TypeError) {
                lastError = new ResilientFetchError('Network request failed', 'network');
                
                if (attempt < maxAttempts) {
                    console.log(`[NetworkClient] Retry ${attempt}/${retries} after network error`);
                    await delay(currentDelay);
                    currentDelay *= backoffFactor;
                    continue;
                }
                throw lastError;
            }

            // Already a ResilientFetchError
            if (error instanceof ResilientFetchError) {
                throw error;
            }

            // Unknown error
            throw new ResilientFetchError(
                error instanceof Error ? error.message : 'Unknown network error',
                'network'
            );
        }
    }

    // Should not reach here, but just in case
    throw lastError || new ResilientFetchError('Request failed', 'network');
};
```

---

### 3.2 Network Status Helper (New)

**File**: `src/services/networkStatus.ts`

**Purpose**: Check network connectivity before starting requests.

**Dependency**: `expo-network` (install with `npx expo install expo-network`)

```typescript
// src/services/networkStatus.ts

import * as Network from 'expo-network';

/**
 * Network state information
 */
export interface NetworkState {
    /** Whether the device has any network connection */
    isConnected: boolean;
    /** Whether the internet is actually reachable */
    isInternetReachable: boolean;
    /** Connection type (wifi, cellular, etc.) */
    type: Network.NetworkStateType;
}

/**
 * Get current network connectivity state
 * 
 * @example
 * const network = await getCurrentNetworkState();
 * if (!network.isConnected || !network.isInternetReachable) {
 *     showError('You appear to be offline');
 *     return;
 * }
 */
export const getCurrentNetworkState = async (): Promise<NetworkState> => {
    try {
        const state = await Network.getNetworkStateAsync();
        return {
            isConnected: state.isConnected ?? false,
            isInternetReachable: state.isInternetReachable ?? false,
            type: state.type ?? Network.NetworkStateType.UNKNOWN,
        };
    } catch (error) {
        console.warn('[NetworkStatus] Failed to get network state:', error);
        // Assume connected if we can't check (let the request fail naturally)
        return {
            isConnected: true,
            isInternetReachable: true,
            type: Network.NetworkStateType.UNKNOWN,
        };
    }
};

/**
 * Check if network is good enough for large uploads
 * 
 * @example
 * if (!await isNetworkSuitableForUpload()) {
 *     showWarning('Slow connection detected. Upload may take longer.');
 * }
 */
export const isNetworkSuitableForUpload = async (): Promise<boolean> => {
    const state = await getCurrentNetworkState();
    return state.isConnected && state.isInternetReachable;
};
```

---

### 3.3 Gemini Service (Modify)

**File**: `src/services/geminiService.ts`

**Changes**:
1. Import `resilientFetch` and `ResilientFetchError`
2. Add `signal` parameter to `makePortkeyRequest`
3. Add `signal` parameter to `analyzeFood` and `analyzeFoodFromText`
4. Map error codes to user-friendly messages

```typescript
// Add these imports at the top
import { resilientFetch, ResilientFetchError } from './networkClient';

// Update makePortkeyRequest signature and implementation
const makePortkeyRequest = async (
    messages: any[],
    options: {
        maxTokens?: number;
        temperature?: number;
        useStructuredOutput?: boolean;
        signal?: AbortSignal;  // NEW: Add abort signal
    } = {}
): Promise<any> => {
    const { 
        maxTokens = 4096, 
        temperature = 0.3, 
        useStructuredOutput = true,
        signal,  // NEW
    } = options;

    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Portkey API key is not configured. Please set PORTKEY_API_KEY in your .env file.');
    }

    const requestBody: any = {
        messages,
        max_tokens: maxTokens,
        temperature,
    };

    if (useStructuredOutput) {
        requestBody.response_format = {
            type: 'json_schema',
            json_schema: FOOD_ANALYSIS_SCHEMA,
        };
    }

    // NEW: Use resilientFetch instead of raw fetch
    let response: Response;
    try {
        response = await resilientFetch(`${PORTKEY_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-portkey-api-key': apiKey,
                'x-portkey-config': PORTKEY_CONFIG_ID,
            },
            body: JSON.stringify(requestBody),
            timeoutMs: 30000,      // 30 seconds per attempt
            retries: 2,            // Up to 3 total attempts
            retryDelayMs: 1500,    // Start with 1.5s delay
            backoffFactor: 2,      // Double delay each retry
            abortSignal: signal,
        });
    } catch (error) {
        // NEW: Map ResilientFetchError to user-friendly messages
        if (error instanceof ResilientFetchError) {
            switch (error.code) {
                case 'timeout':
                    throw new Error('The analysis is taking too long. Please check your connection and try again.');
                case 'aborted':
                    throw error; // Let caller handle cancellation
                case 'offline':
                case 'network':
                    throw new Error('Network error. Please check your internet connection and try again.');
                case 'server':
                    throw new Error(`Server error (${error.status}). Please try again later.`);
                default:
                    throw new Error('An error occurred while contacting the analysis service.');
            }
        }
        throw error;
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Portkey API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (typeof rawContent === 'string') {
        return rawContent;
    } else if (Array.isArray(rawContent)) {
        return rawContent.map((part: any) => typeof part === 'string' ? part : part.text || '').join('');
    }

    return null;
};

// Update analyzeFood to accept signal
export const analyzeFood = async (
    imageBase64: string,
    mimeType: string,
    mode: string,
    signal?: AbortSignal  // NEW: Add abort signal
): Promise<AnalysisResult> => {
    try {
        const systemPrompt = getSystemPrompt(mode);
        const userPrompt = getUserPrompt(mode);
        const imageDataUrl = `data:${mimeType};base64,${imageBase64}`;

        const messages = [
            {
                role: 'system',
                content: systemPrompt,
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: {
                            url: imageDataUrl,
                        },
                    },
                    {
                        type: 'text',
                        text: userPrompt,
                    },
                ],
            },
        ];

        const textContent = await makePortkeyRequest(messages, {
            maxTokens: 4096,
            temperature: 0.3,
            useStructuredOutput: true,
            signal,  // NEW: Pass signal through
        });

        if (!textContent) {
            return {
                success: false,
                error: 'No response received from AI',
                items: [],
                totalCalories: 0,
            };
        }

        try {
            return parseJsonResponse(textContent);
        } catch (parseError) {
            console.error('JSON parsing failed:', textContent);
            return {
                success: false,
                error: 'Failed to parse AI response',
                items: [],
                totalCalories: 0,
            };
        }
    } catch (error) {
        // NEW: Handle aborted requests gracefully
        if (error instanceof ResilientFetchError && error.code === 'aborted') {
            return {
                success: false,
                error: 'Analysis cancelled',
                items: [],
                totalCalories: 0,
            };
        }

        console.error('Portkey API error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            items: [],
            totalCalories: 0,
        };
    }
};

// Update analyzeFoodFromText similarly
export const analyzeFoodFromText = async (
    description: string,
    mode: string,
    signal?: AbortSignal  // NEW: Add abort signal
): Promise<AnalysisResult> => {
    // ... same pattern as analyzeFood, pass signal to makePortkeyRequest
};
```

---

### 3.4 Result Screen (Modify)

**File**: `src/screens/ResultScreen.tsx`

**Changes**:
1. Add `AbortController` ref for request cancellation
2. Pre-flight network check before starting analysis
3. Status message state for progress feedback
4. Wire Cancel button to abort controller
5. Add Retry button in error state
6. Cleanup abort on component unmount

```typescript
// Add new imports
import React, { useEffect, useRef, useState } from 'react';
import { getCurrentNetworkState } from '../services/networkStatus';
import { ResilientFetchError } from '../services/networkClient';

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

    // NEW: Abort controller for cancellation
    const abortControllerRef = useRef<AbortController | null>(null);
    
    // NEW: Status message for progress feedback
    const [statusMessage, setStatusMessage] = useState<string>('Preparing analysis...');

    useEffect(() => {
        const analyze = async () => {
            if (currentImageBase64 && !currentResult && isAnalyzing) {
                // Create new abort controller for this request
                const controller = new AbortController();
                abortControllerRef.current = controller;

                // NEW: Pre-flight network check
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

                // NEW: Update status for upload phase
                setStatusMessage('Uploading image...');

                try {
                    // NEW: Pass abort signal to analyzeFood
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
        };

        analyze();

        // NEW: Cleanup - abort request if component unmounts
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, [currentImageBase64, mode]);

    // NEW: Retry handler
    const handleRetry = () => {
        setCurrentResult(null);
        setIsAnalyzing(true);
    };

    // UPDATED: Cancel handler now properly aborts the request
    const handleCancel = () => {
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

    // Loading State - UPDATED with status message
    if (isAnalyzing && !currentResult) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                {/* NEW: Dynamic status message */}
                <Text style={{ marginTop: 20, color: theme.colors.onSurfaceVariant }}>
                    {statusMessage}
                </Text>
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

    // Error State - UPDATED with Retry button
    if (currentResult && !currentResult.success) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
                <IconButton icon="alert-circle-outline" size={60} iconColor={theme.colors.error} />
                <Text variant="headlineSmall" style={{ marginTop: 10, textAlign: 'center' }}>
                    Analysis Failed
                </Text>
                <Text variant="bodyMedium" style={{ marginTop: 10, textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
                    {currentResult.error || "We couldn't identify the food. Please try again."}
                </Text>
                {/* NEW: Retry button */}
                <Button mode="contained" onPress={handleRetry} style={{ marginTop: 30, borderRadius: 30 }}>
                    Retry
                </Button>
                <Button mode="text" onPress={handleDiscard} style={{ marginTop: 10 }}>
                    Discard
                </Button>
            </SafeAreaView>
        );
    }

    // ... rest of success state unchanged
};
```

---

## 4. Configuration Values

### Timeout Settings

| Setting | Value | Rationale |
|---------|-------|-----------|
| `timeoutMs` | `30000` (30s) | 2MB upload on 3G (~16s) + AI inference (1-8s) + buffer |
| `retries` | `2` | 3 total attempts; covers transient failures without excessive delay |
| `retryDelayMs` | `1500` | Start with 1.5s; gives network time to recover |
| `backoffFactor` | `2` | Delays: 1.5s → 3s → 6s (if more retries added) |

### Retry-Eligible HTTP Status Codes

| Code | Meaning | Why Retry |
|------|---------|-----------|
| 408 | Request Timeout | Server-side timeout, retry may succeed |
| 429 | Too Many Requests | Rate limited, wait and retry |
| 500 | Internal Server Error | Transient server issue |
| 502 | Bad Gateway | Proxy/load balancer issue |
| 503 | Service Unavailable | Server overloaded |
| 504 | Gateway Timeout | Upstream timeout |

### Worst-Case Timeline

```
Attempt 1: 30s timeout
  └─ Delay: 1.5s
Attempt 2: 30s timeout
  └─ Delay: 3s
Attempt 3: 30s timeout
  └─ Final error

Total worst-case: ~95 seconds before giving up
```

---

## 5. User Experience Changes

### Before vs After

| Scenario | Before | After |
|----------|--------|-------|
| **Offline** | Spinner forever | Immediate error: "You appear to be offline" + Retry button |
| **Slow 3G** | Spinner forever | Timeout after ~95s total, then error with Retry |
| **Band switch** | Request dies silently | Auto-retry (up to 2x), then error with Retry |
| **User taps Cancel** | UI changes, request continues | Request actually aborts, saves bandwidth |
| **Progress feedback** | "Analyzing..." forever | "Checking connection..." → "Uploading image..." |
| **Error recovery** | Must go back and re-capture | Retry button uses same image |

### Status Message Flow

```
1. "Checking connection..."     (network pre-check)
2. "Uploading image..."         (fetch started)
3. "Waiting for AI response..." (optional, if you add after headers received)
4. Success → Show results
   OR
   Error → Show message + Retry button
```

---

## 6. Testing Plan

### Manual Test Cases

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | Offline before analysis | Enable airplane mode → Capture photo → Tap scan | Immediate error: "You appear to be offline" |
| 2 | Offline during upload | Start analysis → Toggle airplane mode mid-request | Error within ~30s with Retry button |
| 3 | User cancellation | Start analysis → Tap Cancel | Request aborts, returns to previous screen |
| 4 | Slow network | Use network throttling (3G) | See retry attempts in logs, eventual success or clear error |
| 5 | Retry after failure | Trigger any error → Tap Retry | Re-attempts with same image |
| 6 | Component unmount | Start analysis → Navigate away quickly | No memory leaks, request aborts cleanly |
| 7 | Band switching | Start on WiFi → Switch to cellular mid-request | Auto-retry handles transition |

### Network Throttling Setup

**iOS Simulator**: Use Network Link Conditioner (Xcode → Open Developer Tool)

**Android Emulator**: 
```bash
adb shell settings put global wifi_max_dhcp_retry_count 0
# Or use Charles Proxy / Android Studio Network Profiler
```

**Physical Device**: Use Expo Dev Client + actual network conditions

### Console Log Verification

With the implementation, you should see logs like:
```
[NetworkClient] Retry 1/2 after timeout
[NetworkClient] Retry 2/2 after network error
```

---

## 7. Future Enhancements

### Not Included (and why)

| Feature | Reason to Skip Now |
|---------|-------------------|
| **Offline queue** | Overkill for v1; meal context becomes stale; complex DB changes |
| **True upload progress bar** | `fetch` in React Native doesn't expose upload progress without native code |
| **Global network listener** | On-demand check is sufficient; listener adds complexity |
| **Automatic retry on resume** | Manual Retry button is cleaner UX |
| **Image compression optimization** | Current 80% quality is reasonable balance |

### When to Add Offline Queue

Consider adding if:
- Users explicitly request "analyze later" feature
- You want to support rural areas with intermittent connectivity
- You add background sync / batch analysis features

Implementation would require:
- New SQLite table: `pending_analyses`
- Background job on app foreground
- UI for "Pending: 3 images"
- Conflict resolution for stale meals

### When to Add True Upload Progress

Consider adding if:
- Users on very slow networks complain about no feedback
- You increase image quality/size significantly

Implementation would require:
- `XMLHttpRequest` instead of `fetch` (loses some React Native compatibility)
- Or native module for upload progress events
- Progress bar UI component

---

## Appendix: Installation Steps

```bash
# 1. Install expo-network
npx expo install expo-network

# 2. Create new files
touch src/services/networkClient.ts
touch src/services/networkStatus.ts

# 3. Copy the implementations from sections 3.1 and 3.2

# 4. Modify geminiService.ts per section 3.3

# 5. Modify ResultScreen.tsx per section 3.4

# 6. Test on device with various network conditions
```

---

## Appendix: Quick Reference

### Error Code Mapping

```typescript
switch (error.code) {
    case 'timeout':
        // "The analysis is taking too long. Please check your connection and try again."
    case 'aborted':
        // User cancelled - handle silently
    case 'offline':
    case 'network':
        // "Network error. Please check your internet connection and try again."
    case 'server':
        // "Server error. Please try again later."
}
```

### Import Checklist

```typescript
// ResultScreen.tsx
import { getCurrentNetworkState } from '../services/networkStatus';
import { ResilientFetchError } from '../services/networkClient';

// geminiService.ts
import { resilientFetch, ResilientFetchError } from './networkClient';
```
