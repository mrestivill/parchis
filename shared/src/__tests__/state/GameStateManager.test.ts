import { GameStateManager } from '../../state/GameStateManager';
import type { GameState, MoveResult } from '../../types';

describe('GameStateManager', () => {
    let initialState: GameState;

    beforeEach(() => {
        // Create minimal game state for testing
        initialState = {
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
                        { id: 'red-0', position: -1, status: 'nest', distanceFromStart: 0, color: 'red', isSafe: false },
                        { id: 'red-1', position: 10, status: 'active', distanceFromStart: 10, color: 'red', isSafe: false },
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
            dice: [3, 4],
            diceRolled: true,
            consecutiveDoubles: 0,
            totalTurns: 1,
            spectators: [],
            lastActionTimestamp: Date.now(),
            turnTimeLeft: 60,
            options: {
                turnTimeLimit: 60,
                allowSpectators: true
            }
        } as unknown as GameState;
    });

    describe('Immutability', () => {
        it('should not mutate original state on rollDice', () => {
            const originalDice = [...initialState.dice];
            const originalRolled = initialState.diceRolled;

            const newState = GameStateManager.rollDice(initialState, 5, 6);

            expect(initialState.dice).toEqual(originalDice);
            expect(initialState.diceRolled).toBe(originalRolled);
            expect(newState).not.toBe(initialState);
        });

        it('should not mutate original state on applyMove', () => {
            const moveResult: MoveResult = {
                valid: true,
                newPosition: 13,
                newDistanceFromStart: 13
            };

            const originalPosition = initialState.players[0].pieces[1].position;

            const newState = GameStateManager.applyMove(initialState, 1, moveResult);

            expect(initialState.players[0].pieces[1].position).toBe(originalPosition);
            expect(newState).not.toBe(initialState);
        });

        it('should not mutate original state on nextTurn', () => {
            const originalTurn = initialState.currentTurn;
            const originalTurns = initialState.totalTurns;

            const newState = GameStateManager.nextTurn(initialState);

            expect(initialState.currentTurn).toBe(originalTurn);
            expect(initialState.totalTurns).toBe(originalTurns);
            expect(newState).not.toBe(initialState);
        });
    });

    describe('rollDice', () => {
        it('should set dice values correctly', () => {
            const newState = GameStateManager.rollDice(initialState, 5, 6);

            expect(newState.dice).toEqual([5, 6]);
            expect(newState.diceRolled).toBe(true);
        });

        it('should detect doubles', () => {
            const newState = GameStateManager.rollDice(initialState, 4, 4);

            expect(newState.consecutiveDoubles).toBe(1);
        });

        it('should reset consecutive doubles on non-doubles', () => {
            const stateWithDoubles = { ...initialState, consecutiveDoubles: 2 };
            const newState = GameStateManager.rollDice(stateWithDoubles, 3, 5);

            expect(newState.consecutiveDoubles).toBe(0);
        });

        it('should reset piecesExitedCount', () => {
            const stateWithExits = { ...initialState, piecesExitedCount: 2 };
            const newState = GameStateManager.rollDice(stateWithExits, 5, 6);

            expect(newState.piecesExitedCount).toBe(0);
        });
    });

    describe('applyMove', () => {
        it('should update piece position', () => {
            const moveResult: MoveResult = {
                valid: true,
                newPosition: 15,
                newDistanceFromStart: 15
            };

            const newState = GameStateManager.applyMove(initialState, 1, moveResult);

            expect(newState.players[0].pieces[1].position).toBe(15);
            expect(newState.players[0].pieces[1].distanceFromStart).toBe(15);
        });

        it('should track last moved piece', () => {
            const moveResult: MoveResult = {
                valid: true,
                newPosition: 15,
                newDistanceFromStart: 15
            };

            const newState = GameStateManager.applyMove(initialState, 1, moveResult);

            expect(newState.lastMovedPieceId).toBe('red-1');
        });

        it('should handle nest exit', () => {
            const moveResult: MoveResult = {
                valid: true,
                newPosition: 0,
                newDistanceFromStart: 0
            };

            const newState = GameStateManager.applyMove(initialState, 0, moveResult);

            expect(newState.players[0].pieces[0].status).toBe('active');
            expect(newState.piecesExitedCount).toBe(1);
        });

        it('should handle goal entry', () => {
            const moveResult: MoveResult = {
                valid: true,
                enteredGoal: true
            };

            const newState = GameStateManager.applyMove(initialState, 1, moveResult);

            expect(newState.players[0].pieces[1].status).toBe('goal');
        });

        it('should handle captures', () => {
            const moveResult: MoveResult = {
                valid: true,
                newPosition: 15,
                capturedPieceId: 'blue-0'
            };

            // Set blue-0 to active for capture
            initialState.players[1].pieces[0].status = 'active';
            initialState.players[1].pieces[0].position = 15;

            const newState = GameStateManager.applyMove(initialState, 1, moveResult);

            expect(newState.players[1].pieces[0].status).toBe('nest');
            expect(newState.players[1].pieces[0].position).toBe(-1);
        });

        it('should not apply invalid moves', () => {
            const moveResult: MoveResult = {
                valid: false,
                reason: 'Invalid move'
            };

            const newState = GameStateManager.applyMove(initialState, 1, moveResult);

            expect(newState).toBe(initialState); // Should return same reference
        });
    });

    describe('nextTurn', () => {
        it('should advance to next player', () => {
            const newState = GameStateManager.nextTurn(initialState);

            expect(newState.currentTurn).toBe('blue');
        });

        it('should wrap around to first player', () => {
            const stateAtLastPlayer = { ...initialState, currentTurn: 'blue' as any };
            const newState = GameStateManager.nextTurn(stateAtLastPlayer);

            expect(newState.currentTurn).toBe('red');
        });

        it('should increment total turns', () => {
            const newState = GameStateManager.nextTurn(initialState);

            expect(newState.totalTurns).toBe(2);
        });

        it('should reset turn state', () => {
            const dirtyState = {
                ...initialState,
                diceRolled: true,
                dice: [5, 6],
                consecutiveDoubles: 2,
                lastMovedPieceId: 'red-1',
                blockadeBreakRequired: true,
                forbiddenMoves: [{ pieceId: 'red-0', forbiddenPosition: 10 }],
                piecesExitedCount: 1
            };

            const newState = GameStateManager.nextTurn(dirtyState);

            expect(newState.diceRolled).toBe(false);
            expect(newState.dice).toEqual([]);
            expect(newState.consecutiveDoubles).toBe(0); // Reset on turn change to prevent carrying over to next player
            expect(newState.lastMovedPieceId).toBeUndefined();
            expect(newState.blockadeBreakRequired).toBe(false);
            expect(newState.forbiddenMoves).toEqual([]);
            expect(newState.piecesExitedCount).toBe(0);
        });
    });

    describe('Bonus Management', () => {
        it('should grant bonus', () => {
            const newState = GameStateManager.grantBonus(initialState, 'player-1', 20);

            expect(newState.pendingBonus).toEqual({
                playerId: 'player-1',
                amount: 20
            });
        });

        it('should clear bonus', () => {
            const stateWithBonus = {
                ...initialState,
                pendingBonus: { playerId: 'player-1', amount: 20 }
            };

            const newState = GameStateManager.clearBonus(stateWithBonus);

            expect(newState.pendingBonus).toBeUndefined();
        });
    });

    describe('Dice Management', () => {
        it('should mark dice as used', () => {
            const newState = GameStateManager.useDice(initialState, [0]);

            expect(newState.dice[0]).toBe(0);
            expect(newState.dice[1]).toBe(4); // Unchanged
        });

        it('should mark multiple dice as used', () => {
            const newState = GameStateManager.useDice(initialState, [0, 1]);

            expect(newState.dice[0]).toBe(0);
            expect(newState.dice[1]).toBe(0);
        });
    });
});
