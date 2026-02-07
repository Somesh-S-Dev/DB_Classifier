export type Module =
    | 'sale_order_fg'
    | 'sales_return'
    | 'production_planning'
    | 'mrp'
    | 'purchase'
    | 'yarn_job_work'
    | 'winding'
    | 'warping'
    | 'sizing'
    | 'knitting_weaving'
    | 'job_work'
    | 'in_house_production'
    | 'packing_despatch'
    | 'warehouse'
    | 'maintenance'
    | 'finance'
    | 'mis';

export const MODULE_NAMES: Record<Module, string> = {
    sale_order_fg: 'Sale Order (FG)',
    sales_return: 'Sales Return',
    production_planning: 'Production Planning',
    mrp: 'MRP',
    purchase: 'Purchase',
    yarn_job_work: 'Yarn Job Work',
    winding: 'Winding',
    warping: 'Warping',
    sizing: 'Sizing',
    knitting_weaving: 'Knitting / Weaving',
    job_work: 'Job Work',
    in_house_production: 'In House FG Production',
    packing_despatch: 'Packing / Despatch',
    warehouse: 'Warehouse',
    maintenance: 'Maintenance',
    finance: 'Finance',
    mis: 'MIS'
};

export interface StateSnapshot {
    moduleAssignments: Record<Module, string[]>;
    trashedTables: string[];
    moduleData: Record<Module, ModuleData>;
    stagedJoins: Join[];
    modelingSelectedColumn: { tableName: string, colName: string, type: string } | null;
}

export interface Join {
    id: string;
    leftTable: string;
    leftColumn: string;
    rightTable: string;
    rightColumn: string;
    type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
}

export interface ForeignKey {
    column: string;
    references: {
        table: string;
        column: string;
    };
}

export interface DBColumn {
    name: string;
    type: string;
    nullable: boolean;
}

export interface DBTable {
    table_name: string;
    columns: DBColumn[];
    primary_keys: string[];
    foreign_keys: ForeignKey[];
}

export interface DBSchema {
    tables: DBTable[];
}

export interface ModuleData {
    joins: Join[];
    includedColumns: Record<string, string[]>;
    description?: string;
    keywords?: string[];
    tableMetadata?: Record<string, { // TableName -> Metadata
        description?: string;
        keywords?: string[];
    }>;
}

export interface AppState {
    // Core Module Data
    moduleAssignments: Record<Module, string[]>;
    trashedTables: string[];
    moduleData: Record<Module, ModuleData>;
    stagedJoins: Join[];

    // Undo/Redo
    undoStack: StateSnapshot[];
    redoStack: StateSnapshot[];

    // Session Management
    sessionMetadata: {
        sessionId: string;
        startedAt: string;
        lastUpdatedAt: string;
    } | null;

    // Assignment Actions
    assignTableToModule: (tableName: string, module: Module) => void;
    removeTableFromModule: (table: string, module: Module) => void;
    removeColumnFromModule: (module: Module, table: string, column: string) => void;
    unassignTable: (tableName: string) => void;
    trashTable: (table: string) => void;
    restoreTable: (table: string) => void;

    // Placement Actions (Business Logic Only)
    commitPlacementMode: (modules: Module[], table: string) => void;

    // Modeling Actions
    initStagedJoins: (module: Module) => void;
    addStagedJoin: (join: Omit<Join, 'id'>) => void;
    updateStagedJoin: (joinId: string, updates: Partial<Omit<Join, 'id'>>) => void;
    removeStagedJoin: (joinId: string) => void;
    confirmModuleChanges: (module: Module, metadataUpdates?: Partial<ModuleData>) => void;
    cancelModuleChanges: (module: Module) => void;

    // History Actions
    undo: () => void;
    redo: () => void;

    // Changes Tracking
    isDirty: boolean;
    setDirty: (dirty: boolean) => void;

    // Module Metadata Actions
    setModuleDescription: (module: Module, description: string) => void;
    setModuleKeywords: (module: Module, keywords: string[]) => void;

    // Table Metadata Actions
    setTableDescription: (module: Module, table: string, description: string) => void;
    setTableKeywords: (module: Module, table: string, keywords: string[]) => void;

    // Workspace Actions
    loadWorkspace: (token: string) => Promise<void>;
    loadSessionById: (token: string, sessionId: string) => Promise<void>;
    deleteSession: (token: string, sessionId: string) => Promise<void>;
    exportSession: (token: string) => Promise<void>;
}
