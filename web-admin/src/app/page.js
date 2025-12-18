'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import Card from '@/components/Card';
import api from '@/utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalStaff: 0,
    totalFees: 0,
  });
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const fetchItem = async (url) => {
        try {
          const res = await api.get(url);
          return res.data;
        } catch (err) {
          console.error(`Error fetching ${url}:`, err);
          return [];
        }
      };

      const [classes, students, staff, fees] = await Promise.all([
        fetchItem('/classes'),
        fetchItem('/students'),
        fetchItem('/staffs'),
        fetchItem('/fees'),
      ]);

      setStats({
        totalClasses: Array.isArray(classes) ? classes.length : 0,
        totalStudents: Array.isArray(students) ? students.length : 0,
        totalStaff: Array.isArray(staff) ? staff.length : 0,
        totalFees: Array.isArray(fees) ? fees.reduce((acc, fee) => acc + (fee.amount || 0), 0) : 0,
      });
      setDbStatus('Connected');
    } catch (error) {
      console.error('Error in fetchStats:', error);
      setDbStatus('Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <h1>Dashboard Overview</h1>
          <div className={styles.statusBadge}>
            <span className={styles.statusDot} style={{ backgroundColor: dbStatus === 'Connected' ? 'var(--success)' : 'var(--danger)' }}></span>
            Database: {dbStatus}
          </div>
          <p>Welcome back, {user?.name || 'Admin'}! Here's what's happening today.</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.refreshBtn} onClick={fetchStats} disabled={loading}>
            {loading ? '⏳' : '🔄'}
          </button>
          <div className={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <Card title="Total Students" icon="👨‍🎓">
          <div className={styles.statValue}>{loading ? '...' : stats.totalStudents}</div>
          <div className={styles.statTrend}>↑ 12% from last month</div>
        </Card>
        <Card title="Total Staff" icon="👨‍🏫">
          <div className={styles.statValue}>{loading ? '...' : stats.totalStaff}</div>
          <div className={styles.statTrend}>↑ 4% from last month</div>
        </Card>
        <Card title="Total Classes" icon="🏫">
          <div className={styles.statValue}>{loading ? '...' : stats.totalClasses}</div>
          <div className={styles.statTrend}>Stable</div>
        </Card>
        <Card title="Revenue" icon="💰">
          <div className={styles.statValue}>{loading ? '...' : `₹${stats.totalFees.toLocaleString()}`}</div>
          <div className={styles.statTrend}>↑ 8% from last month</div>
        </Card>
      </div>

      <div className={styles.mainGrid}>
        <Card title="Recent Activity" icon="⚡" className={styles.activityCard}>
          <div className={styles.activityList}>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>📝</div>
              <div className={styles.activityInfo}>
                <p><strong>New Student Registered</strong></p>
                <span>Rahul Sharma joined Class 10A</span>
              </div>
              <div className={styles.activityTime}>2 mins ago</div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>📢</div>
              <div className={styles.activityInfo}>
                <p><strong>Notice Published</strong></p>
                <span>Winter vacation announced</span>
              </div>
              <div className={styles.activityTime}>1 hour ago</div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>💰</div>
              <div className={styles.activityInfo}>
                <p><strong>Fee Payment Received</strong></p>
                <span>Priya Patel paid Term 2 fees</span>
              </div>
              <div className={styles.activityTime}>3 hours ago</div>
            </div>
          </div>
        </Card>

        <Card title="Quick Actions" icon="🚀" className={styles.actionsCard}>
          <div className={styles.actionsGrid}>
            <button className={styles.actionBtn} onClick={() => window.location.href = '/students'}>
              <span className={styles.actionIcon}>👨‍🎓</span>
              <span>Add Student</span>
            </button>
            <button className={styles.actionBtn} onClick={() => window.location.href = '/staff'}>
              <span className={styles.actionIcon}>👨‍🏫</span>
              <span>Add Staff</span>
            </button>
            <button className={styles.actionBtn} onClick={() => window.location.href = '/notices'}>
              <span className={styles.actionIcon}>📢</span>
              <span>Create Notice</span>
            </button>
            <button className={styles.actionBtn}>
              <span className={styles.actionIcon}>📊</span>
              <span>Reports</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
