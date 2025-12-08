// Frontend Component Implementation - Button.jsx with TypeScript and React 19 Features

import { useState, useEffectEvent } from "react";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "primary" | "secondary";
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

export const Button = ({ 
  children, 
  className = "", 
  variant = "default", 
  disabled = false,
  onClick,
  ariaLabel
}: ButtonProps) => {
  // Define variants with proper styling
  const variants = {
    default: "bg-primary text-white hover:bg-blue-600",
    outline: "border border-border hover:bg-secondary",
    ghost: "hover:bg-secondary",
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-500 text-white hover:bg-gray-600"
  };

  // Extract non-reactive logic from effects (useEffectEvent)
  const onButtonClick = useEffectEvent(() => {
    // Non-reactive function that doesn't re-render when props change
    console.log("Button clicked");
  });

  const baseClasses = "px-4 py-2 rounded-md transition-colors";
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled}
      onClick={(e) => {
        if (onClick) onClick();
        onButtonClick(); // Call non-reactive handler
      }}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

// TypeScript interface for enhanced Button component with accessibility
interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string;
  role?: string;
}

export const AccessibleButton = ({ 
  children, 
  className = "", 
  variant = "default", 
  disabled = false,
  onClick,
  ariaLabel,
  role = "button"
}: AccessibleButtonProps) => {
  const baseClasses = "px-4 py-2 rounded-md transition-colors";
  
  return (
    <button 
      className={`${baseClasses} ${variant === "default" ? "bg-primary text-white hover:bg-blue-600" : 
        variant === "outline" ? "border border-border hover:bg-secondary" :
        variant === "ghost" ? "hover:bg-secondary" : "bg-blue-500 text-white hover:bg-blue-600"} ${className}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      role={role}
    >
      {children}
    </button>
  );
};