import type { PlayerColor } from '@parchis/shared';

export interface ThemeVisuals {
    cellRadius?: number;
    cellOpacity?: number;
    showDepth?: boolean;
    logoType?: 'standard' | 'carved' | 'none';
    homeStyle?: 'classic' | 'carved';
    nestStyle?: 'classic' | 'carved';
    pieceStyle?: 'classic' | 'premium';
    shadowColor?: string;
    nestOverlayColor?: string; // Semi-transparent overlay for nest stains
    logoColor?: string; // Color for the carved logo/text
    vignette?: string; // CSS radial-gradient for vignette effect
    grain?: number; // Opacity of the grain texture (0-1)
    innerShadow?: string; // CSS inset box-shadow
    activePlayerGlow?: boolean; // Whether to show a themed glow for the active player
    contrast?: number; // CSS filter contrast (e.g. 1.1)
    brightness?: number; // CSS filter brightness (e.g. 1.05)
    saturate?: number; // CSS filter saturate (e.g. 1.2)
    nestOpacity?: number; // Independent opacity for player nests
    homeOpacity?: number; // Independent opacity for the home center area
    mixBlendMode?: string; // CSS mix-blend-mode for areas (e.g. 'multiply', 'overlay')
    backgroundElements?: 'none' | 'animated-fish' | 'floating-particles'; // Dynamic background decorations
    showGlow?: boolean; // For future neon/cyan effects
}

export interface BoardTheme {
    name: string;
    background: string;
    backgroundImage?: string; // Optional CSS background image
    trackColor: string;
    safeZoneColor: string;
    borderColor: string;
    playerColors: Record<PlayerColor, string>;
    fontStyle: string;
    textColor: string;
    dimColor: string;
    visuals?: ThemeVisuals;
}

// ========== STANDARD THEMES ==========

export const CLASSIC_THEME: BoardTheme = {
    name: 'Classic',
    background: '#ffffff',
    trackColor: '#ffffff',
    safeZoneColor: '#94a3b8', // Darker gray (Slate 400) for special cells
    borderColor: '#334155', // Slate 700 for clean borders
    playerColors: {
        blue: '#2563eb',    // Blue 600 - Modern & Pleasant
        red: '#ef4444',     // Red 500 - Clear
        green: '#22c55e',   // Green 500 - Leaf
        yellow: '#f59e0b',  // Amber 500 - Golden
        purple: '#8b5cf6',  // Violet 500
        orange: '#f97316',  // Orange 500
        gray: '#94a3b8'     // Slate 400
    },
    fontStyle: 'sans-serif',
    textColor: '#1e293b',
    dimColor: '#64748b',
    visuals: {
        cellRadius: 0.1, // Sharper corners for classic feel
        cellOpacity: 1.0, // Fully solid for uniform color
        nestOpacity: 1.0,
        homeOpacity: 1.0,
        showDepth: false, // Flat design
        logoType: 'standard',
        activePlayerGlow: true,
        pieceStyle: 'classic',
        contrast: 1.0,
        brightness: 1.0,
        saturate: 1.0,
        shadowColor: 'rgba(0,0,0,0.05)'
    }
};

export const NEON_THEME: BoardTheme = {
    name: 'Neon Cyber',
    background: '#0a0014',
    backgroundImage: '/assets/cyber_neon_carbon.png',
    trackColor: 'rgba(10, 0, 20, 0.4)',
    safeZoneColor: 'rgba(51, 65, 85, 0.3)',
    borderColor: '#06b6d4',
    playerColors: {
        blue: '#22d3ee',
        red: '#f43f5e',
        green: '#10b981',
        yellow: '#fbbf24',
        purple: '#e879f9',
        orange: '#fb923c',
        gray: '#64748b'
    },
    fontStyle: 'monospace',
    textColor: '#f1f5f9',
    dimColor: '#94a3b8',
    visuals: {
        cellRadius: 0.3,
        cellOpacity: 0.4,
        showDepth: true,
        logoType: 'standard',
        logoColor: '#06b6d4',
        activePlayerGlow: true,
        pieceStyle: 'premium',
        vignette: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.5) 100%)',
        innerShadow: 'inset 0 0 40px rgba(6, 182, 212, 0.25)',
        mixBlendMode: 'screen', // Intense neon glow blend
        nestOpacity: 0.3,
        homeOpacity: 0.2,
        contrast: 1.1,
        brightness: 1.1,
        shadowColor: 'rgba(0,0,0,0.5)'
    }
};

