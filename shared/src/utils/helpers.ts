/**
 * Helper utilities for game logic
 */

/**
 * Get safe position indices on the board
 * Safe positions are: start positions (4, 21, 38, 55) and mid-segment positions
 */
export function getSafeIndices(): number[] {
    return [4, 11, 16, 21, 28, 33, 38, 45, 50, 55, 62, 67];
}

/**
 * Get board index with wrapping
 */
export function getBoardIndex(distance: number, startOffset: number, totalCommon: number): number {
    return (startOffset + distance) % totalCommon;
}

/**
 * Create a simple hash of game state for caching
 */
export function hashGameState(state: any): string {
    // Simple hash based on turn and dice
    return `${state.currentTurn}:${state.totalTurns}:${state.dice.join(',')}`;
}
