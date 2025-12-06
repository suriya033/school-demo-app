import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const SubjectManagementScreen = ({ navigation }) => {
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [isAddingClass, setIsAddingClass] = useState(false);
    const [classToAdd, setClassToAdd] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter subjects based on search query
    const filteredSubjects = subjects.filter(subject => {
        const query = searchQuery.toLowerCase();
        return (
            subject.name.toLowerCase().includes(query) ||
            subject.code.toLowerCase().includes(query)
        );
    });

    useEffect(() => {
        fetchSubjects();
        fetchClasses();
    }, []);

    const fetchSubjects = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/subjects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubjects(response.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch subjects');
        }
    };

    const fetchClasses = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/classes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClasses(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const toggleClass = (classId) => {
        if (selectedClasses.includes(classId)) {
            setSelectedClasses(selectedClasses.filter(id => id !== classId));
        } else {
            setSelectedClasses([...selectedClasses, classId]);
        }
    };

    const handleCreateSubject = async () => {
        if (!name || !code) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${API_URL}/subjects`, {
                name,
                code,
                classes: selectedClasses,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Success', 'Subject created successfully');
            setModalVisible(false);
            setName('');
            setCode('');
            setSelectedClasses([]);
            fetchSubjects();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to create subject');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSubject = async (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this subject?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.delete(`${API_URL}/subjects/${id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert('Success', 'Subject deleted successfully');
                            fetchSubjects();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to delete subject');
                        }
                    }
                }
            ]
        );
    };

    const handleSubjectClick = (subject) => {
        setSelectedSubject(subject);
        setIsAddingClass(false);
        setClassToAdd(null);
        setDetailsModalVisible(true);
    };

    const handleAddClassToSubject = async () => {
        if (!classToAdd) return;
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.post(`${API_URL}/subjects/${selectedSubject._id}/classes`, {
                classId: classToAdd
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedSubject(response.data);
            setIsAddingClass(false);
            setClassToAdd(null);
            fetchSubjects(); // Refresh list
            Alert.alert('Success', 'Class added successfully');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to add class');
        }
    };

    const handleRemoveClassFromSubject = async (classId) => {
        Alert.alert(
            'Confirm Remove',
            'Are you sure you want to remove this class from the subject?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            const response = await axios.delete(`${API_URL}/subjects/${selectedSubject._id}/classes/${classId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            setSelectedSubject(response.data);
                            fetchSubjects(); // Refresh list
                            Alert.alert('Success', 'Class removed successfully');
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to remove class');
                        }
                    }
                }
            ]
        );
    };

    const renderSubjectItem = ({ item }) => (
        <TouchableOpacity
            style={styles.subjectCard}
            onPress={() => handleSubjectClick(item)}
            activeOpacity={0.7}
        >
            <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{item.name}</Text>
                <Text style={styles.subjectCode}>Code: {item.code}</Text>
                {item.classes && item.classes.length > 0 && (
                    <View style={styles.classesContainer}>
                        <Text style={styles.classesLabel}>Classes:</Text>
                        <View style={styles.classTags}>
                            {item.classes.slice(0, 3).map((classItem) => (
                                <View key={classItem._id} style={styles.classTag}>
                                    <Text style={styles.classTagText}>{classItem.name}</Text>
                                </View>
                            ))}
                            {item.classes.length > 3 && (
                                <View style={styles.classTag}>
                                    <Text style={styles.classTagText}>+{item.classes.length - 3}</Text>
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
                    handleDeleteSubject(item._id);
                }}
            >
                <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Subject Management</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={styles.addButtonText}>+ Add Subject</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search subjects by name or code..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setSearchQuery('')}
                    >
                        <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={filteredSubjects}
                renderItem={renderSubjectItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {searchQuery ? 'No subjects match your search' : 'No subjects found. Add one to get started!'}
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
                        <Text style={styles.modalTitle}>Create New Subject</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Subject Name (e.g., Mathematics)"
                            placeholderTextColor={colors.textSecondary}
                            value={name}
                            onChangeText={setName}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Subject Code (e.g., MATH101)"
                            placeholderTextColor={colors.textSecondary}
                            value={code}
                            onChangeText={setCode}
                        />

                        <Text style={styles.label}>Assign to Classes (Optional)</Text>
                        <View style={styles.classesPickerContainer}>
                            {classes.length === 0 ? (
                                <Text style={styles.noClassesText}>No classes available. Create classes first.</Text>
                            ) : (
                                classes.map((classItem) => (
                                    <TouchableOpacity
                                        key={classItem._id}
                                        style={[
                                            styles.classOption,
                                            selectedClasses.includes(classItem._id) && styles.classOptionSelected
                                        ]}
                                        onPress={() => toggleClass(classItem._id)}
                                    >
                                        <Text style={[
                                            styles.classOptionText,
                                            selectedClasses.includes(classItem._id) && styles.classOptionTextSelected
                                        ]}>
                                            {classItem.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.createButton]}
                                onPress={handleCreateSubject}
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
                        <Text style={styles.modalTitle}>{selectedSubject?.name}</Text>
                        <Text style={styles.modalSubtitle}>Code: {selectedSubject?.code}</Text>

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Assigned Classes</Text>
                            <TouchableOpacity
                                style={styles.addSmallButton}
                                onPress={() => setIsAddingClass(!isAddingClass)}
                            >
                                <Text style={styles.addSmallButtonText}>
                                    {isAddingClass ? 'Cancel' : '+ Add'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {isAddingClass && (
                            <View style={styles.addClassContainer}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classesPicker}>
                                    {classes
                                        .filter(c => !selectedSubject.classes.some(existing => existing._id === c._id))
                                        .map((cls) => (
                                            <TouchableOpacity
                                                key={cls._id}
                                                style={[
                                                    styles.classOption,
                                                    classToAdd === cls._id && styles.classOptionSelected
                                                ]}
                                                onPress={() => setClassToAdd(cls._id)}
                                            >
                                                <Text style={[
                                                    styles.classOptionText,
                                                    classToAdd === cls._id && styles.classOptionTextSelected
                                                ]}>
                                                    {cls.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                </ScrollView>
                                <TouchableOpacity
                                    style={[styles.confirmAddButton, !classToAdd && styles.disabledButton]}
                                    onPress={handleAddClassToSubject}
                                    disabled={!classToAdd}
                                >
                                    <Text style={styles.confirmAddButtonText}>Add Selected Class</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <ScrollView style={styles.classesList}>
                            {selectedSubject?.classes?.map((cls) => (
                                <View key={cls._id} style={styles.classItem}>
                                    <View>
                                        <Text style={styles.classItemName}>{cls.name}</Text>
                                        <Text style={styles.classItemDetails}>{cls.grade} - {cls.section}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleRemoveClassFromSubject(cls._id)}
                                        style={styles.removeClassButton}
                                    >
                                        <Text style={styles.removeClassText}>Remove</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {(!selectedSubject?.classes || selectedSubject.classes.length === 0) && (
                                <Text style={styles.noDataText}>No classes assigned</Text>
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setDetailsModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
        position: 'relative',
    },
    searchInput: {
        flex: 1,
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
    clearButton: {
        position: 'absolute',
        right: 40,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.textLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearButtonText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
    list: {
        padding: 24,
        paddingTop: 16,
    },
    subjectCard: {
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
    subjectInfo: {
        flex: 1,
    },
    subjectName: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 6,
    },
    subjectCode: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
        marginBottom: 8,
    },
    classesContainer: {
        marginTop: 8,
    },
    classesLabel: {
        fontSize: 12,
        color: colors.textLight,
        marginBottom: 8,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    classTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    classTag: {
        backgroundColor: colors.background,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    classTagText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.danger,
    },
    deleteButtonText: {
        color: colors.danger,
        fontWeight: '700',
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
    label: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '700',
        marginBottom: 12,
        marginTop: 8,
    },
    classesPickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        gap: 8,
    },
    classOption: {
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    classOptionSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    classOptionText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    classOptionTextSelected: {
        color: colors.white,
    },
    noClassesText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontStyle: 'italic',
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
    modalSubtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: -16,
        marginBottom: 24,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
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
    addClassContainer: {
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    classesPicker: {
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
    classesList: {
        maxHeight: 300,
    },
    classItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    classItemName: {
        fontSize: 16,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    classItemDetails: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    removeClassButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: colors.danger + '20',
        borderRadius: 6,
    },
    removeClassText: {
        color: colors.danger,
        fontSize: 12,
        fontWeight: '600',
    },
    noDataText: {
        color: colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20,
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
});

export default SubjectManagementScreen;