export const OCEAN_THEME: BoardTheme = {
    name: 'Ocean Glass',
    background: '#083344',
    backgroundImage: '/assets/calm_underwater.png',
    trackColor: 'rgba(255, 255, 255, 0.1)',
    safeZoneColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(103, 232, 249, 0.5)',
    playerColors: {
        blue: '#67e8f9',
        red: '#fb7185',
        green: '#34d399',
        yellow: '#fde047',
        purple: '#c084fc',
        orange: '#fdba74',
        gray: '#94a3b8'
    },
    fontStyle: 'sans-serif',
    textColor: '#ecfeff',
    dimColor: '#67e8f9',
    visuals: {
        cellRadius: 0.4,
        cellOpacity: 0.25,
        showDepth: true,
        logoType: 'standard',
        logoColor: '#67e8f9',
        activePlayerGlow: true,
        vignette: 'radial-gradient(circle, transparent 70%, rgba(8, 51, 68, 0.25) 100%)',
        innerShadow: 'inset 0 0 30px rgba(103, 232, 249, 0.15)',
        mixBlendMode: 'overlay', // Color fuses with water ripples
        backgroundElements: 'animated-fish',
        nestOpacity: 0.3,
        homeOpacity: 0.2,
        contrast: 1.05,
        brightness: 1.05,
        pieceStyle: 'premium',
        shadowColor: 'rgba(0,0,0,0.15)'
    }
};

export const GALAXY_THEME: BoardTheme = {
    name: 'Epic Galaxy',
    background: '#0c0a1f',
    backgroundImage: '/assets/andromeda_galaxy.png',
    trackColor: 'rgba(30, 27, 75, 0.3)',
    safeZoneColor: 'rgba(76, 29, 149, 0.4)',
    borderColor: '#a855f7',
    playerColors: {
        blue: '#60a5fa',
        red: '#f472b6',
        green: '#2dd4bf',
        yellow: '#fbbf24',
        purple: '#c084fc',
        orange: '#fb923c',
        gray: '#94a3b8'
    },
    fontStyle: 'sans-serif',
    textColor: '#f3e8ff',
    dimColor: '#7c3aed',
    visuals: {
        cellRadius: 0.3,
        cellOpacity: 0.3,
        showDepth: true,
        logoType: 'standard',
        logoColor: '#f3e8ff',
        activePlayerGlow: true,
        vignette: 'radial-gradient(circle, transparent 40%, rgba(0, 0, 0, 0.7) 100%)',
        innerShadow: 'inset 0 0 40px rgba(168, 85, 247, 0.2)',
        grain: 0.02,
        mixBlendMode: 'screen', // Stars shine through the colors
        nestOpacity: 0.3,
        homeOpacity: 0.2,
        contrast: 1.2,
        brightness: 1.1,
        pieceStyle: 'premium',
        shadowColor: 'rgba(0,0,0,0.6)'
    }
};

// ========== NEW THEMES ==========

export const MODERN_MINIMAL_THEME: BoardTheme = {
    name: 'Modern Minimal',
    background: '#f8fafc', // Slate 50
    trackColor: '#ffffff',
    safeZoneColor: '#e2e8f0', // Slate 200
    borderColor: '#cbd5e1', // Slate 300
    playerColors: {
        blue: '#3b82f6',    // Blue 500
        red: '#f43f5e',     // Rose 500
        green: '#10b981',   // Emerald 500
        yellow: '#f59e0b',  // Amber 500
        purple: '#a855f7',  // Purple 500
        orange: '#f97316',  // Orange 500
        gray: '#94a3b8'     // Slate 400
    },
    fontStyle: "'Outfit', 'Inter', sans-serif",
    textColor: '#334155', // Slate 700
    dimColor: '#94a3b8', // Slate 400
    visuals: {
        cellRadius: 0.8, // Very rounded for a modern look
        cellOpacity: 0.9,
        showDepth: true,
        logoType: 'standard',
        logoColor: '#64748b',
        activePlayerGlow: true,
        pieceStyle: 'premium',
        vignette: 'radial-gradient(circle, transparent 60%, rgba(203, 213, 225, 0.3) 100%)',
        innerShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.02)',
        contrast: 1.02,
        brightness: 1.02,
        saturate: 1.1,
        nestOpacity: 0.8,
        homeOpacity: 0.7,
        shadowColor: 'rgba(0, 0, 0, 0.08)'
    }
};

