import React from 'react';

export const Button = ({ children, className = "", variant = "default", ...props }) => {
  const baseClasses = "px-4 py-2 rounded-md transition-colors";
  
  const variants = {
    default: "bg-primary text-white hover:bg-blue-600",
    outline: "border border-border hover:bg-secondary",
    ghost: "hover:bg-secondary"
  };

  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};