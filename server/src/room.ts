import { Server, Socket } from 'socket.io';
import {
    GameState,
    Player,
    Spectator,
    MoveResult,
    PlayerColor,
    BOARD_CONFIG_4,
    BOARD_CONFIG_6,
    COLORS_4,
    COLORS_6,
    ChatMessage,
    GameLogEntry
} from '@parchis/shared';
import { userService } from './services/userService';
import { gameHistoryService } from './services/gameHistoryService';
import { GameEngine } from './gameEngine';
import { rateLimit } from './middleware/rateLimit';

function sanitize(val: any, type: 'string' | 'number', maxLen?: number): any | null {
    if (type === 'string') {
        if (typeof val !== 'string') return null;
        let clean = val.trim().substring(0, maxLen || 100);
        return clean.length > 0 ? clean : null;
    }
    if (type === 'number') {
        if (typeof val !== 'number' || isNaN(val)) return null;
        return val;
    }
    return null;
}

export class GameRoom {
    public id: string;
    private io: Server; // Socket.io instance
    private config: import('@parchis/shared').BoardConfig;
    private engine: GameEngine;
    private chatHistory: ChatMessage[] = [];
    private gameLog: GameLogEntry[] = [];

    constructor(roomId: string, playerCount: 4 | 6, io: Server, config?: Partial<import('@parchis/shared').GameOptions>) {
        this.id = roomId;
        this.io = io;
        this.config = playerCount === 6 ? BOARD_CONFIG_6 : BOARD_CONFIG_4;

        this.engine = new GameEngine(roomId, playerCount, {
            onStateChange: (state) => this.broadcastState(),
            onGameLog: (log) => {
                this.gameLog.push(log);
                if (this.gameLog.length > 100) this.gameLog.shift();
                this.io.to(this.id).emit('game:log', log);
            },
            onNotification: (playerId, message) => {
                if (playerId === 'all') {
                    this.io.to(this.id).emit('notification', { message });
                } else {
                    this.io.to(playerId).emit('notification', { message });
                }
            },
            onStartingPlayerSelected: (color, playerName) => {
                this.io.to(this.id).emit('starting-player-selected', { color, playerName });
            },
            onStatIncrement: (userId, stat) => {
                userService.incrementStat(userId, stat);
            },
            onGameFinished: (state) => {
                gameHistoryService.saveGameHistory(state);
            }
        }, config);
    }

    public get state(): GameState {
        return this.engine.getState();
    }