export const MIDNIGHT_GOLD_THEME: BoardTheme = {
    name: 'Midnight Gold',
    background: '#0f172a', // Slate 900
    trackColor: '#1e293b', // Slate 800
    safeZoneColor: '#334155', // Slate 700
    borderColor: '#d4af37', // Gold metallic
    playerColors: {
        blue: '#3b82f6',
        red: '#f43f5e',
        green: '#10b981',
        yellow: '#f59e0b',
        purple: '#a855f7',
        orange: '#f97316',
        gray: '#64748b'
    },
    fontStyle: "'Outfit', sans-serif",
    textColor: '#f8fafc',
    dimColor: '#94a3b8',
    visuals: {
        cellRadius: 0.6,
        cellOpacity: 0.8,
        showDepth: true,
        logoType: 'standard',
        logoColor: '#d4af37',
        activePlayerGlow: true,
        pieceStyle: 'premium',
        vignette: 'radial-gradient(circle, transparent 50%, rgba(0, 0, 0, 0.8) 100%)',
        innerShadow: 'inset 0 0 30px rgba(212, 175, 55, 0.15)',
        contrast: 1.1,
        brightness: 1.1,
        saturate: 1.2,
        nestOpacity: 0.7,
        homeOpacity: 0.6,
        shadowColor: 'rgba(0, 0, 0, 0.4)'
    }
};

export const AMETHYST_NIGHT_THEME: BoardTheme = {
    name: 'Amethyst Night',
    background: '#1e1b4b', // Indigo 950
    trackColor: 'rgba(30, 27, 75, 0.5)',
    safeZoneColor: 'rgba(67, 56, 202, 0.4)',
    borderColor: '#a855f7', // Purple 500
    playerColors: {
        blue: '#22d3ee', // Cyan
        red: '#f43f5e',
        green: '#34d399',
        yellow: '#fbbf24',
        purple: '#d946ef', // Fuchsia
        orange: '#f97316',
        gray: '#6366f1'
    },
    fontStyle: "'Outfit', sans-serif",
    textColor: '#e0e7ff',
    dimColor: '#818cf8',
    visuals: {
        cellRadius: 1.0, // Maximum roundness
        cellOpacity: 0.3,
        showDepth: true,
        logoType: 'standard',
        logoColor: '#a855f7',
        activePlayerGlow: true,
        pieceStyle: 'premium',
        vignette: 'radial-gradient(circle, transparent 40%, rgba(30, 27, 75, 0.8) 100%)',
        innerShadow: 'inset 0 0 50px rgba(168, 85, 247, 0.2)',
        mixBlendMode: 'screen',
        contrast: 1.2,
        brightness: 1.2,
        saturate: 1.4,
        nestOpacity: 0.4,
        homeOpacity: 0.3,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
    }
};

export const DEEP_FOREST_THEME: BoardTheme = {
    name: 'Deep Forest',
    background: '#064e3b', // Emerald 950
    trackColor: '#ecfdf5', // Emerald 50
    safeZoneColor: '#d1fae5', // Emerald 100
    borderColor: '#065f46', // Emerald 800
    playerColors: {
        blue: '#1d4ed8',
        red: '#991b1b',
        green: '#065f46',
        yellow: '#92400e',
        purple: '#581c87',
        orange: '#9a3412',
        gray: '#374151'
    },
    fontStyle: "'Outfit', serif",
    textColor: '#064e3b',
    dimColor: '#065f46',
    visuals: {
        cellRadius: 0.4,
        cellOpacity: 0.9,
        showDepth: true,
        logoType: 'standard',
        logoColor: '#065f46',
        activePlayerGlow: true,
        pieceStyle: 'premium',
        vignette: 'radial-gradient(circle, transparent 60%, rgba(6, 78, 59, 0.4) 100%)',
        innerShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.1)',
        contrast: 1.05,
        brightness: 1.05,
        saturate: 1.1,
        nestOpacity: 0.8,
        homeOpacity: 0.7,
        shadowColor: 'rgba(0, 0, 0, 0.2)'
    }
};

