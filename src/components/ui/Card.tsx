import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export function Card({ children, className = '', size, ...props }: CardProps) {
  const baseClasses = 'bg-background-alt shadow rounded-lg border border-border hover:shadow-md transition-shadow duration-200';
  
  let sizeClasses = '';
  
  switch (size) {
    case 'small':
      sizeClasses = 'h-[70px] w-[440.667px] flex items-center gap-[30px]';
      break;
    case 'medium':
      sizeClasses = 'h-[250px] w-[675.5px] p-[20px] flex justify-center items-center content-center gap-[10px] flex-wrap';
      break;
    case 'large':
      sizeClasses = 'h-[320px] w-[438.667px] p-[0_20px_56px_20px] flex flex-col justify-center items-center gap-[16px]';
      break;
    default:
      sizeClasses = '';
  }
  
  // For small cards, apply specific padding
  const paddingClasses = size === 'small' ? 'pl-[20px] pr-[40px] py-[20px]' : '';
  
  return (
    <div className={`${baseClasses} ${sizeClasses} ${paddingClasses} ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`px-4 py-5 sm:px-6 border-b border-border ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function CardBody({ children, className = '', ...props }: CardBodyProps) {
  return (
    <div className={`px-4 py-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}