    // Proxy method to attach listener from Manager
    public setupSocketListeners(socket: Socket) {
        // Prevent duplicate listeners - Thorough Check
        // We remove all first to be safe, but also check count to debug if needed
        socket.removeAllListeners('chat:send');
        socket.removeAllListeners('game:updateOptions');
        socket.removeAllListeners('game:changeColor');

        if (socket.listenerCount && socket.listenerCount('chat:send') > 0) {
            console.warn(`[ROOM] Warning: socket ${socket.id} still has chat:send listeners after removal!`);
            return; // Abort adding more
        }

        socket.on('chat:send', (data: { text: string }) => {
            if (!rateLimit(socket.id)) return; // Rate Limit Protection

            const text = sanitize(data?.text, 'string', 100);
            if (!text) return;

            const player = this.getPlayer(socket.id);
            const spectator = this.state.spectators.find(s => s.id === socket.id);

            if ((player || spectator)) {
                // If spectator, check if chat is allowed
                if (spectator && !this.state.options.spectatorCanWriteChat) {
                    socket.emit('error', 'Spectator chat is disabled');
                    return;
                }

                console.log(`[CHAT] ${player?.name || spectator?.name}: ${text} (Color: ${player?.color}, ID: ${player?.id})`);

                const message = {
                    id: Date.now().toString() + Math.random().toString().slice(2, 5),
                    sender: player?.name || spectator?.name || 'Spectator',
                    senderColor: player?.color || 'gray' as any, // Spectators have no color
                    text: text,
                    timestamp: Date.now()
                };

                // Store in history (Max 50)
                this.chatHistory.push(message);
                if (this.chatHistory.length > 50) {
                    this.chatHistory.shift();
                }

                if (this.state.options.spectatorCanReadChat) {
                    // Single broadcast to everyone in the room
                    this.io.to(this.id).emit('chat:message', message);
                } else {
                    // Only if chat is restricted, we send individually to players
                    this.state.players.forEach(p => {
                        this.io.to(p.id).emit('chat:message', message);
                    });
                }
            }
        });

        socket.on('game:updateOptions', (data: { options: Partial<import('@parchis/shared').GameOptions> }) => {
            // Only host can update options
            if (this.state.players.length > 0 && this.state.players[0].id === socket.id) {
                const incoming = data.options || {};
                const cleanOptions: Partial<import('@parchis/shared').GameOptions> = {};

                // Explicitly validate known boolean flags
                if (typeof incoming.allowSpectators === 'boolean') cleanOptions.allowSpectators = incoming.allowSpectators;
                if (typeof incoming.spectatorCanReadChat === 'boolean') cleanOptions.spectatorCanReadChat = incoming.spectatorCanReadChat;
                if (typeof incoming.spectatorCanWriteChat === 'boolean') cleanOptions.spectatorCanWriteChat = incoming.spectatorCanWriteChat;
                if (typeof incoming.allowLateJoin === 'boolean') cleanOptions.allowLateJoin = incoming.allowLateJoin;

                if (Object.keys(cleanOptions).length > 0) {
                    this.state.options = { ...this.state.options, ...cleanOptions };
                    this.broadcastState();
                    console.log(`[ROOM] Options updated for ${this.id}:`, this.state.options);
                }
            }
        });

        socket.on('game:changeColor', (data: { color: PlayerColor }) => {
            const player = this.getPlayer(socket.id);
            if (!player) return;

            if (this.state.status !== 'waiting') {
                socket.emit('error', 'Cannot change color once the game has started');
                return;
            }

            const newColor = data.color;
            const validColors = this.config.playerCount === 6 ? COLORS_6 : COLORS_4;

            if (!validColors.includes(newColor)) {
                socket.emit('error', 'Invalid color');
                return;
            }

            const isTaken = this.state.players.some(p => p.color === newColor && p.id !== socket.id);
            if (isTaken) {
                socket.emit('error', 'The color is already taken');
                return;
            }

            // Update player color
            player.color = newColor;

            // Update pieces color and IDs
            player.pieces.forEach((piece, index) => {
                piece.color = newColor;
                piece.id = `${newColor}-${index}`;
            });

            this.io.to(socket.id).emit('player:colorChanged', { color: newColor });
            this.broadcastState();
        });
    }

    public forceStop() {
        this.engine.stopTimer();
    }

    getDetails(): import('@parchis/shared').RoomDetails {
        const availableColors = (this.config.playerCount === 6 ? COLORS_6 : COLORS_4)
            .filter(c => !this.state.players.some(p => p.color === c));

        return {
            roomId: this.id,
            playerCount: this.state.players.length,
            maxPlayers: this.config.playerCount,
            availableColors,
            players: this.state.players.map(p => ({ name: p.name, color: p.color })),
            spectatorCount: this.state.spectators.length,
            allowSpectators: this.state.options.allowSpectators
        };
    }

