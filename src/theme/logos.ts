// src/theme/logos.ts
export const logos = {
  default: '/vite.svg', // Path to your default logo
  customerA: 'https://via.placeholder.com/150x50?text=CustomerA+Logo', // Example placeholder for Customer A
  // Add more logo paths for other themes
};

export type LogoName = keyof typeof logos;