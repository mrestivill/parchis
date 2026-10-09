
import db from '../db';
import { GameManager } from '../gameManager';
import { userService } from './userService';

export const adminService = {
    getDashboardMetrics: (io: any, gameManager: GameManager) => {
        const stats: any = db.prepare(`
            SELECT 
                COUNT(*) as total_users,
                (SELECT COUNT(*) FROM games) as total_games_played,
                (SELECT SUM(total_dice_value) FROM game_participants) as total_dice_sum
            FROM users
        `).get();

        const activeRooms = gameManager.getAllRooms().length;
        const onlineUsers = io.engine.clientsCount;

        return {
            totalUsers: stats.total_users,
            totalGamesPlayed: stats.total_games_played,
            totalDiceSum: stats.total_dice_sum || 0,
            activeRooms,
            onlineUsers
        };
    },

    getExtendedUserList: () => {
        return userService.getAllUsers();
    },

    getActiveRoomsDetails: (gameManager: GameManager) => {
        return gameManager.getAllRooms().map(room => room.getDetails());
    },

    getOnlinePresence: (presenceMap: Map<string, any>) => {
        return Array.from(presenceMap.values());
    },

    getGlobalLeaderboards: () => {
        const topWins = db.prepare(`
            SELECT id, username, games_won, games_played 
            FROM users 
            ORDER BY games_won DESC LIMIT 5
        `).all();

        const topCapturers = db.prepare(`
            SELECT id, username, pieces_captured as total_captured
            FROM users
            ORDER BY pieces_captured DESC LIMIT 5
        `).all();

        const mostVictims = db.prepare(`
            SELECT id, username, pieces_lost as total_lost
            FROM users
            ORDER BY pieces_lost DESC LIMIT 5
        `).all();

        const doubleKings = db.prepare(`
            SELECT id, username, total_doubles
            FROM users 
            ORDER BY total_doubles DESC LIMIT 5
        `).all();

        const oneLovers = db.prepare(`
            SELECT id, username, ones_rolled as total_ones
            FROM users
            ORDER BY ones_rolled DESC LIMIT 5
        `).all();

        const mostActive = db.prepare(`
            SELECT id, username, games_played
            FROM users
            ORDER BY games_played DESC LIMIT 5
        `).all();

        const xpRankings = db.prepare(`
            SELECT id, username, experience, level
            FROM users
            ORDER BY experience DESC LIMIT 5
        `).all();

        return {
            topWins,
            topCapturers,
            mostVictims,
            doubleKings,
            oneLovers,
            mostActive,
            xpRankings
        };
    },

    getDiceAnalytics: () => {
        const data: any = db.prepare(`
            SELECT 
                AVG(CAST(total_dice_value AS FLOAT) / CASE WHEN total_moves = 0 THEN 1 ELSE total_moves END) as global_avg
            FROM game_participants
            WHERE total_moves > 0
        `).get();

        return {
            globalAverage: data.global_avg ? parseFloat(data.global_avg.toFixed(2)) : 0
        };
    }
};
