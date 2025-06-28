
import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import Finances from '@/components/Finances';
import Tasks from '@/components/Tasks';
import Inventory from '@/components/Inventory';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'finances':
        return <Finances />;
      case 'tasks':
        return <Tasks />;
      case 'inventory':
        return <Inventory />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-colar-background md:flex">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 pb-20 md:pb-0">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
