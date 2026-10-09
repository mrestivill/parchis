import type { PlayerColor } from '@parchis/shared';

/**
 * Convert PlayerColor to hex color code
 */
export const getPlayerColorHex = (color: PlayerColor): string => {
    const colorMap: Record<PlayerColor, string> = {
        yellow: '#fbbf24',
        blue: '#3b82f6',
        red: '#ef4444',
        green: '#22c55e',
        orange: '#f97316',
        purple: '#a855f7',
        gray: '#6b7280'
    };
    return colorMap[color] || '#3b82f6';
};

/**
 * Get a semi-transparent version of the player color for glows
 */
export const getPlayerColorRGBA = (color: PlayerColor, alpha: number = 0.5): string => {
    const hex = getPlayerColorHex(color);
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
