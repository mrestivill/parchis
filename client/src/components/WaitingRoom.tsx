import React from 'react';
import { motion } from 'framer-motion';
import type { Player, PlayerColor, GameOptions } from '@parchis/shared';
import { getPlayerColorHex } from '../utils/colors';

interface WaitingRoomProps {
    players: Player[];
    currentUserId: string;
    onSelectColor: (color: PlayerColor) => void;
    onStartGame: () => void;
    isHost: boolean;
    gameOptions: GameOptions;
    roomId: string;
    onKickPlayer: (playerId: string) => void;
    onUpdateOptions: (options: Partial<GameOptions>) => void;
    onToggleAutoRoll: () => void;
    autoRollEnabled: boolean;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
    players,
    currentUserId,
    onSelectColor,
    onStartGame,
    isHost,
    gameOptions,
    roomId,
    onKickPlayer,
    onUpdateOptions,
    onToggleAutoRoll,
    autoRollEnabled
}) => {
    const COLORS_4 = ['blue', 'red', 'green', 'yellow'];
    const [showPlayerListModal, setShowPlayerListModal] = React.useState(false);
    const [confirmKickId, setConfirmKickId] = React.useState<string | null>(null);

    return (
        <div className="flex flex-col gap-3 lg:gap-6 w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 h-full justify-center lg:justify-start">
            {/* Header Info */}
            <div className="text-center space-y-1 lg:space-y-2 mt-4 lg:mt-0">
                <h2 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-[0.3em]">Waiting for Players</h2>
                <div className="flex items-center justify-center gap-2 lg:gap-3">
                    <span className="text-3xl lg:text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">{roomId}</span>
                    <button
                        onClick={() => setShowPlayerListModal(true)}
                        className="bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-green-500/20 flex items-center gap-1 active:scale-95 transition-transform hover:bg-green-500/20 cursor-pointer"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        {players.length} / 4
                        <span className="ml-1 text-[8px]">ℹ️</span>
                    </button>
                </div>
            </div>

            {/* Players List (Scrollable on mobile) */}
            <div className="flex-1 min-h-0 overflow-y-auto px-1 space-y-2 lg:space-y-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-gray-700">
                <div className="grid grid-cols-1 gap-2 lg:gap-3">
                    {players.map((p, idx) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white dark:bg-gray-800/50 backdrop-blur-sm p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-slate-200 dark:border-gray-700/50 flex items-center justify-between shadow-sm lg:shadow-xl relative overflow-hidden group"
                        >
                            {/* Kick Button (Hover/Touch) */}
                            {isHost && p.id !== currentUserId && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20">
                                    {confirmKickId === p.id ? (
                                        <div className="flex items-center gap-1 bg-white/90 backdrop-blur rounded-full p-1 shadow-lg border border-red-200 animate-in fade-in zoom-in duration-200">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onKickPlayer(p.id); setConfirmKickId(null); }}
                                                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold w-7 h-7 flex items-center justify-center transition-colors"
                                                title="Confirm"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setConfirmKickId(null); }}
                                                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full text-xs font-bold w-7 h-7 flex items-center justify-center transition-colors"
                                                title="Cancel"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setConfirmKickId(p.id); }}
                                            className="p-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full opacity-0 group-hover:opacity-100 lg:group-hover:opacity-100 transition-all active:scale-95"
                                            title="Kick Out"
                                        >
                                            👢
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-3 lg:gap-4 z-10">
                                <div
                                    className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center shadow-lg text-white font-bold text-xs lg:text-sm"
                                    style={{
                                        backgroundColor: p.color,
                                        boxShadow: `0 0 15px ${getPlayerColorHex(p.color)}40`
                                    }}
                                >
                                    {p.id === players[0].id ? '👑' : ''}
                                </div>
                                <div>
                                    <div className="text-xs lg:text-sm font-black text-slate-900 dark:text-white">
                                        {p.name} {p.id === currentUserId && '(You)'}
                                    </div>
                                    <div className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest" style={{ color: p.color }}>
                                        {p.color === 'yellow' ? 'Yellow' :
                                            p.color === 'red' ? 'Red' :
                                                p.color === 'blue' ? 'Blue' : 'Green'}
                                    </div>
                                </div>
                            </div>
                            <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${p.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'} z-10 mr-2`} />
                        </motion.div>
                    ))}

                    {/* Empty Slots */}
                    {Array.from({ length: 4 - players.length }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-slate-50/50 dark:bg-gray-900/20 border-2 border-dashed border-slate-200 dark:border-gray-800 rounded-xl lg:rounded-2xl p-3 lg:p-4 flex items-center justify-center">
                            <span className="text-[9px] lg:text-[10px] font-bold text-slate-300 dark:text-gray-700 uppercase tracking-widest">Waiting...</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal for Player List (triggered by counter) */}
            {showPlayerListModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowPlayerListModal(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50">
                            <h3 className="font-bold text-slate-900 dark:text-white">Connected Players</h3>
                            <button onClick={() => setShowPlayerListModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-2 max-h-[60vh] overflow-y-auto">
                            {players.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-gray-800 last:border-0 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: p.color }} />
                                        <div>
                                            <div className="font-bold text-sm dark:text-white">{p.name}</div>
                                            <div className="text-[10px] text-slate-400 uppercase">{p.color}</div>
                                        </div>
                                    </div>
                                    {isHost && p.id !== currentUserId && (
                                        <div className="flex items-center">
                                            {confirmKickId === p.id ? (
                                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                                                    <span className="text-[10px] font-bold text-red-500 uppercase">Sure?</span>
                                                    <button
                                                        onClick={() => { onKickPlayer(p.id); setConfirmKickId(null); }}
                                                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-bold"
                                                    >
                                                        Yes
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmKickId(null)}
                                                        className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-xs hover:bg-slate-300 font-bold"
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmKickId(p.id)}
                                                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                                                >
                                                    👢 Kick Out
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Controls Section */}
            <div className="mt-auto space-y-3 lg:space-y-6 pb-4">
                {/* Color Selection */}
                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-slate-200 dark:border-gray-700/50 shadow-lg lg:shadow-2xl space-y-4">
                    <div className="space-y-3 lg:space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] lg:text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Change Color</h3>
                            <span className="text-[9px] lg:text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">Optional</span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                            {COLORS_4.map((color) => {
                                const isTaken = players.some(p => p.color === color && p.id !== currentUserId);
                                const isCurrent = players.find(p => p.id === currentUserId)?.color === color;

                                return (
                                    <button
                                        key={color}
                                        onClick={() => !isTaken && onSelectColor(color as PlayerColor)}
                                        disabled={isTaken}
                                        className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full border-4 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center ${isCurrent ? 'border-white dark:border-gray-800 ring-4 ring-yellow-400 scale-110 z-10' : 'border-transparent shadow-lg'
                                            } ${isTaken ? 'opacity-20 cursor-not-allowed grayscale' : 'cursor-pointer hover:shadow-xl'}`}
                                        style={{ backgroundColor: color }}
                                    >
                                        {isCurrent && <span className="text-white text-lg lg:text-xl drop-shadow-md">✓</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Options Summary */}
                    <div className="pt-3 lg:pt-4 border-t border-slate-100 dark:border-gray-700/50 grid grid-cols-3 gap-2 lg:gap-4">
                        <div
                            onClick={() => isHost && onUpdateOptions({ allowSpectators: !gameOptions.allowSpectators })}
                            className={`flex flex-col gap-0.5 lg:gap-1 p-2 rounded-lg transition-colors ${isHost ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700/50 active:scale-95' : ''}`}
                        >
                            <div className="flex items-center gap-1 justify-center">
                                <span className="text-[7px] lg:text-[8px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Spectators</span>
                                {isHost && <span className="text-[8px] opacity-50">✏️</span>}
                            </div>
                            <span className={`text-[9px] lg:text-[10px] font-black uppercase text-center ${gameOptions.allowSpectators ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                {gameOptions.allowSpectators ? 'Allowed' : 'Private'}
                            </span>
                        </div>
                        <div
                            onClick={() => isHost && onUpdateOptions({ allowLateJoin: !gameOptions.allowLateJoin })}
                            className={`flex flex-col gap-0.5 lg:gap-1 p-2 rounded-lg transition-colors ${isHost ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700/50 active:scale-95' : ''}`}
                        >
                            <div className="flex items-center gap-1 justify-center">
                                <span className="text-[7px] lg:text-[8px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Late Join</span>
                                {isHost && <span className="text-[8px] opacity-50">✏️</span>}
                            </div>
                            <span className={`text-[9px] lg:text-[10px] font-black uppercase text-center ${gameOptions.allowLateJoin ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                {gameOptions.allowLateJoin ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div
                            onClick={onToggleAutoRoll}
                            className="flex flex-col gap-0.5 lg:gap-1 p-2 rounded-lg transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700/50 active:scale-95"
                        >
                            <div className="flex items-center gap-1 justify-center">
                                <span className="text-[7px] lg:text-[8px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">Auto-Roll</span>
                                <span className="text-[8px] opacity-50">🎲</span>
                            </div>
                            <span className={`text-[9px] lg:text-[10px] font-black uppercase text-center ${autoRollEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                                {autoRollEnabled ? 'ON' : 'OFF'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Start Game Button */}
                <div>
                    {isHost ? (
                        <button
                            onClick={onStartGame}
                            className="w-full py-4 lg:py-5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black rounded-xl lg:rounded-2xl shadow-xl shadow-green-500/20 transform active:scale-95 transition-all uppercase tracking-[0.2em] animate-pulse border-b-4 border-green-700 hover:border-green-600 text-sm lg:text-base"
                        >
                            🎮 Start Game
                        </button>
                    ) : (
                        <div className="text-center p-4 lg:p-5 bg-slate-50 dark:bg-gray-800/30 rounded-xl lg:rounded-2xl border border-slate-200 dark:border-gray-700/30 flex flex-col gap-1">
                            <div className="text-[10px] lg:text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Waiting for Host</div>
                            <div className="text-[10px] text-slate-400 dark:text-gray-500 italic">The game will start soon...</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
