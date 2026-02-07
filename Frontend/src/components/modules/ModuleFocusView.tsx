import React, { useState, useMemo, memo, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useUIStore } from '../../store/useUIStore';
import { useSchemaStore } from '../../store/useSchemaStore';
import { Module, MODULE_NAMES, Join } from '../../types';
import { X, Link as LinkIcon, Check, RotateCcw, LogOut, Key, FileText, Tag, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { FocusTableCard } from './FocusTableCard';

interface ModuleFocusViewProps {
    module: Module;
}

const JOIN_COLORS = [
    '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316', '#EF4444',
];
const getJoinColor = (index: number) => JOIN_COLORS[index % JOIN_COLORS.length];

const Legend: React.FC<{
    hasDesc: boolean,
    hasKeywords: boolean,
    onEdit: () => void
}> = ({ hasDesc, hasKeywords, onEdit }) => (
    <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-foreground/40 ml-8">
        <div className="flex items-center gap-2">
            <Key size={12} className="text-yellow-500" />
            <span>PK</span>
        </div>
        <div className="flex items-center gap-2">
            <LinkIcon size={12} className="text-accent" />
            <span>FK</span>
        </div>
        <div className="flex items-center gap-4 border-l border-border pl-6">
            <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <span>Join Reference</span>
            </div>

            <div className="flex items-center gap-2 border-l border-border pl-4">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    className={clsx(
                        "font-bold px-2 py-0.5 rounded border transition-colors",
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
                        onEdit();
                    }}
                    className={clsx(
                        "font-bold px-2 py-0.5 rounded border transition-colors",
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
);

export const ModuleFocusView: React.FC<ModuleFocusViewProps> = memo(({ module }) => {
    const {
        moduleAssignments,
        stagedJoins,
        moduleData,
        addStagedJoin,
        updateStagedJoin,
        removeStagedJoin,
        confirmModuleChanges,
        cancelModuleChanges,
        initStagedJoins,
        removeColumnFromModule,
    } = useStore();

    const { setFocusedModule, modelingSelectedColumn, setModelingSelectedColumn, setToast } = useUIStore();
    const { dbTables } = useSchemaStore();

    const [localDescription, setLocalDescription] = useState('');
    const [localKeywords, setLocalKeywords] = useState<string[]>([]);
    const [localTableMetadata, setLocalTableMetadata] = useState<Record<string, { description?: string, keywords?: string[] }>>({});
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const [expandedTableNames, setExpandedTableNames] = useState<Set<string>>(new Set());

    const [editDescription, setEditDescription] = useState('');
    const [editKeywords, setEditKeywords] = useState('');
    const [isEditingModuleMetadata, setIsEditingModuleMetadata] = useState(false);
    const [editingTableId, setEditingTableId] = useState<string | null>(null);

    useEffect(() => {
        const mData = moduleData[module] || {};
        setLocalDescription(mData.description || '');
        setLocalKeywords(mData.keywords || []);
        setLocalTableMetadata(structuredClone(mData.tableMetadata || {}));
        initStagedJoins(module);
    }, [module, moduleData, initStagedJoins]);

    const isDirty = useMemo(() => {
        const mData = moduleData[module] || {};
        const joinsChanged = JSON.stringify(stagedJoins) !== JSON.stringify(mData.joins || []);
        const descChanged = localDescription !== (mData.description || '');
        const keywordsChanged = localKeywords.join(',') !== (mData.keywords?.join(',') || '');
        const tableMetaChanged = JSON.stringify(localTableMetadata) !== JSON.stringify(mData.tableMetadata || {});
        return joinsChanged || descChanged || keywordsChanged || tableMetaChanged;
    }, [stagedJoins, localDescription, localKeywords, localTableMetadata, module, moduleData]);

    useEffect(() => {
        if (isEditingModuleMetadata) {
            setEditDescription(localDescription);
            setEditKeywords(localKeywords.join(', '));
        } else if (editingTableId) {
            const tableMeta = localTableMetadata[editingTableId] || {};
            setEditDescription(tableMeta.description || '');
            setEditKeywords(tableMeta.keywords?.join(', ') || '');
        }
    }, [isEditingModuleMetadata, editingTableId, localDescription, localKeywords, localTableMetadata]);

    const handleSaveMetadata = () => {
        const keywords = editKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
        if (isEditingModuleMetadata) {
            setLocalDescription(editDescription);
            setLocalKeywords(keywords);
            setIsEditingModuleMetadata(false);
            setToast("Module metadata staged.", "success");
        } else if (editingTableId) {
            setLocalTableMetadata(prev => ({
                ...prev,
                [editingTableId]: { description: editDescription, keywords: keywords }
            }));
            setEditingTableId(null);
            setToast("Table metadata staged.", "success");
        }
    };

    const handleCloseModal = () => {
        setIsEditingModuleMetadata(false);
        setEditingTableId(null);
    };

    const moduleTables = useMemo(() => {
        const assignedTableNames = moduleAssignments[module] || [];
        const assignedSet = new Set(assignedTableNames);
        return dbTables.filter(t => assignedSet.has(t.table_name));
    }, [moduleAssignments, module, dbTables]);

    const includedColumns = useMemo(() => {
        return moduleData[module]?.includedColumns || {};
    }, [moduleData, module]);

    const handleRevert = () => {
        cancelModuleChanges(module);
        setToast("Changes reverted.", "success");
    };

    const handleConfirm = () => {
        confirmModuleChanges(module);
        setToast("Changes saved successfully.", "success");
    };

    const handleExitAttempt = () => {
        if (isDirty) {
            setShowExitConfirmation(true);
        } else {
            setFocusedModule(null);
        }
    };

    const handleColumnClick = (tableName: string, colName: string, colType: string) => {
        if (!modelingSelectedColumn) {
            setModelingSelectedColumn({ tableName, colName, type: colType });
            setToast(`Select target column to join with ${colName}`, "success");
        } else {
            if (modelingSelectedColumn.tableName === tableName && modelingSelectedColumn.colName === colName) {
                setModelingSelectedColumn(null);
                return;
            }
            addStagedJoin({
                leftTable: modelingSelectedColumn.tableName,
                leftColumn: modelingSelectedColumn.colName,
                rightTable: tableName,
                rightColumn: colName,
                type: 'LEFT'
            });
            setModelingSelectedColumn(null);
            setToast("Join staged.", "success");
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopImmediatePropagation();
                // Priority 1: Close Metadata Modal (Module or Table)
                if (isEditingModuleMetadata || editingTableId) {
                    handleCloseModal();
                    return;
                }

                // Priority 2: Blur inputs if they are focused but no modal is open
                if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
                    (document.activeElement as HTMLElement).blur();
                    return;
                }

                // Priority 3: Cancel Join Modeling
                if (modelingSelectedColumn) {
                    setModelingSelectedColumn(null);
                    return;
                }

                // Priority 4: Exit Module
                handleExitAttempt();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDirty, isEditingModuleMetadata, editingTableId, modelingSelectedColumn, handleExitAttempt]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full bg-background flex flex-col overflow-y-auto custom-scrollbar text-foreground relative"
        >
            <div className="max-w-[1700px] mx-auto w-full flex-1 flex flex-col gap-6 p-8">
                {/* Sticky Header */}
                <div className="flex items-center justify-between border-b border-border pb-6 shrink-0 sticky top-0 bg-background/80 backdrop-blur-xl z-[100] -mx-8 px-8 pt-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-accent/20 text-white">
                            {MODULE_NAMES[module][0]}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-bold text-foreground/90 tracking-tight">{MODULE_NAMES[module]}</h2>
                                <Legend
                                    hasDesc={localDescription.length > 0}
                                    hasKeywords={localKeywords.length > 0}
                                    onEdit={() => setIsEditingModuleMetadata(true)}
                                />
                            </div>
                            <p className="text-foreground/40 text-sm font-medium">Data Modeling Workspace</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-foreground/[0.03] rounded-xl p-1 border border-border">
                            <button
                                onClick={handleRevert}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-foreground/[0.05] text-foreground/60 hover:text-foreground transition-all font-medium"
                                title="Undo all unconfirmed changes"
                            >
                                <RotateCcw size={18} />
                                <span>Revert</span>
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent font-bold transition-all border border-accent/20"
                                title="Commit staged joins to module"
                            >
                                <Check size={18} />
                                <span>Save Changes</span>
                            </button>
                        </div>
                        <div className="w-[1px] h-8 bg-border" />
                        <button
                            onClick={handleExitAttempt}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/[0.03] hover:bg-red-500/10 text-foreground/60 hover:text-red-400 transition-all border border-border hover:border-red-500/20 font-bold"
                        >
                            <LogOut size={18} />
                            <span>Exit</span>
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {(isEditingModuleMetadata || editingTableId) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-background/60 backdrop-blur-md z-[200] flex items-center justify-center p-6"
                            onClick={handleCloseModal}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-surface border border-border rounded-3xl p-8 w-full max-w-xl shadow-2xl relative"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-accent/20 rounded-lg">
                                            {isEditingModuleMetadata ? (
                                                <FileText className="text-accent" size={20} />
                                            ) : (
                                                <Tag className="text-accent" size={20} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground/90">
                                                {isEditingModuleMetadata ? "Module Metadata" : "Table Metadata"}
                                            </h3>
                                            <p className="text-xs text-foreground/40 font-medium">
                                                {isEditingModuleMetadata ? MODULE_NAMES[module] : editingTableId?.replace('dbo.', '')}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={handleCloseModal} className="p-2 hover:bg-foreground/[0.05] rounded-xl transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest ml-1">Description</label>
                                        <textarea
                                            autoFocus
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            placeholder="What is this for?"
                                            className="w-full bg-foreground/[0.02] border border-border rounded-2xl p-4 min-h-[120px] text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all resize-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest ml-1">Keywords</label>
                                        <input
                                            value={editKeywords}
                                            onChange={(e) => setEditKeywords(e.target.value)}
                                            placeholder="e.g. users, auth, session"
                                            className="w-full bg-foreground/[0.02] border border-border rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-mono"
                                        />
                                        <p className="text-[10px] text-foreground/30 ml-1 italic">Separate keywords with commas</p>
                                    </div>
                                </div>
                                <div className="mt-10 flex gap-3">
                                    <button onClick={handleCloseModal} className="flex-1 px-6 py-2.5 rounded-xl bg-foreground/[0.05] hover:bg-foreground/[0.1] text-foreground font-bold transition-all">
                                        Cancel
                                    </button>
                                    <button onClick={handleSaveMetadata} className="flex-1 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold transition-all shadow-lg shadow-accent/20">
                                        Apply
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex-1 flex gap-8">
                    <div className="flex-1 min-w-0">
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-8 pb-40">
                            {moduleTables.map(table => (
                                <FocusTableCard
                                    key={table.table_name}
                                    table={table}
                                    module={module}
                                    localTableMetadata={localTableMetadata}
                                    onEditMetadata={() => setEditingTableId(table.table_name)}
                                    modelingSelectedColumn={modelingSelectedColumn}
                                    stagedJoins={stagedJoins}
                                    includedColumns={includedColumns}
                                    handleColumnClick={handleColumnClick}
                                    removeColumnFromModule={removeColumnFromModule}
                                    isExpanded={expandedTableNames.has(table.table_name)}
                                    onExpand={() => setExpandedTableNames(prev => {
                                        const next = new Set(prev);
                                        if (next.has(table.table_name)) next.delete(table.table_name);
                                        else next.add(table.table_name);
                                        return next;
                                    })}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Join Sidebar - Sticky */}
                    <div className="w-80 shrink-0 relative">
                        <div className="sticky top-32 max-h-[calc(100vh-160px)] flex flex-col gap-6">
                            <div className="bg-foreground/[0.01] rounded-3xl border border-border p-6 flex-1 flex flex-col overflow-hidden">
                                <h4 className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.2em] mb-6">Staged Joins ({stagedJoins.length})</h4>
                                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                                    {stagedJoins.length === 0 ? (
                                        <div className="text-center py-20 opacity-20 italic text-sm">
                                            No joins created yet.<br />Select columns to join.
                                        </div>
                                    ) : (
                                        stagedJoins.map((join, index) => (
                                            <div key={join.id} className="group relative p-4 bg-foreground/[0.03] rounded-2xl border border-border hover:border-accent/40 transition-all flex flex-col gap-4">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: getJoinColor(index) }} />
                                                <div className="flex flex-col gap-3 pl-2">
                                                    <div className="flex items-center justify-between gap-3 overflow-hidden">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-foreground/30 text-[9px] truncate uppercase tracking-tighter">{join.leftTable.replace('dbo.', '')}</div>
                                                            <div className="text-foreground font-bold truncate text-[11px]">{join.leftColumn}</div>
                                                        </div>
                                                        <div className="text-[12px] font-black" style={{ color: getJoinColor(index) }}>＝</div>
                                                        <div className="flex-1 min-w-0 text-right">
                                                            <div className="text-foreground/30 text-[9px] truncate uppercase tracking-tighter">{join.rightTable.replace('dbo.', '')}</div>
                                                            <div className="text-foreground font-bold truncate text-[11px]">{join.rightColumn}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-4 gap-1 p-1 bg-foreground/[0.03] rounded-xl border border-border">
                                                    {(['INNER', 'LEFT', 'RIGHT', 'FULL'] as Join['type'][]).map((t) => (
                                                        <button
                                                            key={t}
                                                            onClick={() => updateStagedJoin(join.id, { type: t })}
                                                            className={clsx(
                                                                "text-[10px] font-black py-1.5 rounded-lg transition-all uppercase tracking-tighter",
                                                                join.type === t ? "bg-accent text-white shadow-sm" : "text-foreground/40 hover:text-foreground hover:bg-foreground/[0.05]"
                                                            )}
                                                        >
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => removeStagedJoin(join.id)}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg border-2 border-background"
                                                >
                                                    <X size={12} strokeWidth={3} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selection Bar */}
            <AnimatePresence>
                {modelingSelectedColumn && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-surface/90 backdrop-blur-2xl border border-accent/50 rounded-2xl p-5 flex items-center gap-8 shadow-2xl z-[150] min-w-[500px]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center border border-accent/40">
                                <LinkIcon size={18} className="text-accent" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-accent font-black">Joining From</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-foreground/40 font-mono text-sm">{modelingSelectedColumn.tableName}</span>
                                    <span className="text-foreground font-bold text-lg">.{modelingSelectedColumn.colName}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-end gap-6 border-l border-border pl-8">
                            <span className="text-foreground/40 text-sm animate-pulse">Select target column to complete join</span>
                            <button onClick={() => setModelingSelectedColumn(null)} className="p-2.5 bg-foreground/[0.03] hover:bg-foreground/[0.08] rounded-xl text-foreground/40 hover:text-foreground transition-all border border-border">
                                <X size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Exit Confirmation */}
            <AnimatePresence>
                {showExitConfirmation && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-background border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <AlertCircle className="text-accent" size={24} />
                                Unsaved Changes
                            </h3>
                            <p className="text-foreground/60 mb-8 font-medium">
                                You have unsaved modeling changes. Do you want to save them before exiting?
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => { handleConfirm(); setFocusedModule(null); }}
                                    className="w-full py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all"
                                >
                                    Save & Exit
                                </button>
                                <button
                                    onClick={() => { handleRevert(); setFocusedModule(null); }}
                                    className="w-full py-3 bg-foreground/[0.05] hover:bg-red-500/10 text-foreground/60 hover:text-red-400 rounded-xl font-bold transition-all border border-border"
                                >
                                    Discard Changes
                                </button>
                                <button onClick={() => setShowExitConfirmation(false)} className="w-full py-2 text-foreground/40 hover:text-foreground text-sm font-medium transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

ModuleFocusView.displayName = 'ModuleFocusView';
