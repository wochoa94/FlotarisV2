// src/components/ui/Logo.tsx
import React from 'react';
import { useTheme } from '../../theme';
import { LogoName, logos } from '../../theme/logos';

interface LogoProps {
  className?: string;
  logoKey?: LogoName;
}

export function Logo({ className, logoKey }: LogoProps) {
  const { logoUrl, themeName } = useTheme();
  
  // Use specific logo if logoKey is provided, otherwise use theme's default logo
  const selectedLogoUrl = logoKey ? logos[logoKey] : logoUrl;

  return (
    <img src={selectedLogoUrl} alt="Flotaris Logo" className={className} />
  );
}