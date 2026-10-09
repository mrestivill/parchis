import { GameState, MoveResult, Player, Piece } from '../types';
import { MoveContext, TurnContext, MovablePiece, PriorityRule } from './types';
import { ValidationCache } from './cache/ValidationCache';
import { BlockadeValidator } from './validators/BlockadeValidator';
import { NestExitValidator } from './validators/NestExitValidator';
import { PathValidator } from './validators/PathValidator';
import { DestinationValidator } from './validators/DestinationValidator';

/**
 * Main rule engine that coordinates all validators
 * Applies rules in priority order and caches results
 */
export class RuleEngine {
    private static cache = new ValidationCache();

    private static validators = [
        new BlockadeValidator(),
        new NestExitValidator(),
        new PathValidator(),
        new DestinationValidator()
    ].sort((a, b) => a.priority - b.priority);

    /**
     * Validate a move with full rule checking
     */
    static validateMove(
        gameState: GameState,
        pieceIndex: number,
        roll: number,
        options: { checkBlockadeRule?: boolean } = { checkBlockadeRule: true }
    ): MoveResult {
        const player = gameState.players.find(p => p.color === gameState.currentTurn);
        if (!player) {
            return { valid: false, reason: 'Player not found' };
        }

        const piece = player.pieces[pieceIndex];
        if (!piece) {
            return { valid: false, reason: 'Piece not found' };
        }

        // Create context
        const turnId = `${gameState.currentTurn}-${gameState.totalTurns}`;
        const stateHash = this.getStateHash(gameState);

        const context: MoveContext = {
            gameState,
            player,
            piece,
            pieceIndex,
            roll,
            turnId,
            stateHash
        };

        // Update cache context
        this.cache.updateContext(turnId, stateHash);

        // Check cache
        const cached = this.cache.get(piece.id, roll);
        if (cached) {
            return cached;
        }

        // Run validators in priority order
        let finalResult: MoveResult = { valid: true };

        for (const validator of this.validators) {
            const result = validator.validate(context, options);

            if (!result.valid) {
                // Cache and return failure
                this.cache.set(piece.id, roll, result);
                return result;
            }

            // Capture move details (newPosition, capturedPieceId, etc.) from validators that provide them
            if (result.newPosition !== undefined || result.enteredGoal || result.capturedPieceId) {
                finalResult = { ...finalResult, ...result };
            }
        }

        // Return the accumulated valid result
        this.cache.set(piece.id, roll, finalResult);
        return finalResult;
    }

    /**
     * Get all movable pieces for current player
     * Optimized with early exit for priority rules
     */
    static getMovablePieces(gameState: GameState): MovablePiece[] {
        const player = gameState.players.find(p => p.color === gameState.currentTurn);
        if (!player) return [];

        const turnId = `${gameState.currentTurn}-${gameState.totalTurns}`;
        const stateHash = this.getStateHash(gameState);

        const context: TurnContext = {
            gameState,
            player,
            dice: gameState.dice,
            pendingBonus: gameState.pendingBonus,
            turnId,
            stateHash
        };

        // Update cache
        this.cache.updateContext(turnId, stateHash);

        // Check for priority rules
        const priorityRules = this.getPriorityRules(context);

        // Handle pending bonus
        if (gameState.pendingBonus && gameState.pendingBonus.playerId === player.id) {
            return this.getMovablePiecesForBonus(context);
        }

        // Handle mandatory nest exit
        if (priorityRules.includes('MANDATORY_NEST_EXIT')) {
            const movable = this.getMovablePiecesForNestExit(context);
            if (movable.length > 0) return movable;
        }

        // Handle mandatory blockade break
        if (priorityRules.includes('MANDATORY_BLOCKADE_BREAK')) {
            const movable = this.getMovablePiecesForBlockade(context);
            if (movable.length > 0) return movable;
        }

        // General case - check all pieces
        return this.getMovablePiecesGeneral(context);
    }

