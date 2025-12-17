import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const AttendanceScreen = ({ navigation }) => {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        fetchClasses();
        getUser();
    }, []);

    const getUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    };

    const fetchClasses = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userData = await AsyncStorage.getItem('user');
            const user = JSON.parse(userData);
            const userId = user.id || user._id;

            let url = `${API_URL}/classes`;
            if (user.role === 'staff') {
                url += `?staffId=${userId}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Filter to show only classes where the staff is the CLASS staff
            // Subject staffs cannot mark attendance
            const filteredClasses = response.data.filter(classItem => {
                const classStaffId = classItem.classstaff?._id || classItem.classstaff;
                return classStaffId && classStaffId.toString() === userId.toString();
            });

            setClasses(filteredClasses);

            if (filteredClasses.length === 1) {
                handleSelectClass(filteredClasses[0]);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch classes');
        }
    };

    const handleSelectClass = async (classItem) => {
        setSelectedClass(classItem);
        await loadStudents(classItem._id, selectedDate);
    };

    const loadStudents = async (classId, date) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/students?classId=${classId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const classStudents = response.data.filter(s => s.studentClass?._id === classId);
            setStudents(classStudents);

            // Fetch existing attendance for the selected date
            const dateStr = date.toISOString().split('T')[0];
            const attendanceRes = await axios.get(`${API_URL}/attendance?classId=${classId}&date=${dateStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const existingAttendance = {};
            if (attendanceRes.data && attendanceRes.data.length > 0) {
                // Assuming API returns an array of records for the day
                const record = attendanceRes.data[0]; // Should be one record per class per day
                if (record && record.records) {
                    record.records.forEach(r => {
                        existingAttendance[r.student?._id || r.student] = r.status;
                    });
                }
            }

            // Initialize attendance: Use existing if available, else default to 'Present'
            const initialAttendance = {};
            classStudents.forEach(student => {
                initialAttendance[student._id] = existingAttendance[student._id] || 'Present';
            });
            setAttendance(initialAttendance);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch students/attendance');
        }
    };

    const handleDateChange = (event, date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
            if (selectedClass) {
                loadStudents(selectedClass._id, date);
            }
        }
    };

    const toggleAttendance = (studentId, status) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleSubmitAttendance = async () => {
        if (!selectedClass) {
            Alert.alert('Error', 'Please select a class');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const records = Object.keys(attendance).map(studentId => ({
                student: studentId,
                status: attendance[studentId],
            }));

            await axios.post(`${API_URL}/attendance`, {
                classId: selectedClass._id,
                staffId: user.id || user._id,
                records,
                date: selectedDate,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Success', 'Attendance marked successfully');
            setSelectedClass(null);
            setStudents([]);
            setAttendance({});
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to mark attendance');
        } finally {
            setLoading(false);
        }
    };

    const renderClassItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.classCard, selectedClass?._id === item._id && styles.selectedClassCard]}
            onPress={() => handleSelectClass(item)}
        >
            <Text style={styles.className}>{item.name}</Text>
            <Text style={styles.classDetails}>Grade {item.grade} - Section {item.section}</Text>
        </TouchableOpacity>
    );

    const renderStudentItem = ({ item }) => (
        <View style={styles.studentCard}>
            <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentEmail}>{item.email}</Text>
            </View>
            <View style={styles.attendanceButtons}>
                <TouchableOpacity
                    style={[
                        styles.statusButton,
                        styles.presentButton,
                        attendance[item._id] === 'Present' && styles.activePresentButton
                    ]}
                    onPress={() => toggleAttendance(item._id, 'Present')}
                >
                    <Text style={[
                        styles.statusButtonText,
                        attendance[item._id] === 'Present' ? styles.activeButtonText : { color: colors.success }
                    ]}>
                        P
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.statusButton,
                        styles.absentButton,
                        attendance[item._id] === 'Absent' && styles.activeAbsentButton
                    ]}
                    onPress={() => toggleAttendance(item._id, 'Absent')}
                >
                    <Text style={[
                        styles.statusButtonText,
                        attendance[item._id] === 'Absent' ? styles.activeButtonText : { color: colors.danger }
                    ]}>
                        A
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.statusButton,
                        styles.odButton,
                        attendance[item._id] === 'OD' && styles.activeOdButton
                    ]}
                    onPress={() => toggleAttendance(item._id, 'OD')}
                >
                    <Text style={[
                        styles.statusButtonText,
                        attendance[item._id] === 'OD' ? styles.activeButtonText : { color: colors.warning }
                    ]}>
                        OD
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                        <Text style={styles.backButton}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Mark Attendance</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.date}>{selectedDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
            </View>
            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                />
            )}

            {!selectedClass ? (
                <>
                    <Text style={styles.sectionTitle}>Select Your Class</Text>
                    <FlatList
                        data={classes}
                        renderItem={renderClassItem}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>You are not assigned as a class staff</Text>
                        }
                    />
                </>
            ) : (
                <>
                    <View style={styles.selectedClassHeader}>
                        <View>
                            <Text style={styles.selectedClassName}>{selectedClass.name}</Text>
                            <Text style={styles.selectedSubjectName}>Full Day Attendance</Text>
                        </View>
                        <TouchableOpacity onPress={() => {
                            setSelectedClass(null);
                            setStudents([]);
                        }}>
                            <Text style={styles.changeClassText}>Change</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1 }}>
                        <FlatList
                            data={students}
                            renderItem={renderStudentItem}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={styles.list}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No students in this class</Text>
                            }
                        />
                    </View>

                    {students.length > 0 && (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleSubmitAttendance}
                                disabled={loading}
                            >
                                <Text style={styles.submitButtonText}>
                                    {loading ? 'Submitting...' : 'Submit Attendance'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
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
        padding: 20,
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.primary,
    },
    backButton: {
        fontSize: 24,
        color: colors.primary,
        fontWeight: '600',
    },
    date: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    list: {
        padding: 20,
        paddingTop: 10,
    },
    classCard: {
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
    selectedClassCard: {
        borderWidth: 2,
        borderColor: colors.primary,
    },
    className: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    classDetails: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    selectedClassHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: colors.primary,
    },
    selectedClassName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.white,
    },
    selectedSubjectName: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    changeClassText: {
        fontSize: 14,
        color: colors.white,
        textDecorationLine: 'underline',
    },
    studentCard: {
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
    studentInfo: {
        marginBottom: 12,
    },
    studentName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    studentEmail: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    attendanceButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    statusButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: colors.white,
    },
    presentButton: {
        borderColor: colors.success,
    },
    absentButton: {
        borderColor: colors.danger,
    },
    activePresentButton: {
        backgroundColor: colors.success,
    },
    activeAbsentButton: {
        backgroundColor: colors.danger,
    },
    odButton: {
        borderColor: colors.warning,
    },
    activeOdButton: {
        backgroundColor: colors.warning,
    },
    statusButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    activeButtonText: {
        color: colors.white,
        fontWeight: 'bold',
    },
    footer: {
        padding: 20,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    submitButton: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 16,
        marginTop: 40,
    },
});

export default AttendanceScreen;
