import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const StudentDetailsScreen = ({ route, navigation }) => {
    const { studentId } = route.params;
    const [student, setStudent] = useState(null);
    const [fees, setFees] = useState([]);
    const [examResults, setExamResults] = useState([]);
    const [attendance, setAttendance] = useState({ present: 0, absent: 0, total: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudentDetails();
    }, []);

    const fetchStudentDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('token');

            // Fetch student data
            const studentRes = await axios.get(`${API_URL}/students/${studentId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStudent(studentRes.data);

            // Fetch fees
            try {
                const feesRes = await axios.get(`${API_URL}/fees?studentId=${studentId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setFees(feesRes.data);
            } catch (error) {
                console.log('No fees data');
            }

            // Fetch exam results
            try {
                const resultsRes = await axios.get(`${API_URL}/exam-results?studentId=${studentId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setExamResults(resultsRes.data);
            } catch (error) {
                console.log('No exam results');
            }

            // Fetch attendance
            try {
                const attendanceRes = await axios.get(`${API_URL}/attendance?studentId=${studentId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const records = attendanceRes.data;
                const present = records.filter(r => r.status === 'Present').length;
                const absent = records.filter(r => r.status === 'Absent').length;
                setAttendance({ present, absent, total: records.length });
            } catch (error) {
                console.log('No attendance data');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load student details');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalFees = () => {
        return fees.reduce((sum, fee) => sum + fee.amount, 0);
    };

    const calculatePaidFees = () => {
        return fees.reduce((sum, fee) => sum + (fee.amountPaid || 0), 0);
    };

    const calculatePendingFees = () => {
        return calculateTotalFees() - calculatePaidFees();
    };

    const calculateAverageMarks = () => {
        if (examResults.length === 0) return 0;
        const total = examResults.reduce((sum, result) => sum + result.marksObtained, 0);
        return (total / examResults.length).toFixed(2);
    };

    const getAttendancePercentage = () => {
        if (attendance.total === 0) return 0;
        return ((attendance.present / attendance.total) * 100).toFixed(1);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            </SafeAreaView>
        );
    }

    if (!student) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>Student not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Student Details</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    {student.profilePicture ? (
                        <Image
                            source={{
                                uri: student.profilePicture.startsWith('http')
                                    ? student.profilePicture
                                    : `${API_URL.replace('/api', '')}/${student.profilePicture}`
                            }}
                            style={styles.profileImage}
                        />
                    ) : (
                        <View style={styles.profilePlaceholder}>
                            <Text style={styles.profilePlaceholderText}>
                                {student.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentEmail}>{student.email}</Text>
                    {student.registerNumber && (
                        <Text style={styles.registerNumber}>Reg: {student.registerNumber}</Text>
                    )}
                </View>

                {/* Basic Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Class:</Text>
                        <Text style={styles.infoValue}>{student.studentClass?.name || 'Not Assigned'}</Text>
                    </View>
                    {student.phone && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Phone:</Text>
                            <Text style={styles.infoValue}>{student.phone}</Text>
                        </View>
                    )}
                    {student.dateOfBirth && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Date of Birth:</Text>
                            <Text style={styles.infoValue}>
                                {new Date(student.dateOfBirth).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                    {student.gender && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Gender:</Text>
                            <Text style={styles.infoValue}>{student.gender}</Text>
                        </View>
                    )}
                    {student.address && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Address:</Text>
                            <Text style={styles.infoValue}>{student.address}</Text>
                        </View>
                    )}
                </View>

                {/* Fees Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Fees Summary</Text>
                    <View style={styles.feesGrid}>
                        <View style={styles.feeCard}>
                            <Text style={styles.feeLabel}>Total Fees</Text>
                            <Text style={styles.feeValue}>₹{calculateTotalFees()}</Text>
                        </View>
                        <View style={styles.feeCard}>
                            <Text style={styles.feeLabel}>Paid</Text>
                            <Text style={[styles.feeValue, styles.feeValuePaid]}>₹{calculatePaidFees()}</Text>
                        </View>
                        <View style={styles.feeCard}>
                            <Text style={styles.feeLabel}>Pending</Text>
                            <Text style={[styles.feeValue, styles.feeValuePending]}>₹{calculatePendingFees()}</Text>
                        </View>
                    </View>
                </View>

                {/* Academic Performance */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Academic Performance</Text>
                    <View style={styles.performanceGrid}>
                        <View style={styles.performanceCard}>
                            <Text style={styles.performanceIcon}>📊</Text>
                            <Text style={styles.performanceValue}>{calculateAverageMarks()}</Text>
                            <Text style={styles.performanceLabel}>Average Marks</Text>
                        </View>
                        <View style={styles.performanceCard}>
                            <Text style={styles.performanceIcon}>📝</Text>
                            <Text style={styles.performanceValue}>{examResults.length}</Text>
                            <Text style={styles.performanceLabel}>Exams Taken</Text>
                        </View>
                    </View>
                </View>

                {/* Attendance */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Attendance</Text>
                    <View style={styles.attendanceCard}>
                        <View style={styles.attendanceRow}>
                            <Text style={styles.attendanceLabel}>Present:</Text>
                            <Text style={styles.attendanceValue}>{attendance.present} days</Text>
                        </View>
                        <View style={styles.attendanceRow}>
                            <Text style={styles.attendanceLabel}>Absent:</Text>
                            <Text style={[styles.attendanceValue, styles.attendanceAbsent]}>
                                {attendance.absent} days
                            </Text>
                        </View>
                        <View style={styles.attendanceRow}>
                            <Text style={styles.attendanceLabel}>Percentage:</Text>
                            <Text style={[styles.attendanceValue, styles.attendancePercentage]}>
                                {getAttendancePercentage()}%
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Recent Exam Results */}
                {examResults.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Exam Results</Text>
                        {examResults.slice(0, 5).map((result, index) => (
                            <View key={index} style={styles.resultCard}>
                                <View>
                                    <Text style={styles.resultSubject}>{result.subject?.name || 'N/A'}</Text>
                                    <Text style={styles.resultExam}>{result.examName}</Text>
                                </View>
                                <View style={styles.resultMarks}>
                                    <Text style={styles.resultScore}>
                                        {result.marksObtained}/{result.totalMarks}
                                    </Text>
                                    <Text style={styles.resultPercentage}>
                                        {((result.marksObtained / result.totalMarks) * 100).toFixed(1)}%
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
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
        padding: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        marginRight: 12,
    },
    backButtonText: {
        fontSize: 28,
        color: colors.primary,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 16,
        marginTop: 40,
    },
    content: {
        padding: 16,
    },
    profileSection: {
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 12,
    },
    profilePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    profilePlaceholderText: {
        fontSize: 40,
        color: colors.white,
        fontWeight: 'bold',
    },
    studentName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    studentEmail: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    registerNumber: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
    },
    section: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.lightGray,
    },
    infoLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 14,
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'right',
    },
    feesGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    feeCard: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    feeLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    feeValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    feeValuePaid: {
        color: colors.success,
    },
    feeValuePending: {
        color: colors.danger,
    },
    performanceGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    performanceCard: {
        alignItems: 'center',
        padding: 12,
    },
    performanceIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    performanceValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 4,
    },
    performanceLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    attendanceCard: {
        backgroundColor: colors.background,
        borderRadius: 8,
        padding: 12,
    },
    attendanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    attendanceLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    attendanceValue: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: 'bold',
    },
    attendanceAbsent: {
        color: colors.danger,
    },
    attendancePercentage: {
        color: colors.success,
    },
    resultCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    resultSubject: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    resultExam: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    resultMarks: {
        alignItems: 'flex-end',
    },
    resultScore: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
    },
    resultPercentage: {
        fontSize: 12,
        color: colors.textSecondary,
    },
});

export default StudentDetailsScreen;