    /**
     * Get active priority rules for current turn
     */
    static getPriorityRules(context: TurnContext): PriorityRule[] {
        const rules: PriorityRule[] = [];

        if (BlockadeValidator.isMandatory(context)) {
            rules.push('MANDATORY_BLOCKADE_BREAK');
        }

        if (NestExitValidator.isMandatory(context)) {
            rules.push('MANDATORY_NEST_EXIT');
        }

        return rules.length > 0 ? rules : ['NONE'];
    }

    /**
     * Clear validation cache (call on turn change)
     */
    static clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics for debugging
     */
    static getCacheStats() {
        return this.cache.getStats();
    }

    // Private helper methods

    private static getMovablePiecesForBonus(context: TurnContext): MovablePiece[] {
        const { player, gameState } = context;
        const movable: MovablePiece[] = [];
        const bonusAmount = gameState.pendingBonus!.amount;

        for (let i = 0; i < player.pieces.length; i++) {
            const result = this.validateMove(gameState, i, bonusAmount);
            if (result.valid) {
                movable.push({ index: i, validDice: [-1] }); // -1 = bonus
            }
        }

        return movable;
    }

    private static getMovablePiecesForNestExit(context: TurnContext): MovablePiece[] {
        const { player, gameState, dice } = context;
        const movable: MovablePiece[] = [];

        // Only check pieces in nest
        player.pieces.forEach((piece, i) => {
            if (piece.status === 'nest') {
                const result = this.validateMove(gameState, i, 5);
                if (result.valid) {
                    // Find which die has the 5
                    const dieIndex = dice.indexOf(5);
                    movable.push({ index: i, validDice: dieIndex !== -1 ? [dieIndex] : [-2] });
                }
            }
        });

        return movable;
    }

    private static getMovablePiecesForBlockade(context: TurnContext): MovablePiece[] {
        const { player, gameState, dice } = context;
        const movable: MovablePiece[] = [];
        const blockadePieces = BlockadeValidator.getBlockadePieces(context);

        for (const index of blockadePieces) {
            const validDice: number[] = [];

            for (let d = 0; d < dice.length; d++) {
                if (dice[d] !== 0) {
                    const result = this.validateMove(gameState, index, dice[d]);
                    if (result.valid) {
                        validDice.push(d);
                    }
                }
            }

            if (validDice.length > 0) {
                movable.push({ index, validDice });
            }
        }

        return movable;
    }

    private static getMovablePiecesGeneral(context: TurnContext): MovablePiece[] {
        const { player, gameState, dice } = context;
        const movable: MovablePiece[] = [];
        const activeDice = dice.filter(d => d !== 0);

        for (let i = 0; i < player.pieces.length; i++) {
            const piece = player.pieces[i];
            const validDice: number[] = [];

            // Check each die
            for (let d = 0; d < dice.length; d++) {
                if (dice[d] !== 0) {
                    const result = this.validateMove(gameState, i, dice[d]);
                    if (result.valid) {
                        validDice.push(d);
                    }
                }
            }

            // Check sum of 5 for nest pieces
            if (piece.status === 'nest' && activeDice.length === 2) {
                if (activeDice[0] + activeDice[1] === 5) {
                    const result = this.validateMove(gameState, i, 5);
                    if (result.valid) {
                        validDice.push(-2); // -2 = sum of 5
                    }
                }
            }

            if (validDice.length > 0) {
                movable.push({ index: i, validDice });
            }
        }

        return movable;
    }

    private static getStateHash(gameState: GameState): string {
        // Simple hash based on key state properties
        const player = gameState.players.find(p => p.color === gameState.currentTurn);
        if (!player) return '';

        const piecesHash = player.pieces
            .map(p => `${p.status}:${p.position}`)
            .join(',');

        return `${gameState.currentTurn}:${gameState.dice.join(',')}:${piecesHash}`;
    }
}
