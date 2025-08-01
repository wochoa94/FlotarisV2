import React from 'react';

interface BadgeProps {
  type: 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'blue' | 'purple' | 'red' | 'green' | 'yellow' | 'orange';
  label: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const typeConfig = {
  success: {
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  warning: {
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  danger: {
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  info: {
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  gray: {
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  blue: {
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  purple: {
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  red: {
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  green: {
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  yellow: {
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  orange: {
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export function Badge({ type, label, className = '', size = 'md' }: BadgeProps) {
  const config = typeConfig[type];
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium border ${config.className} ${sizeClasses[size]} ${className}`}>
      {label}
    </span>
  );
}