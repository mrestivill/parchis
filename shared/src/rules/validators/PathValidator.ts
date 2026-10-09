import { MoveResult } from '../../types';
import { IValidator, MoveContext } from '../types';
import { getBoardConfig, getStartPosition, getPiecesAt } from '../../logic';
import { POS_HOME_PATH_START, HOME_PATH_LENGTH } from '../../constants';

/**
 * Validates that the path to destination is clear (no blockades)
 * Also validates exact arrival at goal
 */
export class PathValidator implements IValidator {
    name = 'PathValidator';
    priority = 3;

    validate(context: MoveContext): MoveResult {
        const { gameState, player, piece, roll } = context;

        // Skip for pieces in nest (handled by NestExitValidator)
        if (piece.status === 'nest') {
            return { valid: true };
        }

        // Skip for pieces already in goal
        if (piece.status === 'goal') {
            return { valid: false, reason: 'Piece is already in the goal' };
        }

        const config = getBoardConfig(gameState.players.length === 6 ? 6 : 4);
        const startOffset = getStartPosition(player.color, config.spacesPerSegment, config.playerCount);

        const homeEntranceDist = 64;
        const goalDist = homeEntranceDist + HOME_PATH_LENGTH; // 71

        const currentDist = piece.distanceFromStart;
        const newDist = currentDist + roll;

        // Check if overshooting goal
        if (newDist > goalDist) {
            return { valid: false, reason: 'You must reach the goal exactly' };
        }

        // Check path for blockades (2 pieces at any intermediate position)
        for (let d = currentDist + 1; d < newDist; d++) {
            // Only check main track (before home path)
            if (d < homeEntranceDist) {
                const pos = this.getBoardIndex(d, startOffset, config.totalCommonSpaces);
                const piecesAtPos = getPiecesAt(gameState, pos, 'active');

                if (piecesAtPos.length >= 2) {
                    return { valid: false, reason: 'Path blocked' };
                }
            }
        }

        // Path is clear
        return { valid: true };
    }

    private getBoardIndex(distance: number, startOffset: number, totalCommon: number): number {
        return (startOffset + distance) % totalCommon;
    }
}
