import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const TimetableScreen = ({ navigation, route }) => {
    const [user, setUser] = useState(null);
    const [timetables, setTimetables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState('Monday');
    const [viewMode, setViewMode] = useState('class'); // 'class' or 'staff'
    const [classInfo, setClassInfo] = useState(null);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Get params from navigation
    const { classId: paramClassId, staffId: paramStaffId, viewType } = route.params || {};

    useEffect(() => {
        getUser();
    }, []);

    const getUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            // Determine what to fetch based on params or user role
            if (viewType === 'staff' || paramStaffId) {
                setViewMode('staff');
                fetchStaffTimetable(paramStaffId || parsedUser.id || parsedUser._id);
            } else if (paramClassId) {
                setViewMode('class');
                fetchTimetable(paramClassId);
            } else if (parsedUser.studentClass) {
                setViewMode('class');
                // Handle studentClass being either an object or ID string
                const classId = typeof parsedUser.studentClass === 'object'
                    ? parsedUser.studentClass._id
                    : parsedUser.studentClass;
                fetchTimetable(classId);
            } else if (parsedUser.role === 'staff') {
                setViewMode('staff');
                fetchStaffTimetable(parsedUser.id || parsedUser._id);
            }
        }
    };

    const fetchTimetable = async (classId) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/timetables?classId=${classId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTimetables(response.data);

            // Fetch class info
            if (classId) {
                const classRes = await axios.get(`${API_URL}/classes/${classId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClassInfo(classRes.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStaffTimetable = async (staffId) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            // Fetch all timetables and filter for this staff
            const response = await axios.get(`${API_URL}/timetables`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Filter periods where this staff is teaching
            const staffTimetables = response.data.map(dayTimetable => ({
                ...dayTimetable,
                periods: dayTimetable.periods.filter(period =>
                    !period.isBreak && (period.staff?._id === staffId || period.staff === staffId)
                )
            })).filter(dayTimetable => dayTimetable.periods.length > 0);

            setTimetables(staffTimetables);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getTimetableForDay = (day) => {
        return timetables.find(t => t.day === day);
    };

    const currentDayTimetable = getTimetableForDay(selectedDay);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                        <Text style={styles.backButton}>←</Text>
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>
                            {viewMode === 'staff' ? 'My Teaching Schedule' : 'Timetable'}
                        </Text>
                        {classInfo && (
                            <Text style={styles.subtitle}>{classInfo.name}</Text>
                        )}
                    </View>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {/* Day Selector */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.daySelector}
                    >
                        {days.map((day) => (
                            <TouchableOpacity
                                key={day}
                                style={[
                                    styles.dayButton,
                                    selectedDay === day && styles.dayButtonActive
                                ]}
                                onPress={() => setSelectedDay(day)}
                            >
                                <Text style={[
                                    styles.dayButtonText,
                                    selectedDay === day && styles.dayButtonTextActive
                                ]}>
                                    {day.substring(0, 3)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Timetable Display */}
                    {currentDayTimetable ? (
                        <View style={styles.timetableContainer}>
                            <Text style={styles.dayTitle}>{selectedDay}</Text>
                            {currentDayTimetable.periods.map((period, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.periodCard,
                                        period.isBreak && styles.breakCard
                                    ]}
                                >
                                    <View style={styles.periodHeader}>
                                        <Text style={styles.periodNumber}>
                                            {period.isBreak ? '🔔' : `Period ${period.periodNumber}`}
                                        </Text>
                                        <Text style={styles.periodTime}>
                                            {period.startTime} - {period.endTime}
                                        </Text>
                                    </View>
                                    {period.isBreak ? (
                                        <Text style={styles.breakText}>{period.breakType}</Text>
                                    ) : (
                                        <View style={styles.periodDetails}>
                                            <Text style={styles.subjectName}>
                                                📚 {period.subject?.name || 'N/A'}
                                            </Text>
                                            {viewMode === 'staff' ? (
                                                <Text style={styles.className}>
                                                    🏫 {currentDayTimetable.class?.name || 'N/A'}
                                                </Text>
                                            ) : (
                                                <Text style={styles.staffName}>
                                                    👨‍🏫 {period.staff?.name || 'N/A'}
                                                </Text>
                                            )}
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📅</Text>
                            <Text style={styles.emptyText}>No timetable available for {selectedDay}</Text>
                        </View>
                    )}
                </ScrollView>
            )}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        fontSize: 24,
        color: colors.primary,
        fontWeight: '600',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    daySelector: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        maxHeight: 70,
    },
    dayButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginRight: 10,
        borderRadius: 20,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dayButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    dayButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    dayButtonTextActive: {
        color: colors.white,
    },
    timetableContainer: {
        paddingHorizontal: 20,
    },
    dayTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 15,
    },
    periodCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    breakCard: {
        backgroundColor: '#FFF8E1',
        borderLeftWidth: 4,
        borderLeftColor: colors.accent,
    },
    periodHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    periodNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
    },
    periodTime: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    periodDetails: {
        marginTop: 8,
    },
    subjectName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    staffName: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    className: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    breakText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.accent,
        textAlign: 'center',
    },
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
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});

export default TimetableScreen;
