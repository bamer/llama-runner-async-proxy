import React from 'react';
import { useModelsStore } from '../store';
import { api } from '../services/api';

const ConfigurationPage = () => {
  const models = useModelsStore((state) => state.models);
  
  return (
    <div className="p-8 bg-background min-h-screen">
      <h1 className="text-xl font-bold mb-6">Configuration</h1>
      
      <div className="flex flex-col gap-8">
        <div className="bg-secondary border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Registered Models</h2>
          
          {models.length > 0 ? (
            <div className="grid grid-cols-auto-fit gap-4">
              {models.map((model) => (
                <div key={model.name} className="p-4 bg-tertiary border border-border rounded-lg flex flex-col gap-2">
                  <span className="font-bold text-lg">{model.name}</span>
                  <span className="text-secondary">{model.format || 'Unknown'}</span>
                  <span className="text-tertiary">{model.sizeGB ? `${typeof model.sizeGB === 'number' ? model.sizeGB.toFixed(1) : model.sizeGB}GB` : 'Unknown size'}</span>
                  <span className="text-secondary">{model.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-tertiary italic">No models registered yet</p>
          )}
        </div>
        
        <div className="bg-secondary border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Model Settings</h2>
          
          <div className="p-4 bg-tertiary border border-border rounded-lg">
            <h3 className="font-bold text-lg mb-2">Configure Parameters</h3>
            <p className="text-secondary">Configure your model parameters and settings.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPage;