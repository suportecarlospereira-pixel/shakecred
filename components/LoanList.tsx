import React from 'react';
import { CheckCircle, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import { Loan } from '../types';
import { loanService } from '../services/loanService';

interface LoanListProps {
  loans: Loan[];
  onUpdate: () => void;
  title?: string;
  readOnly?: boolean;
}

const LoanList: React.FC<LoanListProps> = ({ loans, onUpdate, title, readOnly = false }) => {
  
  const handleStatusChange = async (id: string, newStatus: Loan['status']) => {
    if (window.confirm(`Deseja alterar o status para ${newStatus === 'paid' ? 'PAGO' : 'ATIVO'}?`)) {
      await loanService.updateLoanStatus(id, newStatus);
      onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja apagar este registro? Essa ação não pode ser desfeita.')) {
      await loanService.deleteLoan(id);
      onUpdate();
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR');
  };

  const getStatusInfo = (status: string, dueDateStr: string) => {
    if (status === 'paid') {
      return { 
        class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', 
        text: 'PAGO' 
      };
    }
    
    // Normalize dates to midnight for accurate comparison
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dueDateStr);
    due.setHours(0,0,0,0);
    
    if (today > due) {
      return { 
        class: 'bg-red-500/10 text-red-400 border-red-500/20', 
        text: 'ATRASADO' 
      };
    }

    if (today.getTime() === due.getTime()) {
      return {
        class: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        text: 'VENCE HOJE'
      };
    }
    
    return { 
      class: 'bg-blue-500/10 text-blue-400 border-blue-500/20', 
      text: 'EM ABERTO' 
    };
  };

  return (
    <div className="bg-secondary rounded-2xl shadow-xl border border-accent/50 overflow-hidden mb-8">
      {title && (
        <div className="p-6 border-b border-accent/50">
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-dark/50 text-slate-400 uppercase text-xs">
            <tr>
              <th className="p-4 font-medium">Cliente</th>
              <th className="p-4 font-medium">Valor Emprestado</th>
              <th className="p-4 font-medium">Total a Receber</th>
              <th className="p-4 font-medium">Vencimento</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-accent/30 text-sm">
            {loans.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Nenhum registro encontrado nesta categoria.
                </td>
              </tr>
            ) : (
              loans.map((loan) => {
                const statusInfo = getStatusInfo(loan.status, loan.dueDate);
                return (
                  <tr key={loan.id} className="hover:bg-accent/20 transition-colors">
                    <td className="p-4 font-medium text-white">
                      {loan.clientName}
                      <div className="text-xs text-slate-500">{formatDate(new Date(loan.createdAt).toISOString())}</div>
                    </td>
                    <td className="p-4 text-slate-300">
                      {loan.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-4 font-bold text-emerald-400">
                      {loan.totalOwing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-4 text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {formatDate(loan.dueDate)}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${statusInfo.class}`}>
                        {statusInfo.text}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {!readOnly && loan.status !== 'paid' && (
                        <button 
                          onClick={() => handleStatusChange(loan.id!, 'paid')}
                          title="Marcar como Pago"
                          className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(loan.id!)}
                        title="Excluir"
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoanList;