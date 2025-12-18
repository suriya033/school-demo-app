'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import styles from './LayoutWrapper.module.css';

export default function LayoutWrapper({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token && pathname !== '/login') {
            router.push('/login');
        } else if (token) {
            setIsLoggedIn(true);
        }
        setLoading(false);
    }, [pathname, router]);

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    if (pathname === '/login') {
        return <>{children}</>;
    }

    return (
        <div className={styles.container}>
            <Sidebar />
            <main className={styles.main}>
                <div className={styles.content}>
                    {children}
                </div>
            </main>
        </div>
    );
}
