import { GameState, Player, Piece, MoveResult, PlayerColor } from './types';
import {
    BOARD_CONFIG_4,
    BOARD_CONFIG_6,
    POS_NEST,
    POS_GOAL,
    POS_HOME_PATH_START,
    HOME_PATH_LENGTH,
    EXTRA_TURN_ROLLS,
    COLOR_QUADRANTS_4
} from './constants';
import { RuleEngine } from './rules/RuleEngine';
import { getSafeIndices as getSafeIndicesHelper } from './utils/helpers';

export const getBoardConfig = (playerCount: number) => {
    return playerCount === 6 ? BOARD_CONFIG_6 : BOARD_CONFIG_4;
};

// Calculate start position on the main track for a given color/index
export const getStartPosition = (color: PlayerColor, spacesPerSegment: number, playerCount: number): number => {
    // Start is at relative index 4 (5th space)

    let segmentIndex = 0;
    if (playerCount === 4) {
        segmentIndex = COLOR_QUADRANTS_4[color];
    } else {
        // TODO: Map 6 players
        segmentIndex = 0;
    }

    return (segmentIndex * spacesPerSegment) + 4;
};

// Calculate entry to home path
export const getHomeEntrancePosition = (color: PlayerColor, spacesPerSegment: number, totalSpaces: number, playerCount: number): number => {
    // Entrance Logic:
    // Entrance is the cell BEFORE the start segment.
    // Blue (Seg 0) Start 4. Entrance 67.
    // Red (Seg 1) Start 21. Entrance 16.
    // Formula: (Segment * 17) - 1.
    let segmentIndex = 0;
    if (playerCount === 4) {
        segmentIndex = COLOR_QUADRANTS_4[color];
    }
    return ((segmentIndex * spacesPerSegment) - 1 + totalSpaces) % totalSpaces;
};

// Helper to get normalized board index
const getBoardIndex = (distance: number, startOffset: number, totalCommon: number) => {
    return (startOffset + distance) % totalCommon;
};

// Helper to get pieces at a specific position (Exported for reuse if needed, but primarily internal helper)
export const getPiecesAt = (gameState: GameState, pos: number, status: string) => {
    const pieces: Piece[] = [];
    gameState.players.forEach(p => {
        p.pieces.forEach(pc => {
            if (pc.position === pos && pc.status === status) {
                pieces.push(pc);
            }
        });
    });
    return pieces;
};

export const getSafeIndices = () => {
    return [4, 11, 16, 21, 28, 33, 38, 45, 50, 55, 62, 67];
};

export const getPlayerBlockades = (gameState: GameState, player: Player): number[] => {
    // Find all blockades involving this player
    const myBlockadesIndices: number[] = [];
    const isSafePos = (pos: number) => getSafeIndices().includes(pos);

    // Scan all my pieces
    player.pieces.forEach((myPiece, myIdx) => {
        if (myPiece.status === 'active' || myPiece.status === 'home_path') {
            const piecesAtPos = getPiecesAt(gameState, myPiece.position, myPiece.status);

            // Case 1: 2 pieces of mine
            const myPiecesAtPos = piecesAtPos.filter(p => p.color === player.color);
            if (myPiecesAtPos.length === 2) {
                myBlockadesIndices.push(myIdx);
                return;
            }

            // Case 2: Me + Another in Safe Space
            if (piecesAtPos.length === 2 && isSafePos(myPiece.position)) {
                // One is me (myPiece), check if other is enemy
                const hasEnemy = piecesAtPos.some(p => p.color !== player.color);
                if (hasEnemy) {
                    myBlockadesIndices.push(myIdx);
                }
            }
        }
    });
    return myBlockadesIndices;
};

export const canMovePiece = (
    gameState: GameState,
    pieceIndex: number,
    roll: number
): boolean => {
    // Basic validation hook
    // Check move logic
    return validateMove(gameState, pieceIndex, roll).valid;
};

export const canPlayerMove = (gameState: GameState): boolean => {
    const player = gameState.players.find(p => p.color === gameState.currentTurn);
    if (!player) return false;

    // Check for Pending Bonus (FORCE VALIDITY)
    if (gameState.pendingBonus && gameState.pendingBonus.playerId === player.id) {
        // We have a bonus to use! Check if any piece can move this amount
        // Note: validateMove checks rules. If bonus is 20, we need a piece that can move 20.
        for (let i = 0; i < player.pieces.length; i++) {
            if (validateMove(gameState, i, gameState.pendingBonus.amount).valid) return true;
        }
        // If we have bonus but NO piece can move it, usually server auto-skips.
        // But for UI "Can I move?", return false (stuck) is technically correct, 
        // but we want to know if "User has inputs". 
        // If bonus is pending, User SHOULD input.
        return false; // Server handles the skip if false? 
        // Actually, logic.ts is used by Server to "Auto Skip".
        // So if we return false here, Server skips turn. Correct.
    }

    // If dice not rolled or empty, can't move (unless we consider the roll action itself, but this checks piece movement)
    if (!gameState.diceRolled || gameState.dice.length === 0) return false;

    // Check all pieces against all dice
    // Also check the special "Sum of 5" rule for Nest
    // Actually, validateMove doesn't fully handle the "Sum of 5" internally independently of the 'roll' argument
    // The current validateMove takes a single 'roll'. 
    // We need to check:
    // 1. Each die individually for each piece.
    // 2. The pair of dice summing to 5 for pieces in nest (if 2 dice present).
    const activeDice = gameState.dice.filter(d => d !== 0);

    for (let i = 0; i < player.pieces.length; i++) {
        const piece = player.pieces[i];

        // 1. Check individual dice
        for (const die of activeDice) {
            if (validateMove(gameState, i, die).valid) return true;
        }

        // 2. Check Sum of 5 (only if 2 dice avail and piece in nest)
        // Note: validateMove logic for nest says: "if (roll === 5)" -> valid.
        // So if we pass 5, it checks if it can exit.
        // We just need to verify we HAVE the dice to make 5.
        if (piece.status === 'nest' && activeDice.length === 2) {
            if (activeDice[0] + activeDice[1] === 5) {
                if (validateMove(gameState, i, 5).valid) return true;
            }
        }
    }

    return false;
};

export interface ValidateMoveOptions {
    checkBlockadeRule?: boolean;
}

export const validateMove = (
    gameState: GameState,
    pieceIndex: number,
    roll: number,
    options: ValidateMoveOptions = { checkBlockadeRule: true }
): MoveResult => {
    // Use new RuleEngine for validation
    return RuleEngine.validateMove(gameState, pieceIndex, roll, options);
};

