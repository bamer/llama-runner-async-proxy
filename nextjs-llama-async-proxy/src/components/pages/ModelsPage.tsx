'use client';

import React, { useState, useEffect } from 'react';

interface Model {
  name: string;
  description: string;
  status: 'running' | 'stopped' | 'loading';
  version: string;
  path?: string;
}

const ModelsPage = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const discoverModels = async () => {
    setIsDiscovering(true);
    try {
      // Get configured paths from settings
      const configResponse = await fetch('/api/config');
      let configuredPaths = ['/media/bamer/crucial MX300/llm/llama/models'];

      if (configResponse.ok) {
        const config = await configResponse.json();
        if (config.basePath) {
          configuredPaths = [config.basePath];
        }
      }

      const response = await fetch('/api/models/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paths: configuredPaths }),
      });

      if (response.ok) {
        const data = await response.json();
        setModels(prev => [...prev, ...data.discovered]);
      }
    } catch (error) {
      console.error('Failed to discover models:', error);
    } finally {
      setIsDiscovering(false);
    }
  };

  const startModel = async (modelName: string) => {
    setLoadingStates(prev => ({ ...prev, [modelName]: true }));
    try {
      const response = await fetch(`/api/models/${modelName}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        // Update model status
        setModels(prev => prev.map(model =>
          model.name === modelName ? { ...model, status: 'running' as const } : model
        ));
      }
    } catch (error) {
      console.error('Failed to start model:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [modelName]: false }));
    }
  };

  const stopModel = async (modelName: string) => {
    setLoadingStates(prev => ({ ...prev, [modelName]: true }));
    try {
      const response = await fetch(`/api/models/${modelName}/stop`, {
        method: 'POST',
      });

      if (response.ok) {
        // Update model status
        setModels(prev => prev.map(model =>
          model.name === modelName ? { ...model, status: 'stopped' as const } : model
        ));
      }
    } catch (error) {
      console.error('Failed to stop model:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [modelName]: false }));
    }
  };

  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="models-page">
      <h1 className="text-2xl font-bold mb-6">Models</h1>
      
      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          placeholder="Search models..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-border rounded-md px-4 py-2 w-64 bg-background text-foreground"
        />
        <button
          onClick={discoverModels}
          disabled={isDiscovering}
          className="border border-border hover:bg-muted disabled:opacity-50 px-4 py-2 rounded-md transition-colors"
        >
          {isDiscovering ? 'Discovering...' : 'Discover Models'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map((model) => (
          <div key={model.name} className="bg-card border border-border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground">{model.name}</h3>
              <span className={`px-2 py-1 rounded text-xs text-white ${
                model.status === 'running' ? 'bg-green-500' :
                model.status === 'loading' ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                {loadingStates[model.name] ? 'loading' : model.status}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-sm text-muted-foreground">{model.description}</p>
              <p className="text-xs text-muted-foreground">Version: {model.version}</p>
            </div>

            <div className="flex gap-2">
              {model.status === 'running' ? (
                <button
                  onClick={() => stopModel(model.name)}
                  disabled={loadingStates[model.name]}
                  className="border border-border hover:bg-muted disabled:opacity-50 px-4 py-2 rounded-md transition-colors text-foreground"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => startModel(model.name)}
                  disabled={loadingStates[model.name]}
                  className="bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 px-4 py-2 rounded-md transition-colors"
                >
                  Start
                </button>
              )}
              <button className="border border-border hover:bg-muted px-4 py-2 rounded-md transition-colors text-foreground">
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelsPage;