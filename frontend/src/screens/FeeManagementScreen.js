import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const FeeManagementScreen = ({ navigation }) => {
    const [fees, setFees] = useState([]);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [selectedFee, setSelectedFee] = useState(null);

    // Filter fees based on search query
    const filteredFees = fees.filter(fee => {
        const query = searchQuery.toLowerCase();
        return (
            fee.title.toLowerCase().includes(query) ||
            fee.student?.name.toLowerCase().includes(query) ||
            fee.amount.toString().includes(query)
        );
    });

    useEffect(() => {
        fetchFees();
        fetchStudents();
        fetchClasses();
    }, []);

    const fetchFees = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/fees`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFees(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchStudents = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(response.data);
        } catch (error) {
            console.error(error);
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

    const handleCreateFee = async () => {
        if (!title || !amount || !selectedStudent || !selectedClass || !dueDate) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');

            if (editMode && selectedFee) {
                // Update existing fee
                await axios.put(`${API_URL}/fees/${selectedFee._id}`, {
                    student: selectedStudent,
                    classId: selectedClass,
                    title,
                    amount: parseFloat(amount),
                    dueDate: new Date(dueDate),
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Alert.alert('Success', 'Fee updated successfully');
            } else {
                // Create new fee
                await axios.post(`${API_URL}/fees`, {
                    student: selectedStudent,
                    classId: selectedClass,
                    title,
                    amount: parseFloat(amount),
                    dueDate: new Date(dueDate),
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Alert.alert('Success', 'Fee created successfully');
            }

            setModalVisible(false);
            resetForm();
            fetchFees();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', editMode ? 'Failed to update fee' : 'Failed to create fee');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async (feeId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.put(`${API_URL}/fees/${feeId}/payment`, {
                status: 'Paid',
                paymentMethod: 'Cash',
                transactionId: `TXN${Date.now()}`,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Success', 'Fee marked as paid');
            fetchFees();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update fee');
        }
    };

    const handleDeleteFee = async (feeId) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this fee?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.delete(`${API_URL}/fees/${feeId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert('Success', 'Fee deleted successfully');
                            fetchFees();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to delete fee');
                        }
                    }
                }
            ]
        );
    };

    const handleEditFee = (fee) => {
        setEditMode(true);
        setSelectedFee(fee);
        setTitle(fee.title);
        setAmount(fee.amount.toString());
        setDueDate(new Date(fee.dueDate).toISOString().split('T')[0]);
        setSelectedStudent(fee.student._id);
        setSelectedClass(fee.classId._id || fee.classId);
        setModalVisible(true);
    };

    const resetForm = () => {
        setTitle('');
        setAmount('');
        setDueDate('');
        setSelectedStudent('');
        setSelectedClass('');
        setEditMode(false);
        setSelectedFee(null);
    };

    const renderFeeItem = ({ item }) => (
        <View style={styles.feeCard}>
            <View style={styles.feeInfo}>
                <Text style={styles.feeTitle}>{item.title}</Text>
                <Text style={styles.studentName}>{item.student?.name}</Text>
                <Text style={styles.feeAmount}>₹{item.amount}</Text>
                <Text style={styles.dueDate}>
                    Due: {new Date(item.dueDate).toLocaleDateString()}
                </Text>
                <View style={[
                    styles.statusBadge,
                    item.status === 'Paid' ? styles.paidBadge : styles.pendingBadge
                ]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>
            <View style={styles.actionButtons}>
                {item.status !== 'Paid' && (
                    <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => handleMarkPaid(item._id)}
                    >
                        <Text style={styles.payButtonText}>Mark Paid</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditFee(item)}
                >
                    <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteFee(item._id)}
                >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Fee Management</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={styles.addButtonText}>+ Add Fee</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by title, student, or amount..."
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
                data={filteredFees}
                renderItem={renderFeeItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {searchQuery ? 'No fees match your search' : 'No fees found'}
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
                        <ScrollView>
                            <Text style={styles.modalTitle}>{editMode ? 'Edit Fee' : 'Create Fee'}</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Title (e.g., Tuition Fee - Term 1)"
                                value={title}
                                onChangeText={setTitle}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Amount"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Due Date (YYYY-MM-DD)"
                                value={dueDate}
                                onChangeText={setDueDate}
                            />

                            <Text style={styles.label}>Select Student</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.picker}>
                                {students.map((student) => (
                                    <TouchableOpacity
                                        key={student._id}
                                        style={[
                                            styles.pickerOption,
                                            selectedStudent === student._id && styles.pickerOptionSelected
                                        ]}
                                        onPress={() => setSelectedStudent(student._id)}
                                    >
                                        <Text style={[
                                            styles.pickerOptionText,
                                            selectedStudent === student._id && styles.pickerOptionTextSelected
                                        ]}>
                                            {student.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.label}>Select Class</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.picker}>
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
                                            {cls.name}
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
                                    onPress={handleCreateFee}
                                    disabled={loading}
                                >
                                    <Text style={styles.createButtonText}>
                                        {loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update' : 'Create')}
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
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.primary,
    },
    addButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    addButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    list: {
        padding: 20,
        paddingTop: 10,
    },
    feeCard: {
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
    feeInfo: {
        marginBottom: 12,
    },
    feeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    studentName: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    feeAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 4,
    },
    dueDate: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    paidBadge: {
        backgroundColor: colors.success,
    },
    pendingBadge: {
        backgroundColor: colors.accent,
    },
    statusText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    payButton: {
        backgroundColor: colors.success,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8,
    },
    payButtonText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
        gap: 8,
    },
    editButton: {
        backgroundColor: colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    editButtonText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 12,
    },
    deleteButton: {
        backgroundColor: colors.white,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.danger,
    },
    deleteButtonText: {
        color: colors.danger,
        fontWeight: '700',
        fontSize: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 10,
        position: 'relative',
    },
    searchInput: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 14,
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
        right: 36,
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

export default FeeManagementScreen;
