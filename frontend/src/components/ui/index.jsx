import React from 'react';

// Button Component
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

// Card Component
export const Card = ({ children, className = "", ...props }) => {
  return (
    <div className={`bg-secondary border border-border rounded-lg p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

// Input Component
export const Input = ({ className = "", ...props }) => {
  return (
    <input className={`bg-secondary border border-border rounded-md p-2 ${className}`} {...props} />
  );
};

// MetricCard Component  
export const MetricCard = ({ title, value, unit, icon, trend }) => {
  return (
    <div className="bg-tertiary border border-border rounded-lg p-5 text-white">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">{icon}</span>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <div className="flex flex-col items-center mt-2">
        <span className="text-2xl font-bold">{value}</span>
        <span className="opacity-75">{unit}</span>
        {trend && (
          <div className={`mt-2 ${trend > 0 ? 'text-green' : 'text-red'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default Button;