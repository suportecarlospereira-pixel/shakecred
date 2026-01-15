import React from 'react';
import { X, Calendar, DollarSign, CheckCircle, Clock, FileText } from 'lucide-react';
import { Client, Loan } from '../types';

interface ClientHistoryModalProps {
  client: Client;
  loans: Loan[];
  onClose: () => void;
}

const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({ client, loans, onClose }) => {
  const activeLoans = loans.filter(l => l.status === 'active');
  const paidLoans = loans.filter(l => l.status === 'paid');

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR');
  };

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
                {activeLoans.map(loan => (
                  <div key={loan.id} className="bg-dark/40 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-2">
                      <div>
                        <p className="text-slate-400 text-sm">Valor Emprestado</p>
                        <p className="text-white font-bold">{formatMoney(loan.amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">Total a Pagar</p>
                        <p className="text-blue-400 font-bold text-xl">{formatMoney(loan.totalOwing)}</p>
                      </div>
                    </div>

                    {/* Installments Breakdown */}
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Cronograma de Pagamento</p>
                      {loan.installments && loan.installments.length > 0 ? (
                        <div className="space-y-2">
                          {loan.installments.map((inst, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm p-2 bg-dark rounded border border-accent/20">
                              <span className="text-slate-300 font-medium">Parcela {inst.number}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-white font-bold">{formatMoney(inst.amount)}</span>
                                <span className={`flex items-center gap-1 ${new Date(inst.dueDate) < new Date() ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(inst.dueDate)}
                                </span>
                              </div>
                            </div>
                          ))}
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
                ))}
              </div>
            )}
          </section>

          {/* Paid Loans History */}
          <section>
            <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Histórico de Pagos
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