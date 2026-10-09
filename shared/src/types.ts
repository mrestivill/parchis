export type PlayerColor = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'orange' | 'gray';

export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';

export interface Piece {
    id: string; // e.g., 'red-0', 'red-1'
    color: PlayerColor;
    position: number; // 0-based index on the main track, or specific codes for Home/Goal/Nest
    isSafe: boolean; // Computed based on position
    status: 'nest' | 'active' | 'home_path' | 'goal';
    distanceFromStart: number; // To track progress towards goal
    lastMovedTime?: number; // Timestamp of the last move to determine arrival order
}

export interface GameParticipantStats {
    piecesCaptured: number;
    piecesLost: number;
    doublesRolled: number;
    totalMoves: number;
    totalDiceValue: number;
    onesRolled: number;
}

export interface Player {
    id: string; // Socket ID
    userId?: number; // DB ID (if registered)
    guestId?: string; // Persistent ID for guests
    color: PlayerColor;
    name: string;
    pieces: Piece[];
    isConnected: boolean;
    hasLeft: boolean;
    rank?: number; // 1st, 2nd, etc.
    stats?: GameParticipantStats;
}

export interface Spectator {
    id: string; // Socket ID
    name: string;
    isConnected: boolean;
}

export interface GameOptions {
    allowSpectators: boolean;
    spectatorCanReadChat: boolean;
    spectatorCanWriteChat: boolean;
    allowLateJoin: boolean;
    timeBonusOnCapture: number; // Seconds to add
    timeBonusOnGoal: number; // Seconds to add
    turnDuration: number; // Seconds for move phase (base)
    turnRollDuration: number; // Seconds for roll phase
}

export interface BoardConfig {
    playerCount: 4 | 6;
    totalCommonSpaces: number;
    spacesPerSegment: number; // usually 17
    safePositions: number[]; // relative to the board or segment? Best to have absolute indices
}

export interface GameState {
    roomId: string;
    status: GameStatus;
    players: Player[];
    currentTurn: PlayerColor;
    dice: number[]; // [die1, die2]
    diceRolled: boolean;
    lastActionTimestamp: number;
    startTime?: number;
    totalTurns: number;
    winner?: PlayerColor;
    turnTimeLeft: number; // Seconds (Legacy, maybe remove?)
    turnExpireTimestamp?: number; // Absolute time when turn ends
    pendingBonus?: {
        amount: number; // 20 for capture, 10 for goal
        playerId: string;
    },
    consecutiveDoubles: number;
    lastMovedPieceId?: string;
    blockadeBreakRequired?: boolean;
    forbiddenMoves?: { pieceId: string, forbiddenPosition: number }[]; // Specific moves forbidden for specific pieces
    initialTurnStartBlocked?: boolean; // If true, player was blocked at start of turn and CANNOT exit nest even if cleared
    gameVersion?: number; // Increments on restart to force client refresh
    piecesExitedCount?: number; // Track how many pieces exited nest this turn (Max 1)
    spectators: Spectator[];
    options: GameOptions;
    restartVotes: string[]; // Array of playerIds who voted to restart
    captureHistory?: {
        capturerId: string;
        victimId: string;
        timestamp: number;
    }[];
}

// Move validation result
export interface MoveResult {
    valid: boolean;
    reason?: string;
    newPosition?: number;
    capturedPieceId?: string; // If a piece was captured
    enteredGoal?: boolean;
    newDistanceFromStart?: number; // Explicitly set new distance
    bonusMove?: boolean; // If true, player gets bonus (e.g. 20 moves)
}

export interface ChatMessage {
    id: string;
    sender: string; // Player Name
    senderColor: PlayerColor;
    text: string;
    timestamp: number;
    isSystem?: boolean;
}

export type LogType = 'move' | 'capture' | 'goal' | 'turn_change' | 'dice_roll' | 'game_start' | 'game_end';

export interface GameLogEntry {
    id: string;
    timestamp: number;
    type: LogType;
    text: string;
    playerColor?: PlayerColor; // Color related to the action
    relatedPieceId?: string; // Optional, for future tooltips
}

// Emote System - Supports both static emoji and animated images
export type EmoteId =
    // Existing emotes
    'laugh' | 'angry' | 'cool' | 'cry' | 'surprised' | 'ghost' | 'heart' | 'sleep' |
    // New emotes - Reactions
    'rolling' | 'party' | 'thinking' | 'shocked' |
    // New emotes - Game Actions
    'target' | 'fire' | 'lightning' | 'dice';

export interface Emote {
    id: EmoteId;
    emoji?: string;      // For static emojis
    image?: string;      // For animated images (URL or data URI)
    animated?: boolean;  // True if using animated image
}

export const EMOTES: Emote[] = [
    // Original 8 emotes
    { id: 'laugh', image: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.gif', animated: true },
    { id: 'angry', image: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f621/512.gif', animated: true },
    { id: 'cool', image: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.gif', animated: true },
    { id: 'cry', image: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.gif', animated: true },
    { id: 'surprised', image: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f632/512.gif', animated: true },
    { id: 'ghost', image: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f47b/512.gif', animated: true },
    { id: 'heart', image: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.gif', animated: true },
    { id: 'sleep', image: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f634/512.gif', animated: true },

    // New emotes - Reactions (with animated versions!)
    { id: 'rolling', image: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f923/512.gif', animated: true },
    {
        id: 'party',
        image: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.gif',
        animated: true
    },
    {
        id: 'thinking',
        image: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.gif',
        animated: true
    },
    {
        id: 'shocked',
        image: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f631/512.gif',
        animated: true
    },

    // New emotes - Game Actions (with animated versions!)
    { id: 'target', image: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3af/512.gif', animated: true },
    {
        id: 'fire',
        image: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif',
        animated: true
    },
    { id: 'lightning', image: 'https://fonts.gstatic.com/s/e/notoemoji/latest/26a1/512.gif', animated: true },
    { id: 'dice', image: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3b2/512.gif', animated: true }
];

export interface RoomDetails {
    roomId: string;
    playerCount: number;
    maxPlayers: number;
    availableColors: PlayerColor[];
    players: { name: string, color: PlayerColor }[];
    spectatorCount: number;
    allowSpectators: boolean;
}
