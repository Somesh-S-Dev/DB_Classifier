import { create } from 'zustand';
import { useSchemaStore } from './useSchemaStore';
import { useUIStore } from './useUIStore';
import { AppState, Module, StateSnapshot, ModuleData, Join, DBTable, MODULE_NAMES } from '../types';

const INITIAL_MODULE_ASSIGNMENTS: Record<Module, string[]> = {
    sale_order_fg: [],
    sales_return: [],
    production_planning: [],
    mrp: [],
    purchase: [],
    yarn_job_work: [],
    winding: [],
    warping: [],
    sizing: [],
    knitting_weaving: [],
    job_work: [],
    in_house_production: [],
    packing_despatch: [],
    warehouse: [],
    maintenance: [],
    finance: [],
    mis: [],
};

const INITIAL_MODULE_DATA: Record<Module, ModuleData> = Object.keys(INITIAL_MODULE_ASSIGNMENTS).reduce((acc, key) => {
    acc[key as Module] = { joins: [], includedColumns: {} };
    return acc;
}, {} as Record<Module, ModuleData>);

// Session Sync Helper
const syncToSessionStorage = (state: AppState) => {
    const sessionData = {
        sessionId: state.sessionMetadata?.sessionId || `session_${Date.now()}`,
        startedAt: state.sessionMetadata?.startedAt || new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        moduleAssignments: state.moduleAssignments,
        moduleData: state.moduleData,
        trashedTables: state.trashedTables
    };
    sessionStorage.setItem('activeClassifierSession', JSON.stringify(sessionData));
};

