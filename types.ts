export interface Client {
  id?: string;
  name: string;
  phone?: string;
  notes?: string;
  activeLoans?: number; // Contador auxiliar (opcional)
  createdAt: number;
}

export interface Loan {
  id?: string;
  clientId?: string; // ID do cliente vinculado
  clientName: string;
  amount: number; // Valor emprestado
  interestRate: number; // Porcentagem
  totalOwing: number; // Valor final a receber
  profit: number; // Lucro calculado
  startDate: string; // ISO date
  dueDate: string; // ISO date
  status: 'active' | 'paid' | 'late';
  notes?: string;
  createdAt: number;
}

export interface DashboardStats {
  totalLent: number;
  totalReceivable: number;
  totalProfit: number;
  activeLoansCount: number;
}