export const ARTISAN_WOOD_THEME: BoardTheme = {
    name: 'Artisan Wood',
    background: '#f2e8cf', // Light creamy wood base
    backgroundImage: '/assets/artisan_wood.png',
    trackColor: 'rgba(212, 163, 115, 0.2)',
    safeZoneColor: 'rgba(69, 26, 3, 0.12)', // Darker wood stain for safe zones
    borderColor: '#78350f', // Warm dark brown for carved lines
    playerColors: {
        blue: '#1d4ed8',
        red: '#b91c1c',
        green: '#15803d',
        yellow: '#eab308',
        purple: '#7e22ce',
        orange: '#c2410c',
        gray: '#4b5563'
    },
    fontStyle: "'Spectral', serif",
    textColor: '#451a03', // Deep wood brown
    dimColor: '#78350f',
    visuals: {
        cellRadius: 0.25,
        cellOpacity: 0.55, // Stained glass effect over wood
        showDepth: true,
        logoType: 'carved',
        homeStyle: 'carved',
        nestStyle: 'carved',
        nestOverlayColor: 'rgba(69, 26, 3, 0.05)',
        logoColor: '#451a03',
        vignette: 'radial-gradient(circle, transparent 60%, rgba(6, 78, 59, 0.4) 100%)',
        innerShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.15)',
        mixBlendMode: 'multiply', // Crucial for the stained look
        nestOpacity: 0.2,
        homeOpacity: 0.1,
        contrast: 1.1,
        brightness: 1.05,
        pieceStyle: 'premium',
        shadowColor: 'rgba(0, 0, 0, 0.3)'
    }
};

// ========== SEASONAL THEMES ==========

export const WINTER_THEME: BoardTheme = {
    name: 'Ice Frost',
    background: '#7dd3fc',
    backgroundImage: '/assets/winter_texture.png',
    trackColor: 'rgba(255, 255, 255, 0.3)',
    safeZoneColor: 'rgba(186, 230, 253, 0.5)',
    borderColor: '#0ea5e9',
    playerColors: {
        blue: '#0284c7',
        red: '#dc2626',
        green: '#059669',
        yellow: '#f59e0b',
        purple: '#7c3aed',
        orange: '#ea580c',
        gray: '#475569'
    },
    fontStyle: 'sans-serif',
    textColor: '#0c4a6e',
    dimColor: '#0369a1',
    visuals: {
        cellRadius: 0.4,
        cellOpacity: 0.4,
        showDepth: true,
        logoType: 'standard',
        activePlayerGlow: true,
        vignette: 'radial-gradient(circle, transparent 70%, rgba(125, 211, 252, 0.2) 100%)',
        grain: 0.01,
        innerShadow: 'inset 0 0 30px rgba(255, 255, 255, 0.3)',
        mixBlendMode: 'overlay', // Ice reflection blend
        nestOpacity: 0.3,
        homeOpacity: 0.2,
        contrast: 1.1,
        brightness: 1.05,
        pieceStyle: 'premium'
    }
};

export const HALLOWEEN_THEME: BoardTheme = {
    name: 'Haunted Mansion',
    background: '#1a0a00',
    backgroundImage: '/assets/haunted_mansion_wood.png',
    trackColor: 'rgba(45, 27, 0, 0.5)',
    safeZoneColor: 'rgba(74, 44, 0, 0.6)',
    borderColor: '#ff6600',
    playerColors: {
        blue: '#8b5cf6',
        red: '#dc2626',
        green: '#10b981',
        yellow: '#f59e0b',
        purple: '#a855f7',
        orange: '#ff6600',
        gray: '#475569'
    },
    fontStyle: 'sans-serif',
    textColor: '#ff9933',
    dimColor: '#cc6600',
    visuals: {
        cellRadius: 0.3,
        cellOpacity: 0.5,
        showDepth: true,
        logoType: 'carved',
        logoColor: '#ff6600',
        activePlayerGlow: true,
        vignette: 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.6) 100%)',
        grain: 0.02,
        innerShadow: 'inset 0 0 50px rgba(0,0,0,0.4)',
        mixBlendMode: 'multiply', // Haunted stain blend
        nestOpacity: 0.3,
        homeOpacity: 0.2,
        contrast: 1.25,
        brightness: 1.1,
        pieceStyle: 'premium',
        shadowColor: 'rgba(255, 102, 0, 0.25)'
    }
};

