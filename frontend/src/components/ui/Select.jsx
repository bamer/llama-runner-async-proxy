import React from 'react';

const Select = ({ className = "", ...props }) => {
  return (
    <select className={`bg-secondary border border-border rounded-md p-2 ${className}`} {...props} />
  );
};

export default Select;