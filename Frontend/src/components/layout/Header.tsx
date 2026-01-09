import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, LogIn, UserPlus, Zap, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { clsx } from 'clsx';

export const Header: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { token, user, openAuthOverlay, theme, setTheme } = useAuthStore();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isHome = location.pathname === '/';
    const isClassify = location.pathname === '/classify';
    const isReader = location.pathname === '/classified';

    const handleNav = (path: string) => {
        if (!token) {
            openAuthOverlay('login');
            return;
        }
        navigate(path);
    };

    return (
        <header className={clsx(
            "sticky top-0 left-0 right-0 z-[50] h-16 px-8 flex items-center justify-between border-b transition-all duration-300",
            (scrolled || !isHome)
                ? "bg-background/80 backdrop-blur-xl border-border shadow-2xl shadow-black/10"
                : "bg-transparent border-transparent"
        )}>
            <div className="flex items-center gap-8">
                {/* Branding */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20 rotate-[-5deg] group-hover:rotate-0 transition-transform">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-foreground tracking-widest uppercase">Wins Soft</span>
                        <span className="text-[10px] font-bold text-accent tracking-[0.3em] uppercase opacity-60">Classifier</span>
                    </div>
                </Link>

                {/* Back Button integrated in Header */}
                {!isHome && (
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 pl-4 pr-5 py-2 rounded-xl bg-foreground/[0.03] border border-border text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground hover:bg-foreground/[0.08] transition-all group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Home
                    </button>
                )}
            </div>

            {/* Navigation Links */}
            <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-12">
                <button
                    onClick={() => handleNav('/classify')}
                    className={clsx(
                        "text-xs font-black uppercase tracking-[0.3em] transition-all",
                        isClassify ? "text-accent" : "text-foreground/40 hover:text-accent"
                    )}
                >
                    Classifier Studio
                </button>
                <button
                    onClick={() => handleNav('/classified')}
                    className={clsx(
                        "text-xs font-black uppercase tracking-[0.3em] transition-all",
                        isReader ? "text-accent" : "text-foreground/40 hover:text-accent"
                    )}
                >
                    Schema Reader
                </button>
            </nav>

            {/* Auth Actions */}
            <div className="flex items-center gap-4">
                {!token && (
                    <div className="flex items-center bg-foreground/[0.03] border border-border rounded-xl p-1 mr-2">
                        <button
                            onClick={() => setTheme('light')}
                            className={clsx(
                                "p-1.5 rounded-lg transition-all",
                                theme === 'light' ? "bg-surface text-accent shadow-sm" : "text-foreground/40 hover:text-foreground"
                            )}
                            title="Light Mode"
                        >
                            <Sun size={16} />
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={clsx(
                                "p-1.5 rounded-lg transition-all",
                                theme === 'dark' ? "bg-surface text-accent shadow-sm" : "text-foreground/40 hover:text-foreground"
                            )}
                            title="Dark Mode"
                        >
                            <Moon size={16} />
                        </button>
                    </div>
                )}

                {!token ? (
                    <>
                        <button
                            onClick={() => openAuthOverlay('login')}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-foreground/60 hover:text-foreground transition-colors"
                        >
                            <LogIn size={18} />
                            Login
                        </button>
                        <button
                            onClick={() => openAuthOverlay('signup')}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-foreground/[0.03] border border-border text-sm font-bold text-foreground hover:bg-foreground/[0.08] transition-all"
                        >
                            <UserPlus size={18} />
                            Sign Up
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-profile'))}
                        className="w-12 h-12 rounded-2xl bg-foreground/[0.03] border border-border flex items-center justify-center text-foreground hover:bg-foreground/[0.08] transition-all group overflow-hidden"
                    >
                        {user?.name ? (
                            <span className="text-lg font-black text-accent">{user.name[0]}</span>
                        ) : (
                            <User size={24} className="group-hover:scale-110 transition-transform" />
                        )}
                    </button>
                )}
            </div>
        </header>
    );
};
