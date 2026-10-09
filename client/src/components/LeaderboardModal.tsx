
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    leaderboards: any;
    isLoading: boolean;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, leaderboards, isLoading }) => {
    if (!isOpen) return null;

    const LeaderboardSection = ({ title, data, valueKey, label, icon }: any) => (
        <div className="bg-slate-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-700">
            <h3 className="text-xs font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight flex items-center gap-2">
                <span>{icon}</span> {title}
            </h3>
            <div className="flex flex-col gap-2">
                {data?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-white dark:bg-gray-900 rounded-xl border border-slate-100 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-100 text-slate-500'}`}>
                                {idx + 1}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-slate-800 dark:text-gray-200 truncate max-w-[80px] sm:max-w-[120px]">{item.username}</span>
                                {item.level && <span className="text-[8px] font-black text-yellow-600 uppercase tracking-widest">Level {item.level}</span>}
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-lg shrink-0">
                            {item[valueKey]} {label}
                        </span>
                    </div>
                ))}
                {(!data || data.length === 0) && (
                    <p className="text-[10px] text-slate-400 text-center py-2 italic">No data recorded</p>
                )}
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-4 md:p-6 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-yellow-500 text-black p-2 rounded-xl text-xl">🏆</div>
                            <div>
                                <h2 className="text-base md:text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Leaderboard</h2>
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Global Rankings</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400 animate-pulse">
                                <div className="text-4xl">🎲</div>
                                <p className="text-xs font-black uppercase tracking-widest">Loading stats...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                <LeaderboardSection
                                    title="Top Wins"
                                    icon="👑"
                                    data={leaderboards?.topWins}
                                    valueKey="games_won"
                                    label="Wins"
                                />
                                <LeaderboardSection
                                    title="Top Captures"
                                    icon="⚔️"
                                    data={leaderboards?.topCapturers}
                                    valueKey="total_captured"
                                    label="Pieces"
                                />
                                <LeaderboardSection
                                    title="Most Defeats"
                                    icon="💀"
                                    data={leaderboards?.mostVictims}
                                    valueKey="total_lost"
                                    label="Deaths"
                                />
                                <LeaderboardSection
                                    title="Doubles Kings"
                                    icon="🎲"
                                    data={leaderboards?.doubleKings}
                                    valueKey="total_doubles"
                                    label="Doubles"
                                />
                                <LeaderboardSection
                                    title="Bad Luck (Ones)"
                                    icon="📉"
                                    data={leaderboards?.oneLovers}
                                    valueKey="total_ones"
                                    label="Ones"
                                />
                                <LeaderboardSection
                                    title="Most Active"
                                    icon="🔥"
                                    data={leaderboards?.mostActive}
                                    valueKey="games_played"
                                    label="Games"
                                />
                                <LeaderboardSection
                                    title="Experience Kings"
                                    icon="✨"
                                    data={leaderboards?.xpRankings}
                                    valueKey="experience"
                                    label="XP"
                                />
                            </div>
                        )}

                        <div className="mt-8 text-center">
                            <p className="text-[10px] text-slate-400 dark:text-gray-600 uppercase tracking-widest font-bold">
                                * Stats are updated in real-time at the end of each game
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
