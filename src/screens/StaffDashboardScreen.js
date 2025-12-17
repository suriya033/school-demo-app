import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const StaffDashboardScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        classes: 0,
        students: 0,
        homework: 0,
    });
    const [activeTab, setActiveTab] = useState('classes');

    const [classDetails, setClassDetails] = useState(null);
    const [myClassStudentCount, setMyClassStudentCount] = useState(0);
    const [allClasses, setAllClasses] = useState([]);
    const [myStudents, setMyStudents] = useState([]);
    const [assignedHomework, setAssignedHomework] = useState([]);

    // Homework Modal State
    const [homeworkModalVisible, setHomeworkModalVisible] = useState(false);
    const [selectedClassForHomework, setSelectedClassForHomework] = useState(null);
    const [homeworkTitle, setHomeworkTitle] = useState('');
    const [homeworkDescription, setHomeworkDescription] = useState('');
    const [homeworkDueDate, setHomeworkDueDate] = useState('');
    const [homeworkSubject, setHomeworkSubject] = useState('');
    const [homeworkLoading, setHomeworkLoading] = useState(false);

    useEffect(() => {
        const getUser = async () => {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                const staffId = parsedUser.id || parsedUser._id;
                if (staffId) {
                    fetchStats(staffId);
                } else {
                    console.error("Staff ID not found in user data");
                }
            }
        };
        getUser();
    }, []);

    const fetchStats = async (staffId) => {
        try {
            const token = await AsyncStorage.getItem('token');

            // Fetch classes where staff is either class staff or subject staff
            const classesRes = await axios.get(`${API_URL}/classes?staffId=${staffId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const staffClasses = classesRes.data;
            setAllClasses(staffClasses);

            // Find class where staff is Class Teacher
            const myClass = staffClasses.find(c => {
                const classStaffId = c.classstaff?._id || c.classstaff;
                return classStaffId && classStaffId.toString() === staffId.toString();
            });

            let uniqueStudentIds = new Set();

            if (myClass) {
                setClassDetails(myClass);
                // Fetch students for this class (backend sorts alphabetically)
                const studentsRes = await axios.get(`${API_URL}/students?classId=${myClass._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMyStudents(studentsRes.data);
                setMyClassStudentCount(studentsRes.data.length);

                studentsRes.data.forEach(s => uniqueStudentIds.add(s._id));
            }

            // Calculate total unique students across all staff's classes (for stats)
            for (const classItem of staffClasses) {
                if (classItem._id !== myClass?._id) {
                    const studentsRes = await axios.get(`${API_URL}/students?classId=${classItem._id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    studentsRes.data.forEach(student => {
                        uniqueStudentIds.add(student._id);
                    });
                }
            }

            const homeworkRes = await axios.get(`${API_URL}/homework`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const myHomeworks = homeworkRes.data.filter(h => {
                const hwStaffId = h.staff?._id || h.staff;
                return hwStaffId && hwStaffId.toString() === staffId.toString();
            });
            setAssignedHomework(myHomeworks);

            setStats({
                classes: staffClasses.length,
                students: uniqueStudentIds.size,
                homework: myHomeworks.length,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        navigation.replace('Login');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const openHomeworkModal = (classItem, preSelectedSubjectId = '') => {
        setSelectedClassForHomework(classItem);
        setHomeworkModalVisible(true);
        setHomeworkTitle('');
        setHomeworkDescription('');
        setHomeworkDueDate('');
        setHomeworkSubject(preSelectedSubjectId || '');
    };

    const handleCreateHomework = async () => {
        if (!homeworkTitle || !homeworkDescription || !homeworkDueDate || !homeworkSubject) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setHomeworkLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const staffId = user.id || user._id;

            await axios.post(`${API_URL}/homework`, {
                title: homeworkTitle,
                description: homeworkDescription,
                classId: selectedClassForHomework._id,
                subjectId: homeworkSubject,
                staffId: staffId,
                dueDate: new Date(homeworkDueDate),
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Success', 'Homework created successfully');
            setHomeworkModalVisible(false);
            fetchStats(staffId); // Refresh stats
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to create homework');
        } finally {
            setHomeworkLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Staff Portal</Text>
                    {user && (
                        <View>
                            <Text style={styles.welcome}>Welcome, {user.name}</Text>
                            <Text style={styles.role}>Role: {user.role}</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('StaffProfile')}
                >
                    <Text style={styles.profileButtonText}>👤</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {classDetails && (
                    <TouchableOpacity
                        style={styles.classDetailsCard}
                        onPress={() => navigation.navigate('Timetable', { classId: classDetails._id })}
                        activeOpacity={0.7}
                    >
                        <View style={styles.classDetailsHeader}>
                            <Text style={styles.classDetailsTitle}>My Class</Text>
                            <View style={styles.classDetailsBadgeContainer}>
                                <Text style={styles.classDetailsBadge}>Class Teacher</Text>
                            </View>
                        </View>
                        <Text style={styles.className}>{classDetails.name}</Text>
                        <View style={styles.classInfoRow}>
                            <Text style={styles.classInfo}>Grade: {classDetails.grade}</Text>
                            <Text style={styles.classInfoSeparator}>|</Text>
                            <Text style={styles.classInfo}>Section: {classDetails.section}</Text>
                        </View>
                        <Text style={styles.classInfo}>Total Students: {myClassStudentCount}</Text>
                        <Text style={styles.tapToViewTimetable}>Tap to view timetable</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.statsContainer}>
                    <TouchableOpacity
                        style={[styles.statCard, activeTab === 'classes' && styles.activeStatCard]}
                        onPress={() => setActiveTab('classes')}
                    >
                        <Text style={styles.statIcon}>🏫</Text>
                        <Text style={[styles.statValue, activeTab === 'classes' && styles.activeStatText]}>{stats.classes}</Text>
                        <Text style={[styles.statLabel, activeTab === 'classes' && styles.activeStatText]}>Classes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.statCard, activeTab === 'students' && styles.activeStatCard]}
                        onPress={() => setActiveTab('students')}
                    >
                        <Text style={styles.statIcon}>👨‍🎓</Text>
                        <Text style={[styles.statValue, activeTab === 'students' && styles.activeStatText]}>{stats.students}</Text>
                        <Text style={[styles.statLabel, activeTab === 'students' && styles.activeStatText]}>Students</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.statCard, activeTab === 'homework' && styles.activeStatCard]}
                        onPress={() => setActiveTab('homework')}
                    >
                        <Text style={styles.statIcon}>📝</Text>
                        <Text style={[styles.statValue, activeTab === 'homework' && styles.activeStatText]}>{stats.homework}</Text>
                        <Text style={[styles.statLabel, activeTab === 'homework' && styles.activeStatText]}>Homework</Text>
                    </TouchableOpacity>
                </View>

                {/* Classes Section */}
                {activeTab === 'classes' && (
                    <>
                        <Text style={styles.sectionTitle}>My Classes</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {allClasses.map((item) => {
                                const userId = user?.id || user?._id;
                                const classStaffId = item.classstaff?._id || item.classstaff;
                                const isClassTeacher = classStaffId && userId && classStaffId.toString() === userId.toString();

                                const subjectStaffEntry = item.subjectstaffs?.find(s => {
                                    const staffId = s.staff?._id || s.staff;
                                    return staffId && userId && staffId.toString() === userId.toString();
                                });
                                const subjectName = subjectStaffEntry?.subject?.name || 'Subject Teacher';

                                return (
                                    <View key={item._id} style={[styles.classCard, isClassTeacher ? styles.classTeacherCard : styles.subjectTeacherCard]}>
                                        <Text style={styles.classCardTitle}>{item.name}</Text>
                                        <Text style={styles.classCardSubtitle}>{item.grade} - {item.section}</Text>
                                        <View style={[styles.roleBadge, isClassTeacher ? styles.classTeacherBadge : styles.subjectTeacherBadge]}>
                                            <Text style={[styles.roleBadgeText, isClassTeacher ? styles.classTeacherText : styles.subjectTeacherText]}>
                                                {isClassTeacher ? 'Class Teacher' : subjectName}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.addHomeworkBtn}
                                            onPress={() => openHomeworkModal(item)}
                                        >
                                            <Text style={styles.addHomeworkBtnText}>+ Add Homework</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                            {allClasses.length === 0 && <Text style={styles.emptyText}>No classes assigned.</Text>}
                        </ScrollView>

                        {/* Subjects Teaching Section */}
                        <Text style={styles.sectionTitle}>Subjects I Teach</Text>
                        <View style={styles.subjectsGrid}>
                            {(() => {
                                const userId = user?.id || user?._id;
                                const subjectsMap = new Map();

                                allClasses.forEach(classItem => {
                                    classItem.subjectstaffs?.forEach(ss => {
                                        const staffId = ss.staff?._id || ss.staff;
                                        if (staffId && userId && staffId.toString() === userId.toString()) {
                                            const subjectName = ss.subject?.name || 'Unknown Subject';
                                            const subjectId = ss.subject?._id;

                                            if (subjectId) {
                                                if (!subjectsMap.has(subjectId)) {
                                                    subjectsMap.set(subjectId, {
                                                        name: subjectName,
                                                        classes: []
                                                    });
                                                }
                                                subjectsMap.get(subjectId).classes.push(classItem);
                                            }
                                        }
                                    });
                                });

                                if (subjectsMap.size === 0) {
                                    return <Text style={styles.emptyText}>No subjects assigned as subject teacher.</Text>;
                                }

                                return Array.from(subjectsMap.entries()).map(([subjectId, data]) => (
                                    <View key={subjectId} style={styles.subjectCard}>
                                        <View style={styles.subjectHeader}>
                                            <Text style={styles.subjectIcon}>📚</Text>
                                            <Text style={styles.subjectName}>{data.name}</Text>
                                        </View>
                                        <Text style={styles.subjectClassCount}>{data.classes.length} {data.classes.length === 1 ? 'Class' : 'Classes'}</Text>
                                        <View style={styles.subjectClassesList}>
                                            {data.classes.map((cls, idx) => (
                                                <View key={idx} style={styles.subjectClassRow}>
                                                    <Text style={styles.subjectClassItem}>• {cls.name}</Text>
                                                    <TouchableOpacity
                                                        style={styles.addHwSmallBtn}
                                                        onPress={() => openHomeworkModal(cls, subjectId)}
                                                    >
                                                        <Text style={styles.addHwSmallText}>+ HW</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                ));
                            })()}
                        </View>
                    </>
                )}

                {/* Students Section (Only for Class Teacher) */}
                {activeTab === 'students' && (
                    <>
                        <Text style={styles.sectionTitle}>My Students {classDetails ? `(${classDetails.name})` : ''}</Text>
                        {classDetails ? (
                            <View style={styles.listContainer}>
                                {myStudents.map((student, index) => (
                                    <TouchableOpacity
                                        key={student._id}
                                        style={styles.studentItem}
                                        onPress={() => navigation.navigate('StudentDetails', { studentId: student._id })}
                                    >
                                        <View style={styles.studentAvatar}>
                                            <Text style={styles.studentAvatarText}>{student.name.charAt(0)}</Text>
                                        </View>
                                        <View style={styles.studentInfo}>
                                            <Text style={styles.studentName}>{student.name}</Text>
                                            <Text style={styles.studentReg}>Reg: {student.registerNumber || 'N/A'}</Text>
                                            {student.parentId && (
                                                <Text style={styles.studentParent}>Parent: {student.parentId.name}</Text>
                                            )}
                                        </View>
                                        <View style={styles.viewProfileBtn}>
                                            <Text style={styles.viewProfileText}>View</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                                {myStudents.length === 0 && <Text style={styles.emptyText}>No students in this class.</Text>}
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>You are not assigned as a Class Teacher to any class.</Text>
                        )}
                    </>
                )}

                {/* Homework Section */}
                {activeTab === 'homework' && (
                    <>
                        <Text style={styles.sectionTitle}>Assigned Homework</Text>
                        <View style={styles.listContainer}>
                            {assignedHomework.map((hw) => (
                                <View key={hw._id} style={styles.homeworkItem}>
                                    <View style={styles.homeworkHeader}>
                                        <Text style={styles.homeworkTitle}>{hw.title}</Text>
                                        <Text style={styles.homeworkDate}>Due: {formatDate(hw.dueDate)}</Text>
                                    </View>
                                    <Text style={styles.homeworkClass}>
                                        {hw.class?.name} ({hw.class?.grade}-{hw.class?.section}) - {hw.subject?.name}
                                    </Text>
                                </View>
                            ))}
                            {assignedHomework.length === 0 && <Text style={styles.emptyText}>No homework assigned yet.</Text>}
                        </View>
                    </>
                )}

                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.menuGrid}>
                    {classDetails && (
                        <>
                            <TouchableOpacity
                                style={styles.menuCard}
                                onPress={() => navigation.navigate('Attendance')}
                            >
                                <Text style={styles.menuIcon}>📋</Text>
                                <Text style={styles.menuTitle}>Attendance</Text>
                                <Text style={styles.menuDescription}>Mark daily</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuCard}
                                onPress={() => navigation.navigate('UploadTimetable')}
                            >
                                <Text style={styles.menuIcon}>📅</Text>
                                <Text style={styles.menuTitle}>Timetable</Text>
                                <Text style={styles.menuDescription}>Manage schedule</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuCard}
                                onPress={() => navigation.navigate('UploadExamMarks')}
                            >
                                <Text style={styles.menuIcon}>📊</Text>
                                <Text style={styles.menuTitle}>Exam Marks</Text>
                                <Text style={styles.menuDescription}>Upload results</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.menuCard}
                                onPress={() => navigation.navigate('SubjectAssignment')}
                            >
                                <Text style={styles.menuIcon}>👥</Text>
                                <Text style={styles.menuTitle}>Subject Assignment</Text>
                                <Text style={styles.menuDescription}>Assign teachers</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.menuCard}
                        onPress={() => navigation.navigate('Homework')}
                    >
                        <Text style={styles.menuIcon}>📝</Text>
                        <Text style={styles.menuTitle}>Homework</Text>
                        <Text style={styles.menuDescription}>Assign tasks</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuCard}
                        onPress={() => navigation.navigate('Timetable', { viewType: 'staff' })}
                    >
                        <Text style={styles.menuIcon}>📅</Text>
                        <Text style={styles.menuTitle}>My Timetable</Text>
                        <Text style={styles.menuDescription}>Teaching schedule</Text>
                    </TouchableOpacity>



                    <TouchableOpacity
                        style={styles.menuCard}
                        onPress={() => navigation.navigate('Notices')}
                    >
                        <Text style={styles.menuIcon}>📢</Text>
                        <Text style={styles.menuTitle}>Notices</Text>
                        <Text style={styles.menuDescription}>School notices</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuCard}
                        onPress={() => navigation.navigate('ClassMessages')}
                    >
                        <Text style={styles.menuIcon}>💬</Text>
                        <Text style={styles.menuTitle}>Messages</Text>
                        <Text style={styles.menuDescription}>Class chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuCard}
                        onPress={() => navigation.navigate('Announcements')}
                    >
                        <Text style={styles.menuIcon}>📣</Text>
                        <Text style={styles.menuTitle}>Announcements</Text>
                        <Text style={styles.menuDescription}>View & Send</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Add Homework Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={homeworkModalVisible}
                onRequestClose={() => setHomeworkModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalTitle}>Add Homework</Text>
                            <Text style={styles.modalSubtitle}>For {selectedClassForHomework?.name}</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Title"
                                placeholderTextColor={colors.textSecondary}
                                value={homeworkTitle}
                                onChangeText={setHomeworkTitle}
                            />

                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Description"
                                placeholderTextColor={colors.textSecondary}
                                value={homeworkDescription}
                                onChangeText={setHomeworkDescription}
                                multiline
                                numberOfLines={4}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Due Date (DD-MM-YYYY)"
                                placeholderTextColor={colors.textSecondary}
                                value={homeworkDueDate}
                                onChangeText={setHomeworkDueDate}
                            />

                            <Text style={styles.label}>Select Subject</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.picker}>
                                {selectedClassForHomework?.subjects?.map((subject) => (
                                    <TouchableOpacity
                                        key={subject._id}
                                        style={[
                                            styles.pickerOption,
                                            (homeworkSubject == subject._id) && styles.pickerOptionSelected
                                        ]}
                                        onPress={() => setHomeworkSubject(subject._id)}
                                    >
                                        <Text style={[
                                            styles.pickerOptionText,
                                            (homeworkSubject == subject._id) && styles.pickerOptionTextSelected
                                        ]}>
                                            {subject.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setHomeworkModalVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.createButton]}
                                    onPress={handleCreateHomework}
                                    disabled={homeworkLoading}
                                >
                                    <Text style={styles.createButtonText}>
                                        {homeworkLoading ? 'Creating...' : 'Create'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
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
    role: {
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
    classDetailsCard: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    classDetailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    classDetailsTitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    classDetailsBadgeContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    classDetailsBadge: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '600',
    },
    className: {
        color: colors.white,
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    classInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    classInfoSeparator: {
        color: 'rgba(255, 255, 255, 0.6)',
        marginHorizontal: 8,
    },
    classInfo: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 16,
        fontWeight: '500',
    },
    tapToViewTimetable: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 8,
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        width: '31%',
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    activeStatCard: {
        backgroundColor: colors.primary,
        transform: [{ scale: 1.05 }],
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
    activeStatText: {
        color: colors.white,
    },
    statLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 15,
        marginTop: 10,
    },
    horizontalScroll: {
        marginBottom: 20,
    },
    classCard: {
        width: 200,
        padding: 15,
        borderRadius: 12,
        marginRight: 15,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    classTeacherCard: {
        backgroundColor: colors.white,
        borderLeftWidth: 5,
        borderLeftColor: colors.primary,
    },
    subjectTeacherCard: {
        backgroundColor: colors.white,
        borderLeftWidth: 5,
        borderLeftColor: colors.secondary,
    },
    classCardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 5,
    },
    classCardSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 10,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    classTeacherBadge: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)', // Light green
    },
    subjectTeacherBadge: {
        backgroundColor: 'rgba(33, 150, 243, 0.1)', // Light blue
    },
    roleBadgeText: {
        fontSize: 13,
        fontWeight: '700',
    },
    classTeacherText: {
        color: colors.success,
    },
    subjectTeacherText: {
        color: colors.primary,
    },
    subjectsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    subjectCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        width: '48%',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: colors.accent,
    },
    subjectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    subjectIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    subjectName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        flex: 1,
    },
    subjectClassCount: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 8,
        fontWeight: '600',
    },
    subjectClassesList: {
        marginTop: 4,
    },
    subjectClassItem: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    emptyText: {
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginBottom: 10,
    },
    listContainer: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    studentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    studentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    studentAvatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    studentReg: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    studentParent: {
        fontSize: 12,
        color: colors.textSecondary,
        fontStyle: 'italic',
    },
    viewProfileBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    viewProfileText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '600',
    },
    homeworkItem: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    homeworkHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    homeworkTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    homeworkDate: {
        fontSize: 12,
        color: colors.danger,
    },
    homeworkClass: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 15,
    },
    menuCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        width: '47%',
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 15,
    },
    menuIcon: {
        fontSize: 32,
        marginBottom: 10,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
        textAlign: 'center',
    },
    menuDescription: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    logoutButton: {
        backgroundColor: colors.danger,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    logoutText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxHeight: '85%',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 5,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.lightGray,
        color: colors.textPrimary,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 8,
        marginTop: 4,
    },
    picker: {
        marginBottom: 16,
    },
    pickerOption: {
        backgroundColor: colors.background,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.lightGray,
    },
    pickerOptionSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    pickerOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    pickerOptionTextSelected: {
        color: colors.white,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: colors.lightGray,
        marginRight: 8,
    },
    cancelButtonText: {
        color: colors.textPrimary,
        fontWeight: 'bold',
    },
    createButton: {
        backgroundColor: colors.primary,
        marginLeft: 8,
    },
    createButtonText: {
        color: colors.white,
        fontWeight: 'bold',
    },
    addHomeworkBtn: {
        backgroundColor: colors.primary + '20', // Light primary
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    addHomeworkBtnText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    subjectClassRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    addHwSmallBtn: {
        backgroundColor: colors.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    addHwSmallText: {
        fontSize: 10,
        color: colors.primary,
        fontWeight: '700',
    },
});

export default StaffDashboardScreen;
