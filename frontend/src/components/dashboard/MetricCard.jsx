import React from 'react';
import { Button } from '@/components/ui/Button';

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