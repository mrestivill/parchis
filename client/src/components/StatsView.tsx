
import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis, // XAxis equivalent
    PolarRadiusAxis, // YAxis equivalent
    ResponsiveContainer
} from 'recharts';
import { Trophy, Skull, Zap, Target, Shield } from 'lucide-react';

interface StatsViewProps {
    stats: any;
    isLoading: boolean;
}

const METRIC_DESCRIPTIONS: Record<string, { title: string, desc: string, icon: string }> = {
    'Luck': {
        title: '🍀 Luck',
        icon: '🎲',
        desc: 'Measures how "lucky" you are with the dice.\n\n• Base: Compares your average rolls with the statistical mean (3.5).\n• Bonus: If you roll many doubles, your luck increases.\n• Interpretation: A high value means chance is on your side.'
    },
    'Malice': {
        title: '😈 Malice',
        icon: '⚔️',
        desc: 'Measures your level of aggressiveness.\n\n• Calculation: Frequency with which you capture enemy pieces in relation to your moves.\n• Interpretation: \n  - High: "Predator". You play to eat.\n  - Low: "Pacifist" or strategic player who prefers to run.'
    },
    'Efficiency': {
        title: '🎯 Efficiency (Win Rate)',
        icon: '📈',
        desc: 'It is simply your win percentage.\n\n• Calculation: (Games Won / Games Played) * 100.\n• Interpretation: How likely you are to win when you sit down to play.'
    },
    'Activity': {
        title: '⚡ Activity',
        icon: '🏃',
        desc: 'Measures your experience and consistency.\n\n• Calculation: Based on total games (normalized to 50 games for 100%).\n• Interpretation: A veteran will have this value at maximum.'
    },
    'Defense': {
        title: '🛡️ Defense (Clean Sheets)',
        icon: '🏰',
        desc: 'Measures your "untouchable" survival capability.\n\n• Calculation: Points are added every time you win a game without losing any pieces.'
    }
};

