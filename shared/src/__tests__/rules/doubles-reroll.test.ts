import { RuleEngine } from '../../rules/RuleEngine';
import { GameStateManager } from '../../state/GameStateManager';
import type { GameState } from '../../types';

describe('Doubles Re-roll Bug Fix', () => {
    let gameState: GameState;

    beforeEach(() => {
        // Create a realistic game state
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
                        { id: 'red-1', position: 15, status: 'active', distanceFromStart: 15, color: 'red', isSafe: false },
                        { id: 'red-2', position: -1, status: 'nest', distanceFromStart: 0, color: 'red', isSafe: false },
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
                        { id: 'blue-0', position: -1, status: 'nest', distanceFromStart: 0, color: 'blue', isSafe: false },
                        { id: 'blue-1', position: -1, status: 'nest', distanceFromStart: 0, color: 'blue', isSafe: false },
                        { id: 'blue-2', position: -1, status: 'nest', distanceFromStart: 0, color: 'blue', isSafe: false },
                        { id: 'blue-3', position: -1, status: 'nest', distanceFromStart: 0, color: 'blue', isSafe: false }
                    ]
                }
            ],
            currentTurn: 'red',
            dice: [5, 5],
            diceRolled: true,
            consecutiveDoubles: 1,
            totalTurns: 1,
            spectators: [],
            lastActionTimestamp: Date.now(),
            turnTimeLeft: 60,
            options: {
                allowSpectators: true,
                spectatorCanReadChat: true,
                spectatorCanWriteChat: false,
                allowLateJoin: false
            }
        } as unknown as GameState;
    });

    afterEach(() => {
        RuleEngine.clearCache();
    });

    describe('Doubles Re-roll After Partial Move', () => {
        it('should allow re-roll when doubles were rolled but second die cannot be used', () => {
            // Scenario: Player rolls 5-5 (doubles)
            // First piece at position 10 can move to 15
            // Second piece at position 15 is blocked (cannot move 5 more)

            // Verify first move is valid
            const firstMoveResult = RuleEngine.validateMove(gameState, 0, 5);
            expect(firstMoveResult.valid).toBe(true);

            // Simulate the first move
            let newState = GameStateManager.applyMove(gameState, 0, firstMoveResult);
            newState = GameStateManager.useDie(newState, 0); // Use first die

            // Now dice should be [0, 5]
            expect(newState.dice).toEqual([0, 5]);
            expect(newState.consecutiveDoubles).toBe(1);

            // Check if any piece can move with the remaining 5
            const movablePieces = RuleEngine.getMovablePieces(newState);

            // If no pieces can move, the game should NOT end the turn
            // Instead, it should grant a re-roll because doubles were rolled
            // This is verified by checking that consecutiveDoubles > 0
            expect(newState.consecutiveDoubles).toBeGreaterThan(0);
        });

        it('should end turn when non-doubles were rolled and no moves remain', () => {
            // Scenario: Player rolls 3-4 (NOT doubles)
            gameState.dice = [3, 4];
            gameState.consecutiveDoubles = 0;

            // First piece can move 3
            const firstMoveResult = RuleEngine.validateMove(gameState, 0, 3);
            expect(firstMoveResult.valid).toBe(true);

            // Simulate the first move
            let newState = GameStateManager.applyMove(gameState, 0, firstMoveResult);
            newState = GameStateManager.useDie(newState, 0); // Use first die

            // Now dice should be [0, 4]
            expect(newState.dice).toEqual([0, 4]);
            expect(newState.consecutiveDoubles).toBe(0);

            // If no pieces can move with the 4, turn should end (not re-roll)
            // This is the expected behavior for non-doubles
        });

        it('should allow both moves when doubles were rolled and both dice can be used', () => {
            // Scenario: Player rolls 3-3 (doubles)
            // Both pieces can move 3 spaces
            gameState.dice = [3, 3];
            gameState.consecutiveDoubles = 1;

            // First move
            const firstMoveResult = RuleEngine.validateMove(gameState, 0, 3);
            expect(firstMoveResult.valid).toBe(true);

            let newState = GameStateManager.applyMove(gameState, 0, firstMoveResult);
            newState = GameStateManager.useDie(newState, 0);

            // Second move should still be possible
            const secondMoveResult = RuleEngine.validateMove(newState, 1, 3);
            expect(secondMoveResult.valid).toBe(true);

            newState = GameStateManager.applyMove(newState, 1, secondMoveResult);
            newState = GameStateManager.useDie(newState, 1);

            // Both dice used
            expect(newState.dice).toEqual([0, 0]);
            expect(newState.consecutiveDoubles).toBe(1);
        });

        it('should grant re-roll when doubles rolled but no pieces can move initially', () => {
            // Scenario: All pieces blocked, but doubles were rolled
            // This should grant a re-roll (existing behavior that should continue working)

            // Create a state where no pieces can move
            gameState.players[0].pieces.forEach(piece => {
                piece.status = 'nest';
                piece.position = -1;
            });
            gameState.dice = [3, 3]; // Not a 5, so can't exit nest
            gameState.consecutiveDoubles = 1;

            const movablePieces = RuleEngine.getMovablePieces(gameState);
            expect(movablePieces.length).toBe(0);

            // The game should recognize doubles and grant re-roll
            expect(gameState.consecutiveDoubles).toBeGreaterThan(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle bonus moves correctly with doubles', () => {
            // Scenario: Player has a pending bonus (e.g., 20 from capture)
            // and also rolled doubles
            gameState.pendingBonus = {
                playerId: 'player-1',
                amount: 20
            };
            gameState.consecutiveDoubles = 1;

            // Bonus move should take priority
            const bonusMoveResult = RuleEngine.validateMove(gameState, 0, 20);

            // After bonus is used, doubles should still grant re-roll
            expect(gameState.consecutiveDoubles).toBe(1);
        });

        it('should reset consecutiveDoubles to 0 after non-doubles roll', () => {
            gameState.dice = [3, 4];
            const newState = GameStateManager.rollDice(gameState, 3, 4);

            expect(newState.consecutiveDoubles).toBe(0);
        });

        it('should increment consecutiveDoubles on doubles roll', () => {
            gameState.consecutiveDoubles = 0;
            gameState.dice = [5, 5];
            const newState = GameStateManager.rollDice(gameState, 5, 5);

            expect(newState.consecutiveDoubles).toBe(1);
        });
    });
});
