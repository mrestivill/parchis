import { MoveResult } from '../../types';
import { IValidator, MoveContext } from '../types';
import { getBoardConfig, getStartPosition, getPiecesAt, getSafeIndices } from '../../logic';
import { POS_HOME_PATH_START, HOME_PATH_LENGTH } from '../../constants';

/**
 * Validates destination cell:
 * - Capacity (max 2 pieces)
 * - Capture rules
 * - Goal entry
 * - Anti-rolling blockade rule
 */
export class DestinationValidator implements IValidator {
    name = 'DestinationValidator';
    priority = 4;

    validate(context: MoveContext): MoveResult {
        const { gameState, player, piece, roll } = context;

        // Skip for pieces in nest
        if (piece.status === 'nest') {
            return { valid: true };
        }

        const config = getBoardConfig(gameState.players.length === 6 ? 6 : 4);
        const startOffset = getStartPosition(player.color, config.spacesPerSegment, config.playerCount);

        const homeEntranceDist = 64;
        const goalDist = homeEntranceDist + HOME_PATH_LENGTH;

        const currentDist = piece.distanceFromStart;
        const newDist = currentDist + roll;

        // Check if entering goal
        if (newDist === goalDist) {
            return {
                valid: true,
                enteredGoal: true,
                newDistanceFromStart: newDist
            };
        }

        // Determine target position and status
        let targetPos: number;
        let targetStatus: 'active' | 'home_path';

        if (newDist >= homeEntranceDist) {
            // Moving in home path
            const offset = newDist - homeEntranceDist;
            targetPos = POS_HOME_PATH_START + offset;
            targetStatus = 'home_path';

            // Check capacity in home path (only my pieces can be here)
            const piecesAtTarget = getPiecesAt(gameState, targetPos, 'home_path')
                .filter(p => p.color === player.color);

            if (piecesAtTarget.length >= 2) {
                return { valid: false, reason: 'Space full' };
            }

            return {
                valid: true,
                newPosition: targetPos,
                newDistanceFromStart: newDist
            };
        } else {
            // Moving on main track
            targetPos = this.getBoardIndex(newDist, startOffset, config.totalCommonSpaces);
            targetStatus = 'active';

            const piecesAtTarget = getPiecesAt(gameState, targetPos, 'active');

            // Check capacity
            if (piecesAtTarget.length >= 2) {
                return { valid: false, reason: 'Space full' };
            }

            // Check capture
            let capturedId: string | undefined = undefined;

            if (piecesAtTarget.length === 1) {
                const other = piecesAtTarget[0];

                if (other.color !== player.color) {
                    // Enemy piece
                    const safeIndices = getSafeIndices();
                    const isSafe = safeIndices.includes(targetPos);

                    if (!isSafe) {
                        // Capture!
                        capturedId = other.id;
                    }
                    // If safe, just share the space
                }
            }

            // Check anti-rolling blockade rule
            if (gameState.forbiddenMoves) {
                const forbidden = gameState.forbiddenMoves.find(
                    f => f.pieceId === piece.id && f.forbiddenPosition === targetPos
                );

                if (forbidden) {
                    return {
                        valid: false,
                        reason: 'You cannot move both pieces of a blockade to the same space (Rolling Blockade)'
                    };
                }
            }

            return {
                valid: true,
                newPosition: targetPos,
                newDistanceFromStart: newDist,
                capturedPieceId: capturedId
            };
        }
    }

    private getBoardIndex(distance: number, startOffset: number, totalCommon: number): number {
        return (startOffset + distance) % totalCommon;
    }
}
