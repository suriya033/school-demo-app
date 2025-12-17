import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import colors from '../constants/colors';
import { API_URL } from '../config';

const ClassMessagesScreen = ({ navigation }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [user, setUser] = useState(null);
    const [classId, setClassId] = useState(null);

    // Attachment state
    const [attachment, setAttachment] = useState(null);

    // Poll state
    const [showPollModal, setShowPollModal] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);

    const userIdRef = useRef(null);
    const classIdRef = useRef(null);
    const flatListRef = useRef(null);

    useEffect(() => {
        getUserAndFetchMessages();
        const interval = setInterval(() => fetchMessages(), 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const getUserAndFetchMessages = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            userIdRef.current = parsedUser.id;

            // Get user's full profile to get class ID
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/${parsedUser.role === 'Student' ? 'students' : 'staffs'}/${parsedUser.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const userClassId = parsedUser.role === 'Student'
                ? response.data.studentClass?._id
                : response.data.staffClass?._id;

            if (!userClassId) {
                Alert.alert('Error', 'You are not assigned to any class');
                navigation.goBack();
                return;
            }

            setClassId(userClassId);
            classIdRef.current = userClassId;
            await fetchMessages(userClassId);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (cId = classIdRef.current) => {
        if (!cId) return;

        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/messages/class/${cId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setMessages(response.data);

            // Mark messages as read
            const currentUserId = userIdRef.current;
            if (currentUserId) {
                response.data.forEach(async (msg) => {
                    if (!msg.readBy.includes(currentUserId)) {
                        await markAsRead(msg._id);
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const markAsRead = async (messageId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.put(
                `${API_URL}/messages/${messageId}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error('Error marking as read:', error);
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

    const handleAddOption = () => {
        if (pollOptions.length < 5) {
            setPollOptions([...pollOptions, '']);
        }
    };

    const handleOptionChange = (text, index) => {
        const newOptions = [...pollOptions];
        newOptions[index] = text;
        setPollOptions(newOptions);
    };

    const createPoll = async () => {
        const validOptions = pollOptions.filter(opt => opt.trim() !== '');
        if (!pollQuestion.trim() || validOptions.length < 2) {
            Alert.alert('Error', 'Please enter a question and at least 2 options');
            return;
        }

        setSending(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const formData = new FormData();
            formData.append('isPoll', 'true');
            formData.append('pollQuestion', pollQuestion);
            formData.append('pollOptions', JSON.stringify(validOptions));

            const response = await axios.post(
                `${API_URL}/messages/class/${classId}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            setMessages([...messages, response.data]);
            setShowPollModal(false);
            setPollQuestion('');
            setPollOptions(['', '']);
            flatListRef.current?.scrollToEnd({ animated: true });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to create poll');
        } finally {
            setSending(false);
        }
    };

    const handleVote = async (messageId, optionIndex) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/messages/${messageId}/vote`,
                { optionIndex },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state
            setMessages(messages.map(m =>
                m._id === messageId ? response.data : m
            ));
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to vote');
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() && !attachment) return;

        setSending(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const formData = new FormData();

            if (newMessage.trim()) {
                formData.append('content', newMessage);
            }

            if (attachment) {
                formData.append('attachment', {
                    uri: attachment.uri,
                    name: attachment.name,
                    type: attachment.mimeType,
                });
            }

            const response = await axios.post(
                `${API_URL}/messages/class/${classId}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            setMessages([...messages, response.data]);
            setNewMessage('');
            setAttachment(null);
            flatListRef.current?.scrollToEnd({ animated: true });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const deleteMessage = async (messageId) => {
        Alert.alert(
            'Delete Message',
            'Are you sure you want to delete this message?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.delete(`${API_URL}/messages/${messageId}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            setMessages(messages.filter((m) => m._id !== messageId));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete message');
                        }
                    },
                },
            ]
        );
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 24) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const renderMessage = ({ item }) => {
        if (!item) return null;

        const sender = item.sender || {};
        const isOwnMessage = sender._id && user?.id && sender._id === user.id;

        if (item.isPoll) {
            const totalVotes = item.pollOptions ? item.pollOptions.reduce((acc, opt) => acc + opt.votes.length, 0) : 0;

            return (
                <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage, styles.pollContainer]}>
                    {!isOwnMessage && (
                        <Text style={styles.senderName}>
                            {sender.name || 'Unknown User'} {sender.role === 'staff' ? '(staff)' : ''}
                        </Text>
                    )}
                    <Text style={[styles.pollQuestion, isOwnMessage && styles.ownMessageText]}>{item.pollQuestion}</Text>
                    {item.pollOptions && item.pollOptions.map((option, index) => {
                        const voteCount = option.votes.length;
                        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                        const hasVoted = option.votes.includes(user?.id);

                        return (
                            <TouchableOpacity
                                key={index}
                                style={styles.pollOption}
                                onPress={() => handleVote(item._id, index)}
                                disabled={hasVoted}
                            >
                                <View style={[styles.progressBar, { width: `${percentage}%` }]} />
                                <View style={styles.pollOptionContent}>
                                    <Text style={styles.pollOptionText}>{option.option}</Text>
                                    <Text style={styles.pollVoteCount}>{voteCount} votes</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                    <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
                        {formatTime(item.createdAt)}
                    </Text>
                </View>
            );
        }

        return (
            <TouchableOpacity
                style={[
                    styles.messageContainer,
                    isOwnMessage ? styles.ownMessage : styles.otherMessage,
                ]}
                onLongPress={() => {
                    if (isOwnMessage || user?.role === 'staff') {
                        deleteMessage(item._id);
                    }
                }}
            >
                {!isOwnMessage && (
                    <Text style={styles.senderName}>
                        {sender.name || 'Unknown User'} {sender.role === 'staff' ? '(staff)' : ''}
                    </Text>
                )}

                {item.attachmentUrl && item.attachmentType === 'image' && (
                    <Image
                        source={{ uri: `${API_URL.replace('/api', '')}/${item.attachmentUrl}` }}
                        style={styles.messageImage}
                        resizeMode="cover"
                    />
                )}

                {item.attachmentUrl && item.attachmentType === 'pdf' && (
                    <View style={styles.pdfContainer}>
                        <Text style={styles.pdfIcon}>📄</Text>
                        <Text style={styles.pdfText}>PDF Attachment</Text>
                    </View>
                )}

                {item.content && (
                    <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
                        {item.content}
                    </Text>
                )}

                <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
                    {formatTime(item.createdAt)}
                </Text>
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
        <ImageBackground
            source={require('../../assets/chat_bg.png')}
            style={styles.backgroundImage}
            resizeMode="repeat"
        >
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                            <Text style={styles.backButtonText}>←</Text>
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.title}>Class Messages</Text>
                            <Text style={styles.subtitle}>{user?.role === 'staff' ? 'Staff Room' : 'Class Group'}</Text>
                        </View>
                    </View>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
                    }
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
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

                    <View style={styles.inputContainer}>
                        <View style={styles.inputActions}>
                            <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
                                <Text style={styles.attachIcon}>📷</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.attachButton} onPress={pickDocument}>
                                <Text style={styles.attachIcon}>📎</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.attachButton} onPress={() => setShowPollModal(true)}>
                                <Text style={styles.attachIcon}>📊</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            placeholderTextColor={colors.textSecondary}
                            value={newMessage}
                            onChangeText={setNewMessage}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (!newMessage.trim() && !attachment || sending) && styles.sendButtonDisabled]}
                            onPress={sendMessage}
                            disabled={(!newMessage.trim() && !attachment) || sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color={colors.white} />
                            ) : (
                                <Text style={styles.sendButtonText}>➤</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

                <Modal
                    visible={showPollModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowPollModal(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Create Poll</Text>

                            <TextInput
                                style={styles.pollInput}
                                placeholder="Ask a question..."
                                value={pollQuestion}
                                onChangeText={setPollQuestion}
                            />

                            <ScrollView style={styles.optionsList}>
                                {pollOptions.map((option, index) => (
                                    <TextInput
                                        key={index}
                                        style={styles.optionInput}
                                        placeholder={`Option ${index + 1}`}
                                        value={option}
                                        onChangeText={(text) => handleOptionChange(text, index)}
                                    />
                                ))}
                            </ScrollView>

                            {pollOptions.length < 5 && (
                                <TouchableOpacity style={styles.addOptionButton} onPress={handleAddOption}>
                                    <Text style={styles.addOptionText}>+ Add Option</Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setShowPollModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.createButton]}
                                    onPress={createPoll}
                                >
                                    <Text style={styles.createButtonText}>Create Poll</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButtonText: {
        fontSize: 24,
        color: colors.primary,
        fontWeight: '600',
    },
    headerTitleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesList: {
        padding: 16,
        flexGrow: 1,
    },
    messageContainer: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 20,
        marginBottom: 12,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    ownMessage: {
        alignSelf: 'flex-end',
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    otherMessage: {
        alignSelf: 'flex-start',
        backgroundColor: colors.white,
        borderBottomLeftRadius: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    messageText: {
        fontSize: 16,
        color: colors.textPrimary,
        lineHeight: 22,
    },
    ownMessageText: {
        color: colors.white,
    },
    messageTime: {
        fontSize: 10,
        color: colors.textSecondary,
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    ownMessageTime: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    senderName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 4,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight || '#e0e0e0',
        alignItems: 'flex-end',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 5,
    },
    inputActions: {
        flexDirection: 'row',
        marginRight: 8,
        marginBottom: 6,
    },
    input: {
        flex: 1,
        backgroundColor: '#f0f2f5',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        paddingTop: 10,
        marginRight: 12,
        maxHeight: 100,
        fontSize: 16,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    sendButton: {
        backgroundColor: colors.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    sendButtonDisabled: {
        backgroundColor: colors.gray,
    },
    sendButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 20,
        marginLeft: 2,
    },
    attachButton: {
        padding: 6,
    },
    attachIcon: {
        fontSize: 22,
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
        marginBottom: 4,
    },
    pdfContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 4,
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
    attachmentPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#f0f2f5',
        borderTopWidth: 1,
        borderTopColor: colors.border,
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
    pollContainer: {
        minWidth: 260,
    },
    pollQuestion: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: colors.textPrimary,
    },
    pollOption: {
        marginBottom: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        height: 44,
        justifyContent: 'center',
    },
    progressBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 122, 255, 0.2)', // Light primary color
    },
    pollOptionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        zIndex: 1,
    },
    pollOptionText: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    pollVoteCount: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 24,
        maxHeight: '80%',
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: colors.primary,
    },
    pollInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    optionsList: {
        maxHeight: 200,
    },
    optionInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        fontSize: 14,
        backgroundColor: '#f9f9f9',
    },
    addOptionButton: {
        padding: 12,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 12,
        borderStyle: 'dashed',
    },
    addOptionText: {
        color: colors.primary,
        fontWeight: '600',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f2f5',
    },
    createButton: {
        backgroundColor: colors.primary,
    },
    cancelButtonText: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
    createButtonText: {
        color: colors.white,
        fontWeight: 'bold',
    },
});

export default ClassMessagesScreen;
