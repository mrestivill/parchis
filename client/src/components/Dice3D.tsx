import React, { useEffect, useState } from 'react';

interface Dice3DProps {
    value: number;
    onClick?: (e?: React.MouseEvent) => void;
    isValid?: boolean;
    size?: 'sm' | 'md' | 'lg';
    onRollComplete?: () => void;
}

export const Dice3D: React.FC<Dice3DProps> = (props) => {
    const { value, onClick, isValid = false, size = 'md' } = props;
    const [rolling, setRolling] = useState(false);
    const [internalValue, setInternalValue] = useState(1);

    // Trigger animation when value changes
    useEffect(() => {
        if (value) {
            setRolling(true);
            // Random rotations for effect
            const timeout = setTimeout(() => {
                setRolling(false);
                setInternalValue(value);
                if (props.onRollComplete) props.onRollComplete();
            }, 600); // 0.6s roll
            return () => clearTimeout(timeout);
        }
    }, [value]);

    const getSizeClass = () => {
        switch (size) {
            case 'sm': return 'w-8 h-8';
            case 'md': return 'w-12 h-12';
            case 'lg': return 'w-16 h-16';
            default: return 'w-12 h-12';
        }
    };



    // Proper 6 face pips mapping for 3x3 grid
    /*
    Grid:
    0 1 2
    3 4 5
    6 7 8
    */
    // 1: Center(4)
    // 2: TopLeft(0), BottomRight(8)
    // 3: 0, 4, 8
    // 4: 0, 2, 6, 8
    // 5: 4 + Center
    // 6: 3 rows of 2 (vertical) -> TL, ML, BL, TR, MR, BR
    // Let's use flex/grid for faces individually

    const getRotation = (val: number) => {
        switch (val) {
            case 1: return 'rotateX(0deg) rotateY(0deg)';
            case 6: return 'rotateX(180deg) rotateY(0deg)';
            /*
              Layout:
              Front: TZ
              Back: Rot180 TZ
              Right (3): RotY(90) TZ
              Left (4): RotY(-90) TZ
              Top (2): RotX(90) TZ? No, RotX(90) points DOWN?
              CSS Coords: Y is down.
              RotX(90) -> Top moves back?
              Let's stick to standard cube unfolding.
              Front (1)
              Back (6)
              Right (3) -> RotY(90)
              Left (4) -> RotY(-90)
              Top (2) -> RotX(90) (Actually bottom in some systems, depends on axis)
              Bottom (5) -> RotX(-90)
              
              Correction below:
            */
            case 3: return 'rotateY(-90deg)'; // Show Right Face
            case 4: return 'rotateY(90deg)';  // Show Left Face
            case 2: return 'rotateX(-90deg)'; // Show Top Face
            case 5: return 'rotateX(90deg)';  // Show Bottom Face
            default: return 'rotateX(0deg)';
        }
    };

    // We only render ONE face? No, 3D dye needs all 6.
    // Actually, for a simple "realistic" look without full WebGL, we can just rotate the container.

    const Face = ({ val }: { val: number }) => {
        // Render dots
        // 3x3 Grid


        // 6 is special: Cols of 3.
        // Standard pips:
        // 1: Center
        // 2: TR, BL
        // 3: TR, Center, BL
        // 4: TR, TL, BR, BL
        // 5: 4 + Center
        // 6: 3 rows of 2 (vertical) -> TL, ML, BL, TR, MR, BR
        // Grid Indices:
        /*
          0 . 2    (0, 2)
          . . .
          6 . 8    (6, 8)
          
          For 6:
          0 . 2
          3 . 5
          6 . 8
        */
        const pipMap: Record<number, number[]> = {
            1: [4],
            2: [2, 6],
            3: [2, 4, 6],
            4: [0, 2, 6, 8],
            5: [0, 2, 4, 6, 8],
            6: [0, 2, 3, 5, 6, 8]
        };

        const activePips = pipMap[val] || [];

        return (
            <div className={`w-full h-full bg-white rounded-xl border-2 border-gray-400 grid grid-cols-3 grid-rows-3 p-1 shadow-md
            ${isValid ? 'ring-4 ring-yellow-400 bg-yellow-50' : ''}
        `}>
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="flex items-center justify-center">
                        {activePips.includes(i) && (
                            <div className={`rounded-full bg-black shadow-sm ${size === 'sm' ? 'w-1.5 h-1.5' :
                                size === 'md' ? 'w-2.5 h-2.5' : 'w-3 h-3'
                                }`} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Full 3D Implementation requires absolute positioning
    // We will cheat slightly and only render the CURRENT face with a transition, 
    // OR we implement the full cube. Full Cube is cooler.

    const getTranslateZ = () => {
        switch (size) {
            case 'sm': return '16px'; // 32/2
            case 'md': return '24px'; // 48/2
            case 'lg': return '32px'; // 64/2
            default: return '24px';
        }
    };

    const tz = getTranslateZ();

    return (
        <div
            className={`scene relative ${getSizeClass()} select-none cursor-pointer flex items-center justify-center`}
            style={{ perspective: '600px' }}
            onClick={(e) => isValid && onClick && onClick(e)}
        >
            <div
                className={`cube w-full h-full relative transition-transform duration-[600ms]`}
                style={{
                    transformStyle: 'preserve-3d',
                    transitionTimingFunction: 'cubic-bezier(0.15, 0.25, 0.25, 1.2)', // Slight overshoot for "heavy" thud
                    transform: rolling
                        ? `scale(0.8) rotateX(${720 + Math.random() * 360}deg) rotateY(${720 + Math.random() * 360}deg)`
                        : `scale(1) ${getRotation(internalValue)}`
                }}
            >
                {/* Faces */}
                {/* Front (1) */}
                <div className="absolute inset-0" style={{ transform: `translateZ(${tz})`, backfaceVisibility: 'hidden' }}><Face val={1} /></div>
                {/* Back (6) */}
                <div className="absolute inset-0" style={{ transform: `rotateX(180deg) translateZ(${tz})`, backfaceVisibility: 'hidden' }}><Face val={6} /></div>
                {/* Right (3) */}
                <div className="absolute inset-0" style={{ transform: `rotateY(90deg) translateZ(${tz})`, backfaceVisibility: 'hidden' }}><Face val={3} /></div>
                {/* Left (4) */}
                <div className="absolute inset-0" style={{ transform: `rotateY(-90deg) translateZ(${tz})`, backfaceVisibility: 'hidden' }}><Face val={4} /></div>
                {/* Top (2) */}
                <div className="absolute inset-0" style={{ transform: `rotateX(90deg) translateZ(${tz})`, backfaceVisibility: 'hidden' }}><Face val={2} /></div>
                {/* Bottom (5) */}
                <div className="absolute inset-0" style={{ transform: `rotateX(-90deg) translateZ(${tz})`, backfaceVisibility: 'hidden' }}><Face val={5} /></div>
            </div>
        </div>
    );
};

// Note: translateZ should be half the size (24px for w-12/48px). 
// Need to adjust calculate based on size.
