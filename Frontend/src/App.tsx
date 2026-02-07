import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { useUIStore } from './store/useUIStore';
import { useSchemaStore } from './store/useSchemaStore';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingHome } from './components/views/LandingHome';
import { ClassifierStudio } from './components/views/ClassifierStudio';
import { ClassifiedView } from './components/views/ClassifiedView';
import { AuthOverlay } from './components/auth/AuthOverlay';
import { PlacementProvider, usePlacement } from './PlacementContext';

// Extracted for performance: handles only keyboard commits
const KeyboardHandler: React.FC = () => {
    // UI State
    const activePlacementTable = useUIStore(s => s.activePlacementTable);
    const cancelPlacementMode = useUIStore(s => s.cancelPlacementMode);
    const focusedModule = useUIStore(s => s.focusedModule);
    const setFocusedModule = useUIStore(s => s.setFocusedModule);
    const modelingSelectedColumn = useUIStore(s => s.modelingSelectedColumn);
    const setModelingSelectedColumn = useUIStore(s => s.setModelingSelectedColumn);

    // Business Logic
    const commitPlacementMode = useStore(s => s.commitPlacementMode);

    const { selectedModules } = usePlacement();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (activePlacementTable) {
                    cancelPlacementMode();
                } else if (modelingSelectedColumn) {
                    setModelingSelectedColumn(null);
                }
            }
            if (activePlacementTable && e.key === 'Enter') {
                if (activePlacementTable) {
                    commitPlacementMode(selectedModules, activePlacementTable);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activePlacementTable, commitPlacementMode, cancelPlacementMode, selectedModules, focusedModule, setFocusedModule, modelingSelectedColumn, setModelingSelectedColumn]);

    return null;
};

// Global History Handler
const HistoryHandler: React.FC = () => {
    const undo = useStore(s => s.undo);
    const redo = useStore(s => s.redo);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'z') {
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    return null;
};

import { Header } from './components/layout/Header';
import { ProfileOverlay } from './components/auth/ProfileOverlay';

// ... (HistoryHandler remains)

const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="h-screen flex flex-col bg-background selection:bg-accent/30 selection:text-white overflow-hidden">
            <Header />
            <ProfileOverlay />
            <main className="flex-1 relative overflow-hidden">
                {children}
            </main>
        </div>
    );
};

import { useAuthStore } from './store/useAuthStore';

import { Navigate } from 'react-router-dom';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const token = useAuthStore(s => s.token);
    const isVerifying = useAuthStore(s => s.isVerifying);
    const verifyAuth = useAuthStore(s => s.verifyAuth);
    const openAuthOverlay = useAuthStore(s => s.openAuthOverlay);

    useEffect(() => {
        if (token) {
            verifyAuth();
        }
    }, [token, verifyAuth]);

    if (!token) {
        setTimeout(() => openAuthOverlay('login'), 100);
        return <Navigate to="/" replace />;
    }

    if (isVerifying) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-background/50 backdrop-blur-md">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-2xl shadow-accent/20" />
                <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-foreground/40 animate-pulse">
                    Verifying Session...
                </p>
            </div>
        );
    }

    return <>{children}</>;
};

function App() {
    const fetchSchema = useSchemaStore(s => s.fetchSchema);
    const loadWorkspace = useStore(s => s.loadWorkspace);
    const token = useAuthStore(s => s.token);
    const verifyAuth = useAuthStore(s => s.verifyAuth);
    const isDirty = useStore(s => s.isDirty);

    useEffect(() => {
        if (token) {
            verifyAuth();
            fetchSchema(token);
            loadWorkspace(token);
        }
    }, [token, fetchSchema, loadWorkspace, verifyAuth]);

    // Handle unsaved changes guardrail on window close/reload
    useEffect(() => {
        const handleUnload = (e: BeforeUnloadEvent) => {
            // Check for unsaved changes (isDirty)
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Required for some browsers to show the "Unsaved changes" dialog
            }
        };

        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, [isDirty]);

    return (
        <BrowserRouter>
            <PlacementProvider>
                <HistoryHandler />
                <KeyboardHandler />
                <AuthOverlay />
                <LayoutWrapper>
                    <Routes>
                        <Route path="/" element={<LandingHome />} />
                        <Route
                            path="/classify"
                            element={
                                <ProtectedRoute>
                                    <ClassifierStudio />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/classified"
                            element={
                                <ProtectedRoute>
                                    <ClassifiedView />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </LayoutWrapper>
            </PlacementProvider>
        </BrowserRouter>
    );
}

export default App;