    addPlayer(socketId: string, name: string, userId?: number, preferredColor?: PlayerColor, guestId?: string, isExplicitSpectator?: boolean): { player?: Player, spectator?: Spectator } {
        console.log(`[ROOM] addPlayer: name=${name}, userId=${userId}, guestId=${guestId}, socket=${socketId}, isSpectator=${isExplicitSpectator}`);

        // 1. Reconnection Check (Priority: UserID -> GuestID)
        let existingPlayer: Player | undefined;
        let existingSpectator: Spectator | undefined;

        if (userId) {
            existingPlayer = this.state.players.find(p => p.userId === userId);
            existingSpectator = this.state.spectators.find(s => (s as any).userId === userId);
        } else if (guestId) {
            existingPlayer = this.state.players.find(p => p.guestId === guestId);
            existingSpectator = this.state.spectators.find(s => (s as any).guestId === guestId);
        }

        if (existingPlayer) {
            console.log(`[ROOM] Reconnecting Player ${name}`);
            existingPlayer.id = socketId;
            existingPlayer.isConnected = true;
            this.broadcastState();
            // Send Chat History
            this.io.to(socketId).emit('chat:history', this.chatHistory);
            this.io.to(socketId).emit('game:log-history', this.gameLog);
            return { player: existingPlayer };
        }

        if (existingSpectator) {
            console.log(`[ROOM] Reconnecting Spectator ${name}`);
            existingSpectator.id = socketId;
            existingSpectator.isConnected = true;
            this.broadcastState();
            // Send Chat History
            this.io.to(socketId).emit('chat:history', this.chatHistory);
            this.io.to(socketId).emit('game:log-history', this.gameLog);
            return { spectator: existingSpectator };
        }

        // 2. Spectator Join Logic
        const isFull = this.state.players.length >= this.config.playerCount;
        const shouldJoinAsSpectator = isExplicitSpectator || (isFull && this.state.options.allowSpectators);

        if (shouldJoinAsSpectator) {
            if (!this.state.options.allowSpectators && !isExplicitSpectator && isFull) {
                throw new Error('The room is full and spectators are disabled');
            }

            const newSpectator: Spectator & { userId?: number, guestId?: string } = {
                id: socketId,
                name,
                isConnected: true,
                userId,
                guestId
            };

            this.state.spectators.push(newSpectator);
            this.broadcastState();
            // Send Chat History
            this.io.to(socketId).emit('chat:history', this.chatHistory);
            this.io.to(socketId).emit('game:log-history', this.gameLog);
            return { spectator: newSpectator };
        }

        // 3. Regular Player Join Logic
        if (isFull) throw new Error('Room full');

        // Check game status
        if (this.state.status !== 'waiting' && !this.state.options.allowLateJoin) {
            throw new Error('The game has already started');
        }

        // Assign/Validate Color
        const usedColors = this.state.players.map(p => p.color);
        const availableColors = (this.config.playerCount === 6 ? COLORS_6 : COLORS_4).filter(c => !usedColors.includes(c));

        if (availableColors.length === 0) throw new Error('No colors available');

        let assignedColor = availableColors[0];

        if (preferredColor) {
            if (availableColors.includes(preferredColor)) {
                assignedColor = preferredColor;
            } else {
                throw new Error(`Color ${preferredColor} is already taken`);
            }
        }

        const newPlayer: Player = {
            id: socketId,
            userId: userId,
            guestId: guestId,
            color: assignedColor,
            pieces: [],
            name,
            isConnected: true,
            hasLeft: false
        };

        // Initialize pieces
        for (let i = 0; i < 4; i++) {
            newPlayer.pieces.push({
                id: `${assignedColor}-${i}`,
                color: assignedColor,
                position: -1,
                status: 'nest',
                isSafe: true,
                distanceFromStart: 0,
                lastMovedTime: 0
            });
        }

        this.state.players.push(newPlayer);

        this.broadcastState();

        // Send Chat History
        this.io.to(socketId).emit('chat:history', this.chatHistory);
        this.io.to(socketId).emit('game:log-history', this.gameLog);

        return { player: newPlayer };
    }

    startGameManually(socketId: string): { success: boolean; error?: string } {
        if (this.state.players.length === 0 || this.state.players[0].id !== socketId) {
            return { success: false, error: 'Only the host can start the game' };
        }
        if (this.state.status !== 'waiting') {
            return { success: false, error: 'The game has already started' };
        }

        this.engine.startGame();
        console.log(`[ROOM] Game manually started by host. Starting player: ${this.state.currentTurn}`);
        return { success: true };
    }

    handleDisconnect(socketId: string) {
        const player = this.state.players.find(p => p.id === socketId);
        if (player) {
            player.isConnected = false;

            // If active player disconnects, shorten their turn to 5 seconds to allow quick reconnect or skip
            if (this.state.currentTurn === player.color && this.state.status === 'playing') {
                this.engine.shortenTurnTimer(5000);
            }

            this.broadcastState();
            return;
        }

        const specIndex = this.state.spectators.findIndex(s => s.id === socketId);
        if (specIndex !== -1) {
            this.state.spectators.splice(specIndex, 1);
            this.broadcastState();
        }
    }

    handleReconnect(socketId: string, oldSocketId: string) {
        const player = this.state.players.find(p => p.id === oldSocketId);
        if (player) {
            player.id = socketId;
            player.isConnected = true;

            if (this.state.pendingBonus && this.state.pendingBonus.playerId === oldSocketId) {
                this.state.pendingBonus.playerId = socketId;
            }

            this.broadcastState();
            return player;
        }
        return null;
    }

    broadcastEmote(socketId: string, emoteId: string) {
        const player = this.getPlayer(socketId);
        if (!player) return;

        this.io.to(this.id).emit('emote:show', {
            playerId: socketId,
            emoteId
        });
    }

    kickPlayer(socketId: string, playerToKickId: string) {
        if (this.state.players.length === 0) return;
        if (this.state.players[0].id !== socketId) return;

        const playerIndex = this.state.players.findIndex(p => p.id === playerToKickId);
        if (playerIndex !== -1 && playerIndex !== 0) {
            const kickedPlayer = this.state.players[playerIndex];
            this.io.to(kickedPlayer.id).emit('kicked');

            if (this.state.currentTurn === kickedPlayer.color) {
                this.engine.nextTurn();
            }

            // Re-find index since nextTurn might have changed state (though unlikely to change players array index order for *this* player, but safe to do)
            // Actually nextTurn only changes currentTurn color. Players array is same reference structure in memory but might be updated by updateState?
            // GameEngine.nextTurn calls updateState which replaces this.state.
            // So we need to re-fetch the player list from this.state!
            // Wait, this.engine.nextTurn() updates this.state internally in GameEngine.
            // And GameRoom has a getter for state but also might hold reference?
            // GameRoom.state getter calls this.engine.getState().
            // So we should refer to this.state.players.

            // However, nextTurn might trigger other side effects?
            // Let's keep it simple.

            // Re-calculate the index just in case state reference changed
            const updatedPlayerIndex = this.state.players.findIndex(p => p.id === playerToKickId);
            if (updatedPlayerIndex !== -1) {
                this.state.players.splice(updatedPlayerIndex, 1);
            }

            this.broadcastState();
            return;
        }

        const spectatorIndex = this.state.spectators.findIndex(s => s.id === playerToKickId);
        if (spectatorIndex !== -1) {
            const kickedSpectator = this.state.spectators[spectatorIndex];
            this.io.to(kickedSpectator.id).emit('kicked');
            this.state.spectators.splice(spectatorIndex, 1);
            this.broadcastState();
        }
    }

    removePlayer(socketId: string) {
        const index = this.state.players.findIndex(p => p.id === socketId);
        if (index === -1) {
            const specIndex = this.state.spectators.findIndex(s => s.id === socketId);
            if (specIndex !== -1) {
                this.state.spectators.splice(specIndex, 1);
                this.broadcastState();
            }
            return;
        }

        const leavingPlayer = this.state.players[index];
        console.log(`[ROOM] Player ${leavingPlayer.name} (${leavingPlayer.color}) is leaving room ${this.id}`);

        if (this.state.currentTurn === leavingPlayer.color) {
            this.engine.nextTurn();
        }

        // Re-find index in case state changed
        const updatedIndex = this.state.players.findIndex(p => p.id === socketId);
        if (updatedIndex !== -1) {
            this.state.players.splice(updatedIndex, 1);
        }

        if (this.state.players.length <= 1) {
            this.state.status = 'waiting';
            this.engine.stopTimer();
            console.log(`[ROOM] Room ${this.id} reset to waiting (${this.state.players.length} players remaining)`);
        }

        this.broadcastState();
    }

    rollDice(socketId: string) {
        this.engine.rollDice(socketId);
    }

    movePiece(socketId: string, pieceIndex: number, dieValue: number, dieIndex: number = -1): MoveResult {
        return this.engine.movePiece(socketId, pieceIndex, dieValue, dieIndex);
    }

    private getPlayer(socketId: string) {
        return this.state.players.find(p => p.id === socketId);
    }

    private broadcastState() {
        this.io.to(this.id).emit('gameState', this.state);
    }

    voteRestart(playerId: string) {
        const state = this.engine.getState();

        // Verify that the game is finished
        if (state.status !== 'finished') {
            console.log(`[ROOM] Cannot vote restart - game not finished`);
            return;
        }

        // Verify that the player has not voted yet
        if (state.restartVotes.includes(playerId)) {
            console.log(`[ROOM] Player ${playerId} already voted`);
            return;
        }

        // Add vote
        state.restartVotes.push(playerId);
        console.log(`[ROOM] Player ${playerId} voted to restart (${state.restartVotes.length}/${state.players.length})`);

        // Calculate if there is a majority (>50%)
        const totalPlayers = state.players.length;
        const votesNeeded = Math.ceil(totalPlayers / 2);

        if (state.restartVotes.length >= votesNeeded) {
            // Majority reached, restart automatically
            console.log(`[ROOM] Majority reached, restarting game`);
            this.restartGame();
        } else {
            // Broadcast updated state with votes
            this.broadcastState();
        }
    }

    restartGame() {
        console.log(`[ROOM] Restarting game ${this.id}`);
        this.engine.restartGame();
        // Clear votes
        const state = this.engine.getState();
        state.restartVotes = [];
    }

    pauseGame(playerId: string) {
        this.engine.pauseGame(playerId);
    }

    resumeGame(playerId: string) {
        this.engine.resumeGame(playerId);
    }

    broadcastNotification(message: string) {
        this.io.to(this.id).emit('notification', { message });
    }
}
