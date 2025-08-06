// src/theme/logos.ts
export const logos = {
  default: 'https://www.figma.com/design/X6Q3jtH9wIIszPM8GHmDbR/Flotaris?node-id=0-1&t=31fBRNk1AZDZC8gT-1', // Path to your default logo
  customerA: 'https://via.placeholder.com/150x50?text=CustomerA+Logo', // Example placeholder for Customer A
  // Add more logo paths for other themes
};

export type LogoName = keyof typeof logos;