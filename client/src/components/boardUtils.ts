import type { PlayerColor } from '@parchis/shared';

// Math helpers for board rotation and visual positioning
export const getRotationForPlayer = (color: PlayerColor | null): number => {
    if (!color) return 0;
    switch (color) {
        case 'yellow': return 0;
        case 'blue': return 90;
        case 'red': return 180;
        case 'green': return 270;
        default: return 0;
    }
};

export type VisualPosition = 'TL' | 'TR' | 'BL' | 'BR';

export const getVisualPosition = (pColor: PlayerColor, boardRotation: number): VisualPosition => {
    const baseMap: Record<PlayerColor, number> = {
        'green': 0,
        'red': 1,
        'blue': 2,
        'yellow': 3,
        'purple': 4,
        'orange': 5,
        'gray': -1
    };

    const baseIndex = baseMap[pColor];
    if (baseIndex === -1) return 'TL'; // Default for spectators

    const shift = Math.floor(boardRotation / 90);
    const visualIndex = (baseIndex + shift) % 4;

    const positions: VisualPosition[] = ['TL', 'TR', 'BR', 'BL'];
    return positions[visualIndex];
};

// Authentic Parchis 4-Player Grid System
// The board is a 18x18 or similar grid conceptually, but let's stick to standard Ludo/Parchis metric.
// Common layout: Cross shape.
// Center is "Home".
// 4 Arms of 3 columns x 8 rows (approx).
// Let's use a 0-100 coordinate system but derive it from a 15x15 grid (standard size).
// 15x15 Grid:
// Center is (7, 7) (0-indexed).
// Arm width is 3 cells.
// Arm length is 6 cells from edge to center block.
// Each arm has 3x6 = 18 cells, but the "Home Path" is the middle column.
// The "Track" is the outer columns.

// Grid Unit
const NEST_ZONE_PCT = 33; // 33% for 8 nest cells = ~4.125% per cell
const CENTER_ZONE_PCT = 34; // 34% for 3 center cells = ~11.33% per cell
// Total = 33 + 34 + 33 = 100%
// Boundaries: 33, 67.

// Map logical index (0..18) to Visual % Center and Size
const getVisual = (idx: number) => {
    let startPct = 0;
    let sizePct = 0;

    if (idx < 8) {
        // Left/Top Nest Zone (0..7)
        sizePct = NEST_ZONE_PCT / 8; // 4.125
        startPct = idx * sizePct;
    } else if (idx <= 10) {
        // Center Zone (8..10)
        sizePct = CENTER_ZONE_PCT / 3; // 11.33
        const offset = idx - 8;
        startPct = NEST_ZONE_PCT + (offset * sizePct);
    } else {
        // Right/Bot Nest Zone (11..18)
        sizePct = NEST_ZONE_PCT / 8;
        const offset = idx - 11;
        startPct = NEST_ZONE_PCT + CENTER_ZONE_PCT + (offset * sizePct);
    }

    return { center: startPct + sizePct / 2, size: sizePct };
};

const c = (x: number, y: number) => {
    const vx = getVisual(x);
    const vy = getVisual(y);
    return { x: vx.center, y: vy.center, w: vx.size, h: vy.size };
};

export const ZONE_BOUNDARIES = {
    NEST: NEST_ZONE_PCT,
    CENTER_START: NEST_ZONE_PCT,
    CENTER_END: NEST_ZONE_PCT + CENTER_ZONE_PCT
};

// Coordinate Lookups
// We need to map 0..67 (Common Track) to (col, row).
// Let's define the path for the Bottom Right quadrant and rotate? 
// Or just hardcode the loop for clarity. Only 68 cells.

// Standard Parchis Sequence (Starting from bottom-right, moving counter-clockwise usually? No, Ludo is clockwise. Parchis/Ludo variations exist).
// Let's assume standard Counter-Clockwise (Right -> Top -> Left -> Bottom).
// Wait, classic Parchis is usually CCW.
// Let starts be:
// Yellow (Bottom-Right corner nest) -> Starts on Right Arm, bottom cell?
// Let's use a explicit Walk Path for the 68 common cells.

// Visual Grid (15x15):
// Cols 0-5: Left Wing
// Cols 6-8: Center Vertical
// Cols 9-14: Right Wing
// Rows 0-5: Top Wing
// Rows 6-8: Center Horizontal
// Rows 9-14: Bottom Wing

