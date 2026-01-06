// LLM Service using Portkey AI Gateway
// Routes requests through Portkey for reliability, fallbacks, and observability
// Uses resilient fetch wrapper for timeout, retry, and abort support
// Leverages structured outputs with JSON Schema for reliable parsing

import { getSystemPrompt, getUserPrompt } from '../config/prompts';
import { CONFIG } from '../config/config';
import { PORTKEY_API_KEY, EXPO_PUBLIC_PORTKEY_API_KEY } from '@env';
import { resilientFetch, ResilientFetchError } from './networkClient';

// Get Portkey settings from config
const PORTKEY_CONFIG_ID = CONFIG.PORTKEY.CONFIG_ID;
const PORTKEY_BASE_URL = CONFIG.PORTKEY.BASE_URL;

// Types for API responses
export interface FoodItem {
    name: string;
    hindiName?: string;
    portion: string;
    calories: number;
    confidence: 'high' | 'medium' | 'low';
    notes?: string;
}

export interface AnalysisResult {
    success: boolean;
    items: FoodItem[];
    totalCalories: number;
    mealType?: string;
    cookingStyle?: string;
    adjustmentApplied?: string;
    error?: string;
}

// JSON Schema for structured output (OpenAI-compatible format)
const FOOD_ANALYSIS_SCHEMA = {
    name: 'food_analysis_response',
    strict: true,
    schema: {
        type: 'object',
        properties: {
            success: {
                type: 'boolean',
                description: 'Whether the analysis was successful',
            },
            items: {
                type: 'array',
                description: 'List of identified food items',
                items: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Food item name in English',
                        },
                        hindiName: {
                            type: 'string',
                            description: 'Hindi name if applicable',
                        },
                        portion: {
                            type: 'string',
                            description: 'Estimated portion size',
                        },
                        calories: {
                            type: 'number',
                            description: 'Estimated calories',
                        },
                        confidence: {
                            type: 'string',
                            enum: ['high', 'medium', 'low'],
                            description: 'Confidence level of the estimate',
                        },
                        notes: {
                            type: 'string',
                            description: 'Any relevant notes about this item',
                        },
                    },
                    required: ['name', 'portion', 'calories', 'confidence'],
                    additionalProperties: false,
                },
            },
            totalCalories: {
                type: 'number',
                description: 'Sum of all item calories',
            },
            mealType: {
                type: 'string',
                enum: ['breakfast', 'lunch', 'dinner', 'snack'],
                description: 'Type of meal detected',
            },
            cookingStyle: {
                type: 'string',
                description: 'Detected cooking style',
            },
            adjustmentApplied: {
                type: 'string',
                enum: ['light', 'homemade', 'restaurant'],
                description: 'Which calorie adjustment mode was applied',
            },
        },
        required: ['success', 'items', 'totalCalories'],
        additionalProperties: false,
    },
};

// Get API key from environment
// EXPO_PUBLIC_ prefix is used for EAS build compatibility
const getApiKey = (): string => {
    // Try EXPO_PUBLIC_ version first (for EAS builds), then fallback to standard (for local dev)
    const apiKey = EXPO_PUBLIC_PORTKEY_API_KEY || PORTKEY_API_KEY || '';

    if (!apiKey) {
        console.warn('PORTKEY_API_KEY not found. Set EXPO_PUBLIC_PORTKEY_API_KEY in .env or EAS secrets.');
    }

    return apiKey;
};

/**
 * Make a request to Portkey API with structured output
 */
const makePortkeyRequest = async (
    messages: any[],
    options: {
        maxTokens?: number;
        temperature?: number;
        useStructuredOutput?: boolean;
        signal?: AbortSignal;
    } = {}
): Promise<any> => {
    const { maxTokens = 4096, temperature = 0.3, useStructuredOutput = true, signal } = options;

    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Portkey API key is not configured. Please set PORTKEY_API_KEY in your .env file.');
    }

    const requestBody: any = {
        messages,
        max_tokens: maxTokens,
        temperature,
    };

    // Add structured output format if enabled
    if (useStructuredOutput) {
        requestBody.response_format = {
            type: 'json_schema',
            json_schema: FOOD_ANALYSIS_SCHEMA,
        };
    }

    // Use resilientFetch with timeout, retry, and abort support
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
            timeoutMs: 30000,
            retries: 2,
            retryDelayMs: 1500,
            backoffFactor: 2,
            abortSignal: signal,
        });
    } catch (error) {
        // Map ResilientFetchError to user-friendly messages
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

    // Handle both string and array content formats
    if (typeof rawContent === 'string') {
        return rawContent;
    } else if (Array.isArray(rawContent)) {
        return rawContent.map((part: any) => typeof part === 'string' ? part : part.text || '').join('');
    }

    return null;
};

