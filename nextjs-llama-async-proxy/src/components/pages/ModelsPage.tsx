const ModelsPage = () => {
  const mockModels = [
    { name: 'llama-2-7b-chat', description: 'Chat model for Llama 2', status: 'running', version: '2.0' },
    { name: 'llama-3-8b', description: 'Base language model', status: 'stopped', version: '3.0' },
    { name: 'gpt-3.5-turbo', description: 'OpenAI GPT-3.5 model', status: 'running', version: '1.0' },
    { name: 'mistral-7b', description: 'Mistral model', status: 'stopped', version: '2.1' }
  ];

  return (
    <div className="models-page">
      <h1 className="text-2xl font-bold mb-6">Models</h1>
      
      <div className="flex justify-between items-center mb-6">
        <input 
          type="text" 
          placeholder="Search models..." 
          className="border border-border rounded-md px-4 py-2 w-64"
        />
        <button className="border border-border hover:bg-secondary px-4 py-2 rounded-md transition-colors">Discover Models</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockModels.map((model) => (
          <div key={model.name} className="bg-secondary border border-border rounded-lg p-6">
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
                <button className="border border-border hover:bg-secondary px-4 py-2 rounded-md transition-colors">Stop</button>
              ) : (
                <button className="bg-primary text-white hover:bg-blue-600 px-4 py-2 rounded-md transition-colors">Start</button>
              )}
              <button className="border border-border hover:bg-secondary px-4 py-2 rounded-md transition-colors">Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelsPage;