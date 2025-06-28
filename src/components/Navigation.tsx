
import React from 'react';
import { Home, DollarSign, CheckSquare, Package } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: 'dashboard', label: 'Início', icon: Home },
    { id: 'finances', label: 'Finanças', icon: DollarSign },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { id: 'inventory', label: 'Estoque', icon: Package },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:relative md:border-t-0 md:border-r md:w-64 md:h-screen md:flex md:flex-col">
      <div className="md:p-6 md:border-b border-colar-orange/20">
        <div className="hidden md:flex items-center space-x-3">
          <img 
            src="/lovable-uploads/b542af28-bc6f-48e6-bc41-ac0ce357de82.png" 
            alt="CoLar Logo" 
            className="w-10 h-10"
          />
          <h1 className="text-2xl font-bold text-colar-navy">
            CoLar
          </h1>
        </div>
      </div>
      
      <div className="flex md:flex-col md:flex-1 md:p-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 flex flex-col items-center justify-center py-3 px-2 transition-all
                md:flex-row md:justify-start md:rounded-lg md:py-3 md:px-4 md:mb-2
                ${isActive 
                  ? 'text-colar-orange bg-colar-orange/10 md:bg-colar-orange/20' 
                  : 'text-gray-600 hover:text-colar-orange hover:bg-gray-50'
                }
              `}
            >
              <Icon size={20} className="mb-1 md:mb-0 md:mr-3" />
              <span className="text-xs md:text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
