import { RuleEngine } from '../../rules/RuleEngine';
import type { GameState } from '../../types';

describe('Mandatory Fallback Rules', () => {
    let gameState: GameState;

    beforeEach(() => {
        gameState = {
            roomId: 'test-room',
            status: 'playing',
            players: [
                {
                    id: 'player-1',
                    name: 'Player 1',
                    color: 'red',
                    isConnected: true,
                    hasLeft: false,
                    pieces: [
                        { id: 'red-0', position: 10, status: 'active', distanceFromStart: 10, color: 'red', isSafe: false },
                        { id: 'red-1', position: 10, status: 'active', distanceFromStart: 10, color: 'red', isSafe: false },
                        { id: 'red-2', position: 20, status: 'active', distanceFromStart: 20, color: 'red', isSafe: false },
                        { id: 'red-3', position: -1, status: 'nest', distanceFromStart: 0, color: 'red', isSafe: false }
                    ]
                },
                {
                    id: 'player-2',
                    name: 'Player 2',
                    color: 'blue',
                    isConnected: true,
                    hasLeft: false,
                    pieces: [
                        { id: 'blue-0', position: 16, status: 'active', distanceFromStart: 16, color: 'blue', isSafe: false },
                        { id: 'blue-1', position: 16, status: 'active', distanceFromStart: 16, color: 'blue', isSafe: false },
                        { id: 'blue-2', position: -1, status: 'nest', distanceFromStart: 0, color: 'blue', isSafe: false },
                        { id: 'blue-3', position: -1, status: 'nest', distanceFromStart: 0, color: 'blue', isSafe: false }
                    ]
                }
            ],
            currentTurn: 'red',
            dice: [6, 6],
            diceRolled: true,
            consecutiveDoubles: 1,
            blockadeBreakRequired: true,
            totalTurns: 1,
            spectators: [],
            lastActionTimestamp: Date.now(),
            turnTimeLeft: 60,
            options: {
                turnDuration: 60,
                allowSpectators: true
            }
        } as unknown as GameState;
    });

    afterEach(() => {
        RuleEngine.clearCache();
    });

    it('should allow moving other pieces when mandatory blockade break is impossible due to enemy blockade', () => {
        // Red pieces 0 and 1 are at 10 (blockade)
        // Blue pieces 0 and 1 are at 16 (blockade)
        // Red rolls 6-6. Mandatory to break blockade at 10.
        // Red Start is 21. Pos 10 is Dist (10 - 21 + 68) % 68 = 57.
        // Current Dist = 57. New Dist = 57 + 6 = 63.
        // Pos at 63 = (21 + 63) % 68 = 16.
        // Blue has blockade at 16. Move is BLOCKED by DestinationValidator (capacity 2).

        gameState.players[0].pieces[0].position = 10;
        gameState.players[0].pieces[0].distanceFromStart = 57;
        gameState.players[0].pieces[1].position = 10;
        gameState.players[0].pieces[1].distanceFromStart = 57;

        gameState.players[1].pieces[0].position = 16;
        gameState.players[1].pieces[1].position = 16;

        gameState.players[0].pieces[2].position = 21; // At start
        gameState.players[0].pieces[2].distanceFromStart = 0;

        const movable = RuleEngine.getMovablePieces(gameState);

        // Verify that blockade pieces are NOT movable with 6
        const blockadePieceIndices = [0, 1];
        const blockadeMovable = movable.filter(m => blockadePieceIndices.includes(m.index));
        expect(blockadeMovable.length).toBe(0);

        // Verify that piece 2 is movable (fallback)
        const piece2Movable = movable.find(m => m.index === 2);
        expect(piece2Movable).toBeDefined();
    });

    it('should allow moving other pieces when mandatory nest exit is impossible', () => {
        // Red Start Position is 21.
        gameState.dice = [5, 2];
        gameState.currentTurn = 'red';
        gameState.consecutiveDoubles = 0;
        gameState.blockadeBreakRequired = false;
        gameState.piecesExitedCount = 0;

        // Red piece 0 and 1 are already at start position 21
        gameState.players[0].pieces[0].position = 21;
        gameState.players[0].pieces[0].status = 'active';
        gameState.players[0].pieces[0].distanceFromStart = 0;
        gameState.players[0].pieces[1].position = 21;
        gameState.players[0].pieces[1].status = 'active';
        gameState.players[0].pieces[1].distanceFromStart = 0;

        gameState.players[0].pieces[2].position = 30; // Another active piece
        gameState.players[0].pieces[2].status = 'active';
        gameState.players[0].pieces[2].distanceFromStart = 9;

        gameState.players[0].pieces[3].status = 'nest'; // This one wants to exit

        // Nest exit should be mandatory (has 5) but is blocked by self at 21
        const movable = RuleEngine.getMovablePieces(gameState);

        // Verify piece 3 cannot move
        const piece3Movable = movable.find(m => m.index === 3);
        expect(piece3Movable).toBeUndefined();

        // Verify piece 2 can move (fallback)
        const piece2Movable = movable.find(m => m.index === 2);
        expect(piece2Movable).toBeDefined();
    });
});
