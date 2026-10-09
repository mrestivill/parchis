
import React, { useState } from 'react';

interface AuthModalProps {
    onLogin: (user: string, pass: string) => void;
    onRegister: (user: string, pass: string) => void;
    error?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLogin, onRegister, error }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Reset errors and inputs when switching modes
    React.useEffect(() => {
        setLocalError(null);
        setIsLoading(false);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
    }, [mode]);

    // Make sure we un-stick the loading button if an error arrives
    React.useEffect(() => {
        if (error) {
            setIsLoading(false);
        }
    }, [error]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (!username.trim() || !password.trim()) {
            setLocalError('Please fill in all fields.');
            return;
        }

        if (/\s/.test(username)) {
            setLocalError('The username cannot contain spaces.');
            return;
        }

        if (mode === 'register') {
            if (password !== confirmPassword) {
                setLocalError('Passwords do not match.');
                return;
            }
            if (password.length < 6) {
                setLocalError('The password must be at least 6 characters long.');
                return;
            }
        }

        setIsLoading(true);
        if (mode === 'login') {
            onLogin(username, password);
        } else {
            onRegister(username, password);
        }

        // isLoading will be reset by the useEffect if mode changes (on success)
        // or can be reset here if we want to allow immediate retry on non-auth errors
        // But since onLogin/onRegister are async via socket emits, we rely on server response.
        // We'll add a safety timeout to re-enable the button if no response arrives.
        setTimeout(() => setIsLoading(false), 5000);
    };

    const displayError = localError || error;

    return (
        <div className="flex flex-col w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-gray-700 overflow-hidden transform transition-all duration-300">
            {/* Tabs */}
            <div className="flex bg-slate-50 dark:bg-gray-900/50">
                <button
                    onClick={() => setMode('login')}
                    className={`flex-1 py-4 text-sm font-black uppercase tracking-wider transition-all ${mode === 'login' ? 'bg-yellow-500 text-black' : 'text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white'}`}
                >
                    Login
                </button>
                <button
                    onClick={() => setMode('register')}
                    className={`flex-1 py-4 text-sm font-black uppercase tracking-wider transition-all ${mode === 'register' ? 'bg-yellow-500 text-black' : 'text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white'}`}
                >
                    Register
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
                <div className="text-center">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1 uppercase">
                        {mode === 'login' ? 'Welcome' : 'Create Account'}
                    </h2>
                    <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">
                        Save your stats and compete with friends.
                    </p>
                </div>

                <div className={`w-full transition-all duration-200 ${displayError ? 'opacity-100' : 'opacity-0 pointer-events-none hidden sm:block'}`}>
                    <div className="w-full bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-500 text-xs font-bold px-4 py-3 rounded-xl text-center flex items-center justify-center gap-2">
                        <span>⚠️</span> {displayError || 'Placeholder'}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase ml-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all font-bold disabled:opacity-50"
                            placeholder="Your username"
                            autoFocus
                        />
                        <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold ml-1 mt-1">* No spaces</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all font-bold disabled:opacity-50"
                            placeholder="••••••••"
                        />
                    </div>
                    {mode === 'register' && (
                        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase ml-1">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                                className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all font-bold disabled:opacity-50"
                                placeholder="••••••••"
                            />
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black rounded-2xl shadow-lg transform active:scale-95 transition-all uppercase tracking-widest mt-2 disabled:opacity-70 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                        mode === 'login' ? 'LOGIN' : 'REGISTER'
                    )}
                </button>
            </form>
        </div>
    );
};
