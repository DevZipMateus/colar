
import React from 'react';
import { FinancialDashboard } from './FinancialDashboard';

interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
}

interface FinancesProps {
  currentGroup: Group;
}

const Finances = ({ currentGroup }: FinancesProps) => {
  return <FinancialDashboard groupId={currentGroup.id} />
};

export default Finances;
