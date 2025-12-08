// Frontend Component Implementation - MetricCard.jsx with React 19 Features

import { useState, useEffectEvent } from "react";

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

// Enhanced MetricCard with Activity component simulation
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