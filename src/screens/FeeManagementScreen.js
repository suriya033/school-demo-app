import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const FeeManagementScreen = ({ navigation }) => {
    const [fees, setFees] = useState([]);
    const [searchedStudents, setSearchedStudents] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [selectedFee, setSelectedFee] = useState(null);
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);

    const filteredFees = fees.filter(fee => {
        const query = searchQuery.toLowerCase();
        return (
            fee.title.toLowerCase().includes(query) ||
            fee.student?.name?.toLowerCase().includes(query) ||
            fee.student?.registerNumber?.toLowerCase().includes(query) ||
            fee.amount.toString().includes(query)
        );
    });

    useEffect(() => {
        fetchFees();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (studentSearchQuery.length > 0) {
                searchStudents(studentSearchQuery);
            } else {
                setSearchedStudents([]);
                setShowStudentDropdown(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [studentSearchQuery]);

    const fetchFees = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/fees`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFees(res.data);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to fetch fees');
        }
    };

    const searchStudents = async query => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(
                `${API_URL}/students?registerNumber=${query}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSearchedStudents(res.data);
            setShowStudentDropdown(res.data.length > 0);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateFee = async () => {
        if (!title || !amount || !selectedStudent || !dueDate) {
            Alert.alert('Error', 'Please fill all fields and select a student');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');

            if (editMode && selectedFee) {
                await axios.put(
                    `${API_URL}/fees/${selectedFee._id}`,
                    {
                        student: selectedStudent._id,
                        title,
                        amount: parseFloat(amount),
                        dueDate: new Date(dueDate),
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                Alert.alert('Success', 'Fee updated successfully');
            } else {
                await axios.post(
                    `${API_URL}/fees`,
                    {
                        student: selectedStudent._id,
                        classId: selectedStudent.studentClass?._id,
                        title,
                        amount: parseFloat(amount),
                        dueDate: new Date(dueDate),
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                Alert.alert('Success', 'Fee created successfully');
            }

            setModalVisible(false);
            resetForm();
            fetchFees();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async id => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.put(
                `${API_URL}/fees/${id}/payment`,
                {
                    status: 'Paid',
                    paymentMethod: 'Cash',
                    transactionId: `TXN${Date.now()}`
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Alert.alert('Success', 'Fee marked as paid');
            fetchFees();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to update fee');
        }
    };

    const handleDeleteFee = id => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this fee?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const token = await AsyncStorage.getItem('token');
                        await axios.delete(`${API_URL}/fees/${id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        Alert.alert('Success', 'Fee deleted successfully');
                        fetchFees();
                    } catch (err) {
                        console.error(err);
                        Alert.alert('Error', 'Failed to delete fee');
                    }
                }
            }
        ]);
    };

    const handleEditFee = (fee) => {
        setEditMode(true);
        setSelectedFee(fee);
        setTitle(fee.title);
        setAmount(fee.amount.toString());
        setDueDate(new Date(fee.dueDate).toISOString().split('T')[0]);
        setSelectedStudent(fee.student);
        setStudentSearchQuery(fee.student?.registerNumber || fee.student?.name || '');
        setModalVisible(true);
    };

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setStudentSearchQuery(student.registerNumber || student.name);
        setShowStudentDropdown(false);
    };

    const resetForm = () => {
        setTitle('');
        setAmount('');
        setDueDate('');
        setSelectedStudent(null);
        setStudentSearchQuery('');
        setSearchedStudents([]);
        setShowStudentDropdown(false);
        setEditMode(false);
        setSelectedFee(null);
    };

    const renderFeeItem = ({ item }) => (
        <View style={styles.feeCard}>
            <View style={styles.feeHeader}>
                <View style={styles.feeInfo}>
                    <Text style={styles.feeTitle}>{item.title}</Text>
                    <Text style={styles.studentName}>{item.student?.name}</Text>
                    {item.student?.registerNumber && (
                        <Text style={styles.registerNumber}>Reg: {item.student.registerNumber}</Text>
                    )}
                </View>
                <View style={[
                    styles.statusBadge,
                    item.status === 'Paid' ? styles.paidBadge : styles.pendingBadge
                ]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.feeDetails}>
                <Text style={styles.feeAmount}>₹{item.amount}</Text>
                <Text style={styles.dueDate}>
                    Due: {new Date(item.dueDate).toLocaleDateString()}
                </Text>
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
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Fee Management</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        resetForm();
                        setModalVisible(true);
                    }}
                >
                    <Text style={styles.addButtonText}>+ Add Fee</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by title, student, register number..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearSearchButton}
                        onPress={() => setSearchQuery('')}
                    >
                        <Text style={styles.clearSearchText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Fee List */}
            <FlatList
                data={filteredFees}
                renderItem={renderFeeItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'No fees match your search' : 'No fees found'}
                        </Text>
                    </View>
                }
            />

            {/* Create/Edit Fee Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setModalVisible(false);
                    resetForm();
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>
                                {editMode ? 'Edit Fee' : 'Create New Fee'}
                            </Text>

                            {/* Title Input */}
                            <Text style={styles.label}>Fee Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Tuition Fee - Term 1"
                                placeholderTextColor={colors.textSecondary}
                                value={title}
                                onChangeText={setTitle}
                            />

                            {/* Amount Input */}
                            <Text style={styles.label}>Amount (₹)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter amount"
                                placeholderTextColor={colors.textSecondary}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                            />

                            {/* Due Date Input */}
                            <Text style={styles.label}>Due Date</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={colors.textSecondary}
                                value={dueDate}
                                onChangeText={setDueDate}
                            />

                            {/* Student Search */}
                            <View style={styles.studentSearchContainer}>
                                <Text style={styles.label}>Student</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Search by register number or name..."
                                    placeholderTextColor={colors.textSecondary}
                                    value={studentSearchQuery}
                                    onChangeText={setStudentSearchQuery}
                                    editable={!editMode}
                                />

                                {selectedStudent && (
                                    <View style={styles.selectedStudentBadge}>
                                        <Text style={styles.selectedStudentText}>
                                            {selectedStudent.name} ({selectedStudent.registerNumber})
                                        </Text>
                                        {!editMode && (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setSelectedStudent(null);
                                                    setStudentSearchQuery('');
                                                }}
                                            >
                                                <Text style={styles.clearStudentText}>✕</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {showStudentDropdown && searchedStudents.length > 0 && (
                                    <ScrollView style={styles.studentDropdown} nestedScrollEnabled>
                                        {searchedStudents.map((student) => (
                                            <TouchableOpacity
                                                key={student._id}
                                                style={styles.studentDropdownItem}
                                                onPress={() => handleSelectStudent(student)}
                                            >
                                                <Text style={styles.studentDropdownName}>
                                                    {student.name}
                                                </Text>
                                                <Text style={styles.studentDropdownReg}>
                                                    Reg: {student.registerNumber}
                                                </Text>
                                                {student.studentClass && (
                                                    <Text style={styles.studentDropdownClass}>
                                                        Class: {student.studentClass.name}
                                                    </Text>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>

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
                                    {loading ? (
                                        <ActivityIndicator color={colors.white} />
                                    ) : (
                                        <Text style={styles.createButtonText}>
                                            {editMode ? 'Update' : 'Create'}
                                        </Text>
                                    )}
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    backButtonText: {
        fontSize: 28,
        color: colors.primary,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
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
    searchContainer: {
        padding: 20,
        paddingBottom: 10,
        backgroundColor: colors.white,
        position: 'relative',
    },
    searchInput: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 14,
        paddingRight: 48,
        fontSize: 16,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    clearSearchButton: {
        position: 'absolute',
        right: 36,
        top: 34,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.textSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearSearchText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
    listContent: {
        padding: 20,
        paddingTop: 10,
    },
    feeCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    feeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    feeInfo: {
        flex: 1,
    },
    feeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    studentName: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    registerNumber: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
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
    feeDetails: {
        marginBottom: 12,
    },
    feeAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 4,
    },
    dueDate: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    payButton: {
        backgroundColor: colors.success,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    payButtonText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 13,
    },
    editButton: {
        backgroundColor: colors.secondary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    editButtonText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 13,
    },
    deleteButton: {
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.danger,
    },
    deleteButtonText: {
        color: colors.danger,
        fontWeight: '700',
        fontSize: 13,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
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
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 8,
        marginTop: 4,
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.textPrimary,
    },
    studentSearchContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    selectedStudentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.primary,
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    selectedStudentText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 14,
        flex: 1,
    },
    clearStudentText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        paddingHorizontal: 8,
    },
    studentDropdown: {
        backgroundColor: colors.white,
        borderRadius: 8,
        marginTop: 4,
        maxHeight: 200,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    studentDropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    studentDropdownName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    studentDropdownReg: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    studentDropdownClass: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: colors.lightGray,
    },
    cancelButtonText: {
        color: colors.textPrimary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    createButton: {
        backgroundColor: colors.primary,
    },
    createButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default FeeManagementScreen;
