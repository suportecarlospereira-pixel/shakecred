import React, { useState, useEffect } from 'react';
import { loanService } from './services/loanService';
import { clientService } from './services/clientService';
import { Loan, Client, DashboardStats } from './types';
import Login from './components/Login';
import CalculatorComp from './components/Calculator';
import LoanList from './components/LoanList';
import ActiveView from './components/ActiveView';
import HistoryView from './components/HistoryView';
import ClientsView from './components/ClientsView';
import ClientHistoryModal from './components/ClientHistoryModal';
import { LayoutDashboard, Users, LogOut, TrendingUp, Wallet, DollarSign, History, AlertTriangle, XCircle, UserPlus } from 'lucide-react';
import { auth } from './firebase';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'active' | 'history' | 'clients'>('dashboard');
  const [permissionError, setPermissionError] = useState(false);
  
  // Centralized Modal State
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setPermissionError(false);
    try {
      // Fetch both loans and clients
      const [loansData, clientsData] = await Promise.all([
        loanService.getLoans(),
        clientService.getClients()
      ]);
      setLoans(loansData);
      setClients(clientsData);
    } catch (error: any) {
      console.error("Failed to fetch data", error);
      if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
        setPermissionError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthenticated(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const stats: DashboardStats = {
    totalLent: loans.reduce((acc, curr) => acc + curr.amount, 0),
    totalReceivable: loans.filter(l => l.status === 'active').reduce((acc, curr) => acc + curr.totalOwing, 0),
    totalProfit: loans.reduce((acc, curr) => acc + curr.profit, 0),
    activeLoansCount: loans.filter(l => l.status === 'active').length
  };
  
  const loansDueTodayCount = loans.filter(l => {
    if (l.status !== 'active') return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(l.dueDate);
    due.setHours(0,0,0,0);
    return due <= today;
  }).length;

  const handleLogout = () => {
    auth.signOut();
    setIsAuthenticated(false);
    setLoans([]);
    setClients([]);
    setPermissionError(false);
  };

  // Helper to open details from any LoanList
  const handleViewDetails = (loan: Loan) => {
    if (!loan.clientId) return;
    const client = clients.find(c => c.id === loan.clientId);
    if (client) {
      setSelectedClientForHistory(client);
    }
  };

  // Helper to open details from Client List
  const handleOpenClientHistory = (client: Client) => {
    setSelectedClientForHistory(client);
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  if (permissionError) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="bg-secondary p-8 rounded-2xl border border-red-500/50 max-w-lg w-full shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-red-500/20 rounded-full">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Acesso ao Banco de Dados Negado</h2>
            <p className="text-slate-300">
              O Firebase Firestore recusou a conexão. Isso geralmente acontece por causa das <strong>Regras de Segurança</strong>.
            </p>
            
            <div className="bg-dark p-4 rounded-lg text-left text-sm text-slate-400 w-full border border-accent/30">
              <p className="font-bold text-white mb-2">Solução:</p>
              <ol className="list-decimal pl-4 space-y-2">
                <li>Vá ao Console do Firebase → Firestore Database → Rules.</li>
                <li>Habilite o modo de teste ou configure as permissões corretas.</li>
              </ol>
            </div>

            <button 
              onClick={fetchData}
              className="px-6 py-3 bg-primary hover:bg-emerald-600 text-dark font-bold rounded-xl transition-colors w-full"
            >
              Tentar Novamente
            </button>
            <button 
              onClick={handleLogout}
              className="text-slate-500 hover:text-white transition-colors text-sm"
            >
              Voltar para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch(view) {
      case 'active':
        return <ActiveView loans={loans} onUpdate={fetchData} onViewDetails={handleViewDetails} />;
      case 'history':
        return <HistoryView loans={loans} onUpdate={fetchData} onViewDetails={handleViewDetails} />;
      case 'clients':
        return <ClientsView clients={clients} loans={loans} onUpdate={fetchData} onViewClientHistory={handleOpenClientHistory} />;
      default: // Dashboard
        return (
          <>
            <header className="mb-8 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Visão Geral</h2>
                <p className="text-slate-400">Bem-vindo de volta, Chefe.</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500 uppercase font-bold">Saldo a Receber</p>
                <p className="text-2xl font-bold text-primary">
                  {stats.totalReceivable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-secondary p-6 rounded-2xl border border-accent/50 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <DollarSign className="w-24 h-24 text-primary" />
                </div>
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span className="text-slate-400 font-medium">Total Emprestado</span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {stats.totalLent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h3>
              </div>

              <div className="bg-secondary p-6 rounded-2xl border border-accent/50 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-24 h-24 text-emerald-500" />
                </div>
                 <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-slate-400 font-medium">Lucro Projetado</span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {stats.totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h3>
              </div>

              <div className="bg-secondary p-6 rounded-2xl border border-accent/50 shadow-lg relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Users className="w-24 h-24 text-orange-500" />
                </div>
                 <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-orange-500/20 rounded-lg text-orange-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-slate-400 font-medium">Empréstimos Ativos</span>
                </div>
                <h3 className="text-2xl font-bold text-white">{stats.activeLoansCount}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-1">
                <CalculatorComp 
                  onLoanAdded={fetchData} 
                  clients={clients} 
                  onNavigateToClients={() => setView('clients')} 
                />
              </div>
              <div className="xl:col-span-2">
                <LoanList 
                  title="Últimos Lançamentos" 
                  loans={loans.slice(0, 5)} 
                  onUpdate={fetchData} 
                  onViewDetails={handleViewDetails}
                />
              </div>
            </div>
          </>
        );
    }
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col md:flex-row relative">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-secondary border-r border-accent/30 flex flex-col shrink-0">
        <div className="p-6 border-b border-accent/30">
          <h1 className="text-2xl font-black text-primary tracking-tighter flex items-center gap-2">
            <Wallet className="w-8 h-8" />
            SHAKE CRED
          </h1>
          <p className="text-xs text-slate-500 mt-1">Gestão Profissional</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${view === 'dashboard' ? 'bg-primary text-secondary shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-accent/20 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          
          <button 
            onClick={() => setView('clients')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${view === 'clients' ? 'bg-primary text-secondary shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-accent/20 hover:text-white'}`}
          >
            <UserPlus className="w-5 h-5" />
            Cadastrar Cliente
          </button>

          <button 
            onClick={() => setView('active')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium ${view === 'active' ? 'bg-primary text-secondary shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-accent/20 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              Ativos / Cobrar
            </div>
            {loansDueTodayCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {loansDueTodayCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => setView('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${view === 'history' ? 'bg-primary text-secondary shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-accent/20 hover:text-white'}`}
          >
            <History className="w-5 h-5" />
            Histórico & Lucro
          </button>
        </nav>

        <div className="p-4 border-t border-accent/30">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Global Modal */}
      {selectedClientForHistory && (
        <ClientHistoryModal 
          client={selectedClientForHistory} 
          loans={loans.filter(l => l.clientId === selectedClientForHistory.id)}
          onClose={() => setSelectedClientForHistory(null)} 
          onUpdate={fetchData}
        />
      )}
    </div>
  );
};

export default App;