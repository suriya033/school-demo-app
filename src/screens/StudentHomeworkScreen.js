import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const StudentHomeworkScreen = ({ navigation }) => {
    const [homework, setHomework] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHomework();
    }, []);

    const fetchHomework = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userData = await AsyncStorage.getItem('user');
            const user = JSON.parse(userData);

            let url = `${API_URL}/homework`;
            // Filter by student's class if available
            if (user.studentClass) {
                const classId = typeof user.studentClass === 'object' ? user.studentClass._id : user.studentClass;
                url += `?classId=${classId}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHomework(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderHomeworkItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.date}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <View style={styles.footer}>
                <Text style={styles.subject}>📚 {item.subject?.name || 'Subject'}</Text>
                <Text style={styles.staff}>By: {item.staff?.name || 'Teacher'}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.screenTitle}>My Homework</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={homework}
                    renderItem={renderHomeworkItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No homework assigned.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        marginRight: 15,
    },
    backButtonText: {
        fontSize: 24,
        color: colors.primary,
        fontWeight: 'bold',
    },
    screenTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    list: {
        padding: 20,
    },
    card: {
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        flex: 1,
    },
    date: {
        fontSize: 12,
        color: colors.danger,
        fontWeight: '600',
        marginLeft: 10,
    },
    description: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 12,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 8,
    },
    subject: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
    },
    staff: {
        fontSize: 12,
        color: colors.textSecondary,
        fontStyle: 'italic',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
    },
});

export default StudentHomeworkScreen;
