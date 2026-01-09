import { memo, useEffect } from 'react';
import { Sidebar } from '../sidebar/Sidebar';
import { MainGrid } from '../modules/MainGrid';
import { ModuleFocusView } from '../modules/ModuleFocusView';
import { PlacementControls } from '../PlacementControls';
import { useStore } from '../../store/useStore';
import { useUIStore } from '../../store/useUIStore';
import { TrashDrawer } from '../trash/TrashDrawer';
import { SaveModal } from '../layout/SaveModal';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Trash2, Save, Check } from 'lucide-react';
import { clsx } from 'clsx';

export const ClassifierStudio = memo(() => {
    // UI State

    const toast = useUIStore(s => s.toast);
    const focusedModule = useUIStore(s => s.focusedModule);
    const setTrashDrawerOpen = useUIStore(s => s.setTrashDrawerOpen);
    const setSaveModalOpen = useUIStore(s => s.setSaveModalOpen);
    const cancelPlacementMode = useUIStore(s => s.cancelPlacementMode);

    // Reset placement mode on mount
    useEffect(() => {
        cancelPlacementMode();
    }, [cancelPlacementMode]);

    // Business Data
    const trashedTables = useStore(s => s.trashedTables);

    return (
        <div className="h-full bg-background text-foreground selection:bg-accent/30 overflow-hidden flex flex-col">
            <div className="flex flex-1 relative overflow-hidden">
                {!focusedModule ? (
                    <>
                        <Sidebar />
                        <MainGrid />
                    </>
                ) : (
                    <ModuleFocusView module={focusedModule} />
                )}
            </div>

            {/* Floating Actions */}
            <div className="fixed bottom-8 right-8 flex items-center gap-4 z-[45]">
                <button
                    onClick={() => setTrashDrawerOpen(true)}
                    className={clsx(
                        "relative w-14 h-14 rounded-2xl",
                        "bg-surface/80 backdrop-blur-2xl",
                        "border border-white/10",
                        "flex items-center justify-center",
                        "shadow-2xl transition-all duration-300 group",
                        "hover:border-red-500/40 hover:bg-red-500/10 hover:shadow-red-500/30 hover:shadow-2xl"
                    )}
                    title="Recently Trashed"
                >
                    <Trash2
                        size={24}
                        className="text-blue-500 group-hover:text-red-500 group-hover:scale-110 transition-all duration-300"
                    />

                    {trashedTables.length > 0 && (
                        <span className="
                            absolute -top-1 -right-1
                            bg-red-500 text-white
                            text-[10px] font-black
                            px-2 py-0.5
                            rounded-full
                            shadow-lg shadow-red-500/40
                        ">
                            {trashedTables.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setSaveModalOpen(true)}
                    className="flex items-center gap-3 bg-accent hover:bg-accent/80 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-2xl shadow-accent/20 group hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Save size={20} className="group-hover:rotate-12 transition-transform" />
                    <span>Save Session</span>
                </button>
            </div>

            <PlacementControls />
            <TrashDrawer />
            <SaveModal />

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
});

ClassifierStudio.displayName = 'ClassifierStudio';
