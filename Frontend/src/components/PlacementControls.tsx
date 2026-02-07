import React, { memo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useUIStore } from '../store/useUIStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, Trash2 } from 'lucide-react';
import { usePlacement } from '../PlacementContext';

export const PlacementControls: React.FC = memo(() => {
    // UI State
    const activePlacementTable = useUIStore(s => s.activePlacementTable);
    const cancelPlacementMode = useUIStore(s => s.cancelPlacementMode);

    // Business Logic
    const commitPlacementMode = useStore(s => s.commitPlacementMode);
    const trashTable = useStore(s => s.trashTable);

    const { selectedModules, clearSelections } = usePlacement();

    const handleDone = useCallback(() => {
        if (activePlacementTable) {
            commitPlacementMode(selectedModules, activePlacementTable);
            cancelPlacementMode();
            clearSelections();
        }
    }, [commitPlacementMode, selectedModules, activePlacementTable, cancelPlacementMode, clearSelections]);

    const handleCancel = useCallback(() => {
        cancelPlacementMode();
        clearSelections();
    }, [cancelPlacementMode, clearSelections]);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!activePlacementTable) return;
            if (e.key === 'Enter') handleDone();
            if (e.key === 'Escape') handleCancel();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activePlacementTable, handleDone, handleCancel]);

    if (!activePlacementTable) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[45] flex items-center gap-4 bg-surface/90 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl shadow-2xl"
            >
                <div className="px-6 py-2 border-r border-white/10">
                    <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Placing Table</p>
                    <p className="text-sm font-medium text-accent">
                        {activePlacementTable.replace('dbo.', '')}
                    </p>
                </div>

                <div className="flex items-center gap-2 px-4">
                    <span className="text-sm text-white/60">
                        {selectedModules.length} modules selected
                    </span>
                    <button
                        onClick={() => {
                            if (activePlacementTable) {
                                trashTable(activePlacementTable);
                                cancelPlacementMode();
                            }
                        }}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-white/40 hover:text-red-500 mr-2"
                        title="Move to Trash"
                    >
                        <Trash2 size={20} />
                    </button>
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                    <button
                        onClick={handleDone}
                        className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white px-6 py-2 rounded-xl font-semibold transition-all shadow-lg shadow-accent/20"
                    >
                        <Check size={18} />
                        <span>Done</span>
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
});

PlacementControls.displayName = 'PlacementControls';
