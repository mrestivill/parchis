import { ValidationCache } from '../../rules/cache/ValidationCache';
import type { MoveResult } from '../../types';

describe('ValidationCache', () => {
    let cache: ValidationCache;

    beforeEach(() => {
        cache = new ValidationCache();
    });

    describe('Basic Operations', () => {
        it('should store and retrieve validation results', () => {
            const result: MoveResult = { valid: true };

            cache.set('piece-1', 5, result);
            const retrieved = cache.get('piece-1', 5);

            expect(retrieved).toEqual(result);
        });

        it('should return null for non-existent entries', () => {
            const result = cache.get('piece-1', 5);
            expect(result).toBeNull();
        });

        it('should clear all entries', () => {
            cache.set('piece-1', 5, { valid: true });
            cache.set('piece-2', 3, { valid: false, reason: 'Test' });

            cache.clear();

            expect(cache.get('piece-1', 5)).toBeNull();
            expect(cache.get('piece-2', 3)).toBeNull();
        });
    });

    describe('Context Management', () => {
        it('should invalidate cache when turn changes', () => {
            cache.updateContext('turn-1', 'hash-1');
            cache.set('piece-1', 5, { valid: true });

            // Change turn
            cache.updateContext('turn-2', 'hash-1');

            expect(cache.get('piece-1', 5)).toBeNull();
        });

        it('should invalidate cache when state hash changes', () => {
            cache.updateContext('turn-1', 'hash-1');
            cache.set('piece-1', 5, { valid: true });

            // Change state
            cache.updateContext('turn-1', 'hash-2');

            expect(cache.get('piece-1', 5)).toBeNull();
        });

        it('should preserve cache when context unchanged', () => {
            cache.updateContext('turn-1', 'hash-1');
            cache.set('piece-1', 5, { valid: true });

            // Same context
            cache.updateContext('turn-1', 'hash-1');

            expect(cache.get('piece-1', 5)).toEqual({ valid: true });
        });
    });

    describe('Statistics', () => {
        it('should track hits and misses', () => {
            cache.set('piece-1', 5, { valid: true });

            // Hit
            cache.get('piece-1', 5);

            // Miss
            cache.get('piece-2', 3);

            const stats = cache.getStats();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(1);
            expect(stats.size).toBe(1);
        });

        it('should calculate hit rate correctly', () => {
            cache.set('piece-1', 5, { valid: true });

            // 2 hits
            cache.get('piece-1', 5);
            cache.get('piece-1', 5);

            // 1 miss
            cache.get('piece-2', 3);

            const stats = cache.getStats();
            expect(stats.hitRate).toBeCloseTo(0.667, 2); // 2/3
        });

        it('should reset statistics on clear', () => {
            cache.set('piece-1', 5, { valid: true });
            cache.get('piece-1', 5);
            cache.get('piece-2', 3);

            cache.clear();

            const stats = cache.getStats();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
            expect(stats.size).toBe(0);
        });
    });

    describe('Performance', () => {
        it('should handle large number of entries', () => {
            const startTime = Date.now();

            // Add 1000 entries
            for (let i = 0; i < 1000; i++) {
                cache.set(`piece-${i}`, i % 6 + 1, { valid: i % 2 === 0 });
            }

            const addTime = Date.now() - startTime;
            expect(addTime).toBeLessThan(100); // Should be fast

            // Retrieve all
            const retrieveStart = Date.now();
            for (let i = 0; i < 1000; i++) {
                cache.get(`piece-${i}`, i % 6 + 1);
            }

            const retrieveTime = Date.now() - retrieveStart;
            expect(retrieveTime).toBeLessThan(50); // Should be very fast
        });
    });
});
