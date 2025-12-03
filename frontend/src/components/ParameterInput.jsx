import React from 'react';
import './ParameterInput.css';

/**
 * Reusable parameter input component with tooltips
 * Supports: number, text, boolean, select
 */
const ParameterInput = ({ 
  parameter, 
  value, 
  onChange, 
  onError 
}) => {
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

    const inputClass = `parameter-input parameter-${type}`;

    switch (type) {
      case 'number':
        return (
          <input
            type="number"
            className={inputClass}
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
          <input
            type="text"
            className={inputClass}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Default: ${defaultValue}`}
          />
        );

      case 'boolean':
        return (
          <label className="parameter-checkbox">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleChange(e.target.checked)}
            />
            <span className="checkbox-label">
              {value === true ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );

      case 'select':
        return (
          <select
            className={inputClass}
            value={value !== undefined ? value : defaultValue}
            onChange={(e) => {
              const val = e.target.value;
              // Try to parse as number if all options are numbers
              const numVal = isNaN(val) ? val : Number(val);
              handleChange(numVal);
            }}
          >
            <option value="">-- Default: {defaultValue} --</option>
            {options && options.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            className={inputClass}
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
        <label className="parameter-label">
          {parameter.description}
          {parameter.tooltip && (
            <span className="tooltip-icon" title={parameter.tooltip}>
              ⓘ
            </span>
          )}
        </label>
        {parameter.short && (
          <code className="parameter-cli">{parameter.short}</code>
        )}
        {parameter.long && (
          <code className="parameter-cli">{parameter.long}</code>
        )}
      </div>
      <div className="parameter-input-wrapper">
        {renderInput()}
        {parameter.tooltip && (
          <div className="parameter-tooltip">{parameter.tooltip}</div>
        )}
      </div>
    </div>
  );
};

export default ParameterInput;
