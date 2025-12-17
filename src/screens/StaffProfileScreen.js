import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const StaffProfileScreen = ({ route, navigation }) => {
    const { staffId } = route?.params || {};
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, [staffId]);

    const fetchProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');

            let targetStaffId = staffId;

            // If no staffId provided, fetch current user's profile
            if (!targetStaffId) {
                const userData = await AsyncStorage.getItem('user');
                const parsedUser = JSON.parse(userData);
                targetStaffId = parsedUser.id;
            }

            const response = await axios.get(`${API_URL}/staffs/${targetStaffId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUser(response.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not provided';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.loadingText}>Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                            <Text style={styles.backButtonText}>←</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>{staffId ? 'Staff Profile' : 'My Profile'}</Text>
                    </View>
                </View>

                <View style={styles.profileCard}>
                    <View style={styles.profileImageContainer}>
                        {user?.profilePicture ? (
                            <Image
                                source={{
                                    uri: user.profilePicture.startsWith('http')
                                        ? user.profilePicture
                                        : `${API_URL.replace('/api', '')}/${user.profilePicture}`
                                }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <View style={styles.profileImagePlaceholder}>
                                <Text style={styles.profileImageText}>
                                    {user?.name?.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.profileName}>{user?.name}</Text>
                    <Text style={styles.profileRole}>{user?.role}</Text>
                    {user?.registerNumber && (
                        <Text style={styles.registerNumber}>Staff ID: {user.registerNumber}</Text>
                    )}
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{user?.email || 'Not provided'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Phone</Text>
                        <Text style={styles.infoValue}>{user?.phone || 'Not provided'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Date of Birth</Text>
                        <Text style={styles.infoValue}>{formatDate(user?.dateOfBirth)}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Gender</Text>
                        <Text style={styles.infoValue}>{user?.gender || 'Not provided'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Address</Text>
                        <Text style={styles.infoValue}>{user?.address || 'Not provided'}</Text>
                    </View>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Professional Information</Text>

                    {user?.staffClass && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Class staff</Text>
                            <Text style={styles.infoValue}>{user.staffClass.name}</Text>
                        </View>
                    )}

                    {user?.staffSubjects && user.staffSubjects.length > 0 && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Subjects</Text>
                            <View style={styles.subjectsList}>
                                {user.staffSubjects.map((subject, index) => (
                                    <View key={index} style={styles.subjectTag}>
                                        <Text style={styles.subjectTagText}>{subject.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
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
    scrollContent: {
        padding: 20,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.primary,
    },
    backButtonText: {
        fontSize: 24,
        color: colors.primary,
        fontWeight: '600',
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: colors.textSecondary,
    },
    profileCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    profileImageContainer: {
        marginBottom: 16,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: colors.primary,
    },
    profileImagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImageText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: colors.white,
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    profileRole: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    registerNumber: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    infoSection: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.background,
    },
    infoLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 14,
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'right',
    },
    subjectsList: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        gap: 6,
    },
    subjectTag: {
        backgroundColor: colors.accent,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    subjectTagText: {
        color: colors.white,
        fontSize: 11,
        fontWeight: '600',
    },
});

export default StaffProfileScreen;
