'use client';

import React, { useEffect, useState } from 'react';
import styles from './notices.module.css';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import api from '@/utils/api';

export default function NoticesPage() {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', content: '', targetAudience: 'All' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const response = await api.get('/notices');
            setNotices(response.data);
        } catch (error) {
            console.error('Error fetching notices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/notices', formData);
            setShowModal(false);
            setFormData({ title: '', content: '', targetAudience: 'All' });
            fetchNotices();
        } catch (error) {
            alert('Error creating notice');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Notice Board</h1>
                    <p>Broadcast announcements to students, staff, and parents</p>
                </div>
                <Button variant="primary" onClick={() => setShowModal(true)}>+ Create Notice</Button>
            </header>

            <div className={styles.noticeList}>
                {loading ? (
                    <div className={styles.loading}>Loading notices...</div>
                ) : notices.length > 0 ? (
                    notices.map((notice) => (
                        <Card key={notice._id} className={styles.noticeCard}>
                            <div className={styles.noticeHeader}>
                                <span className={styles.audienceBadge}>{notice.targetAudience}</span>
                                <span className={styles.date}>{new Date(notice.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h3 className={styles.noticeTitle}>{notice.title}</h3>
                            <p className={styles.noticeContent}>{notice.content}</p>
                            <div className={styles.noticeFooter}>
                                <span className={styles.author}>Posted by: {notice.author?.name || 'Admin'}</span>
                                <button className={styles.deleteBtn}>Delete</button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className={styles.empty}>No notices published yet.</div>
                )}
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} glass animate-fade-in`}>
                        <h2>Create New Notice</h2>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <Input
                                label="Notice Title"
                                placeholder="e.g. Annual Sports Day"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Content</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Enter notice details..."
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Target Audience</label>
                                <select
                                    className={styles.select}
                                    value={formData.targetAudience}
                                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                >
                                    <option value="All">All</option>
                                    <option value="Students">Students</option>
                                    <option value="Staff">Staff</option>
                                    <option value="Parents">Parents</option>
                                </select>
                            </div>
                            <div className={styles.modalActions}>
                                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" loading={submitting}>Publish Notice</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
