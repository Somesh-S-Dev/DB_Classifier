import { create } from 'zustand';
import { DBTable } from '../types';

interface SchemaState {
    dbTables: DBTable[];
    allTables: string[]; // List of table names for quick lookup
    setDbTables: (tables: DBTable[]) => void;
    setAllTables: (tables: string[]) => void;

    fetchSchema: (token: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export const useSchemaStore = create<SchemaState>((set) => ({
    dbTables: [],
    allTables: [],
    isLoading: false,
    error: null,

    setDbTables: (tables) => set({ dbTables: tables }),
    setAllTables: (tables) => set({ allTables: tables }),

    fetchSchema: async (token: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('http://localhost:3001/schema', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch schema');
            const data = await response.json();
            set({
                dbTables: data.tables,
                allTables: data.tables.map((t: any) => t.table_name),
                isLoading: false
            });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            console.error(err);
        }
    }
}));
