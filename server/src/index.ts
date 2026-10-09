import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import path from 'path';

const app = express();
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve Static Assets (Production Mode)
// Serves the built React app from client/dist via the Backend port
app.use(express.static(path.join(__dirname, '../../client/dist')));

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ["http://localhost:5173", "http://localhost:3000"],
        methods: ["GET", "POST"]
    },
    pingTimeout: 60000, // Wait 60s before declaring disconnect (Robustness)
    pingInterval: 25000 // Send heartbeat every 25s
});

import { GameManager } from './gameManager';

import { initDB } from './db';
import { userService } from './services/userService';
import { adminService } from './services/adminService';
import { settingsService } from './services/settingsService';
import { statsService } from './services/statsService';
import { rateLimit, clearRateLimit } from './middleware/rateLimit';

// Initialize DB
initDB();

import { initSettings } from './db';
initSettings();

const currentSettings = settingsService.getSettings();

const gameManager = new GameManager(io);

// Track online presence: socketId -> { name, userId?, isGuest, role }
const presenceMap = new Map<string, { name: string; userId?: number; isGuest: boolean; role: string }>();

/**
 * Socket Input Sanitizer
 */
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

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    // Initial presence as Guest
    presenceMap.set(socket.id, { name: 'Guest ' + socket.id.substring(0, 4), isGuest: true, role: 'user' });

    // --- AUTH EVENTS ---
    socket.on('auth:register', async ({ username, password }) => {
        const u = sanitize(username, 'string', 20);
        const p = sanitize(password, 'string', 50);
        if (!u || !p) return;

        const result = await userService.register(u, p);
        socket.emit('auth:register:response', result);
    });

    socket.on('auth:login', async ({ username, password }) => {
        const u = sanitize(username, 'string', 20);
        const p = sanitize(password, 'string', 50);
        if (!u || !p) return;

        const result = await userService.login(u, p);
        socket.emit('auth:login:response', result);
    });

    socket.on('auth:verify', ({ token }) => {
        const t = sanitize(token, 'string', 1000);
        if (!t) return;

        const data = userService.verifyToken(t);
        if (data) {
            const user = userService.getUser(data.id);
            if (user) {
                presenceMap.set(socket.id, { name: user.username, userId: user.id, isGuest: false, role: user.role });
            }
            socket.emit('auth:verify:response', { success: true, user });
        } else {
            socket.emit('auth:verify:response', { success: false });
        }
    });

    // --- GAME EVENTS ---

    socket.on('createRoom', ({ players, playerName = 'Host', token, color, guestId }) => {
        const count = sanitize(players, 'number') === 6 ? 6 : 4;
        const pName = sanitize(playerName, 'string', 15) || 'Host';
        const t = sanitize(token, 'string', 1000);
        const gId = sanitize(guestId, 'string', 50);
        const col = sanitize(color, 'string', 10);

        const roomId = gameManager.createRoom(count);

        // Resolve Identity
        let userId: number | undefined;
        let finalName = pName;

        if (t) {
            const decoded = userService.verifyToken(t);
            if (decoded) {
                userId = decoded.id;
                finalName = decoded.username; // Force username from DB if logged in
            }
        }

        // Auto-join the creator with preferred color
        gameManager.joinRoom(socket, roomId, finalName, userId, col, gId);

        // Update Presence with actual name
        presenceMap.set(socket.id, { name: finalName, userId, isGuest: !userId, role: userId ? (presenceMap.get(socket.id)?.role || 'user') : 'user' });

        socket.emit('roomCreated', roomId);
    });

    socket.on('joinRoom', ({ roomId, playerName, token, color, guestId, isSpectator }) => {
        const rId = sanitize(roomId, 'string', 10);
        const pName = sanitize(playerName, 'string', 15) || 'Player';
        const t = sanitize(token, 'string', 1000);
        const gId = sanitize(guestId, 'string', 50);
        const col = sanitize(color, 'string', 10);
        if (!rId) return;

        // Resolve Identity
        let userId: number | undefined;
        let finalName = pName;

        if (t) {
            const decoded = userService.verifyToken(t);
            if (decoded) {
                userId = decoded.id;
                finalName = decoded.username;
            }
        }

        gameManager.joinRoom(socket, rId, finalName, userId, col, gId, !!isSpectator);

        // Update Presence with actual name
        presenceMap.set(socket.id, { name: finalName, userId, isGuest: !userId, role: userId ? (presenceMap.get(socket.id)?.role || 'user') : 'user' });
    });

    socket.on('getRoomDetails', ({ roomId }, callback) => {
        const rId = sanitize(roomId, 'string', 10);
        if (!rId || typeof callback !== 'function') return;
        const details = gameManager.getRoomDetails(rId);
        callback(details);
    });

    socket.on('rollDice', ({ roomId }) => {
        if (!rateLimit(socket.id)) return;

        const rId = sanitize(roomId, 'string', 10);
        if (!rId) return;
        const room = gameManager.getRoom(rId);
        if (room) room.rollDice(socket.id);
    });

    socket.on('movePiece', ({ roomId, pieceIndex, dieValue, dieIndex }) => {
        if (!rateLimit(socket.id)) return;

        const rId = sanitize(roomId, 'string', 10);
        const pIdx = sanitize(pieceIndex, 'number');
        const dVal = sanitize(dieValue, 'number');
        const dIdx = sanitize(dieIndex, 'number') ?? -1;

        if (!rId || pIdx === null || pIdx < 0 || pIdx > 3 || dVal === null || dVal < 1 || dVal > 20) return;

        const room = gameManager.getRoom(rId);
        if (room) {
            const result = room.movePiece(socket.id, pIdx, dVal, dIdx);
            if (!result.valid) {
                socket.emit('error', result.reason);
            }
        }
    });

    socket.on('restartGame', ({ roomId }) => {
        const rId = sanitize(roomId, 'string', 10);
        if (!rId) return;
        const room = gameManager.getRoom(rId);
        if (room) {
            const playerId = socket.id;
            const state = room.state;
            // Host is the first player
            const isHost = state.players.length > 0 && state.players[0].id === playerId;

            if (isHost) {
                room.restartGame();
            } else {
                // Only host can restart directly
                socket.emit('error', { message: 'Only the host can restart directly' });
            }
        }
    });

    socket.on('voteRestart', ({ roomId }) => {
        const rId = sanitize(roomId, 'string', 10);
        if (!rId) return;
        const room = gameManager.getRoom(rId);
        if (room) {
            const playerId = socket.id;
            room.voteRestart(playerId);
        }
    });

    socket.on('startGameManually', ({ roomId }) => {
        const rId = sanitize(roomId, 'string', 10);
        if (!rId) return;
        const room = gameManager.getRoom(rId);
        if (room) {
            const result = room.startGameManually(socket.id);
            if (!result.success) {
                socket.emit('error', result.error);
            }
        }
    });

    socket.on('kickPlayer', ({ roomId, playerToKickId }) => {
        const rId = sanitize(roomId, 'string', 10);
        const target = sanitize(playerToKickId, 'string', 50);
        if (!rId || !target) return;
        const room = gameManager.getRoom(rId);
        if (room) room.kickPlayer(socket.id, target);
    });

    socket.on('pauseGame', ({ roomId }) => {
        const rId = sanitize(roomId, 'string', 10);
        if (!rId) return;
        const room = gameManager.getRoom(rId);
        if (room) room.pauseGame(socket.id);
    });

    socket.on('resumeGame', ({ roomId }) => {
        const rId = sanitize(roomId, 'string', 10);
        if (!rId) return;
        const room = gameManager.getRoom(rId);
        if (room) room.resumeGame(socket.id);
    });

    socket.on('leaveRoom', ({ roomId }) => {
        const rId = sanitize(roomId, 'string', 10);
        if (!rId) return;
        const normalized = rId.toLowerCase();
        gameManager.leaveRoom(normalized, socket.id);
        socket.leave(normalized); // Remove from socket.io room
    });

    socket.on('emote:send', ({ emoteId }) => {
        const eId = sanitize(emoteId, 'string', 20);
        if (!eId) return;
        const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
        if (rooms.length > 0) {
            const room = gameManager.getRoom(rooms[0]);
            if (room) room.broadcastEmote(socket.id, eId);
        }
    });
    socket.on('game:fetchLeaderboards', () => {
        const leaderboards = adminService.getGlobalLeaderboards();
        socket.emit('leaderboards:response', { success: true, leaderboards });
    });
    // --- ADMIN EVENTS ---
    socket.on('admin:fetchStats', (data) => {
        const decoded = userService.verifyToken(data?.token);
        if (decoded?.role === 'admin') {
            const stats = adminService.getDashboardMetrics(io, gameManager);
            const activeRooms = adminService.getActiveRoomsDetails(gameManager);
            const leaderboards = adminService.getGlobalLeaderboards();
            const analytics = adminService.getDiceAnalytics();
            const presence = adminService.getOnlinePresence(presenceMap);
            socket.emit('admin:stats:response', {
                success: true,
                stats,
                activeRooms,
                leaderboards,
                analytics,
                presence
            });
        } else {
            socket.emit('error', 'Access denied');
        }
    });

    socket.on('admin:fetchUsers', (data) => {
        const decoded = userService.verifyToken(data?.token);
        if (decoded?.role === 'admin') {
            const users = adminService.getExtendedUserList();
            socket.emit('admin:users:response', { success: true, users });
        } else {
            socket.emit('error', 'Access denied');
        }
    });

    socket.on('admin:fetchSettings', (data) => {
        const decoded = userService.verifyToken(data?.token);
        if (decoded?.role === 'admin') {
            const settings = settingsService.getSettings();
            socket.emit('admin:settings:response', { success: true, settings });
        } else {
            socket.emit('error', 'Access denied');
        }
    });

    socket.on('admin:saveSettings', (data) => {
        const decoded = userService.verifyToken(data?.token);
        if (decoded?.role === 'admin') {
            settingsService.updateSettings(data.settings);
            socket.emit('admin:saveSettings:response', { success: true });

            // Optional: Broadcast notification that settings updated
            // But they only apply to new games, so maybe not needed
        } else {
            socket.emit('error', 'Access denied');
        }
    });

    socket.on('admin:action', async (data) => {
        const decoded = userService.verifyToken(data?.token);
        if (decoded?.role !== 'admin') {
            socket.emit('error', 'Access denied');
            return;
        }

        const { type, targetId, value } = data;
        try {
            switch (type) {
                case 'ban':
                    userService.setBanStatus(targetId, value);
                    if (value === true) { // If we are banning
                        for (const [socketId, presence] of presenceMap) {
                            if (presence.userId === targetId) {
                                const bannedSocket = io.sockets.sockets.get(socketId);
                                if (bannedSocket) {
                                    bannedSocket.emit('kicked');
                                    gameManager.handleDisconnect(bannedSocket);
                                    bannedSocket.disconnect(true);
                                }
                                presenceMap.delete(socketId);
                            }
                        }
                    }
                    break;
                case 'edit_role':
                    userService.updateUserRole(targetId, value);
                    break;
                case 'edit_name':
                    userService.updateUsername(targetId, value);
                    // Update presence if online
                    for (const [socketId, presence] of presenceMap) {
                        if (presence.userId === targetId) {
                            presenceMap.set(socketId, { ...presence, name: value });
                        }
                    }
                    break;
                case 'reset_password':
                    await userService.resetPassword(targetId, value);
                    break;
                case 'edit_stats':
                    userService.updateFullStats(targetId, value);
                    break;
                case 'reset_stats':
                    userService.resetUserStats(targetId);
                    break;
                case 'kick_room':
                    // targetId is RoomID in this context for 'kick_room'
                    gameManager.closeRoom(targetId);
                    break;
                case 'delete_user':
                    // Disconnect if online
                    for (const [socketId, presence] of presenceMap) {
                        if (presence.userId === targetId) {
                            const userSocket = io.sockets.sockets.get(socketId);
                            if (userSocket) {
                                userSocket.emit('error', 'Your account has been deleted by an administrator.');
                                gameManager.handleDisconnect(userSocket);
                                userSocket.disconnect(true);
                            }
                            presenceMap.delete(socketId);
                        }
                    }
                    userService.deleteUser(targetId);
                    break;
            }
            socket.emit('admin:action:response', { success: true });
        } catch (e) {
            console.error('[ADMIN] Action failed:', e);
            socket.emit('error', 'Error executing administrative action');
        }
    });

    socket.on('stats:fetch', (data) => {
        const decoded = userService.verifyToken(data?.token);
        if (!decoded) {
            socket.emit('error', 'You must log in to view statistics');
            return;
        }

        const targetId = data.targetUserId ? parseInt(data.targetUserId) : decoded.id;
        if (isNaN(targetId)) {
            socket.emit('error', 'Invalid user ID');
            return;
        }

        const stats = statsService.getUserDetails(targetId);
        if (stats) {
            socket.emit('stats:response', { success: true, stats });
        } else {
            socket.emit('error', 'User not found');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        clearRateLimit(socket.id);
        presenceMap.delete(socket.id);
        gameManager.handleDisconnect(socket);
    });
});

// SPA Fallback: Serve index.html for any unknown route
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});


const PORT = Number(process.env.PORT) || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
