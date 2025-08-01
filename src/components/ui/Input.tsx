import React from 'react';

interface BaseInputProps {
  className?: string;
}

interface InputProps extends BaseInputProps, React.InputHTMLAttributes<HTMLInputElement> {
  as?: 'input';
}

interface TextareaProps extends BaseInputProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  as: 'textarea';
}

interface SelectProps extends BaseInputProps, React.SelectHTMLAttributes<HTMLSelectElement> {
  as: 'select';
  children: React.ReactNode;
}

type CombinedInputProps = InputProps | TextareaProps | SelectProps;

export function Input({ as = 'input', className, ...props }: CombinedInputProps) {
  const baseClasses = 'block w-full px-3 py-2 border border-input-border rounded-md shadow-sm placeholder-input-placeholder focus:outline-none focus:ring-primary-focus-ring focus:border-primary-focus-ring sm:text-sm transition-colors duration-200';

  if (as === 'textarea') {
    const { children, ...textareaProps } = props as TextareaProps;
    return (
      <textarea
        className={`${baseClasses} ${className || ''}`}
        {...textareaProps}
      />
    );
  }

  if (as === 'select') {
    const { children, ...selectProps } = props as SelectProps;
    return (
      <select
        className={`${baseClasses} ${className || ''}`}
        {...selectProps}
      >
        {children}
      </select>
    );
  }

  const { children, ...inputProps } = props as InputProps;
  return (
    <input
      className={`${baseClasses} ${className || ''}`}
      {...inputProps}
    />
  );
}