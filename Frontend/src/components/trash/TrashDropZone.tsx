import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';

interface TrashDropZoneProps {
    active: boolean;
}

export const TrashDropZone: React.FC<TrashDropZoneProps> = ({ active }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: 'trash',
    });

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 50 }}
                    ref={setNodeRef}
                    className={clsx(
                        "fixed bottom-8 right-8 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 z-[70]",
                        isOver
                            ? "bg-red-500 text-white scale-110 shadow-[0_0_40px_rgba(239,68,68,0.4)]"
                            : "bg-surface/90 text-white/40 border-2 border-dashed border-white/20"
                    )}
                >
                    <Trash2 size={32} />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
