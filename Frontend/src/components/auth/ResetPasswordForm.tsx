import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Lock, Loader2, Check, X, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const PASSWORD_RULES = [
    { id: 'length', label: 'Min 8 characters', regex: /.{8,}/ },
    { id: 'upper', label: 'One uppercase letter', regex: /[A-Z]/ },
    { id: 'lower', label: 'One lowercase letter', regex: /[a-z]/ },
    { id: 'number', label: 'One number', regex: /[0-9]/ },
    { id: 'special', label: 'One special character', regex: /[^A-Za-z0-9]/ },
];

function clsx(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

export const ResetPasswordForm: React.FC = () => {
    const { tempData, setOverlayView } = useAuthStore();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const ruleStatuses = useMemo(() => {
        return PASSWORD_RULES.map(rule => ({
            ...rule,
            passed: rule.regex.test(password)
        }));
    }, [password]);

    const passedCount = ruleStatuses.filter(r => r.passed).length;
    const isPasswordValid = passedCount >= 3;

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPasswordValid || password !== confirmPassword) return;

        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3001/auth/forgot/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: tempData?.employeeId,
                    newPassword: password
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Password reset failed');
            }

            setOverlayView('login');
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-foreground leading-none">New <span className="text-accent underline decoration-accent/30 underline-offset-4">Password.</span></h2>
                <p className="text-foreground/40 text-sm font-medium">Create a new secure password for your identity.</p>
            </div>

            <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-4">
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-accent z-10 transition-colors">
                            <Lock size={18} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-surface border border-border rounded-2xl py-3 pl-11 pr-11 text-sm text-foreground focus:outline-none focus:border-accent/50 focus:bg-surface focus:ring-4 focus:ring-accent/5 transition-all shadow-sm"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-accent transition-colors p-1"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-accent z-10 transition-colors">
                            <ShieldCheck size={18} />
                        </div>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-surface border border-border rounded-2xl py-3 pl-11 pr-11 text-sm text-foreground focus:outline-none focus:border-accent/50 focus:bg-surface focus:ring-4 focus:ring-accent/5 transition-all shadow-sm"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-accent transition-colors p-1"
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-foreground/[0.02] border border-border space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Security Check</span>
                        <span className={clsx("text-[10px] font-black px-2 py-0.5 rounded", passedCount >= 3 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                            {passedCount} Passed
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2">
                        {ruleStatuses.map(rule => (
                            <div key={rule.id} className="flex items-center gap-2 text-[11px]">
                                {rule.passed ? <Check size={10} className="text-emerald-400" /> : <X size={10} className="text-foreground/10" />}
                                <span className={rule.passed ? "text-foreground/60" : "text-foreground/20"}>{rule.label}</span>
                            </div>
                        ))}
                    </div>
                    {password !== confirmPassword && confirmPassword.length > 0 && (
                        <div className="text-[10px] font-bold text-red-400/80 animate-pulse">Passwords do not match</div>
                    )}
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold leading-relaxed">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || !isPasswordValid || password !== confirmPassword}
                    className="w-full bg-accent hover:bg-accent/80 disabled:bg-accent/20 disabled:text-white/20 text-white font-black py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-accent/10"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Update Credentials"}
                </button>
            </form>
        </div>
    );
};
