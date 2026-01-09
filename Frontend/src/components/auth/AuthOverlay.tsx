import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { OtpVerificationForm } from './OtpVerificationForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ResetPasswordForm } from './ResetPasswordForm';

export const AuthOverlay: React.FC = () => {
    const { isAuthOverlayOpen, overlayView, closeAuthOverlay } = useAuthStore();

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isAuthOverlayOpen) {
                closeAuthOverlay();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAuthOverlayOpen, closeAuthOverlay]);

    if (!isAuthOverlayOpen) return null;

    return (
        <AnimatePresence>
            {isAuthOverlayOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                        onClick={closeAuthOverlay}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-[480px] bg-surface/90 border border-border rounded-[40px] shadow-2xl overflow-hidden p-10"
                    >
                        {/* Status bar */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Secure Verification System</span>
                            </div>
                            <button
                                onClick={closeAuthOverlay}
                                className="w-8 h-8 rounded-full bg-foreground/[0.03] flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/[0.08] transition-all border border-border"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Dynamic View Rendering */}
                        <div className="min-h-[400px]">
                            {overlayView === 'login' && <LoginForm />}
                            {overlayView === 'signup' && <SignupForm />}
                            {(overlayView === 'signup-otp' || overlayView === 'forgot-otp') && <OtpVerificationForm />}
                            {overlayView === 'forgot-password' && <ForgotPasswordForm />}
                            {overlayView === 'reset-password' && <ResetPasswordForm />}
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
