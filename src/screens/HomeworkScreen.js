import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const HomeworkScreen = ({ navigation }) => {
    const [homework, setHomework] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [user, setUser] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null); // Now stores the full class object
    const [viewMode, setViewMode] = useState('classes'); // 'classes' or 'list'

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getUser().then(user => {
            if (user) {
                fetchClasses(user);
            }
        });
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchHomework(user, selectedClass._id);
            if (selectedClass.subjects) {
                setSubjects(selectedClass.subjects);
            } else {
                setSubjects([]);
            }
        }
    }, [selectedClass]);

    const getUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            return parsedUser;
        }
        return null;
    };

    const fetchClasses = async (currentUser) => {
        try {
            const token = await AsyncStorage.getItem('token');
            let url = `${API_URL}/classes`;
            if (currentUser && currentUser.role === 'staff') {
                url += `?staffId=${currentUser.id || currentUser._id}`;
            }
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClasses(response.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch classes');
        }
    };

    const fetchHomework = async (currentUser, classId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            let url = `${API_URL}/homework?classId=${classId}`;
            // We want to see all homework for this class, or just the ones created by this staff?
            // Usually a staff wants to see what they assigned.
            if (currentUser && currentUser.role === 'staff') {
                url += `&staffId=${currentUser.id || currentUser._id}`;
            }
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHomework(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleClassSelect = (cls) => {
        setSelectedClass(cls);
        setViewMode('list');
    };

    const handleBackToClasses = () => {
        setSelectedClass(null);
        setViewMode('classes');
        setHomework([]);
    };

    const handleCreateHomework = async () => {
        if (!title || !description || !selectedSubjectId || !dueDate) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${API_URL}/homework`, {
                title,
                description,
                classId: selectedClass._id,
                subjectId: selectedSubjectId,
                staffId: user.id,
                dueDate: new Date(dueDate),
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Success', 'Homework created successfully');
            setModalVisible(false);
            resetForm();
            fetchHomework(user, selectedClass._id);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to create homework');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteHomework = async (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this homework?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.delete(`${API_URL}/homework/${id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert('Success', 'Homework deleted');
                            fetchHomework(user, selectedClass._id);
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to delete homework');
                        }
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setSelectedSubjectId('');
        setDueDate('');
    };

    const renderClassItem = ({ item }) => (
        <TouchableOpacity style={styles.classCard} onPress={() => handleClassSelect(item)}>
            <Text style={styles.className}>{item.name}</Text>
            <Text style={styles.classDetails}>Grade {item.grade} - Section {item.section}</Text>
        </TouchableOpacity>
    );

    const renderHomeworkItem = ({ item }) => (
        <View style={styles.homeworkCard}>
            <View style={styles.homeworkInfo}>
                <Text style={styles.homeworkTitle}>{item.title}</Text>
                <Text style={styles.homeworkDescription}>{item.description}</Text>
                <View style={styles.homeworkMeta}>
                    <Text style={styles.metaText}>📚 {item.subject?.name}</Text>
                    <Text style={styles.dueDate}>
                        Due: {new Date(item.dueDate).toLocaleDateString()}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteHomework(item._id)}
            >
                <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {viewMode === 'classes' ? (
                <>
                    <View style={styles.header}>
                        <Text style={styles.title}>My Classes</Text>
                    </View>
                    <FlatList
                        data={classes}
                        renderItem={renderClassItem}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No classes assigned</Text>
                        }
                    />
                </>
            ) : (
                <>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBackToClasses} style={styles.backButton}>
                            <Text style={styles.backButtonText}>←</Text>
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.title}>{selectedClass?.name}</Text>
                            <Text style={styles.subtitle}>Homework</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setModalVisible(true)}
                        >
                            <Text style={styles.addButtonText}>+ Add</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={homework}
                        renderItem={renderHomeworkItem}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No homework assigned yet</Text>
                        }
                    />
                </>
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalTitle}>Create Homework</Text>
                            <Text style={styles.modalSubtitle}>For {selectedClass?.name}</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Title"
                                value={title}
                                onChangeText={setTitle}
                            />

                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Description"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Due Date (YYYY-MM-DD)"
                                value={dueDate}
                                onChangeText={setDueDate}
                            />

                            <Text style={styles.label}>Select Subject</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.picker}>
                                {subjects.map((subject) => (
                                    <TouchableOpacity
                                        key={subject._id}
                                        style={[
                                            styles.pickerOption,
                                            selectedSubjectId === subject._id && styles.pickerOptionSelected
                                        ]}
                                        onPress={() => setSelectedSubjectId(subject._id)}
                                    >
                                        <Text style={[
                                            styles.pickerOptionText,
                                            selectedSubjectId === subject._id && styles.pickerOptionTextSelected
                                        ]}>
                                            {subject.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => {
                                        setModalVisible(false);
                                        resetForm();
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.createButton]}
                                    onPress={handleCreateHomework}
                                    disabled={loading}
                                >
                                    <Text style={styles.createButtonText}>
                                        {loading ? 'Creating...' : 'Create'}
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
        padding: 20,
        paddingBottom: 10,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        marginRight: 10,
        padding: 5,
    },
    backButtonText: {
        fontSize: 24,
        color: colors.primary,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    addButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    list: {
        padding: 20,
    },
    classCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 5,
        borderLeftColor: colors.primary,
    },
    className: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    classDetails: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    homeworkCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    homeworkInfo: {
        marginBottom: 12,
    },
    homeworkTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    homeworkDescription: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    homeworkMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        color: colors.textSecondary,
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    dueDate: {
        fontSize: 12,
        color: colors.danger,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: colors.danger,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: colors.white,
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
});

export default HomeworkScreen;
