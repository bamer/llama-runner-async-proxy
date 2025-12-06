import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ParameterInput({ 
  parameter, 
  value, 
  onChange, 
  onError 
}) {
  if (!parameter) return null;

  const handleChange = (newValue) => {
    onChange(newValue);
    // Clear any errors on change
    if (onError) {
      onError(null);
    }
  };

  const renderInput = () => {
    const { type, min, max, step, options, default: defaultValue, id } = parameter;

    switch (type) {
      case 'number':
        return (
          <Input
            type="number"
            value={value !== undefined ? value : defaultValue}
            onChange={(e) => handleChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step || 1}
            placeholder={`Default: ${defaultValue}`}
          />
        );

      case 'string':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Default: ${defaultValue}`}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleChange(e.target.checked)}
              className="mr-2"
            />
            <span>{value === true ? 'Enabled' : 'Disabled'}</span>
          </div>
        );

      case 'select':
        return (
          <Select value={value !== undefined ? value : defaultValue}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options && options.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Default: ${defaultValue}`}
          />
        );
    }
  };

  return (
    <div className="parameter-field">
      <div className="parameter-label-wrapper">
        <Label className="parameter-label">
          {parameter.description}
        </Label>
        {parameter.tooltip && (
          <span className="tooltip-icon" title={parameter.tooltip}>
            ⓘ
          </span>
        )}
      </div>
      <div className="parameter-input-wrapper">
        {renderInput()}
      </div>
    </div>
  );
}
