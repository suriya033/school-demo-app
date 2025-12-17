import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const AssignmentManagementScreen = ({ navigation }) => {
    const [staffs, setstaffs] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedstaff, setSelectedstaff] = useState(null);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [assignmentType, setAssignmentType] = useState(''); // 'subject' or 'classstaff'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');

            const [staffsRes, classesRes, subjectsRes] = await Promise.all([
                axios.get(`${API_URL}/assignments`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/classes`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/subjects`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setstaffs(staffsRes.data);
            setClasses(classesRes.data);
            setSubjects(subjectsRes.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch data');
        }
    };

    const handleOpenModal = (staff, type) => {
        setSelectedstaff(staff);
        setAssignmentType(type);
        setSelectedClass('');
        setSelectedSubject('');
        setModalVisible(true);
    };

    const handleAssignSubject = async () => {
        if (!selectedSubject || !selectedClass) {
            Alert.alert('Error', 'Please select both subject and class');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${API_URL}/assignments/subject`, {
                staffId: selectedstaff._id,
                subjectId: selectedSubject,
                classId: selectedClass
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Success', 'Subject assigned successfully');
            setModalVisible(false);
            fetchData();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to assign subject');
        }
    };

    const handleAssignClassstaff = async () => {
        if (!selectedClass) {
            Alert.alert('Error', 'Please select a class');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${API_URL}/assignments/class-staff`, {
                staffId: selectedstaff._id,
                classId: selectedClass
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Success', 'Class staff assigned successfully');
            setModalVisible(false);
            fetchData();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to assign class staff');
        }
    };

    const handleRemoveSubject = async (staffId, subjectId) => {
        Alert.alert(
            'Confirm Remove',
            'Are you sure you want to remove this subject?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.delete(`${API_URL}/assignments/subject`, {
                                headers: { Authorization: `Bearer ${token}` },
                                data: { staffId, subjectId }
                            });
                            Alert.alert('Success', 'Subject removed successfully');
                            fetchData();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to remove subject');
                        }
                    }
                }
            ]
        );
    };

    const renderstaffItem = ({ item }) => (
        <View style={styles.staffCard}>
            <View style={styles.staffHeader}>
                <Text style={styles.staffName}>{item.name}</Text>
                <Text style={styles.staffEmail}>{item.email}</Text>
            </View>

            {/* Class staff Assignment */}
            <View style={styles.assignmentSection}>
                <Text style={styles.sectionLabel}>Class staff:</Text>
                {item.staffClass ? (
                    <View style={styles.assignmentTag}>
                        <Text style={styles.assignmentText}>
                            {item.staffClass.name} ({item.staffClass.grade}-{item.staffClass.section})
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.noAssignment}>Not assigned</Text>
                )}
                <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => handleOpenModal(item, 'classstaff')}
                >
                    <Text style={styles.assignButtonText}>
                        {item.staffClass ? 'Change' : 'Assign'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Subject Assignments */}
            <View style={styles.assignmentSection}>
                <Text style={styles.sectionLabel}>Subjects:</Text>
                {item.staffSubjects && item.staffSubjects.length > 0 ? (
                    <View style={styles.subjectsContainer}>
                        {item.staffSubjects.map((subject) => (
                            <View key={subject._id} style={styles.subjectTag}>
                                <Text style={styles.subjectText}>{subject.name}</Text>
                                <TouchableOpacity
                                    onPress={() => handleRemoveSubject(item._id, subject._id)}
                                >
                                    <Text style={styles.removeIcon}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.noAssignment}>No subjects assigned</Text>
                )}
                <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => handleOpenModal(item, 'subject')}
                >
                    <Text style={styles.assignButtonText}>+ Add Subject</Text>
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
                    <Text style={styles.title}>Subject & Class Assignments</Text>
                </View>
            </View>

            <FlatList
                data={staffs}
                renderItem={renderstaffItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No staffs found</Text>
                }
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {assignmentType === 'classstaff'
                                ? 'Assign Class staff'
                                : 'Assign Subject'}
                        </Text>

                        {selectedstaff && (
                            <Text style={styles.staffInfo}>
                                staff: {selectedstaff.name}
                            </Text>
                        )}

                        {assignmentType === 'subject' && (
                            <>
                                <Text style={styles.label}>Select Subject</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalPicker}>
                                    {subjects.map((subject) => (
                                        <TouchableOpacity
                                            key={subject._id}
                                            style={[
                                                styles.pickerOption,
                                                selectedSubject === subject._id && styles.pickerOptionSelected
                                            ]}
                                            onPress={() => setSelectedSubject(subject._id)}
                                        >
                                            <Text style={[
                                                styles.pickerOptionText,
                                                selectedSubject === subject._id && styles.pickerOptionTextSelected
                                            ]}>
                                                {subject.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        )}

                        <Text style={styles.label}>Select Class</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalPicker}>
                            {classes.map((cls) => (
                                <TouchableOpacity
                                    key={cls._id}
                                    style={[
                                        styles.pickerOption,
                                        selectedClass === cls._id && styles.pickerOptionSelected
                                    ]}
                                    onPress={() => setSelectedClass(cls._id)}
                                >
                                    <Text style={[
                                        styles.pickerOptionText,
                                        selectedClass === cls._id && styles.pickerOptionTextSelected
                                    ]}>
                                        {cls.name} ({cls.grade}-{cls.section})
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.assignModalButton]}
                                onPress={assignmentType === 'classstaff' ? handleAssignClassstaff : handleAssignSubject}
                            >
                                <Text style={styles.assignModalButtonText}>Assign</Text>
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
        padding: 20,
        paddingBottom: 10,
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
    list: {
        padding: 20,
        paddingTop: 10,
    },
    staffCard: {
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
    staffHeader: {
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.lightGray,
        paddingBottom: 12,
    },
    staffName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    staffEmail: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },
    assignmentSection: {
        marginTop: 12,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    assignmentTag: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    assignmentText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '600',
    },
    noAssignment: {
        fontSize: 14,
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginBottom: 8,
    },
    subjectsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    subjectTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
    },
    subjectText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '600',
        marginRight: 6,
    },
    removeIcon: {
        color: colors.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    assignButton: {
        backgroundColor: colors.accent,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    assignButtonText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: 'bold',
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
        maxWidth: 500,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 16,
        textAlign: 'center',
    },
    staffInfo: {
        fontSize: 16,
        color: colors.textPrimary,
        marginBottom: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
    label: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
    },
    horizontalPicker: {
        marginBottom: 16,
    },
    pickerOption: {
        backgroundColor: colors.background,
        paddingHorizontal: 16,
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
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    pickerOptionTextSelected: {
        color: colors.white,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
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
        fontSize: 16,
    },
    assignModalButton: {
        backgroundColor: colors.primary,
        marginLeft: 8,
    },
    assignModalButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default AssignmentManagementScreen;
