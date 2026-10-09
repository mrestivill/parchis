import React, { memo } from 'react';
import type { PlayerColor } from '@parchis/shared';
import type { BoardTheme } from '../../types/theme';
import { getPieceCoordinates, ZONE_BOUNDARIES } from '../../components/boardUtils';
import { CLASSIC_THEME } from '../../types/theme';

interface BoardStaticLayerProps {
    theme?: BoardTheme;
    playerCount: 4 | 6;
    rotation?: number;
}

// Helper to generate range
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

const BoardStaticLayerComponent: React.FC<BoardStaticLayerProps> = ({
    theme = CLASSIC_THEME,
    playerCount,
    rotation = 0
}) => {
    // Determine colors
    const colors: PlayerColor[] = playerCount === 4
        ? ['blue', 'red', 'green', 'yellow']
        : ['yellow', 'purple', 'blue', 'green', 'orange', 'red'];

    return (
        <g>
            {/* 1. Background Layer (Handled by CSS for Realistic Wood) */}
            {!theme.backgroundImage && (
                <rect x="0" y="0" width="100" height="100" fill={theme.background} />
            )}

            <rect x="0" y="0" width="100" height="100" fill="none" stroke={theme.borderColor} strokeWidth="0.5" />

            {/* Bases */}
            {(() => {
                const N = ZONE_BOUNDARIES.NEST;
                const CE = ZONE_BOUNDARIES.CENTER_END;

                const BaseZone = ({ x, y, w, h, color }: { x: number, y: number, w: number, h: number, color: PlayerColor }) => (
                    <g>
                        {theme.visuals?.nestStyle === 'carved' ? (
                            <>
                                {/* Stained Inlay Area - Custom Material Integration */}
                                <rect
                                    x={x} y={y} width={w} height={h}
                                    fill={theme.playerColors[color]}
                                    fillOpacity={theme.visuals?.nestOpacity ?? theme.visuals?.cellOpacity ?? 0.25}
                                    style={{ mixBlendMode: theme.visuals?.mixBlendMode as any }}
                                />
                                <rect x={x} y={y} width={w} height={h} fill={theme.visuals?.nestOverlayColor || 'rgba(62, 39, 35, 0.15)'} />

                                {/* Inlay Border - Colored Line */}
                                <rect
                                    x={x + 0.5} y={y + 0.5} width={w - 1} height={h - 1}
                                    fill="none"
                                    stroke={theme.playerColors[color]}
                                    strokeWidth="0.4"
                                    opacity="0.6"
                                />
                            </>
                        ) : (
                            <rect x={x} y={y} width={w} height={h}
                                fill={theme.playerColors[color]}
                                fillOpacity={theme.visuals?.nestOpacity ?? 1}
                                style={{ mixBlendMode: theme.visuals?.mixBlendMode as any }}
                                stroke={theme.borderColor}
                                strokeWidth="0.4"
                            />
                        )}
                        {/* Nested circles for pieces - Wood Grooves if wood theme */}
                        {range(4).map(i => {
                            const offset = w * 0.15; // Aligned with boardUtils.ts (1.2/8 units)
                            const dx = (i % 2 === 0) ? -offset : offset;
                            const dy = (i < 2) ? -offset : offset;
                            return theme.visuals?.nestStyle === 'carved' ? (
                                <g key={i}>
                                    {/* Baked Circular Groove */}
                                    <circle cx={x + w / 2 + dx} cy={y + h / 2 + dy} r="2.5" fill={theme.trackColor} />
                                    <circle cx={x + w / 2 + dx} cy={y + h / 2 + dy} r="2.5" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="0.4" />
                                    <circle cx={x + w / 2 + dx} cy={y + h / 2 + dy} r="2.3" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />
                                </g>
                            ) : (
                                <circle key={i} cx={x + w / 2 + dx} cy={y + h / 2 + dy} r="3" fill={theme.trackColor} stroke={theme.borderColor} strokeWidth="0.2" opacity="0.3" />
                            );
                        })}
                    </g>
                );

                return (
                    <>
                        <BaseZone x={0} y={0} w={N} h={N} color="green" />
                        <BaseZone x={CE} y={0} w={100 - CE} h={N} color="red" />
                        <BaseZone x={0} y={CE} w={N} h={100 - CE} color="yellow" />
                        <BaseZone x={CE} y={CE} w={100 - CE} h={100 - CE} color="blue" />

                        {/* Center Home - Replaced triangles */}
                        {theme.visuals?.homeStyle === 'carved' ? (
                            <>
                                {/* Underlying Wood texture implied by background */}
                                {/* Soft Tinted Zones - Custom Material Integration */}
                                <path d={`M 50,50 L ${N},${N} L ${CE},${N} Z`} fill={theme.playerColors.green} fillOpacity={theme.visuals?.homeOpacity ?? 0.1} style={{ mixBlendMode: theme.visuals?.mixBlendMode as any }} />
                                <path d={`M 50,50 L ${CE},${N} L ${CE},${CE} Z`} fill={theme.playerColors.red} fillOpacity={theme.visuals?.homeOpacity ?? 0.1} style={{ mixBlendMode: theme.visuals?.mixBlendMode as any }} />
                                <path d={`M 50,50 L ${CE},${CE} L ${N},${CE} Z`} fill={theme.playerColors.blue} fillOpacity={theme.visuals?.homeOpacity ?? 0.1} style={{ mixBlendMode: theme.visuals?.mixBlendMode as any }} />
                                <path d={`M 50,50 L ${N},${CE} L ${N},${N} Z`} fill={theme.playerColors.yellow} fillOpacity={theme.visuals?.homeOpacity ?? 0.1} style={{ mixBlendMode: theme.visuals?.mixBlendMode as any }} />

                                {/* Darker material tint layer (e.g. wood stain) */}
                                {(theme.name === 'Realistic Wood' || theme.visuals?.homeStyle === 'carved') && (
                                    <>
                                        <path d={`M 50,50 L ${N},${N} L ${CE},${N} Z`} fill="rgba(0, 0, 0, 0.05)" />
                                        <path d={`M 50,50 L ${CE},${N} L ${CE},${CE} Z`} fill="rgba(0, 0, 0, 0.05)" />
                                        <path d={`M 50,50 L ${CE},${CE} L ${N},${CE} Z`} fill="rgba(0, 0, 0, 0.05)" />
                                        <path d={`M 50,50 L ${N},${CE} L ${N},${N} Z`} fill="rgba(0, 0, 0, 0.05)" />
                                    </>
                                )}

                                {/* Engraved Separators - Simplified (No filters) */}
                                <path d={`M ${N},${N} L ${CE},${CE}`} stroke={theme.trackColor} strokeWidth="0.3" strokeLinecap="round" opacity="0.4" />
                                <path d={`M ${CE},${N} L ${N},${CE}`} stroke={theme.trackColor} strokeWidth="0.3" strokeLinecap="round" opacity="0.4" />

                                {/* Carved Title */}
                                {theme.visuals?.logoType === 'carved' && (
                                    <g
                                        transform={`translate(50, 50)`}
                                    >
                                        {/* Outer Grooves */}
                                        <circle cx="0" cy="0" r="14" fill="none" stroke={theme.visuals?.logoColor || theme.trackColor} strokeWidth="0.4" opacity="0.6" />
                                        <circle cx="0" cy="0" r="13" fill="none" stroke={theme.visuals?.logoColor || theme.trackColor} strokeWidth="0.3" opacity="0.4" />
                                        <circle cx="0" cy="0" r="14.2" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />

                                        <text x="0" y="-1.9" textAnchor="middle" fontFamily={theme.fontStyle} fontSize="4" fontWeight="bold" fill="#000" letterSpacing="0.2" opacity="0.3" style={{ transform: `rotate(${-rotation}deg)`, transformOrigin: '0 0', transition: 'transform 0.5s ease-out' }}>PARCHIS</text>
                                        <text x="0" y="-2" textAnchor="middle" fontFamily={theme.fontStyle} fontSize="4" fontWeight="bold" fill={theme.visuals?.logoColor || theme.trackColor} letterSpacing="0.2" opacity="0.95" style={{ transform: `rotate(${-rotation}deg)`, transformOrigin: '0 0', transition: 'transform 0.5s ease-out' }}>PARCHIS</text>

                                        <text x="0" y="4.6" textAnchor="middle" fontFamily="cursive" fontSize="5" fontWeight="bold" fill="#000" opacity="0.4" style={{ transform: `rotate(${-rotation}deg)`, transformOrigin: '0 0', transition: 'transform 0.5s ease-out' }}>Royale</text>
                                        <text x="0" y="4.5" textAnchor="middle" fontFamily="cursive" fontSize="5" fontWeight="bold" fill={theme.visuals?.logoColor || theme.trackColor} opacity="0.95" style={{ transform: `rotate(${-rotation}deg)`, transformOrigin: '0 0', transition: 'transform 0.5s ease-out' }}>Royale</text>

                                        <g style={{ transform: `rotate(${-rotation}deg)`, transformOrigin: '0 0', transition: 'transform 0.5s ease-out' }}>
                                            <path d="M -2,-5 L -3,-7 L 0,-8 L 3,-7 L 2,-5 Z" fill={theme.visuals?.logoColor || theme.trackColor} opacity="0.9" transform="translate(0, -1)" />
                                        </g>
                                    </g>
                                )}
                            </>
                        ) : (
                            <>
                                <path d={`M 50,50 L ${N},${N} L ${CE},${N} Z`} fill={theme.playerColors.green} fillOpacity={theme.visuals?.homeOpacity ?? 1} style={{ mixBlendMode: theme.visuals?.mixBlendMode as any }} stroke={theme.borderColor} strokeWidth="0.2" />
                                <path d={`M 50,50 L ${CE},${N} L ${CE},${CE} Z`} fill={theme.playerColors.red} fillOpacity={theme.visuals?.homeOpacity ?? 1} style={{ mixBlendMode: theme.visuals?.mixBlendMode as any }} stroke={theme.borderColor} strokeWidth="0.2" />
                                <path d={`M 50,50 L ${CE},${CE} L ${N},${CE} Z`} fill={theme.playerColors.blue} fillOpacity={theme.visuals?.homeOpacity ?? 1} style={{ mixBlendMode: theme.visuals?.mixBlendMode as any }} stroke={theme.borderColor} strokeWidth="0.2" />
                                <path d={`M 50,50 L ${N},${CE} L ${N},${N} Z`} fill={theme.playerColors.yellow} fillOpacity={theme.visuals?.homeOpacity ?? 1} style={{ mixBlendMode: theme.visuals?.mixBlendMode as any }} stroke={theme.borderColor} strokeWidth="0.2" />
                            </>
                        )}
                    </>
                );
            })()}

            {/* Track Cells */}
            {Array.from({ length: 68 }).map((_, i) => {
                const coords = getPieceCoordinates(i, playerCount, 'active', 'yellow');
                const safeIndices = [11, 16, 28, 33, 45, 50, 62, 67];
                const startMap: Record<number, PlayerColor> = { 4: 'blue', 21: 'red', 38: 'green', 55: 'yellow' };

                const startColor = startMap[i];
                const isPureSafe = safeIndices.includes(i);
                const isSafeOrStart = isPureSafe || !!startColor;

                // Logic to justify numbers towards the center "spine"
                const dx = coords.x - 50;
                const dy = coords.y - 50;
                const offsetAmount = 3.2;
                let tx = coords.x;
                let ty = coords.y;

                if (Math.abs(dy) > 15 && Math.abs(dx) < 15) {
                    // Vertical Arm - Shift X towards 50
                    tx = coords.x - (Math.sign(dx) * offsetAmount);
                } else if (Math.abs(dx) > 15 && Math.abs(dy) < 15) {
                    // Horizontal Arm - Shift Y towards 50
                    ty = coords.y - (Math.sign(dy) * offsetAmount);
                }

                return (
                    <g key={`cell-${i}`}>
                        <rect
                            x={coords.x - coords.w / 2}
                            y={coords.y - coords.h / 2}
                            width={coords.w}
                            height={coords.h}
                            fill={startColor ? theme.playerColors[startColor] : (isPureSafe ? theme.safeZoneColor : theme.trackColor)}
                            fillOpacity={startColor ? (theme.visuals?.cellOpacity ?? 1) : 1}
                            stroke={theme.borderColor}
                            strokeWidth="0.2"
                            rx={theme.visuals?.cellRadius ?? 0}
                        />
                        {theme.visuals?.showDepth && startColor && (
                            <rect x={coords.x - coords.w / 2} y={coords.y - coords.h / 2} width={coords.w} height={coords.h} fill="rgba(62, 39, 35, 0.15)" rx={theme.visuals?.cellRadius ?? 0} pointerEvents="none" />
                        )}
                        {theme.visuals?.showDepth && (
                            <>
                                {/* Baked Cell Depth */}
                                <rect x={coords.x - coords.w / 2} y={coords.y - coords.h / 2} width={coords.w} height={coords.h} fill="none" stroke={theme.visuals?.shadowColor || "rgba(0,0,0,0.4)"} strokeWidth="0.4" rx={theme.visuals?.cellRadius || 0} />
                                <path d={`M ${coords.x - coords.w / 2},${coords.y + coords.h / 2} L ${coords.x + coords.w / 2},${coords.y + coords.h / 2} L ${coords.x + coords.w / 2},${coords.y - coords.h / 2}`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />
                            </>
                        )}
                        {isPureSafe && (
                            <text
                                x={coords.x}
                                y={coords.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize="4"
                                fill={theme.textColor}
                                opacity={0.6}
                                style={{ transform: `rotate(${-rotation}deg)`, transformOrigin: `${coords.x}px ${coords.y}px`, transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)' }}
                            >
                                ★
                            </text>
                        )}
                        {!isSafeOrStart && (
                            <text
                                x={tx}
                                y={ty}
                                dy="0.35em"
                                textAnchor="middle"
                                fontSize="1.8"
                                fontWeight="bold"
                                fill={theme.textColor}
                                opacity={0.9}
                                pointerEvents="none"
                                style={{ transform: `rotate(${-rotation}deg)`, transformOrigin: `${tx}px ${ty}px`, transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)' }}
                            >
                                {(i - 55 + 68) % 68 + 1}
                            </text>
                        )}
                    </g>
                );
            })}

            {/* Home Path */}
            {colors.map(color => (
                <g key={`hp-${color}`}>
                    {range(7).map(i => {
                        const coords = getPieceCoordinates(1000 + i, playerCount, 'home_path', color);
                        return (
                            <React.Fragment key={`hp-${color}-${i}`}>
                                <rect
                                    x={coords.x - coords.w / 2}
                                    y={coords.y - coords.h / 2}
                                    width={coords.w}
                                    height={coords.h}
                                    fill={theme.playerColors[color]}
                                    fillOpacity={theme.visuals?.homeOpacity ?? theme.visuals?.cellOpacity ?? 1.0}
                                    style={{ mixBlendMode: theme.visuals?.mixBlendMode as any }}
                                    stroke={theme.borderColor}
                                    strokeWidth="0.1"
                                />
                                {theme.visuals?.showDepth && (
                                    <rect x={coords.x - coords.w / 2} y={coords.y - coords.h / 2} width={coords.w} height={coords.h} fill="rgba(62, 39, 35, 0.1)" pointerEvents="none" />
                                )}
                                {theme.visuals?.showDepth && (
                                    <>
                                        <rect x={coords.x - coords.w / 2} y={coords.y - coords.h / 2} width={coords.w} height={coords.h} fill="none" stroke={theme.visuals?.shadowColor || "rgba(0,0,0,0.3)"} strokeWidth="0.3" />
                                        <path d={`M ${coords.x - coords.w / 2},${coords.y + coords.h / 2} L ${coords.x + coords.w / 2},${coords.y + coords.h / 2} L ${coords.x + coords.w / 2},${coords.y - coords.h / 2}`} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.1" />
                                    </>
                                )}
                            </React.Fragment>
                        );
                    })}
                </g>
            ))}
        </g>
    );
};

export const BoardStaticLayer = memo(BoardStaticLayerComponent);
