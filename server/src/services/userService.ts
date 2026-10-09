
import db from '../db/index';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const FIRST_USER_IS_ADMIN = process.env.FIRST_USER_IS_ADMIN === 'true';
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('[FATAL] JWT_SECRET is not configured in the environment variables.');
    process.exit(1);
}

export interface UserStats {
    id: number;
    username: string;
    role: 'admin' | 'user';
    is_banned: boolean;
    games_played: number;
    games_won: number;
    pieces_captured: number;
    pieces_lost: number;
    total_dice_sum?: number;
    total_dice_rolls?: number;
    total_doubles?: number;
    ones_rolled?: number;
    experience?: number;
    level?: number;
}

export const userService = {
    async register(username: string, password: string): Promise<{ success: boolean; error?: string; token?: string; user?: UserStats }> {
        try {
            // Check existing
            if (/\s/.test(username)) {
                return { success: false, error: 'The username cannot contain spaces' };
            }
            const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
            if (existing) return { success: false, error: 'User already exists' };

            // Determine role: If first user, make admin
            let role = 'user';
            if (firstUserIsAdmin) {
                const userCount: any = db.prepare('SELECT COUNT(*) as count FROM users').get();
                role = userCount.count === 0 ? 'admin' : 'user';
            }

            const hash = await bcrypt.hash(password, SALT_ROUNDS);

            const insert = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
            const info = insert.run(username, hash, role);
            const userId = info.lastInsertRowid as number;

            // Auto-login after register
            const token = jwt.sign({ id: userId, username, role }, JWT_SECRET, { expiresIn: '30d' }); // Long session
            const user = this.getUser(userId);

            return { success: true, token, user };
        } catch (err) {
            console.error(err);
            return { success: false, error: 'Error during registration' };
        }
    },

    async login(username: string, password: string): Promise<{ success: boolean; error?: string; token?: string; user?: UserStats }> {
        try {
            const row: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
            if (!row) return { success: false, error: 'Incorrect username or password' };

            if (row.is_banned) return { success: false, error: 'Your account has been suspended.' };

            const match = await bcrypt.compare(password, row.password_hash);
            if (!match) return { success: false, error: 'Incorrect username or password' };

            const token = jwt.sign({ id: row.id, username: row.username, role: row.role }, JWT_SECRET, { expiresIn: '30d' });

            // Clean user object (no password)
            const user: UserStats = {
                id: row.id,
                username: row.username,
                role: row.role,
                is_banned: !!row.is_banned,
                games_played: row.games_played,
                games_won: row.games_won,
                pieces_captured: row.pieces_captured,
                pieces_lost: row.pieces_lost,
                total_dice_sum: row.total_dice_sum || 0,
                total_dice_rolls: row.total_dice_rolls || 0,
                total_doubles: row.total_doubles || 0
            };

            return { success: true, token, user };
        } catch (err) {
            console.error(err);
            return { success: false, error: 'Error during login' };
        }
    },

    getUser(id: number): UserStats | undefined {
        const row: any = db.prepare('SELECT id, username, role, is_banned, games_played, games_won, pieces_captured, pieces_lost, total_dice_sum, total_dice_rolls, total_doubles, ones_rolled, experience, level FROM users WHERE id = ?').get(id);
        if (row) {
            row.is_banned = !!row.is_banned;
        }
        return row;
    },

    verifyToken(token: string): { id: number; username: string; role: 'admin' | 'user' } | null {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };

            const user = this.getUser(decoded.id);
            if (!user || user.is_banned) return null;

            return {
                id: decoded.id,
                username: user.username,
                role: user.role as 'admin' | 'user'
            };
        } catch (e) {
            return null;
        }
    },

    // Admin Actions
    getAllUsers(): UserStats[] {
        const rows = db.prepare('SELECT id, username, role, is_banned, games_played, games_won, pieces_captured, pieces_lost, total_dice_sum, total_dice_rolls, total_doubles, ones_rolled, experience, level FROM users').all() as any[];
        return rows.map(r => ({ ...r, is_banned: !!r.is_banned }));
    },

    updateUserRole(id: number, role: 'admin' | 'user') {
        db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    },

    setBanStatus(id: number, banned: boolean) {
        db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(banned ? 1 : 0, id);
    },

    updateFullStats(id: number, stats: Partial<UserStats>) {
        const updates: string[] = [];
        const values: any[] = [];

        // Whitelist allowed fields to prevent role/ban manipulation here
        const ALLOWED = [
            'games_played', 'games_won', 'pieces_captured', 'pieces_lost',
            'total_dice_sum', 'total_dice_rolls', 'total_doubles', 'ones_rolled',
            'experience', 'level'
        ];

        Object.entries(stats).forEach(([key, value]) => {
            if (ALLOWED.includes(key)) {
                updates.push(`${key} = ?`);
                values.push(value);
            }
        });

        if (updates.length > 0) {
            const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
            db.prepare(query).run(...values, id);
        }
    },

    updateUsername(id: number, newUsername: string) {
        db.prepare('UPDATE users SET username = ? WHERE id = ?').run(newUsername, id);
    },

    async resetPassword(id: number, newPassword: string) {
        const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id);
    },

    resetUserStats(id: number) {
        db.prepare(`
            UPDATE users 
            SET games_played = 0, 
                games_won = 0, 
                pieces_captured = 0, 
                pieces_lost = 0,
                total_dice_sum = 0,
                total_dice_rolls = 0,
                total_doubles = 0,
                ones_rolled = 0,
                experience = 0,
                level = 1
            WHERE id = ?
        `).run(id);
    },

    deleteUser(id: number) {
        const deleteParticipants = db.prepare('DELETE FROM game_participants WHERE user_id = ?');
        const nullifyWinner = db.prepare('UPDATE games SET winner_id = NULL WHERE winner_id = ?');
        const deleteUser = db.prepare('DELETE FROM users WHERE id = ?');

        db.transaction(() => {
            deleteParticipants.run(id);
            nullifyWinner.run(id);
            deleteUser.run(id);
        })();
    },

    // Stat Updates
    incrementStat(userId: number, stat: 'games_played' | 'games_won' | 'pieces_captured' | 'pieces_lost', amount: number = 1) {
        try {
            const ALLOWED_STATS = ['games_played', 'games_won', 'pieces_captured', 'pieces_lost'] as const;

            if (!ALLOWED_STATS.includes(stat as any)) {
                console.error(`[DB] Invalid stat update attempt: ${stat}`);
                return;
            }

            const stmt = db.prepare(`UPDATE users SET ${stat} = ${stat} + ? WHERE id = ?`);
            stmt.run(amount, userId);
        } catch (e) {
            console.error(`[DB] Failed to update stat ${stat}`, e);
        }
    }
};
