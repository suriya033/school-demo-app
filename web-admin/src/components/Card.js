import React from 'react';
import styles from './Card.module.css';

const Card = ({ children, title, icon, className = '' }) => {
    return (
        <div className={`${styles.card} glass ${className}`}>
            {(title || icon) && (
                <div className={styles.header}>
                    {icon && <span className={styles.icon}>{icon}</span>}
                    {title && <h3 className={styles.title}>{title}</h3>}
                </div>
            )}
            <div className={styles.content}>
                {children}
            </div>
        </div>
    );
};

export default Card;
