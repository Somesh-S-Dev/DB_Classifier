import { create } from 'zustand';
import { Module } from '../types';

interface UIState {
    // Global
    sidebarCollapsed: boolean;
    searchQuery: string;
    toast: { message: string; type: 'success' | 'error' } | null;

    // Modals & Panels
    isTrashDrawerOpen: boolean;
    isSaveModalOpen: boolean;

    // Drag & Drop
    activeDragId: string | null;

    // Placement Mode
    activePlacementTable: string | null; // Table currently being placed into modules

    // Module Modeling (The "Editor" View)
    focusedModule: Module | null; // The module currently being edited
    modelingSelectedColumn: { tableName: string, colName: string, type: string } | null;

    // Actions
    setSidebarCollapsed: (collapsed: boolean) => void;
    setSearchQuery: (query: string) => void;
    setErrorMessage: (msg: string | null) => void;
    setToast: (message: string, type: 'success' | 'error') => void;
    setTrashDrawerOpen: (open: boolean) => void;
    setSaveModalOpen: (open: boolean) => void;
    setActiveDragId: (id: string | null) => void;

    startPlacementMode: (table: string) => void;
    cancelPlacementMode: () => void;

    setFocusedModule: (module: Module | null) => void;
    setModelingSelectedColumn: (col: { tableName: string, colName: string, type: string } | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarCollapsed: false,
    searchQuery: '',
    errorMessage: null, // Legacy support
    toast: null,
    isTrashDrawerOpen: false,
    isSaveModalOpen: false,
    activeDragId: null,
    activePlacementTable: null,
    focusedModule: null,
    modelingSelectedColumn: null,

    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setErrorMessage: (msg) => {
        // Alias to toast error
        if (msg) {
            set({ toast: { message: msg, type: 'error' } });
            setTimeout(() => set({ toast: null }), 3000);
        } else {
            set({ toast: null });
        }
    },
    setToast: (message, type) => {
        set({ toast: { message, type } });
        setTimeout(() => set({ toast: null }), 3000);
    },
    setTrashDrawerOpen: (open) => set({ isTrashDrawerOpen: open }),
    setSaveModalOpen: (open) => set({ isSaveModalOpen: open }),
    setActiveDragId: (id) => set({ activeDragId: id }),

    startPlacementMode: (table) => set({ activePlacementTable: table }),
    cancelPlacementMode: () => set({ activePlacementTable: null }),

    setFocusedModule: (module) => set({ focusedModule: module }),
    setModelingSelectedColumn: (col) => set({ modelingSelectedColumn: col }),
}));
