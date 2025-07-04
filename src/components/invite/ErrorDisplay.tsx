
import React from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { InviteError } from '@/hooks/useInviteHandler';

interface ErrorDisplayProps {
  error: InviteError;
}

const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  const getErrorIcon = (error: InviteError) => {
    switch (error.type) {
      case 'email_not_confirmed':
        return <Mail className="text-yellow-600" size={16} />;
      case 'already_member':
        return <CheckCircle className="text-green-600" size={16} />;
      case 'invalid_code':
        return <AlertCircle className="text-red-600" size={16} />;
      default:
        return <AlertCircle className="text-red-600" size={16} />;
    }
  };

  const getErrorColor = (error: InviteError) => {
    switch (error.type) {
      case 'email_not_confirmed':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'already_member':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'network_error':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  return (
    <div className={`mb-3 p-2 rounded-lg border text-xs ${getErrorColor(error)}`}>
      <div className="flex items-center space-x-2">
        {getErrorIcon(error)}
        <span className="font-medium">{error.message}</span>
      </div>
      {error.actionText && (
        <div className="mt-1 text-xs opacity-80">
          {error.actionText}
        </div>
      )}
    </div>
  );
};

export default ErrorDisplay;
