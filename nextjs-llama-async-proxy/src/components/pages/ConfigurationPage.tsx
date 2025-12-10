'use client';

import React, { useState, useEffect } from 'react';

interface Config {
  basePath: string;
  logLevel: string;
  maxConcurrentModels: number;
  autoUpdate: boolean;
  notificationsEnabled: boolean;
}

const ConfigurationPage = () => {
  const [config, setConfig] = useState<Config>({
    basePath: '/home/user/models',
    logLevel: 'info',
    maxConcurrentModels: 5,
    autoUpdate: true,
    notificationsEnabled: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('app-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Failed to parse saved config:', error);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      // Save to localStorage
      localStorage.setItem('app-config', JSON.stringify(config));

      // Also try to save to API if available
      try {
        const response = await fetch('/api/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        });

        if (response.ok) {
          setSaveMessage('Configuration saved successfully!');
        } else {
          setSaveMessage('Configuration saved locally (API unavailable)');
        }
      } catch (apiError) {
        setSaveMessage('Configuration saved locally (API unavailable)');
      }
    } catch (error) {
      setSaveMessage('Failed to save configuration');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="configuration-page">
      <h1 className="text-2xl font-bold mb-6">Configuration</h1>
      
      <div className="bg-secondary border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">General Settings</h3>
        <form>
          <div className="mb-4">
            <input
              type="text"
              name="basePath"
              placeholder="Base path for models"
              value={config.basePath}
              onChange={handleInputChange}
              className="border border-border rounded-md px-4 py-2 w-full bg-background text-foreground"
            />
          </div>

          <div className="mb-4">
            <input
              type="text"
              name="logLevel"
              placeholder="Log level (info, debug, error)"
              value={config.logLevel}
              onChange={handleInputChange}
              className="border border-border rounded-md px-4 py-2 w-full bg-background text-foreground"
            />
          </div>

          <div className="mb-4">
            <input
              type="number"
              name="maxConcurrentModels"
              placeholder="Maximum concurrent models"
              value={config.maxConcurrentModels}
              onChange={handleInputChange}
              className="border border-border rounded-md px-4 py-2 w-full bg-background text-foreground"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="autoUpdate"
                checked={config.autoUpdate}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-foreground">Auto Update</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="notificationsEnabled"
                checked={config.notificationsEnabled}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-foreground">Notifications Enabled</span>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 px-4 py-2 rounded-md transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>

          {saveMessage && (
            <div className={`mt-4 p-3 rounded-md ${saveMessage.includes('successfully') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>
              {saveMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ConfigurationPage;