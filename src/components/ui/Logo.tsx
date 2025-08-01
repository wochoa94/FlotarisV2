// src/components/ui/Logo.tsx
import React from 'react';
import { useTheme } from '../../theme';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  const { logoUrl } = useTheme();

  return (
    <img src={logoUrl} alt="Flotaris Logo" className={className} />
  );
}