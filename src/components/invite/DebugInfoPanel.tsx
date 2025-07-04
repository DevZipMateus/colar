
import React from 'react';
import { User } from '@supabase/supabase-js';

interface DebugInfoPanelProps {
  user: User;
  pendingInvite: string | null;
  processing: boolean;
}

const DebugInfoPanel = ({ user, pendingInvite, processing }: DebugInfoPanelProps) => {
  return (
    <div className="mb-3 p-2 bg-gray-50 rounded text-xs font-mono">
      <div><strong>User ID:</strong> {user.id}</div>
      <div><strong>Email:</strong> {user.email}</div>
      <div><strong>Email Confirmed:</strong> {user.email_confirmed_at ? '✅' : '❌'}</div>
      <div><strong>Pending Code:</strong> {pendingInvite || 'None'}</div>
      <div><strong>Processing:</strong> {processing ? '🔄' : '⏸️'}</div>
    </div>
  );
};

export default DebugInfoPanel;
