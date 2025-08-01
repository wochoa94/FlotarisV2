import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className, ...props }: ButtonProps) {
  const baseClasses = 'inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200';
  let variantClasses = '';

  switch (variant) {
    case 'primary':
      variantClasses = 'border border-transparent text-white bg-primary hover:bg-primary-hover focus:ring-primary-focus-ring';
      break;
    case 'secondary':
      variantClasses = 'border border-input-border text-text-secondary bg-background-alt hover:bg-gray-50 focus:ring-primary-focus-ring';
      break;
    case 'danger':
      variantClasses = 'border border-transparent text-white bg-danger hover:bg-danger-hover focus:ring-danger-focus-ring';
      break;
    default:
      variantClasses = 'border border-transparent text-white bg-primary hover:bg-primary-hover focus:ring-primary-focus-ring';
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
}