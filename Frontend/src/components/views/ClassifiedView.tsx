import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as LinkIcon, Table, Database, Download } from 'lucide-react';
import { sortTablesForLayout } from '../../utils/layout';
import { Module, MODULE_NAMES } from '../../types';
import { ExpandedModuleView } from '../classified/ExpandedModuleView';
import { clsx } from 'clsx';
import { exportModule } from '../../utils/exportModule';
import { useSchemaStore } from '../../store/useSchemaStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { AlertCircle, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { AppState } from '../../types';

export const ClassifiedView: React.FC = () => {
    const navigate = useNavigate();
    const [expandedModuleId, setExpandedModuleId] = useState<Module | null>(null);
    const dbTables = useSchemaStore(s => s.dbTables);
    const fetchSchema = useSchemaStore(s => s.fetchSchema);
    const { token } = useAuthStore();
    const toast = useUIStore(s => s.toast);

    useEffect(() => {
        if (dbTables.length === 0 && token) {
            fetchSchema(token);
        }
    }, [dbTables.length, token, fetchSchema]);

    const moduleAssignments = useStore((s: AppState) => s.moduleAssignments);
    const moduleData = useStore((s: AppState) => s.moduleData);

    const isSessionEmpty = useMemo(() => {
        return Object.values(moduleAssignments).every(tables => tables.length === 0);
    }, [moduleAssignments]);

    if (isSessionEmpty) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
                <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-foreground/[0.05] rounded-3xl flex items-center justify-center mx-auto border border-border opacity-20">
                        <Database size={40} className="text-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground/50">No Classified Session Found</h2>
                    <p className="text-foreground/20 max-w-md mx-auto">
                        You haven't classified any data yet. Head back to the studio to start building your data modules.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/80 transition-all shadow-lg shadow-accent/20"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="h-full overflow-y-auto p-12 custom-scrollbar flex flex-col">
            <div className="mb-12">
                <h1 className="text-5xl font-black text-foreground tracking-tight">Classified <span className="text-accent underline decoration-accent/30 underline-offset-8">View</span></h1>
                <p className="text-foreground/30 text-lg font-medium mt-2">Read-only session snapshot</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                {Object.entries(moduleAssignments).map(([mod, tables]) => {
                    const module = mod as Module;
                    if ((tables as string[]).length === 0) return null;

                    const joins = moduleData[module]?.joins || [];
                    const includedColumns = moduleData[module]?.includedColumns || {};

                    return (
                        <React.Fragment key={module}>
                            <motion.div
                                animate={{
                                    opacity: (expandedModuleId && expandedModuleId !== module) ? 0.4 : 1,
                                    scale: (expandedModuleId === module) ? 1.02 : 1
                                }}
                                onClick={() => setExpandedModuleId(expandedModuleId === module ? null : module)}
                                className={clsx(
                                    "glass group p-6 border-border hover:border-accent/30 transition-all cursor-pointer relative",
                                    expandedModuleId === module ? "border-accent ring-4 ring-accent/5" : ""
                                )}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center font-bold text-white text-lg">
                                            {MODULE_NAMES[module][0]}
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground/90">{MODULE_NAMES[module]}</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                exportModule(
                                                    module,
                                                    tables as string[],
                                                    dbTables,
                                                    joins,
                                                    includedColumns,
                                                    moduleData[module]?.description,
                                                    moduleData[module]?.keywords,
                                                    moduleData[module]?.tableMetadata
                                                );
                                                useUIStore.getState().setToast("Module exported successfully!", "success");
                                            }}
                                            className="text-[10px] font-black p-1.5 rounded bg-foreground/[0.05] text-foreground/40 hover:text-accent hover:bg-accent/10 transition-all flex items-center gap-1.5"
                                            title="Export Module JSON"
                                        >
                                            <Download size={12} />
                                            EXPORT
                                        </button>
                                        <span className="text-[10px] font-black p-1.5 rounded bg-foreground/[0.05] text-foreground/40">{(tables as string[]).length} TABLES</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest flex items-center gap-2">
                                            <Table size={12} /> Assigned Tables
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(() => {
                                                const tableObjects = dbTables.filter(t => (tables as string[]).includes(t.table_name));
                                                const sorted = sortTablesForLayout(tableObjects, joins);
                                                return sorted.map(t => (
                                                    <span key={t.table_name} className="px-2 py-1 bg-foreground/[0.03] border border-border rounded text-[11px] text-foreground/60">
                                                        {t.table_name.replace('dbo.', '')}
                                                    </span>
                                                ));
                                            })()}
                                        </div>
                                    </div>

                                    {joins.length > 0 && (
                                        <div className="space-y-2 pt-4 border-t border-border">
                                            <div className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest flex items-center gap-2">
                                                <LinkIcon size={12} /> Schema Joins
                                            </div>
                                            <div className="space-y-2">
                                                {joins.slice(0, 3).map((j: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-2 text-[11px] text-foreground/40">
                                                        <span className="truncate max-w-[80px]">{j.leftTable.replace('dbo.', '')}</span>
                                                        <span>=</span>
                                                        <span className="truncate max-w-[80px]">{j.rightTable.replace('dbo.', '')}</span>
                                                    </div>
                                                ))}
                                                {joins.length > 3 && (
                                                    <div className="text-[10px] font-bold text-accent/60 uppercase tracking-widest">
                                                        + {joins.length - 3} more joins
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            <AnimatePresence>
                                {expandedModuleId === module && (
                                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                        {dbTables.length === 0 ? (
                                            <div className="w-full h-[500px] flex items-center justify-center rounded-[2rem] bg-foreground/[0.02] border border-border">
                                                <div className="flex flex-col items-center gap-4 text-foreground/40">
                                                    <div className="w-8 h-8 animate-spin border-2 border-accent border-t-transparent rounded-full" />
                                                    <span className="text-sm font-medium">Loading schema details...</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <ExpandedModuleView
                                                module={module}
                                                tables={tables as string[]}
                                                allDbTables={dbTables}
                                                joins={joins}
                                                includedColumns={includedColumns}
                                                onClose={() => setExpandedModuleId(null)}
                                            />
                                        )}
                                    </div>
                                )}
                            </AnimatePresence>
                        </React.Fragment>
                    );
                })}
            </div>

            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, x: '-50%' }}
                        className={clsx(
                            "fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] backdrop-blur-xl px-6 py-3 rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex items-center gap-3 border",
                            toast.type === 'success'
                                ? "bg-blue-500/10 border-blue-500/20 text-blue-500 shadow-blue-500/10 border-t-blue-500/20"
                                : "bg-red-500/10 border-red-500/20 text-red-500 shadow-red-500/10 border-t-red-500/20"
                        )}
                    >
                        {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                        <span className="font-semibold text-sm">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
