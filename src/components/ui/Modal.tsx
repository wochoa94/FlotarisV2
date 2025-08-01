import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  headerContent,
  footerContent,
  maxWidth = '2xl',
}: ModalProps) {
  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className={`relative bg-white rounded-lg shadow-xl w-full mx-4 ${maxWidthClass} ${className}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            {headerContent ? (
              headerContent
            ) : (
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="mb-6">
            {children}
          </div>

          {/* Footer */}
          {footerContent && (
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              {footerContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}