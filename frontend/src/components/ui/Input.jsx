import React from 'react';

const Input = ({ className = "", ...props }) => {
  return (
    <input className={`bg-secondary border border-border rounded-md p-2 ${className}`} {...props} />
  );
};

export default Input;