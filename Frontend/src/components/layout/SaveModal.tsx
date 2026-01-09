import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useSchemaStore } from '../../store/useSchemaStore';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Download, AlertCircle, CloudUpload, Loader2 } from 'lucide-react';
import { MODULE_NAMES, Module } from '../../types';
import { createPortal } from 'react-dom';

export const SaveModal: React.FC = () => {
    const { moduleAssignments, trashedTables } = useStore();
    const { isSaveModalOpen, setSaveModalOpen, setToast } = useUIStore();
    const { token, openAuthOverlay } = useAuthStore();
    const [isSaving, setIsSaving] = useState(false);

    React.useEffect(() => {
        if (!isSaveModalOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopImmediatePropagation();
                setSaveModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isSaveModalOpen, setSaveModalOpen]);

    if (!isSaveModalOpen) return null;

    const handleSaveToWorkspace = async () => {
        if (!token) {
            setSaveModalOpen(false);
            openAuthOverlay('login');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                sessionData: {
                    assignments: moduleAssignments,
                    trash: trashedTables,
                    module_modeling: useStore.getState().moduleData,
                    stagedJoins: useStore.getState().stagedJoins
                },
                sourceData: useSchemaStore.getState().dbTables
            };

            const response = await fetch('http://localhost:3001/sessions/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Save failed');

            useStore.getState().setDirty(false);
            setToast("Session saved to workspace!", "success");
            setSaveModalOpen(false);
        } catch (err) {
            setToast("Failed to sync with workspace.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = async () => {
        if (!token) {
            setToast("Please log in to export.", "error");
            return;
        }

        setIsSaving(true);
        try {
            await useStore.getState().exportSession(token);
            setSaveModalOpen(false);
        } catch (err) {
            setToast("Export failed.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = Object.values(moduleAssignments).some((t: string[]) => t.length > 0) || trashedTables.length > 0;

    return createPortal(
        <AnimatePresence mode="wait">
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSaveModalOpen(false)}
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-[600px] max-h-[90vh] bg-surface/95 border border-border flex flex-col shadow-2xl rounded-3xl overflow-hidden"
                >
                    <div className="p-6 border-b border-border flex items-center justify-between bg-foreground/[0.03] sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="text-accent" size={24} />
                            <h2 className="text-xl font-bold text-foreground">Confirm Classifications</h2>
                        </div>
                        <button
                            onClick={() => setSaveModalOpen(false)}
                            className="p-2 hover:bg-foreground/[0.05] rounded-lg transition-colors text-foreground/40 hover:text-foreground"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                        {!hasChanges ? (
                            <div className="text-center py-12 opacity-40">
                                <p>No tables have been classified or trashed yet.</p>
                            </div>
                        ) : (
                            <>
                                {Object.entries(moduleAssignments).map(([key, tables]) => (
                                    (tables as string[]).length > 0 && (
                                        <div key={key} className="space-y-3">
                                            <h3 className="text-xs uppercase tracking-widest font-bold text-accent px-1">
                                                {MODULE_NAMES[key as Module]}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {(tables as string[]).map((table: string) => (
                                                    <span key={table} className="glass-inset text-[11px] font-mono py-1 px-2 border border-border rounded-md text-foreground/70">
                                                        {table.replace('dbo.', '')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}

                                {trashedTables.length > 0 && (
                                    <div className="space-y-3 pt-4 border-t border-border">
                                        <h3 className="text-xs uppercase tracking-widest font-bold text-red-400 px-1">
                                            TRASHED
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {trashedTables.map(table => (
                                                <span key={table} className="glass-inset border border-red-500/20 text-[11px] font-mono py-1 px-2 text-foreground/40 rounded-md">
                                                    {table.replace('dbo.', '')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="p-6 border-t border-border bg-foreground/[0.02] flex gap-4 sticky bottom-0 z-10">
                        <button
                            disabled={!hasChanges || isSaving}
                            onClick={handleDownload}
                            className="flex-1 flex items-center justify-center gap-2 border border-border hover:bg-foreground/[0.05] disabled:opacity-50 disabled:cursor-not-allowed text-foreground px-6 py-3 rounded-xl font-bold transition-all"
                        >
                            <Download size={20} />
                            <span>Export JSON</span>
                        </button>
                        <button
                            disabled={!hasChanges || isSaving}
                            onClick={handleSaveToWorkspace}
                            className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-accent/20"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CloudUpload size={20} />}
                            <span>Save to Workspace</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};
