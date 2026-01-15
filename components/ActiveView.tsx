import React, { useState } from 'react';
import { Loan, Client } from '../types';
import LoanList from './LoanList';
import { AlertCircle, Calendar } from 'lucide-react';

interface ActiveViewProps {
  loans: Loan[];
  onUpdate: () => void;
  onViewDetails: (loan: Loan) => void;
}

const ActiveView: React.FC<ActiveViewProps> = ({ loans, onUpdate, onViewDetails }) => {
  // Normalize today to midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter active loans
  const activeLoans = loans.filter(l => l.status === 'active');

  // Filter for collections needed today (Due date <= Today)
  const dueTodayOrLate = activeLoans.filter(l => {
    const dueDate = new Date(l.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= today;
  });

  const upcoming = activeLoans.filter(l => {
    const dueDate = new Date(l.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate > today;
  });

  const totalToCollectToday = dueTodayOrLate.reduce((acc, curr) => {
    // Se tiver parcelas, soma apenas o que falta
    if (curr.installments) {
        const paid = curr.installments.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
        return acc + (curr.totalOwing - paid);
    }
    return acc + curr.totalOwing;
  }, 0);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-white mb-1">Carteira Ativa</h2>
            <p className="text-slate-400">Gerencie quem está devendo.</p>
        </div>
      </header>

      {/* Priority Section */}
      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-red-400 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                Cobrar Hoje / Atrasados
            </h3>
            <div className="text-right">
                <p className="text-xs text-red-300 uppercase font-bold">Total a receber agora</p>
                <p className="text-2xl font-bold text-white">
                    {totalToCollectToday.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
            </div>
        </div>
        <LoanList loans={dueTodayOrLate} onUpdate={onUpdate} onViewDetails={onViewDetails} />
      </div>

      {/* Standard Active Section */}
      <div>
        <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6" />
            Vencimentos Futuros
        </h3>
        <LoanList loans={upcoming} onUpdate={onUpdate} onViewDetails={onViewDetails} />
      </div>
    </div>
  );
};

export default ActiveView;