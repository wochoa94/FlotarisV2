// src/theme/colors.ts
export const themes = {
  default: {
    '--color-primary': '#073459', // blue-600
    '--color-primary-hover': '#094C84', // blue-700
    '--color-primary-400': '#60A5FA', // lighter blue for active background
    '--color-primary-focus-ring': '#266FC8', // blue-500
    '--color-secondary': '#F28325', // gray-600
    '--color-secondary-hover': '#EEB17E', // gray-700
    '--color-secondary-700': '#D97706', // darker orange for active text/icon
    '--color-secondary-focus-ring': '#D26000', // gray-500
    '--color-success': '#A9D6C0', // green-500
    '--color-success-hover': '#32674E', // green-600
    '--color-success-focus-ring': '#64B48E', // green-400
    '--color-warning': '#F5C870', // yellow-500
    '--color-warning-hover': '#F8DAA0', // yellow-600
    '--color-warning-focus-ring': '#F0AC29', // yellow-300
    '--color-danger': '#EBADAD', // red-500
    '--color-danger-hover': '#D75B5B', // red-600
    '--color-danger-focus-ring': '#CD3232', // red-400
    '--color-info': '#E2F2FF', // blue-500
    '--color-info-hover': '#B8DEFE', // blue-600
    '--color-info-focus-ring': '#2C94EB', // blue-400
    '--color-background': '#FAFAFA', // gray-50
    '--color-background-alt': '', // white
    '--color-text-default': '#073459', // gray-900
    '--color-text-secondary': '#B8DEFE', // gray-500
    '--color-border': '#EEEFF3', // gray-200
    '--color-input-border': '#C1C4D7', // gray-300
    '--color-input-placeholder': '#9A9EB4', // gray-400
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