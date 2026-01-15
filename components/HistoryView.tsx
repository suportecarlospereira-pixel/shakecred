import React, { useState } from 'react';
import { Loan } from '../types';
import LoanList from './LoanList';
import { TrendingUp, CheckCircle, DollarSign, Filter, X } from 'lucide-react';

interface HistoryViewProps {
  loans: Loan[];
  onUpdate: () => void;
  onViewDetails: (loan: Loan) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ loans, onUpdate, onViewDetails }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Base list: only paid loans
  let filteredLoans = loans.filter(l => l.status === 'paid');

  // Apply filters
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0,0,0,0);
    filteredLoans = filteredLoans.filter(l => new Date(l.createdAt) >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23,59,59,999);
    filteredLoans = filteredLoans.filter(l => new Date(l.createdAt) <= end);
  }

  const totalProfitRealized = filteredLoans.reduce((acc, curr) => acc + curr.profit, 0);
  const totalVolumeMoved = filteredLoans.reduce((acc, curr) => acc + curr.totalOwing, 0);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-white mb-1">Histórico & Lucros</h2>
           <p className="text-slate-400">Análise de empréstimos finalizados.</p>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="bg-secondary p-4 rounded-xl border border-accent/50 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-slate-400 mb-1 ml-1">Data Inicial</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-dark border border-accent rounded-lg p-2 text-white text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 ml-1">Data Final</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-dark border border-accent rounded-lg p-2 text-white text-sm focus:border-primary focus:outline-none"
          />
        </div>
        
        {(startDate || endDate) && (
          <button 
            onClick={clearFilters}
            className="mb-0.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <X className="w-4 h-4" />
            Limpar Filtros
          </button>
        )}
      </div>

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
              <span className="text-slate-400 font-medium">Lucro Realizado (Filtrado)</span>
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
            Empréstimos Pagos {startDate && endDate ? '(Filtrado)' : '(Todos)'}
        </h3>
        <LoanList 
            loans={filteredLoans} 
            onUpdate={onUpdate} 
            readOnly={true}
            onViewDetails={onViewDetails} 
        />
      </div>
    </div>
  );
};

export default HistoryView;