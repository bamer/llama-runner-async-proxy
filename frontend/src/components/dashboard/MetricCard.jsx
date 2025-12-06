import React from 'react';

const MetricCard = ({ title, value, unit, icon, color }) => {
  return (
    <div className="bg-tertiary border border-border rounded-lg p-5 text-white" style={{ backgroundColor: color }}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">{icon}</span>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <div className="flex flex-col items-center mt-2">
        <span className="text-2xl font-bold">{value}</span>
        <span className="opacity-75">{unit}</span>
      </div>
    </div>
  );
};

export default MetricCard;