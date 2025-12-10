import React from 'react';

interface InputProps {
  className?: string;
  [key: string]: any;
}

export const Input = ({ className = "", ...props }: InputProps) => {
  return (
    <input className={`bg-secondary border border-border rounded-md p-2 ${className}`} {...props} />
  );
};

interface TextAreaProps {
  className?: string;
  [key: string]: any;
}

export const TextArea = ({ className = "", ...props }: TextAreaProps) => {
  return (
    <textarea className={`bg-secondary border border-border rounded-md p-2 ${className}`} {...props} />
  );
};

interface SelectProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const Select = ({ children, className = "", ...props }: SelectProps) => {
  return (
    <select className={`bg-secondary border border-border rounded-md p-2 ${className}`} {...props}>
      {children}
    </select>
  );
};

interface LabelProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const Label = ({ children, className = "", ...props }: LabelProps) => {
  return (
    <label className={`text-white ${className}`} {...props}>
      {children}
    </label>
  );
};