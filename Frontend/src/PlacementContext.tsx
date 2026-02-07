import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Module } from './types';
import { useStore } from './store/useStore';

interface PlacementContextType {
    selectedModules: Module[];
    toggleModule: (module: Module) => void;
    clearSelections: () => void;
}

const PlacementContext = createContext<PlacementContextType | undefined>(undefined);

export const PlacementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedModules, setSelectedModules] = useState<Module[]>([]);
    const activePlacementTable = useStore(s => s.activePlacementTable);

    // Reset local selections when the active table changes or is cancelled
    useEffect(() => {
        setSelectedModules([]);
    }, [activePlacementTable]);

    const toggleModule = useCallback((module: Module) => {
        setSelectedModules(prev =>
            prev.includes(module)
                ? prev.filter(m => m !== module)
                : [...prev, module]
        );
    }, []);

    const clearSelections = useCallback(() => {
        setSelectedModules([]);
    }, []);

    const value = React.useMemo(() => ({
        selectedModules,
        toggleModule,
        clearSelections
    }), [selectedModules, toggleModule, clearSelections]);

    return (
        <PlacementContext.Provider value={value}>
            {children}
        </PlacementContext.Provider>
    );
};

export const usePlacement = () => {
    const context = useContext(PlacementContext);
    if (!context) {
        throw new Error('usePlacement must be used within a PlacementProvider');
    }
    return context;
};