const getStoredSession = () => {
    try {
        const raw = sessionStorage.getItem('activeClassifierSession');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const storedSession = getStoredSession();

export const useStore = create<AppState>((set, get) => {
    // ... (keep snapshot helpers)
    const createSnapshot = (): StateSnapshot => {
        const { moduleAssignments, trashedTables, moduleData, stagedJoins } = get();
        // Remove modelingSelectedColumn from snapshot as it's UI state now
        return structuredClone({ moduleAssignments, trashedTables, moduleData, stagedJoins, modelingSelectedColumn: null });
    };

    const pushToUndo = () => {
        const snapshot = createSnapshot();
        set((state) => ({
            undoStack: [...state.undoStack, snapshot],
            redoStack: [],
            isDirty: true
        }));
    };

    return {
        // Core Data
        moduleAssignments: storedSession?.moduleAssignments || INITIAL_MODULE_ASSIGNMENTS,
        trashedTables: storedSession?.trashedTables || [],
        moduleData: storedSession?.moduleData || INITIAL_MODULE_DATA,
        stagedJoins: [],

        undoStack: [],
        redoStack: [],
        sessionMetadata: null,

        isDirty: false,
        setDirty: (dirty) => set({ isDirty: dirty }),

        // Assignment Actions
        assignTableToModule: (tableName: string, module: Module) => {
            pushToUndo();
            // Note: We don't have access to dbTables here anymore for includedColumns init.
            // Component calling this must ensure logic holds or we pass columns in.
            // For now, defaulting to empty or handling it differently?
            // Actually, removing the auto-include logic here might be tricky if we don't have schema.
            // Strategy: We will accept an optional `allColumns` arg or require the UI to pass it.
            // For this refactor step, let's just initialize empty and let the UI/Schema store handle the "All" logic?
            // BETTER: The component calling this (sidebar) has access to schema. 
            // BUT simpler: Just default to EMPTY array? No, that hides everything.
            // Lets Keep it simple: includedColumns uses a "if missing, show all" rule in export/view.
            // So if we just set it to *undefined* or don't set it, it defaults to ALL?
            // In types.ts/exportModule.ts we said: "If no record exists... assume ALL".
            // So we don't need to populate it on assignment!

            set(state => {
                const newAssignments = { ...state.moduleAssignments };
                Object.keys(newAssignments).forEach(mod => {
                    newAssignments[mod as Module] = newAssignments[mod as Module].filter(t => t !== tableName);
                });
                newAssignments[module] = [...newAssignments[module], tableName];

                // We do NOT need to set includedColumns here if we treat "missing key" as "all included".
                // This simplifies things massively.
                const nextState = {
                    ...state,
                    moduleAssignments: newAssignments,
                };
                syncToSessionStorage(nextState);
                return nextState;
            });
        },

        removeTableFromModule: (table: string, module: Module) => {
            pushToUndo();
            set((state) => {
                const newAssignments = { ...state.moduleAssignments };
                newAssignments[module] = newAssignments[module].filter((t: string) => t !== table);

                const newModuleData = { ...state.moduleData };
                // Clean up includedColumns if it exists
                if (newModuleData[module].includedColumns[table]) {
                    const newIncludedColumns = { ...newModuleData[module].includedColumns };
                    delete newIncludedColumns[table];
                    newModuleData[module] = {
                        ...newModuleData[module],
                        includedColumns: newIncludedColumns
                    };
                }

                const nextState = {
                    ...state,
                    moduleAssignments: newAssignments,
                    moduleData: newModuleData
                };
                syncToSessionStorage(nextState);
                return nextState;
            });
        },

        removeColumnFromModule: (module: Module, table: string, column: string) => {
            pushToUndo();
            set((state) => {
                const currentModuleData = state.moduleData[module];
                // If undefined, it means ALL columns are currently included (implicit). 
                // We must materialize the list minus the one removed.
                // Problem: We don't know "Table Columns" here to materialize the list.
                // This is a blocker.
                // Solution: Component must pass "current all columns" if we are initializing?
                // OR, we keep includedColumns as "EXCLUDED columns"? 
                // No, whitelist is safer.
                // Quick Fix for now: We assume the UI passes the materialized list? No, `removeColumn` signature is (mod, table, col).
                // We need Schema.
                // Alternative: `useStore` CAN import `useSchemaStore`?
                // No, cyclic dependencies.
                // Use `useSchemaStore.getState().dbTables` inside the action!

                // Dynamic import or direct access to store if it's singleton.
                // Since stores are created with `create`, we can import `useSchemaStore`.

                let currentColumns = currentModuleData.includedColumns[table];

                if (!currentColumns) {
                    // Logic: If not yet defined, it means ALL columns are included.
                    // We need to fetch the full list from schema and exclude only the target column.
                    const dbTables = useSchemaStore.getState().dbTables;
                    const tableMeta = dbTables.find((t: DBTable) => t.table_name === table);

                    if (!tableMeta) {
                        console.warn(`[useStore] Table metadata not found for ${table}`);
                        return state;
                    }

                    // Start with ALL columns
                    currentColumns = tableMeta.columns.map((c: any) => c.name);
                }

                const newColumns = currentColumns.filter((c: string) => c !== column);
                const newJoins = currentModuleData.joins.filter(j =>
                    !((j.leftTable === table && j.leftColumn === column) ||
                        (j.rightTable === table && j.rightColumn === column))
                );

                const nextState = {
                    ...state,
                    moduleData: {
                        ...state.moduleData,
                        [module]: {
                            ...currentModuleData,
                            includedColumns: {
                                ...currentModuleData.includedColumns,
                                [table]: newColumns
                            },
                            joins: newJoins
                        }
                    },
                    // Update staged if focused... wait, focusedModule is UI state. 
                    // We can't know if we are focused. 
                    // Actually, if we remove a column, we should probably clean staged joins anyway if that module is active?
                    // Let's just update moduleData for now.
                    // If UI is focused, it should probably reload or react?
                    // Staged joins are independent now.
                };
                syncToSessionStorage(nextState);
                return nextState;
            });
        },

        trashTable: (table: string) => {
            const { moduleAssignments } = get();
            const isUsed = Object.values(moduleAssignments).some(list => list.includes(table));
            if (isUsed) {
                useUIStore.getState().setErrorMessage(`Cannot trash "${table.replace('dbo.', '')}". It is already assigned to a module.`);
                return;
            }

            pushToUndo();
            set((state) => {
                const nextState = {
                    ...state,
                    trashedTables: [table, ...state.trashedTables],
                };
                syncToSessionStorage(nextState);

                // Cancel placement mode if active
                useUIStore.getState().cancelPlacementMode();

                return nextState;
            });
        },

        restoreTable: (table: string) => {
            pushToUndo();
            set((state) => {
                const nextState = {
                    ...state,
                    trashedTables: state.trashedTables.filter((t: string) => t !== table),
                };
                syncToSessionStorage(nextState);
                return nextState;
            });
        },

        commitPlacementMode: (modules: Module[], table: string) => {
            if (modules.length === 0) return;

            pushToUndo();
            set((state) => {
                const newAssignments = { ...state.moduleAssignments };
                modules.forEach((module) => {
                    if (!newAssignments[module].includes(table)) {
                        newAssignments[module] = [...newAssignments[module], table];
                    }
                });
                const nextState = {
                    ...state,
                    moduleAssignments: newAssignments,
                };
                syncToSessionStorage(nextState);
                return nextState;
            });
        },

        initStagedJoins: (module: Module) => {
            const { moduleData } = get();
            set({
                stagedJoins: moduleData[module] ? structuredClone(moduleData[module].joins) : []
            });
        },

        addStagedJoin: (joinData: Omit<Join, 'id'>) => {
            pushToUndo();
            const id = `join_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            set((state) => ({
                stagedJoins: [...state.stagedJoins, { ...joinData, id }]
            }));
        },

        removeStagedJoin: (joinId: string) => {
            pushToUndo();
            set((state) => ({
                stagedJoins: state.stagedJoins.filter(j => j.id !== joinId)
            }));
        },

        updateStagedJoin: (joinId: string, updates: Partial<Omit<Join, 'id'>>) => {
            pushToUndo();
            set((state) => ({
                stagedJoins: state.stagedJoins.map(j =>
                    j.id === joinId ? { ...j, ...updates } : j
                )
            }));
        },

        confirmModuleChanges: (module: Module, metadataUpdates?: Partial<ModuleData>) => {
            const { stagedJoins } = get();
            pushToUndo();
            set((state) => {
                const nextState = {
                    ...state,
                    moduleData: {
                        ...state.moduleData,
                        [module]: {
                            ...state.moduleData[module],
                            ...metadataUpdates,
                            joins: structuredClone(stagedJoins)
                        }
                    },
                };
                syncToSessionStorage(nextState);
                return nextState;
            });
        },

        cancelModuleChanges: (module: Module) => {
            const committedData = get().moduleData[module];
            set({
                stagedJoins: structuredClone(committedData.joins),
                undoStack: [],
                redoStack: []
            });
        },

        unassignTable: (tableName: string) => {
            // Basic implementation, just removes from all modules
            pushToUndo();
            set(state => {
                const newAssignments = { ...state.moduleAssignments };
                Object.keys(newAssignments).forEach(mod => {
                    newAssignments[mod as Module] = newAssignments[mod as Module].filter(t => t !== tableName);
                });
                const nextState = { ...state, moduleAssignments: newAssignments };
                syncToSessionStorage(nextState);
                return nextState;
            });
        },

        undo: () => {
            const { undoStack, redoStack } = get();
            if (undoStack.length === 0) return;
            const currentSnapshot = createSnapshot();
            const previousSnapshot = undoStack[undoStack.length - 1];

            set(state => {
                const nextState = {
                    ...state,
                    moduleAssignments: previousSnapshot.moduleAssignments,
                    trashedTables: previousSnapshot.trashedTables,
                    moduleData: previousSnapshot.moduleData,
                    stagedJoins: previousSnapshot.stagedJoins,
                    undoStack: undoStack.slice(0, -1),
                    redoStack: [...redoStack, currentSnapshot],
                    isDirty: true
                };
                syncToSessionStorage(nextState);
                return nextState;
            });
        },

        redo: () => {
            const { undoStack, redoStack } = get();
            if (redoStack.length === 0) return;
            const currentSnapshot = createSnapshot();
            const nextSnapshot = redoStack[redoStack.length - 1];

            set(state => {
                const nextState = {
                    ...state,
                    moduleAssignments: nextSnapshot.moduleAssignments,
                    trashedTables: nextSnapshot.trashedTables,
                    moduleData: nextSnapshot.moduleData,
                    stagedJoins: nextSnapshot.stagedJoins,
                    undoStack: [...undoStack, currentSnapshot],
                    redoStack: redoStack.slice(0, -1),
                    isDirty: true
                };
                syncToSessionStorage(nextState);
                return nextState;
            });
        },

        setModuleDescription: (module: Module, description: string) => {
            set(state => {
                const nextState = {
                    ...state,
                    moduleData: {
                        ...state.moduleData,
                        [module]: {
                            ...state.moduleData[module],
                            description
                        }
                    },
                    isDirty: true
                };
                syncToSessionStorage(nextState);
                return nextState;
            });
        },

        setModuleKeywords: (module: Module, keywords: string[]) => {
            set(state => {
                const nextState = {
                    ...state,
                    moduleData: {
                        ...state.moduleData,
                        [module]: {
                            ...state.moduleData[module],
                            keywords
                        }
                    },
                    isDirty: true
                };
                syncToSessionStorage(nextState);
                return nextState;
            });
        },
        // Table Metadata Actions
        setTableDescription: (module: Module, table: string, description: string) => {
            set(state => {
                const currentModuleData = state.moduleData[module];
                const currentTableMetadata = currentModuleData.tableMetadata || {};
                const currentTableData = currentTableMetadata[table] || {};

                const newModuleData = {
                    ...currentModuleData,
                    tableMetadata: {
                        ...currentTableMetadata,
                        [table]: {
                            ...currentTableData,
                            description
                        }
                    }
                };

                const nextState = {
                    ...state,
                    moduleData: {
                        ...state.moduleData,
                        [module]: newModuleData
                    },
                    isDirty: true
                };
                syncToSessionStorage(nextState);
                return nextState;
            });
        },

        setTableKeywords: (module: Module, table: string, keywords: string[]) => {
            set(state => {
                const currentModuleData = state.moduleData[module];
                const currentTableMetadata = currentModuleData.tableMetadata || {};
                const currentTableData = currentTableMetadata[table] || {};

                const newModuleData = {
                    ...currentModuleData,
                    tableMetadata: {
                        ...currentTableMetadata,
                        [table]: {
                            ...currentTableData,
                            keywords
                        }
                    }
                };

                const nextState = {
                    ...state,
                    moduleData: {
                        ...state.moduleData,
                        [module]: newModuleData
                    },
                    isDirty: true
                };
                syncToSessionStorage(nextState);
                return nextState;
            });
        },

        loadWorkspace: async (token: string) => {
            try {
                const response = await fetch('http://localhost:3001/sessions/latest', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) return;

                const session = await response.json();
                const responseData = session.data || {};

                // Compatibility layer for different payload structures
                const sessionData = responseData.sessionData || (responseData.assignments ? responseData : null);
                const sourceData = responseData.sourceData;

                if (sessionData && sessionData.assignments) {
                    set({
                        moduleAssignments: sessionData.assignments || INITIAL_MODULE_ASSIGNMENTS,
                        trashedTables: sessionData.trash || [],
                        moduleData: sessionData.module_modeling || INITIAL_MODULE_DATA,
                        stagedJoins: sessionData.stagedJoins || [],
                        isDirty: false
                    });

                    // Trigger toast from here as well since it's a major event
                    useUIStore.getState().setToast("Latest workspace loaded successfully", "success");

                    syncToSessionStorage(get());
                }

                if (sourceData) {
                    useSchemaStore.getState().setDbTables(sourceData);
                }
            } catch (err) {
                console.error('Failed to load workspace:', err);
            }
        },

        loadSessionById: async (token: string, sessionId: string) => {
            try {
                const response = await fetch(`http://localhost:3001/sessions/${sessionId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Failed to load session');

                const session = await response.json();
                const responseData = session.data || {};
                const sessionData = responseData.sessionData || (responseData.assignments ? responseData : null);
                const sourceData = responseData.sourceData;

                if (sessionData && sessionData.assignments) {
                    set({
                        moduleAssignments: sessionData.assignments,
                        trashedTables: sessionData.trash || [],
                        moduleData: sessionData.module_modeling || {},
                        stagedJoins: sessionData.stagedJoins || []
                    });
                    useUIStore.getState().setToast("Session loaded successfully", "success");
                    syncToSessionStorage(get());
                }

                if (sourceData) {
                    useSchemaStore.getState().setDbTables(sourceData);
                }
            } catch (err) {
                console.error('Failed to load specific session:', err);
                useUIStore.getState().setToast("Failed to load session", "error");
            }
        },

        deleteSession: async (token: string, sessionId: string) => {
            try {
                const response = await fetch(`http://localhost:3001/sessions/${sessionId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Delete failed');
                useUIStore.getState().setToast("Session removed successfully", "success");
            } catch (err) {
                console.error('Failed to delete session:', err);
                useUIStore.getState().setToast("Failed to delete session", "error");
            }
        },

        exportSession: async (token: string) => {
            const { moduleAssignments, moduleData } = get();

            try {
                const response = await fetch(`http://localhost:3001/sessions/export`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        moduleAssignments,
                        moduleData,
                        moduleNames: MODULE_NAMES
                    })
                });

                if (!response.ok) throw new Error('Export failed');

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `DB_Classifier_Export_${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                useUIStore.getState().setToast("Workspace exported successfully", "success");
            } catch (error: any) {
                useUIStore.getState().setToast(error.message, "error");
            }
        }
    };
});
