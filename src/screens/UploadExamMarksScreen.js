import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';
import { Picker } from '@react-native-picker/picker';

const UploadExamMarksScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState('all');

    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [examType, setExamType] = useState('Mid-Term');
    const [examName, setExamName] = useState('');
    const [academicYear, setAcademicYear] = useState('2024-2025');
    const [rank, setRank] = useState('');
    const [remarks, setRemarks] = useState('');
    const [subjectMarks, setSubjectMarks] = useState([]);

    const examTypes = ['Mid-Term', 'Final', 'Unit Test', 'Quarterly', 'Half-Yearly', 'Annual'];

    useEffect(() => {
        getUser();
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchStudents(selectedClass);

            const selectedClassObj = classes.find(c => c._id === selectedClass);
            if (selectedClassObj && selectedClassObj.subjects) {
                setSubjects(selectedClassObj.subjects);

                // Initialize subject marks based on class subjects
                const initialMarks = selectedClassObj.subjects.map(subject => ({
                    subject: subject._id,
                    subjectName: subject.name,
                    marksObtained: '',
                    totalMarks: '100',
                    remarks: ''
                }));
                setSubjectMarks(initialMarks);
            }
        } else {
            setSubjects([]);
            setSubjectMarks([]);
            setStudents([]);
        }
    }, [selectedClass, classes]);

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

            const response = await axios.get(`${API_URL}/classes`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            let availableClasses = response.data;

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

            if (availableClasses.length === 1) {
                setSelectedClass(availableClasses[0]._id);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch data');
        }
    };

    const fetchStudents = async (classId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/students?classId=${classId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const updateSubjectMark = (index, field, value) => {
        const newMarks = [...subjectMarks];
        newMarks[index][field] = value;
        setSubjectMarks(newMarks);
    };

    const handleSubmit = async () => {
        if (!selectedStudent) {
            Alert.alert('Error', 'Please select a student');
            return;
        }

        if (!examName.trim()) {
            Alert.alert('Error', 'Please enter exam name');
            return;
        }

        // Filter subjects with marks entered
        const validSubjects = subjectMarks.filter(sm => sm.marksObtained !== '');

        if (validSubjects.length === 0) {
            Alert.alert('Error', 'Please enter marks for at least one subject');
            return;
        }

        // Validate marks
        for (let subject of validSubjects) {
            const obtained = parseFloat(subject.marksObtained);
            const total = parseFloat(subject.totalMarks);

            if (isNaN(obtained) || isNaN(total)) {
                Alert.alert('Error', `Invalid marks for ${subject.subjectName}`);
                return;
            }

            if (obtained > total) {
                Alert.alert('Error', `Marks obtained cannot exceed total marks for ${subject.subjectName}`);
                return;
            }
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');

            const resultData = {
                student: selectedStudent,
                class: selectedClass,
                examType,
                examName: examName.trim(),
                academicYear,
                subjects: validSubjects.map(sm => ({
                    subject: sm.subject,
                    marksObtained: parseFloat(sm.marksObtained),
                    totalMarks: parseFloat(sm.totalMarks),
                    remarks: sm.remarks
                })),
                rank: rank ? parseInt(rank) : undefined,
                remarks: remarks.trim()
            };

            await axios.post(`${API_URL}/exam-results`, resultData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Success', 'Exam marks uploaded successfully', [
                {
                    text: 'OK',
                    onPress: () => {
                        // Reset form
                        setSelectedStudent('');
                        setExamName('');
                        setRank('');
                        setRemarks('');
                        const resetMarks = subjectMarks.map(sm => ({
                            ...sm,
                            marksObtained: '',
                            totalMarks: '100',
                            remarks: ''
                        }));
                        setSubjectMarks(resetMarks);
                    }
                }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to upload exam marks');
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
                    <Text style={styles.title}>Upload Exam Marks</Text>
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

                {/* Student Selection */}
                {selectedClass && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Select Student *</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedStudent}
                                onValueChange={setSelectedStudent}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select Student" value="" />
                                {students.map((student) => (
                                    <Picker.Item
                                        key={student._id}
                                        label={`${student.name} (${student.registerNumber || 'N/A'})`}
                                        value={student._id}
                                    />
                                ))}
                            </Picker>
                        </View>
                    </View>
                )}

                {/* Exam Details */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Exam Type *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={examType}
                            onValueChange={setExamType}
                            style={styles.picker}
                        >
                            {examTypes.map((type) => (
                                <Picker.Item key={type} label={type} value={type} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Exam Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={examName}
                        onChangeText={setExamName}
                        placeholder="e.g., First Mid-Term Exam"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Academic Year *</Text>
                    <TextInput
                        style={styles.input}
                        value={academicYear}
                        onChangeText={setAcademicYear}
                        placeholder="e.g., 2024-2025"
                    />
                </View>

                {/* Subject Selection for Marks Entry */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Select Subject to Enter Marks</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedSubject}
                            onValueChange={setSelectedSubject}
                            style={styles.picker}
                        >
                            <Picker.Item label="All Subjects" value="all" />
                            {subjects.map((subject) => (
                                <Picker.Item key={subject._id} label={subject.name} value={subject._id} />
                            ))}
                        </Picker>
                    </View>
                </View>

                {/* Subject Marks */}
                <View style={styles.marksSection}>
                    <Text style={styles.sectionTitle}>Subject-wise Marks</Text>

                    {subjectMarks
                        .filter(subject => selectedSubject === 'all' || subject.subject === selectedSubject)
                        .map((subject, index) => {
                            // Find the actual index in the main array to update correctly
                            const actualIndex = subjectMarks.findIndex(s => s.subject === subject.subject);
                            return (
                                <View key={subject.subject} style={styles.subjectCard}>
                                    <Text style={styles.subjectName}>📚 {subject.subjectName}</Text>

                                    <View style={styles.marksRow}>
                                        <View style={styles.marksInput}>
                                            <Text style={styles.inputLabel}>Marks Obtained</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={subject.marksObtained}
                                                onChangeText={(value) => updateSubjectMark(actualIndex, 'marksObtained', value)}
                                                placeholder="0"
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={styles.marksInput}>
                                            <Text style={styles.inputLabel}>Total Marks</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={subject.totalMarks}
                                                onChangeText={(value) => updateSubjectMark(actualIndex, 'totalMarks', value)}
                                                placeholder="100"
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Remarks (Optional)</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={subject.remarks}
                                            onChangeText={(value) => updateSubjectMark(actualIndex, 'remarks', value)}
                                            placeholder="e.g., Good performance"
                                        />
                                    </View>
                                </View>
                            )
                        })}
                </View>

                {/* Additional Information */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Rank (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={rank}
                        onChangeText={setRank}
                        placeholder="e.g., 1"
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Overall Remarks (Optional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={remarks}
                        onChangeText={setRemarks}
                        placeholder="Enter overall performance remarks"
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={styles.submitButtonText}>Upload Exam Marks</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView >
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
    textArea: {
        height: 100,
        textAlignVertical: 'top',
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
    marksSection: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 15,
    },
    subjectCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: colors.border,
    },
    subjectName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 12,
    },
    marksRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    marksInput: {
        flex: 1,
    },
    submitButton: {
        backgroundColor: colors.success,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
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

export default UploadExamMarksScreen;
