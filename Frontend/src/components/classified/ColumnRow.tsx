import { X } from 'lucide-react';

interface Props {
    columnName: string;
    isPK: boolean;
    isFK: boolean;
    columnId: string;
    joinColors?: string[];
    onDelete?: () => void;
}

export const ColumnRow: React.FC<Props> = ({ columnName, isPK, isFK, columnId, joinColors, onDelete }) => {
    return (
        <div
            data-column-id={columnId}
            className="flex items-center justify-between px-4 py-2 hover:bg-foreground/[0.05] transition-colors group relative"
        >
            <div className="flex items-center gap-2 overflow-hidden">
                {joinColors && joinColors.length > 0 && (
                    <div className="flex gap-0.5 shrink-0">
                        {joinColors.map((color, idx) => (
                            <div
                                key={idx}
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                )}
                <span className="text-sm text-foreground/70 group-hover:text-foreground font-medium truncate">
                    {columnName}
                </span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
                {isPK && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-accent/20 text-accent uppercase tracking-wider border border-accent/20">
                        PK
                    </span>
                )}
                {isFK && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 uppercase tracking-wider border border-purple-500/20">
                        FK
                    </span>
                )}
            </div>

            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded transition-all text-foreground/40 hover:text-red-500"
                    title="Remove column from module"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
};
