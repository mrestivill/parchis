import { useEffect, useRef } from 'react';
import type { GameState, PlayerColor } from '@parchis/shared';
import { getPieceCoordinates, getPiecePath } from '../components/boardUtils';
import { fxManager } from '../utils/fxManager';

interface UseBoardFXProps {
    gameState: GameState | null;
    boardRotation: number;
    playerColor: PlayerColor | null;
    boardRef: React.RefObject<HTMLDivElement>;
}

export const useBoardFX = ({ gameState, boardRotation, boardRef }: UseBoardFXProps) => {
    // LIMITED state history - only keep last 2 states to prevent memory leaks
    const prevGameState = useRef<GameState[]>([]);

    useEffect(() => {
        if (gameState) {
            prevGameState.current = [
                gameState,
                ...prevGameState.current.slice(0, 1)
            ];
        }
    }, [gameState]);

    useEffect(() => {
        const previousState = prevGameState.current[1] || null;
        if (!gameState || !previousState) return;

        const getScreenCoords = (svgX: number, svgY: number) => {
            if (!boardRef.current) return { x: 0.5, y: 0.5 };
            const rect = boardRef.current.getBoundingClientRect();

            // Rotate point around (50, 50)
            const angle = boardRotation;
            const rad = (angle * Math.PI) / 180;
            const dx = svgX - 50;
            const dy = svgY - 50;
            const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
            const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
            const rotatedX = rx + 50;
            const rotatedY = ry + 50;

            const screenX = (rect.left + (rotatedX / 100) * rect.width) / window.innerWidth;
            const screenY = (rect.top + (rotatedY / 100) * rect.height) / window.innerHeight;
            return { x: screenX, y: screenY };
        };

        // 1. Detect Captures
        gameState.players.forEach(player => {
            const prevPlayer = previousState.players.find(p => p.id === player.id);
            if (!prevPlayer) return;

            player.pieces.forEach((piece, i) => {
                const prevPiece = prevPlayer.pieces[i];
                if (piece.status === 'nest' && (prevPiece.status === 'active' || prevPiece.status === 'home_path')) {
                    const captorPlayer = gameState.players.find(p => p.color === gameState.currentTurn);
                    const prevCaptorPlayer = previousState.players.find(p => p.id === captorPlayer?.id);

                    let captorDuration = 0.6;
                    if (captorPlayer && prevCaptorPlayer) {
                        const captorPieceIndex = captorPlayer.pieces.findIndex(p => p.position === prevPiece.position && p.status === prevPiece.status);
                        if (captorPieceIndex !== -1) {
                            const currCaptor = captorPlayer.pieces[captorPieceIndex];
                            const prevCaptor = prevCaptorPlayer.pieces[captorPieceIndex];
                            if (prevCaptor) {
                                try {
                                    const path = getPiecePath(
                                        { position: prevCaptor.position, status: prevCaptor.status },
                                        { position: currCaptor.position, status: currCaptor.status },
                                        gameState.players.length as any,
                                        captorPlayer.color,
                                        parseInt(currCaptor.id.split('-')[1])
                                    );
                                    captorDuration = Math.min(path.length * 0.25, 2.5);
                                } catch (e) {
                                    console.warn("Failed to calc captor path", e);
                                }
                            }
                        }
                    }

                    const captureCoords = getPieceCoordinates(prevPiece.position, 4, prevPiece.status as any, player.color);
                    const screenPos = getScreenCoords(captureCoords.x, captureCoords.y);

                    setTimeout(() => {
                        fxManager.showCapture(screenPos.x, screenPos.y, player.color);
                    }, captorDuration * 1000);
                }
            });
        });

        // 2. Detect Goal Entries
        gameState.players.forEach(player => {
            const prevPlayer = previousState.players.find(p => p.id === player.id);
            if (!prevPlayer) return;

            player.pieces.forEach((piece, i) => {
                const prevPiece = prevPlayer.pieces[i];
                if (piece.status === 'goal' && prevPiece.status !== 'goal') {
                    let moveDuration = 0.5;
                    try {
                        const path = getPiecePath(
                            { position: prevPiece.position, status: prevPiece.status },
                            { position: piece.position, status: piece.status },
                            gameState.players.length as any,
                            player.color,
                            parseInt(piece.id.split('-')[1])
                        );
                        moveDuration = Math.min(path.length * 0.25, 2.5);
                    } catch (e) {
                        console.warn("Failed to calc goal path", e);
                    }

                    const goalCoords = getPieceCoordinates(i, 4, 'goal', player.color);
                    const screenPos = getScreenCoords(goalCoords.x, goalCoords.y);

                    setTimeout(() => {
                        fxManager.showGoal(screenPos.x, screenPos.y);
                    }, moveDuration * 1000);
                }
            });
        });

        // 3. Detect Victory
        if (gameState.status === 'finished' && previousState.status !== 'finished') {
            setTimeout(() => {
                fxManager.showVictory();
            }, 1500);
        }
    }, [gameState, boardRotation, boardRef]);
};
