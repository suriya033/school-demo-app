import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';
import { Picker } from '@react-native-picker/picker';

const UploadTimetableScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [staffs, setstaffs] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDay, setSelectedDay] = useState('Monday');
    const [academicYear, setAcademicYear] = useState('2024-2025');
    const [periods, setPeriods] = useState([
        { periodNumber: 1, startTime: '09:00', endTime: '09:45', subject: '', staff: '', isBreak: false }
    ]);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        getUser();
        fetchData();
    }, []);

    const getUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    };

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userData = await AsyncStorage.getItem('user');
            const parsedUser = userData ? JSON.parse(userData) : null;

            const [classesRes, subjectsRes, staffsRes] = await Promise.all([
                axios.get(`${API_URL}/classes`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/staffs`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            let availableClasses = classesRes.data;

            // If user is staff, filter classes where they are the Class Teacher
            if (parsedUser && parsedUser.role === 'staff') {
                const userId = parsedUser.id || parsedUser._id;
                if (userId) {
                    availableClasses = availableClasses.filter(cls => {
                        const classStaffId = cls.classstaff?._id || cls.classstaff;
                        return classStaffId && userId && classStaffId.toString() === userId.toString();
                    });
                }
            }

            setClasses(availableClasses);

            // Auto-select if only one class
            if (availableClasses.length === 1) {
                setSelectedClass(availableClasses[0]._id);
            }

            setSubjects(subjectsRes.data);
            setstaffs(staffsRes.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch data');
        }
    };

    const addPeriod = () => {
        const lastPeriod = periods[periods.length - 1];
        const newPeriodNumber = lastPeriod.periodNumber + 1;

        setPeriods([...periods, {
            periodNumber: newPeriodNumber,
            startTime: '',
            endTime: '',
            subject: '',
            staff: '',
            isBreak: false
        }]);
    };

    const addBreak = () => {
        setPeriods([...periods, {
            periodNumber: periods.length + 1,
            startTime: '',
            endTime: '',
            subject: '',
            staff: '',
            isBreak: true,
            breakType: 'Short Break'
        }]);
    };

    const removePeriod = (index) => {
        const newPeriods = periods.filter((_, i) => i !== index);
        setPeriods(newPeriods);
    };

    const updatePeriod = (index, field, value) => {
        const newPeriods = [...periods];
        newPeriods[index][field] = value;

        // Auto-select staff if subject is changed
        if (field === 'subject') {
            const cls = classes.find(c => c._id === selectedClass);
            if (cls && cls.subjectstaffs) {
                const subjectStaffEntry = cls.subjectstaffs.find(ss => ss.subject?._id === value || ss.subject === value);
                if (subjectStaffEntry) {
                    const staffId = subjectStaffEntry.staff?._id || subjectStaffEntry.staff;
                    newPeriods[index].staff = staffId;
                } else {
                    newPeriods[index].staff = ''; // Reset if no staff assigned
                }
            }
        }

        setPeriods(newPeriods);
    };

    const handleSubmit = async () => {
        if (!selectedClass) {
            Alert.alert('Error', 'Please select a class');
            return;
        }

        if (periods.length === 0) {
            Alert.alert('Error', 'Please add at least one period');
            return;
        }

        // Validate periods
        for (let i = 0; i < periods.length; i++) {
            const period = periods[i];
            if (!period.startTime || !period.endTime) {
                Alert.alert('Error', `Please fill time for period ${i + 1}`);
                return;
            }
            if (!period.isBreak && (!period.subject || !period.staff)) {
                Alert.alert('Error', `Please select subject and staff for period ${i + 1}`);
                return;
            }
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');

            const timetableData = {
                class: selectedClass,
                day: selectedDay,
                academicYear,
                periods: periods.map(p => ({
                    ...p,
                    subject: p.isBreak ? null : p.subject,
                    staff: p.isBreak ? null : p.staff
                }))
            };

            await axios.post(`${API_URL}/timetables`, timetableData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Success', 'Timetable uploaded successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to upload timetable');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                        <Text style={styles.backButton}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Upload Timetable</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Class Selection */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Select Class *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedClass}
                            onValueChange={setSelectedClass}
                            style={styles.picker}
                        >
                            <Picker.Item label="Select Class" value="" />
                            {classes.map((cls) => (
                                <Picker.Item key={cls._id} label={cls.name} value={cls._id} />
                            ))}
                        </Picker>
                    </View>
                </View>

                {/* Day Selection */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Select Day *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedDay}
                            onValueChange={setSelectedDay}
                            style={styles.picker}
                        >
                            {days.map((day) => (
                                <Picker.Item key={day} label={day} value={day} />
                            ))}
                        </Picker>
                    </View>
                </View>

                {/* Academic Year */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Academic Year *</Text>
                    <TextInput
                        style={styles.input}
                        value={academicYear}
                        onChangeText={setAcademicYear}
                        placeholder="e.g., 2024-2025"
                    />
                </View>

                {/* Periods */}
                <View style={styles.periodsSection}>
                    <Text style={styles.sectionTitle}>Periods</Text>

                    {periods.map((period, index) => (
                        <View key={index} style={[
                            styles.periodCard,
                            period.isBreak && styles.breakPeriodCard
                        ]}>
                            <View style={styles.periodHeader}>
                                <Text style={styles.periodTitle}>
                                    {period.isBreak ? '🔔 Break' : `📚 Period ${period.periodNumber}`}
                                </Text>
                                <TouchableOpacity onPress={() => removePeriod(index)}>
                                    <Text style={styles.removeButton}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.timeRow}>
                                <View style={styles.timeInput}>
                                    <Text style={styles.inputLabel}>Start Time</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={period.startTime}
                                        onChangeText={(value) => updatePeriod(index, 'startTime', value)}
                                        placeholder="09:00"
                                    />
                                </View>
                                <View style={styles.timeInput}>
                                    <Text style={styles.inputLabel}>End Time</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={period.endTime}
                                        onChangeText={(value) => updatePeriod(index, 'endTime', value)}
                                        placeholder="09:45"
                                    />
                                </View>
                            </View>

                            {period.isBreak ? (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Break Type</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={period.breakType}
                                            onValueChange={(value) => updatePeriod(index, 'breakType', value)}
                                            style={styles.picker}
                                        >
                                            <Picker.Item label="Short Break" value="Short Break" />
                                            <Picker.Item label="Lunch Break" value="Lunch Break" />
                                        </Picker>
                                    </View>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Subject</Text>
                                        <View style={styles.pickerContainer}>
                                            <Picker
                                                selectedValue={period.subject}
                                                onValueChange={(value) => updatePeriod(index, 'subject', value)}
                                                style={styles.picker}
                                            >
                                                <Picker.Item label="Select Subject" value="" />
                                                {subjects
                                                    .filter(subject => {
                                                        const cls = classes.find(c => c._id === selectedClass);
                                                        return cls?.subjects?.some(s => s._id === subject._id || s === subject._id);
                                                    })
                                                    .map((subject) => (
                                                        <Picker.Item key={subject._id} label={subject.name} value={subject._id} />
                                                    ))}
                                            </Picker>
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>staff</Text>
                                        <View style={styles.pickerContainer}>
                                            <Picker
                                                selectedValue={period.staff}
                                                onValueChange={(value) => updatePeriod(index, 'staff', value)}
                                                style={styles.picker}
                                            >
                                                <Picker.Item label="Select staff" value="" />
                                                {staffs.map((staff) => (
                                                    <Picker.Item key={staff._id} label={staff.name} value={staff._id} />
                                                ))}
                                            </Picker>
                                        </View>
                                    </View>
                                </>
                            )}
                        </View>
                    ))}

                    <View style={styles.addButtonsRow}>
                        <TouchableOpacity style={styles.addButton} onPress={addPeriod}>
                            <Text style={styles.addButtonText}>+ Add Period</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.addButton, styles.addBreakButton]} onPress={addBreak}>
                            <Text style={styles.addButtonText}>+ Add Break</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={styles.submitButtonText}>Upload Timetable</Text>
                    )}
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 6,
    },
    input: {
        backgroundColor: colors.white,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    pickerContainer: {
        backgroundColor: colors.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    periodsSection: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 15,
    },
    periodCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: colors.border,
    },
    breakPeriodCard: {
        backgroundColor: '#FFF8E1',
        borderColor: colors.accent,
    },
    periodHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    periodTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    removeButton: {
        fontSize: 24,
        color: colors.danger,
        fontWeight: 'bold',
    },
    timeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    timeInput: {
        flex: 1,
    },
    addButtonsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    addButton: {
        flex: 1,
        backgroundColor: colors.primary,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    addBreakButton: {
        backgroundColor: colors.accent,
    },
    addButtonText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: colors.success,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default UploadTimetableScreen;