// Let's define the 68 cells walk path manually for precision.
// Step 0 is typically the "Start" of Player 1.
// Let's arbitrarily start at Bottom-Right of the cross (Col 8, Row 14) and go Up?
// Actually, let's trace the perimeter.

// Function to generate the 68 coordinates on a 19x19 grid.
const generateTrack68 = () => {
    const path: { x: number, y: number, w: number, h: number }[] = [];

    // Quadrant 1 (Bottom Right, RED usually starts here in some variants, or Blue?)
    // Let's start visual index 0 at: X=10, Y=18 (Bottom of right-column of bottom-arm).
    // Wait, Center is roughly 9. Cols 8, 9, 10 are the vertical arm.
    // Rows 11-18 are the bottom arm (8 cells).
    // Start at (10, 18) -> Up to (10, 11) (8 cells).
    // Turn Right -> (11, 10) -> (18, 10) (8 cells).
    // Turn Up -> (18, 9) (Middle Right End).
    // Turn Left -> (18, 8) -> (11, 8) (8 cells).
    // Up -> (10, 7) -> (10, 0) (8 cells).
    // Left -> (9, 0).
    // Down -> (8, 0) -> (8, 7) (8 cells).
    // Left -> (7, 8) -> (0, 8) (8 cells).
    // Down -> (0, 9).
    // Right -> (0, 10) -> (7, 10) (8 cells).
    // Down -> (8, 11) -> (8, 18).
    // Right -> (9, 18).

    // Sequence generator helper
    const addLine = (xStart: number, yStart: number, xEnd: number, yEnd: number) => {
        const dx = Math.sign(xEnd - xStart);
        const dy = Math.sign(yEnd - yStart);
        let x = xStart;
        let y = yStart;
        while (true) {
            path.push(c(x, y));
            if (x === xEnd && y === yEnd) break;
            x += dx;
            y += dy;
        }
    };

    // 1. Up Right-Side Vertical Arm (Bottom): (10, 18) to (10, 11) [8 steps]
    addLine(10, 18, 10, 11);
    // 2. Right into Bottom-Side Horizontal Arm (Right): (11, 10) to (18, 10) [8 steps]
    addLine(11, 10, 18, 10);
    // 3. Up (Middle Right): (18, 9) [1 step]
    addLine(18, 9, 18, 9);
    // 4. Left Top-Side Horizontal Arm (Right): (18, 8) to (11, 8) [8 steps]
    addLine(18, 8, 11, 8);
    // 5. Up Right-Side Vertical Arm (Top): (10, 7) to (10, 0) [8 steps]
    addLine(10, 7, 10, 0);
    // 6. Left (Middle Top): (9, 0) [1 step]
    addLine(9, 0, 9, 0);
    // 7. Down Left-Side Vertical Arm (Top): (8, 0) to (8, 7) [8 steps]
    addLine(8, 0, 8, 7);
    // 8. Left Top-Side Horizontal Arm (Left): (7, 8) to (0, 8) [8 steps]
    addLine(7, 8, 0, 8);
    // 9. Down (Middle Left): (0, 9) [1 item]
    addLine(0, 9, 0, 9);
    // 10. Right Bottom-Side Horizontal Arm (Left): (0, 10) to (7, 10) [8 steps]
    addLine(0, 10, 7, 10);
    // 11. Down Left-Side Vertical Arm (Bottom): (8, 11) to (8, 18) [8 steps]
    addLine(8, 11, 8, 18);
    // 12. Right (Middle Bottom): (9, 18)
    addLine(9, 18, 9, 18);

    return path;
};

const COMMON_COORDS_4P = generateTrack68();

// Home Paths (7 cells) + Goal
// Player 0 (Blue?): Bottom Arm Center. Starts (9, 18) -> (9, 11).
// Player 1 (Red?): Right Arm Center. Starts (18, 9) -> (11, 9).
// Player 2 (Green?): Top Arm Center. Starts (9, 0) -> (9, 7).
// Player 3 (Yellow?): Left Arm Center. Starts (0, 9) -> (7, 9).

