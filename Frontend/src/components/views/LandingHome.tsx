import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Database, ArrowRight } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';

export const LandingHome: React.FC = () => {
    const navigate = useNavigate();
    const setFocusedModule = useUIStore(s => s.setFocusedModule);
    const { token, openAuthOverlay } = useAuthStore();

    const handleStartClassification = () => {
        if (!token) {
            openAuthOverlay('login');
            return;
        }
        // Clear existing session
        sessionStorage.removeItem('activeClassifierSession');
        setFocusedModule(null);
        navigate('/classify');
    };

    const handleViewClassified = () => {
        if (!token) {
            openAuthOverlay('login');
            return;
        }
        navigate('/classified');
    };

    return (
        <div className="h-full overflow-y-auto bg-background flex flex-col items-center justify-center p-12 relative overflow-x-hidden custom-scrollbar">
            {/* Background elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-accent/10 blur-[180px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 blur-[180px] rounded-full" />

            <div className="max-w-[1200px] w-full text-center space-y-24 relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-8"
                >
                    <h1 className="text-7xl md:text-9xl font-black text-foreground leading-[0.9] tracking-tighter">
                        DB Classifier <span className="text-accent underline decoration-accent/20 underline-offset-[16px]">Studio</span>
                    </h1>
                    <p className="text-2xl text-foreground/40 max-w-3xl mx-auto font-medium leading-relaxed">
                        Professional database schema classification and relationship modeling.
                        <br className="hidden md:block" />
                        Isolated processing, secure sessions, and intelligent join builders.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleStartClassification}
                        className="group p-12 rounded-[40px] bg-foreground/[0.02] border border-foreground/[0.05] flex flex-col items-center gap-8 transition-all hover:border-accent/30 text-left"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all shadow-2xl shadow-accent/10">
                            <LayoutDashboard size={40} strokeWidth={2} />
                        </div>
                        <div className="text-center space-y-3">
                            <h3 className="text-3xl font-bold text-foreground">Start Classification</h3>
                            <p className="text-foreground/20 text-base leading-relaxed max-w-[280px] mx-auto">Init a new session, assign tables to modules, and build schema joins.</p>
                        </div>
                        <div className="flex items-center gap-3 text-accent font-bold text-lg group-hover:translate-x-2 transition-transform">
                            Initialise Studio <ArrowRight size={22} />
                        </div>
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleViewClassified}
                        className="group p-12 rounded-[40px] bg-foreground/[0.02] border border-foreground/[0.05] flex flex-col items-center gap-8 transition-all hover:border-blue-500/30 text-left"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-2xl shadow-blue-500/10">
                            <Database size={40} strokeWidth={2} />
                        </div>
                        <div className="text-center space-y-3">
                            <h3 className="text-3xl font-bold text-foreground">View Classified Data</h3>
                            <p className="text-foreground/20 text-base leading-relaxed max-w-[280px] mx-auto">Review your previously modeled data and exported relationship schemas.</p>
                        </div>
                        <div className="flex items-center gap-3 text-blue-400 font-bold text-lg group-hover:translate-x-2 transition-transform">
                            Open Reader <ArrowRight size={22} />
                        </div>
                    </motion.button>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="pt-16 border-t border-foreground/5 flex items-center justify-center gap-12 text-xs font-bold uppercase tracking-[0.2em] text-foreground/10"
                >
                    <span className="hover:text-foreground/30 transition-colors cursor-default">Immutable State</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/5" />
                    <span className="hover:text-foreground/30 transition-colors cursor-default">In-Memory Auth</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/5" />
                    <span className="hover:text-foreground/30 transition-colors cursor-default">PostgreSQL Sync</span>
                </motion.div>
            </div>
        </div>
    );
};
