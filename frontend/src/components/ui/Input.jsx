import React from 'react';

export const Input = ({ className = "", ...props }) => {
  return (
    <input className={`bg-secondary border border-border rounded-md p-2 ${className}`} {...props} />
  );
};

export const TextArea = ({ className = "", ...props }) => {
  return (
    <textarea className={`bg-secondary border border-border rounded-md p-2 ${className}`} {...props} />
  );
};

export const Select = ({ children, className = "", ...props }) => {
  return (
    <select className={`bg-secondary border border-border rounded-md p-2 ${className}`} {...props}>
      {children}
    </select>
  );
};

export const Label = ({ children, className = "", ...props }) => {
  return (
    <label className={`text-white ${className}`} {...props}>
      {children}
    </label>
  );
};