import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const FeesDetailsScreen = ({ navigation }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/fees/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching fee stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Fees Details</Text>
                </View>
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            </SafeAreaView>
        );
    }

    const pendingAmount = stats ? stats.totalAmount - stats.paidAmount : 0;
    const collectionPercentage = stats?.totalAmount > 0
        ? ((stats.paidAmount / stats.totalAmount) * 100).toFixed(1)
        : 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Fees Details</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Overall Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <Text style={styles.summaryTitle}>Fee Collection Overview</Text>
                        <View style={styles.percentageBadge}>
                            <Text style={styles.percentageText}>{collectionPercentage}%</Text>
                        </View>
                    </View>

                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${collectionPercentage}%` }]} />
                    </View>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Collected</Text>
                            <Text style={[styles.summaryValue, { color: colors.success }]}>
                                ₹{stats?.paidAmount?.toLocaleString() || '0'}
                            </Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Pending</Text>
                            <Text style={[styles.summaryValue, { color: colors.danger }]}>
                                ₹{pendingAmount.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Total Fees Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={styles.cardIcon}>💰</Text>
                        </View>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>Total Fees Amount</Text>
                            <Text style={styles.cardSubtitle}>Overall fee structure</Text>
                        </View>
                    </View>
                    <Text style={styles.cardValue}>₹{stats?.totalAmount?.toLocaleString() || '0'}</Text>
                </View>

                {/* Collected Amount Card */}
                <View style={[styles.card, styles.collectedCard]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: colors.success + '20' }]}>
                            <Text style={styles.cardIcon}>✓</Text>
                        </View>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>Collected Amount</Text>
                            <Text style={styles.cardSubtitle}>{stats?.paidFees || 0} payments received</Text>
                        </View>
                    </View>
                    <Text style={[styles.cardValue, { color: colors.success }]}>
                        ₹{stats?.paidAmount?.toLocaleString() || '0'}
                    </Text>
                </View>

                {/* Pending Amount Card */}
                <View style={[styles.card, styles.pendingCard]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: colors.danger + '20' }]}>
                            <Text style={styles.cardIcon}>⏱</Text>
                        </View>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>Pending Amount</Text>
                            <Text style={styles.cardSubtitle}>{stats?.pendingFees || 0} payments pending</Text>
                        </View>
                    </View>
                    <Text style={[styles.cardValue, { color: colors.danger }]}>
                        ₹{pendingAmount.toLocaleString()}
                    </Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.miniCard}>
                        <View style={[styles.miniIconCircle, { backgroundColor: colors.secondary + '20' }]}>
                            <Text style={styles.miniIcon}>📄</Text>
                        </View>
                        <Text style={styles.miniCardValue}>{stats?.totalFees || 0}</Text>
                        <Text style={styles.miniCardLabel}>Total Invoices</Text>
                    </View>

                    <View style={[styles.miniCard, styles.overdueCard]}>
                        <View style={[styles.miniIconCircle, { backgroundColor: colors.warning + '20' }]}>
                            <Text style={styles.miniIcon}>⚠️</Text>
                        </View>
                        <Text style={[styles.miniCardValue, { color: colors.warning }]}>
                            {stats?.overdueFees || 0}
                        </Text>
                        <Text style={styles.miniCardLabel}>Overdue Fees</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsCard}>
                    <Text style={styles.actionsTitle}>Quick Actions</Text>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('FeeManagement')}
                    >
                        <Text style={styles.actionIcon}>📊</Text>
                        <Text style={styles.actionText}>Manage Fees</Text>
                        <Text style={styles.actionArrow}>→</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        fontSize: 16,
        color: colors.primary,
        marginRight: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
    },
    summaryCard: {
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    percentageBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    percentageText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
    progressBarContainer: {
        height: 12,
        backgroundColor: colors.background,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    progressBar: {
        height: '100%',
        backgroundColor: colors.success,
        borderRadius: 6,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.border,
        marginHorizontal: 16,
    },
    summaryLabel: {
        fontSize: 12,
        color: colors.textLight,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    collectedCard: {
        borderLeftWidth: 4,
        borderLeftColor: colors.success,
    },
    pendingCard: {
        borderLeftWidth: 4,
        borderLeftColor: colors.danger,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardIcon: {
        fontSize: 24,
    },
    cardHeaderText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 12,
        color: colors.textLight,
        fontWeight: '500',
    },
    cardValue: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -1,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    miniCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        width: '48%',
        alignItems: 'center',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    overdueCard: {
        borderTopWidth: 3,
        borderTopColor: colors.warning,
    },
    miniIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    miniIcon: {
        fontSize: 20,
    },
    miniCardValue: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    miniCardLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
        textAlign: 'center',
    },
    actionsCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    actionsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    actionIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    actionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    actionArrow: {
        fontSize: 20,
        color: colors.primary,
        fontWeight: '700',
    },
});

export default FeesDetailsScreen;
