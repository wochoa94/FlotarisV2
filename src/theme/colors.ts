// src/theme/colors.ts
export const themes = {
  default: {
    '--color-primary': '#073459', // Primary 900
    '--color-primary-hover': '#094C84', // Primary 800/Hover
    '--color-primary-400': '#266FC8', // Primary 700
    '--color-primary-focus-ring': '#2C94EB', // Info Focus Pressed
    '--color-secondary': '#F28325', // Secondary 700
    '--color-secondary-hover': '#EEB17E', // Secondary 600/Hover
    '--color-secondary-700': '#D26000', // Secondary 800
    '--color-secondary-focus-ring': '#D26000', // Secondary 800
    '--color-success': '#A9D6C0', // Success 600
    '--color-success-hover': '#32674E', // Success 800/Hover
    '--color-success-focus-ring': '#64B48E', // Success 700
    '--color-warning': '#F5C870', // Warning 700
    '--color-warning-hover': '#F8DAA0', // Warning 600/Hover
    '--color-warning-focus-ring': '#F0AC29', // Warning 800
    '--color-danger': '#EBADAD', // Danger 600
    '--color-danger-hover': '#D75B5B', // Danger 700/Hover
    '--color-danger-focus-ring': '#CD3232', // Danger 800
    '--color-info': '#E2F2FF', // Info
    '--color-info-hover': '#B8DEFE', // Info Hover
    '--color-info-focus-ring': '#2C94EB', // Info Focus Pressed
    '--color-background': '#FAFAFA', // gray-50
    '--color-background-alt': '', // white
    '--color-text-default': '#073459', // gray-900
    '--color-text-secondary': '#266FC8', // Primary 700
    '--color-border': '#EEEFF3', // Color Border
    '--color-input-border': '#C1C4D7', // Input Border
    '--color-input-placeholder': '#9A9EB4', // Placeholder
    '--color-navbar-text': '#B8DEFE', //Text for navigation bar text
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