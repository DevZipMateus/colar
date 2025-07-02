
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  Wallet, 
  CheckSquare, 
  Package,
  Menu,
  X
} from 'lucide-react';
import UserMenu from './UserMenu';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'finances', label: 'Finanças', icon: Wallet },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { id: 'inventory', label: 'Inventário', icon: Package },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/b542af28-bc6f-48e6-bc41-ac0ce357de82.png" 
            alt="CoLar Logo" 
            className="w-8 h-8"
          />
          <h1 className="text-xl font-bold text-colar-navy">CoLar</h1>
        </div>
        <div className="flex items-center space-x-2">
          <UserMenu />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="fixed left-0 top-0 h-full w-64 bg-white transform transition-transform duration-300 ease-in-out">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="/lovable-uploads/b542af28-bc6f-48e6-bc41-ac0ce357de82.png" 
                  alt="CoLar Logo" 
                  className="w-8 h-8"
                />
                <h1 className="text-xl font-bold text-colar-navy">CoLar</h1>
              </div>
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        activeTab === item.id 
                          ? 'bg-colar-orange hover:bg-colar-orange-dark text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        onTabChange(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Icon size={20} className="mr-3" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0">
        <Card className="flex-1 m-4 flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/b542af28-bc6f-48e6-bc41-ac0ce357de82.png" 
                alt="CoLar Logo" 
                className="w-10 h-10"
              />
              <div>
                <h1 className="text-2xl font-bold text-colar-navy">CoLar</h1>
                <p className="text-sm text-gray-600">Gestão Compartilhada</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    activeTab === item.id 
                      ? 'bg-colar-orange hover:bg-colar-orange-dark text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon size={20} className="mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <UserMenu />
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-gray-600 hover:text-red-600"
              >
                Sair
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default Navigation;
