import React from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'info' | 'warning' | 'conflict' | 'authorization' | 'network';
  message: string;
  onDismiss?: () => void;
  children?: React.ReactNode;
}

const alertConfig = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: <CheckCircle className="h-5 w-5 text-green-400" />,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: <AlertCircle className="h-5 w-5 text-red-400" />,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: <AlertCircle className="h-5 w-5 text-blue-400" />,
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
  },
  conflict: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    icon: <AlertTriangle className="h-5 w-5 text-orange-400" />,
  },
  authorization: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-800',
    icon: <AlertTriangle className="h-5 w-5 text-purple-400" />,
  },
  network: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: <AlertTriangle className="h-5 w-5 text-blue-400" />,
  },
};

export function Alert({ type, message, onDismiss, children }: AlertProps) {
  const config = alertConfig[type];

  return (
    <div className={`rounded-md border p-4 transition-all duration-300 ${config.bg} ${config.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex">
          <div className="flex-shrink-0">
            {config.icon}
          </div>
          <div className="ml-3">
            <p className={`text-sm font-medium ${config.text}`}>{message}</p>
            {children}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`transition-colors duration-200 hover:opacity-75 ${config.text}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}