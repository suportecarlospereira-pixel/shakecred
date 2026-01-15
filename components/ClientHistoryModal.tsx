import React, { useState } from 'react';
import { X, Calendar, DollarSign, CheckCircle, Clock, FileText, Check } from 'lucide-react';
import { Client, Loan } from '../types';
import { loanService } from '../services/loanService';

interface ClientHistoryModalProps {
  client: Client;
  loans: Loan[];
  onClose: () => void;
  onUpdate: () => void; // Para atualizar dados após pagamento
}

const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({ client, loans, onClose, onUpdate }) => {
  const activeLoans = loans.filter(l => l.status === 'active');
  const paidLoans = loans.filter(l => l.status === 'paid');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR');
  };

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handlePayInstallment = async (loanId: string, installmentNumber: number) => {
    if (!window.confirm(`Confirmar recebimento da parcela ${installmentNumber}?`)) return;
    
    setProcessingId(`${loanId}-${installmentNumber}`);
    try {
      await loanService.payInstallment(loanId, installmentNumber);
      onUpdate(); // Recarrega os dados
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar parcela.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-secondary w-full max-w-4xl max-h-[90vh] rounded-2xl border border-accent/50 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-accent/50 flex justify-between items-start bg-dark/30">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {client.name}
            </h2>
            <div className="flex gap-4 mt-2 text-sm text-slate-400">
              {client.phone && <span>📞 {client.phone}</span>}
              <span>📅 Cliente desde {formatDate(new Date(client.createdAt).toISOString())}</span>
            </div>
            {client.notes && (
              <p className="mt-2 text-sm bg-accent/20 p-2 rounded border border-accent/30 text-slate-300">
                📝 {client.notes}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Active Loans Section */}
          <section>
            <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Empréstimos Ativos (Em Aberto)
            </h3>
            
            {activeLoans.length === 0 ? (
              <p className="text-slate-500 italic">Nenhum empréstimo ativo no momento.</p>
            ) : (
              <div className="space-y-4">
                {activeLoans.map(loan => {
                  // Calcular quanto falta pagar
                  const paidAmount = loan.installments 
                    ? loan.installments.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0)
                    : 0;
                  const remaining = loan.totalOwing - paidAmount;

                  return (
                    <div key={loan.id} className="bg-dark/40 border border-blue-500/20 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-2">
                        <div>
                          <p className="text-slate-400 text-sm">Valor Emprestado</p>
                          <p className="text-white font-bold">{formatMoney(loan.amount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-sm">Restante a Pagar</p>
                          <p className="text-blue-400 font-bold text-xl">
                            {formatMoney(remaining)} 
                            <span className="text-xs text-slate-500 font-normal ml-1">
                               (Total: {formatMoney(loan.totalOwing)})
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Installments Breakdown */}
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Parcelas (Clique para receber)</p>
                        {loan.installments && loan.installments.length > 0 ? (
                          <div className="space-y-2">
                            {loan.installments.map((inst, idx) => {
                              const isPaid = inst.status === 'paid';
                              const isProcessing = processingId === `${loan.id}-${inst.number}`;

                              return (
                                <div key={idx} className={`flex justify-between items-center text-sm p-3 rounded border transition-all ${isPaid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-dark border-accent/20'}`}>
                                  <span className={isPaid ? 'text-emerald-400 font-medium' : 'text-slate-300 font-medium'}>
                                    {inst.number}ª Parcela
                                  </span>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <span className={isPaid ? 'text-emerald-400 font-bold block' : 'text-white font-bold block'}>
                                        {formatMoney(inst.amount)}
                                      </span>
                                      <span className={`text-xs flex items-center justify-end gap-1 ${new Date(inst.dueDate) < new Date() && !isPaid ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(inst.dueDate)}
                                      </span>
                                    </div>

                                    {isPaid ? (
                                      <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/20 px-2 py-1 rounded-full">
                                        <Check className="w-3 h-3" /> PAGO
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handlePayInstallment(loan.id!, inst.number)}
                                        disabled={isProcessing}
                                        className="bg-primary hover:bg-emerald-600 text-dark font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                                      >
                                        {isProcessing ? '...' : 'Receber'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex justify-between items-center text-sm p-2 bg-dark rounded border border-accent/20">
                            <span className="text-slate-300">Pagamento Único</span>
                            <span className="text-white font-bold">{formatMoney(loan.totalOwing)}</span>
                            <span className="text-slate-400">{formatDate(loan.dueDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Paid Loans History */}
          <section>
            <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Histórico de Pagos (Finalizados)
            </h3>
            
            {paidLoans.length === 0 ? (
              <p className="text-slate-500 italic">Nenhum histórico de pagamento.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="p-3 rounded-tl-lg">Data Empréstimo</th>
                      <th className="p-3">Valor</th>
                      <th className="p-3">Total Pago</th>
                      <th className="p-3">Lucro</th>
                      <th className="p-3 rounded-tr-lg">Data Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paidLoans.map(loan => (
                      <tr key={loan.id} className="hover:bg-white/5">
                        <td className="p-3 text-slate-300">{formatDate(new Date(loan.createdAt).toISOString())}</td>
                        <td className="p-3 text-slate-300">{formatMoney(loan.amount)}</td>
                        <td className="p-3 text-emerald-400 font-bold">{formatMoney(loan.totalOwing)}</td>
                        <td className="p-3 text-green-300">+ {formatMoney(loan.profit)}</td>
                        <td className="p-3 text-slate-400">{formatDate(loan.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
};

export default ClientHistoryModal;