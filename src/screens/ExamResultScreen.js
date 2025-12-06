import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import colors from '../constants/colors';
import { API_URL } from '../config';

const ExamResultScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedResult, setSelectedResult] = useState(null);

    useEffect(() => {
        getUser();
    }, []);

    const getUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            fetchResults(parsedUser.id);
        }
    };

    const fetchResults = async (studentId) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_URL}/exam-results?studentId=${studentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResults(response.data);
            if (response.data.length > 0) {
                setSelectedResult(response.data[0]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getGradeColor = (grade) => {
        if (grade === 'A+' || grade === 'A') return colors.success;
        if (grade === 'B+' || grade === 'B') return colors.primary;
        if (grade === 'C') return colors.accent;
        return colors.danger;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Exam Results</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : results.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📊</Text>
                    <Text style={styles.emptyText}>No exam results available yet</Text>
                </View>
            ) : (
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {/* Exam Selector */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.examSelector}
                    >
                        {results.map((result) => (
                            <TouchableOpacity
                                key={result._id}
                                style={[
                                    styles.examButton,
                                    selectedResult?._id === result._id && styles.examButtonActive
                                ]}
                                onPress={() => setSelectedResult(result)}
                            >
                                <Text style={[
                                    styles.examButtonText,
                                    selectedResult?._id === result._id && styles.examButtonTextActive
                                ]}>
                                    {result.examName}
                                </Text>
                                <Text style={[
                                    styles.examTypeText,
                                    selectedResult?._id === result._id && styles.examButtonTextActive
                                ]}>
                                    {result.examType}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {selectedResult && (
                        <View style={styles.resultContainer}>
                            {/* Overall Summary */}
                            <View style={styles.summaryCard}>
                                <Text style={styles.examTitle}>{selectedResult.examName}</Text>
                                <Text style={styles.examSubtitle}>
                                    {selectedResult.examType} • {selectedResult.academicYear}
                                </Text>

                                <View style={styles.overallStats}>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statLabel}>Total Marks</Text>
                                        <Text style={styles.statValue}>
                                            {selectedResult.totalMarksObtained}/{selectedResult.totalMarks}
                                        </Text>
                                    </View>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statLabel}>Percentage</Text>
                                        <Text style={styles.statValue}>
                                            {selectedResult.percentage.toFixed(2)}%
                                        </Text>
                                    </View>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statLabel}>Grade</Text>
                                        <Text style={[
                                            styles.statValue,
                                            { color: getGradeColor(selectedResult.overallGrade) }
                                        ]}>
                                            {selectedResult.overallGrade}
                                        </Text>
                                    </View>
                                </View>

                                {selectedResult.rank && (
                                    <View style={styles.rankBadge}>
                                        <Text style={styles.rankText}>🏆 Rank: {selectedResult.rank}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Subject-wise Results */}
                            <Text style={styles.sectionTitle}>Subject-wise Performance</Text>
                            {selectedResult.subjects.map((subject, index) => {
                                const percentage = (subject.marksObtained / subject.totalMarks) * 100;
                                return (
                                    <View key={index} style={styles.subjectCard}>
                                        <View style={styles.subjectHeader}>
                                            <Text style={styles.subjectName}>
                                                {subject.subject?.name || 'N/A'}
                                            </Text>
                                            <View style={[
                                                styles.gradeBadge,
                                                { backgroundColor: getGradeColor(subject.grade) }
                                            ]}>
                                                <Text style={styles.gradeText}>{subject.grade}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.marksRow}>
                                            <Text style={styles.marksText}>
                                                Marks: {subject.marksObtained}/{subject.totalMarks}
                                            </Text>
                                            <Text style={styles.percentageText}>
                                                {percentage.toFixed(1)}%
                                            </Text>
                                        </View>

                                        {/* Progress Bar */}
                                        <View style={styles.progressBar}>
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    {
                                                        width: `${percentage}%`,
                                                        backgroundColor: getGradeColor(subject.grade)
                                                    }
                                                ]}
                                            />
                                        </View>

                                        {subject.remarks && (
                                            <Text style={styles.remarks}>💬 {subject.remarks}</Text>
                                        )}
                                    </View>
                                );
                            })}

                            {selectedResult.remarks && (
                                <View style={styles.overallRemarksCard}>
                                    <Text style={styles.remarksTitle}>Overall Remarks</Text>
                                    <Text style={styles.remarksText}>{selectedResult.remarks}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>
            )}
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        fontSize: 28,
        color: colors.primary,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    examSelector: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        maxHeight: 100,
    },
    examButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginRight: 12,
        borderRadius: 12,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 150,
    },
    examButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    examButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    examTypeText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    examButtonTextActive: {
        color: colors.white,
    },
    resultContainer: {
        paddingHorizontal: 20,
    },
    summaryCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    examTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    examSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 20,
    },
    overallStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.background,
        borderRadius: 10,
        marginHorizontal: 4,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 6,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    rankBadge: {
        backgroundColor: '#FFF8E1',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    rankText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.accent,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 12,
    },
    subjectCard: {
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
    subjectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    subjectName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        flex: 1,
    },
    gradeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    gradeText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: 'bold',
    },
    marksRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    marksText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    percentageText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    progressBar: {
        height: 8,
        backgroundColor: colors.background,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    remarks: {
        fontSize: 13,
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginTop: 4,
    },
    overallRemarksCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    remarksTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    remarksText: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
});

export default ExamResultScreen;
