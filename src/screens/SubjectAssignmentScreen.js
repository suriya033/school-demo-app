import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const SubjectAssignmentScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [classDetails, setClassDetails] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            const token = await AsyncStorage.getItem('token');
            const staffId = parsedUser.id || parsedUser._id;

            // Fetch staff's class
            const staffRes = await axios.get(`${API_URL}/staffs/${staffId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const myClass = staffRes.data.staffClass;
            if (!myClass) {
                Alert.alert('Error', 'You are not assigned as a class teacher');
                navigation.goBack();
                return;
            }

            setClassDetails(myClass);

            // Fetch all subjects
            const subjectsRes = await axios.get(`${API_URL}/subjects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubjects(subjectsRes.data);

            // Fetch all staff
            const staffsRes = await axios.get(`${API_URL}/staffs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaffList(staffsRes.data);

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const getAssignedStaff = (subjectId) => {
        const assignment = classDetails?.subjectstaffs?.find(
            ss => (ss.subject?._id || ss.subject) === subjectId
        );
        return assignment?.staff;
    };

    const handleAssignStaff = async () => {
        if (!selectedSubject || !selectedStaff) {
            Alert.alert('Error', 'Please select both subject and staff');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');

            // Update class with new subject-staff assignment
            const updatedSubjectStaffs = classDetails.subjectstaffs || [];

            // Remove existing assignment for this subject
            const filtered = updatedSubjectStaffs.filter(
                ss => (ss.subject?._id || ss.subject) !== selectedSubject._id
            );

            // Add new assignment
            filtered.push({
                subject: selectedSubject._id,
                staff: selectedStaff._id
            });

            await axios.put(
                `${API_URL}/classes/${classDetails._id}`,
                { subjectstaffs: filtered },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert('Success', 'Subject staff assigned successfully');
            setModalVisible(false);
            setSelectedSubject(null);
            setSelectedStaff(null);
            fetchData(); // Refresh data
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to assign staff');
        }
    };

    const renderSubjectItem = ({ item }) => {
        const assignedStaff = getAssignedStaff(item._id);

        return (
            <TouchableOpacity
                style={styles.subjectCard}
                onPress={() => {
                    setSelectedSubject(item);
                    setSelectedStaff(assignedStaff || null);
                    setModalVisible(true);
                }}
            >
                <View style={styles.subjectHeader}>
                    <Text style={styles.subjectIcon}>📚</Text>
                    <Text style={styles.subjectName}>{item.name}</Text>
                </View>
                <View style={styles.staffInfo}>
                    {assignedStaff ? (
                        <>
                            <Text style={styles.staffLabel}>Assigned to:</Text>
                            <Text style={styles.staffName}>👨‍🏫 {assignedStaff.name}</Text>
                        </>
                    ) : (
                        <Text style={styles.unassignedText}>Not assigned</Text>
                    )}
                </View>
                <Text style={styles.tapToEdit}>Tap to {assignedStaff ? 'change' : 'assign'}</Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>←</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.title}>Subject Assignment</Text>
                    {classDetails && (
                        <Text style={styles.subtitle}>{classDetails.name}</Text>
                    )}
                </View>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={subjects}
                renderItem={renderSubjectItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No subjects available</Text>
                }
            />

            {/* Assignment Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Assign Staff for {selectedSubject?.name}
                        </Text>

                        <ScrollView style={styles.staffList}>
                            {staffList.map((staff) => (
                                <TouchableOpacity
                                    key={staff._id}
                                    style={[
                                        styles.staffOption,
                                        selectedStaff?._id === staff._id && styles.staffOptionSelected
                                    ]}
                                    onPress={() => setSelectedStaff(staff)}
                                >
                                    <Text style={[
                                        styles.staffOptionText,
                                        selectedStaff?._id === staff._id && styles.staffOptionTextSelected
                                    ]}>
                                        {staff.name}
                                    </Text>
                                    <Text style={styles.staffEmail}>{staff.email}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setModalVisible(false);
                                    setSelectedSubject(null);
                                    setSelectedStaff(null);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.assignButton]}
                                onPress={handleAssignStaff}
                            >
                                <Text style={styles.assignButtonText}>Assign</Text>
                            </TouchableOpacity>
                        </View>
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
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        fontSize: 28,
        color: colors.primary,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
    },
    subjectCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    subjectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    subjectIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    subjectName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    staffInfo: {
        marginBottom: 8,
    },
    staffLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    staffName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    unassignedText: {
        fontSize: 14,
        color: colors.danger,
        fontStyle: 'italic',
    },
    tapToEdit: {
        fontSize: 12,
        color: colors.primary,
        fontStyle: 'italic',
        textAlign: 'right',
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 16,
        marginTop: 40,
    },
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
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 20,
        textAlign: 'center',
    },
    staffList: {
        maxHeight: 400,
        marginBottom: 20,
    },
    staffOption: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.lightGray,
    },
    staffOptionSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    staffOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    staffOptionTextSelected: {
        color: colors.white,
    },
    staffEmail: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    assignButton: {
        backgroundColor: colors.primary,
        marginLeft: 8,
    },
    assignButtonText: {
        color: colors.white,
        fontWeight: 'bold',
    },
});

export default SubjectAssignmentScreen;
