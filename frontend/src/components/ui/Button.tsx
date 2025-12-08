
import React from 'react';
import { useState, useEffectEvent } from "react"


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

// MetricCard.jsx - Enhanced with React 19 patterns  
interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon?: string;
  trend?: number;
  className?: string;
}

export const MetricCard = ({ 
  title, 
  value, 
  unit = "", 
  icon = "", 
  trend,
  className = ""
}: MetricCardProps) => {
  // Extract non-reactive logic from effects (useEffectEvent)
  const onMetricClick = useEffectEvent(() => {
    // Non-reactive function that doesn't re-render when props change
    console.log("Metric card clicked");
  });

  return (
    <div 
      className={`bg-tertiary border border-border rounded-lg p-5 text-white ${className}`}
      onClick={onMetricClick}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">{icon}</span>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <div className="flex flex-col items-center mt-2">
        <span className="text-2xl font-bold">{value}</span>
        {unit && <span className="opacity-75">{unit}</span>}
        {trend !== undefined && (
          <div className={`mt-2 ${trend > 0 ? 'text-green' : 'text-red'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
};

// Activity component simulation
export const ActivityMetricCard = ({ 
  title, 
  value, 
  unit = "", 
  icon = "", 
  trend,
  isActive = true
}: MetricCardProps & {isActive?: boolean}) => {
  // Extract non-reactive logic from effects (useEffectEvent)
  const onMetricClick = useEffectEvent(() => {
    console.log("Activity metric card clicked");
  });

  return (
    <div 
      className={`bg-tertiary border border-border rounded-lg p-5 text-white ${
        isActive ? "" : "opacity-50"
      }`}
      onClick={onMetricClick}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">{icon}</span>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <div className="flex flex-col items-center mt-2">
        <span className="text-2xl font-bold">{value}</span>
        {unit && <span className="opacity-75">{unit}</span>}
        {trend !== undefined && (
          <div className={`mt-2 ${trend > 0 ? 'text-green' : 'text-red'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
};