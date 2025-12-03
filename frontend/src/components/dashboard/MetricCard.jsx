import React from 'react';

const MetricCard = ({ title, value, unit, icon, color = '#3b82f6' }) => {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={{ fontSize: '2rem' }}>{icon}</span>
        <h3 style={styles.title}>{title}</h3>
      </div>
      <div style={styles.value}>
        <span style={{ color }}>{value}</span>
        <span style={styles.unit}>{unit}</span>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: 'var(--shadow)',
    transition: 'all 0.3s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  value: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
    fontSize: '1.75rem',
    fontWeight: '700',
  },
  unit: {
    fontSize: '0.875rem',
    color: 'var(--text-tertiary)',
    fontWeight: '500',
  },
};

export default MetricCard;
