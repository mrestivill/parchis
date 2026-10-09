import React from 'react';
import type { GameState, PlayerColor } from '@parchis/shared';
import { SettingsModal } from '../SettingsModal';
import { StartingPlayerAnimation } from '../StartingPlayerAnimation';

interface GameModalsProps {
    gameState: GameState;
    playerColor: PlayerColor | null;
    isHost: boolean;

    // Settings Modal
    showSettings: boolean;
    setShowSettings: (show: boolean) => void;
    settings: any;
    setThemeName: (name: string) => void;
    setVolume: (type: 'master' | 'sfx' | 'music', vol: number) => void;
    setGameOption: (key: any, val: any) => void;
    onUpdateOptions?: (options: any) => void;

    // Kick Modal
    playerToKickId: string | null;
    setPlayerToKickId: (id: string | null) => void;
    onKickPlayer: (id: string) => void;

    // Abandon Modal
    showAbandonConfirm: boolean;
    setShowAbandonConfirm: (show: boolean) => void;
    onLeaveRoom: () => void;

    // Player Details Modal
    selectedPlayerForDetails: string | null;
    setSelectedPlayerForDetails: (id: string | null) => void;

    // Game Control
    onRestartGame: () => void;
    onVoteRestart: () => void;
    onResumeGame: () => void;

    // Starting Animation
    startingSelection?: { color: PlayerColor; playerName: string } | null;
    clearStartingSelection: () => void;
}

