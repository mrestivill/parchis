
import React, { useState, useEffect } from 'react';

interface AdminDashboardProps {
    stats: any;
    users: any[];
    onFetchStats: () => void;
    onFetchUsers: () => void;
    onAction: (type: string, targetId: any, value?: any) => void;
    onFetchSettings?: () => void;
    onSaveSettings?: (settings: any) => void;
    settings?: any;
    onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
    stats,
    users,
    onFetchStats,
    onFetchUsers,
    onAction,
    onFetchSettings,
    onSaveSettings,
    settings,
    onClose
}) => {
    const [view, setView] = useState<'metrics' | 'users' | 'rooms' | 'leaderboards' | 'config'>('metrics');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<any>(null);
    const [localSettings, setLocalSettings] = useState<any>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [refreshSuccess, setRefreshSuccess] = useState(false);
    const [headerRefreshSuccess, setHeaderRefreshSuccess] = useState(false);

    useEffect(() => {
        if (settings) setLocalSettings(settings);
    }, [settings]);

    useEffect(() => {
        onFetchStats();
        onFetchUsers();
        const interval = setInterval(onFetchStats, 10000); // Auto-refresh metrics
        return () => clearInterval(interval);
    }, []);

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const StatCard = ({ title, value, icon, color }: any) => (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700 flex items-center justify-between">
            <div>
                <p className="text-[10px] md:text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">{title}</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
            </div>
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-xl md:text-2xl ${color}`}>
                {icon}
            </div>
        </div>
    );

    const LeaderboardSection = ({ title, data, valueKey, label }: any) => (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700">
            <h3 className="text-sm md:text-md font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight flex items-center gap-2">
                <span>🏆</span> {title}
            </h3>
            <div className="flex flex-col gap-2">
                {data?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-gray-900 rounded-xl border border-slate-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 dark:text-gray-500">#{idx + 1}</span>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800 dark:text-gray-200 truncate max-w-[100px] md:max-w-none">{item.username}</span>
                                {item.level && <span className="text-[8px] font-black text-yellow-600 uppercase tracking-widest">Level {item.level}</span>}
                            </div>
                        </div>
                        <span className="text-[10px] md:text-xs font-black text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-lg">
                            {item[valueKey]} {label}
                        </span>
                    </div>
                ))}
                {(!data || data.length === 0) && (
                    <p className="text-xs text-slate-400 text-center py-4 italic">No data recorded</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-gray-950 flex flex-col overflow-hidden animate-in fade-in duration-300 safe-pt">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="bg-yellow-500 text-black p-1.5 md:p-2 rounded-xl font-black text-sm md:text-xl">PARCHÍS</div>
                    <h1 className="text-xs md:text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase truncate">Admin Panel</h1>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="hidden sm:flex flex-col items-end mr-2 md:mr-4">
                        <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Servidor</span>
                        <span className="text-[10px] md:text-xs font-bold text-green-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> ONLINE
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            onFetchStats();
                            setHeaderRefreshSuccess(true);
                            setTimeout(() => setHeaderRefreshSuccess(false), 2000);
                        }}
                        className="p-1.5 md:p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                    >
                        {headerRefreshSuccess ? '✅' : '🔄'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-slate-900 dark:bg-white text-white dark:text-black font-black rounded-xl hover:scale-105 transition-all uppercase text-[10px] md:text-xs tracking-widest"
                    >
                        Close
                    </button>
                </div>
            </header>

            <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
                {/* Sidebar / Top Nav on Mobile */}
                <nav className="flex flex-row md:flex-col bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-gray-800 p-2 md:p-6 gap-2 shrink-0 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setView('metrics')}
                        className={`whitespace-nowrap flex-1 md:flex-none text-center md:text-left px-4 py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-bold transition-all ${view === 'metrics' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800'}`}
                    >
                        📊 <span className="hidden md:inline">Statistics</span><span className="md:hidden">Stats</span>
                    </button>
                    <button
                        onClick={() => setView('leaderboards')}
                        className={`whitespace-nowrap flex-1 md:flex-none text-center md:text-left px-4 py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-bold transition-all ${view === 'leaderboards' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800'}`}
                    >
                        🏆 <span className="hidden md:inline">Leaderboards</span><span className="md:hidden">Top</span>
                    </button>
                    <button
                        onClick={() => setView('users')}
                        className={`whitespace-nowrap flex-1 md:flex-none text-center md:text-left px-4 py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-bold transition-all ${view === 'users' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800'}`}
                    >
                        👥 <span className="hidden md:inline">Users</span><span className="md:hidden">User</span>
                    </button>
                    <button
                        onClick={() => setView('rooms')}
                        className={`whitespace-nowrap flex-1 md:flex-none text-center md:text-left px-4 py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-bold transition-all ${view === 'rooms' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800'}`}
                    >
                        🎮 <span className="hidden md:inline">Games</span><span className="md:hidden">Rooms</span>
                    </button>
                    <button
                        onClick={() => {
                            setView('config');
                            if (onFetchSettings) {
                                onFetchSettings();
                                setRefreshSuccess(true);
                                setTimeout(() => setRefreshSuccess(false), 2000);
                            }
                        }}
                        className={`whitespace-nowrap flex-1 md:flex-none text-center md:text-left px-4 py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-bold transition-all ${view === 'config' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800'}`}
                    >
                        {refreshSuccess ? '✅ Updated' : (
                            <>⚙️ <span className="hidden md:inline">Config</span><span className="md:hidden">Cfg</span></>
                        )}
                    </button>
                </nav>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {view === 'metrics' && stats && (
                        <div className="flex flex-col gap-6 md:gap-8 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                <StatCard
                                    title="Online"
                                    value={stats.stats.onlineUsers}
                                    icon="🌐"
                                    color="bg-green-100 text-green-600 dark:bg-green-500/20"
                                />
                                <StatCard
                                    title="Rooms"
                                    value={stats.stats.activeRooms}
                                    icon="🎲"
                                    color="bg-blue-100 text-blue-600 dark:bg-blue-500/20"
                                />
                                <StatCard
                                    title="Registrations"
                                    value={stats.stats.totalUsers}
                                    icon="📁"
                                    color="bg-purple-100 text-purple-600 dark:bg-purple-500/20"
                                />
                                <StatCard
                                    title="Games"
                                    value={stats.stats.totalGamesPlayed}
                                    icon="🏆"
                                    color="bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700">
                                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                                        <span className="p-2 bg-slate-100 dark:bg-gray-900 rounded-xl">📉</span> Game
                                    </h3>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex-1 p-4 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-700">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase mb-1">Avg Dice</p>
                                            <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{stats.analytics?.globalAverage || 0}</p>
                                        </div>
                                        <div className="flex-1 p-4 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-700">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase mb-1">Total Dice</p>
                                            <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{stats.stats.totalDiceSum}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700">
                                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                                        <span className="p-2 bg-slate-100 dark:bg-gray-900 rounded-xl">🔍</span> Presence ({stats.presence?.length || 0})
                                    </h3>
                                    <div className="flex flex-col gap-2 max-h-[200px] md:max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {stats.presence?.map((p: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-gray-900 rounded-xl border border-slate-100 dark:border-gray-700">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                                    <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-gray-200 truncate">{p.name}</span>
                                                    {p.role === 'admin' && <span className="text-[7px] md:text-[8px] font-black text-yellow-600 border border-yellow-500/30 px-1 rounded uppercase shrink-0">Admin</span>}
                                                </div>
                                                <span className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest ml-2 shrink-0">
                                                    {p.isGuest ? 'Gst' : 'Reg'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'leaderboards' && stats && (
                        <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                <LeaderboardSection title="Top Winners" data={stats.leaderboards?.topWins} valueKey="games_won" label="Wins" />
                                <LeaderboardSection title="Capture Kings" data={stats.leaderboards?.topCapturers} valueKey="total_captured" label="Pieces" />
                                <LeaderboardSection title="Top Victims" data={stats.leaderboards?.mostVictims} valueKey="total_lost" label="Lost" />
                                <LeaderboardSection title="Kings of Doubles" data={stats.leaderboards?.doubleKings} valueKey="total_doubles" label="Doubles" />
                                <LeaderboardSection title="Number 1 Lovers" data={stats.leaderboards?.oneLovers} valueKey="total_ones" label="Ones" />
                                <LeaderboardSection title="Experience Kings" data={stats.leaderboards?.xpRankings} valueKey="experience" label="XP" />
                                <LeaderboardSection title="Most Active" data={stats.leaderboards?.mostActive} valueKey="games_played" label="Games" />
                            </div>
                        </div>
                    )}

                    {view === 'users' && (
                        <div className="flex flex-col gap-4 md:gap-6 animate-in fade-in duration-300">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Users</h2>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none w-full sm:w-64 shadow-md transition-all placeholder:text-slate-400 dark:placeholder:text-gray-600"
                                />
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
                                        <thead>
                                            <tr className="bg-slate-100 dark:bg-gray-900/80 border-b border-slate-200 dark:border-gray-700">
                                                <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-widest">User</th>
                                                <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-widest">Level / XP</th>
                                                <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-widest">Role</th>
                                                <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-widest">Win Rate</th>
                                                <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-widest">K/D (Agro)</th>
                                                <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-widest">Doubles %</th>
                                                <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-widest">Avg Luck</th>
                                                <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-slate-600 dark:text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-gray-700">
                                            {filteredUsers.map(u => (
                                                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors text-xs md:text-sm">
                                                    <td className="px-4 md:px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center font-black ${u.is_banned ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-300'}`}>
                                                                {u.username[0].toUpperCase()}
                                                            </div>
                                                            <span className={`font-black truncate max-w-[80px] md:max-w-none ${u.is_banned ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                                                                {u.username}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-yellow-600 dark:text-yellow-500">LVL {u.level || 1}</span>
                                                            <span className="text-[10px] font-bold text-slate-400">{u.experience || 0} XP</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-yellow-500/20 text-yellow-600' : 'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400'}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 font-bold text-slate-500 dark:text-gray-400">
                                                        {u.games_played > 0 ? ((u.games_won / u.games_played) * 100).toFixed(0) : 0}%
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 font-bold text-slate-500 dark:text-gray-400">
                                                        ⚔️ {u.pieces_lost > 0 ? (u.pieces_captured / u.pieces_lost).toFixed(2) : u.pieces_captured}
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 font-bold text-slate-500 dark:text-gray-400">
                                                        {u.total_dice_rolls > 0 ? ((u.total_doubles / u.total_dice_rolls) * 100).toFixed(1) : 0}%
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                                                        🎲 {u.total_dice_rolls > 0 ? (u.total_dice_sum / u.total_dice_rolls).toFixed(2) : '-'}
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-1 md:gap-2">
                                                            <button
                                                                onClick={() => setEditingUser(u)}
                                                                className="px-2 py-1 bg-slate-200 dark:bg-gray-700 rounded-lg text-[8px] md:text-[10px] font-black text-slate-700 dark:text-gray-300 uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-colors"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => onAction('ban', u.id, !u.is_banned)}
                                                                className={`px-2 py-1 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest ${u.is_banned ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                                                            >
                                                                {u.is_banned ? 'Yes' : 'Ban'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'rooms' && stats && (
                        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Active Rooms</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {stats.activeRooms.map((room: any) => (
                                    <div key={room.roomId} className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Room ID</p>
                                                <p className="text-base md:text-lg font-black text-green-600 dark:text-green-500 font-mono uppercase">{room.roomId}</p>
                                            </div>
                                            <span className="px-3 md:px-4 py-1 bg-slate-100 dark:bg-gray-900 rounded-full text-[9px] md:text-xs font-black text-slate-500 dark:text-gray-400 uppercase">
                                                {room.playerCount}/P
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {room.players.map((p: any) => (
                                                <div key={p.color} className="flex items-center gap-2 bg-slate-50 dark:bg-gray-900/50 px-2 py-1 rounded-xl">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                                    <span className="text-[10px] font-bold text-slate-700 dark:text-gray-300">{p.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => onAction('kick_room', room.roomId)}
                                            className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all"
                                        >
                                            Close Game
                                        </button>
                                    </div>
                                ))}
                                {stats.activeRooms.length === 0 && (
                                    <div className="md:col-span-2 py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest">No games found</div>
                                )}
                            </div>
                        </div>
                    )}
                    {view === 'config' && localSettings && (
                        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Global Configuration</h2>
                                <button
                                    onClick={() => {
                                        if (onSaveSettings) {
                                            onSaveSettings(localSettings);
                                            setSaveSuccess(true);
                                            setTimeout(() => setSaveSuccess(false), 2000);
                                        }
                                    }}
                                    className={`px-6 py-2 font-black rounded-xl uppercase tracking-widest text-xs transition-colors shadow-lg ${saveSuccess ? 'bg-green-600 text-white shadow-green-600/20' : 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20'}`}
                                >
                                    {saveSuccess ? 'Updated' : 'Save Changes'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">Gameplay</h3>

                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black uppercase text-slate-600 dark:text-gray-400">Time Bonus: Capture (seconds)</label>
                                            <input
                                                type="number"
                                                value={localSettings.game_bonus_capture}
                                                onChange={(e) => setLocalSettings({ ...localSettings, game_bonus_capture: parseInt(e.target.value) || 0 })}
                                                className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none shadow-sm"
                                            />
                                            <p className="text-[10px] text-slate-500 dark:text-gray-500 italic">Time added to the turn when a player captures a piece.</p>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black uppercase text-slate-600 dark:text-gray-400">Time Bonus: Goal (seconds)</label>
                                            <input
                                                type="number"
                                                value={localSettings.game_bonus_goal}
                                                onChange={(e) => setLocalSettings({ ...localSettings, game_bonus_goal: parseInt(e.target.value) || 0 })}
                                                className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none shadow-sm"
                                            />
                                            <p className="text-[10px] text-slate-500 dark:text-gray-500 italic">Time added to the turn when a player enters a piece into the goal.</p>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black uppercase text-slate-600 dark:text-gray-400">Base Turn Time (seconds)</label>
                                            <input
                                                type="number"
                                                value={localSettings.game_turn_timeout}
                                                onChange={(e) => setLocalSettings({ ...localSettings, game_turn_timeout: parseInt(e.target.value) || 0 })}
                                                className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none shadow-sm"
                                            />
                                            <p className="text-[10px] text-slate-500 dark:text-gray-500 italic">Standard turn duration.</p>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black uppercase text-slate-600 dark:text-gray-400">Time To Roll Dice (seconds)</label>
                                            <input
                                                type="number"
                                                value={localSettings.game_roll_timeout}
                                                onChange={(e) => setLocalSettings({ ...localSettings, game_roll_timeout: parseInt(e.target.value) || 0 })}
                                                className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none shadow-sm"
                                            />
                                            <p className="text-[10px] text-slate-500 dark:text-gray-500 italic">Time limit to roll the dice.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">Experience System (XP)</h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black uppercase text-slate-600 dark:text-gray-400">Participation XP</label>
                                            <input
                                                type="number"
                                                value={localSettings.xp_game_participation}
                                                onChange={(e) => setLocalSettings({ ...localSettings, xp_game_participation: parseInt(e.target.value) || 0 })}
                                                className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black uppercase text-slate-600 dark:text-gray-400">1st Place XP</label>
                                            <input
                                                type="number"
                                                value={localSettings.xp_rank_1}
                                                onChange={(e) => setLocalSettings({ ...localSettings, xp_rank_1: parseInt(e.target.value) || 0 })}
                                                className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black uppercase text-slate-600 dark:text-gray-400">2nd Place XP</label>
                                            <input
                                                type="number"
                                                value={localSettings.xp_rank_2}
                                                onChange={(e) => setLocalSettings({ ...localSettings, xp_rank_2: parseInt(e.target.value) || 0 })}
                                                className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black uppercase text-slate-600 dark:text-gray-400">3rd Place XP</label>
                                            <input
                                                type="number"
                                                value={localSettings.xp_rank_3}
                                                onChange={(e) => setLocalSettings({ ...localSettings, xp_rank_3: parseInt(e.target.value) || 0 })}
                                                className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black uppercase text-slate-600 dark:text-gray-400">Capture XP</label>
                                            <input
                                                type="number"
                                                value={localSettings.xp_piece_captured}
                                                onChange={(e) => setLocalSettings({ ...localSettings, xp_piece_captured: parseInt(e.target.value) || 0 })}
                                                className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black uppercase text-slate-600 dark:text-gray-400">Goal Piece XP</label>
                                            <input
                                                type="number"
                                                value={localSettings.xp_piece_goal}
                                                onChange={(e) => setLocalSettings({ ...localSettings, xp_piece_goal: parseInt(e.target.value) || 0 })}
                                                className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black uppercase text-slate-600 dark:text-gray-400">Clean Sheet XP</label>
                                            <input
                                                type="number"
                                                value={localSettings.xp_clean_sheet_win}
                                                onChange={(e) => setLocalSettings({ ...localSettings, xp_clean_sheet_win: parseInt(e.target.value) || 0 })}
                                                className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700 opacity-50 pointer-events-none">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">Maintenance (Coming Soon)</h3>
                                    <p className="text-sm text-slate-500">Server options, backups and global resets will be here.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Editing Modal - Enhanced */}
            {editingUser && (
                <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-slate-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50 shrink-0">
                            <h3 className="text-sm md:text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                Manage: <span className="text-yellow-600 dark:text-yellow-500">{editingUser.username}</span>
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-red-500 transition-colors p-2">✕</button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="p-6 md:p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar">

                            {/* Section 1: Identity */}
                            <div className="flex flex-col gap-4">
                                <h4 className="text-xs font-black uppercase text-slate-600 dark:text-gray-400 tracking-widest border-b border-slate-200 dark:border-gray-800 pb-2">Identity & Security</h4>

                                {/* Username Update */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-600 dark:text-gray-400 uppercase">Username</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            id="edit-username"
                                            defaultValue={editingUser.username}
                                            className="flex-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-sm font-bold text-slate-900 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={() => {
                                                const val = (document.getElementById('edit-username') as HTMLInputElement).value;
                                                if (val) onAction('edit_name', editingUser.id, val);
                                            }}
                                            className="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase"
                                        >
                                            Renaming
                                        </button>
                                    </div>
                                </div>

                                {/* Password Reset */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-600 dark:text-gray-400 uppercase">Reset Password</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            id="edit-password"
                                            placeholder="New password..."
                                            className="flex-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-sm font-bold text-slate-900 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-red-500"
                                        />
                                        <button
                                            onClick={() => {
                                                const val = (document.getElementById('edit-password') as HTMLInputElement).value;
                                                if (val && confirm(`Set password for ${editingUser.username}?`)) {
                                                    onAction('reset_password', editingUser.id, val);
                                                    (document.getElementById('edit-password') as HTMLInputElement).value = '';
                                                }
                                            }}
                                            className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Stats */}
                            <div className="flex flex-col gap-4">
                                <h4 className="text-xs font-black uppercase text-slate-600 dark:text-gray-400 tracking-widest border-b border-slate-200 dark:border-gray-800 pb-2">Game Statistics</h4>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {[
                                        { id: 'games_played', label: 'Games', val: editingUser.games_played },
                                        { id: 'games_won', label: 'Wins', val: editingUser.games_won },
                                        { id: 'pieces_captured', label: 'Captures', val: editingUser.pieces_captured },
                                        { id: 'pieces_lost', label: 'Lost', val: editingUser.pieces_lost },
                                        { id: 'total_dice_rolls', label: 'Rolls', val: editingUser.total_dice_rolls || 0 },
                                        { id: 'total_doubles', label: 'Doubles', val: editingUser.total_doubles || 0 },
                                        { id: 'total_dice_sum', label: 'Dice Sum', val: editingUser.total_dice_sum || 0 },
                                        { id: 'experience', label: 'Experience (XP)', val: editingUser.experience || 0 },
                                        { id: 'level', label: 'Level', val: editingUser.level || 1 },
                                    ].map((field) => (
                                        <div key={field.id} className="flex flex-col gap-1">
                                            <label className="text-[9px] font-black uppercase text-slate-600 dark:text-gray-500">{field.label}</label>
                                            <input
                                                type="number"
                                                id={`edit-${field.id}`}
                                                defaultValue={field.val}
                                                className="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-sm font-bold text-slate-900 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-yellow-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 md:p-6 border-t border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900/50 flex flex-col gap-2 shrink-0">
                            <button
                                onClick={() => {
                                    const stats: any = {};
                                    ['games_played', 'games_won', 'pieces_captured', 'pieces_lost', 'total_dice_rolls', 'total_doubles', 'total_dice_sum', 'experience', 'level'].forEach(key => {
                                        const el = document.getElementById(`edit-${key}`) as HTMLInputElement;
                                        if (el) stats[key] = parseInt(el.value) || 0;
                                    });
                                    onAction('edit_stats', editingUser.id, stats);
                                    setEditingUser(null);
                                }}
                                className="w-full py-3 md:py-4 bg-yellow-500 text-black font-black rounded-2xl uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform shadow-lg shadow-yellow-500/20"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('ARE YOU SURE? This will clear ALL statistics for this user.')) {
                                        onAction('reset_stats', editingUser.id);
                                        setEditingUser(null);
                                    }
                                }}
                                className="w-full py-2 text-red-500 font-black rounded-xl uppercase tracking-widest text-[10px] hover:bg-red-500/10 transition-colors"
                            >
                                Reset Stats to Zero
                            </button>
                            <button
                                onClick={() => {
                                    const confirmName = prompt(`To delete this user, type their username: ${editingUser.username}`);
                                    if (confirmName === editingUser.username) {
                                        onAction('delete_user', editingUser.id);
                                        setEditingUser(null);
                                    } else if (confirmName !== null) {
                                        alert('Incorrect name. Canceled.');
                                    }
                                }}
                                className="w-full py-2 bg-red-600 text-white font-black rounded-xl uppercase tracking-widest text-[10px] hover:bg-red-700 transition-colors mt-2"
                            >
                                🗑️ DELETE USER
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast removed */}
        </div>
    );
};
