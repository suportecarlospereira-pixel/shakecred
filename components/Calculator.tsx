import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Plus, User, Calendar } from 'lucide-react';
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
  const [intervalDays, setIntervalDays] = useState<number | string>(30); // Mudança de "Total Dias" para "Intervalo"
  const [installmentsCount, setInstallmentsCount] = useState<number>(1);
  const [selectedClientId, setSelectedClientId] = useState('');
  
  const [results, setResults] = useState({
    interestAmount: 0,
    totalToPay: 0,
    installmentValue: 0
  });

  const [previewInstallments, setPreviewInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Calcular Totais Financeiros
  useEffect(() => {
    const principal = Number(amount) || 0;
    const percentage = Number(rate) || 0;
    
    const interest = principal * (percentage / 100);
    const total = principal + interest;
    const count = Number(installmentsCount) || 1;
    
    setResults({
      interestAmount: interest,
      totalToPay: total,
      installmentValue: total / count
    });

  }, [amount, rate, installmentsCount]);

  // 2. Gerar Previsão de Parcelas (Datas e Valores)
  useEffect(() => {
    if (!installmentsCount || results.totalToPay === 0) {
      setPreviewInstallments([]);
      return;
    }

    const interval = Number(intervalDays) || 30;
    const count = Number(installmentsCount);
    const valuePerInstallment = results.totalToPay / count;

    const newInstallments: Installment[] = [];
    const baseDate = new Date(); // Data base é hoje
    
    for (let i = 1; i <= count; i++) {
      // Cria uma nova data baseada em Hoje + (Intervalo * numero da parcela)
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + (interval * i));
      
      // Ajuste para meio-dia para evitar problemas de fuso horário ao converter string
      date.setHours(12, 0, 0, 0); 
      
      newInstallments.push({
        number: i,
        amount: valuePerInstallment,
        dueDate: date.toISOString(),
        status: 'pending'
      });
    }
    setPreviewInstallments(newInstallments);

  }, [intervalDays, installmentsCount, results.totalToPay]);

  // Função para editar manualmente uma data na lista
  const handleDateChange = (installmentNumber: number, newDateValue: string) => {
    setPreviewInstallments(prev => prev.map(inst => {
      if (inst.number === installmentNumber) {
        // Criar data ao meio-dia para garantir consistência
        const newDate = new Date(newDateValue + 'T12:00:00');
        return { ...inst, dueDate: newDate.toISOString() };
      }
      return inst;
    }));
  };

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
      // A data final do empréstimo é a data da última parcela
      const finalDueDate = previewInstallments.length > 0 
        ? previewInstallments[previewInstallments.length - 1].dueDate 
        : new Date().toISOString();

      const newLoan: Omit<Loan, 'id'> = {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        amount: Number(amount),
        interestRate: Number(rate),
        totalOwing: results.totalToPay,
        profit: results.interestAmount,
        startDate: startDate.toISOString(),
        dueDate: finalDueDate,
        installments: previewInstallments, // Salva com as datas personalizadas
        status: 'active',
        createdAt: Date.now()
      };

      await loanService.addLoan(newLoan);
      
      // Reset form
      setAmount('');
      setInstallmentsCount(1);
      setIntervalDays(30);
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
    <div className="bg-secondary p-6 rounded-2xl shadow-xl border border-accent/50 h-full flex flex-col">
      <h2 className="text-xl font-bold text-emerald-400 mb-6 flex items-center gap-2 shrink-0">
        <TrendingUp className="w-5 h-5" />
        Novo Empréstimo
      </h2>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
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
              <label className="block text-sm text-slate-400 mb-1" title="Dias entre cada parcela">Intervalo (Dias)</label>
              <input 
                type="number" 
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
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
                {/* Gerando opções de 1x até 12x */}
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>{num}x</option>
                ))}
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
                <span className="text-slate-400">Lucro Estimado</span>
                <span className="text-emerald-400 font-bold">
                  {results.interestAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            {/* Installment Preview Editable */}
            {previewInstallments.length > 0 && (
              <div className="bg-secondary/50 rounded-lg p-3 border border-accent/20">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center justify-between">
                  <span>Configuração de Parcelas</span>
                  <span className="text-[10px] font-normal opacity-70">Edite as datas se necessário</span>
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {previewInstallments.map((inst) => (
                    <div key={inst.number} className="flex items-center justify-between text-xs gap-2">
                      <span className="text-slate-400 w-8">{inst.number}ª</span>
                      
                      {/* Date Input for Customization */}
                      <div className="flex-1">
                        <input 
                          type="date"
                          value={new Date(inst.dueDate).toISOString().split('T')[0]}
                          onChange={(e) => handleDateChange(inst.number, e.target.value)}
                          className="w-full bg-dark border border-accent/30 rounded px-2 py-1 text-white text-xs focus:border-primary focus:outline-none"
                        />
                      </div>

                      <span className="font-bold text-white min-w-[80px] text-right">
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
            className="w-full bg-primary hover:bg-emerald-600 text-dark font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
