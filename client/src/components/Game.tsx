import React from 'react';
import type { GameState, PlayerColor, Piece, GameLogEntry } from '@parchis/shared';
import { motion } from 'framer-motion';
import { GameBoard } from './GameBoard';
import { PlayerSidebar } from './PlayerSidebar';
import { DiceArea } from './DiceArea';
import { GameChat } from './GameChat';
import { GameModals } from './modals/GameModals';
import { useGameLogic } from './useGameLogic';
import { EmotePicker } from './EmotePicker';
import { getRotationForPlayer, getVisualPosition } from './boardUtils';
import { useBoardFX } from '../hooks/useBoardFX';
import { getPlayerColorHex, getPlayerColorRGBA } from '../utils/colors';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { WaitingRoom } from './WaitingRoom';
import { useSettings } from '../hooks/useSettings';


interface GameProps {
    gameState: GameState | null;
    playerColor: PlayerColor | null;
    isSpectator?: boolean;
    onRollDice: () => void;
    onMovePiece: (pieceIndex: number, dieValue: number) => void;
    onRestartGame: () => void;
    onStartGame: () => void;
    onUpdateOptions?: (options: Partial<import('@parchis/shared').GameOptions>) => void;
    onKickPlayer: (playerToKickId: string) => void;
    onPauseGame: () => void;
    onResumeGame: () => void;
    onLeaveRoom: () => void;
    messages: any[]; // ChatMessage[]
    gameLog: GameLogEntry[];
    onSendMessage: (text: string) => void;
    notification?: string | null;
    activeEmotes: { userId: string, emoteId: string, timestamp: number }[];
    onSendEmote: (emoteId: string) => void;
    startingSelection?: { color: PlayerColor; playerName: string } | null;
    clearStartingSelection: () => void;
    isHost: boolean;
    onVoteRestart: () => void;
    onSelectColor: (color: PlayerColor) => void;
}


