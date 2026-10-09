import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, PlayerColor, ChatMessage, GameLogEntry } from '@parchis/shared';

// Use environment variable in dev, but fallback to origin in production (Docker)
// This ensures that if the built image is accessed via 192.168.x.x, it connects back to the same IP.
const getDynamicServerUrl = () => {
    const envUrl = import.meta.env.VITE_SERVER_URL;
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl; // Explicit production URL provided (e.g. https://mygame.com)
    }
    // If in production/built app, just use the current window's origin
    if (typeof window !== 'undefined' && import.meta.env.PROD) {
        return window.location.origin;
    }
    return envUrl || 'http://localhost:3000';
};

const SERVER_URL = getDynamicServerUrl();

export const useGameSocket = () => {
    const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [playerColor, setPlayerColor] = useState<PlayerColor | null>(null);
    const [isSpectator, setIsSpectator] = useState(false);
    const [currentRoom, setCurrentRoom] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const [user, setUser] = useState<{ id: number; username: string; role: 'admin' | 'user'; is_banned: boolean; games_played: number; games_won: number; pieces_captured: number; pieces_lost: number } | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [gameLog, setGameLog] = useState<GameLogEntry[]>([]);
    const [isKicked, setIsKicked] = useState(false);
    const [activeEmotes, setActiveEmotes] = useState<{ userId: string, emoteId: string, timestamp: number }[]>([]);
    const [startingSelection, setStartingSelection] = useState<{ color: PlayerColor; playerName: string } | null>(null);

    // Admin State
    const [adminStats, setAdminStats] = useState<any>(null);
    const [adminUsers, setAdminUsers] = useState<any[]>([]);
    const [adminSettings, setAdminSettings] = useState<any>(null);
    const [publicLeaderboards, setPublicLeaderboards] = useState<any>(null);
    const [userStats, setUserStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    useEffect(() => {
        // Fallback for crypto.randomUUID in insecure contexts (HTTP)
        const generateUUID = () => {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                return crypto.randomUUID();
            }
            return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c: any) =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        };

        // Ensure guest/device ID exists
        if (!localStorage.getItem('parchis_guest_id')) {
            localStorage.setItem('parchis_guest_id', generateUUID());
        }

        const newSocket = io(SERVER_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket', 'polling'], // Prioritize websocket
            rememberUpgrade: true,
            timeout: 60000 // Match server timeout
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            setError(`Connection error: ${err.message}`);
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            setError(null);
            console.log('Connected to server');

            // Auto-verify token if exists
            const token = localStorage.getItem('parchis_token');
            if (token) {
                newSocket.emit('auth:verify', { token });
            }

            // Auto-reconnect to room logic
            const savedRoomId = localStorage.getItem('parchis_active_room');
            if (savedRoomId) {
                console.log(`[CLIENT] Attempting to auto-reconnect to room ${savedRoomId}`);
                // Verify identity first? 
                // We send token (if any) to joinRoom. Server deduplicates by UserID if present.
                // If Guest, we might fail unless we stored a Guest ID? 
                // BUT User specifically asked for "registered user session restore".
                // Even for guest, blindly sending same name/color might create a NEW player if socket ID changed.
                // Server's handleReconnect checks OLD socket ID.
                // We don't have old socket ID here (new session).
                // So this primarily works for REGISTERED users (Token -> UserID matches).

                // We need to fetch user info first? 
                // Actually `auth:verify` emits above. But it's async.
                // We can emit joinRoom immediately. If token is valid, server resolves UserID.
                // Server `addPlayer` sees UserID matches existing player -> Reconnects.
                // Perfect.

                // What if we are guest? 
                // Server creates NEW player. Bad.
                // Unless we store a "guest_token"? 
                // Let's stick to "Session Started" (Registered) use case first as requested.
                // "si estas con una sesion iniciada ... entras y recuperas tu juego".
                // This implies User Account.

                const savedPlayerName = localStorage.getItem('parchis_player_name') || 'Player';
                // Color is optional, server might have assigned one.
                // We don't send color on rejoin, we let server match us or assign.

                newSocket.emit('joinRoom', {
                    roomId: savedRoomId,
                    playerName: savedPlayerName,
                    token,
                    guestId: localStorage.getItem('parchis_guest_id'),
                    isSpectator: localStorage.getItem('parchis_is_spectator') === 'true'
                });
            }
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Disconnected from server');
        });

        newSocket.on('gameState', (state: GameState) => {
            setGameState(state);
        });

        newSocket.on('chat:message', (msg: ChatMessage) => {
            setMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        });

        newSocket.on('chat:history', (history: ChatMessage[]) => {
            console.log('[CLIENT] Received chat history:', history.length);
            setMessages(history);
        });

        newSocket.on('game:log', (log: GameLogEntry) => {
            setGameLog(prev => {
                if (prev.some(l => l.id === log.id)) return prev;
                const newLog = [...prev, log];
                if (newLog.length > 100) newLog.shift();
                return newLog;
            });
        });

        newSocket.on('game:log-history', (history: GameLogEntry[]) => {
            console.log('[CLIENT] Received game log history:', history.length);
            setGameLog(history);
        });

        newSocket.on('roomCreated', (roomId: string) => {
            setCurrentRoom(roomId);
            localStorage.setItem('parchis_active_room', roomId); // Persist
            setMessages([]); // Clear on new room
            setGameLog([]); // Clear log
        });

        newSocket.on('joined', ({ roomId, playerColor, isSpectator: spectatorJoin }: { roomId: string, playerColor: PlayerColor, isSpectator?: boolean }) => {
            setCurrentRoom(roomId);
            localStorage.setItem('parchis_active_room', roomId); // Persist
            localStorage.setItem('parchis_is_spectator', spectatorJoin ? 'true' : 'false');
            setPlayerColor(playerColor);
            setIsSpectator(!!spectatorJoin);
        });

        newSocket.on('player:colorChanged', ({ color }: { color: PlayerColor }) => {
            console.log(`[CLIENT] Color changed to ${color}`);
            setPlayerColor(color);
        });

        newSocket.on('error', (msg: string) => {
            // Stop loading if error
            setStatsLoading(false);

            // specialized handling for room not found?
            if (msg.includes('not found') || msg.includes('full')) {
                // Clear invalid room
                if (localStorage.getItem('parchis_active_room')) {
                    console.log("Clearing stale room session");
                    localStorage.removeItem('parchis_active_room');
                    localStorage.removeItem('parchis_is_spectator');
                    setCurrentRoom(null);
                }
            }
            setError(msg);
            setTimeout(() => setError(null), 3000);
        });

        newSocket.on('notification', (data: { message: string }) => {
            if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
            setNotification(data.message);
            notificationTimerRef.current = setTimeout(() => {
                setNotification(null);
                notificationTimerRef.current = null;
            }, 3500);
        });

        newSocket.on('kicked', () => {
            setIsKicked(true);
            setGameState(null);
            setCurrentRoom(null);
            localStorage.removeItem('parchis_active_room'); // Clear persistence
            localStorage.removeItem('parchis_is_spectator');
            setError("You have been kicked from the room.");
            setUser(null);
        });

        newSocket.on('emote:show', ({ playerId, emoteId }: { playerId: string, emoteId: string }) => {
            // Add to active emotes
            const newEmote = { userId: playerId, emoteId, timestamp: Date.now() };
            setActiveEmotes(prev => [...prev, newEmote]);

            // Auto-remove after 3 seconds (cleanup handled by component usually, but state housekeeping is good)
            setTimeout(() => {
                setActiveEmotes(prev => prev.filter(e => e.timestamp !== newEmote.timestamp));
            }, 3000);
        });

        // Listen for starting player selection (Shuffle Logic)
        newSocket.on('starting-player-selected', (data: { color: PlayerColor; playerName: string }) => {
            console.log("CLIENT: Received starting-player-selected event", data);
            setStartingSelection(data);
            // Clear after animation duration + buffer (Safety net only, main clear via callback)
            setTimeout(() => {
                console.log("CLIENT: Clearing startingSelection (safety timeout)");
                setStartingSelection(null);
            }, 30000);
        });

        // Auth Responses
        newSocket.on('auth:register:response', (res) => {
            if (res.success) {
                localStorage.setItem('parchis_token', res.token);
                setUser(res.user);
            } else {
                setError(res.error);
                setTimeout(() => setError(null), 3000);
            }
        });

        newSocket.on('auth:login:response', (res) => {
            if (res.success) {
                localStorage.setItem('parchis_token', res.token);
                setUser(res.user);
            } else {
                setError(res.error);
                setTimeout(() => setError(null), 3000);
            }
        });

        newSocket.on('auth:verify:response', (res) => {
            if (res.success) {
                setUser(res.user);
            } else {
                localStorage.removeItem('parchis_token');
                setUser(null);
            }
        });

        // Admin Listeners
        newSocket.on('admin:stats:response', (res) => {
            if (res.success) {
                setAdminStats({
                    stats: res.stats,
                    activeRooms: res.activeRooms,
                    leaderboards: res.leaderboards,
                    analytics: res.analytics,
                    presence: res.presence
                });
            }
        });

        newSocket.on('admin:users:response', (res) => {
            if (res.success) {
                setAdminUsers(res.users);
            }
        });

        newSocket.on('admin:action:response', (res) => {
            if (res.success) {
                // Refresh data
                newSocket.emit('admin:fetchStats', { token: localStorage.getItem('parchis_token') });
                newSocket.emit('admin:fetchUsers', { token: localStorage.getItem('parchis_token') });
            }
        });

        newSocket.on('admin:settings:response', (res) => {
            if (res.success) {
                setAdminSettings(res.settings);
            }
        });

        newSocket.on('admin:saveSettings:response', (res) => {
            if (res.success) {
                // Refresh settings
                newSocket.emit('admin:fetchSettings', { token: localStorage.getItem('parchis_token') });
            }
        });

        newSocket.on('leaderboards:response', (res) => {
            if (res.success) {
                setPublicLeaderboards(res.leaderboards);
            }
        });

        newSocket.on('stats:response', (res) => {
            if (res.success) {
                setUserStats(res.stats);
            }
            setStatsLoading(false);
        });

        setSocket(newSocket);

        return () => {
            if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
            newSocket.disconnect();
        };
    }, []);

    const login = useCallback((username: string, password: string) => {
        socket?.emit('auth:login', { username, password });
    }, [socket]);

    const register = useCallback((username: string, password: string) => {
        socket?.emit('auth:register', { username, password });
    }, [socket]);

    const logout = useCallback(() => {
        localStorage.removeItem('parchis_token');
        setUser(null);
    }, []);

    const createRoom = useCallback((players: 4 | 6, playerName: string, color?: PlayerColor) => {
        const token = localStorage.getItem('parchis_token');
        const guestId = localStorage.getItem('parchis_guest_id');
        localStorage.setItem('parchis_player_name', playerName); // Save name
        socket?.emit('createRoom', { players, playerName, token, color, guestId });
    }, [socket]);

    const joinRoom = useCallback((roomId: string, playerName: string, color?: PlayerColor, isSpectatorJoin?: boolean) => {
        const token = localStorage.getItem('parchis_token');
        const guestId = localStorage.getItem('parchis_guest_id');
        localStorage.setItem('parchis_player_name', playerName); // Save name
        socket?.emit('joinRoom', { roomId, playerName, token, color, guestId, isSpectator: isSpectatorJoin });
    }, [socket]);

    const changeColor = useCallback((color: PlayerColor) => {
        if (currentRoom && socket) {
            socket.emit('game:changeColor', { color });
        }
    }, [socket, currentRoom]);

    const updateGameOptions = useCallback((options: Partial<import('@parchis/shared').GameOptions>) => {
        if (currentRoom) {
            socket?.emit('game:updateOptions', { roomId: currentRoom, options });
        }
    }, [socket, currentRoom]);

    const getRoomDetails = useCallback((roomId: string): Promise<import('@parchis/shared').RoomDetails | null> => {
        return new Promise((resolve) => {
            if (!socket) {
                resolve(null);
                return;
            }
            socket.emit('getRoomDetails', { roomId }, (details: import('@parchis/shared').RoomDetails | null) => {
                resolve(details);
            });
        });
    }, [socket]);

    const rollDice = useCallback(() => {
        if (currentRoom) {
            socket?.emit('rollDice', { roomId: currentRoom });
        }
    }, [socket, currentRoom]);

    const movePiece = useCallback((pieceIndex: number, dieValue: number) => {
        if (currentRoom) {
            socket?.emit('movePiece', { roomId: currentRoom, pieceIndex, dieValue });
        }
    }, [socket, currentRoom]);

    const restartGame = useCallback(() => {
        if (currentRoom) {
            socket?.emit('restartGame', { roomId: currentRoom });
        }
    }, [socket, currentRoom]);

    const kickPlayer = useCallback((playerToKickId: string) => {
        if (currentRoom) {
            socket?.emit('kickPlayer', { roomId: currentRoom, playerToKickId });
        }
    }, [socket, currentRoom]);

    const startGameManually = useCallback(() => {
        if (currentRoom) {
            socket?.emit('startGameManually', { roomId: currentRoom });
        }
    }, [socket, currentRoom]);

    const pauseGame = useCallback(() => {
        if (currentRoom) {
            socket?.emit('pauseGame', { roomId: currentRoom });
        }
    }, [socket, currentRoom]);

    const resumeGame = useCallback(() => {
        if (currentRoom) {
            socket?.emit('resumeGame', { roomId: currentRoom });
        }
    }, [socket, currentRoom]);

    const sendMessage = useCallback((text: string) => {
        if (socket && text.trim()) {
            socket.emit('chat:send', { text });
        }
    }, [socket]);

    const sendEmote = useCallback((emoteId: string) => {
        if (socket) {
            socket.emit('emote:send', { emoteId });
        }
    }, [socket]);

    const fetchAdminStats = useCallback(() => {
        const token = localStorage.getItem('parchis_token');
        socket?.emit('admin:fetchStats', { token });
    }, [socket]);

    const fetchAdminUsers = useCallback(() => {
        const token = localStorage.getItem('parchis_token');
        socket?.emit('admin:fetchUsers', { token });
    }, [socket]);

    const performAdminAction = useCallback((type: string, targetId: any, value?: any) => {
        const token = localStorage.getItem('parchis_token');
        socket?.emit('admin:action', { token, type, targetId, value });
    }, [socket]);

    const fetchAdminSettings = useCallback(() => {
        const token = localStorage.getItem('parchis_token');
        socket?.emit('admin:fetchSettings', { token });
    }, [socket]);

    const saveAdminSettings = useCallback((settings: any) => {
        const token = localStorage.getItem('parchis_token');
        socket?.emit('admin:saveSettings', { token, settings });
    }, [socket]);

    return {
        socket,
        gameState,
        isConnected,
        playerColor,
        currentRoom,
        user,
        error,
        notification,
        messages,
        gameLog,
        activeEmotes,
        isSpectator,
        login,
        register,
        logout,
        createRoom,
        joinRoom,
        getRoomDetails,
        updateGameOptions,
        rollDice,
        movePiece,
        restartGame,
        kickPlayer,
        startGameManually,
        pauseGame,
        resumeGame,
        sendMessage,
        isKicked,
        sendEmote,
        startingSelection,
        adminStats,
        adminUsers,
        fetchAdminStats,
        fetchAdminUsers,
        performAdminAction,
        adminSettings,
        fetchAdminSettings,
        saveAdminSettings,
        publicLeaderboards,
        userStats,
        statsLoading,
        fetchUserStats: (targetUserId?: string) => {
            setStatsLoading(true);
            const token = localStorage.getItem('parchis_token');
            socket?.emit('stats:fetch', { token, targetUserId });
        },
        fetchLeaderboards: () => {
            socket?.emit('game:fetchLeaderboards');
        },
        voteRestart: () => {
            if (socket && currentRoom) {
                socket.emit('voteRestart', { roomId: currentRoom });
            }
        },
        leaveRoom: () => {
            if (socket && currentRoom) {
                socket.emit('leaveRoom', { roomId: currentRoom });
            }
            // Clear stored room data
            localStorage.removeItem('parchis_active_room');
            localStorage.removeItem('parchis_is_spectator');

            // Reset all state
            setGameState(null);
            setPlayerColor(null);
            setIsSpectator(false);
            setCurrentRoom(null);
            setMessages([]);
            setGameLog([]);
            setActiveEmotes([]);
            setStartingSelection(null);
        },
        clearStartingSelection: () => setStartingSelection(null),
        changeColor
    };
};
