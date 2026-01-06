// src/services/networkStatus.ts
// Network state helper using expo-network

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
