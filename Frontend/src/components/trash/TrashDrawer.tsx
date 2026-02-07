import React from 'react';
import { useStore } from '../../store/useStore';
import { useUIStore } from '../../store/useUIStore';
import { AnimatePresence, motion } from 'framer-motion';
import { X, RotateCcw, Trash2 } from 'lucide-react';

export const TrashDrawer: React.FC = () => {
    const { trashedTables, restoreTable } = useStore();
    const { isTrashDrawerOpen, setTrashDrawerOpen } = useUIStore();

    return (
        <AnimatePresence>
            {isTrashDrawerOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setTrashDrawerOpen(false)}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 bottom-0 w-[400px] bg-surface/95 border-l border-border z-[101] flex flex-col shadow-2xl text-foreground"
                    >
                        <div className="p-6 border-b border-border flex items-center justify-between bg-foreground/[0.02]">
                            <div className="flex items-center gap-3">
                                <Trash2 className="text-foreground/40" size={20} />
                                <h2 className="text-lg font-bold">Recently Trashed</h2>
                            </div>
                            <button
                                onClick={() => setTrashDrawerOpen(false)}
                                className="p-2 hover:bg-foreground/[0.05] rounded-xl transition-colors text-foreground/40 hover:text-foreground border border-transparent hover:border-border"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {trashedTables.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                                    <Trash2 size={48} className="mb-4" />
                                    <p>Your trash is empty</p>
                                </div>
                            ) : (
                                trashedTables.map((table) => (
                                    <div
                                        key={table}
                                        className="glass p-4 group flex items-center justify-between border-border"
                                    >
                                        <span className="text-sm text-foreground/70 truncate mr-4">
                                            {table.replace('dbo.', '')}
                                        </span>
                                        <button
                                            onClick={() => restoreTable(table)}
                                            className="flex items-center gap-2 text-xs bg-foreground/[0.03] hover:bg-foreground/[0.08] text-foreground/60 hover:text-foreground px-3 py-1.5 rounded-lg transition-all border border-border"
                                        >
                                            <RotateCcw size={14} />
                                            Restore
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
