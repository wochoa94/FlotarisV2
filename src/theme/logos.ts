// src/theme/logos.ts
export const logos = {
  default: '/Frame 79.png', // Path to your default logo
  alternate: '/Frame 34.png', // Path to your alternate logo for navigation
  customerA: 'https://via.placeholder.com/150x50?text=CustomerA+Logo', // Example placeholder for Customer A
  // Add more logo paths for other themes
};

export type LogoName = keyof typeof logos;