const getHomePathCoords = (colorIndex: number, step: number) => {
    // step 0..7. 7 is center goal? 
    // Usually 7 steps then goal.
    // Let's map step 0..6 as path, 7 as goal entry? common is 7 squares.
    // Center is (9, 9) in 19x19 grid.

    // Bottom (Player 0): X=9, Y=17 down to Y=11. (7 steps).
    if (colorIndex === 0) return c(9, 17 - step);
    // Right (Player 1): X=17 down to 11, Y=9.
    if (colorIndex === 1) return c(17 - step, 9);
    // Top (Player 2): X=9, Y=1 up to 7.
    if (colorIndex === 2) return c(9, 1 + step);
    // Left (Player 3): X=1 up to 7, Y=9.
    if (colorIndex === 3) return c(1 + step, 9);

    return { x: 50, y: 50, w: 0, h: 0 };
};

export const getPieceCoordinates = (
    position: number,
    playerCount: 4 | 6,
    status: 'nest' | 'active' | 'home_path' | 'goal',
    color: PlayerColor
): { x: number, y: number, w: number, h: number } => {
    // Fix Colors to Indices for 4 Player Standard
    // Colors: Blue(Bot), Red(Right), Green(Top), Yellow(Left)?
    // NOTE: This visual mapping must match the turn order and nest position.
    // Let's assign:
    // 0: Blue (Bottom)
    // 1: Red (Right)
    // 2: Green (Top)
    // 3: Yellow (Left)

    // Map string color to index 0..3
    const colorMap: Record<string, number> = { 'blue': 0, 'red': 1, 'green': 2, 'yellow': 3 };
    // Fallback for 6 players colors...
    if (playerCount === 6) {
        // Todo: Implement 6 player grid (hexagonal?). For now center.
        return { x: 50, y: 50, w: 0, h: 0 };
    }

    const cIdx = colorMap[color] ?? 0;

    if (status === 'nest') {
        // Nests are large 8x8 areas in corners.
        // Nest Grid coordinates (0..18 range):
        // Top-Left: Rows 0..7, Cols 0..7. Center = 3.5, 3.5.
        // Top-Right: Rows 0..7, Cols 11..18. Center = 14.5, 3.5.
        // Bot-Left: Rows 11..18, Cols 0..7. Center = 3.5, 14.5.
        // Bot-Right: Rows 11..18, Cols 11..18. Center = 14.5, 14.5.

        // Colors mapping:
        // 0: Blue (Bot-Right) -> 14.5, 14.5
        // 1: Red (Top-Right) -> 14.5, 3.5
        // 2: Green (Top-Left) -> 3.5, 3.5
        // 3: Yellow (Bot-Left) -> 3.5, 14.5

        let nx = 0, ny = 0;
        if (cIdx === 0) { nx = 14.5; ny = 14.5; } // Blue
        else if (cIdx === 1) { nx = 14.5; ny = 3.5; } // Red
        else if (cIdx === 2) { nx = 3.5; ny = 3.5; } // Green
        else { nx = 3.5; ny = 14.5; } // Yellow (3)

        // If position is small number 0-3, treat as nest index?
        const offset = position >= 0 && position < 4 ? position : 0;

        // 2x2 arrangement centered around (nx, ny)
        // Spacing: 1.5 units between centers?
        // -0.75, +0.75 from center? 
        // dx = -1.5? No.
        // If we want spacing of 2 units. -1, +1.

        const dx = (offset % 2 === 0) ? -1.2 : 1.2;
        const dy = (offset < 2) ? -1.2 : 1.2;

        // Use default small cell size for nest piece positioning
        const sizePct = NEST_ZONE_PCT / 8;
        return { ...c(nx + dx, ny + dy), w: sizePct, h: sizePct }; // Use 'c' but coordinates are distinct here. 
        // Actually, 'c' expects grid indices. nx/ny are floats 14.5. 
        // Our 'getVisual' works on float indices too? 
        // 'c' calls getVisual(x). getVisual checks if x < 8.
        // If x=14.5, it goes to "Right Nest" branch. 
        // 14.5 - 11 = 3.5 offset. 
        // So it calculates correct center. Good.
        return c(nx + dx, ny + dy);
    }

    if (status === 'goal') {
        const offset = 0.85; // Less offset to center them better in the larger 'triangle' area? 
        // Actually, 1.0 pushed them far into the quadrant.
        // If we want to avoid lines, we need to center the 2x2 clump in the available wedge.
        // The center is (7,7) in 0-indexed 15x15? 
        // My grid uses 0..18 ?
        // Width is 3.
        // Center vertical is 8. Center horizontal is 8.
        // (8,8) is exact center.

        let gx = 9, gy = 9; // This is my (8,8) equivalent in 19x19 logic? 
        // In boardUtils I mapped 0-100% based on 15x15 logic but indices are 0..18?
        // Let's assume gx=9, gy=9 is Center.

        // Base center point shifted into triangle
        if (cIdx === 0) gy += offset;      // Blue (Bottom)
        else if (cIdx === 1) gx += offset; // Red (Right)
        else if (cIdx === 2) gy -= offset; // Green (Top) 
        else if (cIdx === 3) gx -= offset; // Yellow (Left)

        // 2x2 Layout: 
        // 0: TL, 1: TR, 2: BL, 3: BR
        const pIdx = (position >= 0 && position < 4) ? position : 0;
        const spacing = 0.18; // Tighter spacing (was 0.22) to prevent overlap with lines now that r=2.5

        // Calculate visual offsets relative to the group center (gx, gy)
        const dx = (pIdx % 2 === 0) ? -spacing : spacing;
        const dy = (pIdx < 2) ? -spacing : spacing;

        return c(gx + dx, gy + dy);
    }

    if (status === 'home_path') {
        const index = position - 1000;
        return getHomePathCoords(cIdx, index);
    }

    // Active
    // We need to shift the common coordinates based on who '0' is.
    // Our path generator starts at Bottom-Right Vertical Up (Blue Start + 5?).
    // Start Cells (Safe):
    // Blue Start: Index 5 (approx). (10, 14) is Safe?
    // Let's rely on the visual index 0..67.
    // However, the Logic engine treats '0' as "Start of Common Track" relative to Player?
    // NO. Shared Logic usually uses absolute board indices 0..67 
    // OR relative. 
    // Checking logic.ts: `getBoardIndex(player, relativeIndex)`.
    // It implies position is ABSOLUTE 0..67.
    // So we just return COMMON_COORDS_4P[position].

    return COMMON_COORDS_4P[position % 68];
};

