import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ColumnRow } from './ColumnRow';
import { DBTable, Join } from '../../types';
import { TableViewState } from './ExpandedModuleView';
import { clsx } from 'clsx';

interface Props {
    table: DBTable;
    joins: Join[];
    position: { top: number; left: number };
    viewState: TableViewState;
    height: number;
    activeTableIds: Set<string>;
    includedColumns: string[];
    onClick: () => void;
    onDeleteColumn?: (colName: string) => void;
}

export const TableNode: React.FC<Props> = ({
    table,
    joins,
    position,
    viewState,
    height,
    activeTableIds,
    includedColumns,
    onClick,
    onDeleteColumn
}) => {
    // Color palette for joins
    const JOIN_COLORS = [
        'rgb(59, 130, 246)',   // blue
        'rgb(168, 85, 247)',   // purple
        'rgb(236, 72, 153)',   // pink
        'rgb(34, 197, 94)',    // green
        'rgb(251, 146, 60)',   // orange
        'rgb(14, 165, 233)',   // sky
    ];

    const getJoinColor = (joinId: string) => {
        const index = joins.findIndex(j => j.id === joinId);
        return JOIN_COLORS[index % JOIN_COLORS.length];
    };

    const getColumnJoins = (tableName: string, colName: string) => {
        return joins.filter(j =>
            (j.leftTable === tableName && j.leftColumn === colName) ||
            (j.rightTable === tableName && j.rightColumn === colName)
        );
    };

    const isColumnJoined = (tableName: string, colName: string) => {
        return joins.some(j =>
            (j.leftTable === tableName && j.leftColumn === colName) ||
            (j.rightTable === tableName && j.rightColumn === colName)
        );
    };

    const sortedColumns = useMemo(() => {
        return table.columns
            .filter(col => includedColumns.includes(col.name))
            .sort((a, b) => {
                const isAPrimary = table.primary_keys.includes(a.name);
                const isBPrimary = table.primary_keys.includes(b.name);
                if (isAPrimary && !isBPrimary) return -1;
                if (!isAPrimary && isBPrimary) return 1;

                const isAForeign = table.foreign_keys.some(fk => fk.column === a.name);
                const isBForeign = table.foreign_keys.some(fk => fk.column === b.name);
                if (isAForeign && !isBForeign) return -1;
                if (!isAForeign && isBForeign) return 1;

                const isAJoined = isColumnJoined(table.table_name, a.name);
                const isBJoined = isColumnJoined(table.table_name, b.name);
                if (isAJoined && !isBJoined) return -1;
                if (!isAJoined && isBJoined) return 1;

                return 0;
            });
    }, [table, joins]);

    const relatedColumns = useMemo(() => {
        if (viewState !== 'RELATED' || activeTableIds.size === 0) return [];
        return table.columns
            .filter(col => includedColumns.includes(col.name))
            .filter(col =>
                joins.some(j =>
                    Array.from(activeTableIds).some(activeId =>
                        (j.leftTable === activeId && j.rightTable === table.table_name && j.rightColumn === col.name) ||
                        (j.rightTable === activeId && j.leftTable === table.table_name && j.leftColumn === col.name)
                    )
                )
            );
    }, [viewState, activeTableIds, table, joins, includedColumns]);

    return (
        <motion.div
            layout
            initial={false}
            data-table-id={table.table_name}
            animate={{
                top: position.top,
                left: position.left,
                height: height,
                opacity: (activeTableIds.size > 0 && viewState === 'MINIMAL') ? 0.3 : 1,
                scale: (viewState === 'ACTIVE') ? 1.02 : 1,
                zIndex: (viewState === 'ACTIVE') ? 50 : 10
            }}
            onClick={onClick}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={clsx(
                "absolute w-[280px] bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col group transition-colors cursor-pointer",
                viewState === 'ACTIVE' ? "border-accent/60 ring-2 ring-accent/10" : "hover:border-accent/40",
                viewState === 'RELATED' ? "border-accent/30 bg-accent/[0.02]" : ""
            )}
        >
            {/* Header */}
            <div className={clsx(
                "px-4 py-3 border-b border-border flex items-center justify-between shrink-0 transition-colors",
                viewState === 'ACTIVE' ? "bg-accent/5" : "bg-foreground/[0.02]"
            )}>
                <div className="min-w-0">
                    <h4 className={clsx(
                        "text-[11px] font-black uppercase tracking-[0.15em] truncate",
                        viewState === 'ACTIVE' ? "text-accent" : "text-foreground"
                    )}>
                        {table.table_name.replace('dbo.', '')}
                    </h4>
                    {viewState === 'MINIMAL' && (
                        <span className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest">
                            {includedColumns.length} cols
                        </span>
                    )}
                </div>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface/50">
                <div className="p-2 space-y-0.5">
                    {(viewState === 'RELATED' ? relatedColumns : sortedColumns).map(col => {
                        const isPrimary = table.primary_keys.includes(col.name);
                        const isForeign = !!table.foreign_keys.find(fk => fk.column === col.name);
                        const columnJoins = getColumnJoins(table.table_name, col.name);
                        const joinColors = columnJoins.map(j => getJoinColor(j.id));
                        const columnId = `${table.table_name}.${col.name}`;

                        return (
                            <ColumnRow
                                key={col.name}
                                columnName={col.name}
                                isPK={isPrimary}
                                isFK={isForeign}
                                columnId={columnId}
                                joinColors={joinColors}
                                onDelete={onDeleteColumn ? () => onDeleteColumn(col.name) : undefined}
                            />
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};
