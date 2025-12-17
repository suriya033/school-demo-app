import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import colors from '../constants/colors';
import { API_URL } from '../config';

const CreateAnnouncementScreen = ({ navigation }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [targetAudience, setTargetAudience] = useState('staffs');
    const [attachment, setAttachment] = useState(null);
    const [loading, setLoading] = useState(false);

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

    const handleCreate = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('content', content.trim());
            formData.append('targetAudience', targetAudience);

            if (attachment) {
                formData.append('attachment', {
                    uri: attachment.uri,
                    name: attachment.name,
                    type: attachment.mimeType,
                });
            }

            await axios.post(
                `${API_URL}/announcements`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );

            Alert.alert('Success', 'Announcement created successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to create announcement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Create Announcement</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter announcement title"
                        placeholderTextColor={colors.textSecondary}
                        value={title}
                        onChangeText={setTitle}
                        maxLength={100}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Target Audience</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={targetAudience}
                            onValueChange={setTargetAudience}
                            style={styles.picker}
                        >
                            <Picker.Item label="staffs Only" value="staffs" />
                            <Picker.Item label="Students Only" value="Students" />
                            <Picker.Item label="Everyone" value="All" />
                        </Picker>
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Message</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Enter announcement message"
                        placeholderTextColor={colors.textSecondary}
                        value={content}
                        onChangeText={setContent}
                        multiline
                        numberOfLines={8}
                        textAlignVertical="top"
                        maxLength={1000}
                    />
                    <Text style={styles.charCount}>{content.length}/1000</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Attachment (Optional)</Text>
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
                            {attachment.type === 'image' && (
                                <Image source={{ uri: attachment.uri }} style={styles.previewImage} />
                            )}
                            <View style={styles.attachmentInfo}>
                                <Text style={styles.attachmentName}>
                                    {attachment.type === 'image' ? '📷 ' : '📄 '}
                                    {attachment.name}
                                </Text>
                                <TouchableOpacity onPress={() => setAttachment(null)}>
                                    <Text style={styles.removeAttachment}>✕ Remove</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>Post Announcement</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
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
    },
    content: {
        padding: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.lightGray,
    },
    textArea: {
        minHeight: 150,
        paddingTop: 16,
    },
    charCount: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'right',
        marginTop: 4,
    },
    pickerContainer: {
        backgroundColor: colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.lightGray,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    attachmentButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    attachButton: {
        flex: 1,
        backgroundColor: colors.lightGray,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    attachButtonText: {
        color: colors.textPrimary,
        fontWeight: '600',
        fontSize: 14,
    },
    attachmentPreview: {
        marginTop: 12,
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.lightGray,
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 8,
    },
    attachmentInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    attachmentName: {
        fontSize: 14,
        color: colors.textPrimary,
        flex: 1,
    },
    removeAttachment: {
        fontSize: 14,
        color: colors.danger,
        fontWeight: '600',
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: colors.gray,
    },
    buttonText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default CreateAnnouncementScreen;
