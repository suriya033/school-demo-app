'use client';

import React, { useEffect, useState } from 'react';
import styles from './staff.module.css';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Input from '@/components/Input';
import api from '@/utils/api';

export default function StaffPage() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const response = await api.get('/staffs');
            setStaff(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching staff:', error);
            setStaff([]); // Fallback to empty array
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const headers = ['Name', 'Email', 'Role', 'Phone', 'Address', 'Register Number', 'Gender'];
        const csvContent = [
            headers.join(','),
            ...staff.map(s => [
                `"${s.name}"`,
                `"${s.email}"`,
                `"${s.role}"`,
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
        link.setAttribute('download', 'staff_details.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = () => {
        alert('Import functionality: Please select a CSV file to upload staff data.');
        // In a real app, this would open a file picker and send data to backend
    };

    const filteredStaff = staff.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.role?.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            key: 'name',
            label: 'Staff Member',
            render: (val, row) => (
                <div className={styles.staffInfo}>
                    <div className={styles.avatar}>{val?.charAt(0)}</div>
                    <div>
                        <div className={styles.name}>{val}</div>
                        <div className={styles.email}>{row.email}</div>
                    </div>
                </div>
            )
        },
        { key: 'role', label: 'Role' },
        {
            key: 'status',
            label: 'Status',
            render: (val) => (
                <span className={`${styles.badge} ${val === 'Active' ? styles.active : styles.pending}`}>
                    {val || 'Active'}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            width: '150px',
            render: (_, row) => (
                <div className={styles.actions}>
                    <button className={styles.viewBtn} onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStaff(row);
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
                    <h1>Staff Management</h1>
                    <p>Manage teachers, administrators, and other staff members</p>
                </div>
                <div className={styles.headerActions}>
                    <Button variant="secondary" onClick={handleImport}>Import CSV</Button>
                    <Button variant="secondary" onClick={handleExport}>Export CSV</Button>
                    <Button variant="primary">+ Add Staff Member</Button>
                </div>
            </header>

            <Card className={styles.tableCard}>
                <div className={styles.tableHeader}>
                    <div className={styles.searchWrapper}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search staff by name, email or role..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                <Table
                    columns={columns}
                    data={filteredStaff}
                    loading={loading}
                    onRowClick={(row) => {
                        setSelectedStaff(row);
                        setShowDetailsModal(true);
                    }}
                />
            </Card>

            {showDetailsModal && selectedStaff && (
                <div className={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
                    <div className={`${styles.detailsModal} glass animate-fade-in`} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Staff Details</h2>
                            <button className={styles.closeBtn} onClick={() => setShowDetailsModal(false)}>×</button>
                        </div>

                        <div className={styles.detailsContent}>
                            <div className={styles.profileSection}>
                                <div className={styles.largeAvatar}>{selectedStaff.name?.charAt(0)}</div>
                                <div className={styles.profileInfo}>
                                    <h3>{selectedStaff.name}</h3>
                                    <span className={styles.roleBadge}>{selectedStaff.role}</span>
                                </div>
                            </div>

                            <div className={styles.detailsGrid}>
                                <div className={styles.detailItem}>
                                    <label>Email Address</label>
                                    <p>{selectedStaff.email}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Phone Number</label>
                                    <p>{selectedStaff.phone || 'Not provided'}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Register Number</label>
                                    <p>{selectedStaff.registerNumber || 'N/A'}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Gender</label>
                                    <p>{selectedStaff.gender || 'Not specified'}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Date of Birth</label>
                                    <p>{selectedStaff.dateOfBirth ? new Date(selectedStaff.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Address</label>
                                    <p>{selectedStaff.address || 'No address provided'}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Assigned Class</label>
                                    <p>{selectedStaff.staffClass?.name || 'None'}</p>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Subjects</label>
                                    <p>{selectedStaff.staffSubjects?.map(s => s.name).join(', ') || 'None'}</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Close</Button>
                            <Button variant="primary">Edit Profile</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
