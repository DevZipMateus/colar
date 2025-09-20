
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import { useInviteHandler } from '@/hooks/useInviteHandler';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import Finances from '@/components/Finances';
import Tasks from '@/components/Tasks';
import Inventory from '@/components/Inventory';
import GroupSelector from '@/components/GroupSelector';
import PendingInviteNotification from '@/components/PendingInviteNotification';
import Auth from './Auth';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, loading } = useAuth();
  const { groups, currentGroup } = useGroups();
  
  // Handle invite links from URL
  useInviteHandler();

  if (loading) {
    return (
      <div className="min-h-screen bg-colar-background flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/b542af28-bc6f-48e6-bc41-ac0ce357de82.png" 
            alt="CoLar Logo" 
            className="w-10 h-10 animate-pulse"
          />
          <div className="text-xl font-bold text-colar-navy">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (groups.length === 0 || !currentGroup) {
    return (
      <>
        <GroupSelector />
        <PendingInviteNotification />
      </>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard currentGroup={currentGroup} />;
      case 'finances':
        return <Finances currentGroup={currentGroup} />;
      case 'tasks':
        return <Tasks currentGroup={currentGroup} />;
      case 'inventory':
        return <Inventory currentGroup={currentGroup} />;
      default:
        return <Dashboard currentGroup={currentGroup} />;
    }
  };

  return (
    <div className="min-h-screen bg-colar-background md:flex overflow-x-hidden">
      <div className="md:w-64">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <GroupSelector />
        <main className="flex-1 pb-20 md:pb-0 px-2 md:px-0">
          {renderContent()}
        </main>
      </div>
      <PendingInviteNotification />
    </div>
  );
};

export default Index;
