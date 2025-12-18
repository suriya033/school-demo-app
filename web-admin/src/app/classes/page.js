'use client';

import React, { useEffect, useState } from 'react';
import styles from './classes.module.css';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import api from '@/utils/api';

export default function ClassesPage() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', section: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/classes');
            setClasses(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching classes:', error);
            setClasses([]); // Fallback to empty array
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/classes', formData);
            setShowModal(false);
            setFormData({ name: '', section: '' });
            fetchClasses();
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating class');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this class?')) {
            try {
                await api.delete(`/classes/${id}`);
                fetchClasses();
            } catch (error) {
                alert('Error deleting class');
            }
        }
    };

    const columns = [
        { key: 'name', label: 'Class Name' },
        { key: 'section', label: 'Section' },
        {
            key: 'students',
            label: 'Students Count',
            render: (val) => val?.length || 0
        },
        {
            key: 'actions',
            label: 'Actions',
            width: '150px',
            render: (_, row) => (
                <div className={styles.actions}>
                    <button className={styles.deleteBtn} onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(row._id);
                    }}>Delete</button>
                </div>
            )
        }
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Class Management</h1>
                    <p>Organize and manage school classes and sections</p>
                </div>
                <Button variant="primary" onClick={() => setShowModal(true)}>+ Add New Class</Button>
            </header>

            <div className={styles.grid}>
                {loading ? (
                    <div className={styles.loading}>Loading classes...</div>
                ) : (
                    classes.map((cls) => (
                        <Card key={cls._id} title={cls.name} icon="🏫" className={styles.classCard}>
                            <div className={styles.classInfo}>
                                <div className={styles.infoRow}>
                                    <span>Section:</span>
                                    <strong>{cls.section}</strong>
                                </div>
                                <div className={styles.infoRow}>
                                    <span>Students:</span>
                                    <strong>{cls.students?.length || 0}</strong>
                                </div>
                            </div>
                            <div className={styles.cardActions}>
                                <button className={styles.viewBtn}>View Details</button>
                                <button className={styles.deleteIconBtn} onClick={() => handleDelete(cls._id)}>🗑️</button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} glass animate-fade-in`}>
                        <h2>Add New Class</h2>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <Input
                                label="Class Name"
                                placeholder="e.g. Class 10"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Section"
                                placeholder="e.g. A"
                                value={formData.section}
                                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                required
                            />
                            <div className={styles.modalActions}>
                                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" loading={submitting}>Create Class</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
