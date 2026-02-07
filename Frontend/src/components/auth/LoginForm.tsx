import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { User, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginForm: React.FC = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recommendSignup, setRecommendSignup] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { setOverlayView, setToken, setUser, closeAuthOverlay } = useAuthStore();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setRecommendSignup(false);
        setIsLoading(false); // Reset loading if error occurs before fetch? No.
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3001/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.recommendSignup) {
                    setRecommendSignup(true);
                }
                throw new Error(data.message || 'Login failed');
            }

            const { token, user } = data;
            setToken(token);
            setUser(user);

            closeAuthOverlay();
        } catch (err: any) {
            setError(err.message || 'Connection refused. Is the backend running?');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-foreground leading-none">Welcome <span className="text-accent underline decoration-accent/30 underline-offset-4">Back.</span></h2>
                <p className="text-foreground/40 text-sm font-medium">Verify your employee credentials to continue.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-accent transition-colors">
                            <User size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Employee ID or Email"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full bg-surface border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:outline-none focus:border-accent/50 focus:bg-surface focus:ring-4 focus:ring-accent/5 transition-all shadow-sm"
                            required
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-accent transition-colors">
                            <Lock size={20} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-surface border border-border rounded-2xl py-4 pl-12 pr-12 text-foreground focus:outline-none focus:border-accent/50 focus:bg-surface focus:ring-4 focus:ring-accent/5 transition-all shadow-sm"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-accent transition-colors p-1"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold leading-relaxed flex flex-col gap-2"
                    >
                        <span>{error}</span>
                        {recommendSignup && (
                            <button
                                onClick={() => setOverlayView('signup')}
                                className="text-accent underline underline-offset-4 decoration-accent/30 text-left"
                            >
                                Register New Account
                            </button>
                        )}
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
                            Authenticate Access <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="pt-6 border-t border-border flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                <button
                    onClick={() => setOverlayView('signup')}
                    className="text-foreground/40 hover:text-accent transition-colors"
                >
                    Create Account
                </button>
                <button
                    onClick={() => setOverlayView('forgot-password')}
                    className="text-foreground/40 hover:text-foreground transition-colors underline decoration-foreground/10 underline-offset-4"
                >
                    Forgot Password?
                </button>
            </div>
        </div>
    );
};
