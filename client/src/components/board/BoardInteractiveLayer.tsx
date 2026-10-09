import React, { memo } from 'react';
import type { PlayerColor } from '@parchis/shared';
import type { BoardTheme } from '../../types/theme';
import { getPieceCoordinates, ZONE_BOUNDARIES } from '../../components/boardUtils';

interface BoardInteractiveLayerProps {
    theme: BoardTheme;
    highlightedCells?: number[];
    highlightSection?: 'nest' | 'goal' | 'safe' | null;
    playerCount: 4 | 6;
    currentTurn: PlayerColor;
    // rotation not needed as parent group rotates
}

const BoardInteractiveLayerComponent: React.FC<BoardInteractiveLayerProps> = ({
    theme,
    highlightedCells = [],
    highlightSection,
    playerCount,
    currentTurn
}) => {
    // If nothing to highlight AND no active player glow needed, return null?
    // Active player glow is always needed if option is on.
    // Check if we have highlights OR active turn glow
    const hasHighlights = highlightedCells.length > 0 || !!highlightSection;
    const hasGlow = theme.visuals?.activePlayerGlow;

    if (!hasHighlights && !hasGlow) return null;

    const N = ZONE_BOUNDARIES.NEST;
    const CE = ZONE_BOUNDARIES.CENTER_END;

    return (
        <g pointerEvents="none">
            {/* Center Home Highlights */}
            {highlightSection === 'goal' && (
                <>
                    <path d={`M 50,50 L ${N},${N} L ${CE},${N} Z`} fill="none" stroke="#facc15" strokeWidth="0.6" className="animate-pulse" />
                    <path d={`M 50,50 L ${CE},${N} L ${CE},${CE} Z`} fill="none" stroke="#facc15" strokeWidth="0.6" className="animate-pulse" />
                    <path d={`M 50,50 L ${CE},${CE} L ${N},${CE} Z`} fill="none" stroke="#facc15" strokeWidth="0.6" className="animate-pulse" />
                    <path d={`M 50,50 L ${N},${CE} L ${N},${N} Z`} fill="none" stroke="#facc15" strokeWidth="0.6" className="animate-pulse" />
                </>
            )}

            {/* Cell Highlights */}
            {highlightedCells.map(i => {
                const coords = getPieceCoordinates(i, playerCount, 'active', 'yellow');
                return (
                    <rect
                        key={`hl-${i}`}
                        x={coords.x - coords.w / 2}
                        y={coords.y - coords.h / 2}
                        width={coords.w}
                        height={coords.h}
                        fill="none"
                        stroke="#facc15"
                        strokeWidth="0.6"
                        className="animate-pulse"
                        rx={theme.visuals?.cellRadius ?? 0}
                    />
                );
            })}

            {/* Active Player Glow on Nest */}
            {theme.visuals?.activePlayerGlow && (() => {
                const BaseZone = ({ x, y, w, h, color }: { x: number, y: number, w: number, h: number, color: PlayerColor }) => (
                    currentTurn === color ? (
                        <rect
                            x={x} y={y} width={w} height={h}
                            fill="none"
                            stroke={theme.playerColors[color]}
                            strokeWidth="1"
                            className="animate-pulse"
                            style={{ opacity: 0.3 }}
                        />
                    ) : null
                );

                return (
                    <>
                        <BaseZone x={0} y={0} w={N} h={N} color="green" />
                        <BaseZone x={CE} y={0} w={100 - CE} h={N} color="red" />
                        <BaseZone x={0} y={CE} w={N} h={100 - CE} color="yellow" />
                        <BaseZone x={CE} y={CE} w={100 - CE} h={100 - CE} color="blue" />
                    </>
                );
            })()}
        </g>
    );
};

export const BoardInteractiveLayer = memo(BoardInteractiveLayerComponent);
