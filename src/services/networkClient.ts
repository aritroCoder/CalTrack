// src/services/networkClient.ts
// Resilient fetch wrapper with timeout, retry, and abort support

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
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

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
