const ConfigurationPage = () => {
  const mockConfig = {
    basePath: '/home/user/models',
    logLevel: 'info',
    maxConcurrentModels: 5,
    autoUpdate: true,
    notificationsEnabled: true
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
              defaultValue={mockConfig.basePath}
              className="border border-border rounded-md px-4 py-2 w-full"
            />
          </div>
          
          <div className="mb-4">
            <input
              type="text"
              name="logLevel"
              placeholder="Log level (info, debug, error)"
              defaultValue={mockConfig.logLevel}
              className="border border-border rounded-md px-4 py-2 w-full"
            />
          </div>
          
          <div className="mb-4">
            <input
              type="number"
              name="maxConcurrentModels"
              placeholder="Maximum concurrent models"
              defaultValue={mockConfig.maxConcurrentModels}
              className="border border-border rounded-md px-4 py-2 w-full"
            />
          </div>
          
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="autoUpdate"
                defaultChecked={mockConfig.autoUpdate}
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
                defaultChecked={mockConfig.notificationsEnabled}
                className="mr-2"
              />
              <span>Notifications Enabled</span>
            </div>
          </div>
          
          <button className="bg-primary text-white hover:bg-blue-600 px-4 py-2 rounded-md transition-colors">Save Configuration</button>
        </form>
      </div>
    </div>
  );
};

export default ConfigurationPage;