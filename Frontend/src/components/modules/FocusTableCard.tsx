import React, { memo, useMemo } from 'react';
import { clsx } from 'clsx';
import { Key, Link as LinkIcon, Trash2 } from 'lucide-react';
import { DBTable, Module, Join } from '../../types';

interface FocusTableCardProps {
    table: DBTable;
    module: Module;
    localTableMetadata: Record<string, { description?: string, keywords?: string[] }>;
    onEditMetadata: () => void;
    modelingSelectedColumn: { tableName: string, colName: string, type: string } | null;
    stagedJoins: Join[];
    includedColumns: Record<string, string[]>;
    isExpanded: boolean;
    onExpand: () => void;
    // Actions
    handleColumnClick: (tableName: string, colName: string, colType: string) => void;
    removeColumnFromModule: (module: Module, table: string, column: string) => void;
}

const JOIN_COLORS = [
    '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316', '#EF4444',
];
const getJoinColor = (index: number) => JOIN_COLORS[index % JOIN_COLORS.length];
const normalize = (col: string) => col.toLowerCase().replace(/_/g, '').replace(/id$/, '');

export const FocusTableCard: React.FC<FocusTableCardProps> = memo(({
    table,
    module,
    localTableMetadata,
    onEditMetadata,
    modelingSelectedColumn,
    stagedJoins,
    includedColumns,
    isExpanded,
    onExpand,
    handleColumnClick,
    removeColumnFromModule
}) => {
    const tableMetadata = localTableMetadata[table.table_name] || {};
    const hasDesc = !!tableMetadata.description;
    const hasKeywords = tableMetadata.keywords && tableMetadata.keywords.length > 0;

    const getColumnJoins = (tableName: string, colName: string) => {
        return stagedJoins
            .map((j, index) => ({ join: j, index }))
            .filter(({ join }) =>
                (join.leftTable === tableName && join.leftColumn === colName) ||
                (join.rightTable === tableName && join.rightColumn === colName)
            );
    };

    const isColumnStagedInJoin = (tableName: string, colName: string) => {
        return stagedJoins.some(j =>
            (j.leftTable === tableName && j.leftColumn === colName) ||
            (j.rightTable === tableName && j.rightColumn === colName)
        );
    };

    const getColumnScore = (colName: string) => {
        if (!modelingSelectedColumn || modelingSelectedColumn.tableName === table.table_name) return 0;

        const sName = normalize(modelingSelectedColumn.colName);
        const tName = normalize(colName);

        // FK Reference Match (highest priority)
        const fk = table.foreign_keys.find(f => f.column === colName);
        if (fk && fk.references.table === modelingSelectedColumn.tableName && fk.references.column === modelingSelectedColumn.colName) return 4;

        if (modelingSelectedColumn.colName === colName) return 3;
        if (sName === tName) return 2;

        return 0;
    };

    const sortedColumns = useMemo(() => {
        return [...table.columns].sort((a, b) => {
            const isAPrimary = table.primary_keys.includes(a.name);
            const isBPrimary = table.primary_keys.includes(b.name);
            if (isAPrimary && !isBPrimary) return -1;
            if (!isAPrimary && isBPrimary) return 1;

            const isAForeign = table.foreign_keys.some(fk => fk.column === a.name);
            const isBForeign = table.foreign_keys.some(fk => fk.column === b.name);
            if (isAForeign && !isBForeign) return -1;
            if (!isAForeign && isBForeign) return 1;

            const isAJoined = isColumnStagedInJoin(table.table_name, a.name);
            const isBJoined = isColumnStagedInJoin(table.table_name, b.name);
            if (isAJoined && !isBJoined) return -1;
            if (!isAJoined && isBJoined) return 1;

            const scoreA = getColumnScore(a.name);
            const scoreB = getColumnScore(b.name);
            if (scoreA !== scoreB) return scoreB - scoreA;

            return 0;
        });
    }, [table, stagedJoins, modelingSelectedColumn]);

    // Determine which columns to render based on expansion state
    const columnsToRender = useMemo(() => {
        const tableIncluded = includedColumns[table.table_name];
        const baseColumns = sortedColumns.filter(col => !tableIncluded || tableIncluded.includes(col.name));

        if (isExpanded) {
            return baseColumns;
        }

        // In collapsed state, only show PK, FK, Joined columns, or high-score matches
        return baseColumns.filter(col => {
            const isPK = table.primary_keys.includes(col.name);
            const fk = table.foreign_keys.find(f => f.column === col.name);
            const isJoined = isColumnStagedInJoin(table.table_name, col.name);
            const score = getColumnScore(col.name);
            return isPK || fk || isJoined || score > 0;
        });
    }, [isExpanded, sortedColumns, table, includedColumns, isColumnStagedInJoin]);

    return (
        <div
            className={clsx(
                "glass flex flex-col overflow-hidden border border-border transition-all duration-300 shadow-lg bg-surface/90",
                isExpanded ? "h-[450px]" : "h-auto max-h-[250px]"
            )}
        >
            <div
                className="p-3 flex items-center justify-between border-b border-border bg-surface/95 backdrop-blur-md cursor-pointer hover:bg-foreground/[0.02] transition-colors shrink-0"
                onClick={onExpand}
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <h3 className="font-bold truncate text-[13px] uppercase tracking-wider text-foreground/90 select-none">
                        {table.table_name.replace('dbo.', '')}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditMetadata();
                            }}
                            className={clsx(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors",
                                hasDesc
                                    ? "bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20"
                                    : "bg-red-500/10 border-red-500/30 text-red-500/60 hover:bg-red-500/20"
                            )}
                        >
                            Desc()
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditMetadata();
                            }}
                            className={clsx(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors",
                                hasKeywords
                                    ? "bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20"
                                    : "bg-red-500/10 border-red-500/30 text-red-500/60 hover:bg-red-500/20"
                            )}
                        >
                            Keys()
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {columnsToRender.map(col => {
                    const isPK = table.primary_keys.includes(col.name);
                    const fk = table.foreign_keys.find(f => f.column === col.name);
                    const isSelected = modelingSelectedColumn?.tableName === table.table_name && modelingSelectedColumn?.colName === col.name;
                    const isJoined = isColumnStagedInJoin(table.table_name, col.name);
                    const score = getColumnScore(col.name);

                    return (
                        <button
                            key={col.name}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleColumnClick(table.table_name, col.name, col.type);
                            }}
                            className={clsx(
                                "w-full flex items-center justify-between py-1.5 px-3 rounded-lg cursor-pointer transition-all border border-transparent group text-left",
                                isSelected ? "bg-accent/20 border-accent/40 shadow-inner" : "hover:bg-foreground/[0.03]",
                                isJoined && "bg-emerald-500/5 ring-1 ring-emerald-500/20",
                                score > 0 && !isSelected && "bg-accent/10 ring-1 ring-accent/30"
                            )}
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 shrink-0 min-w-[28px]">
                                    {isPK && <Key size={10} className="text-yellow-500 shrink-0" />}
                                    {fk && <LinkIcon size={10} className="text-accent shrink-0" />}
                                </div>
                                <span className={clsx(
                                    "text-[11px] font-medium transition-colors truncate",
                                    isSelected ? "text-accent" : "text-foreground/80"
                                )}>
                                    {col.name}
                                </span>
                            </div>

                            <div className="flex gap-1 shrink-0 ml-4 items-center">
                                {isExpanded && (
                                    <div
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded cursor-pointer text-foreground/20 hover:text-red-500"
                                        title="Exclude from module"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeColumnFromModule(module, table.table_name, col.name);
                                        }}
                                    >
                                        <Trash2 size={10} />
                                    </div>
                                )}

                                {getColumnJoins(table.table_name, col.name).map(({ index }) => (
                                    <div
                                        key={index}
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: getJoinColor(index) }}
                                    />
                                ))}
                            </div>
                        </button>
                    );
                })}
                {!isExpanded && columnsToRender.length === 0 && (
                    <div className="text-[10px] text-center py-4 text-foreground/20 italic">
                        No PK/FK or Joins
                    </div>
                )}
            </div>
        </div>
    );
});

FocusTableCard.displayName = 'FocusTableCard';
