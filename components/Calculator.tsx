import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Plus, User, Calendar, Divide } from 'lucide-react';
import { Loan, Client, Installment } from '../types';
import { loanService } from '../services/loanService';

interface CalculatorProps {
  onLoanAdded: () => void;
  clients: Client[];
  onNavigateToClients: () => void;
}

const CalculatorComp: React.FC<CalculatorProps> = ({ onLoanAdded, clients, onNavigateToClients }) => {
  const [amount, setAmount] = useState<number | string>('');
  const [rate, setRate] = useState<number | string>(20);
  const [days, setDays] = useState<number | string>(30);
  const [installmentsCount, setInstallmentsCount] = useState<number>(1); // 1x, 2x, 3x...
  const [selectedClientId, setSelectedClientId] = useState('');
  
  const [results, setResults] = useState({
    interestAmount: 0,
    totalToPay: 0,
    dailyPayment: 0
  });

  const [previewInstallments, setPreviewInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate Totals
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

  // Calculate Dates Preview based on Days & Installments
  useEffect(() => {
    if (!days || !installmentsCount || results.totalToPay === 0) {
      setPreviewInstallments([]);
      return;
    }

    const totalDays = Number(days);
    const count = Number(installmentsCount);
    const intervalDays = Math.floor(totalDays / count);
    const installmentValue = results.totalToPay / count;

    const newInstallments: Installment[] = [];
    
    for (let i = 1; i <= count; i++) {
      const date = new Date();
      // Logic: If 60 days / 2x:
      // 1st = today + 30
      // 2nd = today + 60
      date.setDate(date.getDate() + (intervalDays * i));
      
      newInstallments.push({
        number: i,
        amount: installmentValue,
        dueDate: date.toISOString(),
        status: 'pending'
      });
    }
    setPreviewInstallments(newInstallments);

  }, [days, installmentsCount, results.totalToPay]);

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
      // Final due date is the date of the last installment
      const finalDueDate = previewInstallments.length > 0 
        ? previewInstallments[previewInstallments.length - 1].dueDate 
        : new Date(startDate.setDate(startDate.getDate() + Number(days))).toISOString();

      const newLoan: Omit<Loan, 'id'> = {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        amount: Number(amount),
        interestRate: Number(rate),
        totalOwing: results.totalToPay,
        profit: results.interestAmount,
        startDate: startDate.toISOString(),
        dueDate: finalDueDate,
        installments: previewInstallments, // Save the schedule
        status: 'active',
        createdAt: Date.now()
      };

      await loanService.addLoan(newLoan);
      
      // Reset form
      setAmount('');
      setInstallmentsCount(1);
      setDays(30);
      setSelectedClientId('');
      onLoanAdded();
      alert(`Empréstimo parcelado em ${installmentsCount}x criado com sucesso!`);
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

          <div className="grid grid-cols-3 gap-3">
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
              <label className="block text-sm text-slate-400 mb-1">Total Dias</label>
              <input 
                type="number" 
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full bg-dark border border-accent rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Parcelas</label>
              <select 
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                className="w-full bg-dark border border-accent rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
                <option value={4}>4x</option>
                <option value={5}>5x</option>
                <option value={6}>6x</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-4">
          <div className="bg-dark/50 p-6 rounded-xl border border-accent/30 flex-1">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center border-b border-accent/30 pb-2">
                <span className="text-slate-400">Total a Receber</span>
                <span className="text-white font-bold text-xl">
                  {results.totalToPay.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-slate-400">Lucro</span>
                <span className="text-emerald-400 font-bold">
                  {results.interestAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            {/* Installment Preview */}
            {previewInstallments.length > 0 && (
              <div className="bg-secondary/50 rounded-lg p-3 border border-accent/20">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Previsão de Recebimento</p>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {previewInstallments.map((inst) => (
                    <div key={inst.number} className="flex justify-between text-xs text-slate-300">
                      <span>{inst.number}ª Parcela ({new Date(inst.dueDate).toLocaleDateString('pt-BR')})</span>
                      <span className="font-bold text-white">
                        {inst.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleCreateLoan}
            disabled={loading || !amount || !selectedClientId}
            className="w-full bg-primary hover:bg-emerald-600 text-dark font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : (
              <>
                <Plus className="w-5 h-5" />
                Confirmar Empréstimo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculatorComp;