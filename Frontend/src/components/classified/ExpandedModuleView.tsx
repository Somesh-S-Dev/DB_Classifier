import React, { useMemo, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { X, Maximize2 } from 'lucide-react';
import { Module, MODULE_NAMES, DBTable, Join } from '../../types';
import { TableNode } from './TableNode';
import { JoinLinesCanvas } from './JoinLinesCanvas';
import { sortTablesForLayout } from '../../utils/layout';

export type TableViewState = 'MINIMAL' | 'ACTIVE' | 'RELATED';


interface Props {
    module: Module;
    tables: string[];
    allDbTables: DBTable[];
    joins: Join[];
    includedColumns: Record<string, string[]>;
    onClose: () => void;
}

const HEIGHT_MAP = {
    MINIMAL: 80,
    RELATED: 160,
    ACTIVE: 400
};

export const ExpandedModuleView: React.FC<Props> = memo(({
    module,
    tables,
    allDbTables,
    joins,
    includedColumns,
    onClose,
}) => {
    // Debug Logging
    console.log('[ExpandedModuleView] Render:', {
        module,
        tablesCount: tables.length,
        tables,
        allDbTablesCount: allDbTables.length,
        joinsCount: joins.length
    });



    const [lockedTableIds, setLockedTableIds] = useState<Set<string>>(new Set());

    // Only use locked tables for active state (no hover)
    const activeTableIds = useMemo(() => {
        return lockedTableIds;
    }, [lockedTableIds]);

    const sortedTables = useMemo(() => {
        const moduleTables = allDbTables.filter(t => tables.includes(t.table_name));
        return sortTablesForLayout(moduleTables, joins);
    }, [allDbTables, tables, joins]);

    const getViewState = useCallback((tableId: string): TableViewState => {
        if (activeTableIds.size === 0) return 'MINIMAL';
        if (activeTableIds.has(tableId)) return 'ACTIVE';

        const isRelated = joins.some(j =>
            (activeTableIds.has(j.leftTable) && j.rightTable === tableId) ||
            (activeTableIds.has(j.rightTable) && j.leftTable === tableId)
        );

        return isRelated ? 'RELATED' : 'MINIMAL';
    }, [activeTableIds, joins]);

    // Dynamic layout calculation based on state
    const layout = useMemo(() => {
        const columns = 4; // Increased from 3 to use more horizontal space
        const cellWidth = 320;
        const padding = 40;
        const colHeights = new Array(columns).fill(padding);

        return sortedTables.map((table, index) => {
            const col = index % columns;
            const state = getViewState(table.table_name);
            const height = HEIGHT_MAP[state];

            const position = {
                top: colHeights[col],
                left: col * cellWidth + padding
            };

            colHeights[col] += height + 24; // Update current column height for next table

            return {
                table,
                position,
                state,
                height
            };
        });
    }, [sortedTables, getViewState]);

    const handleTableClick = (tableId: string) => {
        setLockedTableIds(prev => {
            const next = new Set(prev);
            if (next.has(tableId)) {
                next.delete(tableId);
            } else {
                next.add(tableId);
            }
            return next;
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full mt-6 relative"
        >
            <div className="p-8 rounded-[2rem] bg-foreground/[0.02] border border-border relative">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

                <div className="flex items-center justify-between mb-8 relative z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-accent/20">
                            {MODULE_NAMES[module][0]}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-foreground">{MODULE_NAMES[module]}</h2>
                            <p className="text-xs font-bold text-foreground/30 uppercase tracking-widest mt-0.5 flex items-center gap-2">
                                <Maximize2 size={12} /> Smart Inspection Mode
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-foreground/[0.05] border border-border flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/[0.1] transition-all group"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                <div
                    id="expanded-view-container"
                    className="relative w-full pb-12 transition-all duration-500"
                >
                    <JoinLinesCanvas joins={joins} hasActiveTable={activeTableIds.size > 0} />

                    <div className="relative z-10 transition-all duration-500">
                        {layout.map(({ table, position, state, height }) => {
                            // Logic: If includedColumns record is missing/undefined, default to ALL columns.
                            // Logic: If includedColumns record is missing/undefined, default to ALL columns.
                            // BUT if it is [], it means ALL columns are excluded. So we must check !== undefined.
                            const tableIncluded = includedColumns[table.table_name];
                            const columnsToShow = tableIncluded !== undefined ? tableIncluded : table.columns.map(c => c.name);

                            return (
                                <TableNode
                                    key={table.table_name}
                                    table={table}
                                    joins={joins}
                                    position={position}
                                    viewState={state}
                                    height={height}
                                    activeTableIds={activeTableIds}
                                    includedColumns={columnsToShow}
                                    onClick={() => handleTableClick(table.table_name)}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
});
