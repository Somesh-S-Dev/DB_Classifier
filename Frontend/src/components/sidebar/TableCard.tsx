import React, { memo } from 'react';
import { Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

interface TableCardProps {
    table: string;
    columnCount?: number;
    usageCount?: number;
    isSelected?: boolean;
    isDisabled?: boolean;
    className?: string;
    onTrash?: () => void;
    onClick?: () => void;
}

export const TableCard: React.FC<TableCardProps> = memo(({
    table,
    columnCount = 0,
    usageCount = 0,
    isSelected = false,
    isDisabled = false,
    className,
    onTrash,
    onClick
}) => {
    return (
        <div
            onClick={onClick}
            className={clsx(
                "glass p-4 transition-all duration-200 group relative overflow-hidden h-full",
                isSelected && "ring-2 ring-accent bg-accent/10 border-accent/30",
                isDisabled && "opacity-40 grayscale pointer-events-none scale-[0.98]",
                !isSelected && !isDisabled && "hover:bg-foreground/[0.05] hover:border-foreground/20 active:scale-[0.99]",
                className
            )}
        >
            {/* Trash Button */}
            {onTrash && !isDisabled && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onTrash();
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-foreground/[0.05] opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 text-foreground/40 transition-all z-10"
                    title="Move to trash"
                >
                    <Trash2 size={14} />
                </button>
            )}

            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground truncate">
                    {table.replace('dbo.', '')}
                </span>
                <div className="text-[10px] text-foreground/40 uppercase tracking-widest font-semibold flex items-center gap-2">
                    <span>COLUMNS: {columnCount}</span>
                    {usageCount > 0 && (
                        <span className="bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                            Used in {usageCount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
});

TableCard.displayName = 'TableCard';
