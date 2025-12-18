'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

const menuItems = [
    { icon: '📊', label: 'Dashboard', path: '/' },
    { icon: '🏫', label: 'Classes', path: '/classes' },
    { icon: '📚', label: 'Subjects', path: '/subjects' },
    { icon: '👨‍🎓', label: 'Students', path: '/students' },
    { icon: '👨‍🏫', label: 'Staff', path: '/staff' },
    { icon: '📋', label: 'Attendance', path: '/attendance' },
    { icon: '💰', label: 'Fees', path: '/fees' },
    { icon: '📢', label: 'Notices', path: '/notices' },
];

const Sidebar = () => {
    const pathname = usePathname();

    return (
        <aside className={`${styles.sidebar} glass`}>
            <div className={styles.logo}>
                <span className={styles.logoIcon}>🏫</span>
                <span className={styles.logoText}>SchoolAdmin</span>
            </div>

            <nav className={styles.nav}>
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
                    >
                        <span className={styles.icon}>{item.icon}</span>
                        <span className={styles.label}>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className={styles.footer}>
                <button className={styles.logoutBtn} onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }}>
                    <span className={styles.icon}>🚪</span>
                    <span className={styles.label}>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
