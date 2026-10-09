import React, { useState, useEffect, useRef } from 'react';
import { Dice3D } from './Dice3D';
import type { GameState } from '@parchis/shared';

interface DiceAreaProps {
    gameState: GameState;
    isMyTurn: boolean;
    isSpectator: boolean;
    onRollDice: () => void;
    onDieClick: (index: number, value: number) => void;
    validDiceIndices: number[];
    onRollingChange: (rolling: boolean) => void;
    timeLeft: number;
    notification?: string | null;
    onRestartGame: () => void;
    // New props for mobile controls
    onPauseGame: () => void;
    onResumeGame: () => void;
    isHost: boolean;
    reservePlaceholder?: boolean;
}

export const DiceArea: React.FC<DiceAreaProps> = ({
    gameState,
    isMyTurn,
    onRollDice,
    onDieClick,
    validDiceIndices,
    onRollingChange,
    timeLeft,
    notification,
    onRestartGame,
    onPauseGame,
    onResumeGame,
    isHost,
    reservePlaceholder = false
}) => {
    const [isRolling, setIsRolling] = useState(false);
    const prevDiceRolled = useRef(gameState.diceRolled);

    // Notify parent about rolling state changes
    useEffect(() => {
        onRollingChange(isRolling || (gameState.diceRolled && !prevDiceRolled.current));
    }, [isRolling, gameState.diceRolled, onRollingChange]);

    // Effect to trigger rolling state when server says dice are rolled
    useEffect(() => {
        if (gameState.diceRolled && !prevDiceRolled.current) {
            prevDiceRolled.current = true;
            setIsRolling(true);

            const safety = setTimeout(() => setIsRolling(false), 2500);
            return () => clearTimeout(safety);
        } else if (!gameState.diceRolled) {
            setIsRolling(false);
            prevDiceRolled.current = false;
        }
    }, [gameState.diceRolled]);

    const handleSingleDieComplete = () => {
        // Heuristic: wait a bit for animations to settle
        setTimeout(() => setIsRolling(false), 500);
    };

    const isJustRolled = gameState.diceRolled && !prevDiceRolled.current;
    const isUIBlocked = isRolling || isJustRolled;

    // Color mapping for dynamic feedback
    const colorStyles = {
        red: {
            bg: 'bg-red-500/10',
            border: 'border-red-500/50',
            hover: 'hover:bg-red-500/20',
            shadow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
            hint: 'bg-red-500',
            header: 'from-red-600 to-red-500',
            text: 'text-red-500'
        },
        green: {
            bg: 'bg-green-500/10',
            border: 'border-green-500/50',
            hover: 'hover:bg-green-500/20',
            shadow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]',
            hint: 'bg-green-500',
            header: 'from-green-600 to-green-500',
            text: 'text-green-500'
        },
        blue: {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/50',
            hover: 'hover:bg-blue-500/20',
            shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
            hint: 'bg-blue-500',
            header: 'from-blue-600 to-blue-500',
            text: 'text-blue-500'
        },
        yellow: {
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/50',
            hover: 'hover:bg-yellow-500/20',
            shadow: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]',
            hint: 'bg-yellow-500',
            header: 'from-yellow-600 to-yellow-500',
            text: 'text-yellow-500'
        }
    };

    const currentStyles = colorStyles[gameState.currentTurn as keyof typeof colorStyles] || colorStyles.yellow;

    return (
        <div className="w-full">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-gray-700/50 shadow-xl transition-colors">
                {/* Status Header */}
                <div className={`px-4 py-2 lg:py-3 text-center font-black text-[10px] lg:text-xs uppercase tracking-widest transition-colors duration-300 rounded-t-2xl ${notification && !isUIBlocked
                    ? 'bg-red-500 text-white animate-pulse'
                    : isMyTurn
                        ? `bg-gradient-to-r ${currentStyles.header} text-white shadow-md`
                        : 'bg-slate-50 dark:bg-gray-800/80 text-slate-400 dark:text-gray-400'
                    }`}>
                    <div className="flex items-center justify-center gap-2">
                        {notification && !isUIBlocked ? (
                            <span className="flex-1 truncate">📢 {notification}</span>
                        ) : (
                            <span>
                                {gameState.status === 'waiting' ? (
                                    <span>⏳ Waiting to start...</span>
                                ) : isUIBlocked ? (
                                    <span className="animate-pulse">🎲 Rolling...</span>
                                ) : gameState.status === 'finished' && gameState.winner ? (
                                    <span>🏆 Victory {gameState.winner}!</span>
                                ) : gameState.pendingBonus && isMyTurn ? (
                                    <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded flex items-center gap-1 justify-center">
                                        ⚡ Bonus {gameState.pendingBonus.amount}
                                    </span>
                                ) : isMyTurn && gameState.consecutiveDoubles > 0 && !gameState.diceRolled ? (
                                    <span>🎲 Doubles! Roll again</span>
                                ) : (
                                    isMyTurn ? '🎯 Your Turn' : `⏳ ${gameState.currentTurn}'s Turn`
                                )}
                            </span>
                        )}

                        {gameState.status === 'playing' && (
                            <span className={`flex-shrink-0 ml-1 px-1.5 py-0.5 rounded text-[10px] bg-black/30 border border-white/20 shadow-sm ${timeLeft < 5 ? 'text-red-300 font-bold' : 'text-white'}`}>
                                {timeLeft}s
                            </span>
                        )}
                    </div>
                </div>

                <div className="p-3 lg:p-4 flex flex-col gap-3 lg:gap-4">
                    {gameState.status === 'waiting' ? (
                        <div className="p-2 text-center text-[10px] text-slate-400 dark:text-gray-500">
                            Waiting Room - Use the top panel to see details
                        </div>
                    ) : gameState.status === 'finished' && gameState.winner ? (
                        <button
                            onClick={onRestartGame}
                            className="w-full py-3 lg:py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all uppercase tracking-wider text-sm lg:text-base"
                        >
                            🔄 Restart
                        </button>
                    ) : (
                        <div className="flex flex-col items-center gap-2 w-full">
                            {/* Interactive Dice Container */}
                            <div
                                onClick={() => {
                                    if (isMyTurn && !gameState.diceRolled && !isUIBlocked && gameState.status !== 'paused') {
                                        onRollDice();
                                    }
                                }}
                                className={`relative w-full flex gap-3 lg:gap-4 justify-center items-center py-4 lg:py-6 rounded-2xl transition-all duration-300 select-none
                                        ${isMyTurn && !gameState.diceRolled && !isUIBlocked && gameState.status !== 'paused'
                                        ? `cursor-pointer ${currentStyles.bg} border-2 ${currentStyles.border} ${currentStyles.hover} ${currentStyles.shadow} active:scale-95 group`
                                        : 'bg-transparent border-2 border-transparent'
                                    }
                                    `}
                            >
                                {/* "Tap to Roll" Hint */}
                                {isMyTurn && !gameState.diceRolled && !isUIBlocked && gameState.status !== 'paused' && (
                                    <div className={`absolute -top-3 left-0 right-0 mx-auto w-fit max-w-[90%] ${currentStyles.hint} text-white text-[10px] lg:text-xs font-black px-3 py-1 rounded-full shadow-lg animate-bounce whitespace-nowrap z-10`}>
                                        TAP TO ROLL! 👇
                                    </div>
                                )}

                                {/* Render Dice (or placeholders if empty) */}
                                {(gameState.dice.length > 0 ? gameState.dice : [0, 0]).map((d, i) => (
                                    <div key={i} className={`transform transition-transform duration-300 ${isMyTurn && !gameState.diceRolled ? 'group-hover:scale-110' : ''}`}>
                                        {d !== 0 ? (
                                            <Dice3D
                                                value={d}
                                                // Prevent click propagation to Roll container if we are selecting a die to move
                                                onClick={(e) => {
                                                    if (gameState.diceRolled) {
                                                        e?.stopPropagation();
                                                        onDieClick(i, d);
                                                    }
                                                }}
                                                isValid={validDiceIndices.includes(i)}
                                                size="md"
                                                onRollComplete={handleSingleDieComplete}
                                            />
                                        ) : (
                                            // Ghost/Placeholder Die
                                            <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl bg-slate-200 dark:bg-gray-700/50 border-2 border-dashed border-slate-300 dark:border-gray-600 flex items-center justify-center">
                                                <span className="text-2xl opacity-20">🎲</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Host Controls (Pause) */}
                            {isHost && gameState.status !== 'finished' ? (
                                <button
                                    onClick={gameState.status === 'paused' ? onResumeGame : onPauseGame}
                                    className={`mt-1 px-4 py-2 flex items-center gap-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${gameState.status === 'paused'
                                        ? 'bg-green-500 text-white animate-pulse shadow-lg'
                                        : 'bg-slate-100 dark:bg-gray-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {gameState.status === 'paused' ? (
                                        <><span>▶</span> Resume</>
                                    ) : (
                                        <><span>⏸</span> Pause Game</>
                                    )}
                                </button>
                            ) : (reservePlaceholder && gameState.status !== 'finished') && (
                                /* Invisible Spacer to prevent layout shift on mobile when not Host */
                                <div className="mt-1 px-4 py-2 flex items-center gap-2 rounded-lg text-xs font-bold uppercase tracking-wider invisible pointer-events-none select-none">
                                    <span>⏸</span> Pause Game
                                </div>
                            )}
                        </div>
                    )}

                    {/* Doubles Counter */}
                    {gameState.consecutiveDoubles > 0 && !isUIBlocked && (
                        <div className="text-center text-[10px] lg:text-xs font-bold text-yellow-500 bg-yellow-500/10 py-1.5 lg:py-2 rounded-lg border border-yellow-500/20">
                            ⚡ Consecutive doubles: {gameState.consecutiveDoubles}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
