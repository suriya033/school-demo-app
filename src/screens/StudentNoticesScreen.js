import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const StudentNoticesScreen = ({ navigation }) => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState(null);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/notices?targetAudience=Student`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotices(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openNotice = (notice) => {
        setSelectedNotice(notice);
        setModalVisible(true);
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        // Normalize path separators
        const normalizedPath = path.replace(/\\/g, '/');
        const baseUrl = API_URL.replace('/api', '');
        const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;
        return `${baseUrl}/${cleanPath}`;
    };

    const renderNoticeItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => openNotice(item)}>
            {item.attachmentUrl && item.attachmentType === 'image' && (
                <Image
                    source={{ uri: getImageUrl(item.attachmentUrl) }}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
            )}
            <View style={styles.header}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.content} numberOfLines={3}>{item.content}</Text>
            <Text style={styles.readMore}>Tap to read more</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.screenTitle}>Notices</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={notices}
                    renderItem={renderNoticeItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No notices available.</Text>
                        </View>
                    }
                />
            )}

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>{selectedNotice?.title}</Text>
                            <Text style={styles.modalDate}>
                                {selectedNotice && new Date(selectedNotice.date).toLocaleDateString()}
                            </Text>

                            {selectedNotice?.attachmentUrl && selectedNotice.attachmentType === 'image' && (
                                <Image
                                    source={{ uri: getImageUrl(selectedNotice.attachmentUrl) }}
                                    style={styles.modalImage}
                                    resizeMode="cover"
                                />
                            )}

                            <Text style={styles.modalBody}>{selectedNotice?.content}</Text>
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
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
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButtonText: {
        fontSize: 24,
        color: colors.primary,
        fontWeight: '600',
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
        elevation: 3,
    },
    cardImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 12,
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
        color: colors.textSecondary,
    },
    content: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 8,
        lineHeight: 20,
    },
    readMore: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxHeight: '80%',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 8,
    },
    modalDate: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 16,
        fontStyle: 'italic',
    },
    modalImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: '#f0f0f0',
    },
    modalBody: {
        fontSize: 16,
        color: colors.textPrimary,
        lineHeight: 24,
        marginBottom: 20,
    },
    closeButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    closeButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default StudentNoticesScreen;
