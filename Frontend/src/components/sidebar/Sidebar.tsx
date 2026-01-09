import React, { useEffect, useMemo, useState, memo, useDeferredValue } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useSchemaStore } from '../../store/useSchemaStore';
import { useUIStore } from '../../store/useUIStore';
import { motion } from 'framer-motion';
import { TableCard } from './TableCard';
import { clsx } from 'clsx';
import { Module, DBTable } from '../../types';
import { FixedSizeList as List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';

// --- Types ---
interface SafeSidebarData {
    safeList: readonly string[];
    safeUsageMap: Record<string, number>;
    columnCountMap: Record<string, number>;
}

const ROW_HEIGHT = 60; // Increased to fit card content without shrinking

// --- Safe Adapter Hook ---
const useSidebarSafeData = (
    allTables: string[] | undefined,
    dbTables: DBTable[] | undefined,
    moduleAssignments: Record<Module, string[]> | undefined,
    trashedTables: string[] | undefined,
    searchQuery: string
): SafeSidebarData => {
    return useMemo(() => {
        const rawTables = Array.isArray(allTables) ? allTables : [];
        const rawDbTables = Array.isArray(dbTables) ? dbTables : [];
        const rawAssignments = (moduleAssignments && typeof moduleAssignments === 'object') ? moduleAssignments : {} as Record<Module, string[]>;
        const rawTrash = Array.isArray(trashedTables) ? trashedTables : [];
        const query = (searchQuery || '').toLowerCase().trim();

        // 1. Compute Safe Usage Map & Column Count Map
        const safeUsageMap: Record<string, number> = {};
        Object.values(rawAssignments).forEach(tables => {
            if (Array.isArray(tables)) {
                tables.forEach(table => {
                    if (table) {
                        safeUsageMap[table] = (safeUsageMap[table] || 0) + 1;
                    }
                });
            }
        });

        const columnCountMap: Record<string, number> = {};
        rawDbTables.forEach(t => {
            columnCountMap[t.table_name] = t.columns.length;
        });

        const normalizedQuery = query.replace(/ /g, '_');

        // 2. Compute Safe List (Filtering & Priority Sorting)
        const matches = rawTables.reduce((acc, table) => {
            if (!table) return acc;
            if (rawTrash.includes(table)) return acc;
            if (!normalizedQuery) {
                acc.push({ table, priority: 0 });
                return acc;
            }

            const cleanTable = table.toLowerCase().replace('dbo.', '');
            const rawTableLower = table.toLowerCase();

            if (cleanTable.startsWith(normalizedQuery) || rawTableLower.startsWith(normalizedQuery)) {
                acc.push({ table, priority: 1 });
            } else if (cleanTable.includes(normalizedQuery) || rawTableLower.includes(normalizedQuery)) {
                acc.push({ table, priority: 2 });
            }

            return acc;
        }, [] as { table: string; priority: number }[]);

        const safeList = matches
            .sort((a, b) => {
                if (a.priority !== b.priority) return a.priority - b.priority;
                const countA = safeUsageMap[a.table] || 0;
                const countB = safeUsageMap[b.table] || 0;
                if (countA !== countB) return countB - countA;
                return a.table.localeCompare(b.table);
            })
            .map(m => m.table);

        return { safeList, safeUsageMap, columnCountMap };
    }, [allTables, dbTables, moduleAssignments, trashedTables, searchQuery]);
};

// --- Row Component (Virtualized) ---
interface SidebarRowProps {
    index: number;
    style: React.CSSProperties;
    data: {
        safeList: readonly string[];
        safeUsageMap: Record<string, number>;
        columnCountMap: Record<string, number>;
        activePlacementTable: string | null;
        startPlacementMode: (table: string) => void;
        trashTable: (table: string) => void;
    };
}

const SidebarRow = memo(({ index, style, data }: SidebarRowProps) => {
    const table = data.safeList[index];
    const columnCount = data.columnCountMap[table] || 0;
    const usageCount = data.safeUsageMap[table] || 0;
    const isSelected = data.activePlacementTable === table;
    const isDisabled = data.activePlacementTable !== null && data.activePlacementTable !== table;

    return (
        <div style={style} className="px-2 py-1">
            <TableCard
                table={table}
                columnCount={columnCount}
                usageCount={usageCount}
                isSelected={isSelected}
                isDisabled={isDisabled}
                className={clsx(
                    "cursor-pointer h-full",
                    isSelected && "shadow-lg scale-[1.02]"
                )}
                onTrash={!isSelected ? () => data.trashTable(table) : undefined}
                onClick={() => !isDisabled && data.startPlacementMode(table)}
            />
        </div>
    );
});
SidebarRow.displayName = 'SidebarRow';

export const Sidebar: React.FC = memo(() => {
    const { allTables, dbTables, isLoading, error } = useStoreWithEqualityFn(useSchemaStore, (s) => ({
        allTables: s.allTables,
        dbTables: s.dbTables,
        isLoading: s.isLoading,
        error: s.error
    }), shallow);

    // UI State
    const { searchQuery: globalSearchQuery, setSearchQuery, sidebarCollapsed, setSidebarCollapsed, activePlacementTable, startPlacementMode } = useStoreWithEqualityFn(useUIStore, (s) => ({
        searchQuery: s.searchQuery,
        setSearchQuery: s.setSearchQuery,
        sidebarCollapsed: s.sidebarCollapsed,
        setSidebarCollapsed: s.setSidebarCollapsed,
        activePlacementTable: s.activePlacementTable,
        startPlacementMode: s.startPlacementMode
    }), shallow);

    // Business Data
    const { moduleAssignments, trashedTables, trashTable } = useStoreWithEqualityFn(useStore, (s) => ({
        moduleAssignments: s.moduleAssignments,
        trashedTables: s.trashedTables,
        trashTable: s.trashTable
    }), shallow);

    const [localQuery, setLocalQuery] = useState(globalSearchQuery);
    const deferredQuery = useDeferredValue(localQuery);

    useEffect(() => {
        const timer = setTimeout(() => setSearchQuery(localQuery), 150);
        return () => clearTimeout(timer);
    }, [localQuery, setSearchQuery]);

    const { safeList, safeUsageMap, columnCountMap } = useSidebarSafeData(
        allTables,
        dbTables,
        moduleAssignments,
        trashedTables,
        deferredQuery
    );

    const listData = useMemo(() => ({
        safeList,
        safeUsageMap,
        columnCountMap,
        activePlacementTable,
        startPlacementMode,
        trashTable
    }), [safeList, safeUsageMap, columnCountMap, activePlacementTable, startPlacementMode, trashTable]);

    return (
        <>
            <motion.aside
                initial={false}
                animate={{
                    width: sidebarCollapsed ? 0 : 360,
                    opacity: sidebarCollapsed ? 0 : 1
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex-shrink-0 bg-surface/50 border-r border-border flex flex-col z-40 relative shadow-2xl shadow-black/5 h-full overflow-hidden"
            >
                <div className="min-w-[360px] flex flex-col h-full bg-surface/50">
                    {/* Header */}
                    <div className="p-4 border-b border-border/50 flex items-center justify-between shrink-0">
                        <div className="relative flex-1 mr-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all text-foreground shadow-sm"
                                value={localQuery}
                                onChange={(e) => setLocalQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Content Wrapper - Must be flex-1 min-h-0 for virtualization */}
                    <div className="flex-1 min-h-0 relative">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-surface/80 backdrop-blur-sm">
                                <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
                            </div>
                        )}

                        {error && <div className="text-red-500 text-xs text-center p-4">{error}</div>}

                        {!isLoading && !error && safeList.length === 0 && (
                            <div className="text-foreground/40 text-sm text-center p-8">
                                No tables found.
                            </div>
                        )}

                        {!isLoading && !error && safeList.length > 0 && (
                            <div className="h-full w-full">
                                <AutoSizer
                                    renderProp={({ height, width }) => (
                                        <List
                                            height={height || 0}
                                            width={width || 0}
                                            itemCount={safeList.length}
                                            itemSize={ROW_HEIGHT}
                                            itemData={listData}
                                            className="custom-scrollbar"
                                        >
                                            {SidebarRow}
                                        </List>
                                    )}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* Toggle Button */}
            <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={clsx(
                    "absolute top-1/2 -translate-y-1/2 z-[100] w-6 h-12 bg-surface/50 backdrop-blur-md border border-l-0 border-border rounded-r-xl flex items-center justify-center text-foreground/40 hover:text-accent hover:bg-surface transition-all shadow-xl",
                    sidebarCollapsed ? "left-0" : "left-[360px]"
                )}
                style={{ transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
            >
                {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
        </>
    );
});

Sidebar.displayName = 'Sidebar';
