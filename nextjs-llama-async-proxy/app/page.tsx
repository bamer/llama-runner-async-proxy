import DashboardPage from '../src/components/pages/DashboardPage';
import Header from '../src/components/layout/Header';
import Sidebar from '../src/components/layout/Sidebar';

export default function Home() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <Header />
        
        {/* Dashboard Content */}
        <div className="flex-1 p-6">
          <DashboardPage />
        </div>
      </main>
    </div>
  );
}