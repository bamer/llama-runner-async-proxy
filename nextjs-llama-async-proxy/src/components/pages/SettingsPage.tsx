const SettingsPage = () => {
  return (
    <div className="settings-page">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="bg-secondary border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">General</h3>
        <div className="flex justify-between items-center py-4 border-b">
          <span>Dark Mode</span>
          <button className="border border-border hover:bg-secondary px-4 py-2 rounded-md transition-colors">Toggle</button>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b">
          <span>Notifications</span>
          <button className="border border-border hover:bg-secondary px-4 py-2 rounded-md transition-colors">Enable</button>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b">
          <span>Auto Update</span>
          <button className="border border-border hover:bg-secondary px-4 py-2 rounded-md transition-colors">Enable</button>
        </div>
      </div>
      
      <div className="bg-secondary border border-border rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Security</h3>
        <div className="flex justify-between items-center py-4 border-b">
          <span>Authentication</span>
          <button className="border border-border hover:bg-secondary px-4 py-2 rounded-md transition-colors">Configure</button>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b">
          <span>Encryption</span>
          <button className="border border-border hover:bg-secondary px-4 py-2 rounded-md transition-colors">Manage</button>
        </div>
      </div>
      
      <div className="bg-secondary border border-border rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">System</h3>
        <div className="flex justify-between items-center py-4 border-b">
          <span>System Health</span>
          <button className="border border-border hover:bg-secondary px-4 py-2 rounded-md transition-colors">Check</button>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b">
          <span>Backup Settings</span>
          <button className="border border-border hover:bg-secondary px-4 py-2 rounded-md transition-colors">Configure</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;