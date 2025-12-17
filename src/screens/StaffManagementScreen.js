import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import colors from '../constants/colors';
import { API_URL } from '../config';

const StaffManagementScreen = ({ navigation }) => {
    const [staffs, setstaffs] = useState([]);
    const [classes, setClasses] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedstaff, setSelectedstaff] = useState(null);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [registerNumber, setRegisterNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('');
    const [staffClass, setstaffClass] = useState(null);
    const [profilePicture, setProfilePicture] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter staffs based on search query
    const filteredstaffs = staffs.filter(staff => {
        const query = searchQuery.toLowerCase();
        const className = staff.staffClass?.name.toLowerCase() || '';
        return (
            staff.name.toLowerCase().includes(query) ||
            staff.email.toLowerCase().includes(query) ||
            staff.registerNumber?.toLowerCase().includes(query) ||
            staff.phone?.includes(query) ||
            className.includes(query)
        );
    });

    useEffect(() => {
        fetchstaffs();
        fetchClasses();
    }, []);

    const fetchstaffs = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/staffs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setstaffs(response.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch staffs');
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

    const handleOpenModal = (staff = null) => {
        if (staff) {
            setEditMode(true);
            setSelectedstaff(staff);
            setName(staff.name);
            setEmail(staff.email);
            setPhone(staff.phone || '');
            setAddress(staff.address || '');
            setRegisterNumber(staff.registerNumber || '');
            setDateOfBirth(staff.dateOfBirth ? new Date(staff.dateOfBirth).toISOString().split('T')[0] : '');
            setGender(staff.gender || '');
            setstaffClass(staff.staffClass?._id || null);
            setProfilePicture(staff.profilePicture ? { uri: `${API_URL}/${staff.profilePicture}` } : null);
            setPassword('');
        } else {
            setEditMode(false);
            setSelectedstaff(null);
            resetForm();
        }
        setModalVisible(true);
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        setAddress('');
        setRegisterNumber('');
        setDateOfBirth('');
        setGender('');
        setstaffClass(null);
        setProfilePicture(null);
    };

    const handleSubmit = async () => {
        if (!name || !email || (!editMode && !password)) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            if (phone) formData.append('phone', phone);
            if (address) formData.append('address', address);
            if (registerNumber) formData.append('registerNumber', registerNumber);
            if (dateOfBirth) formData.append('dateOfBirth', dateOfBirth);
            if (gender) formData.append('gender', gender);
            if (staffClass) formData.append('staffClass', staffClass);

            if (profilePicture && !profilePicture.uri.includes('http')) {
                // It's a newly selected local image
                let filename = profilePicture.uri.split('/').pop();
                let match = /\.(\w+)$/.exec(filename);
                let type = match ? `image/${match[1]}` : `image`;
                formData.append('profilePicture', { uri: profilePicture.uri, name: filename, type });
            }

            if (editMode) {
                await axios.put(`${API_URL}/staffs/${selectedstaff._id}`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    }
                });
                Alert.alert('Success', 'staff updated successfully');
            } else {
                formData.append('password', password);
                await axios.post(`${API_URL}/staffs`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    }
                });
                Alert.alert('Success', 'staff created successfully');
            }

            setModalVisible(false);
            resetForm();
            fetchstaffs();
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || 'Operation failed';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletestaff = async (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this staff?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.delete(`${API_URL}/staffs/${id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert('Success', 'staff deleted successfully');
                            fetchstaffs();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to delete staff');
                        }
                    }
                }
            ]
        );
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setProfilePicture(result.assets[0]);
        }
    };

    const renderstaffItem = ({ item }) => (
        <TouchableOpacity
            style={styles.staffCard}
            onPress={() => navigation.navigate('StaffProfile', { staffId: item._id })}
            activeOpacity={0.7}
        >
            <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{item.name}</Text>
                <Text style={styles.staffEmail}>{item.email}</Text>
                {item.phone && (
                    <Text style={styles.staffPhone}>📞 {item.phone}</Text>
                )}
                {item.staffClass && (
                    <View style={styles.classContainer}>
                        <Text style={styles.classLabel}>Class Teacher of:</Text>
                        <View style={styles.classTag}>
                            <Text style={styles.classTagText}>
                                {item.staffClass.name} ({item.staffClass.grade}-{item.staffClass.section})
                            </Text>
                        </View>
                    </View>
                )}
                <Text style={styles.tapToView}>Tap to view full details</Text>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        handleOpenModal(item);
                    }}
                >
                    <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        handleDeletestaff(item._id);
                    }}
                >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                        <Text style={styles.backButton}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>staff Management</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleOpenModal()}
                >
                    <Text style={styles.addButtonText}>+ Add staff</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, email, class..."
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
                data={filteredstaffs}
                renderItem={renderstaffItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {searchQuery ? 'No staffs match your search' : 'No staffs found. Add one to get started!'}
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
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>
                                {editMode ? 'Edit staff' : 'Create New staff'}
                            </Text>

                            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                                {profilePicture ? (
                                    <Image source={{ uri: profilePicture.uri }} style={styles.profileImage} />
                                ) : (
                                    <View style={styles.placeholderImage}>
                                        <Text style={styles.placeholderText}>+ Add Photo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TextInput
                                style={styles.input}
                                placeholder="Full Name *"
                                placeholderTextColor={colors.textSecondary}
                                value={name}
                                onChangeText={setName}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Email *"
                                placeholderTextColor={colors.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            {!editMode && (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password *"
                                    placeholderTextColor={colors.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            )}

                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                placeholderTextColor={colors.textSecondary}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Address"
                                placeholderTextColor={colors.textSecondary}
                                value={address}
                                onChangeText={setAddress}
                                multiline
                                numberOfLines={2}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Staff ID / Register Number"
                                placeholderTextColor={colors.textSecondary}
                                value={registerNumber}
                                onChangeText={setRegisterNumber}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Date of Birth (DD-MM-YYYY)"
                                placeholderTextColor={colors.textSecondary}
                                value={dateOfBirth}
                                onChangeText={setDateOfBirth}
                            />

                            <Text style={styles.label}>Gender</Text>
                            <View style={styles.genderContainer}>
                                {['Male', 'Female', 'Other'].map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[
                                            styles.genderOption,
                                            gender === g && styles.genderOptionSelected
                                        ]}
                                        onPress={() => setGender(g)}
                                    >
                                        <Text style={[
                                            styles.genderOptionText,
                                            gender === g && styles.genderOptionTextSelected
                                        ]}>
                                            {g}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
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
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    <Text style={styles.createButtonText}>
                                        {loading ? 'Saving...' : editMode ? 'Update' : 'Create'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    backButton: {
        fontSize: 24,
        color: colors.primary,
        fontWeight: '600',
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
    staffCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    staffInfo: {
        marginBottom: 16,
    },
    staffName: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    staffEmail: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 6,
        fontWeight: '500',
    },
    staffPhone: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 12,
        fontWeight: '500',
    },
    classContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    classLabel: {
        fontSize: 12,
        color: colors.textLight,
        marginBottom: 6,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    classTag: {
        backgroundColor: colors.secondary + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    classTagText: {
        color: colors.secondary,
        fontSize: 13,
        fontWeight: '700',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
        gap: 12,
    },
    editButton: {
        backgroundColor: colors.secondary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    editButtonText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 12,
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
    tapToView: {
        fontSize: 11,
        color: colors.primary,
        marginTop: 8,
        fontStyle: 'italic',
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
        maxWidth: 500,
        maxHeight: '85%',
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
    imagePicker: {
        alignSelf: 'center',
        marginBottom: 24,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: colors.background,
    },
    placeholderImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    placeholderText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
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

    genderContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 12,
    },
    genderOption: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        backgroundColor: colors.white,
    },
    genderOptionSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    genderOptionText: {
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 14,
    },
    genderOptionTextSelected: {
        color: colors.white,
    },
    noSubjectsText: {
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
    classContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    classLabel: {
        fontSize: 12,
        color: colors.textLight,
        marginBottom: 6,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    classTag: {
        backgroundColor: colors.secondary + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    classTagText: {
        color: colors.secondary,
        fontSize: 13,
        fontWeight: '700',
    },
    horizontalPicker: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    pickerOption: {
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    pickerOptionSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    pickerOptionText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    pickerOptionTextSelected: {
        color: colors.white,
    },
    helperText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 12,
        fontStyle: 'italic',
    },
    assignmentRow: {
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    assignmentSelectors: {
        flex: 1,
    },
    assignmentSelector: {
        marginBottom: 12,
    },
    assignmentLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    miniOption: {
        backgroundColor: colors.white,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    miniOptionSelected: {
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
    },
    miniOptionText: {
        fontSize: 12,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    miniOptionTextSelected: {
        color: colors.white,
        fontWeight: '700',
    },
    removeAssignmentButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        borderWidth: 1,
        borderColor: colors.danger,
    },
    removeAssignmentText: {
        color: colors.danger,
        fontSize: 16,
        fontWeight: 'bold',
    },
    addAssignmentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 12,
        borderStyle: 'dashed',
        marginBottom: 24,
    },
    addAssignmentText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 14,
    },
});

export default StaffManagementScreen;
