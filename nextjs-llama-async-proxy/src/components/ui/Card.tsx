import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = "", ...props }: CardProps) => {
  return (
    <div className={`bg-secondary border border-border rounded-lg p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};