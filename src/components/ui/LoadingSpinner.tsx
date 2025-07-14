import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function LoadingSpinner({ size = 'md', className = '', text }: LoadingSpinnerProps) {
  if (text) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
        <span className="text-sm text-gray-600">{text}</span>
      </div>
    );
  }
  
  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
}