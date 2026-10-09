import React, { useState } from 'react';
import { useUITheme } from '../context/ThemeContext';
import { GameRulesModal } from './GameRulesModal';
import { LeaderboardModal } from './LeaderboardModal';
import { ProfileModal } from './ProfileModal';

interface LobbyProps {
    onCreateRoom: (players: 4 | 6, name: string, color?: any) => void;
    onJoinRoom: (roomId: string, name: string, color?: any, isSpectator?: boolean) => void;
    getRoomDetails: (roomId: string) => Promise<import('@parchis/shared').RoomDetails | null>;
    user: any;
    onLogout: () => void;
    onShowAuth: () => void;
    onShowAdmin: () => void;
    error?: string | null;
    publicLeaderboards: any;
    onFetchLeaderboards: () => void;
    userStats: any;
    fetchUserStats: (userId?: string) => void;
    statsLoading: boolean;
}

export const Lobby: React.FC<LobbyProps> = ({ onCreateRoom, onJoinRoom, user, onLogout, onShowAuth, onShowAdmin, error, publicLeaderboards, onFetchLeaderboards, userStats, fetchUserStats, statsLoading }) => {
    const { theme, toggleTheme } = useUITheme();
    const [roomId, setRoomId] = useState('');
    const [name, setName] = useState(user?.username || '');
    const [selectedColor, setSelectedColor] = useState<any>(null); // PlayerColor
    const [showRules, setShowRules] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    // Create Mode State
    const [createMode, setCreateMode] = useState<4 | 6 | null>(null);

    // Synchronize name if user logs in/out while on lobby
    React.useEffect(() => {
        if (user) setName(user.username);
    }, [user]);

    const handleCreateClick = (count: 4 | 6) => {
        setCreateMode(count);
        // Reset selection
        setSelectedColor(null);
    };

    const confirmCreate = () => {
        if (createMode) {
            onCreateRoom(createMode, name, selectedColor);
            setCreateMode(null);
        }
    };

    // Helper: Available Colors for Create (All based on count)
    const getCreateColors = (count: 4 | 6) => {
        const base = ['blue', 'red', 'green', 'yellow'];
        if (count === 6) base.push('purple', 'orange');
        return base;
    };

    const ColorDot = ({ color, isSelected, onClick, disabled }: any) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-10 h-10 rounded-full border-4 transition-all transform hover:scale-110 active:scale-95 ${isSelected ? 'border-white dark:border-gray-800 ring-2 ring-yellow-400 scale-110' : 'border-transparent opacity-80 hover:opacity-100'
                } ${disabled ? 'opacity-20 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
            style={{ backgroundColor: color }}
            title={color}
        >
            {isSelected && <span className="text-white text-lg drop-shadow-md">✓</span>}
        </button>
    );

    const handleShowLeaderboards = () => {
        onFetchLeaderboards();
        setShowLeaderboard(true);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white gap-2 p-6 transition-colors duration-300">
            {/* Header with Theme Toggle */}
            {/* Header with Theme Toggle */}
            {/* Header with Theme Toggle */}
            <div className="w-full max-w-2xl flex flex-col md:flex-row justify-center md:justify-between items-center mb-0 gap-2 relative">
                <div className="flex flex-wrap justify-center gap-2 w-full md:w-auto items-center">
                    <button
                        onClick={() => setShowRules(true)}
                        className="px-3 py-2 md:px-4 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all backdrop-blur-sm border border-slate-200/50 dark:border-gray-700/50 flex-grow md:flex-grow-0"
                    >
                        📜 Rules
                    </button>
                    <button
                        onClick={handleShowLeaderboards}
                        className="px-3 py-2 md:px-4 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-xl text-xs font-black uppercase tracking-wider text-yellow-600 dark:text-yellow-500 transition-all backdrop-blur-sm border border-yellow-500/20 flex items-center justify-center gap-2 flex-grow md:flex-grow-0"
                    >
                        <span>🏆</span> Ranks
                    </button>
                    {user?.role === 'admin' && (
                        <button
                            onClick={onShowAdmin}
                            className="px-3 py-2 md:px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 flex-grow md:flex-grow-0"
                        >
                            ⚙️ ADMIN PANEL
                        </button>
                    )}
                    {/* Mobile Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="lg:hidden px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-all active:scale-95 text-base flex-grow md:flex-grow-0 flex items-center justify-center"
                        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>

                {/* Desktop Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="hidden lg:flex px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-all active:scale-95 text-lg items-center justify-center"
                    title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                >
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>
            </div>

            <div className="w-full max-w-sm mb-1 px-4">
                <img
                    src={theme === 'dark' ? "/logo_text_white.png" : "/logo_text_black.png"}
                    alt="Parchis Royale"
                    className="w-full h-auto drop-shadow-2xl"
                />
            </div>

            {/* Profile Section */}
            <div className="w-full max-w-md bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 dark:border-gray-700 flex flex-col gap-4 shadow-2xl">
                {user ? (
                    <>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Logged in as</p>
                                <h3 className="text-xl font-black text-yellow-600 dark:text-yellow-500">{user.username}</h3>
                            </div>
                            <button
                                onClick={onLogout}
                                className="text-xs font-bold text-red-600 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 transition-all"
                            >
                                LOGOUT
                            </button>
                        </div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="bg-slate-50 dark:bg-gray-900/50 p-3 rounded-xl border border-slate-100 dark:border-gray-700/50">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase">Wins / Games</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">{user.games_won} <span className="text-slate-300 dark:text-gray-600">/ {user.games_played}</span></p>
                            </div>
                            <div className="bg-slate-50 dark:bg-gray-900/50 p-3 rounded-xl border border-slate-100 dark:border-gray-700/50">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase">Pieces Captured</p>
                                <p className="text-lg font-black text-green-600 dark:text-green-400">{user.pieces_captured}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowProfile(true)}
                            className="w-full mt-2 py-2 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                        >
                            View Advanced Statistics
                        </button>
                    </>
                ) : (
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Play as guest or identify yourself.</p>
                        <button
                            onClick={onShowAuth}
                            className="text-sm font-black bg-yellow-500 dark:bg-yellow-600 hover:bg-yellow-400 dark:hover:bg-yellow-500 text-black px-4 py-2 rounded-xl transition-all shadow-lg active:scale-95"
                        >
                            LOGIN / REGISTER
                        </button>
                    </div>
                )}
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">

                {/* Create Section */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-gray-700 flex flex-col gap-6 relative overflow-hidden transition-all duration-300">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-8 bg-yellow-500 rounded-full" />
                        CREATE ROOM
                    </h2>

                    {!user && (
                        <input
                            type="text"
                            placeholder="Your Nickname"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all font-bold"
                        />
                    )}

                    {createMode ? (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <p className="text-sm text-slate-400 dark:text-gray-400 font-bold uppercase">Choose your Starting Color</p>
                            <div className="flex gap-2 justify-center flex-wrap bg-slate-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-slate-200 dark:border-gray-700/50">
                                {getCreateColors(createMode).map((c) => (
                                    <ColorDot
                                        key={c}
                                        color={c}
                                        isSelected={selectedColor === c}
                                        onClick={() => setSelectedColor(c)}
                                    />
                                ))}
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => setCreateMode(null)}
                                    className="flex-1 py-3 bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 text-slate-700 dark:text-white font-bold rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmCreate}
                                    className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl shadow-lg transition-all"
                                >
                                    CREATE!
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleCreateClick(4)}
                                disabled={!name}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black rounded-2xl shadow-lg transform active:scale-95 transition-all uppercase tracking-wider disabled:opacity-50"
                            >
                                Classic (4 P)
                            </button>

                        </div>
                    )}
                </div>

                {/* Join Section */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-gray-700 flex flex-col gap-6">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-8 bg-green-500 rounded-full" />
                        JOIN
                    </h2>

                    <div className="flex flex-col gap-4">
                        {!user && (
                            <input
                                type="text"
                                placeholder="Your Nickname"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold"
                            />
                        )}
                        <input
                            type="text"
                            placeholder="Room ID"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-mono font-bold uppercase"
                        />

                        <div className="flex flex-col gap-3 mt-2">
                            <button
                                onClick={() => onJoinRoom(roomId, name, undefined, false)}
                                disabled={!name || !roomId}
                                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl shadow-lg transform active:scale-95 transition-all uppercase tracking-wider disabled:opacity-50 disabled:grayscale"
                            >
                                Enter Room
                            </button>
                            <button
                                onClick={() => onJoinRoom(roomId, name, undefined, true)}
                                disabled={!name || !roomId}
                                className="w-full py-3 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-500 dark:text-gray-400 font-bold rounded-2xl transition-all uppercase tracking-wider text-xs"
                            >
                                Enter as Spectator
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-500 text-xs font-bold px-4 py-3 rounded-xl text-center animate-pulse uppercase tracking-wide">
                            ⚠️ {error}
                        </div>
                    )}
                </div>
            </div>

            <p className="text-slate-400 dark:text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em] mt-4">v{__APP_VERSION__}</p>

            {showRules && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <GameRulesModal onClose={() => setShowRules(false)} />
                </div>
            )}

            <LeaderboardModal
                isOpen={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
                leaderboards={publicLeaderboards}
                isLoading={!publicLeaderboards}
            />

            <ProfileModal
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
                user={user}
                userStats={userStats}
                fetchUserStats={fetchUserStats}
                isLoading={statsLoading}
                error={error}
            />
        </div >
    );
};
