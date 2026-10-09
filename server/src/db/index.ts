import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'parchis.db'));

// Initialize Schema
export const initDB = () => {
    // Users Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            is_banned BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            games_played INTEGER DEFAULT 0,
            games_won INTEGER DEFAULT 0,
            pieces_captured INTEGER DEFAULT 0,
            pieces_lost INTEGER DEFAULT 0,
            total_dice_sum INTEGER DEFAULT 0,
            total_dice_rolls INTEGER DEFAULT 0,
            total_doubles INTEGER DEFAULT 0,
            ones_rolled INTEGER DEFAULT 0
        )
    `);

    // Games History Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT NOT NULL,
            start_time DATETIME NOT NULL,
            end_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            winner_id INTEGER,
            total_turns INTEGER DEFAULT 0,
            FOREIGN KEY(winner_id) REFERENCES users(id)
        )
    `);

    // Game Participants (Stats & Results)
    db.exec(`
        CREATE TABLE IF NOT EXISTS game_participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            color TEXT NOT NULL,
            rank INTEGER, -- 1st, 2nd, 3rd, 4th
            pieces_captured INTEGER DEFAULT 0,
            pieces_lost INTEGER DEFAULT 0,
            doubles_rolled INTEGER DEFAULT 0,
            total_moves INTEGER DEFAULT 0,
            total_dice_value INTEGER DEFAULT 0,
            ones_rolled INTEGER DEFAULT 0,
            clean_sheet_win BOOLEAN DEFAULT 0,
            was_bot BOOLEAN DEFAULT 0,
            FOREIGN KEY(game_id) REFERENCES games(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);

    // Rivalries Table (Nemesis System)
    db.exec(`
        CREATE TABLE IF NOT EXISTS rivalries (
            user_id INTEGER NOT NULL,
            rival_id INTEGER NOT NULL,
            times_captured INTEGER DEFAULT 0,
            last_capture_at DATETIME,
            PRIMARY KEY (user_id, rival_id),
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(rival_id) REFERENCES users(id)
        )
    `);

    // Indexes for Optimization
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_games_winner ON games(winner_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_participants_user ON game_participants(user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_participants_game ON game_participants(game_id)`);

    // Auto-Migrations for v0.9.4+ (Safe to run on every startup)
    try {
        const addColumnIfNotExists = (table: string, column: string, definition: string) => {
            const columns = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
            if (!columns.some(c => c.name === column)) {
                console.log(`[DB] Migrating: Adding ${column} to ${table}...`);
                db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
            }
        };

        // Add new Advanced Stats columns if they don't exist
        addColumnIfNotExists('game_participants', 'total_dice_value', 'INTEGER DEFAULT 0');
        addColumnIfNotExists('game_participants', 'ones_rolled', 'INTEGER DEFAULT 0');
        addColumnIfNotExists('game_participants', 'clean_sheet_win', 'BOOLEAN DEFAULT 0');

        // Admin Columns
        addColumnIfNotExists('users', 'role', "TEXT DEFAULT 'user'");
        addColumnIfNotExists('users', 'is_banned', "BOOLEAN DEFAULT 0");
        addColumnIfNotExists('users', 'total_dice_sum', "INTEGER DEFAULT 0");
        addColumnIfNotExists('users', 'total_dice_rolls', "INTEGER DEFAULT 0");
        addColumnIfNotExists('users', 'total_doubles', "INTEGER DEFAULT 0");
        addColumnIfNotExists('users', 'ones_rolled', "INTEGER DEFAULT 0");
        addColumnIfNotExists('users', 'experience', "INTEGER DEFAULT 0");
        addColumnIfNotExists('users', 'level', "INTEGER DEFAULT 1");

        // Rivalry Migration
        addColumnIfNotExists('rivalries', 'last_capture_at', 'DATETIME');

    } catch (err) {
        console.error('[DB] Migration failed:', err);
    }

    // System Settings Table (Global Config)
    db.exec(`
        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('[DB] Database initialized (Schema v2 + Migrations Checked)');
};

// Initialize with default settings if empty
export const initSettings = () => {
    const defaultSettings: Record<string, string> = {
        'game_bonus_capture': '10',
        'game_bonus_goal': '10',
        'game_turn_timeout': '30',
        'game_roll_timeout': '15',
        'xp_game_participation': '20',
        'xp_rank_1': '100',
        'xp_rank_2': '40',
        'xp_rank_3': '15',
        'xp_piece_captured': '5',
        'xp_piece_goal': '10',
        'xp_clean_sheet_win': '25'
    };

    const stmtCheck = db.prepare('SELECT value FROM system_settings WHERE key = ?');
    const stmtInsert = db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)');

    for (const [key, val] of Object.entries(defaultSettings)) {
        if (!stmtCheck.get(key)) {
            console.log(`[DB] limitSettings: Setting default for ${key} = ${val}`);
            stmtInsert.run(key, val);
        }
    }
};

export default db;
