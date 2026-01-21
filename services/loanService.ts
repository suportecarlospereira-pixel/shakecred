import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, getDoc, query, orderBy } from 'firebase/firestore';
import { Loan, Installment } from '../types';

const LOAN_COLLECTION = 'loans';

export const loanService = {
  // Add a new loan
  addLoan: async (loan: Omit<Loan, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, LOAN_COLLECTION), loan);
      return docRef.id;
    } catch (e) {
      console.error("Error adding document: ", e);
      throw e;
    }
  },

  // Get all loans
  getLoans: async (): Promise<Loan[]> => {
    try {
      const q = query(collection(db, LOAN_COLLECTION), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Loan));
    } catch (e) {
      console.error("Error getting documents: ", e);
      throw e;
    }
  },

  // Update loan status (Generic update for status)
  updateLoanStatus: async (id: string, status: Loan['status']) => {
    try {
      const loanRef = doc(db, LOAN_COLLECTION, id);
      await updateDoc(loanRef, { status });
    } catch (e) {
      console.error("Error updating document: ", e);
      throw e;
    }
  },

  // NOVA FUNÇÃO: Atualizar dados gerais do empréstimo (Datas, Parcelas, etc)
  updateLoan: async (id: string, data: Partial<Loan>) => {
    try {
      const loanRef = doc(db, LOAN_COLLECTION, id);
      await updateDoc(loanRef, data);
    } catch (e) {
      console.error("Error updating loan: ", e);
      throw e;
    }
  },

  // Pay a specific installment
  payInstallment: async (loanId: string, installmentNumber: number) => {
    try {
      const loanRef = doc(db, LOAN_COLLECTION, loanId);
      const loanSnap = await getDoc(loanRef);
      
      if (!loanSnap.exists()) throw new Error("Loan not found");
      
      const loanData = loanSnap.data() as Loan;
      
      if (!loanData.installments) return;

      // Update the specific installment
      const updatedInstallments = loanData.installments.map(inst => {
        if (inst.number === installmentNumber) {
          return { ...inst, status: 'paid' as const }; // Force type
        }
        return inst;
      });

      // Check if all installments are paid
      const allPaid = updatedInstallments.every(inst => inst.status === 'paid');
      const newStatus = allPaid ? 'paid' : 'active';

      await updateDoc(loanRef, {
        installments: updatedInstallments,
        status: newStatus
      });

    } catch (e) {
      console.error("Error paying installment: ", e);
      throw e;
    }
  },

  // Delete loan
  deleteLoan: async (id: string) => {
    try {
      await deleteDoc(doc(db, LOAN_COLLECTION, id));
    } catch (e) {
      console.error("Error deleting document: ", e);
      throw e;
    }
  }
};
