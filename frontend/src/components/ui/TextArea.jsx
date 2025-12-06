import React from 'react';

const TextArea = ({ className = "", ...props }) => {
  return (
    <textarea className={`bg-secondary border border-border rounded-md p-2 ${className}`} {...props} />
  );
};

export default TextArea;