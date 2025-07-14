import React from 'react';

interface StatusBadgeProps {
  status: 'active' | 'maintenance' | 'idle';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  active: {
    label: 'Active',
    className: 'badge-success',
  },
  maintenance: {
    label: 'Maintenance',
    className: 'badge-warning',
  },
  idle: {
    label: 'Idle',
    className: 'badge-danger',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export function StatusBadge({ status, className = '', size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={`badge ${config.className} ${sizeClasses[size]} ${className}`}>
      {config.label}
    </span>
  );
}