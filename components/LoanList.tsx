import React, { useState } from 'react';
import { CheckCircle, Trash2, Calendar, List, Edit, X, Save } from './Icons'; 
import { Loan, Installment } from '../types';
import { loanService } from '../services/loanService';

interface LoanListProps {
  loans: Loan[];
  onUpdate: () => void;
  onViewDetails?: (loan: Loan) => void;
  title?: string;
  readOnly?: boolean;
}

const LoanList: React.FC<LoanListProps> = ({ loans, onUpdate, onViewDetails, title, readOnly = false }) => {
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [editInstallments, setEditInstallments] = useState<Installment[]>([]);
  const [editSingleDate, setEditSingleDate] = useState('');
  const [saving, setSaving] = useState(false);

  // --- Funções de Status e Exclusão ---
  const handleStatusChange = async (loan: Loan, newStatus: Loan['status']) => {
    if (loan.installments && loan.installments.length > 0) {
      if (!window.confirm(`ATENÇÃO: Este empréstimo é parcelado.\n\nMarcar como PAGO vai quitar TODAS as parcelas restantes de uma vez.\n\nDeseja continuar?`)) return;
    } else {
      if (!window.confirm(`Deseja alterar o status para ${newStatus === 'paid' ? 'PAGO' : 'ATIVO'}?`)) return;
    }

    try {
      await loanService.updateLoanStatus(loan.id!, newStatus);
      onUpdate();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja apagar este registro? Essa ação não pode ser desfeita.')) {
      try {
        await loanService.deleteLoan(id);
        onUpdate();
      } catch (error) {
        console.error("Erro na exclusão:", error);
        alert("Erro ao excluir. Verifique permissões.");
      }
    }
  };

  // --- Funções de Edição de Data ---
  const startEditing = (loan: Loan) => {
    setEditingLoan(loan);
    if (loan.installments && loan.installments.length > 0) {
      setEditInstallments([...loan.installments]); // Clone array
    } else {
      // Se não tiver installments, usa a data de vencimento principal
      setEditSingleDate(new Date(loan.dueDate).toISOString().split('T')[0]);
    }
  };

  const handleInstallmentDateChange = (index: number, newDate: string) => {
    const updated = [...editInstallments];
    // Setar meio dia para evitar problemas de fuso
    const isoDate = new Date(newDate + 'T12:00:00').toISOString();
    updated[index] = { ...updated[index], dueDate: isoDate };
    setEditInstallments(updated);
  };

  const saveEdits = async () => {
    if (!editingLoan) return;
    setSaving(true);
    try {
      const updates: Partial<Loan> = {};

      if (editingLoan.installments && editingLoan.installments.length > 0) {
        // Se for parcelado, atualiza parcelas e a data final (dueDate do pai)
        updates.installments = editInstallments;
        // A data do empréstimo vira a data da última parcela
        const lastInst = editInstallments[editInstallments.length - 1];
        updates.dueDate = lastInst.dueDate;
      } else {
        // Se for único, atualiza só o dueDate
        updates.dueDate = new Date(editSingleDate + 'T12:00:00').toISOString();
      }

      await loanService.updateLoan(editingLoan.id!, updates);
      setEditingLoan(null);
      onUpdate();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR');
  };

  const getStatusInfo = (status: string, dueDateStr: string) => {
    if (status === 'paid') return { class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', text: 'PAGO' };
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dueDateStr);
    due.setHours(0,0,0,0);
    
    if (today > due) return { class: 'bg-red-500/10 text-red-400 border-red-500/20', text: 'ATRASADO' };
    if (today.getTime() === due.getTime()) return { class: 'bg-orange-500/10 text-orange-400 border-orange-500/20', text: 'VENCE HOJE' };
    return { class: 'bg-blue-500/10 text-blue-400 border-blue-500/20', text: 'EM ABERTO' };
  };

  return (
    <>
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
                <th className="p-4 font-medium">Valor</th>
                <th className="p-4 font-medium">Restante</th>
                <th className="p-4 font-medium">Vencimento</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent/30 text-sm">
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                loans.map((loan) => {
                  const statusInfo = getStatusInfo(loan.status, loan.dueDate);
                  let remaining = loan.totalOwing;
                  let installmentText = "";

                  if (loan.installments && loan.installments.length > 0) {
                      const paidCount = loan.installments.filter(i => i.status === 'paid').length;
                      const totalCount = loan.installments.length;
                      const paidAmount = loan.installments.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
                      remaining = loan.totalOwing - paidAmount;
                      installmentText = `${paidCount}/${totalCount} pagas`;
                  }

                  return (
                    <tr key={loan.id} className="hover:bg-accent/20 transition-colors">
                      <td className="p-4 font-medium text-white">
                        {loan.clientName}
                        <div className="text-xs text-slate-500">{formatDate(new Date(loan.createdAt).toISOString())}</div>
                      </td>
                      <td className="p-4 text-slate-300">
                        {loan.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="p-4">
                          <div className="font-bold text-emerald-400">
                              {remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                          {loan.installments && loan.status === 'active' && (
                              <div className="text-xs text-slate-400">{installmentText}</div>
                          )}
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
                      <td className="p-4 text-right flex justify-end gap-2">
                        
                        {/* AQUI ESTÁ O BOTÃO DE EDITAR QUE VOCÊ QUER */}
                        {!readOnly && (
                           <button 
                             onClick={() => startEditing(loan)}
                             title="Editar Datas"
                             className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors border border-yellow-500/30"
                           >
                             <Edit className="w-5 h-5" />
                           </button>
                        )}

                        {loan.installments && onViewDetails && (
                          <button 
                            onClick={() => onViewDetails(loan)}
                            title="Ver Parcelas"
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/30"
                          >
                            <List className="w-5 h-5" />
                          </button>
                        )}

                        {!readOnly && loan.status !== 'paid' && (
                          <button 
                            onClick={() => handleStatusChange(loan, 'paid')}
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

      {/* Modal de Edição de Datas */}
      {editingLoan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-secondary w-full max-w-md rounded-2xl border border-accent/50 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-yellow-400" />
                Editar Vencimentos
              </h3>
              <button onClick={() => setEditingLoan(null)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 mb-6 custom-scrollbar">
              {editingLoan.installments && editingLoan.installments.length > 0 ? (
                 <div className="space-y-3">
                    <p className="text-sm text-slate-400">Ajuste as datas das parcelas deste empréstimo:</p>
                    {editInstallments.map((inst, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-dark/50 p-3 rounded-lg border border-accent/30">
                        <span className="text-sm font-bold text-slate-300 w-8">{inst.number}ª</span>
                        <input 
                          type="date"
                          value={new Date(inst.dueDate).toISOString().split('T')[0]}
                          onChange={(e) => handleInstallmentDateChange(idx, e.target.value)}
                          className="bg-dark border border-accent rounded px-2 py-1 text-white text-sm focus:border-primary focus:outline-none"
                        />
                        <span className="text-xs text-emerald-400 font-mono">
                          {inst.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    ))}
                 </div>
              ) : (
                <div>
                   <label className="block text-sm text-slate-400 mb-2">Nova Data de Vencimento</label>
                   <input 
                      type="date"
                      value={editSingleDate}
                      onChange={(e) => setEditSingleDate(e.target.value)}
                      className="w-full bg-dark border border-accent rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                   />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setEditingLoan(null)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={saveEdits}
                disabled={saving}
                className="flex-1 py-3 bg-primary hover:bg-emerald-600 text-dark font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {saving ? 'Salvando...' : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoanList;
