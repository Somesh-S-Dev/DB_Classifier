import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2, ArrowRight } from 'lucide-react';

export const OtpVerificationForm: React.FC = () => {
    const { tempData, overlayView, setOverlayView, setToken, setUser, closeAuthOverlay } = useAuthStore();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSignup = overlayView === 'signup-otp';

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullOtp = otp.join('');
        if (fullOtp.length < 6) return;

        setError(null);
        setIsLoading(true);

        try {
            const endpoint = isSignup ? '/auth/signup/verify' : '/auth/forgot/verify';
            const response = await fetch(`http://localhost:3001${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    otp: fullOtp,
                    email: tempData?.email,
                    employeeId: tempData?.employeeId
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'OTP verification failed');
            }

            if (isSignup) {
                const { token, user } = await response.json();
                setToken(token);
                setUser(user);
                closeAuthOverlay();
            } else {
                setOverlayView('reset-password');
            }

        } catch (err: any) {
            setError(err.message || 'Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-foreground leading-none">Check <span className="text-accent underline decoration-accent/30 underline-offset-4">Email.</span></h2>
                <p className="text-foreground/40 text-sm font-medium">We sent a 6-digit verification code to <span className="text-foreground/60">{tempData?.email}</span>.</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-8">
                <div className="flex justify-between gap-2">
                    {otp.map((digit, idx) => (
                        <input
                            key={idx}
                            id={`otp-${idx}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            className="w-12 h-16 bg-surface border border-border rounded-2xl text-center text-2xl font-black text-accent focus:outline-none focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/5 transition-all shadow-sm"
                            required
                        />
                    ))}
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold leading-relaxed">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || otp.join('').length < 6}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/20 disabled:text-foreground/20 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-xl shadow-emerald-500/10"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                            Verify Identity <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="text-center">
                <button
                    onClick={() => setOverlayView('login')}
                    className="text-[10px] font-black uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors"
                >
                    I didn't receive a code. Resend?
                </button>
            </div>
        </div>
    );
};
