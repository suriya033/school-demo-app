'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import Input from '@/components/Input';
import Button from '@/components/Button';
import api from '@/utils/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            router.push('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.background}>
                <div className={styles.circle1}></div>
                <div className={styles.circle2}></div>
            </div>

            <div className={`${styles.loginCard} glass animate-fade-in`}>
                <div className={styles.header}>
                    <div className={styles.logo}>🏫</div>
                    <h1>Welcome Back</h1>
                    <p>Sign in to manage your school data</p>
                </div>

                <form onSubmit={handleLogin} className={styles.form}>
                    {error && <div className={styles.errorAlert}>{error}</div>}

                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="admin@school.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <div className={styles.forgotPassword}>
                        <a href="#">Forgot password?</a>
                    </div>

                    <Button type="submit" loading={loading} className={styles.submitBtn}>
                        Sign In
                    </Button>
                </form>

                <div className={styles.footer}>
                    <p>Don't have an account? <a href="#">Contact Admin</a></p>
                </div>
            </div>
        </div>
    );
}
