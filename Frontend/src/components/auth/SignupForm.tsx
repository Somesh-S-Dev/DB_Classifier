import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { User, Lock, Mail, Phone, Building2, BadgeCheck, Loader2, Check, X, Eye, EyeOff } from 'lucide-react';

interface PasswordRule {
    id: string;
    label: string;
    regex: RegExp;
}

const PASSWORD_RULES: PasswordRule[] = [
    { id: 'length', label: 'Min 8 characters', regex: /.{8,}/ },
    { id: 'upper', label: 'One uppercase letter', regex: /[A-Z]/ },
    { id: 'lower', label: 'One lowercase letter', regex: /[a-z]/ },
    { id: 'number', label: 'One number', regex: /[0-9]/ },
    { id: 'special', label: 'One special character', regex: /[^A-Za-z0-9]/ },
];

function clsx(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

export const SignupForm: React.FC = () => {
    const { setOverlayView, setTempData } = useAuthStore();

    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        employeeId: '',
        mobile: '',
        email: '',
        password: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const ruleStatuses = useMemo(() => {
        return PASSWORD_RULES.map(rule => ({
            ...rule,
            passed: rule.regex.test(formData.password)
        }));
    }, [formData.password]);

    const passedCount = ruleStatuses.filter(r => r.passed).length;
    const isPasswordValid = passedCount >= 3;

    const handleSignupInitiate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPasswordValid) return;

        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3001/auth/signup/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Signup initiation failed');
            }

            setTempData({ email: formData.email, employeeId: formData.employeeId, otpPurpose: 'signup' });
            setOverlayView('signup-otp');
        } catch (err: any) {
            setError(err.message || 'Connection refused. Is the backend running?');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-foreground leading-none">Create <span className="text-accent underline decoration-accent/30 underline-offset-4">Studio</span> ID.</h2>
                <p className="text-foreground/40 text-sm font-medium">Join the enterprise classification network.</p>
            </div>

            <form onSubmit={handleSignupInitiate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative group overflow-hidden rounded-2xl">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-accent z-10 transition-colors">
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-surface border border-border rounded-2xl py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-accent/50 focus:bg-surface focus:ring-4 focus:ring-accent/5 transition-all shadow-sm"
                            required
                        />
                    </div>
                    <div className="relative group overflow-hidden rounded-2xl">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-accent z-10 transition-colors">
                            <Building2 size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Company"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            className="w-full bg-surface border border-border rounded-2xl py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-accent/50 focus:bg-surface focus:ring-4 focus:ring-accent/5 transition-all shadow-sm"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-accent z-10 transition-colors">
                            <BadgeCheck size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Employee ID"
                            value={formData.employeeId}
                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                            className="w-full bg-surface border border-border rounded-2xl py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-accent/50 focus:bg-surface focus:ring-4 focus:ring-accent/5 transition-all shadow-sm"
                            required
                        />
                    </div>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-accent z-10 transition-colors">
                            <Phone size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Mobile"
                            value={formData.mobile}
                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                            className="w-full bg-surface border border-border rounded-2xl py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-accent/50 focus:bg-surface focus:ring-4 focus:ring-accent/5 transition-all shadow-sm"
                            required
                        />
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-accent z-10 transition-colors">
                        <Mail size={18} />
                    </div>
                    <input
                        type="email"
                        placeholder="Work Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-surface border border-border rounded-2xl py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-accent/50 focus:bg-surface focus:ring-4 focus:ring-accent/5 transition-all shadow-sm"
                        required
                    />
                </div>

                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-accent z-10 transition-colors">
                        <Lock size={18} />
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

                {/* Password Rules UI */}
                <div className="p-4 rounded-2xl bg-foreground/[0.02] border border-border space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/20">Security Check</span>
                        <span className={clsx("text-[10px] font-black px-2 py-0.5 rounded", isPasswordValid ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                            {passedCount} Passed
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2">
                        {ruleStatuses.map(rule => (
                            <div key={rule.id} className="flex items-center gap-2 text-[11px]">
                                {rule.passed ? <Check size={10} className="text-emerald-400" /> : <X size={10} className="text-foreground/10" />}
                                <span className={rule.passed ? "text-foreground/60" : "text-foreground/20"}>{rule.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold leading-relaxed">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || !isPasswordValid}
                    className="w-full bg-accent hover:bg-accent/80 disabled:bg-accent/20 disabled:text-white/20 text-white font-black py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-accent/10"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Initiate Verification"}
                </button>
            </form>

            <button
                onClick={() => setOverlayView('login')}
                className="w-full text-center text-[10px] font-black uppercase tracking-widest text-foreground/20 hover:text-foreground transition-colors"
            >
                Already have an account? Login
            </button>
        </div>
    );
};
