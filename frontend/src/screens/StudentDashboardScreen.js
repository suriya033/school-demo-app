import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const StudentDashboardScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [fees, setFees] = useState([]);
    const [homework, setHomework] = useState([]);
    const [notices, setNotices] = useState([]);
    const [noticeModalVisible, setNoticeModalVisible] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState(null);

    useEffect(() => {
        getUser();
    }, []);

    const getUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            fetchStudentData(parsedUser.id);
        }
    };

    const fetchStudentData = async (studentId) => {
        try {
            const token = await AsyncStorage.getItem('token');

            // Fetch student's fees
            const feesResponse = await axios.get(`${API_URL}/fees?studentId=${studentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFees(feesResponse.data);

            // Fetch notices for students
            const noticesResponse = await axios.get(`${API_URL}/notices?targetAudience=Student`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotices(noticesResponse.data);

            // Fetch homework (if student has a class)
            const classId = user?.studentClass?._id || user?.studentClass;
            const homeworkUrl = classId
                ? `${API_URL}/homework?classId=${classId}`
                : `${API_URL}/homework`;

            const homeworkResponse = await axios.get(homeworkUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHomework(homeworkResponse.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        navigation.replace('Login');
    };

    const pendingFees = fees.filter(f => f.status === 'Pending').length;

    const openNoticeModal = (notice) => {
        setSelectedNotice(notice);
        setNoticeModalVisible(true);
    };


    const getImageUrl = (path) => {
        if (!path) return null;
        // Normalize path separators
        const normalizedPath = path.replace(/\\/g, '/');
        // Remove '/api' from the end of API_URL to get the base URL
        const baseUrl = API_URL.replace('/api', '');
        // Ensure path doesn't start with slash to avoid double slashes if baseUrl ends with one
        const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;
        return `${baseUrl}/${cleanPath}`;
    };

    return (
        <ImageBackground
            source={require('../../assets/student_bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Student Portal</Text>
                        {user && (
                            <View>
                                <Text style={styles.welcome}>Welcome, {user.name}</Text>
                                <Text style={styles.email}>{user.email}</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate('StudentProfile')}
                    >
                        <Text style={styles.profileButtonText}>👤</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Stats Cards */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statIcon}>📚</Text>
                            <Text style={styles.statValue}>{homework.length}</Text>
                            <Text style={styles.statLabel}>Homework</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statIcon}>💰</Text>
                            <Text style={styles.statValue}>{pendingFees}</Text>
                            <Text style={styles.statLabel}>Pending Fees</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statIcon}>📢</Text>
                            <Text style={styles.statValue}>{notices.length}</Text>
                            <Text style={styles.statLabel}>Notices</Text>
                        </View>
                    </View>

                    {/* Quick Access Cards */}
                    <View style={styles.quickAccessSection}>
                        <Text style={styles.sectionTitle}>Quick Access</Text>
                        <View style={styles.quickAccessGrid}>
                            <TouchableOpacity
                                style={styles.quickAccessCard}
                                onPress={() => navigation.navigate('Timetable')}
                            >
                                <Text style={styles.quickAccessIcon}>📅</Text>
                                <Text style={styles.quickAccessTitle}>Timetable</Text>
                                <Text style={styles.quickAccessDesc}>View class schedule</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickAccessCard}
                                onPress={() => navigation.navigate('ExamResults')}
                            >
                                <Text style={styles.quickAccessIcon}>📊</Text>
                                <Text style={styles.quickAccessTitle}>Exam Results</Text>
                                <Text style={styles.quickAccessDesc}>Check your marks</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickAccessCard}
                                onPress={() => navigation.navigate('ClassMessages')}
                            >
                                <Text style={styles.quickAccessIcon}>💬</Text>
                                <Text style={styles.quickAccessTitle}>Class Messages</Text>
                                <Text style={styles.quickAccessDesc}>Chat with class</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickAccessCard}
                                onPress={() => navigation.navigate('StudentHomework')}
                            >
                                <Text style={styles.quickAccessIcon}>📚</Text>
                                <Text style={styles.quickAccessTitle}>Homework</Text>
                                <Text style={styles.quickAccessDesc}>View assignments</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickAccessCard}
                                onPress={() => navigation.navigate('StudentNotices')}
                            >
                                <Text style={styles.quickAccessIcon}>📢</Text>
                                <Text style={styles.quickAccessTitle}>Notices</Text>
                                <Text style={styles.quickAccessDesc}>School updates</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Pending Fees Section */}
                    {fees.filter(f => f.status === 'Pending').length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Pending Fees</Text>
                            {fees.filter(f => f.status === 'Pending').map((fee) => (
                                <View key={fee._id} style={styles.feeCard}>
                                    <View style={styles.feeInfo}>
                                        <Text style={styles.feeTitle}>{fee.title}</Text>
                                        <Text style={styles.feeAmount}>₹{fee.amount}</Text>
                                        <Text style={styles.feeDue}>
                                            Due: {new Date(fee.dueDate).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View style={styles.pendingBadge}>
                                        <Text style={styles.badgeText}>Pending</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Recent Homework */}
                    {homework.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Recent Homework</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('StudentHomework')}>
                                    <Text style={styles.viewAllText}>View All</Text>
                                </TouchableOpacity>
                            </View>
                            {homework.slice(0, 3).map((hw) => (
                                <View key={hw._id} style={styles.homeworkCard}>
                                    <Text style={styles.homeworkTitle}>{hw.title}</Text>
                                    <Text style={styles.homeworkDescription}>{hw.description}</Text>
                                    <Text style={styles.homeworkSubject}>📚 {hw.subject?.name}</Text>
                                    <Text style={styles.homeworkDue}>
                                        Due: {new Date(hw.dueDate).toLocaleDateString()}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Notices */}
                    {notices.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Latest Notices</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('StudentNotices')}>
                                    <Text style={styles.viewAllText}>View All</Text>
                                </TouchableOpacity>
                            </View>
                            {notices.slice(0, 3).map((notice) => (
                                <TouchableOpacity
                                    key={notice._id}
                                    style={styles.noticeCard}
                                    onPress={() => openNoticeModal(notice)}
                                >
                                    {notice.attachmentUrl && notice.attachmentType === 'image' && (
                                        <Image
                                            source={{ uri: getImageUrl(notice.attachmentUrl) }}
                                            style={styles.noticeThumbnail}
                                            resizeMode="cover"
                                        />
                                    )}
                                    <Text style={styles.noticeTitle}>{notice.title}</Text>
                                    <Text style={styles.noticeContent} numberOfLines={2}>{notice.content}</Text>
                                    <Text style={styles.noticeDate}>
                                        {new Date(notice.date).toLocaleDateString()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Notice Details Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={noticeModalVisible}
                    onRequestClose={() => setNoticeModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            {selectedNotice && (
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <Text style={styles.modalTitle}>{selectedNotice.title}</Text>
                                    <Text style={styles.modalDate}>
                                        {new Date(selectedNotice.date).toLocaleDateString()}
                                    </Text>
                                    {selectedNotice.attachmentUrl && selectedNotice.attachmentType === 'image' && (
                                        <Image
                                            source={{ uri: getImageUrl(selectedNotice.attachmentUrl) }}
                                            style={styles.modalImage}
                                            resizeMode="cover"
                                        />
                                    )}
                                    <Text style={styles.modalBody}>{selectedNotice.content}</Text>
                                </ScrollView>
                            )}
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setNoticeModalVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
        backgroundColor: 'rgba(245, 245, 245, 0.5)', // Semi-transparent overlay
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 10,
    },
    profileButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    profileButtonText: {
        fontSize: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 10,
    },
    welcome: {
        fontSize: 18,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    email: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        padding: 16,
        width: '31%',
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    statIcon: {
        fontSize: 30,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    quickAccessSection: {
        marginBottom: 20,
    },
    quickAccessGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    quickAccessCard: {
        width: '30%', // Adjusted for 3 columns or wrap
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 12,
    },
    quickAccessIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    quickAccessTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
        textAlign: 'center',
    },
    quickAccessDesc: {
        fontSize: 11,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
        textShadowColor: 'rgba(255, 255, 255, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    viewAllText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    feeCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    feeInfo: {
        flex: 1,
    },
    feeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    feeAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 4,
    },
    feeDue: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    pendingBadge: {
        backgroundColor: colors.accent,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    homeworkCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    homeworkTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    homeworkDescription: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    homeworkSubject: {
        fontSize: 12,
        color: colors.primary,
        marginBottom: 4,
    },
    homeworkDue: {
        fontSize: 12,
        color: colors.accent,
        fontWeight: '600',
    },
    noticeCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    noticeThumbnail: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 8,
    },
    noticeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    noticeContent: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 8,
        lineHeight: 20,
    },
    noticeDate: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    logoutButton: {
        backgroundColor: colors.danger,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
        shadowColor: colors.danger,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    logoutText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxHeight: '80%',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 8,
    },
    modalDate: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 16,
        fontStyle: 'italic',
    },
    modalImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: '#f0f0f0',
    },
    modalBody: {
        fontSize: 16,
        color: colors.textPrimary,
        lineHeight: 24,
        marginBottom: 20,
    },
    closeButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    closeButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default StudentDashboardScreen;
