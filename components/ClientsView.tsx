import React, { useState } from 'react';
import { Client, Loan } from '../types';
import { clientService } from '../services/clientService';
import { Plus, User, Phone, Trash2, Search, FileText } from 'lucide-react';

interface ClientsViewProps {
  clients: Client[];
  loans: Loan[];
  onUpdate: () => void;
  onViewClientHistory: (client: Client) => void;
}

const ClientsView: React.FC<ClientsViewProps> = ({ clients, loans, onUpdate, onViewClientHistory }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Client Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    setLoading(true);
    try {
      await clientService.addClient({
        name,
        phone,
        notes,
        createdAt: Date.now()
      });
      setName('');
      setPhone('');
      setNotes('');
      setShowAddForm(false);
      onUpdate();
    } catch (error) {
      console.error(error);
      alert("Erro ao criar cliente. Verifique se você está logado.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza? Isso apagará o cadastro do cliente, mas manterá os empréstimos existentes no histórico.")) {
      try {
        await clientService.deleteClient(id);
        onUpdate();
      } catch (error) {
        console.error("Erro na exclusão:", error);
        alert("Não foi possível excluir. Verifique se você está logado no sistema (Permissão Negada).");
      }
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm)
  );

  const getClientStats = (clientId: string) => {
    const clientLoans = loans.filter(l => l.clientId === clientId);
    const active = clientLoans.filter(l => l.status === 'active').length;
    const paid = clientLoans.filter(l => l.status === 'paid').length;
    const debt = clientLoans.filter(l => l.status === 'active').reduce((acc, curr) => {
      // Calcular dívida real subtraindo parcelas pagas
      if (curr.installments) {
        const paidAmount = curr.installments.filter(i => i.status === 'paid').reduce((sum, inst) => sum + inst.amount, 0);
        return acc + (curr.totalOwing - paidAmount);
      }
      return acc + curr.totalOwing;
    }, 0);
    return { active, paid, debt, allLoans: clientLoans };
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-white mb-1">Clientes Cadastrados</h2>
            <p className="text-slate-400">Gerencie sua carteira de contatos.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary hover:bg-emerald-600 text-dark font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </header>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-secondary p-6 rounded-2xl border border-primary/30 shadow-lg animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-white mb-4">Adicionar Cliente</h3>
          <form onSubmit={handleAddClient} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm text-slate-400 mb-1">Nome Completo</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-dark border border-accent rounded-lg p-3 text-white focus:outline-none focus:border-primary"
                placeholder="Ex: Maria Oliveira"
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm text-slate-400 mb-1">Telefone / WhatsApp</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-dark border border-accent rounded-lg p-3 text-white focus:outline-none focus:border-primary"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm text-slate-400 mb-1">Observações</label>
              <input 
                type="text" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-dark border border-accent rounded-lg p-3 text-white focus:outline-none focus:border-primary"
                placeholder="Onde mora, referência..."
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-2 mt-2">
              <button 
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="bg-primary text-dark font-bold px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                {loading ? 'Salvando...' : 'Salvar Cadastro'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar cliente por nome ou telefone..."
          className="w-full bg-secondary border border-accent/50 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary"
        />
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full text-center p-8 text-slate-500">
            Nenhum cliente encontrado.
          </div>
        ) : (
          filteredClients.map(client => {
            const stats = getClientStats(client.id!);
            return (
              <div key={client.id} className="bg-secondary p-5 rounded-2xl border border-accent/30 hover:border-primary/30 transition-all group relative">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{client.name}</h4>
                      {client.phone && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(client.id!)}
                    className="text-slate-600 hover:text-red-400 p-2"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {client.notes && (
                  <p className="text-xs text-slate-500 mb-4 bg-dark/50 p-2 rounded-lg truncate">
                    {client.notes}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-accent/30 pt-3 mt-2">
                  <div className="text-slate-400">
                    Ativos: <span className="text-white font-bold">{stats.active}</span>
                  </div>
                   <div className="text-slate-400">
                    Histórico: <span className="text-emerald-400 font-bold">{stats.paid} pagos</span>
                  </div>
                  <div className="col-span-2 text-slate-400 mt-1">
                    Deve: <span className="text-red-400 font-bold text-sm">
                      {stats.debt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>

                {/* Open History Button */}
                <button 
                  onClick={() => onViewClientHistory(client)}
                  className="w-full mt-4 bg-accent/20 hover:bg-accent/40 text-slate-300 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors border border-accent/30"
                >
                  <FileText className="w-4 h-4" />
                  Ver Histórico Detalhado
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ClientsView;