export const Game: React.FC<GameProps> = ({ gameState, playerColor, isSpectator, onRollDice, onMovePiece, onRestartGame, onStartGame, onUpdateOptions, onKickPlayer, onPauseGame, onResumeGame, onLeaveRoom, messages, gameLog, onSendMessage, notification, activeEmotes, onSendEmote, startingSelection, clearStartingSelection, isHost, onVoteRestart, onSelectColor }) => {
    const boardRotation = React.useMemo(() => getRotationForPlayer(playerColor), [playerColor]);

    const { currentTheme, setThemeName, setVolume, setGameOption, settings } = useSettings();

    const [isUIBlocked, setIsUIBlocked] = React.useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
    const [copied, setCopied] = React.useState(false);
    const [showEmotePicker, setShowEmotePicker] = React.useState(false);
    const [showSettings, setShowSettings] = React.useState(false);
    const [playerToKickId, setPlayerToKickId] = React.useState<string | null>(null);
    const [showAbandonConfirm, setShowAbandonConfirm] = React.useState(false);
    const [selectedPlayerForDetails, setSelectedPlayerForDetails] = React.useState<string | null>(null);
    const [confirmKickInGame, setConfirmKickInGame] = React.useState(false);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const lastMessagesCount = React.useRef(messages.length);

    // Track unread messages when sidebar is closed
    React.useEffect(() => {
        if (!isSidebarOpen && messages.length > lastMessagesCount.current) {
            setUnreadCount(prev => prev + (messages.length - lastMessagesCount.current));
        }
        lastMessagesCount.current = messages.length;
    }, [messages, isSidebarOpen]);

    // Reset unread count when opening sidebar
    React.useEffect(() => {
        if (isSidebarOpen) {
            setUnreadCount(0);
        }
    }, [isSidebarOpen]);

    const {
        selectedPieceId,
        timeLeft,
        isMyTurn,
        movablePieceIndices,
        validDiceIndices,
        handlePieceClick,
        handleDieClick,
        clearSelection
    } = useGameLogic({
        gameState,
        playerColor,
        isSpectator: !!isSpectator,
        settings,
        notification: notification || null,
        startingSelection,
        onRollDice,
        onMovePiece,
        isUIBlocked
    });

    const handleBoardPieceClick = React.useCallback((piece: Piece, _dieValue: number) => {
        handlePieceClick(piece);
    }, [handlePieceClick]);

    const handleCopyCode = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const code = (gameState?.roomId || '').toUpperCase();

        const onSuccess = () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };

        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(onSuccess).catch(() => {
                // Fallback if clipboard API rejects (e.g. permissions)
                fallbackCopy(code, onSuccess);
            });
        } else {
            // Fallback for insecure contexts (HTTP)
            fallbackCopy(code, onSuccess);
        }
    };

    const fallbackCopy = (text: string, onSuccess: () => void) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            onSuccess();
        } catch (_) { /* noop */ }
        document.body.removeChild(textarea);
    };

    const boardRef = React.useRef<HTMLDivElement>(null);
    useBoardFX({ gameState, boardRotation, playerColor, boardRef });

    if (!gameState) return (
        <div className="h-screen w-screen bg-slate-100 dark:bg-gray-950 flex items-center justify-center text-slate-400">
            <div className="animate-pulse font-mono tracking-widest uppercase">Connecting to room...</div>
        </div>
    );

    return (
        <div className="relative h-full w-full min-h-[calc(100vh-env(safe-area-inset-top))] bg-slate-100 dark:bg-gray-950 text-slate-900 dark:text-white overflow-hidden transition-colors duration-300" onClick={clearSelection}>
            {/* Pulsing Turn Indicator Border */}
            {isMyTurn && playerColor && !gameState.diceRolled && (
                <motion.div
                    className="fixed inset-0 pointer-events-none z-50"
                    style={{
                        border: `6px solid ${getPlayerColorHex(playerColor)}`,
                        boxShadow: `inset 0 0 40px ${getPlayerColorRGBA(playerColor, 0.6)}, 0 0 40px ${getPlayerColorRGBA(playerColor, 0.4)}`
                    }}
                    animate={{
                        opacity: [0.4, 1, 0.4],
                        scale: [0.99, 1, 0.99]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            )}

            {/* Desktop Sidebar (Left - Game Info) */}
            <PlayerSidebar
                gameState={gameState}
                playerColor={playerColor}
                isHost={isHost}
                isSpectator={!!isSpectator}
                timeLeft={timeLeft}
                notification={notification}
                isMyTurn={isMyTurn}
                onSetPlayerToKickId={setPlayerToKickId}
                onRollDice={onRollDice}
                onRestartGame={onRestartGame}
                onPauseGame={onPauseGame}
                onResumeGame={onResumeGame}
                onLeaveRoom={() => setShowAbandonConfirm(true)}
                onVoteRestart={onVoteRestart}
                onShowSettings={() => setShowSettings(true)}
                onCopyCode={handleCopyCode}
                copied={copied}
                onDieClick={handleDieClick}
                validDiceIndices={validDiceIndices}
                onRollingChange={setIsUIBlocked}
            />
            <GameChat
                messages={messages}
                gameLog={gameLog}
                onSendMessage={onSendMessage}
                playerColor={playerColor}
                isSpectator={!!isSpectator}
                isSidebarOpen={isSidebarOpen}
                gameState={gameState}
            />

            <GameModals
                gameState={gameState}
                playerColor={playerColor}
                isHost={isHost}
                showSettings={showSettings}
                setShowSettings={setShowSettings}
                settings={settings}
                setThemeName={setThemeName}
                setVolume={setVolume}
                setGameOption={setGameOption}
                onUpdateOptions={onUpdateOptions}
                playerToKickId={playerToKickId}
                setPlayerToKickId={setPlayerToKickId}
                onKickPlayer={onKickPlayer}
                showAbandonConfirm={showAbandonConfirm}
                setShowAbandonConfirm={setShowAbandonConfirm}
                onLeaveRoom={onLeaveRoom}
                selectedPlayerForDetails={selectedPlayerForDetails}
                setSelectedPlayerForDetails={setSelectedPlayerForDetails}
                onRestartGame={onRestartGame}
                onVoteRestart={onVoteRestart}
                onResumeGame={onResumeGame}
                startingSelection={startingSelection}
                clearStartingSelection={clearStartingSelection}
            />

            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`hidden xl:flex fixed top-1/2 -translate-y-1/2 z-40 items-center justify-center w-6 h-16 bg-white dark:bg-gray-900 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white rounded-l-xl border-y border-l border-slate-200 dark:border-gray-700 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 ${isSidebarOpen ? 'right-96' : 'right-0'}`}
                title={isSidebarOpen ? "Hide Chat" : "Show Chat"}
            >
                {!isSidebarOpen && unreadCount > 0 && (
                    <div className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-lg border-2 border-white dark:border-gray-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                )}
                {isSidebarOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                )}
            </button>



            {/* Theme Toggle Button (Mobile) - Positioned in Header */}
            <div className="xl:hidden absolute top-0 left-0 right-0 p-3 flex justify-between items-center z-10 pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                    <div
                        onClick={handleCopyCode}
                        className={`bg-white/90 dark:bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-full text-xs font-mono border shadow-lg flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${copied
                            ? 'border-green-500/50 text-green-600 dark:text-green-400 bg-green-50/90'
                            : 'border-slate-200 dark:border-gray-700/50 text-slate-600 dark:text-gray-300'
                            }`}
                    >
                        <span className="text-slate-400 dark:text-gray-500">{copied ? '✅' : 'Room:'}</span> <span className="text-yellow-600 dark:text-yellow-500 font-bold uppercase">{gameState!.roomId}</span>
                    </div>
                    {/* Settings Btn Mobile */}
                    <button
                        onClick={() => setShowSettings(true)}
                        className="w-8 h-8 rounded-full bg-white dark:bg-gray-800/80 border border-slate-200 dark:border-gray-600 flex items-center justify-center text-lg shadow-lg active:scale-95 transition-colors"
                    >
                        ⚙️
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className={`px-4 py-2 rounded-full text-[10px] font-bold border shadow-lg pointer-events-auto transition-colors flex items-center justify-center text-center leading-tight ${gameState!.status === 'waiting'
                        ? 'bg-white/90 dark:bg-gray-900/80 backdrop-blur-md text-slate-400 dark:text-gray-400 border-slate-200 dark:border-gray-700/50'
                        : isMyTurn
                            ? (() => {
                                const map: Record<string, string> = {
                                    blue: 'bg-blue-600 border-blue-500 text-white',
                                    red: 'bg-red-600 border-red-500 text-white',
                                    green: 'bg-green-600 border-green-500 text-white',
                                    yellow: 'bg-yellow-500 border-yellow-400 text-black',
                                    purple: 'bg-purple-600 border-purple-500 text-white',
                                    orange: 'bg-orange-600 border-orange-500 text-white',
                                    gray: 'bg-slate-600 border-slate-500 text-white'
                                };
                                return `${map[playerColor || 'yellow']} animate-pulse`;
                            })()
                            : 'bg-white/90 dark:bg-gray-900/80 backdrop-blur-md text-slate-400 dark:text-gray-400 border-slate-200 dark:border-gray-700/50'
                        }`}>
                        {gameState!.status === 'waiting' ? '⏳ WAITING TO START' : isMyTurn ? '🎯 YOUR TURN' : '⏳ WAITING'}
                    </div>
                    <button
                        onClick={() => setShowAbandonConfirm(true)}
                        className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-center justify-center text-red-500 pointer-events-auto active:scale-95 transition-colors"
                    >
                        <span className="text-xs">✕</span>
                    </button>
                </div>
            </div>

            {/* Main Board Layer (Mobile: Centered with Sticked HUD) */}
            <div className={`absolute inset-0 flex items-start 2xl:items-center justify-center bg-slate-100 dark:bg-gray-900 2xl:pl-80 ${isSidebarOpen ? '2xl:pr-96' : '2xl:pr-0'} p-0 overflow-y-auto 2xl:overflow-hidden transition-all duration-300`}>
                {/* Adjusted for Mobile: Full width board, safe margins for tags, dice area raised slightly */}
                <div className="w-full h-full flex flex-col items-center justify-start 2xl:justify-center p-2 2xl:p-0 pt-12 sm:pt-8 2xl:pt-0 gap-4 2xl:gap-8 overflow-hidden">
                    {isSpectator && (
                        <div className="pointer-events-none mb-1">
                            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 text-white/90 text-[8px] xl:text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 xl:px-4 xl:py-2 rounded-full shadow-2xl flex items-center gap-2 xl:gap-3">
                                <span className="flex h-1.5 w-1.5 xl:h-2 xl:w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 xl:h-2 xl:w-2 bg-blue-500"></span>
                                </span>
                                Spectator Mode
                            </div>
                        </div>
                    )}

                    {/* Tablet Spacer to force board down */}
                    <div className="hidden sm:block 2xl:hidden w-full h-4 shrink-0" />

                    {/* Board Wrapper: Responsive constraints using vh-based square sizing to guarantee fit */}
                    <div ref={boardRef} className="relative w-[64vh] h-[64vh] max-w-[85vw] max-h-[64vh] sm:w-[70vh] sm:h-[70vh] sm:max-w-[80vw] sm:max-h-[70vh] 2xl:w-full 2xl:h-full 2xl:max-w-[82vh] 2xl:max-h-[82vh] 2xl:aspect-square flex items-center justify-center">


                        {/* Game Board with Zoom/Pan or Waiting Room */}
                        <div className="w-full h-full flex items-center justify-center">
                            {gameState.status === 'waiting' ? (
                                <WaitingRoom
                                    players={gameState.players}
                                    currentUserId={gameState.players.find(p => p.color === playerColor)?.id || ''}
                                    onSelectColor={onSelectColor}
                                    onStartGame={onStartGame}
                                    isHost={isHost}
                                    gameOptions={gameState.options}
                                    roomId={gameState.roomId}
                                    onKickPlayer={onKickPlayer}
                                    onUpdateOptions={onUpdateOptions || (() => { })}
                                    onToggleAutoRoll={() => setGameOption('autoRoll', !settings.game.autoRoll)}
                                    autoRollEnabled={settings.game.autoRoll}
                                />
                            ) : (
                                <TransformWrapper
                                    initialScale={1}
                                    minScale={1}
                                    maxScale={3}
                                    limitToBounds={true}
                                    centerOnInit={true}
                                >
                                    <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                                        <GameBoard
                                            key={`board-v${gameState.gameVersion || 0}`}
                                            players={gameState.players}
                                            playerCount={4}
                                            currentTurn={gameState.currentTurn}
                                            dice={gameState.dice}
                                            onPieceClick={handleBoardPieceClick}
                                            validPieceIndices={movablePieceIndices}
                                            rotation={boardRotation}
                                            selectedPieceId={selectedPieceId}
                                            theme={currentTheme}
                                            activeEmotes={activeEmotes}
                                            playerColor={playerColor}
                                        />
                                    </TransformComponent>
                                </TransformWrapper>
                            )}
                        </div>

                        {/* Static Corner Tags (Overlay) - unaffected by Zoom/Pan */}
                        {gameState.status !== 'waiting' && (
                            <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
                                {gameState.players.map(p => {
                                    const pos = getVisualPosition(p.color, boardRotation);
                                    let positionClasses = '';

                                    // Push them further OUTSIDE the board area (-32px approx) to avoid overlap
                                    switch (pos) {
                                        case 'TL': positionClasses = 'top-2 left-2 sm:-top-[9px] sm:left-0 2xl:top-4 2xl:left-4'; break;
                                        case 'TR': positionClasses = 'top-2 right-2 sm:-top-[9px] sm:right-0 2xl:top-4 2xl:right-4'; break;
                                        case 'BL': positionClasses = 'bottom-2 left-2 sm:-bottom-[9px] sm:left-0 2xl:bottom-4 2xl:left-4'; break;
                                        case 'BR': positionClasses = 'bottom-2 right-2 sm:-bottom-[9px] sm:right-0 2xl:bottom-4 2xl:right-4'; break;
                                    }

                                    return (
                                        <div
                                            key={p.color}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (p.color === playerColor) {
                                                    setShowEmotePicker(!showEmotePicker);
                                                } else {
                                                    setSelectedPlayerForDetails(p.id);
                                                }
                                            }}
                                            style={{ borderColor: getPlayerColorHex(p.color) }}
                                            className={`absolute ${positionClasses} px-3 py-1.5 rounded-xl border-2 shadow-lg z-30 transition-all pointer-events-auto cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 text-slate-900 dark:text-white`}
                                        >
                                            <div className="w-2.5 h-2.5 rounded-full shadow-sm relative" style={{ backgroundColor: p.color }}>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-wider max-w-[80px] truncate">
                                                {p.color === playerColor ? 'YOU' : p.name}
                                            </span>
                                            {/* Connection Status Dot */}
                                            <div className={`w-1.5 h-1.5 rounded-full ${p.isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'} shadow-sm`} />
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Player Detail Modal Overlay */}
                        {selectedPlayerForDetails && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => { e.stopPropagation(); setSelectedPlayerForDetails(null); }}>
                                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-gray-700 p-4 w-full max-w-xs transform scale-100" onClick={(e) => e.stopPropagation()}>
                                    {(() => {
                                        const p = gameState.players.find(pl => pl.id === selectedPlayerForDetails);
                                        if (!p) return null;
                                        return (
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-gray-800 pb-3">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner scrollbar-none" style={{ backgroundColor: p.color }}>
                                                        {gameState.currentTurn === p.color && '🎲'}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg leading-tight dark:text-white">{p.name}</h3>
                                                        <p className="text-xs text-slate-500 uppercase font-bold">{p.color}</p>
                                                    </div>
                                                    <button onClick={() => setSelectedPlayerForDetails(null)} className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2">✕</button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="bg-slate-50 dark:bg-gray-800 p-2 rounded-lg text-center">
                                                        <div className="font-black text-lg dark:text-white">{p.pieces.filter(pc => pc.status === 'goal').length}</div>
                                                        <div className="text-slate-400 font-bold uppercase text-[10px]">Goal 🏁</div>
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-gray-800 p-2 rounded-lg text-center">
                                                        <div className="font-black text-lg dark:text-white">{p.pieces.filter(pc => pc.status === 'nest').length}</div>
                                                        <div className="text-slate-400 font-bold uppercase text-[10px]">Home 🏠</div>
                                                    </div>
                                                </div>

                                                {isHost && p.id !== gameState.players.find(me => me.color === playerColor)?.id && (
                                                    <div className="mt-2">
                                                        {confirmKickInGame ? (
                                                            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                                <div className="text-center text-red-500 font-bold text-sm uppercase">Are you sure you want to kick them out?</div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            onKickPlayer(p.id);
                                                                            setSelectedPlayerForDetails(null);
                                                                            setConfirmKickInGame(false);
                                                                        }}
                                                                        className="py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                                                                    >
                                                                        Yes, Kick Out
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setConfirmKickInGame(false)}
                                                                        className="py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setConfirmKickInGame(true)}
                                                                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                                                            >
                                                                👢 Kick Out Player
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Ghost Button: REMOVED */}

                    </div>

                    {/* Mobile Controls (Flowed below board) */}
                    <div className="xl:hidden w-full mt-auto px-4 pb-24 sm:pb-14 md:pb-24 flex flex-col items-center gap-2">
                        {/* Ghost Button Mobile: REMOVED */}

                        <DiceArea
                            gameState={gameState}
                            isMyTurn={isMyTurn}
                            isSpectator={!!isSpectator}
                            onRollDice={onRollDice}
                            onDieClick={handleDieClick}
                            validDiceIndices={validDiceIndices}
                            onRollingChange={setIsUIBlocked}
                            timeLeft={timeLeft}
                            notification={notification}
                            onRestartGame={onRestartGame}
                            isHost={isHost}
                            onPauseGame={onPauseGame}
                            onResumeGame={onResumeGame}
                            reservePlaceholder={true}
                        />
                    </div>

                    {/* Emote Picker */}
                    {
                        showEmotePicker && (
                            <div
                                className="fixed inset-0 z-[200] flex items-center justify-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <EmotePicker
                                    onSelect={(id) => {
                                        onSendEmote(id);
                                        setShowEmotePicker(false);
                                    }}
                                    onClose={() => setShowEmotePicker(false)}
                                />
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    );
};
