import React from 'react';
import { motion } from 'framer-motion';
import { DiceArea } from './DiceArea';
import type { PlayerColor, GameState } from '@parchis/shared';

interface PlayerSidebarProps {
    gameState: GameState;
    playerColor: PlayerColor | null;
    isHost: boolean;
    isSpectator: boolean;
    timeLeft: number;
    notification?: string | null;
    isMyTurn: boolean;
    onSetPlayerToKickId: (id: string | null) => void;
    onRollDice: () => void;
    onDieClick?: (index: number, value: number) => void;
    validDiceIndices?: number[];
    onRollingChange: (rolling: boolean) => void;
    onRestartGame: () => void;
    onPauseGame: () => void;
    onResumeGame: () => void;
    onLeaveRoom: () => void;
    onVoteRestart: () => void;
    onShowSettings: () => void;
    onCopyCode: () => void;
    copied: boolean;
}

export const PlayerSidebar: React.FC<PlayerSidebarProps> = ({
    gameState,
    playerColor,
    isHost,
    isSpectator,
    timeLeft,
    notification,
    isMyTurn,
    onSetPlayerToKickId,
    onRollDice,
    onDieClick,
    validDiceIndices = [],
    onRollingChange,
    onRestartGame,
    onPauseGame,
    onResumeGame,
    onLeaveRoom,
    onShowSettings,
    onCopyCode,
    copied
}) => {
    return (
        <div className="hidden xl:flex absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-950 p-4 flex-col gap-3 border-r border-slate-200 dark:border-gray-800/50 z-30 shadow-2xl transition-colors duration-300">
            {/* Header with Room ID */}
            <div
                onClick={onCopyCode}
                className="bg-slate-50 dark:bg-gray-800/50 backdrop-blur-sm p-2 rounded-xl border border-slate-200 dark:border-gray-700/50 shadow-lg flex items-center justify-between gap-2 active:scale-95 transition-all cursor-pointer"
            >
                <div className="flex flex-col">
                    <h2 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-0.5">Room</h2>
                    <code className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase">
                        {gameState.roomId}
                    </code>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-gray-500 bg-slate-100 dark:bg-gray-900/50 px-2 py-1 rounded-lg border border-slate-200 dark:border-gray-700/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        {gameState.players.filter(p => p.isConnected).length}/{gameState.players.length}
                    </div>
                    <button
                        onClick={onCopyCode}
                        className={`p-1.5 transition-all active:scale-95 rounded-lg border flex items-center gap-1 ${copied
                            ? 'bg-green-100 dark:bg-green-500/20 border-green-500/50 text-green-600 dark:text-green-400'
                            : 'bg-slate-100 dark:bg-gray-700/50 hover:bg-slate-200 dark:hover:bg-gray-600/50 border-slate-300 dark:border-gray-600/30 text-slate-600 dark:text-gray-300'
                            }`}
                        title="Copy ID"
                    >
                        {copied ? '✅' : '📋'}
                        {copied && <span className="text-[10px] font-bold">COPIED</span>}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onShowSettings(); }}
                        className="p-1.5 bg-slate-100 dark:bg-gray-700/50 hover:bg-slate-200 dark:hover:bg-gray-600/50 rounded-lg border border-slate-300 dark:border-gray-600/30 transition-all active:scale-95 text-slate-600 dark:text-gray-300"
                        title="Settings"
                    >
                        ⚙️
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-gray-800">
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 px-1">
                    <span className="w-1 h-3 bg-yellow-500 rounded-full" />
                    Players
                </h3>
                <div className="flex flex-col gap-3">
                    {gameState.players.map((p, idx) => {
                        const piecesInGoal = p.pieces.filter(pc => pc.status === 'goal').length;
                        const piecesInNest = p.pieces.filter(pc => pc.status === 'nest').length;

                        return (
                            <div
                                key={p.color}
                                className="relative rounded-xl transition-colors bg-white/50 dark:bg-gray-800/30 border border-slate-200 dark:border-gray-700/30 hover:bg-white dark:hover:bg-gray-800/40 shadow-sm"
                            >
                                {p.color === gameState.currentTurn && (
                                    <motion.div
                                        layoutId="active-turn-indicator"
                                        className="absolute inset-0 rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-gray-800/80 dark:to-gray-900/80 border border-yellow-500/50 ring-1 ring-yellow-500/20 shadow-lg shadow-yellow-500/10"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-yellow-500/5 animate-pulse rounded-xl" />
                                    </motion.div>
                                )}

                                <div className="relative p-4 flex flex-col gap-3 z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
                                                style={{
                                                    backgroundColor: p.color,
                                                    boxShadow: `0 0 15px ${p.color}40`
                                                }}
                                            >
                                                {idx === 0 && <span className="text-base">👑</span>}
                                            </div>
                                            <div>
                                                <div className={`text-sm font-bold leading-tight ${p.color === gameState.currentTurn ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-gray-300'}`}>
                                                    {p.name} {p.color === playerColor && '(You)'}
                                                </div>
                                                <div className="flex mt-0.5">
                                                    <span
                                                        className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow-sm font-sans"
                                                        style={{
                                                            color: 'white',
                                                            backgroundColor: p.color === 'yellow' ? '#d4a017' : p.color,
                                                        }}
                                                    >
                                                        {p.color === 'red' ? 'Red' :
                                                            p.color === 'blue' ? 'Blue' :
                                                                p.color === 'green' ? 'Green' :
                                                                    p.color === 'yellow' ? 'Yellow' :
                                                                        p.color === 'purple' ? 'Purple' :
                                                                            p.color === 'orange' ? 'Orange' : p.color}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {isHost && idx !== 0 && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onSetPlayerToKickId(p.id); }}
                                                    className="text-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer filter drop-shadow-md"
                                                    title="Kick Player"
                                                >
                                                    👢
                                                </button>
                                            )}
                                            <div className={`w-3 h-3 rounded-full border-2 border-gray-900 ${p.isConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 text-[10px]">
                                        <div className="flex-1 bg-slate-50 dark:bg-gray-900/50 rounded-lg px-2 py-1 border border-slate-200 dark:border-gray-700/30 flex justify-between items-center">
                                            <span className="text-slate-400 dark:text-gray-500 uppercase tracking-wider font-bold">Goal</span>
                                            <span className="text-slate-900 dark:text-white font-black">🏁 {piecesInGoal}/4</span>
                                        </div>
                                        <div className="flex-1 bg-slate-50 dark:bg-gray-900/50 rounded-lg px-2 py-1 border border-slate-200 dark:border-gray-700/30 flex justify-between items-center">
                                            <span className="text-slate-400 dark:text-gray-500 uppercase tracking-wider font-bold">Nest</span>
                                            <span className="text-slate-900 dark:text-white font-black">🏠 {piecesInNest}/4</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Spectators List */}
                {gameState.spectators && gameState.spectators.length > 0 && (
                    <div className="mt-8 px-1">
                        <h3 className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1 h-3 bg-blue-500 rounded-full" />
                            Spectators ({gameState.spectators.length})
                        </h3>
                        <div className="flex flex-col gap-2">
                            {gameState.spectators.map((s) => (
                                <div
                                    key={s.id}
                                    className="flex items-center justify-between bg-white/30 dark:bg-gray-800/20 px-3 py-2 rounded-lg border border-slate-200/50 dark:border-gray-700/20"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-xs">👁️</span>
                                        <span className="text-xs font-bold text-slate-600 dark:text-gray-300 truncate">
                                            {s.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isHost && (
                                            <button
                                                onClick={() => onSetPlayerToKickId(s.id)}
                                                className="text-xs hover:scale-110 active:scale-95 transition-transform cursor-pointer filter hover:brightness-125"
                                                title="Kick Spectator"
                                            >
                                                👢
                                            </button>
                                        )}
                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.isConnected ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Control Panel / Dice Area */}
            <div className="mt-auto">
                <div className="lg:block w-full">
                    <DiceArea
                        gameState={gameState}
                        isMyTurn={isMyTurn}
                        isSpectator={isSpectator}
                        onRollDice={onRollDice}
                        onDieClick={onDieClick!}
                        validDiceIndices={validDiceIndices}
                        onRollingChange={onRollingChange}
                        timeLeft={timeLeft}
                        notification={notification}
                        onRestartGame={onRestartGame}
                        isHost={isHost}
                        onPauseGame={onPauseGame}
                        onResumeGame={onResumeGame}
                    />
                </div>
            </div>

            {/* Desktop Footer (Inside Sidebar) */}
            <div className="mt-auto pt-4 flex flex-col gap-1 text-[10px] text-slate-400 dark:text-gray-500 font-mono text-center border-t border-slate-200 dark:border-gray-800/50">
                <span className="font-bold uppercase tracking-widest">v{/* @ts-ignore */ __APP_VERSION__}</span>
                <button
                    onClick={onLeaveRoom}
                    className="text-red-500 hover:text-red-400 font-bold uppercase tracking-wider transition-colors mt-2"
                >
                    Leave
                </button>
            </div>
        </div>
    );
};
