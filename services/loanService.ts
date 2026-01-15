import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Loan } from '../types';

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

  // Update loan status
  updateLoanStatus: async (id: string, status: Loan['status']) => {
    try {
      const loanRef = doc(db, LOAN_COLLECTION, id);
      await updateDoc(loanRef, { status });
    } catch (e) {
      console.error("Error updating document: ", e);
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