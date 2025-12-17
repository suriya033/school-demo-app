import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Modal, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const AdminAttendanceDashboard = ({ navigation }) => {
    const [attendanceStats, setAttendanceStats] = useState([]);
    const [filteredStats, setFilteredStats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAttendanceStats();
    }, [selectedDate]);

    useEffect(() => {
        filterStats();
    }, [searchQuery, attendanceStats]);

    const fetchAttendanceStats = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/attendance/admin-stats?date=${selectedDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttendanceStats(response.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch attendance statistics');
        } finally {
            setLoading(false);
        }
    };

    const filterStats = () => {
        if (!searchQuery.trim()) {
            setFilteredStats(attendanceStats);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = attendanceStats.filter(stat =>
            stat.className.toLowerCase().includes(query)
        );
        setFilteredStats(filtered);
    };

    const renderClassStats = ({ item }) => {
        const totalStudents = item.present + item.absent + item.od;
        const presentPercentage = totalStudents > 0 ? ((item.present / totalStudents) * 100).toFixed(1) : 0;

        return (
            <TouchableOpacity
                style={styles.classCard}
                onPress={() => navigation.navigate('ClassAttendanceDetails', {
                    classId: item.classId,
                    className: item.className,
                    date: selectedDate
                })}
            >
                <View style={styles.classHeader}>
                    <Text style={styles.className}>{item.className}</Text>
                    <View style={[
                        styles.percentageBadge,
                        { backgroundColor: presentPercentage >= 75 ? colors.success : presentPercentage >= 50 ? colors.warning : colors.danger }
                    ]}>
                        <Text style={styles.percentageText}>{presentPercentage}%</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
                            <Text style={styles.statEmoji}>✓</Text>
                        </View>
                        <View>
                            <Text style={styles.statLabel}>Present</Text>
                            <Text style={[styles.statValue, { color: colors.success }]}>{item.present}</Text>
                        </View>
                    </View>

                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: colors.danger + '20' }]}>
                            <Text style={styles.statEmoji}>✗</Text>
                        </View>
                        <View>
                            <Text style={styles.statLabel}>Absent</Text>
                            <Text style={[styles.statValue, { color: colors.danger }]}>{item.absent}</Text>
                        </View>
                    </View>

                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: colors.warning + '20' }]}>
                            <Text style={styles.statEmoji}>📋</Text>
                        </View>
                        <View>
                            <Text style={styles.statLabel}>OD</Text>
                            <Text style={[styles.statValue, { color: colors.warning }]}>{item.od}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Students:</Text>
                    <Text style={styles.totalValue}>{totalStudents}</Text>
                </View>

                <View style={styles.viewDetailsHint}>
                    <Text style={styles.viewDetailsText}>Tap to view details →</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const getTotalStats = () => {
        const totals = attendanceStats.reduce((acc, item) => ({
            present: acc.present + item.present,
            absent: acc.absent + item.absent,
            od: acc.od + item.od
        }), { present: 0, absent: 0, od: 0 });

        return totals;
    };

    // Calendar functions
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const formatMonthYear = (date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const changeMonth = (increment) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentMonth(newDate);
    };

    const selectDate = (date) => {
        if (date) {
            const formattedDate = date.toISOString().split('T')[0];
            setSelectedDate(formattedDate);
            setCalendarVisible(false);
        }
    };

    const isSelectedDate = (date) => {
        if (!date) return false;
        return date.toISOString().split('T')[0] === selectedDate;
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const totals = getTotalStats();
    const grandTotal = totals.present + totals.absent + totals.od;
    const overallPercentage = grandTotal > 0 ? ((totals.present / grandTotal) * 100).toFixed(1) : 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Attendance Dashboard</Text>
            </View>

            <View style={styles.dateSelector}>
                <Text style={styles.dateLabel}>Date:</Text>
                <Text style={styles.dateValue}>{selectedDate}</Text>
                <TouchableOpacity
                    style={styles.calendarButton}
                    onPress={() => setCalendarVisible(true)}
                >
                    <Text style={styles.calendarButtonText}>📅 Calendar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.changeDateButton}
                    onPress={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                >
                    <Text style={styles.changeDateText}>Today</Text>
                </TouchableOpacity>
            </View>

            {grandTotal > 0 && (
                <View style={styles.overallStats}>
                    <Text style={styles.overallTitle}>Overall Attendance</Text>
                    <View style={styles.overallRow}>
                        <View style={styles.overallItem}>
                            <Text style={styles.overallLabel}>Present</Text>
                            <Text style={[styles.overallValue, { color: colors.success }]}>{totals.present}</Text>
                        </View>
                        <View style={styles.overallItem}>
                            <Text style={styles.overallLabel}>Absent</Text>
                            <Text style={[styles.overallValue, { color: colors.danger }]}>{totals.absent}</Text>
                        </View>
                        <View style={styles.overallItem}>
                            <Text style={styles.overallLabel}>OD</Text>
                            <Text style={[styles.overallValue, { color: colors.warning }]}>{totals.od}</Text>
                        </View>
                        <View style={styles.overallItem}>
                            <Text style={styles.overallLabel}>Total</Text>
                            <Text style={styles.overallValue}>{grandTotal}</Text>
                        </View>
                    </View>
                    <View style={styles.percentageBar}>
                        <View style={[styles.percentageFill, { width: `${overallPercentage}%` }]} />
                        <Text style={styles.percentageBarText}>{overallPercentage}% Present</Text>
                    </View>
                </View>
            )}

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search classes..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearSearchButton}
                        onPress={() => setSearchQuery('')}
                    >
                        <Text style={styles.clearSearchText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={filteredStats}
                renderItem={renderClassStats}
                keyExtractor={(item) => item.classId}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchAttendanceStats} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'No classes match your search' : 'No attendance data for this date'}
                        </Text>
                    </View>
                }
            />

            {/* Calendar Modal */}
            <Modal
                visible={calendarVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setCalendarVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setCalendarVisible(false)}
                >
                    <View style={styles.calendarModal}>
                        <View style={styles.calendarHeader}>
                            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
                                <Text style={styles.monthButtonText}>←</Text>
                            </TouchableOpacity>
                            <Text style={styles.monthYearText}>{formatMonthYear(currentMonth)}</Text>
                            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
                                <Text style={styles.monthButtonText}>→</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.weekDaysRow}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <Text key={day} style={styles.weekDayText}>{day}</Text>
                            ))}
                        </View>

                        <ScrollView style={styles.daysContainer}>
                            <View style={styles.daysGrid}>
                                {getDaysInMonth(currentMonth).map((date, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.dayCell,
                                            !date && styles.emptyDayCell,
                                            isSelectedDate(date) && styles.selectedDayCell,
                                            isToday(date) && !isSelectedDate(date) && styles.todayDayCell,
                                        ]}
                                        onPress={() => selectDate(date)}
                                        disabled={!date}
                                    >
                                        {date && (
                                            <Text style={[
                                                styles.dayText,
                                                isSelectedDate(date) && styles.selectedDayText,
                                                isToday(date) && !isSelectedDate(date) && styles.todayDayText,
                                            ]}>
                                                {date.getDate()}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.closeCalendarButton}
                            onPress={() => setCalendarVisible(false)}
                        >
                            <Text style={styles.closeCalendarText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
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
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        zIndex: 10,
    },
    dateLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textLight,
        marginRight: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dateValue: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        flex: 1,
    },
    changeDateButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.primary,
        borderRadius: 8,
        marginLeft: 12,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    changeDateText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '700',
    },
    overallStats: {
        backgroundColor: colors.white,
        margin: 24,
        padding: 24,
        borderRadius: 20,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    overallTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 20,
        letterSpacing: -0.5,
    },
    overallRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    overallItem: {
        alignItems: 'center',
        flex: 1,
    },
    overallLabel: {
        fontSize: 12,
        color: colors.textLight,
        marginBottom: 8,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    overallValue: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    percentageBar: {
        height: 36,
        backgroundColor: colors.background,
        borderRadius: 18,
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
    percentageBarText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.white,
        zIndex: 1,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    listContainer: {
        padding: 24,
        paddingTop: 0,
    },
    classCard: {
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
    classHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    className: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    percentageBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    percentageText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    statEmoji: {
        fontSize: 16,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textLight,
        fontWeight: '600',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    totalLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
        fontStyle: 'italic',
        fontWeight: '500',
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
    clearSearchButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.textLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    clearSearchText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
    viewDetailsHint: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'center',
    },
    viewDetailsText: {
        fontSize: 13,
        color: colors.primary,
        fontWeight: '600',
    },
    calendarButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.secondary,
        borderRadius: 8,
        marginLeft: 12,
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    calendarButtonText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    calendarModal: {
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 10,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    monthButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthButtonText: {
        fontSize: 20,
        color: colors.white,
        fontWeight: '700',
    },
    monthYearText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textLight,
        width: 40,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    daysContainer: {
        maxHeight: 300,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyDayCell: {
        backgroundColor: 'transparent',
    },
    selectedDayCell: {
        backgroundColor: colors.primary,
        borderRadius: 20,
    },
    todayDayCell: {
        backgroundColor: colors.background,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    dayText: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    selectedDayText: {
        color: colors.white,
        fontWeight: '700',
    },
    todayDayText: {
        color: colors.primary,
        fontWeight: '700',
    },
    closeCalendarButton: {
        backgroundColor: colors.primary,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    closeCalendarText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});

export default AdminAttendanceDashboard;