/**
 * Parse JSON response with fallback strategies
 */
const parseJsonResponse = (text: string): AnalysisResult => {
    // Strategy 1: Direct parse (most common with structured output)
    try {
        const result = JSON.parse(text);
        if (typeof result.success === 'boolean' && Array.isArray(result.items)) {
            return result;
        }
    } catch (e) {
        // Continue to fallback
    }

    // Strategy 2: Clean and parse
    try {
        let cleaned = text.trim();
        cleaned = cleaned.replace(/^\uFEFF/, '');
        cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

        // Remove markdown code blocks if present
        if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
        if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
        cleaned = cleaned.trim();

        const result = JSON.parse(cleaned);
        if (!result.success) result.success = true;
        if (!Array.isArray(result.items)) result.items = [];
        if (typeof result.totalCalories !== 'number') {
            result.totalCalories = result.items.reduce((sum: number, item: FoodItem) => sum + (item.calories || 0), 0);
        }
        return result;
    } catch (e) {
        // Continue to fallback
    }

    // Strategy 3: Extract JSON using regex
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        // Failed
    }

    throw new Error('Failed to parse JSON response');
};

/**
 * Analyze a food image using Portkey AI Gateway with structured output
 * @param imageBase64 - Base64 encoded image data
 * @param mimeType - Image MIME type (e.g., 'image/jpeg')
 * @param mode - Cooking mode (light, homemade, restaurant)
 * @param signal - Optional AbortSignal for cancellation
 * @returns Analysis result with food items and calories
 */
export const analyzeFood = async (
    imageBase64: string,
    mimeType: string,
    mode: string,
    signal?: AbortSignal
): Promise<AnalysisResult> => {
    try {
        const systemPrompt = getSystemPrompt(mode);
        const userPrompt = getUserPrompt(mode);

        // Create image data URL
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
            signal,
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
        // Handle aborted requests gracefully
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

/**
 * Analyze food from text description using Portkey AI Gateway with structured output
 * @param description - Text description of the food
 * @param mode - Cooking mode (light, homemade, restaurant)
 * @param signal - Optional AbortSignal for cancellation
 * @returns Analysis result with food items and calories
 */
export const analyzeFoodFromText = async (
    description: string,
    mode: string,
    signal?: AbortSignal
): Promise<AnalysisResult> => {
    try {
        const textPrompt = `
You are analyzing a food description provided by a user. Extract all food items and estimate their calories.

COOKING MODE: ${mode.toUpperCase()}
${mode === 'light' ? 'Assume minimal oil, baked/boiled preparations, lower calorie bounds.' : ''}
${mode === 'homemade' ? 'Assume moderate oil, standard home cooking, mid-range calories.' : ''}
${mode === 'restaurant' ? 'Assume high oil/butter, generous portions, upper calorie bounds.' : ''}

USER'S DESCRIPTION:
"${description}"

INSTRUCTIONS:
1. Identify each food item mentioned
2. If portion size is not specified, assume a typical serving
3. If cooking method is unclear, use the mode assumption
4. Provide calorie estimates based on the mode
5. Never ask for clarification - make reasonable assumptions
6. If it's vague like "lunch" or "some food", estimate based on typical Indian meals
7. Always set success to true as long as you can make a reasonable estimate
8. Provide Hindi names for Indian dishes when applicable
`;

        const messages = [
            {
                role: 'user',
                content: textPrompt,
            },
        ];

        const textContent = await makePortkeyRequest(messages, {
            maxTokens: 4096,
            temperature: 0.4,
            useStructuredOutput: true,
            signal,
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
        // Handle aborted requests gracefully
        if (error instanceof ResilientFetchError && error.code === 'aborted') {
            return {
                success: false,
                error: 'Analysis cancelled',
                items: [],
                totalCalories: 0,
            };
        }

        console.error('Portkey text analysis error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            items: [],
            totalCalories: 0,
        };
    }
};

/**
 * Test the API connection
 * @returns true if connection is successful
 */
export const testConnection = async (): Promise<boolean> => {
    try {
        const messages = [
            {
                role: 'user',
                content: 'Say "CalTrack connected!" in exactly 3 words.',
            },
        ];

        const response = await makePortkeyRequest(messages, {
            maxTokens: 50,
            temperature: 0.5,
            useStructuredOutput: false, // Simple text response for connection test
        });
        return response?.includes('connected') ?? false;
    } catch (error) {
        console.error('Connection test failed:', error);
        return false;
    }
};

export default {
    analyzeFood,
    analyzeFoodFromText,
    testConnection,
};
