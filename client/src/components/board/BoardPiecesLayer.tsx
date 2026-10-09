import React, { memo } from 'react';
import type { Player, PlayerColor, Piece } from '@parchis/shared';
import type { BoardTheme } from '../../types/theme';
import { getPieceCoordinates } from '../../components/boardUtils';
import { GamePiece } from '../../components/GamePiece';

interface BoardPiecesLayerProps {
    players: Player[];
    playerCount: 4 | 6;
    currentTurn: PlayerColor;
    theme: BoardTheme;
    validPieceIndices?: number[];
    selectedPieceId?: string | null;
    onPieceClick: (piece: Piece, dieValue: number) => void;
}

const BoardPiecesLayerComponent: React.FC<BoardPiecesLayerProps> = ({
    players,
    playerCount,
    currentTurn,
    theme,
    validPieceIndices,
    selectedPieceId,
    onPieceClick
}) => {
    // Group pieces by coordinate to handle stacking
    const pieceGroups: Record<string, Piece[]> = {};
    players.forEach(p => {
        p.pieces.forEach(piece => {
            if (piece.status === 'goal') return;
            const coords = getPieceCoordinates(
                piece.position === -1 ? parseInt(piece.id.split('-')[1]) : piece.position,
                playerCount,
                piece.status,
                p.color
            );
            const coordKey = `${coords.x.toFixed(2)},${coords.y.toFixed(2)}`;
            if (!pieceGroups[coordKey]) pieceGroups[coordKey] = [];
            pieceGroups[coordKey].push(piece);
        });
    });

    return (
        <g>
            {players.map(player => (
                <g key={player.color}>
                    {player.pieces.map((piece, i) => {
                        const coords = getPieceCoordinates(
                            (piece.status === 'nest' || piece.status === 'goal') ? i : piece.position,
                            playerCount,
                            piece.status,
                            player.color
                        );

                        const coordKey = `${coords.x.toFixed(2)},${coords.y.toFixed(2)}`;
                        const group = pieceGroups[coordKey] || [];
                        const indexInGroup = group.findIndex(p => p.id === piece.id);
                        const count = group.length;

                        let offsetX = 0;
                        let offsetY = 0;

                        if (count > 1) {
                            const isWide = coords.w > coords.h * 1.2;
                            const spacing = 3;
                            const start = -(spacing * (count - 1)) / 2;
                            const shift = start + (indexInGroup * spacing);

                            if (isWide) offsetX = shift;
                            else offsetY = shift;
                        }

                        const isCurrentTurn = player.color === currentTurn;
                        const isValid = isCurrentTurn && (validPieceIndices?.includes(i) ?? false);
                        const isSelected = selectedPieceId === piece.id;

                        return (
                            <GamePiece
                                key={piece.id}
                                piece={piece}
                                playerCount={playerCount}
                                color={player.color}
                                theme={theme}
                                selected={isSelected}
                                validMove={isValid}
                                onClick={() => onPieceClick(piece, 0)}
                                offset={{ x: offsetX, y: offsetY }}
                            />
                        );
                    })}
                </g>
            ))}
        </g>
    );
};

export const BoardPiecesLayer = memo(BoardPiecesLayerComponent);
