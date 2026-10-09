import { MoveResult } from '../../types';
import { IValidator, MoveContext, TurnContext } from '../types';
import { getPiecesAt, getSafeIndices, validateMove } from '../../logic';

/**
 * Validates blockade break rule when player rolls doubles
 * If player has blockades and rolls doubles, they MUST break one
 * Exception: If no blockade can be broken (all blocked ahead), allow other moves
 */
export class BlockadeValidator implements IValidator {
    name = 'BlockadeValidator';
    priority = 1; // Highest priority

    validate(context: MoveContext, options: { checkBlockadeRule?: boolean } = {}): MoveResult {
        const { gameState, player, pieceIndex } = context;

        // Only applies when doubles are rolled
        if (gameState.consecutiveDoubles === 0) {
            return { valid: true }; // Not our concern
        }

        // Only check if flag is set (avoid infinite recursion)
        if (!options.checkBlockadeRule) {
            return { valid: true };
        }

        // Only applies if blockade break is required
        if (!gameState.blockadeBreakRequired) {
            return { valid: true };
        }

        // Find all blockades for this player
        const blockadeIndices = BlockadeValidator.getBlockadePieces(context);

        if (blockadeIndices.length === 0) {
            return { valid: true }; // No blockades
        }

        // If this piece is part of a blockade, allow the move
        if (blockadeIndices.includes(pieceIndex)) {
            return { valid: true };
        }

        // This piece is NOT part of a blockade
        // Check if ANY blockade piece can move with ANY available die
        const activeDice = gameState.dice.filter(d => d !== 0);
        let canBreakBlockade = false;

        for (const blockadeIdx of blockadeIndices) {
            for (const die of activeDice) {
                // Check if this move is actually valid (excluding the blockade rule check itself)
                const result = validateMove(gameState, blockadeIdx, die, { checkBlockadeRule: false });
                if (result.valid) {
                    canBreakBlockade = true;
                    break;
                }
            }
            if (canBreakBlockade) break;
        }

        // If a blockade CAN be broken, player MUST break it
        if (canBreakBlockade) {
            return { valid: false, reason: 'You must break the blockade when rolling doubles' };
        }

        // If no blockade can be broken, allow moving other pieces
        return { valid: true };
    }

    /**
     * Get indices of pieces that are part of blockades
     */
    static getBlockadePieces(context: MoveContext | TurnContext): number[] {
        const { gameState, player } = context;
        const blockadeIndices: number[] = [];
        const isSafePos = (pos: number) => getSafeIndices().includes(pos);

        player.pieces.forEach((piece, idx) => {
            if (piece.status === 'active' || piece.status === 'home_path') {
                const piecesAtPos = getPiecesAt(gameState, piece.position, piece.status);

                // Case 1: 2 of my own pieces at same position = blockade
                const myPiecesAtPos = piecesAtPos.filter(p => p.color === player.color);
                if (myPiecesAtPos.length === 2) {
                    blockadeIndices.push(idx);
                    return;
                }

                // Case 2: Me + Enemy at safe position = blockade
                if (piecesAtPos.length === 2 && isSafePos(piece.position)) {
                    const hasEnemy = piecesAtPos.some(p => p.color !== player.color);
                    if (hasEnemy) {
                        blockadeIndices.push(idx);
                    }
                }
            }
        });

        return blockadeIndices;
    }

    /**
     * Check if mandatory blockade break rule is active
     */
    static isMandatory(context: TurnContext): boolean {
        const { gameState } = context;

        if (gameState.consecutiveDoubles === 0) return false;
        if (!gameState.blockadeBreakRequired) return false;

        const blockades = BlockadeValidator.getBlockadePieces(context);
        return blockades.length > 0;
    }
}

