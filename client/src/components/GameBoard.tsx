import React, { memo } from 'react';
import type { Player, PlayerColor, Piece } from '@parchis/shared';
import { CLASSIC_THEME } from '../types/theme';
import type { BoardTheme } from '../types/theme';
import { isLowEndDevice } from '../utils/deviceDetection';
import { getVisualPosition } from './boardUtils';
import { FloatingEmote } from './FloatingEmote';
import { BoardStaticLayer } from './board/BoardStaticLayer';
import { BoardPiecesLayer } from './board/BoardPiecesLayer';
import { BoardInteractiveLayer } from './board/BoardInteractiveLayer';

interface GameBoardProps {
    players: Player[];
    playerCount: 4 | 6;
    currentTurn: PlayerColor;
    dice: number[];
    onPieceClick: (piece: Piece, dieValue: number) => void;
    validPieceIndices?: number[];
    rotation?: number;
    theme?: BoardTheme;
    selectedPieceId?: string | null;
    highlightedCells?: number[];
    highlightSection?: 'nest' | 'goal' | 'safe' | null;
    activeEmotes?: { userId: string, emoteId: string, timestamp: number }[];
    playerColor?: PlayerColor | null;
}

const GameBoardComponent: React.FC<GameBoardProps> = ({
    players,
    playerCount,
    currentTurn,
    onPieceClick,
    validPieceIndices,
    rotation = 0,
    theme = CLASSIC_THEME,
    selectedPieceId = null,
    highlightedCells = [],
    highlightSection = null,
    activeEmotes = []
}) => {
    // Determine if we should use heavy SVG filters based on device capabilities
    const shouldUseHeavyFilters = React.useMemo(() => {
        const needsFilters = theme.visuals?.showDepth || theme.visuals?.pieceStyle === 'premium';
        if (!needsFilters) return false;
        return !isLowEndDevice();
    }, [theme]);

    return (
        <div className="relative w-full h-auto flex items-center justify-center p-0 xl:p-4 rounded-xl shadow-2xl transition-all duration-300"
            style={{
                backgroundColor: theme.background,
                backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                overflow: 'visible',
                boxShadow: theme.visuals?.innerShadow ? `${theme.visuals.innerShadow}, 0 25px 50px -12px rgba(0, 0, 0, 0.5)` : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                filter: `brightness(${theme.visuals?.brightness ?? 1}) contrast(${theme.visuals?.contrast ?? 1}) saturate(${theme.visuals?.saturate ?? 1})`
            }}>

            {/* Visual Overlays (Vignette, Grain) */}
            {theme.visuals?.vignette && (
                <div className="absolute inset-0 pointer-events-none z-10" style={{ background: theme.visuals.vignette }} />
            )}

            {theme.visuals?.grain && (
                <div className="absolute inset-0 pointer-events-none z-20"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        opacity: theme.visuals.grain * 0.7
                    }}
                />
            )}

            <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="w-full h-auto max-w-[800px] overflow-visible select-none transition-transform duration-700 ease-in-out z-0">
                <defs>
                    {shouldUseHeavyFilters ? (
                        <>
                            <filter id="deep-carve">
                                <feGaussianBlur stdDeviation="0.3" in="SourceAlpha" result="blur" />
                                <feOffset dx="0.4" dy="0.6" in="blur" result="offsetBlur" />
                                <feComposite operator="out" in="SourceGraphic" in2="offsetBlur" result="inverse" />
                                <feFlood floodColor="black" floodOpacity="0.7" result="color" />
                                <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                                <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                            </filter>
                            <filter id="turned-wood">
                                <feDiffuseLighting lightingColor="#fff" surfaceScale="1.5" diffuseConstant="0.9" result="diffuse">
                                    <feDistantLight azimuth="45" elevation="45" />
                                </feDiffuseLighting>
                                <feSpecularLighting surfaceScale="2" specularConstant="0.6" specularExponent="15" lightingColor="#fff" result="specular">
                                    <fePointLight x="-50" y="-100" z="100" />
                                </feSpecularLighting>
                                <feComposite operator="arithmetic" k1="0" k2="0.6" k3="0.4" k4="0" in="diffuse" in2="specular" result="texture" />
                                <feComposite operator="in" in="texture" in2="SourceAlpha" result="maskedTexture" />
                                <feBlend mode="multiply" in="maskedTexture" in2="SourceGraphic" />
                            </filter>
                            <radialGradient id="piece-gloss" cx="30%" cy="30%" r="50%" fx="30%" fy="30%">
                                <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="white" stopOpacity="0" />
                            </radialGradient>
                            <radialGradient id="piece-depth" cx="50%" cy="50%" r="50%">
                                <stop offset="80%" stopColor="black" stopOpacity="0" />
                                <stop offset="100%" stopColor="black" stopOpacity="0.4" />
                            </radialGradient>
                        </>
                    ) : (
                        <>
                            <radialGradient id="simple-depth" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                                <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
                            </radialGradient>
                            <radialGradient id="piece-gloss" cx="30%" cy="30%" r="50%" fx="30%" fy="30%">
                                <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="white" stopOpacity="0" />
                            </radialGradient>
                            <radialGradient id="piece-depth" cx="50%" cy="50%" r="50%">
                                <stop offset="70%" stopColor="black" stopOpacity="0" />
                                <stop offset="100%" stopColor="black" stopOpacity="0.3" />
                            </radialGradient>
                        </>
                    )}
                </defs>

                {/* Layer 0: Animated Elements (Behind the board) */}
                {theme.visuals?.backgroundElements === 'animated-fish' && (
                    <g pointerEvents="none">
                        {[
                            { id: 1, y: 20, delay: 0, scale: 1, speed: 45 },
                            { id: 2, y: 45, delay: 10, scale: 0.7, speed: 55 },
                            { id: 3, y: 70, delay: 5, scale: 1.2, speed: 65 },
                            { id: 4, y: 30, delay: 25, scale: 0.8, speed: 50 },
                            { id: 5, y: 85, delay: 35, scale: 0.9, speed: 60 },
                        ].map(fish => (
                            <g key={fish.id} className="animate-fish-swim" style={{
                                animationDelay: `${fish.delay}s`,
                                animationDuration: `${fish.speed}s`,
                            } as any}>
                                <g transform={`translate(-20, ${fish.y}) scale(${-fish.scale}, ${fish.scale})`}>
                                    <path
                                        className="animate-fish-wag"
                                        style={{ animationDelay: `${fish.delay}s` }}
                                        d="M 0,0 C 2,-2 6,-4 10,-4 C 14,-4 18,-2 20,0 L 24,-3 L 24,3 L 20,0 C 18,2 14,4 10,4 C 6,4 2,2 0,0 Z M 8,-4 L 10,-6 L 12,-4 Z M 9,4 L 11,6 L 12,4 Z"
                                        fill={theme.textColor}
                                        opacity="0.12"
                                    />
                                </g>
                            </g>
                        ))}
                    </g>
                )}

                {/* Rotatable Container */}
                <g style={{ transformOrigin: '50px 50px', transform: `rotate(${rotation}deg)`, transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)', willChange: 'transform' }}>

                    {/* 1. Static Layer (Background, Cells, Bases) - Memoized */}
                    {/* 1. Static Layer (Background, Cells, Bases) - Memoized */}
                    <BoardStaticLayer
                        theme={theme}
                        playerCount={playerCount}
                        rotation={rotation}
                    />

                    {/* 2. Interactive Layer (Highlights under pieces) - Memoized */}
                    {/* Rendered here to be under pieces but over static board */}
                    {/* 2. Interactive Layer (Highlights/Glows) - Memoized */}
                    <BoardInteractiveLayer
                        theme={theme}
                        highlightedCells={highlightedCells}
                        highlightSection={highlightSection}
                        playerCount={playerCount}
                        currentTurn={currentTurn}
                    />

                    {/* 3. Pieces Layer - Memoized */}
                    <BoardPiecesLayer
                        players={players}
                        playerCount={playerCount}
                        currentTurn={currentTurn}
                        theme={theme}
                        validPieceIndices={validPieceIndices}
                        selectedPieceId={selectedPieceId}
                        onPieceClick={onPieceClick}
                    />

                </g>
            </svg>

            {/* Unified Emote Layer (Overlay) */}
            {
                activeEmotes.length > 0 && players.map(p => {
                    const pos = getVisualPosition(p.color, rotation);
                    let left = '50%';
                    let startTop = '50%';
                    let endTop = '0%';

                    switch (pos) {
                        case 'TL': left = '16.5%'; startTop = '28%'; endTop = '5%'; break;
                        case 'TR': left = '83.5%'; startTop = '28%'; endTop = '5%'; break;
                        case 'BL': left = '16.5%'; startTop = '95%'; endTop = '72%'; break;
                        case 'BR': left = '83.5%'; startTop = '95%'; endTop = '72%'; break;
                    }

                    return activeEmotes.filter(e => e.userId === p.id).map(e => (
                        <div key={e.timestamp} className="absolute z-[60] pointer-events-none w-0 h-full top-0" style={{ left }}>
                            <FloatingEmote emoteId={e.emoteId as any} startTop={startTop} endTop={endTop} />
                        </div>
                    ));
                })
            }
        </div >
    );
};

export const GameBoard = memo(GameBoardComponent);
