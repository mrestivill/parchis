import React from 'react';
import { ChatWidget } from './Chat/ChatWidget';
import type { GameState, PlayerColor, GameLogEntry } from '@parchis/shared';

interface GameChatProps {
    messages: any[];
    gameLog: GameLogEntry[];
    onSendMessage: (text: string) => void;
    playerColor: PlayerColor | null;
    isSpectator: boolean;
    isSidebarOpen: boolean;
    gameState: GameState;
}

export const GameChat: React.FC<GameChatProps> = ({
    messages,
    gameLog,
    onSendMessage,
    playerColor,
    isSpectator,
    isSidebarOpen,
    gameState
}) => {
    return (
        <>
            {/* Desktop Right Sidebar (Chat) */}
            <div className={`hidden xl:flex fixed top-0 right-0 bottom-0 ${isSidebarOpen ? 'w-96' : 'w-0'} bg-white dark:bg-gray-950 border-l border-slate-200 dark:border-white/10 flex-col z-20 transition-all duration-300`}>
                <div className="relative h-full w-full">
                    <ChatWidget
                        messages={messages}
                        gameLog={gameLog}
                        onSendMessage={onSendMessage}
                        playerColor={playerColor}
                        isSpectator={isSpectator}
                        spectatorCanReadChat={gameState.options.spectatorCanReadChat}
                        spectatorCanWriteChat={gameState.options.spectatorCanWriteChat}
                        className="h-full w-full"
                        forceLayout="desktop"
                    />
                </div>
            </div>

            {/* Mobile Chat Widget (FAB) */}
            <div className="xl:hidden">
                <ChatWidget
                    messages={messages}
                    gameLog={gameLog}
                    onSendMessage={onSendMessage}
                    playerColor={playerColor}
                    isSpectator={isSpectator}
                    spectatorCanReadChat={gameState.options.spectatorCanReadChat}
                    spectatorCanWriteChat={gameState.options.spectatorCanWriteChat}
                    forceLayout="mobile"
                />
            </div>
        </>
    );
};