export const StatsView: React.FC<StatsViewProps> = ({ stats, isLoading }) => {
    const [explanation, setExplanation] = React.useState<string | null>(null);
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent" />
                <p className="text-slate-500 dark:text-gray-400 font-bold animate-pulse">Loading Stats...</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-4 text-center opacity-50">
                <Trophy className="w-16 h-16 text-slate-300 dark:text-gray-600 mb-2" />
                <p className="text-slate-500 dark:text-gray-400 font-bold text-lg">No stats available</p>
                <p className="text-sm text-slate-400 dark:text-gray-500">Play some games to generate data.</p>
            </div>
        );
    }

    // Transform Data for Radar Chart
    const data = [
        { subject: 'Luck', A: stats.luck, fullMark: 100 },
        { subject: 'Malice', A: stats.malice, fullMark: 100 },
        { subject: 'Efficiency', A: stats.winRate, fullMark: 100 },
        { subject: 'Activity', A: Math.min(100, (stats.gamesPlayed / 50) * 100), fullMark: 100 },
        { subject: 'Defense', A: Math.min(100, (stats.cleanSheets * 10)), fullMark: 100 }
    ];

    // Helper for rendering custom ticks (Icons)
    // Recharts custom tick is tricky with Typescript sometimes, using simple text for now or custom component

    return (
        <div className="flex flex-col gap-4 md:gap-6 w-full max-w-4xl mx-auto">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                <div className="bg-slate-50 dark:bg-gray-800 p-2 md:p-3 rounded-xl border border-slate-200 dark:border-gray-700 flex flex-col items-center">
                    <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 mb-1" />
                    <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{stats.gamesWon}</span>
                    <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400">Wins</span>
                </div>
                <div className="bg-slate-50 dark:bg-gray-800 p-2 md:p-3 rounded-xl border border-slate-200 dark:border-gray-700 flex flex-col items-center">
                    <Target className="w-4 h-4 md:w-5 md:h-5 text-red-500 mb-1" />
                    <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{stats.winRate}%</span>
                    <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400">Win Ratio</span>
                </div>
                <div className="bg-slate-50 dark:bg-gray-800 p-2 md:p-3 rounded-xl border border-slate-200 dark:border-gray-700 flex flex-col items-center">
                    <Zap className="w-4 h-4 md:w-5 md:h-5 text-purple-500 mb-1" />
                    <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{stats.totalDoubles}</span>
                    <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400">Total Doubles</span>
                </div>
                <div className="bg-slate-50 dark:bg-gray-800 p-2 md:p-3 rounded-xl border border-slate-200 dark:border-gray-700 flex flex-col items-center">
                    <Shield className="w-4 h-4 md:w-5 md:h-5 text-green-500 mb-1" />
                    <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{stats.cleanSheets}</span>
                    <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400">Undefeated</span>
                </div>
            </div>

            {/* Main Content: Chart + Nemesis */}
            <div className="flex flex-col md:flex-row gap-6">

                {/* Radar Chart */}
                <div className="flex-1 bg-white dark:bg-gray-800 p-2 md:p-4 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700 relative min-h-[300px]">
                    <h3 className="absolute top-4 left-6 text-xs md:text-sm font-black uppercase tracking-wider text-slate-400">Player Profile</h3>
                    <p className="absolute top-8 left-6 text-[9px] text-slate-300 dark:text-gray-500 font-bold uppercase">Click titles to see what they measure</p>

                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                            <PolarGrid stroke="#94a3b8" strokeOpacity={0.2} />
                            <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', cursor: 'pointer' }}
                                onClick={(data: any) => data && setExplanation(data.value)}
                            />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="Stats"
                                dataKey="A"
                                stroke="#eab308"
                                strokeWidth={3}
                                fill="#eab308"
                                fillOpacity={0.4}
                            />
                        </RadarChart>
                    </ResponsiveContainer>

                    {/* Explanation Overlay */}
                    {explanation && METRIC_DESCRIPTIONS[explanation] && (
                        <div
                            className="absolute inset-x-4 bottom-4 md:inset-4 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-4 md:p-6 rounded-2xl border border-yellow-500/30 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col gap-2 md:gap-3"
                            onClick={() => setExplanation(null)}
                        >
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-gray-800 pb-2">
                                <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="text-xl">{METRIC_DESCRIPTIONS[explanation].icon}</span>
                                    {METRIC_DESCRIPTIONS[explanation].title}
                                </h4>
                                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg p-1">✕</button>
                            </div>
                            <div className="text-xs md:text-sm text-slate-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                                {METRIC_DESCRIPTIONS[explanation].desc}
                            </div>
                            <div className="mt-auto pt-2 flex justify-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">(Tap to close)</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Nemesis & Victim Card */}
                <div className="flex md:flex-col gap-2 md:gap-3 flex-1">
                    {/* Nemesis */}
                    <div className="flex-1 bg-red-50 dark:bg-red-900/10 p-3 md:p-5 rounded-3xl border border-red-500/20 flex flex-col justify-center items-center text-center relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
                            <Skull size={100} className="text-red-500" />
                        </div>
                        <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2">Your Nemesis</p>
                        {stats.nemesis ? (
                            <>
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white capitalize">{stats.nemesis.name}</h4>
                                <p className="text-xs font-medium text-slate-500 dark:text-gray-400">Has eaten you <span className="text-red-500 font-bold">{stats.nemesis.count}</span> times</p>
                            </>
                        ) : (
                            <p className="text-sm font-medium text-slate-400 italic">No one has dominated you... yet.</p>
                        )}
                    </div>

                    {/* Victim */}
                    <div className="flex-1 bg-green-50 dark:bg-green-900/10 p-3 md:p-5 rounded-3xl border border-green-500/20 flex flex-col justify-center items-center text-center relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
                            <Target size={100} className="text-green-500" />
                        </div>
                        <p className="text-xs font-bold text-green-500 uppercase tracking-widest mb-2">Your Victim</p>
                        {stats.victim ? (
                            <>
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white capitalize">{stats.victim.name}</h4>
                                <p className="text-xs font-medium text-slate-500 dark:text-gray-400">You have eaten them <span className="text-green-500 font-bold">{stats.victim.count}</span> times</p>
                            </>
                        ) : (
                            <p className="text-sm font-medium text-slate-400 italic">You don't have a favorite victim yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
