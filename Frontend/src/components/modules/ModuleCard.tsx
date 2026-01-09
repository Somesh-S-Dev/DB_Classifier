import React, { memo, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { useUIStore } from '../../store/useUIStore';
import { Module, MODULE_NAMES } from '../../types';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { usePlacement } from '../../PlacementContext';
import { shallow } from 'zustand/shallow';

interface ModuleCardProps {
    module: Module;
}

export const ModuleCard: React.FC<ModuleCardProps> = memo(({ module }) => {
    // Business Data
    const tables = useStore(s => s.moduleAssignments[module], shallow);
    const removeTableFromModule = useStore(s => s.removeTableFromModule);
    const initStagedJoins = useStore(s => s.initStagedJoins);

    // UI Store
    const activePlacementTable = useUIStore(s => s.activePlacementTable);
    const setFocusedModule = useUIStore(s => s.setFocusedModule);

    const { selectedModules, toggleModule } = usePlacement();

    const isSelectedInPlacement = selectedModules.includes(module);
    const isInPlacementMode = activePlacementTable !== null;

    const handleCardClick = useCallback(() => {
        if (isInPlacementMode) {
            toggleModule(module);
        } else {
            // Initialize staged joins BEFORE focusing
            initStagedJoins(module);
            setFocusedModule(module);
        }
    }, [isInPlacementMode, toggleModule, module, setFocusedModule, initStagedJoins]);

    const MAX_VISIBLE_TABLES = 50;
    const visibleTables = tables.slice(0, MAX_VISIBLE_TABLES);
    const hiddenCount = Math.max(0, tables.length - MAX_VISIBLE_TABLES);

    return (
        <div
            onClick={handleCardClick}
            className={clsx(
                "glass flex flex-col h-full transition-all duration-300 relative group/module opacity-100 filter-none pointer-events-auto cursor-pointer",
                isSelectedInPlacement ? "ring-2 ring-accent bg-accent/10 border-accent/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]" : "hover:bg-foreground/[0.03]",
            )}
            style={{ contain: 'content' }}
        >
            <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className={clsx(
                    "font-semibold transition-colors",
                    isSelectedInPlacement ? "text-accent" : "text-foreground/90"
                )}>
                    {MODULE_NAMES[module]}
                </h3>
                <span className="text-xs font-mono text-foreground/40">
                    {tables.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {visibleTables.map((table) => (
                    <div
                        key={table}
                        className="glass-inset group relative flex items-center justify-between hover:bg-foreground/[0.03] transition-colors"
                    >
                        <span className="text-[13px] text-foreground/70 truncate mr-6">
                            {table.replace('dbo.', '')}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTableFromModule(table, module);
                            }}
                            className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-foreground/10 rounded transition-all text-foreground/40 hover:text-red-400"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}

                {hiddenCount > 0 && (
                    <div className="text-center py-2 text-xs font-medium text-foreground/30 bg-foreground/[0.02] rounded-lg">
                        + {hiddenCount} more
                    </div>
                )}

                {tables.length === 0 && (
                    <div className="h-full flex items-center justify-center py-8 opacity-20 italic text-sm">
                        Ready for tables
                    </div>
                )}
            </div>

            {isSelectedInPlacement && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent animate-pulse" />
            )}
        </div>
    );
});

ModuleCard.displayName = 'ModuleCard';
