import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const ModelsPage = () => {
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock data - in real implementation would connect to API
    const mockModels = [
      { name: 'llama-2-7b-chat', description: 'Chat model for Llama 2', status: 'running', version: '2.0' },
      { name: 'llama-3-8b', description: 'Base language model', status: 'stopped', version: '3.0' },
      { name: 'gpt-3.5-turbo', description: 'OpenAI GPT-3.5 model', status: 'running', version: '1.0' },
      { name: 'mistral-7b', description: 'Mistral model', status: 'stopped', version: '2.1' }
    ];
    
    setModels(mockModels);
    setIsLoading(false);
  }, []);

  const handleStartModel = (modelName) => {
    // Mock logic - in real implementation would connect to API
    const updatedModels = models.map(model => 
      model.name === modelName ? { ...model, status: 'running' } : model
    );
    setModels(updatedModels);
  };

  const handleStopModel = (modelName) => {
    // Mock logic - in real implementation would connect to API
    const updatedModels = models.map(model => 
      model.name === modelName ? { ...model, status: 'stopped' } : model
    );
    setModels(updatedModels);
  };

  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="models-page">
      <h1 className="text-2xl font-bold mb-6">Models</h1>
      
      <div className="flex justify-between items-center mb-6">
        <Input 
          placeholder="Search models..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="outline">Discover Models</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-l-2 border-t-2 border-r-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <Card key={model.name}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">{model.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${model.status === 'running' ? 'bg-green-500' : 'bg-red-500'}`}>
                  {model.status}
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-sm opacity-75">{model.description}</p>
                <p className="text-xs opacity-50">Version: {model.version}</p>
              </div>
              
              <div className="flex gap-2">
                {model.status === 'running' ? (
                  <Button 
                    onClick={() => handleStopModel(model.name)}
                    variant="outline"
                  >
                    Stop
                  </Button>
                ) : (
                  <Button onClick={() => handleStartModel(model.name)}>
                    Start
                  </Button>
                )}
                <Button variant="outline">Details</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelsPage;