import { RuleEngine } from '../../rules/RuleEngine';
import type { GameState } from '../../types';

describe('RuleEngine Integration Tests', () => {
    let gameState: GameState;

    beforeEach(() => {
        // Create realistic game state
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
                        { id: 'red-0', position: -1, status: 'nest', distanceFromStart: 0, color: 'red', isSafe: false },
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
                        { id: 'blue-0', position: 15, status: 'active', distanceFromStart: 15, color: 'blue', isSafe: false },
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

    afterEach(() => {
        // Clear cache after each test
        RuleEngine.clearCache();
    });

    describe('Cache Performance', () => {
        it('should cache validation results', () => {
            // First validation
            const result1 = RuleEngine.validateMove(gameState, 1, 3);

            // Second validation (should hit cache)
            const result2 = RuleEngine.validateMove(gameState, 1, 3);

            expect(result1).toEqual(result2);

            const stats = RuleEngine.getCacheStats();
            expect(stats.hits).toBeGreaterThan(0);
        });

        it('should invalidate cache on state change', () => {
            RuleEngine.validateMove(gameState, 1, 3);

            // Change state
            const newState = { ...gameState, totalTurns: 2 };
            RuleEngine.validateMove(newState, 1, 3);

            const stats = RuleEngine.getCacheStats();
            expect(stats.misses).toBeGreaterThan(0);
        });

        it('should clear cache manually', () => {
            RuleEngine.validateMove(gameState, 1, 3);

            RuleEngine.clearCache();

            const stats = RuleEngine.getCacheStats();
            expect(stats.size).toBe(0);
            expect(stats.hits).toBe(0);
        });
    });

    describe('getMovablePieces', () => {
        it('should return all movable pieces', () => {
            const movable = RuleEngine.getMovablePieces(gameState);

            expect(movable.length).toBeGreaterThan(0);
            movable.forEach(mp => {
                expect(mp.index).toBeGreaterThanOrEqual(0);
                expect(mp.index).toBeLessThan(4);
                expect(mp.validDice.length).toBeGreaterThan(0);
            });
        });

        it('should return empty array when no dice rolled', () => {
            gameState.diceRolled = false;
            gameState.dice = [];

            const movable = RuleEngine.getMovablePieces(gameState);

            expect(movable).toEqual([]);
        });

        it('should handle mandatory nest exit', () => {
            gameState.dice = [5, 2];
            gameState.piecesExitedCount = 0;

            const movable = RuleEngine.getMovablePieces(gameState);

            // Should prioritize nest pieces
            const nestPieces = movable.filter(mp =>
                gameState.players[0].pieces[mp.index].status === 'nest'
            );

            expect(nestPieces.length).toBeGreaterThan(0);
        });

        it('should handle blockade break requirement', () => {
            // Create blockade
            gameState.players[0].pieces[1].position = 10;
            gameState.players[0].pieces[2].position = 10;
            gameState.consecutiveDoubles = 1;
            gameState.blockadeBreakRequired = true;

            const movable = RuleEngine.getMovablePieces(gameState);

            // Should only return blockade pieces
            movable.forEach(mp => {
                const piece = gameState.players[0].pieces[mp.index];
                expect(piece.position).toBe(10);
            });
        });
    });

    describe('Nest Exit Rules', () => {
        it('should allow nest exit with 5 at game start (clean board)', () => {
            // Simulate game start: all pieces in nest, empty board
            gameState.dice = [5, 3];
            gameState.diceRolled = true;
            gameState.piecesExitedCount = 0;

            // All pieces should be in nest
            gameState.players[0].pieces.forEach(piece => {
                piece.status = 'nest';
                piece.position = -1;
            });

            // Try to exit first piece with the 5
            const result = RuleEngine.validateMove(gameState, 0, 5);

            expect(result.valid).toBe(true);
            // validateMove returns minimal result, full details come from DestinationValidator
        });

        it('should allow nest exit with 5', () => {
            const result = RuleEngine.validateMove(gameState, 0, 5);

            expect(result.valid).toBe(true);
        });

        it('should allow nest exit with sum of 5', () => {
            gameState.dice = [2, 3];

            const result = RuleEngine.validateMove(gameState, 0, 5);

            expect(result.valid).toBe(true);
        });

        it('should enforce one exit per turn', () => {
            gameState.piecesExitedCount = 1;

            const result = RuleEngine.validateMove(gameState, 3, 5);

            expect(result.valid).toBe(false);
            expect(result.reason).toContain('sacar');
        });

        it('should not allow two nest exits in same turn', () => {
            // Setup: all pieces in nest, have a 5
            gameState.dice = [5, 2];
            gameState.piecesExitedCount = 0;
            gameState.players[0].pieces.forEach(piece => {
                piece.status = 'nest';
                piece.position = -1;
            });

            // First exit should work
            const result1 = RuleEngine.validateMove(gameState, 0, 5);
            expect(result1.valid).toBe(true);

            // Simulate that we already exited one piece this turn
            gameState.piecesExitedCount = 1;

            // Clear cache to force re-validation
            RuleEngine.clearCache();

            // Second exit in same turn should fail
            const result2 = RuleEngine.validateMove(gameState, 1, 5);
            expect(result2.valid).toBe(false);
            expect(result2.reason).toContain('sacar');
        });
    });

    describe('Blockade Rules', () => {
        it('should require blockade break with doubles', () => {
            // Create blockade at position 15
            gameState.players[0].pieces[0].position = 15;
            gameState.players[0].pieces[0].status = 'active';
            gameState.players[0].pieces[3].position = 15;
            gameState.players[0].pieces[3].status = 'active';
            gameState.consecutiveDoubles = 1;
            gameState.dice = [4, 4];
            gameState.blockadeBreakRequired = true;

            // Try to move non-blockade piece (piece 1 at position 10)
            const result = RuleEngine.validateMove(gameState, 1, 4);

            expect(result.valid).toBe(false);
            expect(result.reason).toContain('bloqueo');
        });

        it('should allow blockade break', () => {
            // Create blockade
            gameState.players[0].pieces[1].position = 10;
            gameState.players[0].pieces[2].position = 10;
            gameState.consecutiveDoubles = 1;
            gameState.dice = [4, 4];

            // Move blockade piece
            const result = RuleEngine.validateMove(gameState, 1, 4);

            expect(result.valid).toBe(true);
        });
    });

    describe('Performance Benchmarks', () => {
        it('should validate 1000 moves in under 100ms', () => {
            const startTime = Date.now();

            for (let i = 0; i < 1000; i++) {
                RuleEngine.validateMove(gameState, i % 4, (i % 6) + 1);
            }

            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(100);
        });

        it('should get movable pieces 1000 times in under 50ms', () => {
            const startTime = Date.now();

            for (let i = 0; i < 1000; i++) {
                RuleEngine.getMovablePieces(gameState);
            }

            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(50);
        });

        it('should achieve >90% cache hit rate on repeated validations', () => {
            // Warm up cache
            for (let i = 0; i < 10; i++) {
                RuleEngine.validateMove(gameState, 1, 3);
            }

            RuleEngine.clearCache();

            // Test cache efficiency
            for (let i = 0; i < 100; i++) {
                RuleEngine.validateMove(gameState, 1, 3);
            }

            const stats = RuleEngine.getCacheStats();
            const hitRate = stats.hits / (stats.hits + stats.misses);

            expect(hitRate).toBeGreaterThan(0.9);
        });
    });
});
