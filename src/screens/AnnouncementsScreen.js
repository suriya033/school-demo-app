import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const AnnouncementsScreen = ({ navigation }) => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchUserAndAnnouncements();
        const interval = setInterval(fetchAnnouncements, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchUserAndAnnouncements = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            await fetchAnnouncements();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/announcements`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAnnouncements(response.data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        }
    };

    const markAsRead = async (announcementId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.put(
                `${API_URL}/announcements/${announcementId}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const deleteAnnouncement = async (announcementId) => {
        Alert.alert(
            'Delete Announcement',
            'Are you sure you want to delete this announcement?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.delete(`${API_URL}/announcements/${announcementId}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            setAnnouncements(announcements.filter((a) => a._id !== announcementId));
                            Alert.alert('Success', 'Announcement deleted');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete announcement');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 24) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderAnnouncement = ({ item }) => {
        const isUnread = !item.readBy.includes(user?.id);
        const canDelete = user?.role === 'Admin' || item.sender?._id === user?._id || item.sender === user?._id;

        return (
            <TouchableOpacity
                style={[styles.announcementCard, isUnread && styles.unreadCard]}
                onPress={() => {
                    if (isUnread) {
                        markAsRead(item._id);
                    }
                }}
                onLongPress={() => {
                    if (canDelete) {
                        deleteAnnouncement(item._id);
                    }
                }}
            >
                <View style={styles.announcementHeader}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.announcementTitle}>{item.title}</Text>
                        <Text style={styles.announcementMeta}>
                            From: {item.sender?.name || 'Admin'} • {formatDate(item.createdAt)}
                        </Text>
                    </View>
                    {isUnread && <View style={styles.unreadBadge} />}
                </View>
                <Text style={styles.announcementContent}>{item.content}</Text>

                {/* Display attachment */}
                {item.attachmentUrl && item.attachmentType === 'image' && (() => {
                    let cleanPath = item.attachmentUrl;
                    if (cleanPath.includes('uploads/') || cleanPath.includes('uploads\\')) {
                        const parts = cleanPath.replace(/\\/g, '/').split('uploads/');
                        cleanPath = 'uploads/' + parts[parts.length - 1];
                    }
                    const imageUrl = cleanPath.startsWith('http')
                        ? cleanPath
                        : `${API_URL.split('/api')[0]}/${cleanPath}`;

                    return (
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.attachmentImage}
                            resizeMode="cover"
                        />
                    );
                })()}

                {item.attachmentUrl && item.attachmentType === 'pdf' && (
                    <View style={styles.pdfContainer}>
                        <Text style={styles.pdfIcon}>📄</Text>
                        <Text style={styles.pdfText}>PDF Attachment</Text>
                    </View>
                )}

                <View style={styles.audienceBadge}>
                    <Text style={styles.audienceText}>To: {item.targetAudience}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Announcements</Text>
                </View>
                {(user?.role === 'Admin' || user?.role === 'staff') && (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('CreateAnnouncement')}
                        style={styles.addButton}
                    >
                        <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={announcements}
                renderItem={renderAnnouncement}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No announcements yet</Text>
                }
            />
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
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButtonText: {
        fontSize: 24,
        color: colors.primary,
        fontWeight: '600',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
        flex: 1,
    },
    addButton: {
        right:40,
        width: 40,
        height: 40,
        borderRadius: 1,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 24,
        color: colors.white,
        fontWeight: 'bold',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    announcementCard: {
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
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    announcementHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    headerLeft: {
        flex: 1,
    },
    announcementTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    announcementMeta: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    unreadBadge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
        marginLeft: 8,
    },
    announcementContent: {
        fontSize: 14,
        color: colors.textPrimary,
        lineHeight: 20,
        marginBottom: 8,
    },
    attachmentImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginVertical: 12,
    },
    pdfContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.lightGray,
        padding: 12,
        borderRadius: 8,
        marginVertical: 12,
    },
    pdfIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    pdfText: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    audienceBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.accent,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    audienceText: {
        fontSize: 11,
        color: colors.white,
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 14,
        marginTop: 40,
    },
});

export default AnnouncementsScreen;
