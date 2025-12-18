'use client';

import React, { useEffect, useState } from 'react';
import styles from './students.module.css';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import api from '@/utils/api';

export default function StudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/students');
            setStudents(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching students:', error);
            setStudents([]); // Fallback to empty array
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const headers = ['Roll No', 'Name', 'Email', 'Class', 'Phone', 'Address', 'Register Number', 'Gender'];
        const csvContent = [
            headers.join(','),
            ...students.map(s => [
                `"${s.rollNumber || ''}"`,
                `"${s.name}"`,
                `"${s.email}"`,
                `"${s.studentClass?.name || ''}"`,
                `"${s.phone || ''}"`,
                `"${s.address || ''}"`,
                `"${s.registerNumber || ''}"`,
                `"${s.gender || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'student_details.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = () => {
        alert('Import functionality: Please select a CSV file to upload student data.');
    };

    const filteredStudents = students.filter(student =>
        student.name?.toLowerCase().includes(search.toLowerCase()) ||
        student.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
        student.studentClass?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { key: 'rollNumber', label: 'Roll No', width: '100px' },
        {
            key: 'name',
            label: 'Name',
            render: (val, row) => (
                <div className={styles.studentName}>
                    <div className={styles.avatar}>{val?.charAt(0)}</div>
                    <span>{val}</span>
                </div>
            )
        },
        {
            key: 'studentClass',
            label: 'Class',
            render: (val) => val?.name || 'N/A'
        },
        { key: 'email', label: 'Email' },
        {
            key: 'actions',
            label: 'Actions',
            width: '150px',
            render: (_, row) => (
                <div className={styles.actions}>
                    <button className={styles.viewBtn} onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudent(row);
                        setShowDetailsModal(true);
                    }}>View</button>
                    <button className={styles.deleteBtn} onClick={(e) => e.stopPropagation()}>Delete</button>
                </div>
            )
        }
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Student Management</h1>
                    <p>View and manage all students in the system</p>
                </div>
                <div className={styles.headerActions}>
                    <Button variant="secondary" onClick={handleImport}>Import CSV</Button>
                    <Button variant="secondary" onClick={handleExport}>Export CSV</Button>
                    <Button variant="primary">+ Add New Student</Button>
                </div>
            </header>

            <Card className={styles.tableCard}>
                <div className={styles.tableHeader}>
                    <div className={styles.searchWrapper}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search by name, roll number or class..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                <Table
                    columns={columns}
                    data={filteredStudents}
                    loading={loading}
                    onRowClick={(student) => {
                        setSelectedStudent(student);
                        setShowDetailsModal(true);
                    }}
                />
            </Card>

            {showDetailsModal && selectedStudent && (
                <div className={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
                    <div className={`${styles.detailsModal} glass animate-fade-in`} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Student Details</h2>
                            <button className={styles.closeBtn} onClick={() => setShowDetailsModal(false)}>×</button>
                        </div>

                        <div className={styles.detailsContent}>
                            <div className={styles.profileSection}>
                                <div className={styles.largeAvatar}>{selectedStudent.name?.charAt(0)}</div>
                                <div className={styles.profileInfo}>
                                    <h3>{selectedStudent.name}</h3>
                                    <span className={styles.classBadge}>{selectedStudent.studentClass?.name || 'No Class'}</span>
                                </div>
                            </div>

                            <div className={styles.detailsGrid}>
                                <div className={styles.detailItem}>
                                    <label>Roll Number</label>
                                    <p>{selectedStudent.rollNumber || 'N/A'}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Email Address</label>
                                    <p>{selectedStudent.email}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Phone Number</label>
                                    <p>{selectedStudent.phone || 'Not provided'}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Register Number</label>
                                    <p>{selectedStudent.registerNumber || 'N/A'}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Gender</label>
                                    <p>{selectedStudent.gender || 'Not specified'}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Date of Birth</label>
                                    <p>{selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Address</label>
                                    <p>{selectedStudent.address || 'No address provided'}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Parent/Guardian</label>
                                    <p>{selectedStudent.parentId?.name || 'Not linked'}</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Close</Button>
                            <Button variant="primary">Edit Student</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
