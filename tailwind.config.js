/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-400': 'var(--color-primary-400)',
        'primary-focus-ring': 'var(--color-primary-focus-ring)',
        // Secondary colors
        secondary: 'var(--color-secondary)',
        'secondary-hover': 'var(--color-secondary-hover)',
        'secondary-700': 'var(--color-secondary-700)',
        'secondary-focus-ring': 'var(--color-secondary-focus-ring)',
        // Status colors
        success: 'var(--color-success)',
        'success-hover': 'var(--color-success-hover)',
        'success-focus-ring': 'var(--color-success-focus-ring)',
        warning: 'var(--color-warning)',
        'warning-hover': 'var(--color-warning-hover)',
        'warning-focus-ring': 'var(--color-warning-focus-ring)',
        danger: 'var(--color-danger)',
        'danger-hover': 'var(--color-danger-hover)',
        'danger-focus-ring': 'var(--color-danger-focus-ring)',
        info: 'var(--color-info)',
        'info-hover': 'var(--color-info-hover)',
        'info-focus-ring': 'var(--color-info-focus-ring)',
        // Backgrounds
        background: 'var(--color-background)',
        'background-alt': 'var(--color-background-alt)',
        // Text colors
        'text-default': 'var(--color-text-default)',
        'text-secondary': 'var(--color-text-secondary)',
        // Borders
        border: 'var(--color-border)',
        'input-border': 'var(--color-input-border)',
        'input-placeholder': 'var(--color-input-placeholder)',
      },
    },
  },
  plugins: [],
};
