import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { User, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const ForgotPasswordForm: React.FC = () => {
    const [employeeId, setEmployeeId] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { setOverlayView, setTempData } = useAuthStore();

    const handleInitiateReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3001/auth/forgot/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId, email }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Identity verification failed');
            }

            setTempData({ email, employeeId, otpPurpose: 'forgot-password' });
            setOverlayView('forgot-otp');
        } catch (err: any) {
            setError(err.message || 'Identity check failed. Please verify your details.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-foreground leading-none">Recover <span className="text-accent underline decoration-accent/30 underline-offset-4">Access.</span></h2>
                <p className="text-foreground/40 text-sm font-medium">Please enter your linked business credentials below.</p>
            </div>

            <form onSubmit={handleInitiateReset} className="space-y-6">
                <div className="space-y-4">
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-accent transition-colors">
                            <User size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Employee ID"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            className="w-full bg-surface border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:outline-none focus:border-accent/50 focus:bg-surface focus:ring-4 focus:ring-accent/5 transition-all shadow-sm"
                            required
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-accent transition-colors">
                            <Mail size={20} />
                        </div>
                        <input
                            type="email"
                            placeholder="Work Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-surface border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:outline-none focus:border-accent/50 focus:bg-surface focus:ring-4 focus:ring-accent/5 transition-all shadow-sm"
                            required
                        />
                    </div>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold leading-relaxed"
                    >
                        {error}
                    </motion.div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-accent hover:bg-accent/80 disabled:bg-accent/40 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-xl shadow-accent/20"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            Verify Identity <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <button
                onClick={() => setOverlayView('login')}
                className="w-full text-center text-[10px] font-black uppercase tracking-widest text-foreground/20 hover:text-foreground transition-colors"
            >
                Back to Login
            </button>
        </div>
    );
};
