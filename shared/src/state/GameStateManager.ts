import { GameState, Player, Piece, MoveResult } from '../types';
import { ROLL_TIMEOUT } from '../constants';

/**
 * Manages game state with immutable operations
 * All state mutations go through this manager
 */
export class GameStateManager {
    /**
     * Apply a validated move to the game state
     * Returns new state without mutating the original
     */
    static applyMove(
        state: GameState,
        pieceIndex: number,
        moveResult: MoveResult
    ): GameState {
        if (!moveResult.valid) {
            return state; // No changes for invalid moves
        }

        const newState = { ...state };
        const player = newState.players.find(p => p.color === newState.currentTurn);
        if (!player) return state;

        // Clone player and piece
        const playerIndex = newState.players.findIndex(p => p.id === player.id);
        newState.players = [...newState.players];
        newState.players[playerIndex] = { ...player, pieces: [...player.pieces] };
        const updatedPlayer = newState.players[playerIndex];

        const piece = { ...updatedPlayer.pieces[pieceIndex] };
        updatedPlayer.pieces[pieceIndex] = piece;

        // Track last moved piece
        newState.lastMovedPieceId = piece.id;

        // Update piece position and status
        if (moveResult.newPosition !== undefined) {
            piece.position = moveResult.newPosition;
            piece.lastMovedTime = Date.now();

            // Track nest exits
            if (piece.status === 'nest') {
                newState.piecesExitedCount = (newState.piecesExitedCount || 0) + 1;
            }
        }

        if (moveResult.newDistanceFromStart !== undefined) {
            piece.distanceFromStart = moveResult.newDistanceFromStart;
        }

        // Update status
        if (moveResult.enteredGoal) {
            piece.status = 'goal';
        } else if (moveResult.newPosition !== undefined && moveResult.newPosition >= 1000) {
            piece.status = 'home_path';
        } else if (piece.status === 'nest' && moveResult.newPosition !== undefined) {
            piece.status = 'active';
        }

        // Handle captures
        if (moveResult.capturedPieceId) {
            newState.players = newState.players.map(p => {
                const victimPiece = p.pieces.find(pc => pc.id === moveResult.capturedPieceId);
                if (victimPiece) {
                    return {
                        ...p,
                        pieces: p.pieces.map(pc =>
                            pc.id === moveResult.capturedPieceId
                                ? { ...pc, status: 'nest' as const, position: -1, distanceFromStart: 0 }
                                : pc
                        )
                    };
                }
                return p;
            });
        }

        // Clear blockade break flag after first move
        newState.blockadeBreakRequired = false;

        // Track original position for anti-rolling blockade rule
        const originalStatus = state.players.find(p => p.color === player.color)?.pieces[pieceIndex].status;
        const originalPosition = state.players.find(p => p.color === player.color)?.pieces[pieceIndex].position;
        const originalId = state.players.find(p => p.color === player.color)?.pieces[pieceIndex].id;

        // Update forbidden moves for anti-rolling blockade
        if ((originalStatus === 'active' || originalStatus === 'home_path') && moveResult.newPosition !== undefined) {
            const piecesAtOldPos = state.players
                .flatMap(p => p.pieces)
                .filter(p =>
                    p.position === originalPosition &&
                    p.status === originalStatus &&
                    p.color === piece.color &&
                    p.id !== piece.id
                );

            // If there was exactly one other piece (blockade of 2), forbid it from moving to the same new spot
            if (piecesAtOldPos.length === 1) {
                const partner = piecesAtOldPos[0];
                if (!newState.forbiddenMoves) newState.forbiddenMoves = [];

                newState.forbiddenMoves = [
                    ...newState.forbiddenMoves,
                    {
                        pieceId: partner.id,
                        forbiddenPosition: moveResult.newPosition
                    }
                ];
            }
        }

        return newState;
    }

    /**
     * Roll dice and update state
     */
    static rollDice(state: GameState, d1: number, d2: number): GameState {
        const newState = { ...state };

        newState.dice = [d1, d2];
        newState.diceRolled = true;
        newState.piecesExitedCount = 0;

        // Update consecutive doubles
        if (d1 === d2) {
            newState.consecutiveDoubles = (state.consecutiveDoubles || 0) + 1;
        } else {
            newState.consecutiveDoubles = 0;
        }

        return newState;
    }

    /**
     * Clean up turn-scoped state
     */
    static cleanupTurnState(state: GameState): GameState {
        return {
            ...state,
            diceRolled: false,
            dice: [],
            lastMovedPieceId: undefined,
            blockadeBreakRequired: false,
            forbiddenMoves: [],
            pendingBonus: undefined,
            piecesExitedCount: 0,
            initialTurnStartBlocked: false,
            consecutiveDoubles: 0,
            totalTurns: state.totalTurns + 1
        };
    }

    /**
     * Initialize turn state (set timer, etc)
     */
    static initializeTurnState(state: GameState, timeout: number = ROLL_TIMEOUT * 1000): GameState {
        return {
            ...state,
            turnExpireTimestamp: Date.now() + timeout
        };
    }

    /**
     * Move to next player's turn
     */
    static nextTurn(state: GameState, turnDuration: number = ROLL_TIMEOUT): GameState {
        let newState = this.cleanupTurnState(state);

        // Find next player
        const currentIndex = newState.players.findIndex(p => p.color === newState.currentTurn);
        if (currentIndex !== -1 && newState.players.length > 0) {
            const nextIndex = (currentIndex + 1) % newState.players.length;
            newState.currentTurn = newState.players[nextIndex].color;
        }

        // Use configured turnRollDuration if available, otherwise default or argument
        const duration = state.options?.turnRollDuration || turnDuration;

        // Use passed turnDuration (seconds) -> convert to ms
        newState = this.initializeTurnState(newState, duration * 1000);

        return newState;
    }

    /**
     * Grant bonus move to player
     */
    static grantBonus(state: GameState, playerId: string, amount: number): GameState {
        return {
            ...state,
            pendingBonus: { amount, playerId }
        };
    }

    /**
     * Clear bonus
     */
    static clearBonus(state: GameState): GameState {
        return {
            ...state,
            pendingBonus: undefined
        };
    }

    /**
     * Use a die (set to 0)
     */
    static useDie(state: GameState, dieIndex: number): GameState {
        const newDice = [...state.dice];
        newDice[dieIndex] = 0;
        return {
            ...state,
            dice: newDice
        };
    }

    /**
     * Use multiple dice (for sum of 5)
     */
    static useDice(state: GameState, dieIndices: number[]): GameState {
        const newDice = [...state.dice];
        dieIndices.forEach(idx => {
            newDice[idx] = 0;
        });
        return {
            ...state,
            dice: newDice
        };
    }
}
