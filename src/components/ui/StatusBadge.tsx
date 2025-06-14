import React from 'react';

interface StatusBadgeProps {
  status: 'active' | 'maintenance' | 'idle';
  className?: string;
}

const statusConfig = {
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  maintenance: {
    label: 'Maintenance',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  idle: {
    label: 'Idle',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}>
      {config.label}
    </span>
  );
}