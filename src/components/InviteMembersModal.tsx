
import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import InviteLink from './InviteLink';

interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
}

interface InviteMembersModalProps {
  currentGroup: Group;
}

const InviteMembersModal = ({ currentGroup }: InviteMembersModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-colar-orange hover:bg-colar-orange-dark text-white flex items-center space-x-2">
          <UserPlus size={18} />
          <span>Convidar Membros</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-colar-navy flex items-center space-x-2">
            <UserPlus size={20} />
            <span>Convidar para {currentGroup.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Compartilhe o link abaixo para convidar pessoas para o seu grupo.
          </p>
          
          <InviteLink 
            inviteCode={currentGroup.invite_code} 
            groupName={currentGroup.name}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMembersModal;