export const getPiecePath = (
    prev: { position: number, status: string },
    curr: { position: number, status: string },
    playerCount: 4 | 6,
    color: PlayerColor,
    pieceIndex: number = 0
): { x: number, y: number, w: number, h: number }[] => {
    const path: { x: number, y: number, w: number, h: number }[] = [];

    // 1. Same status movement (Active -> Active, or HomePath -> HomePath)
    if (prev.status === curr.status) {
        if (prev.status === 'active') {
            // Handle logical movement, including wrap-around 67->0
            let currentIdx = prev.position;
            const targetIdx = curr.position;

            // We move forward until we hit target
            // Calculate distance? 
            // Distance = (target - current + 68) % 68. 
            const distance = (targetIdx - currentIdx + 68) % 68;

            // BUG FIX: Sentinel check for glitched paths.
            // Max legal move is 20 (Bonus). If distance > 25, it's likely a wrap-around glitch
            // or a state synchronization mismatch (e.g. 0 -> 55).
            // In these cases, force a direct jump/arc instead of walking 50+ tiles.
            if (distance > 25) {
                // Treat as "Teleport" / Correction
                path.push(getPieceCoordinates(curr.position, playerCount, 'active', color));
            } else {
                // Generate intermediate points (excluding start, including end)
                for (let i = 1; i <= distance; i++) {
                    const idx = (currentIdx + i) % 68;
                    path.push(getPieceCoordinates(idx, playerCount, 'active', color));
                }
            }
        }
        else if (prev.status === 'home_path') {
            // Linear movement in home path
            // e.g. 1000 -> 1003
            const start = prev.position;
            const end = curr.position;
            for (let i = start + 1; i <= end; i++) {
                path.push(getPieceCoordinates(i, playerCount, 'home_path', color));
            }
        }
        else {
            // Nest->Nest or Goal->Goal? Just jump.
            path.push(getPieceCoordinates(curr.position, playerCount, curr.status as any, color));
        }
    }
    // 2. Transistions
    else if (prev.status === 'active' && curr.status === 'home_path') {
        // Enters home path.
        // We need to know where the entrance is.
        // For standard parchess, entry is usually 5 cells before start?
        // Or specific indices:
        // Blue (0): Enters at 11? No, 17 is path start?
        // Let's rely on calculating "Active" steps until we reach the specific Turn-in point?
        // Simpler: Just Interpolate? No, we want grid walking.

        // Complex logic: We don't easily know the exact "entry index" from here without hardcoding color rules again.
        // But we assume the move was valid.
        // Strategy: 
        // 1. Move active until 'entry' (heuristic: closest active cell to first home_path cell?)
        // 2. Move home_path.

        // Heuristic: Find distance from prev.pos to HomePath[0] coordinate? 
        // Better: Just assume the dice count logic.
        // But we don't have dice count here, just prev/next.

        // Let's just create a direct path for now? 
        // User wants "Pass thru all boxes".

        // Let's look at the Home Path Entry indices (Standard Parchis/Ludo):
        // Blue: 16? Red: 33? Green: 50? Yellow: 67?
        // Let's hardcode Entry Indices based on getHomePathCoords logic.
        // Blue (Bot): Path starts (9, 17). Adjacent active is (8, 17) which is index ~16.
        // Let's assume Entry Indices:
        // Blue: 16 -> HomePath
        // Red: 33 -> HomePath
        // Green: 50 -> HomePath
        // Yellow: 67 -> HomePath

        // Correct Entry Indices (Junctions):
        // Blue (Bottom): 67 (Bottom Middle)
        // Red (Right): 16 (Right Middle)
        // Green (Top): 33 (Top Middle)
        // Yellow (Left): 50 (Left Middle)
        const entries: Record<string, number> = { 'blue': 67, 'red': 16, 'green': 33, 'yellow': 50 };
        const entryIdx = entries[color] || 0;

        // 1. Walk to Entry
        let p = prev.position;
        // Distance to entry
        const distToEntry = (entryIdx - p + 68) % 68;
        for (let i = 1; i <= distToEntry; i++) {
            path.push(getPieceCoordinates((p + i) % 68, playerCount, 'active', color));
        }

        // 2. Walk Home Path
        // curr.position is e.g. 1003
        const endHP = curr.position;
        // Walk Home Path (1000..end)
        for (let i = 1000; i <= endHP; i++) {
            path.push(getPieceCoordinates(i, playerCount, 'home_path', color));
        }
    }
    else if (curr.status === 'goal') {
        // HomePath -> Goal
        if (prev.status === 'home_path') {
            // Max home path is 1006. 
            // Walk rest of home path?
            // Usually goal is reached after last step.
            // Just add goal coord using pieceIndex
            path.push(getPieceCoordinates(pieceIndex, playerCount, 'goal', color));
        } else {
            // Direct? (e.g. Active -> Goal? rare)
            path.push(getPieceCoordinates(pieceIndex, playerCount, 'goal', color));
        }
    }
    else {
        // Nest -> Active (Spawn) OR Active -> Nest (Capture)
        const startPos = getPieceCoordinates(prev.status === 'nest' ? pieceIndex : prev.position, playerCount, prev.status as any, color);
        const endPos = getPieceCoordinates(curr.status === 'nest' ? pieceIndex : curr.position, playerCount, curr.status as any, color);

        // If exiting nest, just do a simple arc or direct jump to avoid "lap" interpolation
        // Broaden check: status 'nest' OR position -1 (logical nest)
        if ((prev.status === 'nest' || prev.position === -1) && curr.status === 'active') {
            // 3 points: Start (Nest), Apex (Midpoint + height), End (Start Cell)
            const midX = (startPos.x + endPos.x) / 2;
            const midY = (startPos.y + endPos.y) / 2;

            // Simple direct path with a hop, no intermediate board cells
            path.push(startPos);
            path.push({ x: midX, y: midY, w: startPos.w, h: startPos.h });
            path.push(endPos);
        } else {
            // General capture or other transition
            const midX = (startPos.x + endPos.x) / 2;
            const midY = (startPos.y + endPos.y) / 2;

            path.push(startPos);
            path.push({ ...startPos, x: midX, y: midY });
            path.push(endPos);
        }
    }

    if (path.length === 0) {
        // Fallback: just return target
        let targetPos = curr.position;
        if (curr.status === 'nest') {
            targetPos = pieceIndex;
        }
        path.push(getPieceCoordinates(targetPos, playerCount, curr.status as any, color));
    }

    return path;
};

