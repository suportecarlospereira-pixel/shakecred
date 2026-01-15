import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Client } from '../types';

const CLIENT_COLLECTION = 'clients';

export const clientService = {
  // Add a new client
  addClient: async (client: Omit<Client, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, CLIENT_COLLECTION), client);
      return docRef.id;
    } catch (e) {
      console.error("Error adding client: ", e);
      throw e;
    }
  },

  // Get all clients
  getClients: async (): Promise<Client[]> => {
    try {
      const q = query(collection(db, CLIENT_COLLECTION), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Client));
    } catch (e) {
      console.error("Error getting clients: ", e);
      throw e;
    }
  },

  // Update client
  updateClient: async (id: string, data: Partial<Client>) => {
    try {
      const clientRef = doc(db, CLIENT_COLLECTION, id);
      await updateDoc(clientRef, data);
    } catch (e) {
      console.error("Error updating client: ", e);
      throw e;
    }
  },

  // Delete client
  deleteClient: async (id: string) => {
    try {
      await deleteDoc(doc(db, CLIENT_COLLECTION, id));
    } catch (e) {
      console.error("Error deleting client: ", e);
      throw e;
    }
  }
};