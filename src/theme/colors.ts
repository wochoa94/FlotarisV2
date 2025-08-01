// src/theme/colors.ts
export const themes = {
  default: {
    '--color-primary': '#2563eb', // blue-600
    '--color-primary-hover': '#1d4ed8', // blue-700
    '--color-primary-focus-ring': '#3b82f6', // blue-500
    '--color-secondary': '#4b5563', // gray-600
    '--color-secondary-hover': '#374151', // gray-700
    '--color-secondary-focus-ring': '#6b7280', // gray-500
    '--color-success': '#10b981', // green-500
    '--color-success-hover': '#059669', // green-600
    '--color-success-focus-ring': '#34d399', // green-400
    '--color-warning': '#f59e0b', // yellow-500
    '--color-warning-hover': '#d97706', // yellow-600
    '--color-warning-focus-ring': '#fcd34d', // yellow-300
    '--color-danger': '#ef4444', // red-500
    '--color-danger-hover': '#dc2626', // red-600
    '--color-danger-focus-ring': '#f87171', // red-400
    '--color-info': '#3b82f6', // blue-500
    '--color-info-hover': '#2563eb', // blue-600
    '--color-info-focus-ring': '#60a5fa', // blue-400
    '--color-background': '#f9fafb', // gray-50
    '--color-background-alt': '#ffffff', // white
    '--color-text-default': '#111827', // gray-900
    '--color-text-secondary': '#6b7280', // gray-500
    '--color-border': '#e5e7eb', // gray-200
    '--color-input-border': '#d1d5db', // gray-300
    '--color-input-placeholder': '#9ca3af', // gray-400
  },
  customerA: {
    '--color-primary': '#8b5cf6', // purple-500
    '--color-primary-hover': '#7c3aed', // purple-600
    '--color-primary-focus-ring': '#a78bfa', // purple-400
    '--color-secondary': '#374151', // gray-700
    '--color-secondary-hover': '#1f2937', // gray-900
    '--color-secondary-focus-ring': '#6b7280', // gray-500
    '--color-success': '#10b981',
    '--color-success-hover': '#059669',
    '--color-success-focus-ring': '#34d399',
    '--color-warning': '#f59e0b',
    '--color-warning-hover': '#d97706',
    '--color-warning-focus-ring': '#fcd34d',
    '--color-danger': '#ef4444',
    '--color-danger-hover': '#dc2626',
    '--color-danger-focus-ring': '#f87171',
    '--color-info': '#60a5fa', // blue-400
    '--color-info-hover': '#3b82f6', // blue-500
    '--color-info-focus-ring': '#93c5fd', // blue-300
    '--color-background': '#f3f4f6', // gray-100
    '--color-background-alt': '#ffffff',
    '--color-text-default': '#1f2937', // gray-800
    '--color-text-secondary': '#4b5563', // gray-600
    '--color-border': '#d1d5db', // gray-300
    '--color-input-border': '#9ca3af', // gray-400
    '--color-input-placeholder': '#6b7280', // gray-500
  },
  // Add more themes as needed
};

export type ThemeName = keyof typeof themes;