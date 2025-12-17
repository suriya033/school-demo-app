import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import colors from '../constants/colors';
import { API_URL } from '../config';

const NoticeScreen = ({ navigation }) => {
    const [notices, setNotices] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [user, setUser] = useState(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedAudience, setSelectedAudience] = useState([]);
    const [attachment, setAttachment] = useState(null);
    const [loading, setLoading] = useState(false);

    const audienceOptions = ['Student', 'staff', 'Parent', 'Admin'];

    useEffect(() => {
        fetchNotices();
        getUser();
    }, []);

    const getUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    };

    const fetchNotices = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/notices`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotices(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const toggleAudience = (audience) => {
        if (selectedAudience.includes(audience)) {
            setSelectedAudience(selectedAudience.filter(a => a !== audience));
        } else {
            setSelectedAudience([...selectedAudience, audience]);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });

        if (!result.canceled) {
            setAttachment({
                uri: result.assets[0].uri,
                type: 'image',
                name: result.assets[0].fileName || 'image.jpg',
                mimeType: result.assets[0].mimeType || 'image/jpeg',
            });
        }
    };

    const pickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/pdf',
        });

        if (result.assets && result.assets.length > 0) {
            setAttachment({
                uri: result.assets[0].uri,
                type: 'pdf',
                name: result.assets[0].name,
                mimeType: 'application/pdf',
            });
        }
    };

    const handleCreateNotice = async () => {
        if (!title || !content || selectedAudience.length === 0) {
            Alert.alert('Error', 'Please fill all fields and select at least one audience');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('authorId', user.id);
            formData.append('targetAudience', JSON.stringify(selectedAudience));

            if (attachment) {
                formData.append('attachment', {
                    uri: attachment.uri,
                    name: attachment.name,
                    type: attachment.mimeType,
                });
            }

            await axios.post(`${API_URL}/notices`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });

            Alert.alert('Success', 'Notice created successfully');
            setModalVisible(false);
            resetForm();
            fetchNotices();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to create notice');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteNotice = async (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this notice?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.delete(`${API_URL}/notices/${id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert('Success', 'Notice deleted');
                            fetchNotices();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to delete notice');
                        }
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setSelectedAudience([]);
        setAttachment(null);
    };

    const renderNoticeItem = ({ item }) => (
        <View style={styles.noticeCard}>
            <View style={styles.noticeHeader}>
                <Text style={styles.noticeTitle}>{item.title}</Text>
                <Text style={styles.noticeDate}>
                    {new Date(item.date).toLocaleDateString()}
                </Text>
            </View>
            <Text style={styles.noticeContent}>{item.content}</Text>

            {item.attachmentUrl && item.attachmentType === 'image' && (() => {
                // Clean up the attachment URL - extract only the relative path
                let cleanPath = item.attachmentUrl;

                // If it's an absolute path, extract just the uploads/filename part
                if (cleanPath.includes('uploads/') || cleanPath.includes('uploads\\')) {
                    const parts = cleanPath.replace(/\\/g, '/').split('uploads/');
                    cleanPath = 'uploads/' + parts[parts.length - 1];
                }

                // Construct the full URL
                const imageUrl = cleanPath.startsWith('http')
                    ? cleanPath
                    : `${API_URL.split('/api')[0]}/${cleanPath}`;

                return (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.noticeImage}
                        resizeMode="cover"
                        onError={(error) => {
                            console.log('❌ Image load error for notice:', item.title);
                            console.log('   Attempted URL:', imageUrl);
                            console.log('   Original attachmentUrl:', item.attachmentUrl);
                            console.log('   Error:', error.nativeEvent?.error);
                        }}
                        onLoad={() => {
                            console.log('✅ Image loaded successfully for notice:', item.title);
                        }}
                    />
                );
            })()}

            {item.attachmentUrl && item.attachmentType === 'pdf' && (
                <View style={styles.pdfContainer}>
                    <Text style={styles.pdfIcon}>📄</Text>
                    <Text style={styles.pdfText}>PDF Attachment</Text>
                </View>
            )}

            <View style={styles.audienceTags}>
                {item.targetAudience?.map((audience, index) => (
                    <View key={index} style={styles.audienceTag}>
                        <Text style={styles.audienceTagText}>{audience}</Text>
                    </View>
                ))}
            </View>
            <Text style={styles.author}>By: {item.author?.name}</Text>
            {user?.role === 'Admin' && (
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteNotice(item._id)}
                >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                        <Text style={styles.backButton}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Notices</Text>
                </View>
                {user?.role === 'Admin' && (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.addButtonText}>+ Add Notice</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={notices}
                renderItem={renderNoticeItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No notices yet</Text>
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
                            <Text style={styles.modalTitle}>Create Notice</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Title"
                                value={title}
                                onChangeText={setTitle}
                            />

                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Content"
                                value={content}
                                onChangeText={setContent}
                                multiline
                                numberOfLines={6}
                            />

                            <Text style={styles.label}>Attachment</Text>
                            <View style={styles.attachmentButtons}>
                                <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
                                    <Text style={styles.attachButtonText}>📷 Add Image</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.attachButton} onPress={pickDocument}>
                                    <Text style={styles.attachButtonText}>📎 Add PDF</Text>
                                </TouchableOpacity>
                            </View>

                            {attachment && (
                                <View style={styles.attachmentPreview}>
                                    <Text style={styles.attachmentName}>
                                        {attachment.type === 'image' ? '📷 ' : '📄 '}
                                        {attachment.name}
                                    </Text>
                                    <TouchableOpacity onPress={() => setAttachment(null)}>
                                        <Text style={styles.removeAttachment}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <Text style={styles.label}>Target Audience</Text>
                            <View style={styles.audienceContainer}>
                                {audienceOptions.map((audience) => (
                                    <TouchableOpacity
                                        key={audience}
                                        style={[
                                            styles.audienceOption,
                                            selectedAudience.includes(audience) && styles.audienceOptionSelected
                                        ]}
                                        onPress={() => toggleAudience(audience)}
                                    >
                                        <Text style={[
                                            styles.audienceOptionText,
                                            selectedAudience.includes(audience) && styles.audienceOptionTextSelected
                                        ]}>
                                            {audience}
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
                                    onPress={handleCreateNotice}
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
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.primary,
    },
    backButton: {
        fontSize: 24,
        color: colors.primary,
        fontWeight: '600',
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
    noticeCard: {
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
    noticeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    noticeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        flex: 1,
    },
    noticeDate: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    noticeContent: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 12,
        lineHeight: 20,
    },
    noticeImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
    },
    pdfContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.lightGray,
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
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
    audienceTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    audienceTag: {
        backgroundColor: colors.accent,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 6,
    },
    audienceTagText: {
        color: colors.white,
        fontSize: 11,
        fontWeight: '600',
    },
    author: {
        fontSize: 12,
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginBottom: 12,
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
        height: 120,
        textAlignVertical: 'top',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 8,
        marginTop: 4,
    },
    attachmentButtons: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    attachButton: {
        backgroundColor: colors.lightGray,
        padding: 10,
        borderRadius: 8,
        marginRight: 10,
        flex: 1,
        alignItems: 'center',
    },
    attachButtonText: {
        color: colors.textPrimary,
        fontWeight: '600',
    },
    attachmentPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: colors.lightGray,
        borderRadius: 8,
        marginBottom: 12,
    },
    attachmentName: {
        fontSize: 14,
        color: colors.textPrimary,
        flex: 1,
    },
    removeAttachment: {
        fontSize: 18,
        color: colors.danger,
        padding: 4,
    },
    audienceContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    audienceOption: {
        backgroundColor: colors.background,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.lightGray,
    },
    audienceOptionSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    audienceOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    audienceOptionTextSelected: {
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

export default NoticeScreen;
