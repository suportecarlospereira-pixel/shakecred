import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Plus, User } from 'lucide-react';
import { Loan, Client } from '../types';
import { loanService } from '../services/loanService';

interface CalculatorProps {
  onLoanAdded: () => void;
  clients: Client[];
  onNavigateToClients: () => void; // Para ir cadastrar se não existir
}

const CalculatorComp: React.FC<CalculatorProps> = ({ onLoanAdded, clients, onNavigateToClients }) => {
  const [amount, setAmount] = useState<number | string>('');
  const [rate, setRate] = useState<number | string>(20); // Default 20%
  const [days, setDays] = useState<number | string>(30); // Default 30 days
  const [selectedClientId, setSelectedClientId] = useState('');
  
  const [results, setResults] = useState({
    interestAmount: 0,
    totalToPay: 0,
    dailyPayment: 0
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const principal = Number(amount) || 0;
    const percentage = Number(rate) || 0;
    const duration = Number(days) || 1;

    const interest = principal * (percentage / 100);
    const total = principal + interest;
    
    setResults({
      interestAmount: interest,
      totalToPay: total,
      dailyPayment: total / duration
    });
  }, [amount, rate, days]);

  const handleCreateLoan = async () => {
    if (!amount || !selectedClientId) {
      alert("Selecione um cliente e preencha o valor.");
      return;
    }

    const selectedClient = clients.find(c => c.id === selectedClientId);
    if (!selectedClient) return;

    setLoading(true);
    try {
      const startDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(startDate.getDate() + (Number(days) || 30));

      const newLoan: Omit<Loan, 'id'> = {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        amount: Number(amount),
        interestRate: Number(rate),
        totalOwing: results.totalToPay,
        profit: results.interestAmount,
        startDate: startDate.toISOString(),
        dueDate: dueDate.toISOString(),
        status: 'active',
        createdAt: Date.now()
      };

      await loanService.addLoan(newLoan);
      setAmount('');
      setSelectedClientId('');
      onLoanAdded();
      alert(`Empréstimo registrado para ${selectedClient.name}!`);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar empréstimo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary p-6 rounded-2xl shadow-xl border border-accent/50">
      <h2 className="text-xl font-bold text-emerald-400 mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Novo Empréstimo
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
           <div>
            <label className="block text-sm text-slate-400 mb-1">Cliente</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <select 
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-dark border border-accent rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                >
                  <option value="">Selecione...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={onNavigateToClients}
                className="bg-accent/30 hover:bg-primary/20 hover:text-primary text-slate-400 p-3 rounded-lg transition-colors"
                title="Cadastrar Novo Cliente"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {clients.length === 0 && (
              <p className="text-xs text-orange-400 mt-1">Nenhum cliente cadastrado.</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Valor do Empréstimo (R$)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-dark border border-accent rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Juros (%)</label>
              <input 
                type="number" 
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full bg-dark border border-accent rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="20"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Prazo (Dias)</label>
              <input 
                type="number" 
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full bg-dark border border-accent rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="30"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-dark/50 p-6 rounded-xl border border-accent/30 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-accent/30 pb-2">
              <span className="text-slate-400">Lucro (Juros)</span>
              <span className="text-emerald-400 font-bold text-lg">
                + {results.interestAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
             <div className="flex justify-between items-center border-b border-accent/30 pb-2">
              <span className="text-slate-400">Total a Receber</span>
              <span className="text-white font-bold text-xl">
                {results.totalToPay.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
             <div className="flex justify-between items-center pb-2">
              <span className="text-slate-400">Custo Diário</span>
              <span className="text-slate-300">
                {results.dailyPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / dia
              </span>
            </div>
          </div>

          <button 
            onClick={handleCreateLoan}
            disabled={loading || !amount || !selectedClientId}
            className="w-full mt-6 bg-primary hover:bg-emerald-600 text-dark font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : (
              <>
                <Plus className="w-5 h-5" />
                Criar Empréstimo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculatorComp;