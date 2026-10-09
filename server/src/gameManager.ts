import { GameRoom } from './room';
import { Socket } from 'socket.io';
import { settingsService } from './services/settingsService';

export class GameManager {
    private rooms: Map<string, GameRoom> = new Map();
    // Simple session map: userId -> { roomId, oldSocketId }
    // ideally use a token, but here we can just map socket ID or name

    constructor(private io: any) {
        // Garbage Collector: Run every 1 hour
        setInterval(() => this.cleanupRooms(), 60 * 60 * 1000);
    }

    private cleanupRooms() {
        const now = Date.now();
        const EMPTY_ROOOM_TIMEOUT = 2 * 60 * 1000; // 2 minutes empty -> delete
        const ZOMBIE_ROOM_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hours no activity -> delete

        let cleanedCount = 0;
        this.rooms.forEach((room, roomId) => {
            const state = room.state;

            // 1. Delete empty rooms that have been inactive for a while
            // We use lastActionTimestamp to ensure we don't delete a room created 1 second ago
            const isEmpty = state.players.length === 0 && state.spectators.length === 0;
            const isInactiveRecently = (now - state.lastActionTimestamp) > EMPTY_ROOOM_TIMEOUT;

            if (isEmpty && isInactiveRecently) {
                console.log(`[GC] Removing empty room: ${roomId}`);
                this.rooms.delete(roomId);
                cleanedCount++;
                return;
            }

            // 2. Delete zombie rooms (stuck or abandoned open for too long)
            const isZombie = (now - state.lastActionTimestamp) > ZOMBIE_ROOM_TIMEOUT;
            if (isZombie) {
                console.log(`[GC] Removing zombie room: ${roomId} (Inactive > 3h)`);
                // Optional: kick remaining players
                this.io.to(roomId).emit('error', 'The room has closed due to inactivity.');
                this.io.in(roomId).socketsLeave(roomId);

                this.rooms.delete(roomId);
                cleanedCount++;
            }
        });

        if (cleanedCount > 0) {
            console.log(`[GC] Cleanup complete. Removed ${cleanedCount} rooms. Active: ${this.rooms.size}`);
        }
    }

    createRoom(playerCount: 4 | 6): string {
        // Generate 4-character alphanumeric Room ID (uppercase for readability)
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed I, O, 0, 1 to avoid confusion
        let roomId = '';
        for (let i = 0; i < 4; i++) {
            roomId += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        // Simple collision check (retry once if exists, unlikely with 4 chars on low scale but good practice)
        if (this.rooms.has(roomId.toLowerCase())) {
            roomId = '';
            for (let i = 0; i < 4; i++) {
                roomId += characters.charAt(Math.floor(Math.random() * characters.length));
            }
        }

        const normalizedId = roomId.toLowerCase();

        // Load global settings for this new room
        const globalSettings = settingsService.getSettings();
        const roomConfig = {
            timeBonusOnCapture: globalSettings.game_bonus_capture,
            timeBonusOnGoal: globalSettings.game_bonus_goal,
            turnDuration: globalSettings.game_turn_timeout,
            turnRollDuration: globalSettings.game_roll_timeout
        };
        const room = new GameRoom(normalizedId, playerCount, this.io, roomConfig);
        this.rooms.set(normalizedId, room);
        return roomId; // Return uppercase for better UI
    }

    kickPlayer(roomId: string, adminSocketId: string, playerToKickId: string) {
        const room = this.rooms.get(roomId.toLowerCase());
        if (room) {
            room.kickPlayer(adminSocketId, playerToKickId);
        }
    }

    leaveRoom(roomId: string, socketId: string) {
        const room = this.rooms.get(roomId.toLowerCase());
        if (room) {
            room.removePlayer(socketId);
        }
    }

    closeRoom(roomId: string) {
        const room = this.rooms.get(roomId.toLowerCase());
        if (!room) return;

        // Notify all players
        room.broadcastNotification('The room has been closed by an administrator.');

        // Kick all players and spectators
        const allParticipants = [
            ...room.state.players.map(p => p.id),
            ...room.state.spectators.map(s => s.id)
        ];

        allParticipants.forEach(socketId => {
            this.io.to(socketId).emit('kicked');
            this.io.sockets.sockets.get(socketId)?.leave(roomId.toLowerCase());
        });

        // Stop game timer if running
        room.forceStop();

        // Delete room from manager
        this.rooms.delete(roomId.toLowerCase());

    }

    getRoomDetails(roomId: string): import('@parchis/shared').RoomDetails | null {
        const room = this.rooms.get(roomId.toLowerCase());
        if (!room) return null;
        return room.getDetails();
    }

    joinRoom(socket: Socket, roomId: string, playerName: string, userId?: number, preferredColor?: import('@parchis/shared').PlayerColor, guestId?: string, isSpectator?: boolean) {
        const normalizedRoomId = roomId.toLowerCase();
        const room = this.rooms.get(normalizedRoomId);
        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }

        socket.join(normalizedRoomId); // Join first so we hear the broadcast

        try {
            const result = room.addPlayer(socket.id, playerName, userId, preferredColor, guestId, isSpectator);
            // Setup Chat Listeners
            room.setupSocketListeners(socket);

            if (result.player) {
                socket.emit('joined', { roomId: normalizedRoomId, playerColor: result.player.color });
            } else if (result.spectator) {
                socket.emit('joined', { roomId: normalizedRoomId, playerColor: null, isSpectator: true });
            }
        } catch (e: any) {
            socket.leave(normalizedRoomId); // Revert join if failed
            socket.emit('error', e.message || 'Error joining');
        }
    }

    handleDisconnect(socket: Socket) {
        // Find room where socket is present
        this.rooms.forEach(room => {
            room.handleDisconnect(socket.id);
        });
    }

    getRoom(roomId: string) {
        return this.rooms.get(roomId.toLowerCase());
    }

    getAllRooms(): GameRoom[] {
        return Array.from(this.rooms.values());
    }
}
