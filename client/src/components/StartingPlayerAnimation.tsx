import React, { useEffect, useState } from 'react';
import type { PlayerColor } from '@parchis/shared';

interface StartingPlayerAnimationProps {
    winnerColor: PlayerColor;
    winnerName: string;
    onComplete: () => void;
    myColor: PlayerColor | null;
}

export const StartingPlayerAnimation: React.FC<StartingPlayerAnimationProps> = ({
    winnerColor,
    winnerName,
    onComplete,
    myColor
}) => {
    const [displayedColor, setDisplayedColor] = useState<PlayerColor>('yellow');
    const [displayedName, setDisplayedName] = useState<string>('...');
    const [phase, setPhase] = useState<'shuffling' | 'revealed'>('shuffling');

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        let counter = 0;
        const maxShuffles = 20; // Number of shuffles before stop

        const shuffle = () => {
            counter++;

            if (counter >= maxShuffles) {
                clearInterval(interval);
                setPhase('revealed');
                setDisplayedColor(winnerColor);
                setDisplayedName(winnerName);

                // Auto dismiss after showing winner
                setTimeout(onComplete, 4000);
            } else {
                // Cycle through all colors for visual effect, not just active players
                const allColors: PlayerColor[] = ['yellow', 'blue', 'red', 'green'];
                const randomColor = allColors[Math.floor(Math.random() * allColors.length)];

                setDisplayedColor(randomColor);
                setDisplayedName('...');
            }
        };

        // Start fast shuffling
        interval = setInterval(shuffle, 100);

        return () => clearInterval(interval);
    }, [winnerColor, winnerName]);

    const getBgColor = (c: PlayerColor) => {
        switch (c) {
            case 'yellow': return 'bg-yellow-500';
            case 'blue': return 'bg-blue-500';
            case 'red': return 'bg-red-500';
            case 'green': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const getShadowColor = (c: PlayerColor) => {
        switch (c) {
            case 'yellow': return 'shadow-yellow-500/50';
            case 'blue': return 'shadow-blue-500/50';
            case 'red': return 'shadow-red-500/50';
            case 'green': return 'shadow-green-500/50';
            default: return 'shadow-gray-500/50';
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md" style={{ zIndex: 99999 }}>
            <div className="flex flex-col items-center gap-4 px-4 w-full">
                <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-widest animate-pulse text-center">
                    {phase === 'shuffling' ? 'Who starts?' : 'Starting Player!'}
                </h2>

                <div className={`
                    relative w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center
                    transition-all duration-200 transform
                    ${getBgColor(displayedColor)}
                    ${phase === 'revealed' ? 'scale-110 shadow-[0_0_30px_currentColor] animate-bounce' : 'scale-100 shadow-xl'}
                    ${getShadowColor(displayedColor)}
                `}>
                    <div className="absolute inset-2 border-4 border-white/30 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />

                    <span className="text-3xl md:text-5xl filter drop-shadow-lg">
                        {fixedEmoji()}
                    </span>
                </div>

                <div className="text-center w-full max-w-md px-4 py-3 bg-gray-800/90 rounded-xl backdrop-blur-sm border border-gray-700 shadow-2xl">
                    <p className="text-base md:text-lg font-bold text-gray-300 mb-1">
                        {phase === 'revealed'
                            ? (myColor === winnerColor ? 'Luck is with you!' : 'The winner is:')
                            : 'Shuffling turns...'}
                    </p>
                    <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-wider break-words drop-shadow-lg leading-tight">
                        <span className={phase === 'revealed' ? 'text-yellow-400 animate-pulse' : 'text-white'}>
                            {phase === 'revealed' && myColor === winnerColor ? 'YOU!' : displayedName}
                        </span>
                    </h1>
                </div>
            </div>
        </div>
    );
};

// Helper to get dice emoji (always dice now)
const fixedEmoji = () => {
    return '🎲';
};
