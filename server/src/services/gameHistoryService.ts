import db from '../db';
import { GameState } from '@parchis/shared';
import { settingsService } from './settingsService';

export const gameHistoryService = {
    saveGameHistory: (gameState: GameState) => {
        try {
            // 1. Calculate Rankings
            // Sort players by performace:
            // - Winner first
            // - Then by number of pieces in goal
            // - Then by total distance of all pieces
            const rankedPlayers = [...gameState.players].sort((a, b) => {
                if (gameState.winner === a.color) return -1;
                if (gameState.winner === b.color) return 1;

                const aGoalCount = a.pieces.filter(p => p.status === 'goal').length;
                const bGoalCount = b.pieces.filter(p => p.status === 'goal').length;
                if (aGoalCount !== bGoalCount) return bGoalCount - aGoalCount;

                const aTotalDist = a.pieces.reduce((sum, p) => sum + p.distanceFromStart, 0);
                const bTotalDist = b.pieces.reduce((sum, p) => sum + p.distanceFromStart, 0);
                return bTotalDist - aTotalDist;
            });

            // Map player IDs to ranks
            const rankMap = new Map<string, number>();
            rankedPlayers.forEach((p, index) => {
                rankMap.set(p.id, index + 1);
            });

            // 2. Prepare Game Data
            const winnerPlayer = gameState.players.find(p => p.color === gameState.winner);
            const winnerId = winnerPlayer?.userId || null;
            const startTime = gameState.startTime || Date.now(); // Fallback if missing
            const endTime = Date.now().toString(); // SQLite stores dates as strings usually or ISO

            // 3. Insert into 'games' table
            const stmtGame = db.prepare(`
                INSERT INTO games (room_id, start_time, end_time, winner_id, total_turns)
                VALUES (?, ?, ?, ?, ?)
            `);

            const result = stmtGame.run(
                gameState.roomId,
                startTime,
                endTime,
                winnerId,
                gameState.totalTurns || 0
            );

            const gameId = result.lastInsertRowid;

            // 4. Insert Participants
            const stmtParticipant = db.prepare(`
                INSERT INTO game_participants (
                    game_id, user_id, color, rank, 
                    pieces_captured, pieces_lost, doubles_rolled, total_moves,
                    total_dice_value, ones_rolled, clean_sheet_win, was_bot
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            // Prepare user update statement
            const stmtUpdateUser = db.prepare(`
                UPDATE users 
                SET games_played = games_played + 1,
                    games_won = games_won + ?,
                    total_dice_sum = total_dice_sum + ?,
                    total_dice_rolls = total_dice_rolls + ?,
                    total_doubles = total_doubles + ?,
                    ones_rolled = ones_rolled + ?,
                    experience = experience + ?,
                    level = ?
                WHERE id = ?
            `);

            // Helper to get current level from experience
            const getLevelFromXP = (xp: number) => {
                // XP = 500 * (L^1.5) => L = (XP / 500)^(1/1.5)
                // Thresholds:
                // L1: 0
                // L2: 500
                // L3: 1414
                if (xp < 500) return 1;
                return Math.floor(Math.pow(xp / 500, 1 / 1.5)) + 1;
            };

            const settings = settingsService.getSettings();

            // Use transaction for participants and user updates
            const insertParticipants = db.transaction((players: typeof gameState.players) => {
                for (const player of players) {
                    if (player.userId) {
                        const stats = player.stats || {
                            piecesCaptured: 0,
                            piecesLost: 0,
                            doublesRolled: 0,
                            totalMoves: 0,
                            totalDiceValue: 0,
                            onesRolled: 0
                        };

                        const rank = rankMap.get(player.id);
                        const isWinner = rank === 1;
                        const cleanSheetWin = isWinner && (stats.piecesLost === 0);

                        // Insert into game_participants
                        stmtParticipant.run(
                            gameId,
                            player.userId,
                            player.color,
                            rank,
                            stats.piecesCaptured,
                            stats.piecesLost,
                            stats.doublesRolled,
                            stats.totalMoves,
                            stats.totalDiceValue || 0,
                            stats.onesRolled || 0,
                            cleanSheetWin ? 1 : 0,
                            0 // was_bot
                        );

                        // Update accumulated user stats ONLY if it was a multiplayer game (>= 2 human players: registered or guests)
                        const humanPlayerCount = players.filter(p => !!p.userId || !!p.guestId).length;

                        if (humanPlayerCount >= 2) {
                            // Calculate XP
                            const piecesInGoal = player.pieces.filter(p => p.status === 'goal').length;
                            const xpGained = settings.xp_game_participation +
                                (rank === 1 ? settings.xp_rank_1 : rank === 2 ? settings.xp_rank_2 : rank === 3 ? settings.xp_rank_3 : 0) +
                                (stats.piecesCaptured * settings.xp_piece_captured) +
                                (piecesInGoal * settings.xp_piece_goal) +
                                (cleanSheetWin ? settings.xp_clean_sheet_win : 0);

                            // Get current XP to calculate new level
                            const currentUser = db.prepare('SELECT experience FROM users WHERE id = ?').get(player.userId) as { experience: number };
                            const newTotalXP = (currentUser?.experience || 0) + xpGained;
                            const newLevel = getLevelFromXP(newTotalXP);

                            stmtUpdateUser.run(
                                isWinner ? 1 : 0,              // games_won
                                stats.totalDiceValue || 0,     // total_dice_sum
                                stats.totalMoves || 0,         // total_dice_rolls
                                stats.doublesRolled || 0,      // total_doubles
                                stats.onesRolled || 0,         // ones_rolled
                                xpGained,                      // experience
                                newLevel,                      // level
                                player.userId                  // WHERE id = ?
                            );
                        }
                    }
                }
            });

            insertParticipants(gameState.players);

            // 5. Update Rivalries (Nemesis)
            if (gameState.captureHistory && gameState.captureHistory.length > 0) {
                const stmtRivalry = db.prepare(`
                    INSERT INTO rivalries (user_id, rival_id, times_captured, last_capture_at)
                    VALUES (?, ?, 1, ?)
                    ON CONFLICT(user_id, rival_id) DO UPDATE SET
                    times_captured = times_captured + 1,
                    last_capture_at = excluded.last_capture_at
                `);

                const insertRivalries = db.transaction((history: typeof gameState.captureHistory) => {
                    for (const event of history) {
                        // We need to resolve player IDs to User IDs
                        // capturer -> Nemesis (rival_id)
                        // victim -> Victim (user_id)
                        const capturer = gameState.players.find(p => p.id === event.capturerId);
                        const victim = gameState.players.find(p => p.id === event.victimId);

                        if (capturer?.userId && victim?.userId) {
                            stmtRivalry.run(victim.userId, capturer.userId, new Date(event.timestamp).toISOString());
                        }
                    }
                });

                insertRivalries(gameState.captureHistory);
            }

        } catch (error) {
            console.error('[DB] Failed to save game history:', error);
        }
    }
};