export const WOOD_THEME: BoardTheme = {
    name: 'Realistic Wood',
    background: '#3e2723',
    backgroundImage: '/assets/mahogany_texture.png',
    trackColor: '#1a0f0a',
    safeZoneColor: '#2a1810',
    borderColor: '#d4a373',
    playerColors: {
        blue: '#1e3a8a',
        red: '#7f1d1d',
        green: '#14532d',
        yellow: '#b45309',
        purple: '#581c87',
        orange: '#9a3412',
        gray: '#5d4037'
    },
    fontStyle: 'serif',
    textColor: '#f5deb3',
    dimColor: '#8d6e63',
    visuals: {
        cellRadius: 0.3,
        cellOpacity: 0.4,
        showDepth: true,
        logoType: 'carved',
        homeStyle: 'carved',
        nestStyle: 'carved',
        nestOverlayColor: 'rgba(62, 39, 35, 0.15)', // Traditional dark wood stain
        logoColor: '#d4af37', // Gold metallic for better contrast on dark wood
        vignette: 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.4) 100%)',
        grain: 0.02, // Minimal grain
        innerShadow: 'inset 0 0 30px rgba(0,0,0,0.3)',
        mixBlendMode: 'multiply', // Dyes the wood grain
        nestOpacity: 0.3,
        homeOpacity: 0.2, // Subtle home area separation
        activePlayerGlow: true,
        contrast: 1.15,
        brightness: 1.1,
        pieceStyle: 'premium',
        shadowColor: 'rgba(0,0,0,0.4)'
    }
};

export const MARBLE_THEME: BoardTheme = {
    name: 'Black Marble',
    background: '#000000',
    backgroundImage: '/assets/black_marble_texture.png',
    trackColor: '#111827', // Gray 900
    safeZoneColor: '#1f2937', // Gray 800
    borderColor: '#94a3b8', // Slate 400 (Silver look)
    playerColors: {
        blue: '#3b82f6',
        red: '#f43f5e', // Brighter red
        green: '#10b981', // Brighter green
        yellow: '#f59e0b',
        purple: '#8b5cf6',
        orange: '#f97316',
        gray: '#64748b'
    },
    fontStyle: 'serif',
    textColor: '#f1f5f9',
    dimColor: '#64748b',
    visuals: {
        cellRadius: 0.5,
        cellOpacity: 0.15, // Reduced from 0.5 to show more marble
        showDepth: true,
        logoType: 'carved',
        logoColor: '#f8fafc', // Brighter Silver/Slate for maximum clarity
        vignette: 'radial-gradient(circle, transparent 80%, rgba(0,0,0,0.2) 100%)', // Even softer
        grain: 0.01, // Minimal for texture feel
        mixBlendMode: 'soft-light', // Fuses naturally with marble veins
        nestOpacity: 0.3,
        homeOpacity: 0.2,
        innerShadow: 'inset 0 0 30px rgba(0,0,0,0.25)', // Softer depth
        activePlayerGlow: true,
        homeStyle: 'carved',
        nestStyle: 'carved',
        nestOverlayColor: 'rgba(255, 255, 255, 0.03)', // Even more subtle
        pieceStyle: 'premium',
        shadowColor: 'rgba(0,0,0,0.4)'
    }
};

export const WHITE_MARBLE_THEME: BoardTheme = {
    name: 'White Marble',
    background: '#ffffff',
    backgroundImage: '/assets/white_marble_texture.png',
    trackColor: 'rgba(248, 250, 252, 0.4)',
    safeZoneColor: 'rgba(71, 85, 105, 0.35)',
    borderColor: '#94a3b8',
    playerColors: {
        blue: '#3b82f6',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        purple: '#8b5cf6',
        orange: '#f97316',
        gray: '#94a3b8'
    },
    fontStyle: 'serif',
    textColor: '#1e293b',
    dimColor: '#94a3b8',
    visuals: {
        cellRadius: 0.8,
        cellOpacity: 0.2,
        showDepth: true,
        logoType: 'carved',
        logoColor: '#475569',
        vignette: 'radial-gradient(circle, transparent 70%, rgba(0,0,0,0.1) 100%)',
        grain: 0.01,
        innerShadow: 'inset 0 0 20px rgba(0,0,0,0.05)',
        activePlayerGlow: true,
        contrast: 1.05,
        brightness: 1.05,
        saturate: 1.0,
        homeOpacity: 0.2,
        nestOpacity: 0.3,
        homeStyle: 'carved',
        nestStyle: 'carved',
        nestOverlayColor: 'rgba(0, 0, 0, 0.04)',
        pieceStyle: 'premium',
        shadowColor: 'rgba(0,0,0,0.2)'
    }
};

export const ALL_THEMES: BoardTheme[] = [
    CLASSIC_THEME,
    MODERN_MINIMAL_THEME,
    MIDNIGHT_GOLD_THEME,
    AMETHYST_NIGHT_THEME,
    DEEP_FOREST_THEME,
    NEON_THEME,
    OCEAN_THEME,
    GALAXY_THEME,
    WINTER_THEME,
    HALLOWEEN_THEME,
    WOOD_THEME,
    MARBLE_THEME,
    WHITE_MARBLE_THEME,
    ARTISAN_WOOD_THEME
];
