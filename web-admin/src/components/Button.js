import React from 'react';
import styles from './Button.module.css';

const Button = ({ children, onClick, type = 'button', variant = 'primary', loading = false, disabled = false, className = '' }) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${styles.button} ${styles[variant]} ${className}`}
        >
            {loading ? <span className={styles.loader}></span> : children}
        </button>
    );
};

export default Button;
