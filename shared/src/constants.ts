import { PlayerColor, BoardConfig } from './types';

// Standard Ludo/Parchis: 17 spaces per arm.
// 4 Players: 17 * 4 = 68 spaces.
// 6 Players: 17 * 6 = 102 spaces.

export const BOARD_CONFIG_4: BoardConfig = {
    playerCount: 4,
    totalCommonSpaces: 68,
    spacesPerSegment: 17,
    // Safe spaces are usually at index 0, 5, 12 in each segment?
    // Let's assume standard: 5, 12, 17(next 0)
    // Actually usually relative 0 (start), 5(safe), 12(safe). 
    // Let's define safe positions absolutely later or use a function.
    safePositions: [] // To be filled dynamically or explicitly
};

export const BOARD_CONFIG_6: BoardConfig = {
    playerCount: 6,
    totalCommonSpaces: 102,
    spacesPerSegment: 17,
    safePositions: []
};

export const COLORS_4: PlayerColor[] = ['yellow', 'blue', 'red', 'green'];
export const COLORS_6: PlayerColor[] = ['yellow', 'purple', 'blue', 'green', 'orange', 'red']; // Standardish 6p circle

export const COLOR_QUADRANTS_4: Record<PlayerColor, number> = {
    'blue': 0,
    'red': 1,
    'green': 2,
    'yellow': 3,
    'purple': -1, // N/A
    'orange': -1, // N/A
    'gray': -1   // N/A
};

// Special Position Codes
export const POS_NEST = -1;
export const POS_HOME_PATH_START = 1000; // Base for home path indices. 1000 + 0, 1000 + 1...
export const POS_GOAL = 2000;

export const HOME_PATH_LENGTH = 7; // 7 spaces then Goal

// Rules
export const DICE_MAX = 6;
export const ROLL_TIMEOUT = 15; // seconds to roll
export const MOVE_TIMEOUT = 30; // seconds to move after rolling
export const EXTRA_TURN_ROLLS = [6]; // No longer used in current doubles-based turn logic
// Parchis Spanish Rules:
// 5 to exit nest.
// 6 gives another turn. Eaten -> count 20. Goal -> count 10.
// 3x6 -> return to nest (unless on safe/home path).
// Blockades: 2 pieces of same color in safe space.
