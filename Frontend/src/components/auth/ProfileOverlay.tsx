import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, X, Shield, Activity, ChevronLeft, Save, Mail, Key, Moon, Sun, CheckCircle2, Monitor, Database, Layers, Link2, Trash2, Clock, ExternalLink, Loader2 as LoaderIcon } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';

type ProfileView = 'main' | 'account' | 'security' | 'preferences' | 'analytics';

const SecurityWorkflow: React.FC<{
    type: 'sec_password' | 'sec_email' | 'sec_mobile',
    onClose: () => void,
    token: string,
    userEmail: string,
    currentValue?: string
}> = ({ type, onClose, token, userEmail, currentValue }) => {
    const [step, setStep] = useState<'init' | 'otp'>('init');
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        newEmail: '',
        newMobile: '',
        otp: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInitiate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            let url = '';
            let body = {};

            if (type === 'sec_password') {
                url = 'http://localhost:3001/auth/change-password/initiate';
                body = { currentPassword: formData.currentPassword };
            } else if (type === 'sec_email') {
                url = 'http://localhost:3001/auth/change-email/initiate';
                body = { newEmail: formData.newEmail };
            } else {
                url = 'http://localhost:3001/auth/change-mobile/initiate';
                body = { newMobile: formData.newMobile };
            }

            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const data = await resp.json();
            if (resp.ok) setStep('otp');
            else setError(data.message);
        } catch { setError('Connection failed'); }
        finally { setLoading(false); }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            let url = '';
            let body = { otp: formData.otp };

            if (type === 'sec_password') {
                url = 'http://localhost:3001/auth/change-password/verify';
                Object.assign(body, { newPassword: formData.newPassword });
            } else if (type === 'sec_email') {
                url = 'http://localhost:3001/auth/change-email/verify';
                Object.assign(body, { newEmail: formData.newEmail });
            } else {
                url = 'http://localhost:3001/auth/change-mobile/verify';
                Object.assign(body, { newMobile: formData.newMobile });
            }

            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            if (resp.ok) onClose();
            else setError((await resp.json()).message);
        } catch { setError('Verification failed'); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={step === 'init' ? handleInitiate : handleVerify} className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${type === 'sec_password' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {type === 'sec_password' ? <Key size={18} /> : type === 'sec_email' ? <Mail size={18} /> : <Shield size={18} />}
                </div>
                <p className="font-black text-foreground/50 text-xs uppercase tracking-widest">
                    {type === 'sec_password' ? 'Password Security' : type === 'sec_email' ? 'Change Email Address' : 'Change Mobile Number'}
                </p>
            </div>

            {currentValue && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20 mb-1">Current {type === 'sec_email' ? 'Email' : 'Mobile'}</p>
                    <p className="text-sm font-bold text-foreground/60">{currentValue}</p>
                </div>
            )}

            {step === 'init' ? (
                <>
                    {type === 'sec_password' ? (
                        <input
                            type="password"
                            placeholder="Current Password"
                            value={formData.currentPassword}
                            onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-foreground font-bold focus:border-accent outline-none"
                            required
                        />
                    ) : type === 'sec_email' ? (
                        <input
                            type="email"
                            placeholder="New Email Address"
                            value={formData.newEmail}
                            onChange={e => setFormData({ ...formData, newEmail: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-foreground font-bold focus:border-accent outline-none"
                            required
                        />
                    ) : (
                        <input
                            type="text"
                            placeholder="New Mobile Number"
                            value={formData.newMobile}
                            onChange={e => setFormData({ ...formData, newMobile: e.target.value })}
                            className="w-full bg-foreground/[0.05] border border-border rounded-2xl p-4 text-foreground font-bold focus:border-accent outline-none"
                            required
                        />
                    )}
                    <button disabled={loading} className="w-full p-4 bg-foreground/[0.03] hover:bg-foreground/[0.08] border border-border rounded-2xl text-foreground font-black uppercase tracking-widest text-sm transition-all">
                        {loading ? 'Processing...' : 'Verify Identity'}
                    </button>
                </>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-foreground/40 font-medium">We sent a 6-digit code to <strong>{userEmail}</strong></p>
                    <input
                        placeholder="000000"
                        value={formData.otp}
                        onChange={e => setFormData({ ...formData, otp: e.target.value })}
                        className="w-full bg-foreground/[0.05] border border-accent/50 rounded-2xl p-5 text-center text-3xl font-black tracking-[12px] text-accent outline-none focus:border-accent"
                        maxLength={6}
                        required
                    />
                    {type === 'sec_password' && (
                        <input
                            type="password"
                            placeholder="New Password"
                            value={formData.newPassword}
                            onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-foreground font-bold focus:border-accent outline-none"
                            required
                        />
                    )}
                    <button disabled={loading} className="w-full p-5 bg-accent rounded-2xl text-white font-black uppercase tracking-widest flex items-center justify-center gap-2">
                        {loading ? 'Verifying...' : 'Update Credentials'}
                    </button>
                </div>
            )}
            {error && <p className="text-red-400 text-xs font-bold text-center">{error}</p>}
        </form>
    );
};

export const ProfileOverlay: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeView, setActiveView] = useState<ProfileView>('main');
    const [isEditing, setIsEditing] = useState(false);
    const { user, token, logout, theme, setTheme, updateUser } = useAuthStore();

    // Form States
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        companyName: user?.companyName || '',
        mobile: (user as any)?.mobile || ''
    });
    const [status, setStatus] = useState<{ type: string, msg: string } | null>(null);

    // Session Management States
    const { moduleAssignments, moduleData, loadSessionById, deleteSession } = useStore();
    const [sessions, setSessions] = useState<any[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    // Intelligence Stats Calculation
    const totalClassified = Object.values(moduleAssignments).reduce((sum, tables) => sum + tables.length, 0);
    const activeModules = Object.values(moduleAssignments).filter(tables => tables.length > 0).length;
    const totalJoins = Object.values(moduleData).reduce((sum, data) => sum + (data.joins?.length || 0), 0);

    const fetchSessions = async () => {
        setSessionsLoading(true);
        try {
            const resp = await fetch('http://localhost:3001/sessions/list', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) setSessions(await resp.json());
        } catch (e) {
            console.error('Failed to fetch sessions:', e);
        } finally {
            setSessionsLoading(false);
        }
    };

    useEffect(() => {
        if (activeView === 'analytics' && token) {
            fetchSessions();
        }
    }, [activeView, token]);

    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            setActiveView('main');
            setIsEditing(false);
            setProfileForm({
                name: user?.name || '',
                companyName: user?.companyName || '',
                mobile: (user as any)?.mobile || ''
            });
            setStatus(null);
        };
        window.addEventListener('open-profile', handleOpen);
        return () => window.removeEventListener('open-profile', handleOpen);
    }, [user]);

    if (!isOpen) return null;

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const resp = await fetch('http://localhost:3001/auth/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: profileForm.name,
                    companyName: profileForm.companyName,
                    mobile: profileForm.mobile
                })
            });
            const data = await resp.json();
            if (resp.ok) {
                updateUser(data.user);
                setStatus({ type: 'success', msg: 'Profile updated successfully' });
                setIsEditing(false);
                setTimeout(() => setStatus(null), 3000);
            } else {
                setStatus({ type: 'error', msg: data.message });
            }
        } catch (err) {
            setStatus({ type: 'error', msg: 'Failed to update profile' });
        }
    };

    const handleBack = () => {
        if (status?.type.startsWith('sec_')) {
            setStatus(null);
        } else {
            setActiveView('main');
            setStatus(null);
            setIsEditing(false);
        }
    };

    const renderHeader = (title: string, showBack = true) => (
        <div className="flex items-center justify-between mb-10 pr-12">
            <div className="flex items-center gap-4">
                {showBack && (
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 rounded-full bg-foreground/[0.03] flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-accent transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
                <h2 className="text-2xl font-black text-foreground tracking-tight">{title}</h2>
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-end p-6 pointer-events-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-background/40 backdrop-blur-3xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, x: 100, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.95 }}
                        className="relative w-full max-w-[460px] h-full bg-surface/90 border border-border rounded-[40px] shadow-2xl overflow-hidden flex flex-col p-8"
                    >
                        {/* Close button - absolute for alignment */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-8 right-8 w-10 h-10 rounded-full bg-foreground/[0.03] flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/[0.08] transition-all z-50 border border-border"
                        >
                            <X size={20} />
                        </button>
                        {activeView === 'main' && (
                            <>
                                {renderHeader('Session Profile', false)}

                                <div className="mb-10 p-6 rounded-3xl bg-accent/10 border border-accent/20 flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center text-white shadow-2xl shadow-accent/40 ring-4 ring-accent/20">
                                        <span className="text-4xl font-black">{user?.name[0]}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-2xl font-black text-foreground">{user?.name}</h3>
                                        <span className="text-foreground/40 font-bold uppercase tracking-widest text-xs mt-1">ID: {user?.employeeId}</span>
                                        <span className="text-accent font-medium text-sm mt-1">{user?.email}</span>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                    {[
                                        { id: 'account', icon: User, label: 'Account Profile', sub: 'Update personal information', color: 'text-blue-400' },
                                        { id: 'security', icon: Shield, label: 'Security & Privacy', sub: 'Credentials and session safety', color: 'text-emerald-400' },
                                        { id: 'preferences', icon: Settings, label: 'Preferences', sub: 'UI theme and workspace', color: 'text-accent' },
                                        { id: 'analytics', icon: Activity, label: 'Usage Analytics', sub: 'Intelligence statistics', color: 'text-purple-400' },
                                    ].map((item: any) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveView(item.id)}
                                            className="w-full p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent/30 hover:bg-accent/[0.05] transition-all text-left flex items-center gap-5 group"
                                        >
                                            <div className={`p-3 rounded-xl bg-white/5 ${item.color} group-hover:scale-110 transition-transform shadow-lg`}>
                                                <item.icon size={24} />
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <span className="text-lg font-black text-foreground/80 group-hover:text-foreground transition-colors">{item.label}</span>
                                                <span className="text-sm font-medium text-foreground/20">{item.sub}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="pt-8 mt-auto">
                                    <button
                                        onClick={async () => {
                                            await logout();
                                            setIsOpen(false);
                                        }}
                                        className="w-full p-5 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500 transition-all text-red-500 hover:text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 group shadow-lg shadow-red-500/10"
                                    >
                                        <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
                                        End Session
                                    </button>
                                </div>
                            </>
                        )}

                        {activeView === 'account' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="flex items-center justify-between mb-8">
                                    {renderHeader('Account Profile')}
                                </div>

                                <form onSubmit={handleUpdateProfile} className="space-y-6 -mt-6">
                                    <div className="space-y-4 bg-foreground/[0.02] p-6 rounded-[32px] border border-border relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">Personal Details</h4>
                                            {!isEditing && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(true)}
                                                    className="text-xs font-black text-accent hover:text-white transition-colors flex items-center gap-1.5"
                                                >
                                                    Modify Information
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-foreground/30 uppercase tracking-widest ml-1">Full Name</label>
                                                <input
                                                    disabled={!isEditing}
                                                    value={profileForm.name}
                                                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                                    className={`w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-foreground font-bold outline-none transition-all ${isEditing ? 'focus:border-accent ring-1 ring-accent/0 focus:ring-accent/20' : 'opacity-60 cursor-not-allowed border-transparent'}`}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-foreground/30 uppercase tracking-widest ml-1">Company Entity</label>
                                                <input
                                                    disabled={!isEditing}
                                                    value={profileForm.companyName}
                                                    onChange={e => setProfileForm({ ...profileForm, companyName: e.target.value })}
                                                    className={`w-full bg-foreground/[0.02] border border-border rounded-2xl p-4 text-foreground font-bold outline-none transition-all ${isEditing ? 'focus:border-accent ring-1 ring-accent/0 focus:ring-accent/20' : 'opacity-60 cursor-not-allowed border-transparent'}`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 bg-foreground/[0.02] p-6 rounded-[32px] border border-border">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Authenticated Identifiers</h4>
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-foreground/30 uppercase tracking-widest ml-1">Primary Email</label>
                                                <div className="w-full bg-foreground/[0.01] border border-border rounded-2xl p-4 text-foreground/50 font-bold overflow-hidden truncate">
                                                    {user?.email}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-foreground/30 uppercase tracking-widest ml-1">Contact Mobile</label>
                                                <div className="w-full bg-foreground/[0.01] border border-border rounded-2xl p-4 text-foreground/50 font-bold flex items-center justify-between">
                                                    <span>{(user as any)?.mobile || 'Not provided'}</span>
                                                    <span className="text-[8px] font-black bg-foreground/[0.05] px-2 py-1 rounded text-foreground/30">READ ONLY</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {status && (
                                        <div className={`p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {status.type === 'success' && <CheckCircle2 size={18} />}
                                            {status.msg}
                                        </div>
                                    )}

                                    {isEditing && (
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setProfileForm({
                                                        name: user?.name || '',
                                                        companyName: user?.companyName || '',
                                                        mobile: (user as any)?.mobile || ''
                                                    });
                                                }}
                                                className="flex-1 p-4 bg-foreground/[0.05] rounded-2xl text-foreground font-black uppercase tracking-widest text-xs border border-border hover:bg-foreground/[0.08]"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-[2] p-4 bg-accent rounded-2xl text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-accent/20"
                                            >
                                                <Save size={16} />
                                                Commit Transformation
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </motion.div>
                        )}

                        {activeView === 'security' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                {renderHeader('Privacy & Security')}
                                {!status?.type.startsWith('sec_') ? (
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => setStatus({ type: 'sec_password', msg: '' })}
                                            className="w-full p-6 rounded-3xl bg-foreground/[0.01] border border-border flex items-center justify-between group hover:border-accent/30 transition-all"
                                        >
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl"><Key size={24} /></div>
                                                <div>
                                                    <p className="text-lg font-black text-foreground">Update Password</p>
                                                    <p className="text-sm font-medium text-foreground/20">Change your security code</p>
                                                </div>
                                            </div>
                                            <ChevronLeft size={20} className="rotate-180 opacity-20" />
                                        </button>

                                        <button
                                            onClick={() => setStatus({ type: 'sec_email', msg: '' })}
                                            className="w-full p-6 rounded-3xl bg-foreground/[0.01] border border-border flex items-center justify-between group hover:border-accent/30 transition-all"
                                        >
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl"><Mail size={24} /></div>
                                                <div>
                                                    <p className="text-lg font-black text-foreground">Change Email</p>
                                                    <p className="text-sm font-medium text-foreground/20">Manage your linked address</p>
                                                </div>
                                            </div>
                                            <ChevronLeft size={20} className="rotate-180 opacity-20" />
                                        </button>

                                        <button
                                            onClick={() => setStatus({ type: 'sec_mobile', msg: '' })}
                                            className="w-full p-6 rounded-3xl bg-foreground/[0.01] border border-border flex items-center justify-between group hover:border-accent/30 transition-all"
                                        >
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl"><Activity size={24} /></div>
                                                <div>
                                                    <p className="text-lg font-black text-foreground">Change Mobile</p>
                                                    <p className="text-sm font-medium text-foreground/20">OTP-protected identifier</p>
                                                </div>
                                            </div>
                                            <ChevronLeft size={20} className="rotate-180 opacity-20" />
                                        </button>

                                        <div className="p-6 rounded-3xl bg-foreground/[0.01] border border-border flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl"><Shield size={24} /></div>
                                                <div>
                                                    <p className="text-lg font-black text-foreground">2FA Protection</p>
                                                    <p className="text-sm font-medium text-foreground/20">Multi-factor authentication</p>
                                                </div>
                                            </div>
                                            <div className="w-12 h-6 bg-foreground/[0.05] rounded-full relative p-1 cursor-not-allowed opacity-30">
                                                <div className="w-4 h-4 bg-foreground/20 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <SecurityWorkflow
                                        type={status.type as any}
                                        onClose={() => setStatus(null)}
                                        token={token!}
                                        userEmail={user?.email!}
                                        currentValue={status.type === 'sec_email' ? user?.email : status.type === 'sec_mobile' ? (user as any)?.mobile : undefined}
                                    />
                                )}
                            </motion.div>
                        )}

                        {activeView === 'preferences' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                {renderHeader('App Preferences')}
                                <div className="space-y-4">
                                    <div className="p-6 rounded-3xl bg-foreground/[0.01] border border-border space-y-4">
                                        <p className="text-xs font-black text-foreground/30 uppercase tracking-widest">Interface Appearance</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            <button
                                                onClick={() => setTheme('light')}
                                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'bg-accent/10 border-accent text-accent shadow-lg shadow-accent/10' : 'bg-foreground/[0.03] border-border text-foreground/40 hover:bg-foreground/[0.05]'}`}
                                            >
                                                <Sun size={24} />
                                                <span className="font-bold uppercase tracking-widest text-[10px]">Light</span>
                                            </button>
                                            <button
                                                onClick={() => setTheme('dark')}
                                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'bg-accent/10 border-accent text-accent shadow-lg shadow-accent/10' : 'bg-foreground/[0.03] border-border text-foreground/40 hover:bg-foreground/[0.05]'}`}
                                            >
                                                <Moon size={24} />
                                                <span className="font-bold uppercase tracking-widest text-[10px]">Dark</span>
                                            </button>
                                            <button
                                                onClick={() => setTheme('system')}
                                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'system' ? 'bg-accent/10 border-accent text-accent shadow-lg shadow-accent/10' : 'bg-foreground/[0.03] border-border text-foreground/40 hover:bg-foreground/[0.05]'}`}
                                            >
                                                <Monitor size={24} />
                                                <span className="font-bold uppercase tracking-widest text-[10px]">System</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                                        <div>
                                            <p className="text-lg font-black text-foreground">Safe Snapshot Save</p>
                                            <p className="text-sm font-medium text-foreground/20">Auto-save sessions to cloud</p>
                                        </div>
                                        <div className="w-12 h-6 bg-accent rounded-full relative p-1 cursor-pointer">
                                            <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeView === 'analytics' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                {renderHeader('Intelligence & Usage')}
                                <div className="space-y-6">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex flex-col items-center gap-2 text-center">
                                            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl mb-1">
                                                <Database size={20} />
                                            </div>
                                            <span className="text-2xl font-black text-foreground">{totalClassified}</span>
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/30">Classified Tables</span>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-accent/5 border border-accent/10 flex flex-col items-center gap-2 text-center">
                                            <div className="p-2.5 bg-accent/10 text-accent rounded-xl mb-1">
                                                <Layers size={20} />
                                            </div>
                                            <span className="text-2xl font-black text-foreground">{activeModules}</span>
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/30">Active Modules</span>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-purple-500/5 border border-purple-500/10 flex flex-col items-center gap-2 text-center">
                                            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl mb-1">
                                                <Link2 size={20} />
                                            </div>
                                            <span className="text-2xl font-black text-foreground">{totalJoins}</span>
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/30">Total Joins</span>
                                        </div>
                                    </div>

                                    {/* Session History Container */}
                                    <div className="space-y-4 pr-1">
                                        {/* Local Workspace Sessions */}
                                        <div className="p-6 rounded-3xl bg-foreground/[0.01] border border-border space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={16} className="text-accent" />
                                                    <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Local Workspace Sessions</p>
                                                </div>
                                                <span className="text-[9px] font-black text-foreground/20 px-2 py-0.5 bg-foreground/[0.03] rounded uppercase tracking-tighter">Current Device</span>
                                            </div>

                                            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                                                {sessionsLoading ? (
                                                    <div className="py-8 flex flex-col items-center gap-3 opacity-30">
                                                        <LoaderIcon size={20} className="animate-spin" />
                                                        <p className="text-[9px] font-black uppercase tracking-widest">Scanning...</p>
                                                    </div>
                                                ) : sessions.filter(s => s.is_local).length > 0 ? (
                                                    sessions.filter(s => s.is_local).map((s) => (
                                                        <div key={s.id} className="group p-4 rounded-2xl bg-foreground/[0.02] border border-border hover:border-accent/30 transition-all flex items-center justify-between">
                                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                                <p className="font-bold text-sm text-foreground/80 truncate">{s.session_id_frontend}</p>
                                                                <p className="text-[10px] font-medium text-foreground/30">
                                                                    Last active • {new Date(s.updated_at).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => {
                                                                        if (confirm('Load this session? Unsaved changes in current session will be lost.')) {
                                                                            loadSessionById(token!, s.id);
                                                                        }
                                                                    }}
                                                                    className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all shadow-sm"
                                                                    title="Load Session"
                                                                >
                                                                    <ExternalLink size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={async () => {
                                                                        if (confirm('Permanently delete this session and its data files? This cannot be undone.')) {
                                                                            await deleteSession(token!, s.id);
                                                                            fetchSessions();
                                                                        }
                                                                    }}
                                                                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                                    title="Delete Permanently"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-8 flex flex-col items-center text-center gap-3 opacity-30">
                                                        <Activity size={24} />
                                                        <p className="text-[9px] font-black uppercase tracking-widest">No local sessions found</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* External/Other Device Sessions */}
                                        <div className="p-6 rounded-3xl bg-foreground/[0.01] border border-border space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <Monitor size={16} className="text-foreground/30" />
                                                    <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Other Saved Sessions</p>
                                                </div>
                                                <span className="text-[9px] font-black text-foreground/20 px-2 py-0.5 bg-foreground/[0.03] rounded uppercase tracking-tighter">External Device</span>
                                            </div>

                                            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                                                {sessionsLoading ? null : sessions.filter(s => !s.is_local).length > 0 ? (
                                                    sessions.filter(s => !s.is_local).map((s) => (
                                                        <div key={s.id} className="group p-4 rounded-2xl bg-foreground/[0.01] border border-dashed border-border/50 hover:border-accent/20 transition-all flex items-center justify-between">
                                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                                <p className="font-bold text-sm text-foreground/40 truncate">{s.session_id_frontend}</p>
                                                                <p className="text-[10px] font-medium text-foreground/20">
                                                                    Recorded on • {new Date(s.updated_at).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[8px] font-black text-foreground/20 mr-2 uppercase tracking-widest leading-none">Remote Workspace</span>
                                                                <div className="p-2 rounded-lg bg-foreground/[0.03] text-foreground/20">
                                                                    <Monitor size={14} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-8 flex flex-col items-center text-center gap-2 opacity-20">
                                                        <Database size={20} />
                                                        <p className="text-[9px] font-black uppercase tracking-widest">No external sessions history</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
