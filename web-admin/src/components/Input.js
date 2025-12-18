import React from 'react';
import styles from './Input.module.css';

const Input = ({ label, type = 'text', value, onChange, placeholder, error, className = '' }) => {
    return (
        <div className={`${styles.container} ${className}`}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.inputWrapper}>
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`${styles.input} ${error ? styles.errorInput : ''}`}
                />
            </div>
            {error && <p className={styles.errorText}>{error}</p>}
        </div>
    );
};

export default Input;
