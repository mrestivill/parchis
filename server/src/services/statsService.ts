
import db from '../db/index';

export interface DetailedStats {
    userId: number;
    username: string;
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    luck: number; // 0-100
    malice: number; // 0-100
    nemesis?: { name: string; count: number };
    victim?: { name: string; count: number };
    totalDoubles: number;
    cleanSheets: number;
}

export const statsService = {
    getUserDetails: (userId: number): DetailedStats | null => {
        try {
            const user = db.prepare(`
                SELECT * FROM users WHERE id = ?
            `).get(userId) as any;

            if (!user) return null;

            // 1. Calculate Standard Stats
            const gamesPlayed = user.games_played || 0;
            const winRate = gamesPlayed > 0 ? (user.games_won / gamesPlayed) * 100 : 0;

            // 2. Calculate Luck
            // Base Luck: Average roll compared to expected 3.5
            // 7.0 = 100% luck (impossible avg), 3.5 = 50%, 1.0 = 0%
            // Realistically, avg varies between 3.0 and 4.0
            const totalRolls = user.total_dice_rolls || 0;
            const avgRoll = totalRolls > 0 ? (user.total_dice_sum / totalRolls) : 3.5;

            // Normalize Avg Roll (3.5 -> 50, 4.0 -> 75, 4.5 -> 100)
            let luckScore = ((avgRoll - 3.5) * 50) + 50;

            // Add Bonus for Doubles Rate (Expected: 1/6 = 16.6%)
            const doublesRate = totalRolls > 0 ? (user.total_doubles / totalRolls) : 0.166;
            const doublesBonus = (doublesRate - 0.166) * 100; // +5% doubles => +5 luck

            luckScore += doublesBonus;
            luckScore = Math.max(0, Math.min(100, luckScore)); // Clamp 0-100

            // 3. Calculate Malice (Aggression)
            // Captures per game or captures per move context?
            // Let's use Capture Rate per 100 moves.
            // A "Move" is a dice roll.
            // High malice = > 5 captures per game?
            const moves = user.total_dice_rolls || 1;
            const captures = user.pieces_captured || 0;
            // Arbitrary scaling: 5% capture rate is HIGH malice.
            // 1 capture every 20 moves.
            const captureRate = captures / moves;
            let maliceScore = captureRate * 2000; // 0.05 * 2000 = 100
            maliceScore = Math.max(0, Math.min(100, maliceScore));

            // 4. Find Nemesis (Who captured me the most?)
            const nemesisRow = db.prepare(`
                SELECT u.username, r.times_captured
                FROM rivalries r
                JOIN users u ON u.id = r.rival_id
                WHERE r.user_id = ?
                ORDER BY r.times_captured DESC
                LIMIT 1
            `).get(userId) as any;

            // 5. Find Victim (Who I captured the most?)
            const victimRow = db.prepare(`
                SELECT u.username, r.times_captured
                FROM rivalries r
                JOIN users u ON u.id = r.user_id
                WHERE r.rival_id = ?
                ORDER BY r.times_captured DESC
                LIMIT 1
            `).get(userId) as any;

            // 6. Clean Sheets (Wins with 0 pieces lost)
            // Requires querying game_participants to sum clean_sheet_win
            const cleanSheetsRow: any = db.prepare(`
                SELECT SUM(clean_sheet_win) as count 
                FROM game_participants 
                WHERE user_id = ?
            `).get(userId);

            // 7. Get Total Doubles from History (Consistent with Leaderboard)
            const doublesRow: any = db.prepare(`
                SELECT SUM(doubles_rolled) as count
                FROM game_participants
                WHERE user_id = ?
            `).get(userId);


            return {
                userId: user.id,
                username: user.username,
                gamesPlayed,
                gamesWon: user.games_won || 0,
                winRate: Math.round(winRate),
                luck: Math.round(luckScore),
                malice: Math.round(maliceScore),
                nemesis: nemesisRow ? { name: nemesisRow.username, count: nemesisRow.times_captured } : undefined,
                victim: victimRow ? { name: victimRow.username, count: victimRow.times_captured } : undefined,
                totalDoubles: doublesRow?.count || 0,
                cleanSheets: cleanSheetsRow?.count || 0
            };

        } catch (e: any) {
            console.error('[StatsService] Failed to get user stats - Check DB Schema:', e.message);
            return null;
        }
    }
};
