import { GameStateManager } from '../../state/GameStateManager';
import type { GameState } from '../../types';

describe('Consecutive Doubles Counter Reset', () => {
    let gameState: GameState;

    beforeEach(() => {
        gameState = {
            roomId: 'test-room',
            status: 'playing',
            players: [
                {
                    id: 'player-1',
                    name: 'Player A',
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
                    name: 'Player B',
                    color: 'blue',
                    isConnected: true,
                    hasLeft: false,
                    pieces: [
                        { id: 'blue-0', position: 20, status: 'active', distanceFromStart: 20, color: 'blue', isSafe: false },
                        { id: 'blue-1', position: -1, status: 'nest', distanceFromStart: 0, color: 'blue', isSafe: false },
                        { id: 'blue-2', position: -1, status: 'nest', distanceFromStart: 0, color: 'blue', isSafe: false },
                        { id: 'blue-3', position: -1, status: 'nest', distanceFromStart: 0, color: 'blue', isSafe: false }
                    ]
                }
            ],
            currentTurn: 'red',
            dice: [5, 5],
            diceRolled: true,
            consecutiveDoubles: 3, // Player A has rolled 3 consecutive doubles
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

    describe('Bug: consecutiveDoubles carries over to next player', () => {
        it('should reset consecutiveDoubles to 0 when turn changes to next player', () => {
            // Player A has rolled 3 consecutive doubles
            expect(gameState.consecutiveDoubles).toBe(3);
            expect(gameState.currentTurn).toBe('red');

            // Turn changes to Player B
            const newState = GameStateManager.nextTurn(gameState);

            // Verify counter is reset
            expect(newState.consecutiveDoubles).toBe(0);
            expect(newState.currentTurn).toBe('blue');
        });

        it('should allow Player B to roll doubles normally after Player A had 3 doubles', () => {
            // Player A had 3 consecutive doubles
            gameState.consecutiveDoubles = 3;

            // Turn changes to Player B
            let newState = GameStateManager.nextTurn(gameState);
            expect(newState.consecutiveDoubles).toBe(0);
            expect(newState.currentTurn).toBe('blue');

            // Player B rolls doubles (4-4)
            newState = GameStateManager.rollDice(newState, 4, 4);

            // Player B should have consecutiveDoubles = 1 (not 4!)
            expect(newState.consecutiveDoubles).toBe(1);
        });

        it('should preserve consecutiveDoubles when same player re-rolls', () => {
            // Player A rolls doubles (first time)
            gameState.consecutiveDoubles = 0;
            let newState = GameStateManager.rollDice(gameState, 5, 5);
            expect(newState.consecutiveDoubles).toBe(1);

            // Player A re-rolls (still their turn, no nextTurn called)
            // Simulate using dice and preparing for re-roll
            newState.dice = [];
            newState.diceRolled = false;

            // Player A rolls doubles again
            newState = GameStateManager.rollDice(newState, 6, 6);
            expect(newState.consecutiveDoubles).toBe(2);

            // Counter should be preserved because it's the same player
            expect(newState.currentTurn).toBe('red');
        });
    });

    describe('Edge Cases', () => {
        it('should reset consecutiveDoubles even if player had only 1 double', () => {
            gameState.consecutiveDoubles = 1;
            const newState = GameStateManager.nextTurn(gameState);
            expect(newState.consecutiveDoubles).toBe(0);
        });

        it('should reset consecutiveDoubles even if player had 2 doubles', () => {
            gameState.consecutiveDoubles = 2;
            const newState = GameStateManager.nextTurn(gameState);
            expect(newState.consecutiveDoubles).toBe(0);
        });

        it('should handle turn change with 0 consecutiveDoubles', () => {
            gameState.consecutiveDoubles = 0;
            const newState = GameStateManager.nextTurn(gameState);
            expect(newState.consecutiveDoubles).toBe(0);
        });

        it('should increment consecutiveDoubles correctly for non-doubles', () => {
            gameState.consecutiveDoubles = 0;
            const newState = GameStateManager.rollDice(gameState, 3, 4);
            expect(newState.consecutiveDoubles).toBe(0); // Should remain 0 for non-doubles
        });

        it('should increment consecutiveDoubles correctly for doubles', () => {
            gameState.consecutiveDoubles = 1;
            const newState = GameStateManager.rollDice(gameState, 5, 5);
            expect(newState.consecutiveDoubles).toBe(2);
        });
    });
});
