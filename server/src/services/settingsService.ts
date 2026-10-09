
import db from '../db';

export interface SystemSettings {
    game_bonus_capture: number;
    game_bonus_goal: number;
    game_turn_timeout: number;
    game_roll_timeout: number;
    xp_game_participation: number;
    xp_rank_1: number;
    xp_rank_2: number;
    xp_rank_3: number;
    xp_piece_captured: number;
    xp_piece_goal: number;
    xp_clean_sheet_win: number;
    [key: string]: number;
}

export const settingsService = {
    getSettings: (): SystemSettings => {
        const rows = db.prepare('SELECT key, value FROM system_settings').all() as { key: string, value: string }[];

        const settings: any = {
            game_bonus_capture: 10,
            game_bonus_goal: 10,
            game_turn_timeout: 30,
            game_roll_timeout: 15,
            xp_game_participation: 20,
            xp_rank_1: 100,
            xp_rank_2: 40,
            xp_rank_3: 15,
            xp_piece_captured: 5,
            xp_piece_goal: 10,
            xp_clean_sheet_win: 25
        };

        rows.forEach(r => {
            const num = Number(r.value);
            if (!isNaN(num)) {
                settings[r.key] = num;
            }
        });

        return settings;
    },

    updateSetting: (key: string, value: string | number) => {
        const stmt = db.prepare(`
            INSERT INTO system_settings (key, value, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `);
        stmt.run(key, String(value));
    },

    updateSettings: (newSettings: Partial<SystemSettings>) => {
        const stmt = db.prepare(`
            INSERT INTO system_settings (key, value, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `);

        const transaction = db.transaction((settings: Partial<SystemSettings>) => {
            for (const [key, value] of Object.entries(settings)) {
                stmt.run(key, String(value));
            }
        });

        transaction(newSettings);
    }
};
