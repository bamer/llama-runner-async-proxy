import React from 'react';

const Card = ({ children, className = "", ...props }) => {
  return (
    <div className={`bg-secondary border border-border rounded-lg p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;