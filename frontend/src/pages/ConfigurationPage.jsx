import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const ConfigurationPage = () => {
  const [config, setConfig] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Mock data - in real implementation would connect to API
    const mockConfig = {
      basePath: '/home/user/models',
      logLevel: 'info',
      maxConcurrentModels: 5,
      autoUpdate: true,
      notificationsEnabled: true
    };
    
    setConfig(mockConfig);
    setIsLoading(false);
  }, []);

  const handleSaveConfig = (newConfig) => {
    // Mock logic - in real implementation would connect to API
    setConfig(newConfig);
    console.log('Configuration saved:', newConfig);
  };

  return (
    <div className="configuration-page">
      <h1 className="text-2xl font-bold mb-6">Configuration</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-l-2 border-t-2 border-r-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <Card>
          <h3 className="text-lg font-semibold mb-4">General Settings</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const configData = Object.fromEntries(formData);
            handleSaveConfig(configData);
          }}>
            <div className="mb-4">
              <Input
                name="basePath"
                placeholder="Base path for models"
                value={config.basePath || ''}
              />
            </div>
            
            <div className="mb-4">
              <Input
                name="logLevel"
                placeholder="Log level (info, debug, error)"
                value={config.logLevel || ''}
              />
            </div>
            
            <div className="mb-4">
              <Input
                name="maxConcurrentModels"
                type="number"
                placeholder="Maximum concurrent models"
                value={config.maxConcurrentModels || ''}
              />
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="autoUpdate"
                  checked={config.autoUpdate}
                  className="mr-2"
                />
                <span>Auto Update</span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="notificationsEnabled"
                  checked={config.notificationsEnabled}
                  className="mr-2"
                />
                <span>Notifications Enabled</span>
              </div>
            </div>
            
            <Button type="submit" disabled={isSaving}>Save Configuration</Button>
          </form>
        </Card>
      )}
    </div>
  );
};

export default ConfigurationPage;