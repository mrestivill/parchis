
import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage, PlayerColor, GameLogEntry, LogType } from '@parchis/shared';
import { clsx } from 'clsx';
import { soundManager } from '../../utils/soundManager';


interface ChatWidgetProps {
    messages: ChatMessage[];
    gameLog: GameLogEntry[];
    onSendMessage: (text: string) => void;
    playerColor: PlayerColor | null;
    isSpectator?: boolean;
    spectatorCanReadChat?: boolean;
    spectatorCanWriteChat?: boolean;
    className?: string;
    forceLayout?: 'mobile' | 'desktop';
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ messages, gameLog, onSendMessage, playerColor, isSpectator, spectatorCanReadChat = true, spectatorCanWriteChat = true, className, forceLayout }) => {
    const [isOpen, setIsOpen] = useState(false); // Mobile Drawer State
    const [lastReadCount, setLastReadCount] = useState(messages.length);
    const [_lastReadLogCount, setLastReadLogCount] = useState(gameLog.length);
    const [inputValue, setInputValue] = useState('');
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Responsive Check
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isDesktop = forceLayout ? forceLayout === 'desktop' : windowWidth >= 1024;

    // Track unread messages & logs
    useEffect(() => {
        if (isOpen || isDesktop) {
            // We only clear unread if the user interacts, or maybe we leave it for now?
            // Actually, we should probably track which TAB is open to clear counters.
            // For now, let's just update `lastReadCount` when messages changes IF the drawer is open?
            // Reverting to original logic: if open/desktop, mark all as read?
            // Better logic is inside ChatInner with tabs.
            // But we need counts for the FAB badge.
        }
    }, [messages.length, gameLog.length, isOpen, isDesktop]);

    // Scroll to bottom on new message
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Sound alert for new messages
    const prevMessagesLength = useRef(messages.length);
    useEffect(() => {
        if (messages.length > prevMessagesLength.current) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.senderColor !== playerColor && !lastMsg.isSystem) {
                soundManager.playChat();
            }
        }
        prevMessagesLength.current = messages.length;
    }, [messages, playerColor]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onSendMessage(inputValue);
            setInputValue('');
        }
    };

    // We'll pass the setter for read counts to ChatInner so it can clear them when tabs switch
    // Filter out system messages from unread count
    const unreadMsgCount = messages
        .slice(lastReadCount)
        .filter(msg => !msg.isSystem).length;

    // We ignore log counts for the main badge as requested
    // const unreadLogCount = gameLog.length - lastReadLogCount; 

    const totalUnread = unreadMsgCount;

    const canChat = !isSpectator || spectatorCanWriteChat;

    // Desktop: Always visible sidebar (or container)
    if (isDesktop) {
        return (
            <div className={clsx("h-full w-full", className)}>
                <ChatInner
                    messages={messages}
                    gameLog={gameLog}
                    playerColor={playerColor}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleSubmit={handleSubmit}
                    isDesktop={isDesktop}
                    isOpen={true} // Desktop always open
                    onClose={() => setIsOpen(false)}
                    messagesEndRef={messagesEndRef}
                    spectatorCanReadChat={spectatorCanReadChat}
                    canChat={canChat}
                    onMarkMsgRead={() => setLastReadCount(messages.length)}
                    onMarkLogRead={() => setLastReadLogCount(gameLog.length)}
                />
            </div>
        );
    }

    // Mobile: Floating Button + Drawer
    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer (Bottom Sheet) */}
            <div className={clsx(
                "fixed bottom-0 left-0 right-0 z-50 h-[60vh] transform transition-transform duration-300 ease-out will-change-transform",
                isOpen ? "translate-y-0" : "translate-y-[110%] pointer-events-none"
            )}>
                <div className="h-full w-full rounded-t-2xl overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    <ChatInner
                        messages={messages}
                        gameLog={gameLog}
                        playerColor={playerColor}
                        inputValue={inputValue}
                        setInputValue={setInputValue}
                        handleSubmit={handleSubmit}
                        isDesktop={isDesktop}
                        isOpen={isOpen} // Mobile controlled by drawer
                        onClose={() => setIsOpen(false)}
                        messagesEndRef={messagesEndRef}
                        spectatorCanReadChat={spectatorCanReadChat}
                        canChat={canChat}
                        onMarkMsgRead={() => setLastReadCount(messages.length)}
                        onMarkLogRead={() => setLastReadLogCount(gameLog.length)}
                    />
                </div>
            </div>

            {/* Floating Action Button (FAB) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-4 left-4 z-40 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 flex items-center justify-center group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    {totalUnread > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900 animate-in zoom-in duration-300">
                            {totalUnread > 9 ? '9+' : totalUnread}
                        </div>
                    )}
                </button>
            )}
        </>
    );
};

interface ChatInnerProps {
    messages: ChatMessage[];
    gameLog: GameLogEntry[];
    playerColor: PlayerColor | null;
    inputValue: string;
    setInputValue: (val: string) => void;
    handleSubmit: (e: React.FormEvent) => void;
    isDesktop: boolean;
    isOpen?: boolean; // New prop to control read marking
    onClose: () => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    spectatorCanReadChat?: boolean;
    canChat?: boolean;
    onMarkMsgRead: () => void;
    onMarkLogRead: () => void;
}

const ChatInner: React.FC<ChatInnerProps> = ({
    messages,
    gameLog,
    playerColor,
    inputValue,
    setInputValue,
    handleSubmit,
    isDesktop,
    isOpen = true,
    onClose,
    messagesEndRef,
    spectatorCanReadChat,
    canChat,
    onMarkMsgRead,
    onMarkLogRead
}) => {
    const [activeTab, setActiveTab] = useState<'chat' | 'log'>('chat');
    const logEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll Logs
    useEffect(() => {
        if (activeTab === 'log' && logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [gameLog.length, activeTab]);

    // Mark as read when tab is active AND drawer/widget is open
    useEffect(() => {
        if (!isOpen) return;

        if (activeTab === 'chat') {
            onMarkMsgRead();
        } else {
            onMarkLogRead();
        }
    }, [activeTab, messages.length, gameLog.length, isOpen]);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-gray-900/95 border-l border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl backdrop-blur-md">
            {/* Header with Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white dark:bg-gray-800/80">
                <div className="flex-1 flex">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={clsx(
                            "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative",
                            activeTab === 'chat'
                                ? "text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-gray-800"
                                : "text-slate-400 dark:text-gray-500 hover:bg-slate-50 dark:hover:bg-gray-800/50"
                        )}
                    >
                        💬 Chat
                        {activeTab === 'chat' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('log')}
                        className={clsx(
                            "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative",
                            activeTab === 'log'
                                ? "text-purple-600 dark:text-purple-400 bg-slate-50 dark:bg-gray-800"
                                : "text-slate-400 dark:text-gray-500 hover:bg-slate-50 dark:hover:bg-gray-800/50"
                        )}
                    >
                        📜 Log
                        {activeTab === 'log' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                        )}
                    </button>
                </div>
                {!isDesktop && (
                    <button onClick={onClose} className="px-4 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:white">
                        ✕
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">

                {activeTab === 'chat' ? (
                    <div className="p-4 space-y-3 min-h-full flex flex-col justify-end">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-400 dark:text-gray-500 text-xs italic mt-10 mb-auto">
                                No messages yet. Say hello!
                            </div>
                        )}
                        {messages.map((msg) => {
                            const isSystem = msg.isSystem;
                            const isMe = msg.senderColor === playerColor;

                            if (isSystem) {
                                return (
                                    <div key={msg.id} className="text-center text-[10px] text-yellow-600/80 dark:text-yellow-500/80 my-2 italic bg-yellow-50 dark:bg-yellow-900/10 py-1 rounded">
                                        {msg.text}
                                    </div>
                                );
                            }

                            return (
                                <div key={msg.id} className={clsx("flex flex-col w-full", isMe ? "items-end" : "items-start")}>
                                    <div className="flex items-baseline gap-2 mb-0.5">
                                        <span className={clsx("text-[10px] font-bold", getColorTextClass(msg.senderColor))}>
                                            {msg.sender}
                                        </span>
                                        <span className="text-[9px] text-slate-300 dark:text-gray-600">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={clsx(
                                        "px-3 py-2 rounded-lg text-xs md:text-sm max-w-[90%] break-words shadow-sm transition-colors",
                                        isMe
                                            ? "bg-blue-600 text-white rounded-tr-none"
                                            : "bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-200 rounded-tl-none border border-slate-200 dark:border-transparent"
                                    )}>
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {gameLog.length === 0 && (
                            <div className="text-center text-slate-400 dark:text-gray-500 text-xs italic mt-10">
                                The game just started...
                            </div>
                        )}
                        {gameLog.map((log) => (
                            <div key={log.id} className="flex gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-gray-800/50 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0">
                                <span className="text-lg select-none">{getLogIcon(log.type)}</span>
                                <div className="flex-1">
                                    <div className="text-xs text-slate-700 dark:text-gray-300 leading-tight">
                                        {formatLogText(log.text)}
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className={clsx("text-[9px] font-bold uppercase", getColorTextClass(log.playerColor || null))}>
                                            {log.playerColor || 'System'}
                                        </span>
                                        <span className="text-[9px] text-slate-400 dark:text-gray-600 font-mono">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area (Only for Chat Tab) */}
            {activeTab === 'chat' && (
                canChat ? (
                    <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-gray-800/90 flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type a message..."
                            maxLength={100}
                            className="flex-1 bg-slate-50 dark:bg-gray-900/50 border border-slate-300 dark:border-gray-600 rounded-full px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-gray-500 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white transition-all active:scale-90 shadow-md"
                            aria-label="Send"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                ) : (
                    <div className="p-4 bg-slate-100 dark:bg-gray-800/50 text-center text-xs text-slate-400 dark:text-gray-500 italic font-bold border-t border-slate-200 dark:border-white/5">
                        🔒 {spectatorCanReadChat ? 'Read-only for spectators' : 'Spectator chat is disabled'}
                    </div>
                )
            )}
        </div>
    );
};

const getLogIcon = (type: LogType) => {
    switch (type) {
        case 'move': return '👣';
        case 'capture': return '⚔️';
        case 'goal': return '🏁';
        case 'turn_change': return '⏳';
        case 'dice_roll': return '🎲';
        case 'game_start': return '🚀';
        case 'game_end': return '🏆';
        default: return 'ℹ️';
    }
};

const formatLogText = (text: string) => {
    // Basic formatting, maybe bolding names could be done here if we parsed logic, 
    // but for now plain text is fine.
    return text;
};

// Helper for colors
const getColorTextClass = (color: PlayerColor | 'gray' | null) => {
    if (color === 'gray') return 'text-slate-500 dark:text-gray-400 italic';
    switch (color) {
        case 'red': return 'text-red-400';
        case 'green': return 'text-green-400';
        case 'blue': return 'text-blue-400';
        case 'yellow': return 'text-yellow-400';
        case 'purple': return 'text-purple-400';
        case 'orange': return 'text-orange-400';
        default: return 'text-gray-400';
    }
};
