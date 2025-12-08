import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const SettingsPage = () => {
  return (
    <div className="settings-page">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <Card>
        <h3 className="text-lg font-semibold mb-4">General</h3>
        <div className="flex justify-between items-center py-4 border-b">
          <span>Dark Mode</span>
          <Button variant="outline">Toggle</Button>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b">
          <span>Notifications</span>
          <Button variant="outline">Enable</Button>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b">
          <span>Auto Update</span>
          <Button variant="outline">Enable</Button>
        </div>
      </Card>
      
      <Card className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Security</h3>
        <div className="flex justify-between items-center py-4 border-b">
          <span>Authentication</span>
          <Button variant="outline">Configure</Button>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b">
          <span>Encryption</span>
          <Button variant="outline">Manage</Button>
        </div>
      </Card>
      
      <Card className="mt-6">
        <h3 className="text-lg font-semibold mb-4">System</h3>
        <div className="flex justify-between items-center py-4 border-b">
          <span>System Health</span>
          <Button variant="outline">Check</Button>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b">
          <span>Backup Settings</span>
          <Button variant="outline">Configure</Button>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;