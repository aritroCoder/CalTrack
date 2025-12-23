// Shared Styles
// Indian-themed design with modern glassmorphism elements

import { StyleSheet, Dimensions } from 'react-native';
import { CONFIG } from '../config/config';

const { width, height } = Dimensions.get('window');

export const colors = CONFIG.COLORS;

export const styles = StyleSheet.create({
    // Layout
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Header
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
    },

    // Cards
    card: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 153, 51, 0.2)',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    cardGlass: {
        backgroundColor: 'rgba(22, 33, 62, 0.8)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 10,
    },
    cardText: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },

    // Calorie Display
    calorieContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    calorieValue: {
        fontSize: 64,
        fontWeight: 'bold',
        color: colors.primary,
    },
    calorieLabel: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 5,
    },

    // Mode Selector
    modeSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 153, 51, 0.1)',
        borderRadius: 16,
        padding: 4,
        marginBottom: 20,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        alignItems: 'center',
    },
    modeButtonActive: {
        backgroundColor: colors.primary,
    },
    modeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    modeButtonTextActive: {
        color: colors.background,
    },
    modeDescription: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },

    // Buttons
    button: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.background,
    },
    buttonTextSecondary: {
        color: colors.primary,
    },
    buttonIcon: {
        marginRight: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    buttonHalf: {
        flex: 1,
    },

    // Action Buttons (Camera/Gallery)
    actionButton: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
        minHeight: 140,
    },
    actionButtonIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    actionButtonSubtext: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },

    // Food Items
    foodItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    foodItemLast: {
        borderBottomWidth: 0,
    },
    foodItemInfo: {
        flex: 1,
    },
    foodItemName: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text,
    },
    foodItemHindi: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    foodItemPortion: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    foodItemCalories: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    foodItemUnit: {
        fontSize: 12,
        color: colors.textSecondary,
    },

    // Confidence Badge
    confidenceBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 10,
    },
    confidenceHigh: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
    },
    confidenceMedium: {
        backgroundColor: 'rgba(255, 152, 0, 0.2)',
    },
    confidenceLow: {
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
    },
    confidenceText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },

    // Image Preview
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        marginBottom: 16,
    },
    imagePlaceholder: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'rgba(255, 153, 51, 0.3)',
        borderStyle: 'dashed',
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    loadingText: {
        fontSize: 18,
        color: colors.text,
        marginTop: 20,
    },
    loadingSubtext: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 8,
    },

    // Total Summary
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        marginTop: 8,
        borderTopWidth: 2,
        borderTopColor: colors.primary,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    totalValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.primary,
    },

    // History
    historyItem: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        marginRight: 16,
    },
    historyInfo: {
        flex: 1,
    },
    historyTime: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    historyItems: {
        fontSize: 14,
        color: colors.text,
        marginTop: 4,
    },
    historyCalories: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    historyDelete: {
        padding: 8,
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        color: colors.textSecondary,
        textAlign: 'center',
    },

    // Tab Bar
    tabBar: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        paddingBottom: 20,
        paddingTop: 10,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    tabIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    tabLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    tabLabelActive: {
        color: colors.primary,
    },

    // Error
    errorContainer: {
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: colors.error,
    },
    errorText: {
        color: colors.error,
        fontSize: 14,
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 16,
    },

    // Input fields
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.text,
        borderWidth: 1,
        borderColor: 'rgba(255, 153, 51, 0.3)',
    },
});

export default styles;
