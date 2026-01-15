import React from 'react';
import { Loan } from '../types';
import LoanList from './LoanList';
import { TrendingUp, CheckCircle, DollarSign } from 'lucide-react';

interface HistoryViewProps {
  loans: Loan[];
  onUpdate: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ loans, onUpdate }) => {
  const paidLoans = loans.filter(l => l.status === 'paid');
  
  const totalProfitRealized = paidLoans.reduce((acc, curr) => acc + curr.profit, 0);
  const totalVolumeMoved = paidLoans.reduce((acc, curr) => acc + curr.totalOwing, 0);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-white mb-1">Histórico & Lucros</h2>
        <p className="text-slate-400">Análise de empréstimos finalizados.</p>
      </header>

      {/* Stats Cards for History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-secondary p-6 rounded-2xl border border-accent/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="w-24 h-24 text-emerald-500" />
            </div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-slate-400 font-medium">Lucro Realizado (Já no bolso)</span>
            </div>
            <h3 className="text-3xl font-bold text-white">
              {totalProfitRealized.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
        </div>

        <div className="bg-secondary p-6 rounded-2xl border border-accent/50 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle className="w-24 h-24 text-blue-500" />
            </div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <span className="text-slate-400 font-medium">Volume Total Recebido</span>
            </div>
            <h3 className="text-3xl font-bold text-white">
              {totalVolumeMoved.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
        </div>
      </div>

      {/* List */}
      <div>
         <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Empréstimos Pagos
        </h3>
        <LoanList 
            loans={paidLoans} 
            onUpdate={onUpdate} 
            readOnly={true} 
        />
      </div>
    </div>
  );
};

export default HistoryView;