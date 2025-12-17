import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const Dropdown = ({ label, value, placeholder, items, onSelect, disabled = false }) => {
    const [visible, setVisible] = useState(false);

    const selectedItem = items.find(i => i._id === value);

    return (
        <View style={styles.dropdownWrapper}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
                style={[styles.dropdown, disabled && styles.dropdownDisabled]}
                onPress={() => !disabled && setVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.dropdownText, !selectedItem && styles.placeholderText]}>
                    {selectedItem ? selectedItem.name : placeholder}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={styles.dropdownModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        {items.length === 0 ? (
                            <Text style={styles.emptyListText}>No items available</Text>
                        ) : (
                            <FlatList
                                data={items}
                                keyExtractor={item => item._id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.dropdownItem,
                                            value === item._id && styles.dropdownItemSelected
                                        ]}
                                        onPress={() => {
                                            onSelect(item._id);
                                            setVisible(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.dropdownItemText,
                                            value === item._id && styles.dropdownItemTextSelected
                                        ]}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                style={styles.list}
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const SubjectStaffManagementScreen = ({ navigation }) => {
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [staffs, setstaffs] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedstaff, setSelectedstaff] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const [classesRes, subjectsRes, staffsRes] = await Promise.all([
                axios.get(`${API_URL}/classes`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/staffs`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setClasses(classesRes.data);
            setSubjects(subjectsRes.data);
            setstaffs(staffsRes.data);
            fetchAssignments();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch data');
        }
    };

    const fetchAssignments = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/classes`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Extract all subject-staff assignments from classes
            const allAssignments = [];
            response.data.forEach(cls => {
                if (cls.subjectstaffs && cls.subjectstaffs.length > 0) {
                    cls.subjectstaffs.forEach(st => {
                        allAssignments.push({
                            class: cls,
                            subject: st.subject,
                            staff: st.staff
                        });
                    });
                }
            });
            setAssignments(allAssignments);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAssign = async () => {
        if (!selectedSubject || !selectedClass || !selectedstaff) {
            Alert.alert('Error', 'Please select class, subject, and staff');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${API_URL}/classes/${selectedClass}/assign-subject-staff`, {
                subjectId: selectedSubject,
                staffId: selectedstaff
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Success', 'Subject staff assigned successfully');
            // Reset selections
            setSelectedSubject(null);
            setSelectedstaff(null);
            // Keep class selected for convenience

            fetchAssignments();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to assign staff');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAssignment = async (classId, subjectId) => {
        Alert.alert(
            'Confirm',
            'Remove this subject staff assignment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.delete(`${API_URL}/classes/${classId}/subject-staff/${subjectId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert('Success', 'Assignment removed');
                            fetchAssignments();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to remove assignment');
                        }
                    }
                }
            ]
        );
    };

    const renderAssignment = ({ item }) => (
        <View style={styles.assignmentCard}>
            <View style={styles.assignmentInfo}>
                <Text style={styles.assignmentClass}>{item.class.name}</Text>
                <Text style={styles.assignmentSubject}>📚 {item.subject?.name || 'N/A'}</Text>
                <Text style={styles.assignmentstaff}>👨‍🏫 {item.staff?.name || 'N/A'}</Text>
            </View>
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveAssignment(item.class._id, item.subject?._id)}
            >
                <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
        </View>
    );

    // Filter subjects based on selected class
    const getAvailableSubjects = () => {
        if (!selectedClass) return [];
        const cls = classes.find(c => c._id === selectedClass);
        return cls ? cls.subjects : [];
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Subject Staff Assignment</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.assignmentForm}>
                    <Text style={styles.sectionTitle}>Assign Subject Staff</Text>

                    {/* 1. Select Class */}
                    <Dropdown
                        label="1. Select Class"
                        value={selectedClass}
                        placeholder="Choose a Class"
                        items={classes}
                        onSelect={(id) => {
                            setSelectedClass(id);
                            setSelectedSubject(null); // Reset subject when class changes
                        }}
                    />

                    {/* 2. Select Subject */}
                    <Dropdown
                        label="2. Select Subject"
                        value={selectedSubject}
                        placeholder={selectedClass ? "Choose a Subject" : "Select Class First"}
                        items={getAvailableSubjects()}
                        onSelect={setSelectedSubject}
                        disabled={!selectedClass}
                    />

                    {/* 3. Select Staff */}
                    <Dropdown
                        label="3. Select Staff"
                        value={selectedstaff}
                        placeholder={selectedSubject ? "Choose Staff" : "Select Subject First"}
                        items={staffs}
                        onSelect={setSelectedstaff}
                        disabled={!selectedSubject}
                    />

                    <TouchableOpacity
                        style={[
                            styles.assignButton,
                            (loading || !selectedClass || !selectedSubject || !selectedstaff) && styles.assignButtonDisabled
                        ]}
                        onPress={handleAssign}
                        disabled={loading || !selectedClass || !selectedSubject || !selectedstaff}
                    >
                        <Text style={styles.assignButtonText}>
                            {loading ? 'Assigning...' : 'Assign Staff'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.assignmentsList}>
                    <Text style={styles.sectionTitle}>Current Assignments</Text>
                    {assignments.length === 0 ? (
                        <Text style={styles.emptyText}>No assignments yet</Text>
                    ) : (
                        <FlatList
                            data={assignments}
                            renderItem={renderAssignment}
                            keyExtractor={(item, index) => `${item.class._id}-${item.subject?._id}-${index}`}
                            scrollEnabled={false}
                        />
                    )}
                </View>
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
    content: {
        flex: 1,
        padding: 24,
    },
    assignmentForm: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 20,
        letterSpacing: -0.5,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textLight,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dropdownWrapper: {
        marginBottom: 16,
    },
    dropdown: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownDisabled: {
        opacity: 0.5,
        backgroundColor: colors.border + '40',
    },
    dropdownText: {
        fontSize: 16,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    placeholderText: {
        color: colors.textSecondary,
    },
    dropdownIcon: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    dropdownModal: {
        backgroundColor: colors.white,
        borderRadius: 16,
        maxHeight: '70%',
        padding: 16,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    closeButton: {
        fontSize: 20,
        color: colors.textSecondary,
        padding: 4,
    },
    list: {
        maxHeight: 400,
    },
    emptyListText: {
        textAlign: 'center',
        color: colors.textSecondary,
        padding: 20,
        fontStyle: 'italic',
    },
    dropdownItem: {
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.background,
        borderRadius: 8,
    },
    dropdownItemSelected: {
        backgroundColor: colors.primary + '10',
    },
    dropdownItemText: {
        fontSize: 16,
        color: colors.textPrimary,
    },
    dropdownItemTextSelected: {
        color: colors.primary,
        fontWeight: '600',
    },
    assignButton: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    assignButtonDisabled: {
        opacity: 0.6,
        backgroundColor: colors.textLight,
    },
    assignButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    assignmentsList: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 24,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 24,
    },
    assignmentCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    assignmentInfo: {
        flex: 1,
    },
    assignmentClass: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    assignmentSubject: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 4,
        fontWeight: '500',
    },
    assignmentstaff: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    removeButton: {
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.danger,
    },
    removeButtonText: {
        color: colors.danger,
        fontSize: 12,
        fontWeight: '700',
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 16,
        fontStyle: 'italic',
        marginTop: 20,
        fontWeight: '500',
    },
});

export default SubjectStaffManagementScreen;
