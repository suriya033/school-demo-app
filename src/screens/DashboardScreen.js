import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';
import { useResponsive } from '../hooks/useResponsive';

const DashboardScreen = ({ navigation }) => {
    const responsive = useResponsive();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        totalClasses: 0,
        totalStudents: 0,
        totalstaffs: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUser();
        fetchStats();
    }, []);

    const getUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    };

    const fetchStats = async () => {
        try {
            const token = await AsyncStorage.getItem('token');

            const [classesRes, studentsRes, staffsRes] = await Promise.all([
                axios.get(`${API_URL}/classes`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/students`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/staffs`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            setStats({
                totalClasses: classesRes.data.length,
                totalStudents: studentsRes.data.length,
                totalstaffs: staffsRes.data.length,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        navigation.replace('Login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Dashboard</Text>
                {user && (
                    <View>
                        <Text style={styles.welcome}>Welcome, {user.name}</Text>
                        <Text style={styles.role}>Role: {user.role}</Text>
                    </View>
                )}
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                    <View style={styles.statsContainer}>
                        <TouchableOpacity
                            style={styles.statCard}
                            onPress={() => navigation.navigate('ClassManagement')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.statIcon}>🏫</Text>
                            <Text style={styles.statValue}>{stats.totalClasses}</Text>
                            <Text style={styles.statLabel}>Classes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.statCard}
                            onPress={() => navigation.navigate('StudentManagement')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.statIcon}>👨‍🎓</Text>
                            <Text style={styles.statValue}>{stats.totalStudents}</Text>
                            <Text style={styles.statLabel}>Students</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.statCard}
                            onPress={() => navigation.navigate('StaffManagement')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.statIcon}>👨‍🏫</Text>
                            <Text style={styles.statValue}>{stats.totalstaffs}</Text>
                            <Text style={styles.statLabel}>staffs</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <Text style={styles.subtitle}>Select an option to continue</Text>

                <View style={styles.menuGrid}>
                    <TouchableOpacity
                        style={styles.menuCard}
                        onPress={() => navigation.navigate('ClassManagement')}
                    >
                        <Text style={styles.menuIcon}>🏫</Text>
                        <Text style={styles.menuTitle}>Classes</Text>
                        <Text style={styles.menuDescription}>Manage classes and sections</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuCard}
                        onPress={() => navigation.navigate('SubjectManagement')}
                    >
                        <Text style={styles.menuIcon}>📚</Text>
                        <Text style={styles.menuTitle}>Subjects</Text>
                        <Text style={styles.menuDescription}>Manage subjects</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuCard}
                        onPress={() => navigation.navigate('StudentManagement')}
                    >
                        <Text style={styles.menuIcon}>👨‍🎓</Text>
                        <Text style={styles.menuTitle}>Students</Text>
                        <Text style={styles.menuDescription}>Manage students</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuCard}
                        onPress={() => navigation.navigate('StaffManagement')}
                    >
                        <Text style={styles.menuIcon}>👨‍🏫</Text>
                        <Text style={styles.menuTitle}>staffs</Text>
                        <Text style={styles.menuDescription}>Manage staffs</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuCard}
                        onPress={() => navigation.navigate('AdminAttendanceDashboard')}
                    >
                        <Text style={styles.menuIcon}>📋</Text>
                        <Text style={styles.menuTitle}>Attendance</Text>
                        <Text style={styles.menuDescription}>View attendance stats</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuCard}
                        onPress={() => navigation.navigate('FeeManagement')}
                    >
                        <Text style={styles.menuIcon}>💰</Text>
                        <Text style={styles.menuTitle}>Fees</Text>
                        <Text style={styles.menuDescription}>Manage fees</Text>
                    </TouchableOpacity>



                    <TouchableOpacity
                        style={styles.menuCard}
                        onPress={() => navigation.navigate('Notices')}
                    >
                        <Text style={styles.menuIcon}>📢</Text>
                        <Text style={styles.menuTitle}>Notices</Text>
                        <Text style={styles.menuDescription}>Send announcements</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuCard}
                        onPress={() => navigation.navigate('FeesDetails')}
                    >
                        <Text style={styles.menuIcon}>📊</Text>
                        <Text style={styles.menuTitle}>Fees Details</Text>
                        <Text style={styles.menuDescription}>View collected & pending</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
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
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 16,
        backgroundColor: colors.primary,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.white,
        marginBottom: 4,
        letterSpacing: -1,
    },
    welcome: {
        fontSize: 14,
        color: colors.white,
        fontWeight: '600',
        opacity: 0.95,
    },
    role: {
        fontSize: 12,
        color: colors.white,
        marginTop: 2,
        opacity: 0.85,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        marginTop: -32,
        gap: 8,
    },
    statCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 12,
        paddingTop: 24,
        flex: 1,
        alignItems: 'center',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 0,
    },
    statIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.primary,
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        textAlign: 'center',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    menuCard: {
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 16,
        width: '48%',
        marginBottom: 0,
        alignItems: 'center',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 5,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 130,
        justifyContent: 'center',
    },
    menuIcon: {
        fontSize: 36,
        marginBottom: 10,
    },
    menuTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 4,
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    menuDescription: {
        fontSize: 11,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 14,
        fontWeight: '500',
    },
    logoutButton: {
        backgroundColor: colors.white,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: colors.danger,
        shadowColor: colors.danger,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    logoutText: {
        color: colors.danger,
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 0.5,
    },
});

export default DashboardScreen;
