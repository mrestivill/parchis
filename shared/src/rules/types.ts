import { GameState, Player, Piece, MoveResult, PlayerColor, BoardConfig } from '../types';

/**
 * Context for move validation
 */
export interface MoveContext {
    gameState: GameState;
    player: Player;
    piece: Piece;
    pieceIndex: number;
    roll: number;
    turnId: string;
    stateHash: string;
}

/**
 * Context for turn-level operations
 */
export interface TurnContext {
    gameState: GameState;
    player: Player;
    dice: number[];
    pendingBonus?: { amount: number; playerId: string };
    turnId: string;
    stateHash: string;
}

/**
 * Movable piece information
 */
export interface MovablePiece {
    index: number;
    validDice: number[]; // Indices of valid dice, -1 for bonus, -2 for sum of 5
}

/**
 * Priority rules that can be active
 */
export type PriorityRule =
    | 'MANDATORY_NEST_EXIT'
    | 'MANDATORY_BLOCKADE_BREAK'
    | 'NONE';

/**
 * Validator interface
 */
export interface IValidator {
    name: string;
    priority: number;
    validate(context: MoveContext, options?: any): MoveResult;
}
