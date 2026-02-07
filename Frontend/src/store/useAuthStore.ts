import { create } from 'zustand';

interface User {
    id: string;
    employeeId: string;
    email: string;
    name: string;
    companyName: string;
    mobile: string;
}

interface AuthState {
    token: string | null;
    user: User | null;
    theme: 'light' | 'dark' | 'system';
    isAuthOverlayOpen: boolean;
    overlayView: 'login' | 'signup' | 'forgot-password' | 'signup-otp' | 'forgot-otp' | 'reset-password';
    tempData: {
        email?: string;
        employeeId?: string;
        otpPurpose?: 'signup' | 'forgot-password';
    } | null;
    isVerifying: boolean;

    // Actions
    setToken: (token: string | null) => void;
    setUser: (user: User | null) => void;
    updateUser: (user: Partial<User>) => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    openAuthOverlay: (view?: AuthState['overlayView']) => void;
    closeAuthOverlay: () => void;
    setOverlayView: (view: AuthState['overlayView']) => void;
    setTempData: (data: AuthState['tempData']) => void;
    logout: (skipBackend?: boolean) => Promise<void>;
    revokeSession: () => void;
    verifyAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    theme: (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system',
    isAuthOverlayOpen: false,
    overlayView: 'login',
    tempData: null,
    isVerifying: false,

    setToken: (token) => {
        set({ token });
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
    },
    setUser: (user) => {
        set({ user });
        if (user) localStorage.setItem('user', JSON.stringify(user));
        else localStorage.removeItem('user');
    },
    updateUser: (partial) => set((s) => {
        const newUser = s.user ? { ...s.user, ...partial } : null;
        if (newUser) localStorage.setItem('user', JSON.stringify(newUser));
        return { user: newUser };
    }),
    setTheme: (theme) => {
        set({ theme });
        localStorage.setItem('theme', theme);

        const applyTheme = (t: 'light' | 'dark' | 'system') => {
            let actualTheme = t;
            if (t === 'system') {
                actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }

            if (actualTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        applyTheme(theme);
    },
    openAuthOverlay: (view = 'login') => set({ isAuthOverlayOpen: true, overlayView: view, tempData: null }),
    closeAuthOverlay: () => set({ isAuthOverlayOpen: false, tempData: null }),
    setOverlayView: (view) => set({ overlayView: view }),
    setTempData: (data) => set({ tempData: data }),
    logout: async (skipBackend = false) => {
        const { token } = useAuthStore.getState();
        if (token && !skipBackend) {
            try {
                await fetch('http://localhost:3001/auth/logout', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (err) {
                console.warn('Backend logout failed:', err);
            }
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null, isAuthOverlayOpen: false, tempData: null });
    },
    verifyAuth: async () => {
        const { token, logout, setUser } = useAuthStore.getState();
        if (!token) return;

        set({ isVerifying: true });
        try {
            const res = await fetch('http://localhost:3001/auth/verify', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401 || res.status === 403) {
                await logout(true); // Token invalid on backend, clear locally
                return;
            }

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            }
        } catch (err) {
            console.error('Session verification failed:', err);
            // If it's a network error, we don't logout, just keep the local state for now
        } finally {
            set({ isVerifying: false });
        }
    },
    revokeSession: () => {
        const { token } = useAuthStore.getState();
        if (!token) return;

        // Use fetch with keepalive: true to ensure the request is sent even if the window is closed
        fetch('http://localhost:3001/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            keepalive: true
        }).catch(() => {
            // Silently fail as the window is closing anyway
        });
    }
}));

// Initialize theme on load
const storedTheme = (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
const applyInitialTheme = (t: 'light' | 'dark' | 'system') => {
    let actualTheme = t;
    if (t === 'system') {
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (actualTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};
applyInitialTheme(storedTheme);

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem('theme') === 'system' || !localStorage.getItem('theme')) {
        if (e.matches) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }
});
