import React, { useRef, useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import type { Piece, PlayerColor } from '@parchis/shared';
import { getPieceCoordinates, getPiecePath } from './boardUtils';
import type { BoardTheme } from '../types/theme';

interface GamePieceProps {
    piece: Piece;
    playerCount: 4 | 6;
    color: PlayerColor;
    theme: BoardTheme;
    selected: boolean;
    validMove: boolean;
    onClick: () => void;
    offset?: { x: number, y: number }; // For stacking
}

const GamePieceComponent: React.FC<GamePieceProps> = ({
    piece,
    playerCount,
    color,
    theme,
    selected,
    validMove,
    onClick,
    offset = { x: 0, y: 0 }
}) => {
    // 1. Track previous state to calculate path
    const prevRef = useRef<{ position: number, status: string }>({
        position: piece.position,
        status: piece.status
    });

    const [animationProps, setAnimationProps] = useState<{ x: any, y: any, scale?: any, transition: any } | null>(null);
    const [currentPos, setCurrentPos] = useState(getPieceCoordinates(
        (piece.status === 'nest' || piece.status === 'goal') ? parseInt(piece.id.split('-')[1]) : piece.position,
        playerCount,
        piece.status,
        color
    ));

    useEffect(() => {
        // Detect change
        const prev = prevRef.current;
        const curr = { position: piece.position, status: piece.status };

        // If logical position changed
        // If logical position changed
        if (prev.position !== curr.position || prev.status !== curr.status) {

            // CAPTURE DETECTION: If we are going TO nest FROM board (not goal/nest)
            // We want to DELAY the visual update so the captor has time to arrive.
            const isCapture = curr.status === 'nest' && (prev.status === 'active' || prev.status === 'home_path' || prev.status === 'safe');
            const delay = isCapture ? 600 : 0; // Wait 600ms for captor to arrive/stomp

            const updateVisuals = () => {
                // Calculate Path
                const pieceIdx = parseInt(piece.id.split('-')[1]);
                const path = getPiecePath(prev, curr, playerCount, color, pieceIdx);

                // Should validly handle empty path (direct jump)
                if (path.length > 0) {
                    // Generate "Hops" for each step
                    // For each point in the path, we want to go from prev to next with a jump
                    const hoppedX: number[] = [];
                    const hoppedY: number[] = [];
                    const hoppedScale: number[] = [];

                    // Start at current (before path)
                    hoppedX.push(currentPos.x + offset.x);
                    hoppedY.push(currentPos.y + offset.y);
                    hoppedScale.push(1);

                    path.forEach((p, i) => {
                        const startX = i === 0 ? currentPos.x + offset.x : path[i - 1].x + offset.x;
                        const startY = i === 0 ? currentPos.y + offset.y : path[i - 1].y + offset.y;
                        const endX = p.x + offset.x;
                        const endY = p.y + offset.y;

                        // Mid-jump point (Peak)
                        hoppedX.push((startX + endX) / 2);
                        hoppedY.push((startY + endY) / 2 - 1.5); // Lift up by 1.5 units (Z-axis simulation)
                        hoppedScale.push(1.25); // Scale up for depth

                        // Landing point
                        hoppedX.push(endX);
                        hoppedY.push(endY);
                        hoppedScale.push(1);
                    });

                    const duration = Math.min(path.length * 0.25, 2.5);

                    setAnimationProps({
                        x: hoppedX,
                        y: hoppedY,
                        scale: hoppedScale,
                        transition: {
                            duration,
                            ease: "easeInOut",
                            times: hoppedX.map((_, i) => i / (hoppedX.length - 1))
                        }
                    });

                    // Update visual current pos to end of path (for static render after anim)
                    const last = path[path.length - 1];
                    setCurrentPos(last);
                } else {
                    // Direct update (teleport or instant move like Capture Return)
                    const coords = getPieceCoordinates(
                        (curr.status === 'nest' || curr.status === 'goal') ? parseInt(piece.id.split('-')[1]) : curr.position,
                        playerCount,
                        curr.status,
                        color
                    );

                    setAnimationProps({
                        x: coords.x + offset.x,
                        y: coords.y + offset.y,
                        scale: 1,
                        transition: { duration: 0.5 } // Smooth fade/slide to nest
                    });
                    setCurrentPos(coords);
                }
            };

            if (delay > 0) {
                const timer = setTimeout(updateVisuals, delay);
                return () => clearTimeout(timer); // Cleanup if unmounted/changed again
            } else {
                updateVisuals();
            }

            // Update Ref immediately logic-wise, visual follows
            prevRef.current = curr;
        } else {
            // Handle offset changes only (stacking update) without path animation
            const coords = getPieceCoordinates(
                (piece.status === 'nest' || piece.status === 'goal') ? parseInt(piece.id.split('-')[1]) : piece.position,
                playerCount,
                piece.status,
                color
            );
            // If just offset changed, we might want a quick slide?
            // For now, simple update
            // Check if we are not animating
            // We generally want to respect the calculated position + offset
            // If we are mid-animation, this might conflict. 
            // Ideally, 'x' and 'y' in animate prop override simple layout.

            // Immediate update for stationary pieces
            setAnimationProps({
                x: coords.x + offset.x,
                y: coords.y + offset.y,
                scale: 1,
                transition: { duration: 0.3 }
            });
        }
    }, [piece.position, piece.status, offset.x, offset.y, color, playerCount]);

    // Initial Render Position (no animation on mount)
    // We use the coords + offset
    // But if animationProps is set, it takes precedence.

    // Actually, on mount, we just want to be at current pos.


    return (
        <motion.g
            key={piece.id}
            initial={{ x: currentPos.x + offset.x, y: currentPos.y + offset.y, scale: 1 }}
            animate={animationProps || { x: currentPos.x + offset.x, y: currentPos.y + offset.y, scale: 1 }}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className="cursor-pointer"
            style={{
                willChange: 'transform',
                transformOrigin: 'center',
                transformBox: 'fill-box'
            }}
        >
            {/* Hitbox - Transparent area for easier clicking */}
            <circle cx="0" cy="0" r="6" fill="transparent" stroke="none" pointerEvents={validMove ? "all" : "none"} />

            {selected && (
                <motion.circle
                    cx="0"
                    cy="0"
                    fill="none"
                    stroke={theme.borderColor === '#e5e7eb' ? '#22d3ee' : '#0891b2'}
                    strokeWidth="0.8"
                    initial={{ opacity: 0.5, r: 4 }}
                    animate={{ opacity: [0.5, 1, 0.5], r: [4, 5, 4] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
            )}
            <circle
                cx="0" cy="0" r="2.5"
                fill={theme.playerColors[color]}
                stroke={theme.visuals?.pieceStyle === 'premium' ? 'none' : 'black'}
                strokeWidth="0.3"
            />
            {theme.visuals?.pieceStyle === 'premium' && (
                <>
                    {/* Shadow for depth */}
                    <circle cx="0" cy="0" r="2.5" fill="url(#piece-depth)" pointerEvents="none" />
                    {/* High-speed gloss gradient instead of feLighting */}
                    <circle cx="0" cy="0" r="2.5" fill="url(#piece-gloss)" pointerEvents="none" />
                    {/* Lathe Ring details (Gold/Brass Paint) */}
                    <circle cx="0" cy="0" r="1.5" fill="none" stroke="#ffd700" strokeWidth="0.1" opacity="0.4" pointerEvents="none" />
                    {/* Center cap */}
                    <circle cx="0" cy="0" r="0.5" fill="rgba(0,0,0,0.3)" pointerEvents="none" />
                </>
            )}
            {theme.visuals?.pieceStyle !== 'premium' && (
                <circle cx="0" cy="0" r="1.5" fill="none" stroke="white" strokeWidth="0.1" opacity="0.3" />
            )}
            {validMove && (
                <circle cx="0" cy="0" r="3.5" fill="none" stroke="black" strokeWidth="0.4">
                    <animate attributeName="stroke-opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
                </circle>
            )}
        </motion.g>
    );
};

export const GamePiece = memo(GamePieceComponent);
