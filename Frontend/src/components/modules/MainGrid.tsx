import React, { memo } from 'react';
import { ModuleCard } from './ModuleCard';
import { Module, MODULE_NAMES } from '../../types';

export const MainGrid: React.FC = memo(() => {
    // Optimization: MainGrid layout is static. The keys of MODULE_NAMES are constant.
    // It should NOT subscribe to moduleAssignments, as that causes full grid re-render on every drag/drop.
    const modules = Object.keys(MODULE_NAMES) as Module[];

    return (
        <main
            className="flex-1 overflow-y-auto p-6 bg-background custom-scrollbar"
            style={{
                contain: 'strict',
                willChange: 'scroll-position'
            }}
        >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-6 pb-24">
                {modules.map((module) => (
                    <ModuleCard key={module} module={module} />
                ))}
            </div>
        </main>
    );
});

MainGrid.displayName = 'MainGrid';
