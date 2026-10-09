import { MoveResult } from '../../types';
import { IValidator, MoveContext } from '../types';
import { getStartPosition, getPiecesAt } from '../../logic';
import { getBoardConfig } from '../../logic';

/**
 * Validates nest exit moves with all Parchis rules:
 * - Requires roll of 5
 * - Maximum 1 nest exit per turn
 * - Dynamic blockage check (2 own pieces at start position)
 * - Capture rules at start position
 */
export class NestExitValidator implements IValidator {
    name = 'NestExitValidator';
    priority = 2; // After blockade break

    validate(context: MoveContext): MoveResult {
        const { gameState, player, piece, roll, pieceIndex } = context;

        // Only applies to pieces in nest
        if (piece.status !== 'nest') {
            return { valid: true }; // Not our concern
        }

        // Must roll a 5 to exit
        if (roll !== 5) {
            return { valid: false, reason: 'You need a 5 to exit the nest' };
        }

        // Check if already exited a piece this turn
        const alreadyExited = (gameState.piecesExitedCount || 0) >= 1;
        if (alreadyExited) {
            return { valid: false, reason: 'You can only take out one piece per turn' };
        }

        // Get start position
        const config = getBoardConfig(gameState.players.length === 6 ? 6 : 4);
        const startPos = getStartPosition(player.color, config.spacesPerSegment, config.playerCount);

        // If it was initially blocked, the opportunity is lost for this turn (strict rule)
        if (gameState.initialTurnStartBlocked) {
            return { valid: false, reason: 'Exit blocked at the start of the turn' };
        }

        // CRITICAL: Check DYNAMIC blockage (not snapshot from turn start)
        const piecesAtStart = getPiecesAt(gameState, startPos, 'active');
        const myPiecesAtStart = piecesAtStart.filter(p => p.color === player.color);

        // If 2 of my own pieces are blocking the start, cannot exit
        if (myPiecesAtStart.length >= 2) {
            return { valid: false, reason: 'Exit blocked by yourself' };
        }

        // Check capacity and capture logic
        let capturedId: string | undefined = undefined;

        if (piecesAtStart.length >= 2) {
            // Position has 2 pieces total
            // If not both mine (checked above), must have at least 1 enemy
            const enemyPieces = piecesAtStart.filter(p => p.color !== player.color);

            if (enemyPieces.length > 0) {
                // Capture the most recently arrived enemy
                enemyPieces.sort((a, b) => (b.lastMovedTime || 0) - (a.lastMovedTime || 0));
                capturedId = enemyPieces[0].id;
            } else {
                // Should not happen (covered by myPiecesAtStart check)
                return { valid: false, reason: 'Exit blocked' };
            }
        } else if (piecesAtStart.length === 1) {
            // Single piece at start - can share (start is safe)
            const other = piecesAtStart[0];
            if (other.color !== player.color) {
                // Share with enemy, no capture
                capturedId = undefined;
            }
        }

        // Valid exit
        return {
            valid: true,
            newPosition: startPos,
            newDistanceFromStart: 0,
            capturedPieceId: capturedId
        };
    }

    /**
     * Check if mandatory nest exit rule is active
     * Returns true if player MUST exit from nest (has 5, has nest pieces, start not blocked)
     */
    static isMandatory(context: TurnContext): boolean {
        const { gameState, player, dice } = context;

        // Check if player has pieces in nest
        const piecesInNest = player.pieces.filter(p => p.status === 'nest');
        if (piecesInNest.length === 0) return false;

        // Check if already exited one this turn
        const alreadyExited = (gameState.piecesExitedCount || 0) >= 1;
        if (alreadyExited) return false;

        // Check if 5 is available
        const activeDice = dice.filter(d => d !== 0);
        const hasFive = activeDice.includes(5);
        const sumIsFive = activeDice.length === 2 && (activeDice[0] + activeDice[1] === 5);
        const fiveIsAvailable = hasFive || sumIsFive;

        if (!fiveIsAvailable) return false;

        // Check if start position is blocked
        const config = getBoardConfig(gameState.players.length === 6 ? 6 : 4);
        const startPos = getStartPosition(player.color, config.spacesPerSegment, config.playerCount);
        const piecesAtStart = getPiecesAt(gameState, startPos, 'active');
        const myPiecesAtStart = piecesAtStart.filter(p => p.color === player.color);
        const startBlocked = myPiecesAtStart.length >= 2;

        if (startBlocked) return false;

        // If it was initially blocked, mandatory rule is voided
        if (gameState.initialTurnStartBlocked) return false;

        // If blockade break is required, that takes priority
        if (gameState.blockadeBreakRequired) return false;

        // All conditions met - nest exit is mandatory
        return true;
    }
}

// Import TurnContext for static method
import { TurnContext } from '../types';
