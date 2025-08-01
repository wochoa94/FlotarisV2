import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-background-alt shadow rounded-lg border border-border hover:shadow-md transition-shadow duration-200 ${className}`} {...props}>
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