export const GameModals: React.FC<GameModalsProps> = ({
    gameState,
    playerColor,
    isHost,
    showSettings,
    setShowSettings,
    settings,
    setThemeName,
    setVolume,
    setGameOption,
    onUpdateOptions,
    playerToKickId,
    setPlayerToKickId,
    onKickPlayer,
    showAbandonConfirm,
    setShowAbandonConfirm,
    onLeaveRoom,
    selectedPlayerForDetails,
    setSelectedPlayerForDetails,
    onRestartGame,
    onVoteRestart,
    onResumeGame,
    startingSelection,
    clearStartingSelection
}) => {
    return (
        <>
            {/* Starting Player Animation */}
            {startingSelection && (
                <StartingPlayerAnimation
                    winnerColor={startingSelection.color}
                    winnerName={startingSelection.playerName}
                    onComplete={() => clearStartingSelection()}
                    myColor={playerColor}
                />
            )}

            {/* Settings Modal */}
            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                currentThemeName={settings.themeName}
                onSetTheme={setThemeName}
                volume={settings.volume}
                onSetVolume={setVolume}
                gameOptions={settings.game}
                onSetGameOption={setGameOption}
                isHost={isHost}
                spectatorOptions={gameState.options}
                onUpdateSpectatorOptions={onUpdateOptions}
            />

            {/* Confirm Kick Modal */}
            {playerToKickId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Kick Player?</h3>
                        <p className="text-slate-500 dark:text-gray-400 mb-6 text-sm">Are you sure you want to kick this player from the room?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setPlayerToKickId(null)} className="flex-1 py-3 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 rounded-xl font-bold text-slate-600 dark:text-gray-300 transition-colors">Cancel</button>
                            <button onClick={() => { onKickPlayer(playerToKickId); setPlayerToKickId(null); }} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white shadow-lg transition-colors">Kick Out</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Abandon Modal */}
            {showAbandonConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Leave Game?</h3>
                        <p className="text-slate-500 dark:text-gray-400 mb-6 text-sm">If you leave now you will lose your current progress.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowAbandonConfirm(false)} className="flex-1 py-3 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 rounded-xl font-bold text-slate-600 dark:text-gray-300 transition-colors">Cancel</button>
                            <button onClick={onLeaveRoom} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white shadow-lg transition-colors">Leave</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Player Details Modal (Mobile) */}
            {selectedPlayerForDetails && (() => {
                const p = gameState.players.find(pl => pl.id === selectedPlayerForDetails);
                if (!p) return null;
                const canKick = isHost && p.id !== gameState.players[0].id;
                return (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setSelectedPlayerForDetails(null)}>
                        <div className="bg-white dark:bg-gray-800 border-2 border-slate-200 dark:border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setSelectedPlayerForDetails(null)} className="absolute top-4 right-4 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-white">✕</button>
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg text-4xl" style={{ backgroundColor: p.color, boxShadow: `0 0 30px ${p.color}60` }}>{gameState.players[0].id === p.id && '👑'}</div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{p.name}</h3>
                                    <p className="text-sm text-slate-400 dark:text-gray-400 uppercase tracking-widest">{p.color}</p>
                                </div>
                                <div className="flex gap-4 w-full">
                                    <div className="flex-1 bg-slate-50 dark:bg-gray-900/50 rounded-xl p-3 border border-slate-200 dark:border-gray-700/50 text-center">
                                        <div className="text-xs text-slate-400 dark:text-gray-500 uppercase tracking-wider">Goal</div>
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white">🏁 {p.pieces.filter(pc => pc.status === 'goal').length}/4</div>
                                    </div>
                                    <div className="flex-1 bg-slate-50 dark:bg-gray-900/50 rounded-xl p-3 border border-slate-200 dark:border-gray-700/50 text-center">
                                        <div className="text-xs text-slate-400 dark:text-gray-500 uppercase tracking-wider">Home</div>
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white">🏠 {p.pieces.filter(pc => pc.status === 'nest').length}/4</div>
                                    </div>
                                </div>
                                {canKick && <button onClick={() => { setPlayerToKickId(p.id); setSelectedPlayerForDetails(null); }} className="w-full mt-2 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg transition-all uppercase tracking-wider">👢 Kick Out Player</button>}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Winner Modal */}
            {gameState.status === 'finished' && gameState.winner && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-800 border-2 border-yellow-500 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl transition-colors">
                        <div className="mb-6"><span className="text-6xl">👑</span></div>
                        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">VICTORY!</h2>
                        <div className="text-xl text-slate-600 dark:text-gray-300 mb-8">The winner is <span className="font-bold uppercase" style={{ color: gameState.winner }}>{gameState.winner}</span></div>
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-3">
                                {isHost ? (
                                    <button
                                        onClick={onRestartGame}
                                        className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-xl font-bold text-black text-xl shadow-lg hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
                                    >
                                        RESTART GAME
                                    </button>
                                ) : (
                                    (() => {
                                        const myPlayer = gameState.players.find(p => p.color === playerColor);
                                        const hasVoted = myPlayer && gameState.restartVotes?.includes(myPlayer.id);
                                        const votesNeeded = Math.ceil(gameState.players.length / 2);
                                        const currentVotes = gameState.restartVotes?.length || 0;

                                        return (
                                            <>
                                                <button
                                                    onClick={onVoteRestart}
                                                    disabled={!!hasVoted}
                                                    className={`w-full py-4 rounded-xl font-bold text-xl shadow-lg transition-all uppercase tracking-wider ${hasVoted
                                                        ? 'bg-gray-400 cursor-not-allowed text-gray-800'
                                                        : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:scale-105 active:scale-95'
                                                        }`}
                                                >
                                                    {hasVoted ? '✓ VOTE REGISTERED' : 'VOTE RESTART'}
                                                </button>
                                                <div className="text-sm text-slate-600 dark:text-gray-400 text-center font-medium">
                                                    Votes: {currentVotes}/{votesNeeded} needed
                                                </div>
                                            </>
                                        );
                                    })()
                                )}</div>
                            <button onClick={onLeaveRoom} className="w-full py-4 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 rounded-xl font-bold text-slate-600 dark:text-gray-300 text-lg transition-all uppercase tracking-wider">LEAVE THE ROOM</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Paused Overlay */}
            {gameState.status === 'paused' && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 border-2 border-orange-500 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 animate-pulse"></div>
                        <div className="text-6xl mb-4 animate-bounce">⏸️</div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Game Paused</h2>
                        <p className="text-slate-600 dark:text-gray-300 mb-6 font-medium">
                            The host has paused the game.
                            <br />
                            <span className="text-xs opacity-70">Waiting for resume...</span>
                        </p>

                        {isHost && (
                            <button
                                onClick={onResumeGame}
                                className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black rounded-xl shadow-lg transform active:scale-95 transition-all uppercase tracking-wider animate-pulse"
                            >
                                ▶️ Resume Game
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
