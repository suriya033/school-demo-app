import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const ClassAttendanceDetailsScreen = ({ route, navigation }) => {
    const { classId, className, date } = route.params;
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ present: 0, absent: 0, od: 0 });

    useEffect(() => {
        fetchAttendanceDetails();
    }, [classId, date]);

    useEffect(() => {
        filterStudents();
    }, [searchQuery, students]);

    const fetchAttendanceDetails = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/attendance/class-details?classId=${classId}&date=${date}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setStudents(response.data.students || []);
            setStats(response.data.stats || { present: 0, absent: 0, od: 0 });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch attendance details');
        } finally {
            setLoading(false);
        }
    };

    const filterStudents = () => {
        if (!searchQuery.trim()) {
            setFilteredStudents(students);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = students.filter(student =>
            student.name.toLowerCase().includes(query) ||
            student.email?.toLowerCase().includes(query) ||
            student.registerNumber?.toLowerCase().includes(query)
        );
        setFilteredStudents(filtered);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present':
                return colors.success;
            case 'Absent':
                return colors.danger;
            case 'OD':
                return colors.warning;
            default:
                return colors.textSecondary;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Present':
                return '✓';
            case 'Absent':
                return '✗';
            case 'OD':
                return '📋';
            default:
                return '?';
        }
    };

    const renderStudentItem = ({ item }) => (
        <View style={styles.studentCard}>
            <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.name}</Text>
                {item.registerNumber && (
                    <Text style={styles.studentRegNo}>Reg: {item.registerNumber}</Text>
                )}
                {item.email && (
                    <Text style={styles.studentEmail}>{item.email}</Text>
                )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status}
                </Text>
            </View>
        </View>
    );

    const totalStudents = stats.present + stats.absent + stats.od;
    const presentPercentage = totalStudents > 0 ? ((stats.present / totalStudents) * 100).toFixed(1) : 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                        <Text style={styles.backButton}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.title}>{className}</Text>
                        <Text style={styles.subtitle}>{date}</Text>
                    </View>
                </View>
            </View>

            {/* Stats Summary */}
            <View style={styles.statsContainer}>
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: colors.success }]}>{stats.present}</Text>
                        <Text style={styles.statLabel}>Present</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: colors.danger }]}>{stats.absent}</Text>
                        <Text style={styles.statLabel}>Absent</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: colors.warning }]}>{stats.od}</Text>
                        <Text style={styles.statLabel}>OD</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{totalStudents}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                </View>
                <View style={styles.percentageBar}>
                    <View style={[styles.percentageFill, { width: `${presentPercentage}%` }]} />
                    <Text style={styles.percentageText}>{presentPercentage}% Present</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, email, or register number..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setSearchQuery('')}
                    >
                        <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Student List */}
            <FlatList
                data={filteredStudents}
                renderItem={renderStudentItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'No students match your search' : 'No attendance data available'}
                        </Text>
                    </View>
                }
                refreshing={loading}
                onRefresh={fetchAttendanceDetails}
            />
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
        fontSize: 24,
        color: colors.primary,
        fontWeight: '600',
    },
    headerInfo: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
        fontWeight: '500',
    },
    statsContainer: {
        backgroundColor: colors.white,
        margin: 24,
        padding: 20,
        borderRadius: 16,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textLight,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    percentageBar: {
        height: 32,
        backgroundColor: colors.background,
        borderRadius: 16,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    percentageFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: colors.success,
    },
    percentageText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.white,
        zIndex: 1,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        marginHorizontal: 24,
        marginBottom: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.textPrimary,
    },
    clearButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.textLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    clearButtonText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
    listContainer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    studentCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.border,
    },
    studentInfo: {
        flex: 1,
        marginRight: 12,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    studentRegNo: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 2,
        fontWeight: '500',
    },
    studentEmail: {
        fontSize: 12,
        color: colors.textLight,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    statusIcon: {
        fontSize: 16,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '700',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        fontWeight: '500',
    },
});

export default ClassAttendanceDetailsScreen;
