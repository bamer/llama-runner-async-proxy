import React, { useState, useEffect } from 'react';
import ParameterInput from '@/components/ParameterInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Displays all llama-server parameters organized by category
 */
export default function ParametersCategoryList({ 
  values = {}, 
  onChange, 
  loading = false 
}) {
  const [categories, setCategories] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [error, setError] = useState(null);

  // Fetch parameters from API
  useEffect(() => {
    const fetchParameters = async () => {
      try {
        const response = await fetch('/api/v1/parameters');
        if (!response.ok) throw new Error('Failed to fetch parameters');
        
        const data = await response.json();
        if (data.parameters) {
          setCategories(data.parameters);
          // Expand first category by default
          const categoryKeys = Object.keys(data.parameters);
          if (categoryKeys.length > 0) {
            setExpandedCategories({
              [categoryKeys[0]]: true
            });
          }
        }
      } catch (err) {
        console.error('Error fetching parameters:', err);
        setError(err.message);
      }
    };

    fetchParameters();
  }, []);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleParameterChange = (paramName, newValue) => {
    onChange({
      ...values,
      [paramName]: newValue
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      basic: '⚙️',
      gpu: '🎮',
      performance: '⚡',
      sampling: '🎲',
      advanced: '🔬',
      logging: '📝',
      special: '✨'
    };
    return icons[category] || '📋';
  };

  if (loading) {
    return <div className="parameters-loading">Loading parameters...</div>;
  }

  if (error) {
    return <div className="parameters-error">Error: {error}</div>;
  }

  if (Object.keys(categories).length === 0) {
    return <div className="parameters-empty">No parameters available</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Llama Server Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="parameters-container">
          <p className="parameters-description mb-4">
            Configure all llama-server options. Hover over fields for detailed information.
          </p>

          <div className="categories-list">
            {Object.entries(categories).map(([category, params]) => (
              <div key={category} className="parameter-category">
                <button
                  className="category-toggle"
                  onClick={() => toggleCategory(category)}
                >
                  <span className="category-toggle-icon">
                    {expandedCategories[category] ? '▼' : '▶'}
                  </span>
                  <span className="category-icon">
                    {getCategoryIcon(category)}
                  </span>
                  <span className="category-title">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </span>
                  <span className="category-count">
                    ({params.length} parameters)
                  </span>
                </button>

                {expandedCategories[category] && (
                  <div className="category-params">
                    {params.map(param => (
                      <ParameterInput
                        key={param.id}
                        parameter={param}
                        value={values[param.id]}
                        onChange={(newValue) => handleParameterChange(param.id, newValue)}
                        onError={(err) => {
                          if (err) {
                            console.warn(`Parameter ${param.id} validation error:`, err);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
