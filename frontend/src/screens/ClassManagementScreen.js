import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const ClassManagementScreen = ({ navigation }) => {
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [staffs, setstaffs] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [classStudents, setClassStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('');
    const [section, setSection] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [subjectstaffs, setSubjectstaffs] = useState({}); // { subjectId: staffId }
    const [loading, setLoading] = useState(false);
    const [isAddingSubject, setIsAddingSubject] = useState(false);
    const [subjectToAdd, setSubjectToAdd] = useState(null);
    const [selectedClassStaff, setSelectedClassStaff] = useState(null);
    const [staffSearchQuery, setStaffSearchQuery] = useState('');

    // Filter staff based on search query
    const filteredStaffs = staffs.filter(staff => {
        const query = staffSearchQuery.toLowerCase();
        return (
            staff.name.toLowerCase().includes(query) ||
            staff.email.toLowerCase().includes(query) ||
            staff.registerNumber?.toLowerCase().includes(query)
        );
    });

    useEffect(() => {
        fetchClasses();
        fetchSubjects();
        fetchstaffs();
    }, []);

    const fetchClasses = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/classes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClasses(response.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch classes');
        }
    };

    const fetchSubjects = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/subjects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubjects(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchstaffs = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/staffs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setstaffs(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const toggleSubject = (subjectId) => {
        if (selectedSubjects.includes(subjectId)) {
            setSelectedSubjects(selectedSubjects.filter(id => id !== subjectId));
            // Remove staff assignment if subject is deselected
            const newSubjectstaffs = { ...subjectstaffs };
            delete newSubjectstaffs[subjectId];
            setSubjectstaffs(newSubjectstaffs);
        } else {
            setSelectedSubjects([...selectedSubjects, subjectId]);
        }
    };

    const assignstaffToSubject = (subjectId, staffId) => {
        setSubjectstaffs({
            ...subjectstaffs,
            [subjectId]: staffId,
        });
    };

    const handleCreateClass = async () => {
        if (!name || !grade || !section) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const formattedSubjectstaffs = Object.keys(subjectstaffs).map(subjectId => ({
                subject: subjectId,
                staff: subjectstaffs[subjectId]
            }));

            await axios.post(`${API_URL}/classes`, {
                name,
                grade,
                section,
                classstaff: selectedClassStaff,
                subjects: selectedSubjects,
                subjectstaffs: formattedSubjectstaffs,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Success', 'Class created successfully');
            setModalVisible(false);
            setName('');
            setGrade('');
            setSection('');
            setSelectedSubjects([]);
            setSelectedClassStaff(null);
            setSubjectstaffs({});
            fetchClasses();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to create class');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClass = async (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this class?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.delete(`${API_URL}/classes/${id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert('Success', 'Class deleted successfully');
                            fetchClasses();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to delete class');
                        }
                    }
                }
            ]
        );
    };

    const handleAssignClassStaff = async (staffId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.post(`${API_URL}/classes/${selectedClass._id}/assign-class-staff`, {
                staffId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedClass(response.data);
            fetchClasses(); // Refresh list
            Alert.alert('Success', 'Class staff assigned successfully');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to assign class staff');
        }
    };

    const handleClassClick = (classItem) => {
        setSelectedClass(classItem);
        setClassStudents(classItem.students || []);
        setIsAddingSubject(false);
        setSubjectToAdd(null);
        setDetailsModalVisible(true);
    };

    const handleAddSubjectToClass = async () => {
        if (!subjectToAdd) return;
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.post(`${API_URL}/classes/${selectedClass._id}/subjects`, {
                subjectId: subjectToAdd
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedClass(response.data);
            setIsAddingSubject(false);
            setSubjectToAdd(null);
            fetchClasses(); // Refresh list
            Alert.alert('Success', 'Subject added successfully');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to add subject');
        }
    };

    const handleRemoveSubjectFromClass = async (subjectId) => {
        Alert.alert(
            'Confirm Remove',
            'Are you sure you want to remove this subject from the class?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            const response = await axios.delete(`${API_URL}/classes/${selectedClass._id}/subjects/${subjectId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            setSelectedClass(response.data);
                            fetchClasses(); // Refresh list
                            Alert.alert('Success', 'Subject removed successfully');
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to remove subject');
                        }
                    }
                }
            ]
        );
    };

    const filteredClasses = classes.filter(cls =>
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.section.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderClassItem = ({ item }) => {
        const studentCount = item.students?.length || 0;

        return (
            <TouchableOpacity
                style={styles.classCard}
                onPress={() => handleClassClick(item)}
                activeOpacity={0.7}
            >
                <View style={styles.classInfo}>
                    <View style={styles.classHeader}>
                        <Text style={styles.className}>{item.name}</Text>
                        <View style={styles.studentBadge}>
                            <Text style={styles.studentCount}>👨‍🎓 {studentCount}</Text>
                        </View>
                    </View>
                    <Text style={styles.classDetails}>Grade: {item.grade} | Section: {item.section}</Text>
                    {item.classstaff && (
                        <Text style={styles.staff}>Class staff: {item.classstaff.name}</Text>
                    )}
                    {item.subjects && item.subjects.length > 0 && (
                        <View style={styles.subjectsContainer}>
                            <Text style={styles.subjectsLabel}>Subjects:</Text>
                            <View style={styles.subjectTags}>
                                {item.subjects.slice(0, 3).map((subject) => (
                                    <View key={subject._id} style={styles.subjectTag}>
                                        <Text style={styles.subjectTagText}>
                                            {subject.name}
                                        </Text>
                                    </View>
                                ))}
                                {item.subjects.length > 3 && (
                                    <View style={styles.subjectTag}>
                                        <Text style={styles.subjectTagText}>+{item.subjects.length - 3}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(item._id);
                    }}
                >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Class Management</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={styles.addButtonText}>+ Add Class</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search classes..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <Text style={styles.mainSearchIcon}>🔍</Text>
            </View>

            <FlatList
                data={filteredClasses}
                renderItem={renderClassItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {searchQuery ? 'No classes match your search' : 'No classes found. Add one to get started!'}
                    </Text>
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
                        <Text style={styles.modalTitle}>Create New Class</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Class Name (e.g., Class 10 A)"
                            placeholderTextColor={colors.textSecondary}
                            value={name}
                            onChangeText={setName}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Grade (e.g., 10)"
                            placeholderTextColor={colors.textSecondary}
                            value={grade}
                            onChangeText={setGrade}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Section (e.g., A)"
                            placeholderTextColor={colors.textSecondary}
                            value={section}
                            onChangeText={setSection}
                        />

                        <Text style={styles.label}>Assign Class Staff</Text>
                        <View style={styles.searchBarContainer}>
                            <Text style={styles.searchIcon}>🔍</Text>
                            <TextInput
                                style={styles.searchStaffInput}
                                placeholder="Search by name, email, or staff ID..."
                                placeholderTextColor={colors.textSecondary}
                                value={staffSearchQuery}
                                onChangeText={setStaffSearchQuery}
                            />
                            {staffSearchQuery.length > 0 && (
                                <TouchableOpacity
                                    style={styles.clearSearchButton}
                                    onPress={() => setStaffSearchQuery('')}
                                >
                                    <Text style={styles.clearSearchText}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.subjectsPickerContainer}>
                            <FlatList
                                data={filteredStaffs}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={item => item._id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.staffOption,
                                            selectedClassStaff === item._id && styles.staffOptionSelected
                                        ]}
                                        onPress={() => setSelectedClassStaff(item._id)}
                                    >
                                        <Text style={[
                                            styles.staffOptionText,
                                            selectedClassStaff === item._id && styles.staffOptionTextSelected
                                        ]}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <Text style={styles.noSubjectsText}>
                                        {staffSearchQuery ? 'No staff match your search' : 'No staff available'}
                                    </Text>
                                }
                            />
                        </View>

                        <Text style={styles.label}>Assign Subjects (Optional)</Text>
                        <View style={styles.subjectsPickerContainer}>
                            {subjects.length === 0 ? (
                                <Text style={styles.noSubjectsText}>No subjects available. Create subjects first.</Text>
                            ) : (
                                subjects.map((subject) => (
                                    <TouchableOpacity
                                        key={subject._id}
                                        style={[
                                            styles.subjectOption,
                                            selectedSubjects.includes(subject._id) && styles.subjectOptionSelected
                                        ]}
                                        onPress={() => toggleSubject(subject._id)}
                                    >
                                        <Text style={[
                                            styles.subjectOptionText,
                                            selectedSubjects.includes(subject._id) && styles.subjectOptionTextSelected
                                        ]}>
                                            {subject.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>

                        {selectedSubjects.length > 0 && (
                            <>
                                <Text style={styles.label}>Assign Subject staffs (Optional)</Text>
                                {selectedSubjects.map(subjectId => {
                                    const subject = subjects.find(s => s._id === subjectId);
                                    return (
                                        <View key={subjectId} style={styles.staffAssignmentRow}>
                                            <Text style={styles.staffAssignmentLabel}>{subject?.name}:</Text>
                                            <FlatList
                                                data={staffs}
                                                horizontal
                                                showsHorizontalScrollIndicator={false}
                                                keyExtractor={item => item._id}
                                                renderItem={({ item }) => (
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.staffOption,
                                                            subjectstaffs[subjectId] === item._id && styles.staffOptionSelected
                                                        ]}
                                                        onPress={() => assignstaffToSubject(subjectId, item._id)}
                                                    >
                                                        <Text style={[
                                                            styles.staffOptionText,
                                                            subjectstaffs[subjectId] === item._id && styles.staffOptionTextSelected
                                                        ]}>
                                                            {item.name}
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}
                                            />
                                        </View>
                                    );
                                })}
                            </>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.createButton]}
                                onPress={handleCreateClass}
                                disabled={loading}
                            >
                                <Text style={styles.createButtonText}>
                                    {loading ? 'Creating...' : 'Create'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={detailsModalVisible}
                onRequestClose={() => setDetailsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.detailsModalContent}>
                        <ScrollView>
                            <Text style={styles.modalTitle}>{selectedClass?.name}</Text>

                            <View style={styles.detailsSection}>
                                <Text style={styles.detailsLabel}>Grade:</Text>
                                <Text style={styles.detailsValue}>{selectedClass?.grade}</Text>
                            </View>

                            <View style={styles.detailsSection}>
                                <Text style={styles.detailsLabel}>Section:</Text>
                                <Text style={styles.detailsValue}>{selectedClass?.section}</Text>
                            </View>

                            <View style={styles.detailsSection}>
                                <Text style={styles.detailsLabel}>Class Staff:</Text>
                                <View style={styles.searchBarContainer}>
                                    <Text style={styles.searchIcon}>🔍</Text>
                                    <TextInput
                                        style={styles.searchStaffInput}
                                        placeholder="Search by name, email, or staff ID..."
                                        placeholderTextColor={colors.textSecondary}
                                        value={staffSearchQuery}
                                        onChangeText={setStaffSearchQuery}
                                    />
                                    {staffSearchQuery.length > 0 && (
                                        <TouchableOpacity
                                            style={styles.clearSearchButton}
                                            onPress={() => setStaffSearchQuery('')}
                                        >
                                            <Text style={styles.clearSearchText}>✕</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <View style={styles.staffPickerWrapper}>
                                    <FlatList
                                        data={filteredStaffs}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        keyExtractor={item => item._id}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={[
                                                    styles.staffOptionCard,
                                                    (selectedClass?.classstaff?._id === item._id || selectedClass?.classstaff === item._id) && styles.staffOptionCardSelected
                                                ]}
                                                onPress={() => handleAssignClassStaff(item._id)}
                                            >
                                                <View style={styles.staffOptionContent}>
                                                    <View style={[
                                                        styles.staffAvatar,
                                                        (selectedClass?.classstaff?._id === item._id || selectedClass?.classstaff === item._id) && styles.staffAvatarSelected
                                                    ]}>
                                                        <Text style={[
                                                            styles.staffAvatarText,
                                                            (selectedClass?.classstaff?._id === item._id || selectedClass?.classstaff === item._id) && styles.staffAvatarTextSelected
                                                        ]}>
                                                            {item.name.charAt(0).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                    <Text style={[
                                                        styles.staffOptionName,
                                                        (selectedClass?.classstaff?._id === item._id || selectedClass?.classstaff === item._id) && styles.staffOptionNameSelected
                                                    ]}>
                                                        {item.name}
                                                    </Text>
                                                    {item.registerNumber && (
                                                        <Text style={styles.staffRegNumber}>ID: {item.registerNumber}</Text>
                                                    )}
                                                    {(selectedClass?.classstaff?._id === item._id || selectedClass?.classstaff === item._id) && (
                                                        <View style={styles.selectedBadge}>
                                                            <Text style={styles.selectedBadgeText}>✓</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        )}
                                        ListEmptyComponent={
                                            <Text style={styles.noStaffText}>
                                                {staffSearchQuery ? 'No staff match your search' : 'No staff available'}
                                            </Text>
                                        }
                                    />
                                </View>
                            </View>

                            <View style={styles.detailsSection}>
                                <Text style={styles.detailsLabel}>Total Students:</Text>
                                <Text style={styles.detailsValue}>{classStudents.length}</Text>
                            </View>

                            <View style={styles.sectionHeader}>
                                <Text style={styles.studentsTitle}>Subjects</Text>
                                <TouchableOpacity
                                    style={styles.addSmallButton}
                                    onPress={() => setIsAddingSubject(!isAddingSubject)}
                                >
                                    <Text style={styles.addSmallButtonText}>
                                        {isAddingSubject ? 'Cancel' : '+ Add'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {isAddingSubject && (
                                <View style={styles.addSubjectContainer}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectsPicker}>
                                        {subjects
                                            .filter(s => !selectedClass.subjects.some(existing => existing._id === s._id))
                                            .map((subject) => (
                                                <TouchableOpacity
                                                    key={subject._id}
                                                    style={[
                                                        styles.subjectOption,
                                                        subjectToAdd === subject._id && styles.subjectOptionSelected
                                                    ]}
                                                    onPress={() => setSubjectToAdd(subject._id)}
                                                >
                                                    <Text style={[
                                                        styles.subjectOptionText,
                                                        subjectToAdd === subject._id && styles.subjectOptionTextSelected
                                                    ]}>
                                                        {subject.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                    </ScrollView>
                                    <TouchableOpacity
                                        style={[styles.confirmAddButton, !subjectToAdd && styles.disabledButton]}
                                        onPress={handleAddSubjectToClass}
                                        disabled={!subjectToAdd}
                                    >
                                        <Text style={styles.confirmAddButtonText}>Add Selected Subject</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={styles.subjectsList}>
                                {selectedClass?.subjects?.map((subject) => (
                                    <View key={subject._id} style={styles.subjectItem}>
                                        <Text style={styles.subjectItemName}>{subject.name} ({subject.code})</Text>
                                        <TouchableOpacity
                                            onPress={() => handleRemoveSubjectFromClass(subject._id)}
                                            style={styles.removeSubjectButton}
                                        >
                                            <Text style={styles.removeSubjectText}>Remove</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {(!selectedClass?.subjects || selectedClass.subjects.length === 0) && (
                                    <Text style={styles.noDataText}>No subjects assigned</Text>
                                )}
                            </View>

                            <Text style={styles.studentsTitle}>Students List</Text>


                            {classStudents.length === 0 ? (
                                <Text style={styles.noStudentsText}>No students enrolled in this class</Text>
                            ) : (
                                classStudents.map((student, index) => (
                                    <View key={student._id} style={styles.studentItem}>
                                        <View style={styles.studentNumber}>
                                            <Text style={styles.studentNumberText}>{index + 1}</Text>
                                        </View>
                                        <View style={styles.studentInfo}>
                                            <Text style={styles.studentName}>{student.name}</Text>
                                            <Text style={styles.studentRegister}>Reg: {student.registerNumber || 'N/A'}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setDetailsModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View >
            </Modal >
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
        padding: 24,
        paddingBottom: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    addButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 14,
    },
    list: {
        padding: 24,
        paddingTop: 16,
    },
    classCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    classInfo: {
        flex: 1,
    },
    className: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 6,
    },
    classDetails: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 4,
        fontWeight: '500',
    },
    staff: {
        fontSize: 13,
        color: colors.primary,
        marginTop: 6,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: colors.background,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.danger,
    },
    deleteButtonText: {
        color: colors.danger,
        fontWeight: '600',
        fontSize: 12,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 16,
        marginTop: 40,
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 32,
        width: '90%',
        maxWidth: 450,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 24,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.textPrimary,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        gap: 16,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cancelButtonText: {
        color: colors.textSecondary,
        fontWeight: '700',
        fontSize: 16,
    },
    createButton: {
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 16,
    },
    subjectsContainer: {
        marginTop: 12,
    },
    subjectsLabel: {
        fontSize: 12,
        color: colors.textLight,
        marginBottom: 8,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    subjectTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    subjectTag: {
        backgroundColor: colors.background,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    subjectTagText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    label: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '700',
        marginBottom: 12,
        marginTop: 8,
    },
    subjectsPickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        gap: 8,
    },
    subjectOption: {
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    subjectOptionSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    subjectOptionText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    subjectOptionTextSelected: {
        color: colors.white,
    },
    noSubjectsText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontStyle: 'italic',
    },
    staffAssignmentRow: {
        marginBottom: 16,
    },
    staffAssignmentLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    staffOption: {
        backgroundColor: colors.white,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    staffOptionSelected: {
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
    },
    staffOptionText: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: '500',
    },
    staffOptionTextSelected: {
        color: colors.white,
        fontWeight: '700',
    },
    searchContainer: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        position: 'relative',
    },
    searchInput: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        paddingRight: 48,
        fontSize: 16,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    mainSearchIcon: {
        position: 'absolute',
        right: 40,
        top: 16,
        fontSize: 20,
        opacity: 0.5,
    },
    classHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    studentBadge: {
        backgroundColor: colors.success + '20', // 20% opacity
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    studentCount: {
        color: colors.success,
        fontSize: 12,
        fontWeight: '700',
    },
    detailsModalContent: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 32,
        width: '90%',
        maxHeight: '85%',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
    },
    detailsSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginBottom: 8,
    },
    detailsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    detailsValue: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    studentsTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        marginTop: 24,
        marginBottom: 16,
    },
    studentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    studentNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    studentNumberText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 14,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    studentRegister: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    closeButton: {
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        borderWidth: 1,
        borderColor: colors.border,
    },
    closeButtonText: {
        color: colors.textPrimary,
        fontWeight: '700',
        fontSize: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 12,
    },
    addSmallButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: colors.secondary,
        borderRadius: 8,
    },
    addSmallButtonText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '600',
    },
    addSubjectContainer: {
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    subjectsPicker: {
        marginBottom: 12,
    },
    confirmAddButton: {
        backgroundColor: colors.primary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    confirmAddButtonText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 14,
    },
    subjectsList: {
        marginBottom: 8,
    },
    subjectItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    subjectItemName: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    removeSubjectButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: colors.danger + '20',
        borderRadius: 6,
    },
    removeSubjectText: {
        color: colors.danger,
        fontSize: 12,
        fontWeight: '600',
    },
    noDataText: {
        color: colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 8,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 12,
        marginTop: 8,
        borderWidth: 2,
        borderColor: colors.border,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 8,
        color: colors.textLight,
    },
    searchStaffInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    clearSearchButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.textLight + '30',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    clearSearchText: {
        color: colors.textLight,
        fontSize: 14,
        fontWeight: '700',
    },
    staffPickerWrapper: {
        marginTop: 8,
    },
    staffOptionCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 8,
        marginRight: 10,
        minWidth: 80,
        maxWidth: 90,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.border,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    staffOptionCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '10',
        shadowColor: colors.primary,
        shadowOpacity: 0.2,
        elevation: 4,
    },
    staffOptionContent: {
        alignItems: 'center',
        position: 'relative',
    },
    staffAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        borderWidth: 2,
        borderColor: colors.border,
    },
    staffAvatarSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    staffAvatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    staffAvatarTextSelected: {
        color: colors.white,
    },
    staffOptionName: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'center',
        lineHeight: 14,
    },
    staffOptionNameSelected: {
        color: colors.primary,
        fontWeight: '700',
    },
    staffRegNumber: {
        fontSize: 9,
        color: colors.textLight,
        marginTop: 2,
        textAlign: 'center',
        fontWeight: '500',
    },
    selectedBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: colors.success,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.white,
    },
    selectedBadgeText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: '700',
    },
    noStaffText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 20,
    },
});

export default ClassManagementScreen;
