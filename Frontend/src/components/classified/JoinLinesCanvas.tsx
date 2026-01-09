import React, { useEffect, useState, useCallback } from 'react';
import { Join } from '../../types';

interface Props {
    joins: Join[];
    hasActiveTable?: boolean; // Whether any table is active (for mode switching)
}

// Color palette matching TableNode
const JOIN_COLORS = [
    'rgb(59, 130, 246)',   // blue
    'rgb(168, 85, 247)',   // purple
    'rgb(236, 72, 153)',   // pink
    'rgb(34, 197, 94)',    // green
    'rgb(251, 146, 60)',   // orange
    'rgb(14, 165, 233)',   // sky
];

const getJoinColor = (joins: Join[], joinId: string) => {
    const index = joins.findIndex(j => j.id === joinId);
    return JOIN_COLORS[index % JOIN_COLORS.length];
};

export const JoinLinesCanvas: React.FC<Props> = ({ joins }) => {
    const [lineCoords, setLineCoords] = useState<{
        id: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        color: string;
    }[]>([]);

    const updateCoords = useCallback(() => {
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(() => {
                const container = document.getElementById('expanded-view-container');
                if (!container) return;

                const containerRect = container.getBoundingClientRect();

                const newCoords = joins.map(join => {
                    // Always connect table centers (not specific columns)
                    const leftTableEl = document.querySelector(`[data-table-id="${join.leftTable}"]`);
                    const rightTableEl = document.querySelector(`[data-table-id="${join.rightTable}"]`);

                    if (!leftTableEl || !rightTableEl) return null;

                    const leftRect = leftTableEl.getBoundingClientRect();
                    const rightRect = rightTableEl.getBoundingClientRect();

                    const x1 = leftRect.left + leftRect.width / 2;
                    const x2 = rightRect.left + rightRect.width / 2;
                    const y1 = leftRect.top + leftRect.height / 2;
                    const y2 = rightRect.top + rightRect.height / 2;

                    return {
                        id: join.id,
                        x1: x1 - containerRect.left,
                        y1: y1 - containerRect.top,
                        x2: x2 - containerRect.left,
                        y2: y2 - containerRect.top,
                        color: getJoinColor(joins, join.id),
                    };
                }).filter(Boolean) as typeof lineCoords;

                setLineCoords(newCoords);
            });
        }
    }, [joins]);

    useEffect(() => {
        const timeout = setTimeout(updateCoords, 100);

        const scrollables = document.querySelectorAll('.custom-scrollbar');
        const handleScroll = () => updateCoords();

        scrollables.forEach(el => el.addEventListener('scroll', handleScroll, { passive: true }));
        window.addEventListener('resize', handleScroll, { passive: true });

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('resize', handleScroll);
            scrollables.forEach(el => el.removeEventListener('scroll', handleScroll));
        };
    }, [updateCoords]);

    return (
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-0 overflow-visible">
            {lineCoords.map(coord => (
                <g key={coord.id}>
                    {/* Static line with color only - no animations */}
                    <line
                        x1={coord.x1}
                        y1={coord.y1}
                        x2={coord.x2}
                        y2={coord.y2}
                        stroke={coord.color}
                        strokeWidth="2"
                        strokeOpacity="0.6"
                        strokeLinecap="round"
                    />
                </g>
            ))}
        </svg>
    );
};
